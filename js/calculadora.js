const $ = (id) => document.getElementById(id);

const CAMPOS_PADRAO = ["filamento", "potencia", "kwh", "desgaste"];
const CAMPOS_CALC = ["gramas", "tempo", "lucro", "quantidade", "falha", "maoObra", "embalagem"];
const CAMPOS = CAMPOS_PADRAO.concat(CAMPOS_CALC);
const CAMPOS_MOEDA = ["filamento", "kwh", "desgaste", "maoObra", "embalagem"];

function numCampo(id) {
  const el = $(id);
  if (!el) return 0;
  if (el.dataset.formato === "moeda" || CAMPOS_MOEDA.indexOf(id) >= 0) {
    return typeof parseMoeda === "function" ? parseMoeda(el.value) : parseFloat(el.value) || 0;
  }
  return parseFloat(el.value) || 0;
}

function setCampoValor(id, valor) {
  const el = $(id);
  if (!el || valor === undefined || valor === null || valor === "") return;
  if (CAMPOS_MOEDA.indexOf(id) >= 0 && typeof formatarMoeda === "function") {
    el.value = formatarMoeda(valor);
  } else if (id === "tempo" && typeof formatarTempo === "function") {
    el.value = formatarTempo(valor);
  } else {
    el.value = valor;
  }
}

function aplicarPadroesCalculadora() {
  const p = (typeof CONFIG !== "undefined" && CONFIG.padroes) || {};
  CAMPOS_PADRAO.forEach((id) => {
    if (p[id] !== undefined && p[id] !== null && p[id] !== "") setCampoValor(id, p[id]);
  });
  atualizarLabelsExtrasPadrao();
}

function atualizarLabelsExtrasPadrao() {
  const p = (typeof CONFIG !== "undefined" && CONFIG.padroes) || {};
  const lblA = $("lblArgolas");
  const lblE = $("lblEmbalagem");
  if (lblA) lblA.textContent = "(" + moeda(p.argolas || 0) + " / peça)";
  if (lblE) lblE.textContent = "(" + moeda(p.valorEmbalagem || 0) + " / peça)";
}

function salvarCampos() {
  const dados = {};
  CAMPOS_CALC.forEach((id) => {
    const el = $(id);
    if (!el) return;
    if (CAMPOS_MOEDA.indexOf(id) >= 0 && typeof parseMoeda === "function") {
      dados[id] = parseMoeda(el.value);
    } else if (id === "tempo" && typeof parseTempoHoras === "function") {
      const h = parseTempoHoras(el.value);
      dados[id] = isNaN(h) ? el.value : h;
    } else {
      dados[id] = el.value;
    }
  });
  const fav = $("impressoraFav");
  if (fav) dados.impressoraFav = fav.value || "";
  const usarA = $("usarArgolas");
  const usarE = $("usarEmbalagem");
  if (usarA) dados.usarArgolas = !!usarA.checked;
  if (usarE) dados.usarEmbalagem = !!usarE.checked;
  localStorage.setItem("calc_campos", JSON.stringify(dados));
}

function restaurarCampos() {
  let dados = {};
  try {
    dados = JSON.parse(localStorage.getItem("calc_campos") || "{}");
  } catch (e) {
    dados = {};
  }

  aplicarPadroesCalculadora();

  CAMPOS_CALC.forEach((id) => {
    const el = $(id);
    if (!el) return;
    if (dados[id] !== undefined && dados[id] !== "") setCampoValor(id, dados[id]);
    el.addEventListener("input", salvarCampos);
    el.addEventListener("blur", salvarCampos);
  });

  CAMPOS_PADRAO.forEach((id) => {
    const el = $(id);
    if (!el) return;
    el.addEventListener("input", salvarCampos);
    el.addEventListener("blur", salvarCampos);
  });

  const usarA = $("usarArgolas");
  const usarE = $("usarEmbalagem");
  if (usarA) usarA.checked = !!dados.usarArgolas;
  if (usarE) usarE.checked = !!dados.usarEmbalagem;

  if (typeof preencherSelectFavoritas === "function") preencherSelectFavoritas();
  const fav = $("impressoraFav");
  if (fav && dados.impressoraFav) {
    const existe = Array.from(fav.options).some((o) => o.value === dados.impressoraFav);
    if (existe) {
      fav.value = dados.impressoraFav;
      if (typeof aplicarImpressoraFavorita === "function") aplicarImpressoraFavorita();
    }
  }
}

