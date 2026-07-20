(() => {
  const el = (id) => document.getElementById(id);

  function isApp() {
    return !!(window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform());
  }

  function jaAtivado() {
    try {
      const d = JSON.parse(localStorage.getItem("ativacao") || "{}");
      return !!(d && d.email && d.key);
    } catch (e) {
      return false;
    }
  }

  function status(msg) {
    const s = el("ativStatus");
    if (s) s.textContent = msg || "";
  }

  function mostrarGate() {
    const g = el("ativacaoGate");
    if (g) g.hidden = false;
  }

  function esconderGate() {
    const g = el("ativacaoGate");
    if (g) g.hidden = true;
  }

  function mensagemErro(reason) {
    switch (reason) {
      case "chave_invalida":
        return "Chave inválida. Verifique e tente novamente.";
      case "limite_atingido":
        return "Esta chave já está em uso em 2 e-mails.";
      case "email_invalido":
        return "Digite um e-mail válido.";
      case "email_nao_verificado":
        return "Sua conta Google não está verificada.";
      case "dados_incompletos":
        return "Preencha a chave e o e-mail.";
      default:
        return "Não foi possível ativar. Tente novamente.";
    }
  }

  function emailValido(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
  }

  function configurarUiWeb() {
    const sub = document.querySelector("#ativacaoGate .subtitle");
    const btn = el("ativBtn");
    const emailWrap = el("ativEmailWrap");
    if (sub) {
      sub.textContent =
        "Digite sua chave de acesso e o e-mail desta ativação. Cada chave pode ser usada em até 2 e-mails.";
    }
    if (btn) btn.textContent = "Ativar";
    if (emailWrap) emailWrap.hidden = false;
  }

  function configurarUiApp() {
    const emailWrap = el("ativEmailWrap");
    if (emailWrap) emailWrap.hidden = true;
  }

  async function ativarWeb(key) {
    const email = ((el("ativEmail") && el("ativEmail").value) || "").trim().toLowerCase();
    if (!email) {
      status("Digite seu e-mail.");
      return;
    }
    if (!emailValido(email)) {
      status("Digite um e-mail válido.");
      return;
    }

    el("ativBtn").disabled = true;
    try {
      status("Validando chave...");
      let resp;
      try {
        resp = await fetch(LICENCA.ATIVACAO_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ key: key, email: email })
        });
      } catch (eNet) {
        status("Sem conexão. Verifique sua internet e tente novamente.");
        return;
      }
      const data = await resp.json();
      if (data && data.ok) {
        localStorage.setItem(
          "ativacao",
          JSON.stringify({ email: data.email || email, key: key, ts: Date.now(), modo: "email" })
        );
        status("");
        esconderGate();
      } else {
        status(mensagemErro(data && data.reason));
      }
    } catch (e) {
      status("Não foi possível validar a chave. Tente novamente.");
    } finally {
      el("ativBtn").disabled = false;
    }
  }

  async function ativarApp(key) {
    el("ativBtn").disabled = true;
    let idToken = "";
    try {
      status("Entrando com o Google...");
      const GoogleAuth = Capacitor.Plugins && Capacitor.Plugins.GoogleAuth;
      if (!GoogleAuth) {
        status("Login Google indisponível (plugin não carregado).");
        return;
      }
      let user;
      try {
        user = await GoogleAuth.signIn();
      } catch (eLogin) {
        status(erroLogin(eLogin));
        return;
      }
      idToken = user && user.authentication && user.authentication.idToken;
      if (!idToken) {
        status("Não foi possível concluir o login. Tente novamente.");
        return;
      }
    } finally {
      el("ativBtn").disabled = false;
    }

    el("ativBtn").disabled = true;
    try {
      status("Validando chave...");
      let resp;
      try {
        resp = await fetch(LICENCA.ATIVACAO_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ key: key, idToken: idToken })
        });
      } catch (eNet) {
        status("Sem conexão. Verifique sua internet e tente novamente.");
        return;
      }
      const data = await resp.json();
      if (data && data.ok) {
        localStorage.setItem(
          "ativacao",
          JSON.stringify({ email: data.email, key: key, ts: Date.now(), modo: "google" })
        );
        status("");
        esconderGate();
      } else {
        status(mensagemErro(data && data.reason));
      }
    } catch (e) {
      status("Não foi possível validar a chave. Tente novamente.");
    } finally {
      el("ativBtn").disabled = false;
    }
  }

  async function ativar() {
    const input = el("ativChave");
    const key = (input && input.value || "").trim();
    if (!key) {
      status("Digite sua chave de acesso.");
      return;
    }
    if (!LICENCA.ATIVACAO_URL || LICENCA.ATIVACAO_URL.indexOf("COLE_") === 0) {
      status("Serviço de ativação não configurado.");
      return;
    }
    if (isApp()) await ativarApp(key);
    else await ativarWeb(key);
  }

  function erroLogin(e) {
    const code = e && (e.code !== undefined ? String(e.code) : (e.message || ""));
    if (code.indexOf("12501") >= 0) return "Login cancelado.";
    if (code.indexOf("7") === 0) return "Sem conexão com a internet.";
    return "Não foi possível fazer login com o Google. Tente novamente.";
  }

  function init() {
    if (jaAtivado()) {
      esconderGate();
      return;
    }

    if (!el("ativacaoGate")) {
      const page = (location.pathname.split("/").pop() || "").toLowerCase();
      if (page && page !== "index.html" && page !== "" && page !== "/") {
        location.replace("index.html");
      }
      return;
    }

    if (isApp()) configurarUiApp();
    else configurarUiWeb();

    mostrarGate();
    const btn = el("ativBtn");
    if (btn) btn.addEventListener("click", ativar);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
