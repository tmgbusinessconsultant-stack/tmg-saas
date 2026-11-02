import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendDirectory = path.dirname(fileURLToPath(import.meta.url));
const config = {
  plugins: {
    "@tailwindcss/postcss": {
      base: path.join(frontendDirectory, "src"),
    },
  },
};

export default config;
