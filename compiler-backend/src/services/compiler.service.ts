import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import Docker from 'dockerode';
import { config } from '../config/index.js';
import { ExecutionResult, ExecutionRequest, Language, LanguageConfig } from '../types/compiler.types.js';

const docker = new Docker();

const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT ?? '/workspaces';
const HOST_WORKSPACE_ROOT = process.env.HOST_WORKSPACE_ROOT ?? WORKSPACE_ROOT;
const normalizeBindPath = (hostPath: string) => hostPath.replace(/\\/g, '/');

const languageConfig: Record<Language, LanguageConfig> = {
  python: {
    image: config.pythonImage,
    fileName: 'Main.py',
    command: ['python', '/workspace/Main.py'],
    extension: '.py',
  },
  javascript: {
    image: config.nodeImage,
    fileName: 'Main.js',
    command: ['node', '/workspace/Main.js'],
    extension: '.js',
  },
  java: {
    image: config.openJdkImage,
    fileName: 'Main.java',
    compileCommand: ['javac', '/workspace/Main.java'],
    command: ['java', '-cp', '/workspace', 'Main'],
    extension: '.java',
  },
  c: {
    image: config.gccImage,
    fileName: 'main.c',
    compileCommand: ['gcc', '/workspace/main.c', '-o', '/workspace/main'],
    command: ['/workspace/main'],
    extension: '.c',
  },
  cpp: {
    image: config.gccImage,
    fileName: 'main.cpp',
    compileCommand: ['g++', '/workspace/main.cpp', '-o', '/workspace/main'],
    command: ['/workspace/main'],
    extension: '.cpp',
  },
};

const getHostWorkspacePath = (workspacePath: string) => {
  const relativePath = path.relative(WORKSPACE_ROOT, workspacePath);
  const hostPath = path.join(HOST_WORKSPACE_ROOT, relativePath);
  return normalizeBindPath(hostPath);
};

const createWorkspace = async (language: string, source: string) => {
  await fs.mkdir(WORKSPACE_ROOT, { recursive: true });
  const tmpDir = await fs.mkdtemp(path.join(WORKSPACE_ROOT, 'compiler-'));
  const configEntry = languageConfig[language as Language];
  if (!configEntry) {
    throw Object.assign(new Error('Unsupported language'), { status: 400 });
  }
  const sourcePath = path.join(tmpDir, configEntry.fileName);
  await fs.writeFile(sourcePath, source, { encoding: 'utf8' });
  return tmpDir;
};

const cleanWorkspace = async (workspacePath: string) => {
  await fs.rm(workspacePath, { recursive: true, force: true });
};

const waitForContainer = async (container: Docker.Container, timeoutMs: number) => {
  return new Promise<{ StatusCode: number }>((resolve, reject) => {
    let timedOut = false;
    const timer = setTimeout(async () => {
      timedOut = true;
      try {
        await container.kill();
      } catch {
        // ignore kill failure
      }
    }, timeoutMs);

    container.wait().then((result) => {
      clearTimeout(timer);
      resolve({ StatusCode: (result as any).StatusCode ?? 0 });
    }, (error) => {
      clearTimeout(timer);
      if (timedOut) {
        resolve({ StatusCode: 137 });
      } else {
        reject(error);
      }
    });
  });
};

const ensureImageExists = async (image: string) => {
  try {
    await docker.getImage(image).inspect();
    return;
  } catch {
    const stream = await docker.pull(image);
    await new Promise<void>((resolve, reject) => {
      docker.modem.followProgress(stream, (err: Error | null) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
};

const parseDockerLogs = (logs: Buffer): string => {
  if (logs.length < 8) return logs.toString('utf8');
  let output = '';
  let index = 0;
  while (index + 8 <= logs.length) {
    const size = logs.readUInt32BE(index + 4);
    index += 8;
    if (index + size > logs.length) break;
    output += logs.slice(index, index + size).toString('utf8');
    index += size;
  }
  return output || logs.toString('utf8');
};

const runContainerCommand = async (options: Docker.ContainerCreateOptions, timeoutMs: number) => {
  const container = await docker.createContainer(options);
  const startTime = Date.now();

  try {
    await container.start();
    const waitResult = await waitForContainer(container, timeoutMs);
    const inspectResult = await container.inspect();
    const logs = (await container.logs({ stdout: true, stderr: true, follow: false })) as Buffer;
    const output = Buffer.isBuffer(logs) ? parseDockerLogs(logs) : String(logs);

    return {
      exitCode: waitResult.StatusCode,
      output,
      finishedAt: inspectResult.State.FinishedAt,
      elapsedMs: Date.now() - startTime,
    };
  } finally {
    await container.remove({ force: true, v: true }).catch(() => undefined);
  }
};

export async function executeSubmission(request: ExecutionRequest): Promise<ExecutionResult> {
  const { language, code, stdin } = request;

  if (!languageConfig[language]) {
    throw Object.assign(new Error('Unsupported language'), { status: 400 });
  }

  const workspacePath = await createWorkspace(language, code);
  const imageConfig = languageConfig[language];

  try {
    await ensureImageExists(imageConfig.image);
    const unixWorkspacePath = normalizeBindPath(workspacePath);
    const hostWorkspaceBind = `${getHostWorkspacePath(workspacePath)}:/workspace`;

    if ('compileCommand' in imageConfig && imageConfig.compileCommand) {
      const compileOptions: Docker.ContainerCreateOptions = {
        Image: imageConfig.image,
        Cmd: imageConfig.compileCommand,
        HostConfig: {
          AutoRemove: false,
          Binds: [`${getHostWorkspacePath(workspacePath)}:/workspace:rw`],
          Memory: config.memoryLimitBytes,
          CpuShares: config.cpuShares,
          NetworkMode: 'none',
          PidsLimit: 64,
          ReadonlyRootfs: false,
        },
        WorkingDir: '/workspace',
      };

      const compileResult = await runContainerCommand(compileOptions, config.timeoutSeconds * 1000);
      if (compileResult.exitCode !== 0) {
        return {
          stdout: '',
          stderr: compileResult.output,
          compileError: compileResult.output,
          exitCode: compileResult.exitCode,
          executionTimeMs: 0,
          memoryUsageBytes: config.memoryLimitBytes,
        };
      }
    }

    const runOptions: Docker.ContainerCreateOptions = {
      Image: imageConfig.image,
      Cmd: ['sh', '-lc', `${imageConfig.command.join(' ')} < /workspace/stdin.txt`],
      HostConfig: {
        AutoRemove: false,
        Binds: [`${getHostWorkspacePath(workspacePath)}:/workspace:ro`],
        Memory: config.memoryLimitBytes,
        CpuShares: config.cpuShares,
        NetworkMode: 'none',
        PidsLimit: 64,
        ReadonlyRootfs: false,
      },
      WorkingDir: '/workspace',
    };

    await fs.writeFile(path.join(workspacePath, 'stdin.txt'), stdin ?? '', 'utf8');

    const runResult = await runContainerCommand(runOptions, config.timeoutSeconds * 1000);
    return {
      stdout: runResult.output,
      stderr: runResult.output,
      compileError: undefined,
      exitCode: runResult.exitCode,
      executionTimeMs: runResult.elapsedMs,
      memoryUsageBytes: config.memoryLimitBytes,
    };
  } finally {
    await cleanWorkspace(workspacePath);
  }
}