document.addEventListener("DOMContentLoaded", restaurarCampos);

function conv(v) {
  if (typeof parseTempoHoras === "function") return parseTempoHoras(v);
  v = String(v).trim().replace(",", ".");
  if (v.includes(":")) {
    const p = v.split(":");
    const h = parseInt(p[0], 10) || 0;
    const m = parseInt(p[1], 10) || 0;
    if (m > 59) return NaN;
    return h + m / 60;
  }
  if (v.includes(".")) {
    const p = v.split(".");
    const h = parseInt(p[0], 10) || 0;
    const m = parseInt(p[1], 10) || 0;
    if (m > 59) return NaN;
    return h + m / 60;
  }
  return parseFloat(v);
}

function moeda(v) {
  return (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function calcular() {
  const kg = numCampo("filamento");
  const pot = parseFloat($("potencia").value) || 0;
  const k = numCampo("kwh");
  const g = parseFloat($("gramas").value);
  const h = conv($("tempo").value);
  const luc = parseFloat($("lucro").value) || 0;
  const qtd = Math.max(1, Math.floor(parseFloat($("quantidade").value) || 1));
  const desgHora = numCampo("desgaste");
  const falhaPct = parseFloat($("falha").value) || 0;
  const maoObra = numCampo("maoObra");
  const embalagem = numCampo("embalagem");
  const pad = (typeof CONFIG !== "undefined" && CONFIG.padroes) || {};
  const argolasUnit = parseFloat(pad.argolas) || 0;
  const embUnit = parseFloat(pad.valorEmbalagem) || 0;
  const argolas = $("usarArgolas") && $("usarArgolas").checked ? argolasUnit * qtd : 0;
  const embCfg = $("usarEmbalagem") && $("usarEmbalagem").checked ? embUnit * qtd : 0;

  if (isNaN(g) || isNaN(h)) {
    alert("Preencha as gramas e o tempo corretamente (ex.: 02:30).");
    return null;
  }

  const cf = (kg / 1000) * g;
  const ce = (pot / 1000) * h * k;
  const desgaste = desgHora * h;
  const falha = (cf + ce + desgaste) * (falhaPct / 100);
  const extras = desgaste + falha + maoObra + embalagem + argolas + embCfg;
  const total = cf + ce + extras;
  const vl = (total * luc) / 100;
  const venda = total + vl;
  const custoUnit = total / qtd;
  const vendaUnit = venda / qtd;

  $("custoFilamento").textContent = moeda(cf);
  $("custoEnergia").textContent = moeda(ce);
  $("custoExtras").textContent = moeda(extras);
  $("rowExtras").hidden = extras <= 0;
  $("valorLucro").textContent = moeda(vl);
  $("totalEl").textContent = moeda(total);
  $("custoUnit").textContent = moeda(custoUnit);
  $("valorVenda").textContent = moeda(venda);
  $("valorUnit").textContent = moeda(vendaUnit);

  const dados = {
    quantidade: qtd,
    gramas: g,
    horas: h,
    custoFilamento: moeda(cf),
    custoEnergia: moeda(ce),
    lucro: moeda(vl),
    custo: moeda(total),
    custoUnitario: moeda(custoUnit),
    valorTotal: moeda(venda),
    valorUnitario: moeda(vendaUnit),
    custoNum: total,
    custoUnitarioNum: custoUnit,
    valorTotalNum: venda,
    valorUnitarioNum: vendaUnit
  };
  localStorage.setItem("orcamento", JSON.stringify(dados));
  return dados;
}

function gerar() {
  if (!calcular()) return;
  window.location.href = "orcamento.html";
}
