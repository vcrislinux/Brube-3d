const PERFIL_TIPO = "brube-perfil";
const PERFIL_FMT = 1;

function lerJsonLocal(chave, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(chave) || "null");
    return v == null ? fallback : v;
  } catch (e) {
    return fallback;
  }
}

function montarPerfilBackup() {
  if (typeof persistirConfigFormAtual === "function") persistirConfigFormAtual();

  let catalogo = [];
  if (typeof lerCatalogoLocal === "function") catalogo = lerCatalogoLocal();
  else catalogo = lerJsonLocal("app_catalogo", []);

  let impressoras = null;
  if (typeof carregarImpressoras === "function") {
    impressoras = carregarImpressoras();
  } else {
    impressoras = lerJsonLocal("app_impressoras", { lista: [], favoritos: [] });
  }

  return {
    tipo: PERFIL_TIPO,
    formato: PERFIL_FMT,
    exportadoEm: new Date().toISOString(),
    appVersao: typeof APP_VERSAO === "string" ? APP_VERSAO : "",
    config: lerJsonLocal("app_config", {}),
    catalogo: Array.isArray(catalogo) ? catalogo : [],
    impressoras: impressoras || { lista: [], favoritos: [] },
    calcCampos: lerJsonLocal("calc_campos", {})
  };
}

function nomeArquivoPerfil() {
  const d = new Date();
  const data =
    String(d.getFullYear()) +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0");
  let empresa = "";
  try {
    const cfg = lerJsonLocal("app_config", {});
    empresa = String(cfg.empresa || "")
      .trim()
      .replace(/[^\w\-]+/g, "_")
      .slice(0, 24);
  } catch (e) {}
  return (empresa ? "brube-perfil-" + empresa + "-" : "brube-perfil-") + data + ".json";
}

async function baixarOuCompartilharJson(nome, obj, titulo) {
  const json = JSON.stringify(obj, null, 2);
  const isNative = !!(window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform());

  if (isNative) {
    if (typeof compartilharArquivoNativo === "function" && typeof textoParaBase64 === "function") {
      await compartilharArquivoNativo(nome, textoParaBase64(json), titulo, "Backup do perfil Brube Calc");
      return;
    }
    const Filesystem = Capacitor.Plugins && Capacitor.Plugins.Filesystem;
    const Share = Capacitor.Plugins && Capacitor.Plugins.Share;
    if (!Filesystem || !Share) throw new Error("plugins");
    const bytes = new TextEncoder().encode(json);
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    const escrito = await Filesystem.writeFile({
      path: nome,
      data: btoa(bin),
      directory: "CACHE"
    });
    await Share.share({
      title: titulo,
      text: "Backup do perfil Brube Calc",
      files: [escrito.uri],
      dialogTitle: titulo
    });
    return;
  }

  const blob = new Blob([json], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

async function salvarPerfil() {
  try {
    const perfil = montarPerfilBackup();
    const nome = nomeArquivoPerfil();
    await baixarOuCompartilharJson(nome, perfil, "Exportar perfil");
    const nCat = perfil.catalogo.length;
    alert(
      "Perfil exportado.\n\nInclui: configurações, logo, impressoras, calculadora e catálogo (" +
        nCat +
        " produto" +
        (nCat === 1 ? "" : "s") +
        ")."
    );
  } catch (e) {
    if (e && String(e.message || e).toLowerCase().indexOf("cancel") >= 0) return;
    alert("Não foi possível exportar o perfil.");
  }
}

function abrirPerfilMenu() {
  const m = document.getElementById("perfilModal");
  if (m) m.hidden = false;
}

function fecharPerfilMenu() {
  const m = document.getElementById("perfilModal");
  if (m) m.hidden = true;
}

async function acaoPerfil(acao) {
  fecharPerfilMenu();
  if (acao === "exportar") {
    await salvarPerfil();
    return;
  }
  if (acao === "importar") {
    escolherImportarPerfil();
  }
}

async function aplicarPerfilBackup(perfil) {
  if (!perfil || perfil.tipo !== PERFIL_TIPO) throw new Error("tipo");

  if (perfil.config && typeof perfil.config === "object") {
    localStorage.setItem("app_config", JSON.stringify(perfil.config));
    if (typeof carregarConfig === "function") {
      CONFIG = carregarConfig();
    }
  }

  if (Array.isArray(perfil.catalogo)) {
    if (typeof salvarCatalogoPersistente === "function") {
      await salvarCatalogoPersistente(perfil.catalogo);
    } else {
      localStorage.setItem("app_catalogo", JSON.stringify(perfil.catalogo));
    }
  }

  if (perfil.impressoras && typeof perfil.impressoras === "object") {
    if (typeof salvarImpressoras === "function") {
      salvarImpressoras(perfil.impressoras);
    } else {
      localStorage.setItem("app_impressoras", JSON.stringify(perfil.impressoras));
    }
  }

  if (perfil.calcCampos && typeof perfil.calcCampos === "object") {
    localStorage.setItem("calc_campos", JSON.stringify(perfil.calcCampos));
  }

  if (typeof aplicarContato === "function") aplicarContato();
  if (typeof aplicarLogo === "function") aplicarLogo();
  if (typeof aplicarPadroes === "function") aplicarPadroes();
  if (typeof preencherConfigForm === "function") preencherConfigForm();
  if (typeof atualizarDashboardEmpresa === "function") atualizarDashboardEmpresa();
  if (typeof renderCatalogo === "function") renderCatalogo();
}

function importarPerfilArquivo(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const perfil = JSON.parse(String(reader.result || "{}"));
      if (!perfil || perfil.tipo !== PERFIL_TIPO) {
        throw new Error("tipo");
      }
      const ok = confirm(
        "Importar este perfil? Isso substitui as configurações, impressoras, campos da calculadora e o catálogo atuais neste aparelho."
      );
      if (!ok) return;
      await aplicarPerfilBackup(perfil);
      const n = Array.isArray(perfil.catalogo) ? perfil.catalogo.length : 0;
      alert("Perfil importado com sucesso (" + n + " produto" + (n === 1 ? "" : "s") + " no catálogo).");
    } catch (e) {
      alert("Arquivo inválido. Selecione um brube-perfil-*.json gerado pelo app.");
    }
  };
  reader.readAsText(file);
  input.value = "";
}

function escolherImportarPerfil() {
  const input = document.getElementById("importPerfil");
  if (input) input.click();
}

document.addEventListener("click", (e) => {
  const m = document.getElementById("perfilModal");
  if (m && e.target === m) fecharPerfilMenu();
});
