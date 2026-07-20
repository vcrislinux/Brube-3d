const CAT_KEY = "app_catalogo";
const CAT_FILE = "BrubeCalc/catalogo.json";

function isAppNativo() {
  return !!(window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform());
}

function lerCatalogoLocal() {
  try {
    const lista = JSON.parse(localStorage.getItem(CAT_KEY) || "[]");
    return Array.isArray(lista) ? lista : [];
  } catch (e) {
    return [];
  }
}

function gravarCatalogoLocal(lista) {
  localStorage.setItem(CAT_KEY, JSON.stringify(lista));
}

async function gravarCatalogoArquivo(lista) {
  const json = JSON.stringify(lista);
  if (isAppNativo()) {
    const Filesystem = Capacitor.Plugins && Capacitor.Plugins.Filesystem;
    if (!Filesystem) return;
    await Filesystem.mkdir({
      path: "BrubeCalc",
      directory: "DOCUMENTS",
      recursive: true
    }).catch(() => {});
    await Filesystem.writeFile({
      path: CAT_FILE,
      data: json,
      directory: "DOCUMENTS",
      encoding: "utf8"
    });
    return;
  }
  if (window.__brubeCatHandle && (await verificarPermissaoHandle(window.__brubeCatHandle))) {
    const writable = await window.__brubeCatHandle.createWritable();
    await writable.write(json);
    await writable.close();
  }
}

async function lerCatalogoArquivo() {
  if (isAppNativo()) {
    const Filesystem = Capacitor.Plugins && Capacitor.Plugins.Filesystem;
    if (!Filesystem) return null;
    try {
      const lido = await Filesystem.readFile({
        path: CAT_FILE,
        directory: "DOCUMENTS",
        encoding: "utf8"
      });
      const lista = JSON.parse(lido.data || "[]");
      return Array.isArray(lista) ? lista : null;
    } catch (e) {
      return null;
    }
  }
  if (window.__brubeCatHandle) {
    try {
      const file = await window.__brubeCatHandle.getFile();
      const txt = await file.text();
      const lista = JSON.parse(txt || "[]");
      return Array.isArray(lista) ? lista : null;
    } catch (e) {
      return null;
    }
  }
  return null;
}

async function verificarPermissaoHandle(handle) {
  if (!handle || !handle.queryPermission) return false;
  let perm = await handle.queryPermission({ mode: "readwrite" });
  if (perm === "granted") return true;
  if (perm === "prompt" && handle.requestPermission) {
    perm = await handle.requestPermission({ mode: "readwrite" });
  }
  return perm === "granted";
}

async function salvarCatalogoPersistente(lista) {
  gravarCatalogoLocal(lista);
  try {
    await gravarCatalogoArquivo(lista);
  } catch (e) {}
}

async function carregarCatalogoPersistente() {
  let lista = lerCatalogoLocal();
  if (lista.length) return lista;
  const doArquivo = await lerCatalogoArquivo();
  if (doArquivo && doArquivo.length) {
    gravarCatalogoLocal(doArquivo);
    return doArquivo;
  }
  return lista;
}

function textoParaBase64(texto) {
  const bytes = new TextEncoder().encode(String(texto || ""));
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

async function compartilharArquivoNativo(nome, dadosBase64, titulo, texto) {
  const Filesystem = Capacitor.Plugins && Capacitor.Plugins.Filesystem;
  const Share = Capacitor.Plugins && Capacitor.Plugins.Share;
  if (!Filesystem || !Share) throw new Error("plugins");
  const escrito = await Filesystem.writeFile({
    path: nome,
    data: dadosBase64,
    directory: "CACHE"
  });
  await Share.share({
    title: titulo,
    text: texto,
    files: [escrito.uri],
    dialogTitle: titulo
  });
}

async function exportarCatalogoDownload() {
  const lista = lerCatalogoLocal();
  const json = JSON.stringify(lista, null, 2);
  const nome = "brube-catalogo.json";

  if (isAppNativo()) {
    try {
      await compartilharArquivoNativo(
        nome,
        textoParaBase64(json),
        "Exportar catálogo",
        "Backup do catálogo Brube Calc"
      );
    } catch (e) {
      if (e && String(e.message || e).toLowerCase().indexOf("cancel") >= 0) return;
      try {
        await salvarCatalogoPersistente(lista);
        alert("Catálogo salvo em Documentos/BrubeCalc/catalogo.json neste aparelho.");
      } catch (err) {
        alert("Não foi possível exportar o catálogo.");
      }
    }
    return;
  }

  const blob = new Blob([json], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function escolherPastaCatalogoPC() {
  if (isAppNativo()) {
    const lista = lerCatalogoLocal();
    try {
      await salvarCatalogoPersistente(lista);
    } catch (e) {
      alert("Não foi possível salvar o catálogo neste aparelho.");
      return;
    }
    try {
      await compartilharArquivoNativo(
        "brube-catalogo.json",
        textoParaBase64(JSON.stringify(lista, null, 2)),
        "Salvar catálogo",
        "Guarde uma cópia do catálogo Brube Calc"
      );
    } catch (e) {
      if (e && String(e.message || e).toLowerCase().indexOf("cancel") >= 0) {
        alert("Catálogo salvo neste aparelho.");
        return;
      }
      alert("Catálogo salvo em Documentos/BrubeCalc neste aparelho.");
    }
    return;
  }

  if (!window.showSaveFilePicker) {
    await exportarCatalogoDownload();
    alert("Seu navegador baixou o arquivo brube-catalogo.json. Guarde essa pasta; use Importar para recuperar.");
    return;
  }
  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: "brube-catalogo.json",
      types: [{ description: "Catálogo Brube", accept: { "application/json": [".json"] } }]
    });
    window.__brubeCatHandle = handle;
    await salvarCatalogoPersistente(lerCatalogoLocal());
    alert("Catálogo vinculado ao arquivo. As próximas alterações serão salvas nele.");
  } catch (e) {
    if (e && e.name === "AbortError") return;
    await exportarCatalogoDownload();
  }
}

function importarCatalogoArquivo(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const lista = JSON.parse(String(reader.result || "[]"));
      if (!Array.isArray(lista)) throw new Error("formato");
      await salvarCatalogoPersistente(lista);
      if (typeof renderCatalogo === "function") renderCatalogo();
      alert("Catálogo importado com sucesso (" + lista.length + " produtos).");
    } catch (e) {
      alert("Arquivo inválido. Selecione um brube-catalogo.json exportado pelo app.");
    }
  };
  reader.readAsText(file);
  input.value = "";
}
