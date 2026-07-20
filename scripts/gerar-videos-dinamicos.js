const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.join(__dirname, "..");
const outDir = path.join(root, "videos");
const W = 1080;
const H = 1920;
const FPS = 30;
const SCENE_SEC = 3.2;

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
    if (spawnSync(c, ["-version"], { encoding: "utf8" }).status === 0) return c;
  }
  throw new Error("FFmpeg nao encontrado.");
}

const ffmpeg = acharFfmpeg();

const videos = [
  {
    arquivo: "01-Calculadora.mp4",
    titulo: "Calculadora",
    subtitulo: "Calcule custos e precos",
    cenas: [
      {
        img: "img/manual-calculadora/01-inicio-calculadora.jpeg",
        caption: "Toque em Calculadora",
        x: 0.28,
        y: 0.42
      },
      {
        img: "img/manual-calculadora/02-preencher-dados.jpeg",
        caption: "Preencha gramagem, tempo e lucro",
        x: 0.5,
        y: 0.48,
        tap: false
      },
      {
        img: "img/manual-calculadora/03-extras-calcular.jpeg",
        caption: "Toque em Calcular",
        x: 0.5,
        y: 0.72
      },
      {
        img: "img/manual-calculadora/04-resultado-calculo.jpeg",
        caption: "Veja custo e valor de venda",
        x: 0.5,
        y: 0.55,
        tap: false
      }
    ]
  },
  {
    arquivo: "02-Orcamento.mp4",
    titulo: "Orcamento",
    subtitulo: "Monte e compartilhe o PDF",
    cenas: [
      {
        img: "img/manual-orcamento/01-inicio-orcamento.jpeg",
        caption: "Toque em Orcamento",
        x: 0.28,
        y: 0.58
      },
      {
        img: "img/manual-orcamento/02-tela-orcamento.jpeg",
        caption: "Toque em + Adicionar do catalogo",
        x: 0.72,
        y: 0.4
      },
      {
        img: "img/manual-orcamento/03-adicionar-catalogo.jpeg",
        caption: "Marque as pecas e adicione",
        x: 0.5,
        y: 0.78
      },
      {
        img: "img/manual-orcamento/04-itens-quantidade.jpeg",
        caption: "Ajuste a quantidade com + e -",
        x: 0.78,
        y: 0.48
      },
      {
        img: "img/manual-orcamento/05-totais-pdf.jpeg",
        caption: "Toque em Gerar PDF",
        x: 0.5,
        y: 0.82
      },
      {
        img: "img/manual-orcamento/06-pdf-orcamento.jpeg",
        caption: "Pronto para enviar ao cliente",
        x: 0.5,
        y: 0.5,
        tap: false
      }
    ]
  },
  {
    arquivo: "03-Catalogo.mp4",
    titulo: "Catalogo",
    subtitulo: "Cadastre e compartilhe pecas",
    cenas: [
      {
        img: "img/manual-catalogo/01-inicio-catalogo.jpeg",
        caption: "Toque em Catalogo",
        x: 0.72,
        y: 0.42
      },
      {
        img: "img/manual-catalogo/02-novo-produto.jpeg",
        caption: "Toque em + Novo produto",
        x: 0.5,
        y: 0.22
      },
      {
        img: "img/manual-catalogo/03-ajustar-foto.jpeg",
        caption: "Ajuste a foto e aplique o corte",
        x: 0.5,
        y: 0.82
      },
      {
        img: "img/manual-catalogo/04-produto-preenchido.jpeg",
        caption: "Preencha nome, peso e tempo",
        x: 0.5,
        y: 0.55,
        tap: false
      },
      {
        img: "img/manual-catalogo/05-salvar-produto.jpeg",
        caption: "Toque em Salvar",
        x: 0.5,
        y: 0.88
      },
      {
        img: "img/manual-catalogo/06-lista-catalogo.jpeg",
        caption: "Peca salva no catalogo",
        x: 0.5,
        y: 0.45,
        tap: false
      },
      {
        img: "img/manual-catalogo/08-compartilhar-catalogo.jpeg",
        caption: "Compartilhe o catalogo em PDF",
        x: 0.72,
        y: 0.28
      }
    ]
  },
  {
    arquivo: "04-Configuracoes.mp4",
    titulo: "Configuracoes",
    subtitulo: "Empresa, valores e perfil",
    cenas: [
      {
        img: "img/manual-config/01-inicio-configuracoes.jpeg",
        caption: "Toque em Configuracoes",
        x: 0.72,
        y: 0.58
      },
      {
        img: "img/manual-config/02-config-logo-contato.jpeg",
        caption: "Escolha a logo da empresa",
        x: 0.35,
        y: 0.32
      },
      {
        img: "img/manual-config/03-config-preenchido.jpeg",
        caption: "Preencha os dados de contato",
        x: 0.5,
        y: 0.55,
        tap: false
      },
      {
        img: "img/manual-config/04-valores-calculo.jpeg",
        caption: "Defina os valores padrao do calculo",
        x: 0.5,
        y: 0.5,
        tap: false
      },
      {
        img: "img/manual-config/05-salvar-config.jpeg",
        caption: "Toque em Salvar",
        x: 0.5,
        y: 0.88
      },
      {
        img: "img/manual-config/06-perfil-exportar.jpeg",
        caption: "Perfil: exporte o backup",
        x: 0.35,
        y: 0.18
      },
      {
        img: "img/manual-config/07-inicio-apos-salvar.png",
        caption: "Tudo pronto na tela inicial",
        x: 0.5,
        y: 0.45,
        tap: false
      }
    ]
  }
];

