declare global {
  interface Window {
    uetq?: {
      push: (...args: any[]) => unknown;
    };
  }
}

export {};
