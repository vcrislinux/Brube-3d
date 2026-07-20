const fs = require("fs");
const path = require("path");
const { jsPDF } = require("jspdf");

const root = path.join(__dirname, "..");
const imgDir = path.join(root, "img", "manual-instalacao");
const outPdf = path.join(root, "Manual-Instalacao-WhatsApp-BrubeCalc.pdf");

function toDataUrl(filePath) {
  const buf = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mime = ext === ".png" ? "image/png" : "image/jpeg";
  return "data:" + mime + ";base64," + buf.toString("base64");
}

function formato(src) {
  if (src.indexOf("image/png") >= 0) return "PNG";
  return "JPEG";
}

function txt(s) {
  return String(s || "")
    .replace(/[→⟶➜➔]/g, "-")
    .replace(/[—–―]/g, "-")
    .replace(/[…]/g, "...")
    .replace(/[“”„]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/•/g, "-");
}

const passos = [
  {
    titulo: "1. Receber o arquivo no WhatsApp",
    texto:
      "Voce recebera uma mensagem com o arquivo BrubeCalc-....apk. Toque no arquivo para baixar e, em seguida, toque de novo para abrir.",
    img: "01-whatsapp-apk.jpeg"
  },
  {
    titulo: "2. Encontrar a permissao no celular",
    texto:
      'Abra as Configuracoes do celular e use a busca digitando "instala". Toque em Instalar apps desconhecidos (em Seguranca e privacidade).',
    img: "02-buscar-instalar-apps.jpeg"
  },
  {
    titulo: "3. Abrir Instalar apps desconhecidos",
    texto: "Na lista de seguranca, toque em Instalar apps desconhecidos.",
    img: "03-menu-apps-desconhecidos.jpeg"
  },
  {
    titulo: "4. Permitir o WhatsApp",
    texto:
      "Na lista de apps, localize WhatsApp e ative a chave Permitir (deve ficar azul/ligada). Assim o WhatsApp pode instalar o APK.",
    img: "04-permitir-whatsapp.jpeg"
  },
  {
    titulo: "5. Abrir o arquivo no WhatsApp",
    texto:
      'Volte ao WhatsApp e abra o APK. Se aparecer o aviso "Este arquivo pode ser prejudicial", toque em Abrir arquivo (nao em Cancelar).',
    img: "05-abrir-arquivo-whatsapp.jpeg"
  },
  {
    titulo: "6. Abrir com o Instalador do pacote",
    texto:
      "Em Abrir com, escolha Instalador do pacote e toque em So uma vez (ou Sempre).",
    img: "06-abrir-instalador.jpeg"
  },
  {
    titulo: "7. Confirmar a instalacao",
    texto: 'Quando aparecer "Instalar este app?", toque em Instalar.',
    img: "07-instalar-app.jpeg"
  },
  {
    titulo: "8. Google Play Protect - Mais detalhes",
    texto:
      "O Play Protect pode bloquear o app (nao vem da Play Store). Toque em Mais detalhes. Nao use so o botao Entendi, senao a instalacao para.",
    img: "08-play-protect.jpeg"
  },
  {
    titulo: "9. Instalar assim mesmo",
    texto: "Depois de expandir os detalhes, toque em Instalar assim mesmo.",
    img: "09-instalar-assim-mesmo.jpeg"
  },
  {
    titulo: "10. Instalacao concluida",
    texto:
      "Quando aparecer que o app foi instalado, toque em Abrir (ou Concluido).",
    img: "10-instalado.jpeg"
  },
  {
    titulo: "11. Pronto para usar",
    texto:
      "O Brube Calc abre com a tela inicial do aplicativo. Em seguida aparece o pedido de chave (passo 12).",
    img: "11-app-aberto.png"
  }
];

function desenharCabecalho(doc, pageW, margin) {
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageW, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Brube Calc", margin, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(txt("Manual de instalacao do APK (via WhatsApp)"), margin, 20);
  doc.setTextColor(0, 0, 0);
  return 36;
}

function addPasso(doc, passo, pageW, pageH, margin) {
  doc.addPage();
  let y = desenharCabecalho(doc, pageW, margin);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(29, 78, 216);
  const tituloLines = doc.splitTextToSize(txt(passo.titulo), pageW - margin * 2);
  doc.text(tituloLines, margin, y);
  y += tituloLines.length * 6 + 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  const textoLines = doc.splitTextToSize(txt(passo.texto), pageW - margin * 2);
  doc.text(textoLines, margin, y);
  y += textoLines.length * 5.5 + 8;

  const dataUrl = toDataUrl(path.join(imgDir, passo.img));
  const maxW = Math.min(100, pageW - margin * 2);
  const props = doc.getImageProperties(dataUrl);
  let w = maxW;
  let h = (props.height / props.width) * w;
  const maxH = pageH - y - margin - 8;
  if (h > maxH) {
    h = maxH;
    w = (props.width / props.height) * h;
  }
  const x = (pageW - w) / 2;
  doc.setDrawColor(200);
  doc.roundedRect(x - 1, y - 1, w + 2, h + 2, 2, 2);
  doc.addImage(dataUrl, formato(dataUrl), x, y, w, h);
}

