import { defineConfig } from "astro/config";
import unocss from "unocss/astro";
import { presetUno } from "unocss";
import presetAttributify from "@unocss/preset-attributify";
import presetTypography from "@unocss/preset-typography";
import solidJs from "@astrojs/solid-js";
import node from "@astrojs/node";
import cloudflare from "@astrojs/cloudflare";
const envAdapter = () => {
  return node({
    mode: "standalone"
  });
};


// https://astro.build/config
export default defineConfig({
  integrations: [unocss({
    presets: [presetAttributify(), presetUno(), presetTypography()]
  }), solidJs()],
  output: "server",
  adapter: cloudflare(),
  vite: {
    plugins: []
  }
});