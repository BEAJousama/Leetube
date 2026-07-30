/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_APP_URL: string;
  readonly VITE_GOOGLE_OAUTH_URL?: string;
  readonly VITE_FORTYTWO_OAUTH_URL?: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_HOST: string;
  readonly VITE_PORT: string;
  readonly VITE_REFRESH_TOKEN_URL?: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
