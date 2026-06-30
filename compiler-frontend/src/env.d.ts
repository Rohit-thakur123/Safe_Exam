/// <reference types="vite/client" />

declare global {
  interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string;
    readonly VITE_DEFAULT_LANGUAGE: string;
    readonly VITE_EDITOR_THEME: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export {};
