let cameraStream = null;
let cropState = null;

let fotoCropCfg = {
  galeriaId: "foto_galeria",
  podeAdicionar: function () {
    return true;
  },
  mensagemLimite: "",
  onFotoPronta: null
};

function configurarFerramentaFoto(cfg) {
  if (!cfg || typeof cfg !== "object") return;
  if (cfg.galeriaId) fotoCropCfg.galeriaId = cfg.galeriaId;
  if (typeof cfg.podeAdicionar === "function") fotoCropCfg.podeAdicionar = cfg.podeAdicionar;
  if (cfg.mensagemLimite != null) fotoCropCfg.mensagemLimite = cfg.mensagemLimite;
  if (typeof cfg.onFotoPronta === "function") fotoCropCfg.onFotoPronta = cfg.onFotoPronta;
}

function podeAdicionarFotoAgora() {
  try {
    return !!fotoCropCfg.podeAdicionar();
  } catch (e) {
    return true;
  }
}

function avisarLimiteFoto() {
  if (fotoCropCfg.mensagemLimite) alert(fotoCropCfg.mensagemLimite);
}

function escolherFonteFoto() {
  if (!podeAdicionarFotoAgora()) {
    avisarLimiteFoto();
    return;
  }
  const m = document.getElementById("fonteFotoModal");
  if (m) m.hidden = false;
}

function fecharFonteFoto() {
  const m = document.getElementById("fonteFotoModal");
  if (m) m.hidden = true;
}

function usarGaleria() {
  fecharFonteFoto();
  const input = document.getElementById(fotoCropCfg.galeriaId);
  if (input) input.click();
}

async function usarCamera() {
  fecharFonteFoto();
  if (!podeAdicionarFotoAgora()) {
    avisarLimiteFoto();
    return;
  }
  const modal = document.getElementById("cameraModal");
  const video = document.getElementById("cameraVideo");
  const status = document.getElementById("cameraStatus");
  if (!modal || !video) return;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert("Este dispositivo/navegador não permite abrir a câmera por aqui. Use a Galeria.");
    return;
  }
  modal.hidden = false;
  if (status) status.textContent = "Abrindo câmera...";
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false
    });
    video.srcObject = cameraStream;
    if (status) status.textContent = "";
  } catch (e1) {
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      video.srcObject = cameraStream;
      if (status) status.textContent = "";
    } catch (e2) {
      if (status) status.textContent = "Não foi possível acessar a câmera. Verifique a permissão do navegador.";
    }
  }
}

function fecharCamera() {
  const modal = document.getElementById("cameraModal");
  const video = document.getElementById("cameraVideo");
  if (cameraStream) {
    cameraStream.getTracks().forEach((t) => t.stop());
    cameraStream = null;
  }
  if (video) video.srcObject = null;
  if (modal) modal.hidden = true;
  const status = document.getElementById("cameraStatus");
  if (status) status.textContent = "";
}

function capturarFotoCamera() {
  const video = document.getElementById("cameraVideo");
  const canvas = document.getElementById("cameraCanvas");
  if (!video || !canvas || !video.videoWidth) {
    alert("Aguarde a câmera carregar e tente de novo.");
    return;
  }
  if (!podeAdicionarFotoAgora()) {
    avisarLimiteFoto();
    fecharCamera();
    return;
  }
  const max = 1200;
  let w = video.videoWidth;
  let h = video.videoHeight;
  if (w > max || h > max) {
    const r = Math.min(max / w, max / h);
    w = Math.round(w * r);
    h = Math.round(h * r);
  }
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d").drawImage(video, 0, 0, w, h);
  fecharCamera();
  abrirCropFoto(canvas.toDataURL("image/jpeg", 0.9));
}

function importarFotoArquivo(input) {
  if (!podeAdicionarFotoAgora()) {
    avisarLimiteFoto();
    input.value = "";
    return;
  }
  const file = input.files && input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => abrirCropFoto(reader.result);
  reader.readAsDataURL(file);
  input.value = "";
}

function abrirCropFoto(dataUrl) {
  const modal = document.getElementById("cropFotoModal");
  const img = document.getElementById("cropImg");
  const zoom = document.getElementById("cropZoom");
  if (!modal || !img) return;
  cropState = {
    dataUrl: dataUrl,
    natW: 0,
    natH: 0,
    baseScale: 1,
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
    dragging: false,
    lastX: 0,
    lastY: 0
  };
  if (zoom) zoom.value = "100";
  img.onload = () => {
    cropState.natW = img.naturalWidth;
    cropState.natH = img.naturalHeight;
    atualizarCropLayout();
  };
  img.onerror = () => {
    alert("Não foi possível ler essa imagem.");
    fecharCropFoto();
  };
  img.src = dataUrl;
  modal.hidden = false;
}

function fecharCropFoto() {
  const modal = document.getElementById("cropFotoModal");
  if (modal) modal.hidden = true;
  cropState = null;
  const img = document.getElementById("cropImg");
  if (img) img.removeAttribute("src");
}

function obterCropFrameRect(stage) {
  const sw = stage.clientWidth;
  const sh = stage.clientHeight;
  const inset = Math.round(Math.min(sw, sh) * 0.08);
  return {
    x: inset,
    y: inset,
    size: Math.min(sw, sh) - inset * 2
  };
}

