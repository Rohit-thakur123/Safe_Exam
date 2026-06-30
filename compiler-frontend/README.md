# Compiler Frontend

A modern React + Vite frontend for the isolated compiler module.

## Features

- Monaco Editor integration
- Language selector for Python, JavaScript, Java, C, and C++
- Run and Clear controls
- Stdin and output console
- Dark theme
- Responsive layout
- Ctrl + Enter shortcut to execute code

## Setup

1. Copy `.env.example` to `.env`
2. Install dependencies:

```bash
cd compiler-frontend
npm install
```

## Run

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Environment

- `VITE_API_BASE_URL` - backend compiler API base URL
- `VITE_DEFAULT_LANGUAGE` - initial editor language
- `VITE_EDITOR_THEME` - Monaco theme
