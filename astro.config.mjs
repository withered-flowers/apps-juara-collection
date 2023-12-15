import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";

import netlify from "@astrojs/netlify/functions";

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind()],
  output: "server",
  adapter: netlify()
});