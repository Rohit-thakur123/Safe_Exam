# Compiler Backend

This service provides an isolated code execution API for the compiler module.

## Features

- Executes Python, JavaScript, Java, C, and C++ code
- Runs each submission inside a Docker container
- Enforces CPU, memory, and timeout limits
- Returns stdout, stderr, compile errors, exit code, and execution metadata

## Setup

1. Copy `.env.example` to `.env`
2. Configure Docker images and limits as needed
3. Install dependencies:

```bash
cd compiler-backend
npm install
```

## Run

```bash
npm run dev
```

## API

POST `/api/compiler/run`

Request body:

```json
{
  "language": "python",
  "code": "print(\"hello\")",
  "stdin": ""
}
```

Response:

```json
{
  "status": "success",
  "data": {
    "stdout": "hello\n",
    "stderr": "",
    "compileError": null,
    "exitCode": 0,
    "executionTimeMs": 100,
    "memoryUsageBytes": 268435456
  }
}
```
