const MAX_FOTOS = 3;
let fotosProduto = [];

function carregarCatalogo() {
  return lerCatalogoLocal();
}

function salvarCatalogo(lista) {
  salvarCatalogoPersistente(lista);
}

function moeda(v) {
  return (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function idNovo() {
  return "p_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function fotosDoItem(item) {
  if (item && Array.isArray(item.fotos) && item.fotos.length) return item.fotos.slice(0, MAX_FOTOS);
  if (item && item.foto) return [item.foto];
  return [];
}

function fotoPrincipal(item) {
  const fotos = fotosDoItem(item);
  return fotos[0] || null;
}

function atualizarPreviaFotos() {
  const grid = document.getElementById("prod_fotos_grid");
  const hint = document.getElementById("prod_fotos_hint");
  const btnAdd = document.getElementById("btnAddFoto");
  const actions = document.getElementById("prod_foto_actions");
  if (!grid) return;
  grid.innerHTML = "";
  fotosProduto.forEach((src, i) => {
    const slot = document.createElement("div");
    slot.className = "prod-foto-slot";
    const img = document.createElement("img");
    img.src = src;
    img.alt = "Foto " + (i + 1);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "prod-foto-x";
    btn.setAttribute("aria-label", "Remover foto");
    btn.textContent = "✕";
    btn.addEventListener("click", () => removerFotoProduto(i));
    slot.appendChild(img);
    slot.appendChild(btn);
    grid.appendChild(slot);
  });
  if (fotosProduto.length > 0 && fotosProduto.length < MAX_FOTOS) {
    const add = document.createElement("button");
    add.type = "button";
    add.className = "prod-foto-add";
    add.setAttribute("aria-label", "Adicionar foto");
    add.textContent = "+";
    add.addEventListener("click", escolherFonteFoto);
    grid.appendChild(add);
  }
  const cheio = fotosProduto.length >= MAX_FOTOS;
  if (hint) hint.textContent = fotosProduto.length + " de " + MAX_FOTOS + " fotos";
  if (actions) actions.hidden = fotosProduto.length > 0;
  if (btnAdd) {
    btnAdd.disabled = cheio;
    btnAdd.style.opacity = cheio ? "0.45" : "1";
  }
}

function importarFotoProduto(input) {
  importarFotoArquivo(input);
}

function removerFotoProduto(i) {
  fotosProduto.splice(i, 1);
  atualizarPreviaFotos();
}

function limparFormProduto() {
  document.getElementById("prod_id").value = "";
  document.getElementById("prod_nome").value = "";
  document.getElementById("prod_material").value = "";
  document.getElementById("prod_cores").value = "";
  document.getElementById("prod_peso").value = "";
  document.getElementById("prod_horas").value = "";
  document.getElementById("prod_custo").value = "";
  document.getElementById("prod_venda").value = "";
  document.getElementById("prod_detalhes").value = "";
  fotosProduto = [];
  atualizarPreviaFotos();
}

function calcularCustoProduto() {
  const peso = parseFloat(document.getElementById("prod_peso").value);
  const horasEl = document.getElementById("prod_horas");
  const horas =
    typeof parseTempoHoras === "function"
      ? parseTempoHoras(horasEl.value)
      : parseFloat(horasEl.value);
  const custoEl = document.getElementById("prod_custo");
  if (!custoEl) return;
  if (isNaN(peso) && isNaN(horas)) return;
  const p = typeof CONFIG !== "undefined" && CONFIG.padroes ? CONFIG.padroes : {};
  const kg = parseFloat(p.filamento) || 0;
  const pot = parseFloat(p.potencia) || 0;
  const kwh = parseFloat(p.kwh) || 0;
  const desg = parseFloat(p.desgaste) || 0;
  const g = isNaN(peso) ? 0 : peso;
  const h = isNaN(horas) ? 0 : horas;
  const cf = (kg / 1000) * g;
  const ce = (pot / 1000) * h * kwh;
  const desgaste = desg * h;
  const total = cf + ce + desgaste;
  if (typeof formatarMoeda === "function") {
    custoEl.value = total > 0 ? formatarMoeda(total) : "";
  } else {
    custoEl.value = total > 0 ? (Math.round(total * 100) / 100).toFixed(2) : "";
  }
}

function novoProduto() {
  limparFormProduto();
  document.getElementById("produtoModalTitulo").textContent = "Novo produto";
  document.getElementById("produtoModal").hidden = false;
}

function fecharProduto() {
  document.getElementById("produtoModal").hidden = true;
}

function editarProduto(id) {
  const item = carregarCatalogo().find((p) => p.id === id);
  if (!item) return;
  document.getElementById("prod_id").value = item.id;
  document.getElementById("prod_nome").value = item.nome || "";
  document.getElementById("prod_material").value = item.material || "";
  document.getElementById("prod_cores").value = item.cores || "";
  document.getElementById("prod_peso").value = item.peso ?? "";
  document.getElementById("prod_horas").value =
    item.horas && typeof formatarTempo === "function"
      ? formatarTempo(item.horas)
      : item.horas
        ? String(item.horas)
        : "";
  document.getElementById("prod_custo").value =
    item.custo && typeof formatarMoeda === "function"
      ? formatarMoeda(item.custo)
      : item.custo
        ? String(item.custo)
        : "";
  document.getElementById("prod_venda").value =
    item.venda && typeof formatarMoeda === "function"
      ? formatarMoeda(item.venda)
      : item.venda
        ? String(item.venda)
        : "";
  document.getElementById("prod_detalhes").value = item.detalhes || "";
  fotosProduto = fotosDoItem(item);
  atualizarPreviaFotos();
  document.getElementById("produtoModalTitulo").textContent = "Editar produto";
  document.getElementById("produtoModal").hidden = false;
  if (typeof ligarFormatadoresPagina === "function") ligarFormatadoresPagina();
}

function salvarProduto() {
  const nome = document.getElementById("prod_nome").value.trim();
  if (!nome) {
    alert("Informe o nome do produto.");
    return;
  }
  const id = document.getElementById("prod_id").value || idNovo();
  const item = {
    id,
    nome,
    material: document.getElementById("prod_material").value.trim(),
    cores: document.getElementById("prod_cores").value.trim(),
    peso: parseFloat(document.getElementById("prod_peso").value) || 0,
    horas:
      typeof parseTempoHoras === "function"
        ? parseTempoHoras(document.getElementById("prod_horas").value) || 0
        : parseFloat(document.getElementById("prod_horas").value) || 0,
    custo:
      typeof parseMoeda === "function"
        ? parseMoeda(document.getElementById("prod_custo").value)
        : parseFloat(document.getElementById("prod_custo").value) || 0,
    venda:
      typeof parseMoeda === "function"
        ? parseMoeda(document.getElementById("prod_venda").value)
        : parseFloat(document.getElementById("prod_venda").value) || 0,
    detalhes: document.getElementById("prod_detalhes").value.trim(),
    fotos: fotosProduto.slice(0, MAX_FOTOS),
    foto: fotosProduto[0] || null,
    atualizado: Date.now()
  };
  const lista = carregarCatalogo();
  const i = lista.findIndex((p) => p.id === id);
  if (i >= 0) lista[i] = item;
  else lista.unshift(item);
  salvarCatalogo(lista);
  fecharProduto();
  renderCatalogo();
}

function excluirProduto(id) {
  if (!confirm("Excluir este produto do catálogo?")) return;
  salvarCatalogo(carregarCatalogo().filter((p) => p.id !== id));
  renderCatalogo();
}

function gerarOrcamentoProduto(id) {
  const item = carregarCatalogo().find((p) => p.id === id);
  if (!item) return;
  sessionStorage.setItem(
    "orcamento_catalogo",
    JSON.stringify({
      item: item,
      qtd: 1
    })
  );
  window.location.href = "orcamento-manual.html";
}

function renderCatalogo() {
  let lista = carregarCatalogo();
  const buscaEl = document.getElementById("catalogoBusca");
  const q = ((buscaEl && buscaEl.value) || "").trim().toLowerCase();
  if (q) {
    lista = lista.filter((p) => {
      const txt = [p.nome, p.material, p.cores, p.detalhes].filter(Boolean).join(" ").toLowerCase();
      return txt.indexOf(q) >= 0;
    });
  }
  const box = document.getElementById("catalogoLista");
  const vazio = document.getElementById("catalogoVazio");
  if (!box) return;
  box.innerHTML = "";
  if (vazio) {
    vazio.hidden = lista.length > 0;
    if (!lista.length) {
      vazio.textContent = q
        ? "Nenhum produto encontrado para essa pesquisa."
        : "Nenhum produto cadastrado ainda. Toque em “+ Novo produto”.";
    }
  }
  lista.forEach((p) => {
    const card = document.createElement("article");
    card.className = "catalogo-card";

    const foto = document.createElement("div");
    foto.className = "catalogo-card-foto";
    const src = fotoPrincipal(p);
    if (src) {
      const img = document.createElement("img");
      img.src = src;
      img.alt = p.nome || "Produto";
      foto.appendChild(img);
      const qtd = fotosDoItem(p).length;
      if (qtd > 1) {
        const badge = document.createElement("span");
        badge.className = "catalogo-foto-badge";
        badge.textContent = qtd + " fotos";
        foto.appendChild(badge);
      }
      foto.classList.add("tem-foto");
      foto.title = "Ver fotos";
      foto.addEventListener("click", (e) => {
        e.stopPropagation();
        abrirGaleria(p.id, 0);
      });
    } else {
      foto.textContent = "Sem foto";
    }

    const info = document.createElement("div");
    info.className = "catalogo-card-info";

    const nome = document.createElement("h3");
    nome.textContent = p.nome || "Sem nome";

    const stats = document.createElement("div");
    stats.className = "catalogo-stats";

    const peso = document.createElement("span");
    peso.className = "catalogo-stat";
    peso.innerHTML =
      '<svg class="catalogo-stat-ico" viewBox="0 0 24 24" aria-hidden="true">' +
      '<path fill="currentColor" d="M3.5 4.2C3.5 3 4.5 2 5.7 2h1.1v20H5.7c-1.2 0-2.2-1-2.2-2.2V4.2zm14.7-2.2h1.1c1.2 0 2.2 1 2.2 2.2v15.6c0 1.2-1 2.2-2.2 2.2h-1.1V2z"/>' +
      '<path fill="currentColor" d="M6.8 5.2h10.4v13.6H6.8z" opacity=".22"/>' +
      '<path fill="currentColor" fill-rule="evenodd" d="M7.6 6.4h8.8v1.35H7.6V6.4zm0 2.5h8.8v1.35H7.6V8.9zm0 2.5h8.8v1.35H7.6v-1.35zm0 2.5h8.8v1.35H7.6V13.9zm0 2.5h8.8V17.75H7.6V16.4z"/>' +
      '<path fill="currentColor" d="M11.2 10.6h1.6v2.8h-1.6z" opacity=".55"/>' +
      "</svg>";
    const pesoTxt = document.createElement("b");
    pesoTxt.textContent = p.peso ? p.peso + " g" : "— g";
    peso.appendChild(pesoTxt);

    const tempo = document.createElement("span");
    tempo.className = "catalogo-stat";
    tempo.innerHTML =
      '<svg class="catalogo-stat-ico" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm.8-12.8h-1.6v5.3l4.4 2.6.8-1.3-3.6-2.1z"/></svg>';
    const tempoTxt = document.createElement("b");
    tempoTxt.textContent = p.horas
      ? typeof formatarTempo === "function"
        ? formatarTempo(p.horas)
        : p.horas + " h"
      : "—:—";
    tempo.appendChild(tempoTxt);

    stats.appendChild(peso);
    stats.appendChild(tempo);

    const meta = document.createElement("p");
    meta.className = "catalogo-meta";
    const partes = [];
    if (p.material) partes.push(p.material);
    if (p.cores) partes.push(p.cores);
    meta.textContent = partes.join(" · ") || "Sem detalhes";

    const preco = document.createElement("p");
    preco.className = "catalogo-preco";
    preco.textContent = moeda(p.venda);

    const acoes = document.createElement("div");
    acoes.className = "catalogo-card-acoes";

    const btnOrc = document.createElement("button");
    btnOrc.type = "button";
    btnOrc.textContent = "Gerar orçamento";
    btnOrc.addEventListener("click", () => gerarOrcamentoProduto(p.id));

    const btnEdit = document.createElement("button");
    btnEdit.type = "button";
    btnEdit.className = "secondary";
    btnEdit.textContent = "Editar";
    btnEdit.addEventListener("click", () => editarProduto(p.id));

    const btnDel = document.createElement("button");
    btnDel.type = "button";
    btnDel.className = "secondary";
    btnDel.textContent = "Excluir";
    btnDel.addEventListener("click", () => excluirProduto(p.id));

    acoes.appendChild(btnOrc);
    acoes.appendChild(btnEdit);
    acoes.appendChild(btnDel);

    info.appendChild(nome);
    info.appendChild(stats);
    info.appendChild(meta);
    info.appendChild(preco);

    card.appendChild(foto);
    card.appendChild(info);
    card.appendChild(acoes);
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", "Abrir " + (p.nome || "produto"));
    card.addEventListener("click", (e) => {
      if (e.target.closest("button") || e.target.closest(".catalogo-card-foto")) return;
      editarProduto(p.id);
    });
    card.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      editarProduto(p.id);
    });
    box.appendChild(card);
  });
}

