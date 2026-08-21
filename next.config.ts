import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

// Ancla Turbopack al directorio de este proyecto para que no infiera otra raíz
// a partir de lockfiles o espacios de trabajo situados en directorios superiores.
const rootDir = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: rootDir,
  },
};

export default nextConfig;
