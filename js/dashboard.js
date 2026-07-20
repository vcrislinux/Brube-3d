function atualizarDashboardEmpresa() {
  if (typeof atualizarEmpresaBar === "function") atualizarEmpresaBar();
}

function atualizarDashboardFooter() {
  const el = document.getElementById("dashboardFooter");
  if (!el) return;
  const ver = typeof APP_VERSAO === "string" ? APP_VERSAO : "1.0.0";
  el.textContent = "Desenvolvido por Cristiano Vieira - Brube Calc - Versão: " + ver;
}

document.addEventListener("DOMContentLoaded", () => {
  atualizarDashboardEmpresa();
  atualizarDashboardFooter();
});
