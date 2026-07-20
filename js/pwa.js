if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

(function () {
  function isIos() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }

  function isStandalone() {
    return window.navigator.standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches;
  }

  function mostrarDicaIos() {
    if (!isIos() || isStandalone()) return;
    if (sessionStorage.getItem("brube_ios_pwa_hint") === "1") return;
    const bar = document.createElement("div");
    bar.className = "pwa-ios-hint";
    bar.innerHTML =
      "<strong>iPhone:</strong> toque em Compartilhar " +
      "<span aria-hidden=\"true\">□↑</span> e depois em " +
      "<b>Adicionar à Tela de Início</b>." +
      "<button type=\"button\" class=\"pwa-ios-hint-close\" aria-label=\"Fechar\">✕</button>";
    bar.querySelector(".pwa-ios-hint-close").addEventListener("click", () => {
      sessionStorage.setItem("brube_ios_pwa_hint", "1");
      bar.remove();
    });
    document.body.appendChild(bar);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mostrarDicaIos);
  } else {
    mostrarDicaIos();
  }
})();
