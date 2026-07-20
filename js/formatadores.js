function parseMoeda(valor) {
  if (valor == null || valor === "") return 0;
  if (typeof valor === "number") return isNaN(valor) ? 0 : valor;
  let s = String(valor).trim();
  if (!s) return 0;
  s = s.replace(/[^\d,.-]/g, "");
  if (s.indexOf(",") >= 0) {
    s = s.replace(/\./g, "").replace(",", ".");
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function formatarMoeda(valor) {
  const n = typeof valor === "number" ? valor : parseMoeda(valor);
  if (!n && n !== 0) return "";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function aplicarMascaraMoeda(el) {
  if (!el) return;
  const digits = String(el.value || "").replace(/\D/g, "");
  if (!digits) {
    el.value = "";
    return;
  }
  const n = parseInt(digits, 10) / 100;
  el.value = formatarMoeda(n);
}

function ligarCampoMoeda(el) {
  if (!el || el.dataset.moedaReady) return;
  el.dataset.moedaReady = "1";
  el.setAttribute("inputmode", "decimal");
  el.addEventListener("input", () => aplicarMascaraMoeda(el));
  el.addEventListener("blur", () => {
    if (el.value.trim() === "") return;
    el.value = formatarMoeda(parseMoeda(el.value));
  });
  if (el.value !== "" && el.value != null) {
    el.value = formatarMoeda(parseMoeda(el.value));
  }
}

function parseTempoHoras(valor) {
  if (valor == null || valor === "") return NaN;
  if (typeof valor === "number") return valor;
  const s = String(valor).trim().replace(",", ".");
  if (!s) return NaN;
  if (s.indexOf(":") >= 0) {
    const partes = s.split(":");
    const h = parseInt(partes[0], 10) || 0;
    const m = parseInt(partes[1], 10) || 0;
    if (m > 59) return NaN;
    return h + m / 60;
  }
  if (s.indexOf(".") >= 0) {
    const p = s.split(".");
    const h = parseInt(p[0], 10) || 0;
    const m = parseInt(p[1], 10) || 0;
    if (m > 59) return NaN;
    return h + m / 60;
  }
  return parseFloat(s);
}

function formatarTempo(valor) {
  let horas = typeof valor === "number" ? valor : parseTempoHoras(valor);
  if (isNaN(horas) || horas < 0) return "";
  const totalMin = Math.round(horas * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
}

function aplicarMascaraTempo(el) {
  if (!el) return;
  let digits = String(el.value || "").replace(/\D/g, "").slice(0, 6);
  if (!digits) {
    el.value = "";
    return;
  }
  if (digits.length <= 2) {
    el.value = digits;
    return;
  }
  const mins = digits.slice(-2);
  const hours = digits.slice(0, -2);
  el.value = hours + ":" + mins;
}

function finalizarMascaraTempo(el) {
  if (!el) return;
  const raw = String(el.value || "").trim();
  if (!raw) {
    el.value = "";
    return;
  }
  const h = parseTempoHoras(raw);
  if (isNaN(h)) {
    el.value = "";
    return;
  }
  el.value = formatarTempo(h);
}

function ligarCampoTempo(el) {
  if (!el || el.dataset.tempoReady) return;
  el.dataset.tempoReady = "1";
  el.setAttribute("inputmode", "numeric");
  el.setAttribute("placeholder", "00:00");
  el.addEventListener("input", () => {
    aplicarMascaraTempo(el);
    if (typeof calcularCustoProduto === "function" && el.id === "prod_horas") calcularCustoProduto();
  });
  el.addEventListener("blur", () => {
    finalizarMascaraTempo(el);
    if (typeof calcularCustoProduto === "function" && el.id === "prod_horas") calcularCustoProduto();
  });
  if (el.value !== "" && el.value != null) {
    finalizarMascaraTempo(el);
  }
}

function ligarFormatadoresPagina() {
  document.querySelectorAll("[data-formato='moeda']").forEach(ligarCampoMoeda);
  document.querySelectorAll("[data-formato='tempo']").forEach(ligarCampoTempo);
}

document.addEventListener("DOMContentLoaded", ligarFormatadoresPagina);
