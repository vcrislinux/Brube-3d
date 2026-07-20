const fs = require("fs");
const path = require("path");

const root = __dirname;
const dest = path.join(root, "www");

fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(dest, { recursive: true });

const files = [
  "index.html",
  "calculadora.html",
  "orcamento.html",
  "orcamento-manual.html",
  "catalogo.html",
  "manual-atualizacao.html",
  "manual-config.html",
  "manual-calculadora.html",
  "manual-catalogo.html",
  "manual-orcamento.html",
  "sw.js",
  "manifest.webmanifest",
  ".nojekyll",
  "README.txt",
  "README-APP.txt"
];

const dirs = ["css", "js", "img", "ico"];

files.forEach((f) => {
  const src = path.join(root, f);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(dest, f));
});

dirs.forEach((d) => {
  const src = path.join(root, d);
  if (fs.existsSync(src)) fs.cpSync(src, path.join(dest, d), { recursive: true });
});

console.log("Pasta www atualizada com sucesso.");
