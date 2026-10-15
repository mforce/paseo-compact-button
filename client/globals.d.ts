// Host globals available in every Paseo client runtime (browser, Electron, iOS,
// Android). The DOM lib is deliberately absent from tsconfig; declare only what
// client code uses.
interface AbortSignal {
  readonly aborted: boolean;
}

interface AbortController {
  readonly signal: AbortSignal;
  abort(): void;
}

declare var AbortController: {
  new (): AbortController;
  prototype: AbortController;
};

declare var console: {
  error(...data: unknown[]): void;
};
