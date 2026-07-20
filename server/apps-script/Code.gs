const WEB_CLIENT_ID = "1818785847-k9uadkg3nikd2b4hr89fkenqdblacc32.apps.googleusercontent.com";
const ABA = "Chaves";

// ==== ATUALIZACAO DO APP ====
// Ao lancar uma versao nova: suba o novo APK, cole o link em APK_URL e
// aumente APP_VERSAO_RECENTE (ex.: "1.0.1"). Depois reimplante o script.
const APP_VERSAO_RECENTE = "1.0.0";
const APK_URL = "https://drive.google.com/uc?export=download&id=1ZbnZ6ct-ulvrdroq38yw_Ldnxbi-cp_K";
const NOTAS_VERSAO = "";
// Quantos dias de atualizacoes cada licenca recebe a partir da ativacao (coluna D).
const DIAS_ATUALIZACAO = 365;

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const key = String(body.key || "").trim().toUpperCase();
    const idToken = String(body.idToken || "");
    if (!key || !idToken) return json({ ok: false, reason: "dados_incompletos" });

    const info = verificarToken(idToken);
    if (!info.ok) return json({ ok: false, reason: info.reason });
    const email = info.email.toLowerCase();

    const lock = LockService.getScriptLock();
    lock.waitLock(15000);
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sh = ss.getSheetByName(ABA) || ss.getSheets()[0];
      const data = sh.getDataRange().getValues();

      for (let i = 1; i < data.length; i++) {
        const rowKey = String(data[i][0] || "").trim().toUpperCase();
        if (rowKey !== key) continue;

        const conta1 = String(data[i][1] || "").trim().toLowerCase();
        const conta2 = String(data[i][2] || "").trim().toLowerCase();

        if (email === conta1 || email === conta2) return json({ ok: true, email: email });
        if (!conta1) {
          sh.getRange(i + 1, 2).setValue(email);
          sh.getRange(i + 1, 4).setValue(new Date());
          return json({ ok: true, email: email });
        }
        if (!conta2) {
          sh.getRange(i + 1, 3).setValue(email);
          if (!data[i][3]) sh.getRange(i + 1, 4).setValue(new Date());
          return json({ ok: true, email: email });
        }
        return json({ ok: false, reason: "limite_atingido" });
      }
      return json({ ok: false, reason: "chave_invalida" });
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    return json({ ok: false, reason: "erro", detalhe: String(err) });
  }
}

function verificarToken(idToken) {
  const url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(idToken);
  const resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (resp.getResponseCode() !== 200) return { ok: false, reason: "token_invalido" };
  const p = JSON.parse(resp.getContentText());
  if (p.aud !== WEB_CLIENT_ID) return { ok: false, reason: "audiencia_invalida" };
  if (!p.email) return { ok: false, reason: "sem_email" };
  if (String(p.email_verified) !== "true") return { ok: false, reason: "email_nao_verificado" };
  return { ok: true, email: p.email };
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.check === "update") {
    return json(infoAtualizacao(p.key));
  }
  return json({ ok: true, msg: "Brube Calc - servico de licenca ativo" });
}

function infoAtualizacao(key) {
  const base = { ok: true, version: APP_VERSAO_RECENTE, url: APK_URL, notas: NOTAS_VERSAO };
  key = String(key || "").trim().toUpperCase();
  if (!key) return base;
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(ABA) || ss.getSheets()[0];
    const data = sh.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0] || "").trim().toUpperCase() !== key) continue;
      const dataBase = data[i][3];
      if (!dataBase) return base;
      const inicio = new Date(dataBase);
      const limite = new Date(inicio.getTime() + DIAS_ATUALIZACAO * 24 * 60 * 60 * 1000);
      const validade = limite.toISOString();
      if (new Date().getTime() > limite.getTime()) {
        return { ok: true, expirado: true, validade: validade };
      }
      base.validade = validade;
      return base;
    }
    return base;
  } catch (err) {
    return base;
  }
}
