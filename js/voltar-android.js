(function () {
  function paginaAtual() {
    const p = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    if (!p || p === "/") return "index.html";
    return p;
  }

  function estaNaHome() {
    const p = paginaAtual();
    return p === "index.html" || p === "index.htm";
  }

  function fecharOverlayVisivel() {
    const overlays = Array.from(document.querySelectorAll(".modal-overlay")).filter((el) => el && !el.hidden);
    if (!overlays.length) return false;
    return fecharUmOverlay(overlays[overlays.length - 1]);
  }

  function fecharUmOverlay(el) {
    if (!el) return false;
    if (el.id === "ativacaoGate") return false;
    if (el.id === "appSplash") return false;

    if (el.id === "configModal" && typeof fecharConfig === "function") {
      fecharConfig();
      return true;
    }
    if (el.id === "shareSelecaoModal" && typeof fecharShareSelecao === "function") {
      fecharShareSelecao();
      return true;
    }
    if (el.id === "shareCatalogoModal" && typeof fecharCompartilharCatalogo === "function") {
      fecharCompartilharCatalogo();
      return true;
    }

    const btn = el.querySelector(".modal-close, .galeria-fechar");
    if (btn) {
      btn.click();
      return true;
    }
    el.hidden = true;
    return true;
  }

  function irParaInicio() {
    try {
      sessionStorage.setItem("brube_skip_splash", "1");
    } catch (e) {}
    if (typeof irInicio === "function") {
      irInicio();
      return;
    }
    location.href = "index.html";
  }

  async function aoVoltarAndroid() {
    if (fecharOverlayVisivel()) return;

    if (!estaNaHome()) {
      irParaInicio();
      return;
    }

    try {
      const App = window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.App;
      if (App && typeof App.exitApp === "function") {
        await App.exitApp();
        return;
      }
    } catch (e) {}
  }

  function registrar() {
    try {
      const App = window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.App;
      if (!App || typeof App.addListener !== "function") return;
      App.addListener("backButton", () => {
        aoVoltarAndroid();
      });
    } catch (e) {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", registrar);
  } else {
    registrar();
  }
})();
