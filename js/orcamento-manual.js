(() => {
  const $ = (id) => document.getElementById(id);
  const CAT_KEY = "app_catalogo";
  let itens = [];

  const moeda = (v) =>
    (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  function carregarCatalogo() {
    if (typeof lerCatalogoLocal === "function") return lerCatalogoLocal();
    try {
      const lista = JSON.parse(localStorage.getItem("app_catalogo") || "[]");
      return Array.isArray(lista) ? lista : [];
    } catch (e) {
      return [];
    }
  }

  function materialTxt(p) {
    return [p.material, p.cores].filter(Boolean).join(" / ");
  }

  function obsDoProduto(p) {
    if (!p) return "";
    const parts = [];
    if (p.peso) parts.push("Peso: " + p.peso + " g");
    if (p.horas) {
      const t =
        typeof formatarTempo === "function" ? formatarTempo(p.horas) : p.horas + " h";
      parts.push("Impressão: " + t);
    }
    if (p.detalhes) parts.push(String(p.detalhes).trim());
    return parts.filter(Boolean).join("\n");
  }

  function fotoPrincipal(p) {
    if (p && Array.isArray(p.fotos) && p.fotos[0]) return p.fotos[0];
    return (p && p.foto) || null;
  }

  function adicionarItem(produto, qtd) {
    const id = produto.id || ("m_" + Date.now());
    const existente = itens.find((i) => i.produtoId === id);
    const quantidade = Math.max(1, Math.floor(Number(qtd) || 1));
    if (existente) {
      existente.qtd += quantidade;
    } else {
      itens.push({
        produtoId: id,
        nome: produto.nome || "Produto",
        material: materialTxt(produto),
        unit: Number(produto.venda) || 0,
        qtd: quantidade,
        foto: fotoPrincipal(produto),
        obs: obsDoProduto(produto)
      });
    }
    renderItens();
  }

  function atualizarTotais() {
    let qtdTotal = 0;
    let valor = 0;
    itens.forEach((i) => {
      qtdTotal += i.qtd;
      valor += i.qtd * i.unit;
    });
    $("qtdOut").textContent = String(qtdTotal);
    $("valorTotal").textContent = moeda(valor);
    const vazio = $("itensVazio");
    if (vazio) vazio.hidden = itens.length > 0;
  }

  function renderItens() {
    const box = $("itensLista");
    if (!box) return;
    box.innerHTML = "";
    itens.forEach((item, idx) => {
      const card = document.createElement("article");
      card.className = "item-card";

      if (item.foto) {
        const foto = document.createElement("div");
        foto.className = "item-card-foto";
        const img = document.createElement("img");
        img.src = item.foto;
        img.alt = item.nome;
        foto.appendChild(img);
        card.appendChild(foto);
      }

      const info = document.createElement("div");
      info.className = "item-card-info";

      const nome = document.createElement("h3");
      nome.textContent = item.nome;

      const meta = document.createElement("p");
      meta.className = "catalogo-meta";
      meta.textContent = (item.material || "—") + " · " + moeda(item.unit) + " / un.";

      const obsLab = document.createElement("label");
      obsLab.className = "item-obs-label";
      obsLab.textContent = "Observação do item";

      const obs = document.createElement("textarea");
      obs.className = "item-obs";
      obs.rows = 3;
      obs.placeholder = "Peso, tempo, detalhes…";
      obs.value = item.obs || "";
      obs.addEventListener("input", () => {
        item.obs = obs.value;
      });

      const linha = document.createElement("div");
      linha.className = "item-card-linha";

      const qtdBox = document.createElement("div");
      qtdBox.className = "item-qtd";

      const menos = document.createElement("button");
      menos.type = "button";
      menos.className = "secondary";
      menos.textContent = "−";
      menos.addEventListener("click", () => {
        item.qtd = Math.max(1, item.qtd - 1);
        renderItens();
      });

      const qtd = document.createElement("input");
      qtd.type = "number";
      qtd.min = "1";
      qtd.step = "1";
      qtd.value = String(item.qtd);
      qtd.addEventListener("change", () => {
        item.qtd = Math.max(1, Math.floor(parseFloat(qtd.value) || 1));
        renderItens();
      });

      const mais = document.createElement("button");
      mais.type = "button";
      mais.className = "secondary";
      mais.textContent = "+";
      mais.addEventListener("click", () => {
        item.qtd += 1;
        renderItens();
      });

      qtdBox.appendChild(menos);
      qtdBox.appendChild(qtd);
      qtdBox.appendChild(mais);

      const sub = document.createElement("strong");
      sub.className = "item-subtotal";
      sub.textContent = moeda(item.qtd * item.unit);

      const rem = document.createElement("button");
      rem.type = "button";
      rem.className = "secondary";
      rem.textContent = "Remover";
      rem.addEventListener("click", () => {
        itens.splice(idx, 1);
        renderItens();
      });

      linha.appendChild(qtdBox);
      linha.appendChild(sub);

      info.appendChild(nome);
      info.appendChild(meta);
      info.appendChild(obsLab);
      info.appendChild(obs);
      info.appendChild(linha);
      info.appendChild(rem);
      card.appendChild(info);
      box.appendChild(card);
    });
    atualizarTotais();
  }

  let seletorIds = new Set();

  function listaFiltradaSeletor() {
    const buscaEl = $("seletorBusca");
    const q = ((buscaEl && buscaEl.value) || "").trim().toLowerCase();
    let lista = carregarCatalogo();
    if (q) {
      lista = lista.filter((p) => {
        const txt = [p.nome, p.material, p.cores, p.detalhes].filter(Boolean).join(" ").toLowerCase();
        return txt.indexOf(q) >= 0;
      });
    }
    return lista;
  }

  function atualizarSeletorContagem() {
    const el = $("seletorContagem");
    if (el) {
      const n = seletorIds.size;
      el.textContent = n + (n === 1 ? " selecionada" : " selecionadas");
    }
    const btn = $("btnAdicionarSelecionadas");
    if (btn) btn.disabled = seletorIds.size < 1;
  }

  window.renderSeletorCatalogo = function () {
    const box = $("seletorLista");
    const vazio = $("seletorVazio");
    if (!box) return;
    const listaCompleta = carregarCatalogo();
    const lista = listaFiltradaSeletor();
    const buscaEl = $("seletorBusca");
    const q = ((buscaEl && buscaEl.value) || "").trim();

    box.innerHTML = "";
    if (vazio) {
      vazio.hidden = listaCompleta.length > 0;
      if (listaCompleta.length && !lista.length) {
        vazio.hidden = false;
        vazio.textContent = q ? "Nenhuma peça encontrada." : "Nenhum produto no catálogo. Cadastre em Catálogo.";
      } else if (!listaCompleta.length) {
        vazio.textContent = "Nenhum produto no catálogo. Cadastre em Catálogo.";
      }
    }

    lista.forEach((p) => {
      const label = document.createElement("label");
      label.className = "share-item";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = seletorIds.has(p.id);
      cb.addEventListener("change", () => {
        if (cb.checked) seletorIds.add(p.id);
        else seletorIds.delete(p.id);
        atualizarSeletorContagem();
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
      small.textContent = (partes.join(" · ") || "—") + " · " + moeda(p.venda);
      txt.appendChild(strong);
      txt.appendChild(small);
      label.appendChild(txt);
      box.appendChild(label);
    });
    atualizarSeletorContagem();
  };

  window.seletorMarcarTodos = function (marcar) {
    listaFiltradaSeletor().forEach((p) => {
      if (marcar) seletorIds.add(p.id);
      else seletorIds.delete(p.id);
    });
    renderSeletorCatalogo();
  };

  window.abrirSeletorCatalogo = function () {
    const lista = carregarCatalogo();
    if (!lista.length) {
      alert("Cadastre ao menos uma peça no Catálogo antes de adicionar.");
      return;
    }
    seletorIds = new Set();
    const busca = $("seletorBusca");
    if (busca) busca.value = "";
    const modal = $("seletorCatalogo");
    if (modal) modal.hidden = false;
    renderSeletorCatalogo();
  };

  window.fecharSeletorCatalogo = function () {
    const modal = $("seletorCatalogo");
    if (modal) modal.hidden = true;
  };

  window.adicionarSelecionadasCatalogo = function () {
    if (!seletorIds.size) {
      alert("Selecione ao menos uma peça.");
      return;
    }
    const ids = seletorIds;
    const lista = carregarCatalogo().filter((p) => ids.has(p.id));
    if (!lista.length) {
      alert("Selecione ao menos uma peça.");
      return;
    }
    lista.forEach((p) => adicionarItem(p, 1));
    fecharSeletorCatalogo();
  };

  window.obterItensOrcamento = function () {
    return itens.map((i) => ({
      nome: i.nome,
      material: i.material,
      qtd: i.qtd,
      unit: i.unit,
      subtotal: i.qtd * i.unit,
      obs: (i.obs || "").trim(),
      foto: i.foto || null
    }));
  };

  function aplicarCatalogoInicial() {
    try {
      const raw = sessionStorage.getItem("orcamento_catalogo");
      if (!raw) return;
      const d = JSON.parse(raw);
      sessionStorage.removeItem("orcamento_catalogo");
      if (d.item) {
        adicionarItem(d.item, d.qtd || 1);
      } else if (d.peca) {
        adicionarItem(
          {
            id: d.id || ("tmp_" + Date.now()),
            nome: d.peca,
            material: (d.material || "").split(" / ")[0] || "",
            cores: (d.material || "").split(" / ").slice(1).join(" / "),
            venda: d.valorUnit || 0,
            foto: d.foto || null,
            fotos: d.foto ? [d.foto] : []
          },
          1
        );
      }
    } catch (e) {}
  }

  document.addEventListener("click", (e) => {
    const modal = $("seletorCatalogo");
    if (modal && e.target === modal) fecharSeletorCatalogo();
  });

  $("data").textContent = new Date().toLocaleDateString("pt-BR");
  aplicarCatalogoInicial();
  renderItens();
})();