function fecharMenuArquivo() {
  const lista = document.getElementById("menuArquivoLista");
  const btn = document.getElementById("btnMenuArquivo");
  if (lista) lista.hidden = true;
  if (btn) btn.setAttribute("aria-expanded", "false");
}

let galeriaFotos = [];
let galeriaIndice = 0;
let galeriaTitulo = "";

function atualizarGaleria() {
  const img = document.getElementById("galeriaImg");
  const info = document.getElementById("galeriaInfo");
  const prev = document.getElementById("galeriaPrev");
  const next = document.getElementById("galeriaNext");
  if (!img || !galeriaFotos.length) return;
  img.src = galeriaFotos[galeriaIndice];
  img.alt = (galeriaTitulo || "Produto") + " — foto " + (galeriaIndice + 1);
  if (info) {
    info.textContent =
      (galeriaTitulo ? galeriaTitulo + " · " : "") +
      (galeriaIndice + 1) +
      " / " +
      galeriaFotos.length;
  }
  const varios = galeriaFotos.length > 1;
  if (prev) prev.hidden = !varios;
  if (next) next.hidden = !varios;
}

function abrirGaleria(id, indice) {
  const item = carregarCatalogo().find((p) => p.id === id);
  if (!item) return;
  const fotos = fotosDoItem(item);
  if (!fotos.length) return;
  galeriaFotos = fotos;
  galeriaIndice = Math.max(0, Math.min(Number(indice) || 0, fotos.length - 1));
  galeriaTitulo = item.nome || "";
  atualizarGaleria();
  const modal = document.getElementById("galeriaModal");
  if (modal) modal.hidden = false;
}

