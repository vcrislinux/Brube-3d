function gerarDocPDF() {
  const jsPDFRef = window.jspdf && window.jspdf.jsPDF;
  if (!jsPDFRef) throw new Error("jsPDF não carregado");
  const doc = new jsPDFRef({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = margin;

  const cfg = typeof CONFIG !== "undefined" ? CONFIG : {};
  const val = (id) => {
    const e = document.getElementById(id);
    if (!e) return "";
    return e.value !== undefined && e.tagName !== "SPAN" && e.tagName !== "B" ? e.value : e.textContent;
  };
  const txt = (id) => {
    const e = document.getElementById(id);
    return e ? e.textContent.trim() : "";
  };
  const quebra = (extra) => {
    if (y + (extra || 0) > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const formatoImg = (src) => {
    if (!src || typeof src !== "string") return "JPEG";
    if (src.indexOf("image/png") >= 0) return "PNG";
    if (src.indexOf("image/webp") >= 0) return "WEBP";
    return "JPEG";
  };

  const desenharFotoItem = (src, x, top, maxW, maxH) => {
    if (!src) return { w: 0, h: 0 };
    try {
      const props = doc.getImageProperties(src);
      let w = maxW;
      let h = (props.height / props.width) * w;
      if (h > maxH) {
        h = maxH;
        w = (props.width / props.height) * h;
      }
      const ox = x + (maxW - w) / 2;
      const oy = top + (maxH - h) / 2;
      doc.addImage(src, formatoImg(src), ox, oy, w, h);
      return { w: maxW, h: maxH };
    } catch (e) {
      return { w: 0, h: 0 };
    }
  };

  if (cfg.logo) {
    try {
      const props = doc.getImageProperties(cfg.logo);
      const w = 26;
      const h = (props.height / props.width) * w;
      doc.addImage(cfg.logo, "PNG", margin, y, w, h);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      if (cfg.empresa) doc.text(cfg.empresa, margin + w + 6, y + h / 2);
      y += Math.max(h, 14) + 6;
    } catch (e) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      if (cfg.empresa) doc.text(cfg.empresa, margin, y + 4);
      y += 12;
    }
  } else if (cfg.empresa) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(cfg.empresa, margin, y + 4);
    y += 12;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("Orçamento", margin, y);
  const dataStr = txt("data");
  if (dataStr) doc.text("Data: " + dataStr, pageW - margin, y, { align: "right" });
  y += 5;
  doc.setDrawColor(210);
  doc.line(margin, y, pageW - margin, y);
  y += 9;

  const linhas = [];
  const push = (k, v) => {
    if (v) linhas.push([k, String(v)]);
  };
  push("Cliente", val("cliente"));
  push("Prazo de entrega", val("prazo"));

  const itensOrc =
    typeof window.obterItensOrcamento === "function" ? window.obterItensOrcamento() : null;

  if (!itensOrc || !itensOrc.length) {
    push("Peça", val("peca"));
    push("Material / Cor", val("material"));
    push("Quantidade", txt("qtd") || txt("qtdOut"));
  }

  doc.setFontSize(12);
  linhas.forEach(([k, v]) => {
    quebra(8);
    doc.setFont("helvetica", "bold");
    doc.text(k + ":", margin, y);
    doc.setFont("helvetica", "normal");
    const valorTxt = doc.splitTextToSize(v, pageW - margin * 2 - 48);
    doc.text(valorTxt, margin + 48, y);
    y += Math.max(7, valorTxt.length * 5);
  });
  y += 3;

  if (!itensOrc || !itensOrc.length) {
    const fotoSrc =
      typeof obterFotoOrcamento === "function"
        ? obterFotoOrcamento()
        : (() => {
            const el = document.getElementById("orc_foto_preview");
            return el && !el.hidden && el.src ? el.src : "";
          })();
    if (fotoSrc) {
      const lado = 38;
      quebra(lado + 6);
      const desenho = desenharFotoItem(fotoSrc, margin, y, lado, lado);
      if (desenho.h > 0) {
        doc.setDrawColor(220);
        doc.roundedRect(margin, y, lado, lado, 2, 2);
      }
      y += lado + 6;
    }
  }

  if (itensOrc && itensOrc.length) {
    const moedaPdf = (n) =>
      (Number(n) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const colFoto = 20;
    const colQtd = 16;
    const colUnit = 30;
    const colTotal = 32;
    const gapCols = 2.5;
    const xFoto = margin;
    const xDesc = margin + colFoto + gapCols;
    const xTotal = pageW - margin - colTotal;
    const xUnit = xTotal - gapCols - colUnit;
    const xQtd = xUnit - gapCols - colQtd;
    const descW = Math.max(36, xQtd - xDesc - gapCols);

    quebra(14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(20);
    doc.text("Itens", margin, y);
    y += 6;

    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(210);
    doc.roundedRect(margin, y, pageW - margin * 2, 8, 1.5, 1.5, "FD");
    doc.setFontSize(8);
    doc.setTextColor(70);
    doc.text("Foto", xFoto + 1, y + 5.3);
    doc.text("Descrição", xDesc, y + 5.3);
    doc.text("Qtd", xQtd + colQtd, y + 5.3, { align: "right" });
    doc.text("Valor por peça", xUnit + colUnit, y + 5.3, { align: "right" });
    doc.text("Valor total", xTotal + colTotal, y + 5.3, { align: "right" });
    y += 11;

    itensOrc.forEach((it, idx) => {
      const nome = idx + 1 + ". " + (it.nome || "Item");
      const meta = (it.material || "").trim();
      const obs = (it.obs || "").trim();
      const qtdItem = it.qtd || 1;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      const nomeLines = doc.splitTextToSize(nome, descW);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      const metaLines = meta ? doc.splitTextToSize(meta, descW) : [];
      const obsLines = obs ? doc.splitTextToSize(obs, descW) : [];
      const textH =
        nomeLines.length * 4 +
        metaLines.length * 3.6 +
        obsLines.length * 3.5 +
        2;
      const rowH = Math.max(colFoto + 4, textH + 4);
      quebra(rowH + 4);
      const y0 = y;

      if (idx > 0) {
        doc.setDrawColor(230);
        doc.line(margin, y0 - 2, pageW - margin, y0 - 2);
      }

      if (it.foto) {
        const desenho = desenharFotoItem(it.foto, xFoto, y0, colFoto, colFoto);
        if (desenho.h > 0) {
          doc.setDrawColor(220);
          doc.roundedRect(xFoto, y0, colFoto, colFoto, 2, 2);
        }
      } else {
        doc.setDrawColor(220);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(xFoto, y0, colFoto, colFoto, 2, 2, "FD");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(150);
        doc.text("-", xFoto + colFoto / 2, y0 + colFoto / 2 + 1, { align: "center" });
      }

      let ty = y0 + 4;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(20);
      doc.text(nomeLines, xDesc, ty);
      ty += nomeLines.length * 4;
      if (metaLines.length) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(90);
        doc.text(metaLines, xDesc, ty);
        ty += metaLines.length * 3.6;
      }
      if (obsLines.length) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(7.5);
        doc.setTextColor(100);
        doc.text(obsLines, xDesc, ty);
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(30);
      doc.text(String(qtdItem), xQtd + colQtd, y0 + 8, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(moedaPdf(it.unit), xUnit + colUnit, y0 + 8, { align: "right" });
      doc.setFont("helvetica", "bold");
      doc.text(moedaPdf(it.subtotal), xTotal + colTotal, y0 + 8, { align: "right" });

      y = y0 + rowH + 3;
      doc.setTextColor(0);
    });
    y += 2;
  }

  const total = txt("valor") || txt("valorTotal") || "R$ 0,00";
  const unit = txt("valorUnit") || "";
  const qtdTotal = txt("qtd") || txt("qtdOut") || "";
  quebra(26);
  doc.setDrawColor(29, 78, 216);
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(margin, y, pageW - margin * 2, 22, 3, 3, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90);
  if (itensOrc && itensOrc.length) {
    doc.text("Qtd. total de peças", margin + 6, y + 8);
    doc.text("Valor total", pageW - margin - 6, y + 8, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(20);
    doc.text(String(qtdTotal || "0"), margin + 6, y + 16);
    doc.text(total, pageW - margin - 6, y + 16, { align: "right" });
  } else {
    doc.text("Valor por peça", margin + 6, y + 8);
    doc.text("Valor total", pageW - margin - 6, y + 8, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(20);
    doc.text(unit || "R$ 0,00", margin + 6, y + 16);
    doc.text(total, pageW - margin - 6, y + 16, { align: "right" });
  }
  doc.setTextColor(0);
  y += 30;

  const obs = val("obs");
  if (obs && obs.trim()) {
    quebra(14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Observações:", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const wrapped = doc.splitTextToSize(obs.trim(), pageW - margin * 2);
    wrapped.forEach((linha) => {
      quebra(6);
      doc.text(linha, margin, y);
      y += 6;
    });
    y += 4;
  }

  const contatos = [];
  if (cfg.banco) contatos.push(["Banco:", cfg.banco]);
  if (cfg.pixNome) contatos.push(["Titular da Conta:", cfg.pixNome]);
  if (cfg.pixChave) contatos.push(["Chave Pix:", cfg.pixChave]);
  if (cfg.instagram) contatos.push(["Instagram:", cfg.instagram]);
  if (cfg.responsaveis) contatos.push(["Responsáveis:", cfg.responsaveis]);
  if (cfg.whatsapp) contatos.push(["Whatsapp:", cfg.whatsapp]);

  if (contatos.length) {
    quebra(12);
    doc.setDrawColor(210);
    doc.line(margin, y, pageW - margin, y);
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Pagamento", margin, y);
    y += 7;
    doc.setFontSize(11);
    contatos.forEach(([k, v]) => {
      quebra(6);
      doc.setFont("helvetica", "bold");
      doc.text(k, margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(String(v), margin + 40, y);
      y += 6;
    });
  }

  return doc;
}

function nomeArquivoPDF() {
  const cliente = (document.getElementById("cliente") || {}).value || "";
  const d = new Date();
  const hoje = String(d.getDate()).padStart(2, "0") + "-" +
    String(d.getMonth() + 1).padStart(2, "0") + "-" + d.getFullYear();
  const base = cliente ? "orcamento-" + cliente.trim().replace(/[^\w\-]+/g, "_") : "orcamento";
  return base + "-" + hoje + ".pdf";
}

async function salvarOuCompartilharPDF() {
  if (typeof prepararCatalogoAntesDoPDF === "function") {
    const okCat = await prepararCatalogoAntesDoPDF();
    if (!okCat) return;
  }

  let doc;
  try {
    doc = gerarDocPDF();
  } catch (e) {
    alert("Não foi possível gerar o PDF.");
    return;
  }
  const nome = nomeArquivoPDF();
  const isNative = !!(window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform());

  if (!isNative) {
    doc.save(nome);
    return;
  }

  try {
    const base64 = doc.output("datauristring").split(",")[1];
    const Filesystem = Capacitor.Plugins.Filesystem;
    const Share = Capacitor.Plugins.Share;
    const escrito = await Filesystem.writeFile({
      path: nome,
      data: base64,
      directory: "CACHE"
    });
    await Share.share({
      title: "Orçamento",
      text: "Segue o orçamento.",
      files: [escrito.uri],
      dialogTitle: "Compartilhar orçamento"
    });
  } catch (e) {
    if (e && String(e.message || e).toLowerCase().indexOf("cancel") >= 0) return;
    alert("Não foi possível compartilhar o PDF.");
  }
}

function gerarDocCatalogoPDF(itens) {
  const jsPDFRef = window.jspdf && window.jspdf.jsPDF;
  if (!jsPDFRef) throw new Error("jsPDF não carregado");
  const lista = Array.isArray(itens) ? itens : [];
  if (!lista.length) throw new Error("Catálogo vazio");

  const doc = new jsPDFRef({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = margin;

  const cfg = typeof CONFIG !== "undefined" ? CONFIG : {};
  const quebra = (extra) => {
    if (y + (extra || 0) > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };
  const formatoImg = (src) => {
    if (!src || typeof src !== "string") return "JPEG";
    if (src.indexOf("image/png") >= 0) return "PNG";
    if (src.indexOf("image/webp") >= 0) return "WEBP";
    return "JPEG";
  };
  const desenharFoto = (src, x, top, maxW, maxH) => {
    if (!src) return false;
    try {
      const props = doc.getImageProperties(src);
      let w = maxW;
      let h = (props.height / props.width) * w;
      if (h > maxH) {
        h = maxH;
        w = (props.width / props.height) * h;
      }
      doc.addImage(src, formatoImg(src), x + (maxW - w) / 2, top + (maxH - h) / 2, w, h);
      return true;
    } catch (e) {
      return false;
    }
  };
  const moedaPdf = (n) =>
    (Number(n) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (cfg.logo) {
    try {
      const props = doc.getImageProperties(cfg.logo);
      const w = 26;
      const h = (props.height / props.width) * w;
      doc.addImage(cfg.logo, "PNG", margin, y, w, h);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      if (cfg.empresa) doc.text(cfg.empresa, margin + w + 6, y + h / 2);
      y += Math.max(h, 14) + 6;
    } catch (e) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      if (cfg.empresa) doc.text(cfg.empresa, margin, y + 4);
      y += 12;
    }
  } else if (cfg.empresa) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(cfg.empresa, margin, y + 4);
    y += 12;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("Catálogo de peças", margin, y);
  const d = new Date();
  const dataStr =
    String(d.getDate()).padStart(2, "0") +
    "/" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "/" +
    d.getFullYear();
  doc.text(dataStr, pageW - margin, y, { align: "right" });
  y += 5;
  doc.setDrawColor(210);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90);
  doc.text(lista.length + (lista.length === 1 ? " peça disponível" : " peças disponíveis"), margin, y);
  doc.setTextColor(0);
  y += 8;

  const colFoto = 28;
  const descW = pageW - margin * 2 - colFoto - 6;

  lista.forEach((p, idx) => {
    const nome = (p && p.nome) || "Sem nome";
    const meta = [p.material || "", p.cores || ""].filter(Boolean).join(" · ");
    const detalhes = ((p && p.detalhes) || "").trim();
    const foto = (p && (p.foto || (p.fotos && p.fotos[0]))) || "";
    const preco = p && p.venda != null && p.venda !== "" ? moedaPdf(p.venda) : "";

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    const nomeLines = doc.splitTextToSize(idx + 1 + ". " + nome, descW);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const metaLines = meta ? doc.splitTextToSize(meta, descW) : [];
    const detLines = detalhes ? doc.splitTextToSize(detalhes, descW) : [];
    const textH =
      nomeLines.length * 5 +
      metaLines.length * 4 +
      detLines.length * 3.8 +
      (preco ? 5 : 0) +
      2;
    const rowH = Math.max(colFoto + 4, textH + 4);
    quebra(rowH + 4);
    const y0 = y;

    if (idx > 0) {
      doc.setDrawColor(230);
      doc.line(margin, y0 - 2, pageW - margin, y0 - 2);
    }

    if (foto && desenharFoto(foto, margin, y0, colFoto, colFoto)) {
      doc.setDrawColor(220);
      doc.roundedRect(margin, y0, colFoto, colFoto, 2, 2);
    } else {
      doc.setDrawColor(220);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, y0, colFoto, colFoto, 2, 2, "FD");
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text("-", margin + colFoto / 2, y0 + colFoto / 2 + 1, { align: "center" });
      doc.setTextColor(0);
    }

    let ty = y0 + 4;
    const xDesc = margin + colFoto + 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(20);
    doc.text(nomeLines, xDesc, ty);
    ty += nomeLines.length * 5;
    if (metaLines.length) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(90);
      doc.text(metaLines, xDesc, ty);
      ty += metaLines.length * 4;
    }
    if (detLines.length) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(detLines, xDesc, ty);
      ty += detLines.length * 3.8;
    }
    if (preco) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(29, 78, 216);
      doc.text(preco, xDesc, ty + 4);
    }
    doc.setTextColor(0);
    y = y0 + rowH + 3;
  });

  return doc;
}

function nomeArquivoCatalogoPDF() {
  const d = new Date();
  const hoje =
    String(d.getDate()).padStart(2, "0") +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    d.getFullYear();
  const emp =
    typeof CONFIG !== "undefined" && CONFIG.empresa
      ? String(CONFIG.empresa).trim().replace(/[^\w\-]+/g, "_")
      : "";
  return (emp ? "catalogo-" + emp : "catalogo") + "-" + hoje + ".pdf";
}

async function salvarOuCompartilharCatalogoPDF(itens) {
  let doc;
  try {
    doc = gerarDocCatalogoPDF(itens);
  } catch (e) {
    alert(e && e.message === "Catálogo vazio" ? "Nenhuma peça para compartilhar." : "Não foi possível gerar o PDF.");
    return;
  }
  const nome = nomeArquivoCatalogoPDF();
  const isNative = !!(window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform());

  if (!isNative) {
    doc.save(nome);
    return;
  }

  try {
    const base64 = doc.output("datauristring").split(",")[1];
    const Filesystem = Capacitor.Plugins.Filesystem;
    const Share = Capacitor.Plugins.Share;
    const escrito = await Filesystem.writeFile({
      path: nome,
      data: base64,
      directory: "CACHE"
    });
    await Share.share({
      title: "Catálogo",
      text: "Segue o catálogo de peças disponíveis.",
      files: [escrito.uri],
      dialogTitle: "Compartilhar catálogo"
    });
  } catch (e) {
    if (e && String(e.message || e).toLowerCase().indexOf("cancel") >= 0) return;
    alert("Não foi possível compartilhar o PDF.");
  }
}