function psEscape(s) {
  return String(s).replace(/'/g, "''");
}

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
$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center
$g.DrawString('Brube Calc', $fontBrand, [System.Drawing.Brushes]::White, (New-Object System.Drawing.RectangleF(40,580,1000,80)), $sf)
$g.DrawString('${psEscape(titulo)}', $fontTitle, (New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(96,165,250))), (New-Object System.Drawing.RectangleF(40,700,1000,100)), $sf)
$g.DrawString('${psEscape(subtitulo)}', $fontSub, (New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(203,213,225))), (New-Object System.Drawing.RectangleF(40,820,1000,60)), $sf)
$bmp.Save('${psEscape(destino)}', [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
`;
  const r = spawnSync("powershell", ["-NoProfile", "-Command", ps], { encoding: "utf8" });
  if (r.status !== 0 || !fs.existsSync(destino)) {
    throw new Error("Falha no titulo: " + (r.stderr || r.stdout || ""));
  }
}

function gerarCenaFrames(cena, framesDir, sceneIndex) {
  const imgPath = path.join(root, cena.img);
  if (!fs.existsSync(imgPath)) throw new Error("Imagem ausente: " + imgPath);
  const tap = cena.tap !== false;
  const totalFrames = Math.round(SCENE_SEC * FPS);
  const prefix = path.join(framesDir, "s" + String(sceneIndex).padStart(2, "0") + "_");

  const ps = `
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Image]::FromFile('${psEscape(imgPath)}')
$W = ${W}; $H = ${H}; $FPS = ${FPS}; $total = ${totalFrames}
$cx = ${cena.x}; $cy = ${cena.y}; $doTap = ${tap ? "$true" : "$false"}
$caption = '${psEscape(cena.caption)}'
$prefix = '${psEscape(prefix)}'

function Lerp($a,$b,$t){ return $a + ($b-$a)*$t }
function Ease($t){ if($t -le 0){return 0}; if($t -ge 1){return 1}; return [Math]::Pow($t,2)*(3-2*$t) }

$fontCap = New-Object System.Drawing.Font('Segoe UI', 22, [System.Drawing.FontStyle]::Bold)
$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center
$sf.LineAlignment = [System.Drawing.StringAlignment]::Center

for ($i = 0; $i -lt $total; $i++) {
  $t = $i / [double]$FPS
  $prog = $i / [double]($total - 1)
  $bmp = New-Object System.Drawing.Bitmap $W, $H
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'HighQuality'
  $g.InterpolationMode = 'HighQualityBicubic'
  $g.Clear([System.Drawing.Color]::FromArgb(15,23,42))

  $zoom = 1.0 + 0.14 * $prog
  $fit = [Math]::Min($W / $src.Width, $H / $src.Height)
  $dw = $src.Width * $fit * $zoom
  $dh = $src.Height * $fit * $zoom
  $focusX = Lerp 0.5 $cx (Ease $prog)
  $focusY = Lerp 0.5 $cy (Ease $prog)
  $dx = ($W / 2.0) - ($focusX * $dw)
  $dy = ($H / 2.0) - ($focusY * $dh)
  $g.DrawImage($src, [Single]$dx, [Single]$dy, [Single]$dw, [Single]$dh)

  # caption bar
  $alphaCap = if ($t -lt 0.25) { [int](255 * ($t / 0.25)) } elseif ($t -gt (${SCENE_SEC} - 0.35)) { [int](255 * ((${SCENE_SEC} - $t) / 0.35)) } else { 255 }
  if ($alphaCap -lt 0) { $alphaCap = 0 }
  if ($alphaCap -gt 255) { $alphaCap = 255 }
  $barBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb([Math]::Min(210,$alphaCap), 15, 23, 42))
  $g.FillRectangle($barBrush, 40, 1680, 1000, 110)
  $txtBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb($alphaCap, 255, 255, 255))
  $g.DrawString($caption, $fontCap, $txtBrush, (New-Object System.Drawing.RectangleF(50,1685,980,100)), $sf)

  $tapX = $dx + $cx * $dw
  $tapY = $dy + $cy * $dh

  if ($doTap) {
    $moveStart = 0.35; $moveEnd = 1.15; $tapAt = 1.25
    if ($t -ge $moveStart) {
      $mt = Ease ([Math]::Min(1.0, ($t - $moveStart) / ($moveEnd - $moveStart)))
      $fx = Lerp ($W * 0.82) $tapX $mt
      $fy = Lerp ($H * 0.88) $tapY $mt

      $pulse = 0
      if ($t -ge $tapAt) {
        $pulse = [Math]::Min(1.0, ($t - $tapAt) / 0.55)
        $r1 = 28 + 70 * $pulse
        $a1 = [int](180 * (1 - $pulse))
        if ($a1 -gt 0) {
          $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb($a1, 96, 165, 250), 5)
          $g.DrawEllipse($pen, [Single]($tapX - $r1), [Single]($tapY - $r1), [Single](2*$r1), [Single](2*$r1))
          $pen.Dispose()
        }
        $r2 = 18 + 110 * $pulse
        $a2 = [int](120 * (1 - $pulse))
        if ($a2 -gt 0) {
          $pen2 = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb($a2, 147, 197, 253), 3)
          $g.DrawEllipse($pen2, [Single]($tapX - $r2), [Single]($tapY - $r2), [Single](2*$r2), [Single](2*$r2))
          $pen2.Dispose()
        }
      }

      $scale = 1.0
      if ($t -ge $tapAt -and $t -lt $tapAt + 0.18) { $scale = 0.72 }
      elseif ($t -ge $tapAt + 0.18 -and $t -lt $tapAt + 0.35) { $scale = 0.88 }

      $rad = 34 * $scale
      $shadow = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(90, 0, 0, 0))
      $g.FillEllipse($shadow, [Single]($fx - $rad + 4), [Single]($fy - $rad + 6), [Single](2*$rad), [Single](2*$rad))
      $core = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(230, 255, 255, 255))
      $g.FillEllipse($core, [Single]($fx - $rad), [Single]($fy - $rad), [Single](2*$rad), [Single](2*$rad))
      $ring = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 37, 99, 235), 5)
      $g.DrawEllipse($ring, [Single]($fx - $rad), [Single]($fy - $rad), [Single](2*$rad), [Single](2*$rad))
      $dot = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 37, 99, 235))
      $g.FillEllipse($dot, [Single]($fx - 8*$scale), [Single]($fy - 8*$scale), [Single](16*$scale), [Single](16*$scale))
      $shadow.Dispose(); $core.Dispose(); $ring.Dispose(); $dot.Dispose()
    }
  } else {
    # highlight glow without tap
    $a = [int](90 + 80 * [Math]::Sin($prog * [Math]::PI))
    $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb($a, 96, 165, 250), 4)
    $rr = 48
    $g.DrawEllipse($pen, [Single]($tapX - $rr), [Single]($tapY - $rr), [Single](2*$rr), [Single](2*$rr))
    $pen.Dispose()
  }

  $out = $prefix + ('{0:D4}' -f $i) + '.png'
  $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose(); $barBrush.Dispose(); $txtBrush.Dispose()
}
$src.Dispose()
$fontCap.Dispose()
`;
  const r = spawnSync("powershell", ["-NoProfile", "-Command", ps], {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024
  });
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout);
    throw new Error("Falha nas frames da cena " + sceneIndex);
  }
}

function framesTitulo(tituloPng, framesDir) {
  const n = Math.round(2.2 * FPS);
  const prefix = path.join(framesDir, "s00_");
  const ps = `
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile('${psEscape(tituloPng)}')
for ($i=0; $i -lt ${n}; $i++) {
  $bmp = New-Object System.Drawing.Bitmap ${W}, ${H}
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.Clear([System.Drawing.Color]::FromArgb(15,23,42))
  $g.DrawImage($img, 0, 0, ${W}, ${H})
  $fade = if ($i -lt 12) { $i/12.0 } elseif ($i -gt ${n}-15) { (${n}-$i)/15.0 } else { 1.0 }
  if ($fade -lt 1) {
    $a = [int](255 * (1.0 - $fade))
    $br = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb($a, 15, 23, 42))
    $g.FillRectangle($br, 0, 0, ${W}, ${H})
    $br.Dispose()
  }
  $bmp.Save(('${psEscape(prefix)}' + ('{0:D4}' -f $i) + '.png'), [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
}
$img.Dispose()
`;
  const r = spawnSync("powershell", ["-NoProfile", "-Command", ps], { encoding: "utf8" });
  if (r.status !== 0) throw new Error("Falha frames titulo");
}

function listarFrames(framesDir) {
  return fs
    .readdirSync(framesDir)
    .filter((f) => f.endsWith(".png"))
    .sort()
    .map((f) => path.join(framesDir, f));
}

function gerarVideo(cfg) {
  const tmp = path.join(outDir, "_dyn_" + path.parse(cfg.arquivo).name);
  const framesDir = path.join(tmp, "frames");
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.mkdirSync(framesDir, { recursive: true });

  const tituloPng = path.join(tmp, "titulo.png");
  console.log("  titulo...");
  gerarTituloPng(tituloPng, cfg.titulo, cfg.subtitulo);
  framesTitulo(tituloPng, framesDir);

  cfg.cenas.forEach((cena, idx) => {
    console.log("  cena " + (idx + 1) + "/" + cfg.cenas.length + ": " + cena.caption);
    gerarCenaFrames(cena, framesDir, idx + 1);
  });

  const lista = path.join(tmp, "lista.txt");
  const frames = listarFrames(framesDir);
  fs.writeFileSync(
    lista,
    frames.map((f) => "file '" + f.replace(/\\/g, "/") + "'").join("\n"),
    "utf8"
  );

  const outPath = path.join(outDir, cfg.arquivo);
  console.log("  codificando " + cfg.arquivo + "...");
  const r = spawnSync(
    ffmpeg,
    [
      "-y",
      "-f",
      "concat",
      "-safe",
      "0",
      "-r",
      String(FPS),
      "-i",
      lista,
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      outPath
    ],
    { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 }
  );
  if (r.status !== 0) {
    console.error((r.stderr || "").slice(-3000));
    throw new Error("Falha ao codificar " + cfg.arquivo);
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log("  OK " + outPath);
}

fs.mkdirSync(outDir, { recursive: true });
console.log("Gerando videos dinamicos com cliques...\n");
videos.forEach((v) => {
  console.log(">> " + v.arquivo);
  gerarVideo(v);
});
console.log("\nPronto. Pasta: " + outDir);
