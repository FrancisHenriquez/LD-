/** Punto de entrada del Worker de Cloudflare para la aplicación vinext. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Configuración de seguridad de imágenes. Las fuentes con extensión .svg evitan
// automáticamente el optimizador en el cliente y se sirven sin proxy. Para
// procesarlas con cabeceras de seguridad, activa dangerouslyAllowSVG en
// next.config.js y descomenta la siguiente línea:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  /**
   * Atiende cada petición: optimiza imágenes en la ruta interna de vinext y
   * delega el resto al enrutador principal de la aplicación.
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        // Resuelve la ruta solicitada contra la URL actual y lee el recurso del binding ASSETS.
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        // Aplica el ancho, formato y calidad solicitados mediante Cloudflare Images.
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
