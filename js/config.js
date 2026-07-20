const CONFIG_PADRAO = {
  empresa: "",
  banco: "",
  responsaveis: "",
  whatsapp: "",
  instagram: "",
  pixNome: "",
  pixChave: "",

  padroes: {
    filamento: 140,
    potencia: 300,
    kwh: 1.13,
    desgaste: 0,
    argolas: 0,
    valorEmbalagem: 0
  }
};

function carregarConfig() {
  let salvo = {};
  try {
    salvo = JSON.parse(localStorage.getItem("app_config") || "{}");
  } catch (e) {
    salvo = {};
  }
  const cfg = Object.assign({}, CONFIG_PADRAO, salvo);
  cfg.padroes = Object.assign({}, CONFIG_PADRAO.padroes, salvo.padroes || {});
  return cfg;
}

let CONFIG = carregarConfig();

function salvarConfig(novo) {
  localStorage.setItem("app_config", JSON.stringify(novo));
  CONFIG = carregarConfig();
  aplicarContato();
  aplicarLogo();
}

function restaurarConfigPadrao() {
  localStorage.removeItem("app_config");
  CONFIG = carregarConfig();
  aplicarContato();
  aplicarLogo();
}

function aplicarLogo() {
  document.querySelectorAll("img.logo-img").forEach((img) => {
    if (img.dataset.fixed === "true") return;
    if (CONFIG.logo) {
      img.src = CONFIG.logo;
      img.hidden = false;
    } else {
      img.removeAttribute("src");
      img.hidden = true;
    }
  });
  atualizarEmpresaBar();
}

function atualizarEmpresaBar() {
  const temLogo = !!CONFIG.logo;
  const temNome = !!(CONFIG.empresa && String(CONFIG.empresa).trim());
  document.querySelectorAll(".empresa-bar, .dashboard-empresa").forEach((bar) => {
    if (bar.id === "empresaBar" || bar.classList.contains("dashboard-empresa")) {
      bar.hidden = false;
      return;
    }
    bar.hidden = !(temLogo || temNome);
  });
  const vazio = document.getElementById("dashboardEmpresaVazio");
  if (vazio) vazio.hidden = temLogo || temNome;
}

function aplicarContato() {
  const map = {
    empresa: CONFIG.empresa,
    banco: CONFIG.banco,
    responsaveis: CONFIG.responsaveis,
    whatsapp: CONFIG.whatsapp,
    instagram: CONFIG.instagram,
    pixNome: CONFIG.pixNome,
    pixChave: CONFIG.pixChave
  };
  for (const id in map) {
    document.querySelectorAll('[data-config="' + id + '"]').forEach((el) => {
      el.textContent = map[id];
      if (id === "instagram" && el.tagName === "A") {
        const user = String(map[id] || "").replace(/^@/, "").trim();
        el.href = user ? "https://instagram.com/" + user : "#";
        el.target = "_blank";
        el.rel = "noopener noreferrer";
      }
    });
  }
  atualizarEmpresaBar();
}

function aplicarPadroes() {
  const p = CONFIG.padroes || {};
  for (const id in p) {
    const el = document.getElementById(id);
    if (!el) continue;
    if (el.dataset.formato === "moeda" && typeof formatarMoeda === "function") {
      el.value = formatarMoeda(p[id]);
    } else {
      el.value = p[id];
    }
  }
}

function irInicio() {
  try {
    sessionStorage.setItem("brube_skip_splash", "1");
  } catch (e) {}
  window.location.href = "index.html";
}

document.addEventListener("DOMContentLoaded", aplicarContato);
document.addEventListener("DOMContentLoaded", aplicarPadroes);
document.addEventListener("DOMContentLoaded", aplicarLogo);
