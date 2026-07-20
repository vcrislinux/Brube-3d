let orcFotoDataUrl = null;
let orcDadosCalc = {};
let orcCatalogoJaSalvo = false;

window.onload = () => {
  const $ = (id) => document.getElementById(id);
  try {
    orcDadosCalc = JSON.parse(localStorage.getItem("orcamento") || "{}");
  } catch (e) {
    orcDadosCalc = {};
  }

  $("qtd").textContent = orcDadosCalc.quantidade || 1;
  $("valor").textContent = orcDadosCalc.valorTotal || "R$ 0,00";
  $("valorUnit").textContent = orcDadosCalc.valorUnitario || "R$ 0,00";
  $("data").textContent = new Date().toLocaleDateString("pt-BR");
  atualizarOpcaoCatalogo();

  if (typeof configurarFerramentaFoto === "function") {
    configurarFerramentaFoto({
      galeriaId: "orc_foto_galeria",
      mensagemLimite: "",
      podeAdicionar: () => true,
      onFotoPronta: (dataUrl) => {
        orcFotoDataUrl = dataUrl;
        orcCatalogoJaSalvo = false;
        atualizarPreviaFotoOrcamento();
      }
    });
  }
};

function atualizarOpcaoCatalogo() {
  const checked = !!(document.getElementById("addCatalogo") || {}).checked;
  const hint = document.getElementById("addCatalogoHint");
  const actions = document.getElementById("orcCatActions");
  if (hint) hint.hidden = !checked;
  if (actions) actions.hidden = !checked;
}

function atualizarPreviaFotoOrcamento() {
  const img = document.getElementById("orc_foto_preview");
  const btnRem = document.getElementById("orc_foto_remover");
  if (!img) return;
  if (orcFotoDataUrl) {
    img.src = orcFotoDataUrl;
    img.hidden = false;
    if (btnRem) btnRem.hidden = false;
  } else {
    img.removeAttribute("src");
    img.hidden = true;
    if (btnRem) btnRem.hidden = true;
  }
}

function removerFotoOrcamento() {
  orcFotoDataUrl = null;
  orcCatalogoJaSalvo = false;
  atualizarPreviaFotoOrcamento();
}

function obterFotoOrcamento() {
  return orcFotoDataUrl || "";
}

function parseMaterialCor(texto) {
  const t = String(texto || "").trim();
  if (!t) return { material: "", cores: "" };
  const sep = t.indexOf("/");
  if (sep >= 0) {
    return {
      material: t.slice(0, sep).trim(),
      cores: t.slice(sep + 1).trim()
    };
  }
  return { material: t, cores: "" };
}

function montarItemCatalogoDoOrcamento() {
  const peca = ((document.getElementById("peca") || {}).value || "").trim();
  if (!peca) {
    alert("Informe o nome da peça para adicionar ao catálogo.");
    const el = document.getElementById("peca");
    if (el) el.focus();
    return null;
  }

  const qtd = Math.max(1, Number(orcDadosCalc.quantidade) || 1);
  const gramasTotal = Number(orcDadosCalc.gramas) || 0;
  const horasTotal = Number(orcDadosCalc.horas) || 0;
  const peso = gramasTotal > 0 ? gramasTotal / qtd : 0;
  const horas = horasTotal > 0 ? horasTotal / qtd : 0;
  const custo =
    Number(orcDadosCalc.custoUnitarioNum) ||
    (typeof parseMoeda === "function"
      ? parseMoeda(orcDadosCalc.custoUnitario || "0")
      : 0);
  const venda =
    Number(orcDadosCalc.valorUnitarioNum) ||
    (typeof parseMoeda === "function"
      ? parseMoeda(orcDadosCalc.valorUnitario || "0")
      : 0);
  const mat = parseMaterialCor((document.getElementById("material") || {}).value);
  const obs = ((document.getElementById("obs") || {}).value || "").trim();
  const foto = obterFotoOrcamento() || null;

  return {
    id: "p_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    nome: peca,
    material: mat.material,
    cores: mat.cores,
    peso: Math.round(peso * 100) / 100,
    horas: Math.round(horas * 1000) / 1000,
    custo: custo,
    venda: venda,
    detalhes: obs,
    fotos: foto ? [foto] : [],
    foto: foto,
    atualizado: Date.now()
  };
}

async function adicionarItemAoCatalogo(silencioso) {
  if (orcCatalogoJaSalvo) {
    if (!silencioso) alert("Este item já foi adicionado ao catálogo nesta tela.");
    return true;
  }
  const item = montarItemCatalogoDoOrcamento();
  if (!item) return false;

  const lista = typeof lerCatalogoLocal === "function" ? lerCatalogoLocal() : [];
  lista.unshift(item);
  if (typeof salvarCatalogoPersistente === "function") {
    await salvarCatalogoPersistente(lista);
  } else {
    localStorage.setItem("app_catalogo", JSON.stringify(lista));
  }
  orcCatalogoJaSalvo = true;
  if (!silencioso) {
    alert(
      "Item adicionado ao catálogo.\n\n" +
        item.nome +
        "\nPeso: " +
        item.peso +
        " g · Tempo: " +
        (typeof formatarTempo === "function" ? formatarTempo(item.horas) : item.horas + " h") +
        "\nCusto: " +
        (typeof formatarMoeda === "function" ? formatarMoeda(item.custo) : item.custo) +
        " · Venda: " +
        (typeof formatarMoeda === "function" ? formatarMoeda(item.venda) : item.venda)
    );
  }
  return true;
}

async function prepararCatalogoAntesDoPDF() {
  const checked = !!(document.getElementById("addCatalogo") || {}).checked;
  if (!checked) return true;
  if (orcCatalogoJaSalvo) return true;
  const ok = await adicionarItemAoCatalogo(true);
  if (ok) alert("Item também foi adicionado ao catálogo.");
  return ok;
}
