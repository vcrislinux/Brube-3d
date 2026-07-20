function abrirGuiaRapido() {
  const lista = typeof MANUAIS !== "undefined" && Array.isArray(MANUAIS) ? MANUAIS : [];
  const item = lista.find((m) => m && m.id === "rapido") || {
    titulo: "Guia rápido",
    tipo: "arquivo",
    arquivo: "README-APP.txt"
  };
  abrirManualItem(item);
}

function abrirManuais() {
  renderListaManuais();
  const m = document.getElementById("manuaisModal");
  if (m) m.hidden = false;
}

function fecharManuais() {
  const m = document.getElementById("manuaisModal");
  if (m) m.hidden = true;
}

function fecharManualTexto() {
  const m = document.getElementById("manualTextoModal");
  if (m) m.hidden = true;
}

function escaparManualHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function ehLinhaRegua(linha) {
  const t = String(linha || "").trim();
  return t.length >= 8 && /^[=\-]+$/.test(t);
}

function ehItemLista(linha) {
  return /^\s*(?:[•·●▪]|\d+\.)\s+/.test(linha);
}

function ehLinhaDefinicao(linha) {
  return /^\s{2,}(\S.+?)\s{2,}(\S.+)$/.test(linha);
}

function formatarManualComoHtml(texto) {
  const linhas = String(texto || "").replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let i = 0;

  while (i < linhas.length && !String(linhas[i]).trim()) i++;
  if (i < linhas.length && ehLinhaRegua(linhas[i])) {
    i++;
    const bloco = [];
    while (i < linhas.length && !ehLinhaRegua(linhas[i])) {
      const t = String(linhas[i]).trim();
      if (t) bloco.push(t);
      i++;
    }
    if (i < linhas.length && ehLinhaRegua(linhas[i])) i++;
    if (bloco.length) {
      html.push('<header class="manual-hero">');
      html.push('<p class="manual-hero-title">' + escaparManualHtml(bloco[0]) + "</p>");
      if (bloco.length > 1) {
        html.push('<p class="manual-hero-sub">' + escaparManualHtml(bloco.slice(1).join(" · ")) + "</p>");
      }
      html.push("</header>");
    }
  }

  let emSecao = false;
  let paragrafo = [];
  let lista = [];
  let listaOl = false;
  let defs = [];
  let subtituloPendente = null;

  function flushParagrafo() {
    const txt = paragrafo.join(" ").replace(/\s+/g, " ").trim();
    if (txt) html.push("<p>" + escaparManualHtml(txt) + "</p>");
    paragrafo = [];
  }

  function flushLista() {
    if (!lista.length) return;
    html.push(listaOl ? '<ol class="manual-lista">' : '<ul class="manual-lista">');
    lista.forEach((it) => html.push("<li>" + escaparManualHtml(it) + "</li>"));
    html.push(listaOl ? "</ol>" : "</ul>");
    lista = [];
  }

  function flushDefs() {
    if (!defs.length) return;
    html.push('<dl class="manual-defs">');
    defs.forEach((d) => {
      html.push("<dt>" + escaparManualHtml(d.k) + "</dt>");
      html.push("<dd>" + escaparManualHtml(d.v) + "</dd>");
    });
    html.push("</dl>");
    defs = [];
  }

  function flushSubtitulo() {
    if (!subtituloPendente) return;
    html.push('<p class="manual-sub">' + escaparManualHtml(subtituloPendente) + "</p>");
    subtituloPendente = null;
  }

  function flushTudo() {
    flushLista();
    flushDefs();
    flushParagrafo();
  }

  function abrirSecao(titulo) {
    flushTudo();
    flushSubtitulo();
    if (emSecao) html.push("</section>");
    html.push('<section class="manual-sec">');
    html.push("<h4>" + escaparManualHtml(titulo) + "</h4>");
    emSecao = true;
  }

  while (i < linhas.length) {
    const raw = linhas[i];
    const trim = String(raw).trim();
    i++;

    if (!trim) {
      flushTudo();
      continue;
    }

    if (ehLinhaRegua(raw)) {
      flushTudo();
      flushSubtitulo();
      while (i < linhas.length && !String(linhas[i]).trim()) i++;
      if (i < linhas.length && !ehLinhaRegua(linhas[i])) {
        const titulo = String(linhas[i]).trim();
        i++;
        while (i < linhas.length && ehLinhaRegua(linhas[i])) i++;
        if (titulo) abrirSecao(titulo);
      }
      continue;
    }

    const mNum = raw.match(/^\s*(\d+)\.\s+(.*)$/);
    const mBul = raw.match(/^\s*[•·●▪]\s+(.*)$/);
    if (mNum || mBul) {
      flushParagrafo();
      flushDefs();
      flushSubtitulo();
      const ol = !!mNum;
      if (lista.length && listaOl !== ol) flushLista();
      listaOl = ol;
      let item = (mNum ? mNum[2] : mBul[1]).trim();
      while (i < linhas.length) {
        const prox = linhas[i];
        const pt = String(prox).trim();
        if (!pt || ehLinhaRegua(prox) || ehItemLista(prox) || ehLinhaDefinicao(prox)) break;
        if (/^\s{2,}\S/.test(prox)) {
          item += " " + pt;
          i++;
          continue;
        }
        break;
      }
      lista.push(item);
      continue;
    }

    if (ehLinhaDefinicao(raw)) {
      flushLista();
      flushParagrafo();
      flushSubtitulo();
      const m = raw.match(/^\s{2,}(\S.+?)\s{2,}(\S.+)$/);
      if (m) defs.push({ k: m[1].trim(), v: m[2].trim() });
      continue;
    }

    const soTituloCurto =
      trim.length <= 40 &&
      !/[.!?…]$/.test(trim) &&
      !/^\d+\./.test(trim) &&
      i < linhas.length &&
      (ehItemLista(linhas[i]) ||
        (!String(linhas[i]).trim() && i + 1 < linhas.length && ehItemLista(linhas[i + 1])));

    if (soTituloCurto && /^\S/.test(raw)) {
      flushTudo();
      subtituloPendente = trim;
      continue;
    }

    flushLista();
    flushDefs();
    flushSubtitulo();
    paragrafo.push(trim);
  }

  flushTudo();
  flushSubtitulo();
  if (emSecao) html.push("</section>");
  return html.join("");
}

