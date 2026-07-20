const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.join(__dirname, "..");
const outDir = path.join(root, "videos");
const W = 1080;
const H = 1920;
const SEC_POR_TELA = 2.6;
const SEC_TITULO = 2.4;

function acharFfmpeg() {
  const tentativas = [
    "ffmpeg",
    path.join(
      process.env.LOCALAPPDATA || "",
      "Microsoft",
      "WinGet",
      "Packages",
      "Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe",
      "ffmpeg-8.1.2-full_build",
      "bin",
      "ffmpeg.exe"
    )
  ];
  for (const c of tentativas) {
    const r = spawnSync(c, ["-version"], { encoding: "utf8" });
    if (r.status === 0) return c;
  }
  throw new Error("FFmpeg nao encontrado.");
}

const ffmpeg = acharFfmpeg();

const videos = [
  {
    arquivo: "01-Calculadora.mp4",
    titulo: "Calculadora",
    subtitulo: "Calcule custos e precos",
    pasta: "img/manual-calculadora",
    arquivos: [
      "01-inicio-calculadora.jpeg",
      "02-preencher-dados.jpeg",
      "03-extras-calcular.jpeg",
      "04-resultado-calculo.jpeg"
    ]
  },
  {
    arquivo: "02-Orcamento.mp4",
    titulo: "Orcamento",
    subtitulo: "Monte e compartilhe o PDF",
    pasta: "img/manual-orcamento",
    arquivos: [
      "01-inicio-orcamento.jpeg",
      "02-tela-orcamento.jpeg",
      "03-adicionar-catalogo.jpeg",
      "04-itens-quantidade.jpeg",
      "05-totais-pdf.jpeg",
      "06-pdf-orcamento.jpeg"
    ]
  },
  {
    arquivo: "03-Catalogo.mp4",
    titulo: "Catalogo",
    subtitulo: "Cadastre e compartilhe pecas",
    pasta: "img/manual-catalogo",
    arquivos: [
      "01-inicio-catalogo.jpeg",
      "02-novo-produto.jpeg",
      "03-ajustar-foto.jpeg",
      "04-produto-preenchido.jpeg",
      "05-salvar-produto.jpeg",
      "06-lista-catalogo.jpeg",
      "07-menu-arquivo.jpeg",
      "08-compartilhar-catalogo.jpeg",
      "10-selecionar-pecas.jpeg",
      "12-pesquisar-nome.jpeg"
    ]
  },
  {
    arquivo: "04-Configuracoes.mp4",
    titulo: "Configuracoes",
    subtitulo: "Empresa, valores e perfil",
    pasta: "img/manual-config",
    arquivos: [
      "01-inicio-configuracoes.jpeg",
      "02-config-logo-contato.jpeg",
      "03-config-preenchido.jpeg",
      "04-valores-calculo.jpeg",
      "05-salvar-config.jpeg",
      "06-perfil-exportar.jpeg",
      "07-inicio-apos-salvar.png"
    ]
  }
];

function gerarTituloPng(destino, titulo, subtitulo) {
  const ps = `
Add-Type -AssemblyName System.Drawing
$bmp = New-Object System.Drawing.Bitmap ${W},${H}
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::FromArgb(15,23,42))
$g.SmoothingMode = 'AntiAlias'
$g.TextRenderingHint = 'ClearTypeGridFit'
$fontBrand = New-Object System.Drawing.Font('Segoe UI', 28, [System.Drawing.FontStyle]::Bold)
$fontTitle = New-Object System.Drawing.Font('Segoe UI', 42, [System.Drawing.FontStyle]::Bold)
$fontSub = New-Object System.Drawing.Font('Segoe UI', 18, [System.Drawing.FontStyle]::Regular)
$brushWhite = [System.Drawing.Brushes]::White
$brushBlue = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(96,165,250))
$brushGray = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(203,213,225))
$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center
$g.DrawString('Brube Calc', $fontBrand, $brushWhite, (New-Object System.Drawing.RectangleF(40,580,1000,80)), $sf)
$g.DrawString('${titulo.replace(/'/g, "''")}', $fontTitle, $brushBlue, (New-Object System.Drawing.RectangleF(40,700,1000,100)), $sf)
$g.DrawString('${subtitulo.replace(/'/g, "''")}', $fontSub, $brushGray, (New-Object System.Drawing.RectangleF(40,820,1000,60)), $sf)
$bmp.Save('${destino.replace(/'/g, "''")}', [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
`;
  const r = spawnSync(
    "powershell",
    ["-NoProfile", "-Command", ps],
    { encoding: "utf8" }
  );
  if (r.status !== 0 || !fs.existsSync(destino)) {
    console.error(r.stderr || r.stdout);
    throw new Error("Falha ao gerar titulo: " + destino);
  }
}

function scalePad(labelIn, labelOut) {
  return (
    "[" +
    labelIn +
    "]scale=" +
    W +
    ":" +
    H +
    ":force_original_aspect_ratio=decrease," +
    "pad=" +
    W +
    ":" +
    H +
    ":(ow-iw)/2:(oh-ih)/2:color=0x0f172a," +
    "setsar=1,fps=30,format=yuv420p[" +
    labelOut +
    "]"
  );
}

function gerarVideo(cfg) {
  const tmpDir = path.join(outDir, "_tmp_" + path.parse(cfg.arquivo).name);
  fs.mkdirSync(tmpDir, { recursive: true });
  const tituloPng = path.join(tmpDir, "titulo.png");
  gerarTituloPng(tituloPng, cfg.titulo, cfg.subtitulo);

  const imgs = [tituloPng].concat(
    cfg.arquivos.map((n) => path.join(root, cfg.pasta, n))
  );
  for (let i = 1; i < imgs.length; i++) {
    if (!fs.existsSync(imgs[i])) throw new Error("Imagem ausente: " + imgs[i]);
  }

  const inputs = [];
  const durs = [];
  imgs.forEach((img, i) => {
    const dur = i === 0 ? SEC_TITULO : SEC_POR_TELA;
    durs.push(dur);
    inputs.push("-loop", "1", "-t", String(dur), "-i", img);
  });

  const filters = [];
  const labels = [];
  for (let i = 0; i < imgs.length; i++) {
    const out = "v" + i;
    filters.push(scalePad(String(i) + ":v", out));
    labels.push("[" + out + "]");
  }
  filters.push(labels.join("") + "concat=n=" + imgs.length + ":v=1:a=0[vout]");

  const outPath = path.join(outDir, cfg.arquivo);
  const args = ["-y"]
    .concat(inputs)
    .concat([
      "-filter_complex",
      filters.join(";"),
      "-map",
      "[vout]",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      outPath
    ]);

  console.log("Gerando " + cfg.arquivo + "...");
  const r = spawnSync(ffmpeg, args, {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024
  });
  if (r.status !== 0) {
    console.error((r.stderr || "").slice(-2500));
    throw new Error("Falha ao gerar " + cfg.arquivo);
  }

  fs.rmSync(tmpDir, { recursive: true, force: true });
  const sec = durs.reduce((a, b) => a + b, 0);
  console.log("  OK (~" + sec.toFixed(1) + "s)");
}

fs.mkdirSync(outDir, { recursive: true });
videos.forEach(gerarVideo);
console.log("\nVideos em: " + outDir);
