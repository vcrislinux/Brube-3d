let logoAtual = null;

function atualizarPreviaLogo() {
  const prev = document.getElementById("cfg_logo_preview");
  if (logoAtual) {
    prev.src = logoAtual;
    prev.hidden = false;
  } else {
    prev.removeAttribute("src");
    prev.hidden = true;
  }
}

function importarLogo(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => redimensionarLogo(reader.result);
  reader.readAsDataURL(file);
  input.value = "";
}

function redimensionarLogo(dataUrl) {
  const img = new Image();
  img.onload = () => {
    const max = 512;
    let w = img.width;
    let h = img.height;
    if (w > max || h > max) {
      const r = Math.min(max / w, max / h);
      w = Math.round(w * r);
      h = Math.round(h * r);
    }
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d").drawImage(img, 0, 0, w, h);
    logoAtual = canvas.toDataURL("image/png");
    atualizarPreviaLogo();
  };
  img.onerror = () => alert("Não foi possível ler essa imagem.");
  img.src = dataUrl;
}

function removerLogo() {
  logoAtual = null;
  atualizarPreviaLogo();
}

function preencherConfigForm() {
  const g = (id) => document.getElementById(id);
  g("cfg_empresa").value = CONFIG.empresa || "";
  g("cfg_banco").value = CONFIG.banco || "";
  g("cfg_responsaveis").value = CONFIG.responsaveis || "";
  g("cfg_whatsapp").value = CONFIG.whatsapp || "";
  g("cfg_instagram").value = CONFIG.instagram || "";
  g("cfg_pixNome").value = CONFIG.pixNome || "";
  g("cfg_pixChave").value = CONFIG.pixChave || "";
  const p = CONFIG.padroes || {};
  if (typeof formatarMoeda === "function") {
    g("cfg_filamento").value = formatarMoeda(p.filamento ?? 0);
    g("cfg_kwh").value = formatarMoeda(p.kwh ?? 0);
    g("cfg_desgaste").value = formatarMoeda(p.desgaste ?? 0);
    g("cfg_argolas").value = formatarMoeda(p.argolas ?? 0);
    g("cfg_valorEmbalagem").value = formatarMoeda(p.valorEmbalagem ?? 0);
  } else {
    g("cfg_filamento").value = p.filamento ?? "";
    g("cfg_kwh").value = p.kwh ?? "";
    g("cfg_desgaste").value = p.desgaste ?? "";
    g("cfg_argolas").value = p.argolas ?? "";
    g("cfg_valorEmbalagem").value = p.valorEmbalagem ?? "";
  }
  g("cfg_potencia").value = p.potencia ?? "";
  logoAtual = CONFIG.logo || null;
  atualizarPreviaLogo();
  renderImpressorasConfig();
  preencherSelectFavoritas();
}

function renderImpressorasConfig() {
  const sel = document.getElementById("cfg_impressora");
  if (!sel || typeof obterImpressoras !== "function") return;
  const lista = obterImpressoras();
  const pot = parseFloat(document.getElementById("cfg_potencia").value) || 0;
  const keep = sel.value;
  sel.innerHTML = "";
  const opt0 = document.createElement("option");
  opt0.value = "";
  opt0.textContent = "Selecione uma impressora...";
  sel.appendChild(opt0);
  let selected = keep || "";
  lista.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.id;
    const star = isFavorita(p.id) ? "★ " : "";
    opt.textContent = star + p.nome + " (" + p.potencia + " W)";
    sel.appendChild(opt);
    if (!keep && p.potencia === pot) selected = p.id;
  });
  if (selected && lista.some((p) => p.id === selected)) sel.value = selected;
  atualizarEstrelaConfig();
}

function atualizarEstrelaConfig() {
  const sel = document.getElementById("cfg_impressora");
  const btn = document.getElementById("cfg_imp_fav");
  const del = document.getElementById("cfg_imp_del");
  if (!sel || !btn) return;
  const id = sel.value;
  const p = id ? buscarImpressora(id) : null;
  const fav = p && isFavorita(id);
  btn.disabled = !p;
  btn.className = "imp-fav" + (fav ? " on" : "");
  btn.textContent = fav ? "★" : "☆";
  btn.title = fav ? "Remover dos favoritos" : "Marcar como favorita";
  if (del) del.hidden = !(p && p.custom);
}