function fecharGaleria() {
  const modal = document.getElementById("galeriaModal");
  if (modal) modal.hidden = true;
  galeriaFotos = [];
  galeriaIndice = 0;
}

function galeriaAnterior() {
  if (galeriaFotos.length < 2) return;
  galeriaIndice = (galeriaIndice - 1 + galeriaFotos.length) % galeriaFotos.length;
  atualizarGaleria();
}

function galeriaProxima() {
  if (galeriaFotos.length < 2) return;
  galeriaIndice = (galeriaIndice + 1) % galeriaFotos.length;
  atualizarGaleria();
}

function toggleMenuArquivo(e) {
  if (e) e.stopPropagation();
  const lista = document.getElementById("menuArquivoLista");
  const btn = document.getElementById("btnMenuArquivo");
  if (!lista || !btn) return;
  const aberto = lista.hidden;
  lista.hidden = !aberto;
  btn.setAttribute("aria-expanded", aberto ? "true" : "false");
}

async function acaoMenuArquivo(acao) {
  fecharMenuArquivo();
  if (acao === "salvar") await escolherPastaCatalogoPC();
  else if (acao === "exportar") await exportarCatalogoDownload();
  else if (acao === "importar") {
    const input = document.getElementById("importCatalogo");
    if (input) input.click();
  }
}

