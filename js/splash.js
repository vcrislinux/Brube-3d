(() => {
  function isApp() {
    return !!(window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform());
  }

  async function esconderNativa() {
    try {
      const Splash = window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.SplashScreen;
      if (Splash && typeof Splash.hide === "function") {
        await Splash.hide({ fadeOutDuration: 0 });
      }
    } catch (e) {}
  }

  function devePularSplash() {
    try {
      if (sessionStorage.getItem("brube_skip_splash") === "1") {
        sessionStorage.removeItem("brube_skip_splash");
        return true;
      }
    } catch (e) {}
    return false;
  }

  function init() {
    const splash = document.getElementById("appSplash");
    if (!splash) return;

    if (!isApp() || devePularSplash() || document.documentElement.classList.contains("skip-splash")) {
      try {
        sessionStorage.removeItem("brube_skip_splash");
      } catch (e) {}
      document.documentElement.classList.remove("skip-splash");
      splash.hidden = true;
      document.body.classList.remove("splash-open");
      esconderNativa();
      return;
    }

    splash.hidden = false;
    splash.classList.remove("splash-out");
    document.body.classList.add("splash-open");
    const credit = document.getElementById("splashCredit");
    if (credit) {
      const ver = typeof APP_VERSAO === "string" ? APP_VERSAO : "1.0.0";
      credit.textContent = "Desenvolvido por Cristiano Vieira - Brube Calc - Versão: " + ver;
    }
    esconderNativa();

    setTimeout(() => {
      splash.classList.add("splash-out");
      setTimeout(() => {
        splash.hidden = true;
        document.body.classList.remove("splash-open");
      }, 450);
    }, 5000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
