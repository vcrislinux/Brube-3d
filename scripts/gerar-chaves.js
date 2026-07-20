const fs = require("fs");
const crypto = require("crypto");
const path = require("path");

const CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const GRUPOS = 4;
const TAM_GRUPO = 4;
const TOTAL = 100;

function grupo() {
  let s = "";
  for (let i = 0; i < TAM_GRUPO; i++) {
    s += CHARS[crypto.randomInt(0, CHARS.length)];
  }
  return s;
}

function chave() {
  const partes = [];
  for (let i = 0; i < GRUPOS; i++) partes.push(grupo());
  return "BRUBE-" + partes.join("-");
}

const set = new Set();
while (set.size < TOTAL) set.add(chave());

const linhas = ["Chave,Conta1,Conta2,Ativada em"];
for (const k of set) linhas.push(k + ",,,");

const saida = path.join(__dirname, "..", "chaves.csv");
fs.writeFileSync(saida, linhas.join("\r\n"), "utf8");
console.log("Geradas " + set.size + " chaves em chaves.csv");