let shareIdsSelecionados = new Set();

function abrirCompartilharCatalogo() {
  const lista = carregarCatalogo();
  if (!lista.length) {
    alert("Cadastre ao menos uma peça antes de compartilhar.");
    return;
  }
  shareIdsSelecionados = new Set();
  fecharShareSelecao(true);
  const modal = document.getElementById("shareCatalogoModal");
  if (modal) modal.hidden = false;
}

function fecharCompartilharCatalogo() {
  const modal = document.getElementById("shareCatalogoModal");
  if (modal) modal.hidden = true;
  fecharShareSelecao(true);
}

function fecharShareSelecao(silencioso) {
  const modal = document.getElementById("shareSelecaoModal");
  if (modal) modal.hidden = true;
  if (!silencioso) {
    const modo = document.getElementById("shareCatalogoModal");
    if (modo) modo.hidden = false;
  }
}

function abrirShareParcial() {
  shareIdsSelecionados = new Set();
  const busca = document.getElementById("shareBusca");
  if (busca) busca.value = "";
  const modo = document.getElementById("shareCatalogoModal");
  if (modo) modo.hidden = true;
  const modal = document.getElementById("shareSelecaoModal");
  if (modal) modal.hidden = false;
  renderShareLista();
  atualizarBotaoEnviarSelecionadas();
}