function atualizarCropLayout() {
  if (!cropState || !cropState.natW) return;
  const stage = document.getElementById("cropStage");
  const img = document.getElementById("cropImg");
  if (!stage || !img) return;
  const frame = obterCropFrameRect(stage);
  cropState.baseScale = Math.max(frame.size / cropState.natW, frame.size / cropState.natH);
  aplicarCropTransform();
}

function aplicarCropTransform() {
  if (!cropState) return;
  const img = document.getElementById("cropImg");
  if (!img) return;
  const scale = cropState.baseScale * cropState.zoom;
  const w = cropState.natW * scale;
  const h = cropState.natH * scale;
  img.style.width = w + "px";
  img.style.height = h + "px";
  img.style.transform =
    "translate(calc(-50% + " + cropState.offsetX + "px), calc(-50% + " + cropState.offsetY + "px))";
}

function atualizarCropZoom() {
  if (!cropState) return;
  const zoom = document.getElementById("cropZoom");
  cropState.zoom = (parseFloat(zoom && zoom.value) || 100) / 100;
  aplicarCropTransform();
}

function iniciarCropDrag(clientX, clientY) {
  if (!cropState) return;
  cropState.dragging = true;
  cropState.lastX = clientX;
  cropState.lastY = clientY;
}

function moverCropDrag(clientX, clientY) {
  if (!cropState || !cropState.dragging) return;
  cropState.offsetX += clientX - cropState.lastX;
  cropState.offsetY += clientY - cropState.lastY;
  cropState.lastX = clientX;
  cropState.lastY = clientY;
  aplicarCropTransform();
}

function pararCropDrag() {
  if (cropState) cropState.dragging = false;
}

function salvarFotoRedimensionada(dataUrl, sx, sy, sw, sh) {
  if (!podeAdicionarFotoAgora()) return;
  const img = new Image();
  img.onload = () => {
    const max = 900;
    let w = sw;
    let h = sh;
    if (w > max || h > max) {
      const r = Math.min(max / w, max / h);
      w = Math.round(w * r);
      h = Math.round(h * r);
    }
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d").drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
    const pronta = canvas.toDataURL("image/jpeg", 0.82);
    if (typeof fotoCropCfg.onFotoPronta === "function") {
      fotoCropCfg.onFotoPronta(pronta);
    }
    fecharCropFoto();
  };
  img.onerror = () => alert("Não foi possível processar a imagem.");
  img.src = dataUrl;
}

function usarFotoSemCortar() {
  if (!cropState) return;
  salvarFotoRedimensionada(cropState.dataUrl, 0, 0, cropState.natW, cropState.natH);
}

function aplicarCropFoto() {
  if (!cropState || !cropState.natW) return;
  const stage = document.getElementById("cropStage");
  if (!stage) return;
  const frame = obterCropFrameRect(stage);
  const scale = cropState.baseScale * cropState.zoom;
  const imgLeft = stage.clientWidth / 2 + cropState.offsetX - (cropState.natW * scale) / 2;
  const imgTop = stage.clientHeight / 2 + cropState.offsetY - (cropState.natH * scale) / 2;
  let sx = (frame.x - imgLeft) / scale;
  let sy = (frame.y - imgTop) / scale;
  let sw = frame.size / scale;
  let sh = frame.size / scale;
  sx = Math.max(0, Math.min(sx, cropState.natW - 1));
  sy = Math.max(0, Math.min(sy, cropState.natH - 1));
  sw = Math.max(1, Math.min(sw, cropState.natW - sx));
  sh = Math.max(1, Math.min(sh, cropState.natH - sy));
  const side = Math.min(sw, sh);
  salvarFotoRedimensionada(cropState.dataUrl, sx, sy, side, side);
}

function ligarCropInteracao() {
  const stage = document.getElementById("cropStage");
  if (!stage || stage.dataset.cropReady) return;
  stage.dataset.cropReady = "1";
  stage.addEventListener("mousedown", (e) => {
    e.preventDefault();
    iniciarCropDrag(e.clientX, e.clientY);
  });
  window.addEventListener("mousemove", (e) => moverCropDrag(e.clientX, e.clientY));
  window.addEventListener("mouseup", pararCropDrag);
  stage.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches[0]) return;
      iniciarCropDrag(e.touches[0].clientX, e.touches[0].clientY);
    },
    { passive: true }
  );
  stage.addEventListener(
    "touchmove",
    (e) => {
      if (!e.touches[0]) return;
      e.preventDefault();
      moverCropDrag(e.touches[0].clientX, e.touches[0].clientY);
    },
    { passive: false }
  );
  stage.addEventListener("touchend", pararCropDrag);
  window.addEventListener("resize", () => {
    if (cropState && cropState.natW) atualizarCropLayout();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  ligarCropInteracao();
});

document.addEventListener("click", (e) => {
  const fonte = document.getElementById("fonteFotoModal");
  if (fonte && e.target === fonte) fecharFonteFoto();
  const cam = document.getElementById("cameraModal");
  if (cam && e.target === cam) fecharCamera();
  const crop = document.getElementById("cropFotoModal");
  if (crop && e.target === crop) fecharCropFoto();
});

document.addEventListener("keydown", (e) => {
  const crop = document.getElementById("cropFotoModal");
  if (crop && !crop.hidden && e.key === "Escape") fecharCropFoto();
});
