declare global {
  interface Window {
    __APP_CONFIG__?: {
      apiUrl?: string;
    };
  }
  const window: Window & typeof globalThis;
}

export {};
