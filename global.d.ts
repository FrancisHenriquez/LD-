/**
 * Superficie mínima de los bindings de Cloudflare usada durante el chequeo de
 * tipos local. El runtime inyecta las implementaciones reales; estos nombres
 * deben mantenerse alineados con `vite.config.ts` y `worker/index.ts`.
 */
declare module "cloudflare:workers" {
  export const env: {
    DB?: D1Database;
    [key: string]: unknown;
  };
}

declare interface Fetcher {
  fetch(request: Request): Promise<Response>;
}

// Drizzle recibe el cliente D1 real en producción; aquí solo se describe el
// contrato flexible que necesitan el Worker y los módulos compartidos.
declare interface D1Database {
  prepare(query: string): unknown;
  run(...args: unknown[]): Promise<unknown>;
  all(...args: unknown[]): Promise<unknown>;
  get(...args: unknown[]): Promise<unknown>;
  [key: string]: unknown;
}