function toggleFavoritoConfig() {
  const id = document.getElementById("cfg_impressora").value;
  if (!id) return;
  toggleFavoritoImpressora(id);
  renderImpressorasConfig();
  preencherSelectFavoritas();
}

function removerImpressoraConfig() {
  const id = document.getElementById("cfg_impressora").value;
  const p = buscarImpressora(id);
  if (!p || !p.custom) return;
  if (!confirm("Remover esta impressora?")) return;
  removerImpressoraCustom(id);
  renderImpressorasConfig();
  preencherSelectFavoritas();
}

function aplicarImpressoraConfig() {
  const id = document.getElementById("cfg_impressora").value;
  const p = buscarImpressora(id);
  atualizarEstrelaConfig();
  if (!p) return;
  document.getElementById("cfg_potencia").value = p.potencia;
}

function adicionarImpressoraForm() {
  const nome = document.getElementById("cfg_imp_nome").value.trim();
  const watts = parseFloat(document.getElementById("cfg_imp_watts").value) || 0;
  if (!nome) {
    alert("Informe o nome da impressora.");
    return;
  }
  if (watts <= 0) {
    alert("Informe a potência em watts.");
    return;
  }
  adicionarImpressoraCustom(nome, watts);
  document.getElementById("cfg_imp_nome").value = "";
  document.getElementById("cfg_imp_watts").value = "";
  renderImpressorasConfig();
  if (typeof preencherSelectFavoritas === "function") preencherSelectFavoritas();
}

function abrirConfig() {
  preencherConfigForm();
  trocarAbaConfig("contato");
  const v = document.getElementById("appVersao");
  if (v && typeof APP_VERSAO === "string") v.textContent = APP_VERSAO;
  const s = document.getElementById("updStatus");
  if (s) s.textContent = "";
  mostrarValidadeCache();
  checarUpdate().catch(() => {});
  document.getElementById("configModal").hidden = false;
}

function trocarAbaConfig(aba) {
  const contato = aba === "contato";
  const tabC = document.getElementById("cfgTabContato");
  const tabK = document.getElementById("cfgTabCalculo");
  const paneC = document.getElementById("cfgPaneContato");
  const paneK = document.getElementById("cfgPaneCalculo");
  if (!tabC || !tabK || !paneC || !paneK) return;
  tabC.classList.toggle("active", contato);
  tabK.classList.toggle("active", !contato);
  tabC.setAttribute("aria-selected", contato ? "true" : "false");
  tabK.setAttribute("aria-selected", contato ? "false" : "true");
  paneC.hidden = !contato;
  paneK.hidden = contato;
}

function abrirCatalogo() {
  window.location.href = "catalogo.html";
}

function formatarData(iso) {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("pt-BR");
  } catch (e) {
    return "";
  }
}

function getChaveAtiva() {
  try {
    const a = JSON.parse(localStorage.getItem("ativacao") || "{}");
    return a && a.key ? a.key : "";
  } catch (e) {
    return "";
  }
}

function mostrarValidadeCache() {
  const v = document.getElementById("appValidade");
  if (!v) return;
  const iso = localStorage.getItem("app_validade") || "";
  const txt = iso ? formatarData(iso) : "";
  v.textContent = txt || "—";
}

async function checarUpdate() {
  const chave = getChaveAtiva();
  const sep = LICENCA.ATIVACAO_URL.indexOf("?") >= 0 ? "&" : "?";
  const url = LICENCA.ATIVACAO_URL + sep + "check=update" + (chave ? "&key=" + encodeURIComponent(chave) : "");
  const resp = await fetch(url, { method: "GET" });
  const d = await resp.json();
  if (d && d.validade) {
    localStorage.setItem("app_validade", d.validade);
    mostrarValidadeCache();
  }
  return d;
}