function atualizarShareContagem() {
  const el = document.getElementById("shareContagem");
  if (el) {
    const n = shareIdsSelecionados.size;
    el.textContent = n + (n === 1 ? " selecionada" : " selecionadas");
  }
  atualizarBotaoEnviarSelecionadas();
}

function atualizarBotaoEnviarSelecionadas() {
  const btn = document.getElementById("btnEnviarSelecionadas");
  if (!btn) return;
  btn.disabled = shareIdsSelecionados.size < 1;
}

function renderShareLista() {
  const box = document.getElementById("shareLista");
  if (!box) return;
  const buscaEl = document.getElementById("shareBusca");
  const q = ((buscaEl && buscaEl.value) || "").trim().toLowerCase();
  let lista = carregarCatalogo();
  if (q) {
    lista = lista.filter((p) => {
      const txt = [p.nome, p.material, p.cores, p.detalhes].filter(Boolean).join(" ").toLowerCase();
      return txt.indexOf(q) >= 0;
    });
  }
  box.innerHTML = "";
  if (!lista.length) {
    const p = document.createElement("p");
    p.className = "share-contagem";
    p.textContent = q ? "Nenhuma peça encontrada." : "Catálogo vazio.";
    box.appendChild(p);
    atualizarShareContagem();
    return;
  }
  lista.forEach((p) => {
    const label = document.createElement("label");
    label.className = "share-item";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = shareIdsSelecionados.has(p.id);
    cb.addEventListener("change", () => {
      if (cb.checked) shareIdsSelecionados.add(p.id);
      else shareIdsSelecionados.delete(p.id);
      atualizarShareContagem();
    });
    label.appendChild(cb);

    const src = fotoPrincipal(p);
    if (src) {
      const img = document.createElement("img");
      img.className = "share-item-foto";
      img.src = src;
      img.alt = "";
      label.appendChild(img);
    } else {
      const foto = document.createElement("div");
      foto.className = "share-item-foto vazio";
      foto.textContent = "—";
      label.appendChild(foto);
    }

    const txt = document.createElement("div");
    txt.className = "share-item-txt";
    const strong = document.createElement("strong");
    strong.textContent = p.nome || "Sem nome";
    const small = document.createElement("small");
    const partes = [];
    if (p.material) partes.push(p.material);
    if (p.cores) partes.push(p.cores);
    small.textContent = partes.join(" · ") || moeda(p.venda);
    txt.appendChild(strong);
    txt.appendChild(small);
    label.appendChild(txt);
    box.appendChild(label);
  });
  atualizarShareContagem();
}