function renderListaManuais() {
  const box = document.getElementById("manuaisLista");
  if (!box) return;
  const lista = typeof MANUAIS !== "undefined" && Array.isArray(MANUAIS) ? MANUAIS : [];
  box.innerHTML = "";
  if (!lista.length) {
    const p = document.createElement("p");
    p.className = "manuais-vazio";
    p.textContent = "Nenhum manual cadastrado ainda.";
    box.appendChild(p);
    return;
  }
  lista.forEach((item) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "manual-item";
    const temLink = item.tipo === "link" && item.url && String(item.url).trim();
    const temPagina = item.tipo === "pagina" && item.pagina;
    if (item.tipo === "link" && !temLink) btn.classList.add("manual-item-off");

    const tit = document.createElement("strong");
    tit.textContent = item.titulo || "Manual";
    const desc = document.createElement("span");
    desc.textContent =
      item.descricao ||
      (temPagina
        ? "Abrir manual com imagens"
        : temLink
          ? "Abrir link"
          : item.tipo === "link"
            ? "Link ainda não configurado"
            : "Abrir texto");
    btn.appendChild(tit);
    btn.appendChild(desc);
    btn.addEventListener("click", () => abrirManualItem(item));
    box.appendChild(btn);
  });
}

async function abrirManualItem(item) {
  if (!item) return;
  if (item.tipo === "pagina") {
    const pagina = (item.pagina || "").trim();
    if (!pagina) {
      alert("Página do manual não configurada.");
      return;
    }
    try {
      sessionStorage.setItem("brube_skip_splash", "1");
    } catch (e) {}
    window.location.href = pagina;
    return;
  }
  if (item.tipo === "link") {
    const url = (item.url || "").trim();
    if (!url) {
      alert("Este manual ainda não tem link. Quando o PDF estiver pronto, cole a URL em js/manuais-config.js");
      return;
    }
    await abrirUrlExterna(url);
    return;
  }
  if (item.tipo === "arquivo") {
    await abrirManualArquivo(item);
    return;
  }
  if (item.tipo === "texto" && item.texto) {
    mostrarManualTexto(item.titulo || "Manual", item.texto);
  }
}

async function abrirUrlExterna(url) {
  try {
    const Browser = window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.Browser;
    if (Browser && typeof Browser.open === "function") {
      await Browser.open({ url: url });
      return;
    }
  } catch (e) {}
  window.open(url, "_blank", "noopener,noreferrer");
}

async function abrirManualArquivo(item) {
  const titulo = item.titulo || "Manual";
  const arquivo = item.arquivo || "README-APP.txt";
  try {
    const res = await fetch(arquivo, { cache: "no-store" });
    if (!res.ok) throw new Error("falha");
    const texto = await res.text();
    mostrarManualTexto(titulo, texto);
  } catch (e) {
    alert("Não foi possível abrir o manual. Verifique se o arquivo " + arquivo + " está no app.");
  }
}

function mostrarManualTexto(titulo, texto) {
  const tit = document.getElementById("manualTextoTitulo");
  const body = document.getElementById("manualTextoBody");
  const modal = document.getElementById("manualTextoModal");
  if (tit) tit.textContent = titulo;
  if (body) {
    body.className = "manual-texto-body";
    body.innerHTML = formatarManualComoHtml(texto);
    body.scrollTop = 0;
  }
  if (modal) modal.hidden = false;
}

document.addEventListener("click", (e) => {
  const m1 = document.getElementById("manuaisModal");
  if (m1 && e.target === m1) fecharManuais();
  const m2 = document.getElementById("manualTextoModal");
  if (m2 && e.target === m2) fecharManualTexto();
});
