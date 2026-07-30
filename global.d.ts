declare module "cloudflare:workers" {
  export const env: {
    DB?: D1Database;
    [key: string]: unknown;
  };
}

declare interface Fetcher {
  fetch(request: Request): Promise<Response>;
}

declare interface D1Database {
  prepare(query: string): unknown;
  run(...args: unknown[]): Promise<unknown>;
  all(...args: unknown[]): Promise<unknown>;
  get(...args: unknown[]): Promise<unknown>;
  [key: string]: unknown;
}