function addPaginaChave(doc, pageW, pageH, margin) {
  doc.addPage();
  let y = desenharCabecalho(doc, pageW, margin);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(29, 78, 216);
  doc.text("12. Chave de acesso", margin, y);
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  const linhas = doc.splitTextToSize(
    txt(
      "Na primeira abertura, o Brube Calc pede a Chave de acesso. Digite a chave enviada pela Equipe do Brube Calc (com os hifens) e toque em Entrar com Google e ativar."
    ),
    pageW - margin * 2
  );
  doc.text(linhas, margin, y);
  y += linhas.length * 5.5 + 6;

  const dataUrl = toDataUrl(path.join(imgDir, "12-chave-acesso.png"));
  const maxW = Math.min(90, pageW - margin * 2);
  const props = doc.getImageProperties(dataUrl);
  let w = maxW;
  let h = (props.height / props.width) * w;
  const maxH = pageH - y - margin - 28;
  if (h > maxH) {
    h = maxH;
    w = (props.width / props.height) * h;
  }
  const x = (pageW - w) / 2;
  doc.setDrawColor(200);
  doc.roundedRect(x - 1, y - 1, w + 2, h + 2, 2, 2);
  doc.addImage(dataUrl, formato(dataUrl), x, y, w, h);
  y += h + 8;

  doc.setFillColor(255, 248, 230);
  doc.setDrawColor(245, 158, 11);
  const nota = doc.splitTextToSize(
    txt(
      "Sem a chave o app nao libera o uso. Se ainda nao recebeu, entre em contato com a Equipe do Brube Calc."
    ),
    pageW - margin * 2 - 8
  );
  const boxH = nota.length * 5 + 12;
  if (y + boxH > pageH - margin) {
    doc.addPage();
    y = desenharCabecalho(doc, pageW, margin);
  }
  doc.roundedRect(margin, y, pageW - margin * 2, boxH, 3, 3, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(120, 80, 0);
  doc.text(nota, margin + 4, y + 8);
}

function gerar() {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 16;

  let y = desenharCabecalho(doc, pageW, margin);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text("Como instalar o Brube Calc", margin, y);
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(50);
  const intro = doc.splitTextToSize(
    txt(
      "Este guia mostra como instalar o aplicativo a partir do arquivo APK enviado pelo WhatsApp. O Brube Calc nao esta na Play Store; por isso o celular pede permissoes extras - isso e normal."
    ),
    pageW - margin * 2
  );
  doc.text(intro, margin, y);
  y += intro.length * 5.5 + 8;

  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(37, 99, 235);
  const aviso = doc.splitTextToSize(
    txt(
      "Importante: o arquivo oficial se chama BrubeCalc-....apk. Instale apenas o arquivo enviado pelo desenvolvedor Cristiano Vieira / Brube Calc."
    ),
    pageW - margin * 2 - 8
  );
  const avisoH = aviso.length * 5 + 12;
  doc.roundedRect(margin, y, pageW - margin * 2, avisoH, 3, 3, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(29, 78, 216);
  doc.text(aviso, margin + 4, y + 8);
  y += avisoH + 12;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text("Resumo dos passos", margin, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(40);
  const resumo = [
    "1. Abrir o APK no WhatsApp",
    "2. Configuracoes: Instalar apps desconhecidos e permitir WhatsApp",
    "3. Abrir arquivo, Instalador do pacote e Instalar",
    "4. Play Protect: Mais detalhes e Instalar assim mesmo",
    "5. Abrir o Brube Calc",
    "6. Digitar a Chave de acesso e entrar com Google para ativar"
  ];
  resumo.forEach((linha) => {
    doc.text(txt(linha), margin, y);
    y += 6;
  });

  y += 8;
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text(txt("Versao do manual: instalacao via WhatsApp - Brube Calc"), margin, y);
  doc.text("Desenvolvido por Cristiano Vieira", margin, y + 5);

  passos.forEach((p) => addPasso(doc, p, pageW, pageH, margin));
  addPaginaChave(doc, pageW, pageH, margin);

  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140);
    doc.text(txt("Brube Calc - Instalacao WhatsApp"), margin, pageH - 8);
    doc.text(String(i) + " / " + total, pageW - margin, pageH - 8, { align: "right" });
  }

  fs.writeFileSync(outPdf, Buffer.from(doc.output("arraybuffer")));
  console.log("PDF gerado: " + outPdf);
}

gerar();