function shareMarcarTodos(marcar) {
  const buscaEl = document.getElementById("shareBusca");
  const q = ((buscaEl && buscaEl.value) || "").trim().toLowerCase();
  let lista = carregarCatalogo();
  if (q) {
    lista = lista.filter((p) => {
      const txt = [p.nome, p.material, p.cores, p.detalhes].filter(Boolean).join(" ").toLowerCase();
      return txt.indexOf(q) >= 0;
    });
  }
  lista.forEach((p) => {
    if (marcar) shareIdsSelecionados.add(p.id);
    else shareIdsSelecionados.delete(p.id);
  });
  renderShareLista();
}

async function compartilharCatalogoTotal() {
  const lista = carregarCatalogo();
  if (!lista.length) {
    alert("Catálogo vazio.");
    return;
  }
  fecharCompartilharCatalogo();
  if (typeof salvarOuCompartilharCatalogoPDF === "function") {
    await salvarOuCompartilharCatalogoPDF(lista);
  }
}

async function compartilharCatalogoParcial() {
  if (!shareIdsSelecionados.size) {
    alert("Selecione ao menos uma peça.");
    return;
  }
  const ids = shareIdsSelecionados;
  const lista = carregarCatalogo().filter((p) => ids.has(p.id));
  if (!lista.length) {
    alert("Selecione ao menos uma peça.");
    return;
  }
  fecharShareSelecao(true);
  fecharCompartilharCatalogo();
  if (typeof salvarOuCompartilharCatalogoPDF === "function") {
    await salvarOuCompartilharCatalogoPDF(lista);
  }
}

document.addEventListener("click", (e) => {
  const modal = document.getElementById("produtoModal");
  if (modal && e.target === modal) fecharProduto();
  const galeria = document.getElementById("galeriaModal");
  if (galeria && e.target === galeria) fecharGaleria();
  const share = document.getElementById("shareCatalogoModal");
  if (share && e.target === share) fecharCompartilharCatalogo();
  const shareSel = document.getElementById("shareSelecaoModal");
  if (shareSel && e.target === shareSel) fecharShareSelecao();
  const menu = document.getElementById("menuArquivo");
  if (menu && !menu.contains(e.target)) fecharMenuArquivo();
});

document.addEventListener("keydown", (e) => {
  const shareSel = document.getElementById("shareSelecaoModal");
  if (shareSel && !shareSel.hidden && e.key === "Escape") {
    fecharShareSelecao();
    return;
  }
  const share = document.getElementById("shareCatalogoModal");
  if (share && !share.hidden && e.key === "Escape") {
    fecharCompartilharCatalogo();
    return;
  }
  const galeria = document.getElementById("galeriaModal");
  if (!galeria || galeria.hidden) return;
  if (e.key === "Escape") fecharGaleria();
  else if (e.key === "ArrowLeft") galeriaAnterior();
  else if (e.key === "ArrowRight") galeriaProxima();
});

document.addEventListener("DOMContentLoaded", async () => {
  if (typeof configurarFerramentaFoto === "function") {
    configurarFerramentaFoto({
      galeriaId: "prod_foto_galeria",
      mensagemLimite: "Máximo de " + MAX_FOTOS + " fotos por produto.",
      podeAdicionar: () => fotosProduto.length < MAX_FOTOS,
      onFotoPronta: (dataUrl) => {
        if (fotosProduto.length >= MAX_FOTOS) return;
        fotosProduto.push(dataUrl);
        atualizarPreviaFotos();
      }
    });
  }
  await carregarCatalogoPersistente();
  renderCatalogo();
});
