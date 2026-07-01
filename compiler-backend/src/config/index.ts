import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const getNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const config = {
  port: getNumber(process.env.PORT, 4000),
  apiBasePath: process.env.API_BASE_PATH ?? '/api/compiler',
  timeoutSeconds: getNumber(process.env.DEFAULT_TIMEOUT_SECONDS, 10),
  memoryLimitBytes: getNumber(process.env.MEMORY_LIMIT_BYTES, 268435456),
  cpuShares: getNumber(process.env.CPU_SHARES, 256),
  pythonImage: process.env.PYTHON_IMAGE ?? 'python:3.12-slim',
  nodeImage: process.env.NODE_IMAGE ?? 'node:20-slim',
  openJdkImage: process.env.OPENJDK_IMAGE ?? 'eclipse-temurin:21-jdk',
  gccImage: process.env.GCC_IMAGE ?? 'gcc:13',
  serviceKey: process.env.COMPILER_SERVICE_KEY ?? 'safeexam-internal-compiler-key',
};
