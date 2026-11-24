import { build } from "esbuild";

// The browser file keeps the exact shape rsml.js always had: a UMD wrapper
// that defines RSMLAnnotator for AMD, CommonJS or a plain <script> tag.
const umdBanner = `(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.RSMLAnnotator = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
"use strict";`;

const umdFooter = `var RSMLAnnotator = __rsml.default;
RSMLAnnotator.default = RSMLAnnotator;
return RSMLAnnotator;
});`;

const shared = { bundle: true, target: "es2020", legalComments: "none", logLevel: "info" };

const umd = (outfile) =>
  build({
    ...shared,
    entryPoints: ["src/annotator.js"],
    format: "iife",
    globalName: "__rsml",
    banner: { js: umdBanner },
    footer: { js: umdFooter },
    outfile,
  });

await Promise.all([
  umd("rsml.js"),
  umd("rsml.cjs"),
  build({ ...shared, entryPoints: ["src/annotator.js"], format: "esm", outfile: "rsml.esm.js" }),
  build({ ...shared, entryPoints: ["src/core/index.js"], format: "esm", outfile: "core.js" }),
  build({ ...shared, entryPoints: ["src/core/index.js"], format: "cjs", outfile: "core.cjs" }),
]);
