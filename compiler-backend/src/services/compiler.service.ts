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
  await fs.chmod(tmpDir, 0o777);
  await fs.chmod(sourcePath, 0o666);
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

const parseDockerLogs = (logs: Buffer): { stdout: string; stderr: string } => {
  if (logs.length < 8) return { stdout: logs.toString('utf8'), stderr: '' };
  let stdout = '';
  let stderr = '';
  let index = 0;
  while (index + 8 <= logs.length) {
    const stream = logs[index];
    const size = logs.readUInt32BE(index + 4);
    index += 8;
    if (index + size > logs.length) break;
    const chunk = logs.slice(index, index + size).toString('utf8');
    if (stream === 2) stderr += chunk;
    else stdout += chunk;
    index += size;
  }
  return stdout || stderr ? { stdout, stderr } : { stdout: logs.toString('utf8'), stderr: '' };
};

const runContainerCommand = async (options: Docker.ContainerCreateOptions, timeoutMs: number) => {
  const container = await docker.createContainer(options);
  const startTime = Date.now();
  let maxMemoryUsageBytes = 0;
  let statsStream: NodeJS.ReadableStream | undefined;

  try {
    await container.start();
    statsStream = await container.stats({ stream: true }).catch(() => undefined);
    statsStream?.on('data', (chunk: Buffer) => {
      try {
        const stats = JSON.parse(chunk.toString('utf8'));
        const usage = Number(stats?.memory_stats?.usage ?? 0);
        const cache = Number(stats?.memory_stats?.stats?.cache ?? 0);
        maxMemoryUsageBytes = Math.max(maxMemoryUsageBytes, Math.max(0, usage - cache));
      } catch {
        // Docker may split a stats frame; the next complete frame will be sampled.
      }
    });
    const waitResult = await waitForContainer(container, timeoutMs);
    const inspectResult = await container.inspect();
    const logs = (await container.logs({ stdout: true, stderr: true, follow: false })) as Buffer;
    const parsedLogs = Buffer.isBuffer(logs)
      ? parseDockerLogs(logs)
      : { stdout: String(logs), stderr: '' };

    return {
      exitCode: waitResult.StatusCode,
      ...parsedLogs,
      finishedAt: inspectResult.State.FinishedAt,
      elapsedMs: Date.now() - startTime,
      memoryUsageBytes: maxMemoryUsageBytes,
      timedOut: waitResult.StatusCode === 137 && Date.now() - startTime >= timeoutMs,
    };
  } finally {
    if (statsStream && 'destroy' in statsStream) {
      (statsStream as NodeJS.ReadableStream & { destroy: () => void }).destroy();
    }
    await container.remove({ force: true, v: true }).catch(() => undefined);
  }
};

export async function executeSubmission(request: ExecutionRequest): Promise<ExecutionResult> {
  const { language, code, stdin } = request;
  const timeoutMs = Math.min(request.timeoutSeconds ?? config.timeoutSeconds, 30) * 1000;
  const memoryLimitBytes = Math.min(request.memoryLimitBytes ?? config.memoryLimitBytes, 536870912);

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
          Memory: memoryLimitBytes,
          CpuShares: config.cpuShares,
          NanoCpus: 500000000,
          NetworkMode: 'none',
          PidsLimit: 64,
          ReadonlyRootfs: true,
          CapDrop: ['ALL'],
          SecurityOpt: ['no-new-privileges'],
          Tmpfs: { '/tmp': 'rw,noexec,nosuid,size=67108864' },
        },
        User: '65534:65534',
        WorkingDir: '/workspace',
      };

      const compileResult = await runContainerCommand(compileOptions, timeoutMs);
      if (compileResult.exitCode !== 0) {
        return {
          stdout: '',
          stderr: compileResult.stderr || compileResult.stdout,
          compileError: compileResult.stderr || compileResult.stdout,
          exitCode: compileResult.exitCode,
          executionTimeMs: 0,
          memoryUsageBytes: compileResult.memoryUsageBytes,
          timedOut: compileResult.timedOut,
        };
      }
    }

    const runOptions: Docker.ContainerCreateOptions = {
      Image: imageConfig.image,
      Cmd: ['sh', '-lc', `${imageConfig.command.join(' ')} < /workspace/stdin.txt`],
      HostConfig: {
        AutoRemove: false,
        Binds: [`${getHostWorkspacePath(workspacePath)}:/workspace:ro`],
        Memory: memoryLimitBytes,
        CpuShares: config.cpuShares,
        NanoCpus: 500000000,
        NetworkMode: 'none',
        PidsLimit: 64,
        ReadonlyRootfs: true,
        CapDrop: ['ALL'],
        SecurityOpt: ['no-new-privileges'],
        Tmpfs: { '/tmp': 'rw,noexec,nosuid,size=67108864' },
      },
      User: '65534:65534',
      WorkingDir: '/workspace',
    };

    await fs.writeFile(path.join(workspacePath, 'stdin.txt'), stdin ?? '', 'utf8');

    const runResult = await runContainerCommand(runOptions, timeoutMs);
    return {
      stdout: runResult.stdout,
      stderr: runResult.stderr,
      compileError: undefined,
      exitCode: runResult.exitCode,
      executionTimeMs: runResult.elapsedMs,
      memoryUsageBytes: runResult.memoryUsageBytes,
      timedOut: runResult.timedOut,
    };
  } finally {
    await cleanWorkspace(workspacePath);
  }
}
