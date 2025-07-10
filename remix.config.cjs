// remix.config.cjs  ────────────────────────────────────────────────

// ── Temporary Shopify-CLI workaround ──────────────────────────────
if (
  process.env.HOST &&
  (!process.env.SHOPIFY_APP_URL || process.env.SHOPIFY_APP_URL === process.env.HOST)
) {
  process.env.SHOPIFY_APP_URL = process.env.HOST;
  delete process.env.HOST;
}

/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  // Where your Remix routes live
  appDirectory: "app",

  // Netlify needs a CJS function bundle in .netlify/functions-internal
  serverBuildTarget: "netlify",
  serverModuleFormat: "cjs",

  // Ignore dot-files in the routes folder
  ignoredRouteFiles: ["**/.*"],

  // OPTIONAL – if you want HMR on a fixed port when `npm run dev`ing
  dev: { port: Number(process.env.HMR_SERVER_PORT || 8002) },

  // Keep future flags minimal until the build succeeds
  future: {
    v3_relativeSplatPath: true
  }
};