function versaoMaior(remota, local) {
  const a = String(remota).split(".").map((n) => parseInt(n, 10) || 0);
  const b = String(local).split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] || 0;
    const y = b[i] || 0;
    if (x > y) return true;
    if (x < y) return false;
  }
  return false;
}

async function abrirLink(url) {
  const Browser = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Browser;
  if (Browser && typeof Browser.open === "function") {
    await Browser.open({ url });
  } else {
    window.open(url, "_blank");
  }
}

async function verificarAtualizacoes() {
  const btn = document.getElementById("btnAtualizar");
  const status = document.getElementById("updStatus");
  if (!status) return;
  if (btn) btn.disabled = true;
  status.textContent = "Verificando...";
  try {
    const d = await checarUpdate();
    if (!d) throw new Error("resposta inválida");
    if (d.expirado) {
      status.textContent = "Seu período de atualizações expirou. Renove para continuar recebendo novidades.";
      return;
    }
    if (!d.version) throw new Error("resposta inválida");
    if (versaoMaior(d.version, APP_VERSAO)) {
      const notas = d.notas ? "\n\n" + d.notas : "";
      const ok = confirm("Nova versão disponível: " + d.version + notas + "\n\nDeseja baixar agora?");
      if (ok) {
        if (d.url && !/COLE_O_LINK/i.test(d.url)) {
          await abrirLink(d.url);
          status.textContent = "Abrindo download da versão " + d.version + "...";
        } else {
          status.textContent = "Link de download ainda não configurado.";
        }
      } else {
        status.textContent = "Atualização adiada.";
      }
    } else {
      status.textContent = "Você já está na versão mais recente.";
    }
  } catch (e) {
    status.textContent = "Não foi possível verificar. Confira sua internet.";
  } finally {
    if (btn) btn.disabled = false;
  }
}

function fecharConfig() {
  document.getElementById("configModal").hidden = true;
}

function abrirContatoDev() {
  const m = document.getElementById("contatoDevModal");
  if (m) m.hidden = false;
}

function fecharContatoDev() {
  const m = document.getElementById("contatoDevModal");
  if (m) m.hidden = true;
}

function aplicarPadroesNosCampos() {
  aplicarPadroes();
  if (typeof salvarCampos === "function") salvarCampos();
}

function salvarConfigForm() {
  persistirConfigFormAtual();
  fecharConfig();
}

function persistirConfigFormAtual() {
  const emp = document.getElementById("cfg_empresa");
  if (!emp) return;
  const v = (id) => {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  };
  const n = (id) => {
    const el = document.getElementById(id);
    if (!el) return 0;
    if (el.dataset.formato === "moeda" && typeof parseMoeda === "function") return parseMoeda(el.value);
    return parseFloat(el.value) || 0;
  };
  const novo = {
    empresa: v("cfg_empresa"),
    banco: v("cfg_banco"),
    responsaveis: v("cfg_responsaveis"),
    whatsapp: v("cfg_whatsapp"),
    instagram: v("cfg_instagram"),
    pixNome: v("cfg_pixNome"),
    pixChave: v("cfg_pixChave"),
    logo: typeof logoAtual !== "undefined" ? logoAtual || null : (CONFIG && CONFIG.logo) || null,
    padroes: {
      filamento: n("cfg_filamento"),
      potencia: n("cfg_potencia"),
      kwh: n("cfg_kwh"),
      desgaste: n("cfg_desgaste"),
      argolas: n("cfg_argolas"),
      valorEmbalagem: n("cfg_valorEmbalagem")
    }
  };
  salvarConfig(novo);
  aplicarPadroesNosCampos();
}

function restaurarConfigForm() {
  restaurarConfigPadrao();
  aplicarPadroesNosCampos();
  preencherConfigForm();
}

document.addEventListener("click", (e) => {
  const modal = document.getElementById("configModal");
  if (modal && e.target === modal) fecharConfig();
  const contato = document.getElementById("contatoDevModal");
  if (contato && e.target === contato) fecharContatoDev();
});
