const IMP_KEY = "app_impressoras";

const IMPRESSORAS_PADRAO = [
  { id: "ender3", nome: "Creality Ender 3 / Ender 3 V2", potencia: 300 },
  { id: "ender3v3", nome: "Creality Ender 3 V3 / V3 KE", potencia: 350 },
  { id: "ender5", nome: "Creality Ender 5 / Pro", potencia: 320 },
  { id: "k1", nome: "Creality K1", potencia: 350 },
  { id: "k1max", nome: "Creality K1 Max", potencia: 450 },
  { id: "a1mini", nome: "Bambu Lab A1 mini", potencia: 180 },
  { id: "a1", nome: "Bambu Lab A1", potencia: 350 },
  { id: "p1s", nome: "Bambu Lab P1S / P1P", potencia: 650 },
  { id: "x1c", nome: "Bambu Lab X1 / X1C", potencia: 550 },
  { id: "mk3", nome: "Prusa MK3S+", potencia: 150 },
  { id: "mk4", nome: "Prusa MK4 / MK4S", potencia: 200 },
  { id: "xl", nome: "Prusa XL", potencia: 450 },
  { id: "kobra2", nome: "Anycubic Kobra 2 / Plus", potencia: 300 },
  { id: "kobra3", nome: "Anycubic Kobra 3", potencia: 350 },
  { id: "photon", nome: "Anycubic Photon (resina)", potencia: 75 },
  { id: "mars", nome: "Elegoo Mars / Saturn (resina)", potencia: 80 },
  { id: "adv5m", nome: "Flashforge Adventurer 5M", potencia: 300 },
  { id: "sidewinder", nome: "Artillery Sidewinder X2 / X3", potencia: 500 },
  { id: "voron24", nome: "Voron 2.4", potencia: 500 },
  { id: "sv06", nome: "Sovol SV06 / SV07", potencia: 300 }
];

function carregarImpressoras() {
  let salvo = null;
  try {
    salvo = JSON.parse(localStorage.getItem(IMP_KEY) || "null");
  } catch (e) {
    salvo = null;
  }
  const padraoMap = {};
  IMPRESSORAS_PADRAO.forEach((p) => {
    padraoMap[p.id] = Object.assign({}, p);
  });
  let lista = IMPRESSORAS_PADRAO.map((p) => Object.assign({}, p));
  let favoritos = [];
  if (salvo && Array.isArray(salvo.favoritos)) {
    favoritos = salvo.favoritos.filter(Boolean);
  }
  if (salvo && Array.isArray(salvo.lista)) {
    const extras = [];
    salvo.lista.forEach((p) => {
      if (!p || !p.id) return;
      if (padraoMap[p.id]) {
        const i = lista.findIndex((x) => x.id === p.id);
        if (i >= 0 && p.potencia) lista[i].potencia = Number(p.potencia) || lista[i].potencia;
      } else {
        extras.push({
          id: p.id,
          nome: p.nome || "Impressora",
          potencia: Number(p.potencia) || 0,
          custom: true
        });
      }
    });
    lista = lista.concat(extras);
  }
  return { lista, favoritos };
}

function salvarImpressoras(dados) {
  localStorage.setItem(
    IMP_KEY,
    JSON.stringify({
      lista: dados.lista || [],
      favoritos: dados.favoritos || []
    })
  );
}

function obterImpressoras() {
  return carregarImpressoras().lista;
}

function obterFavoritas() {
  const d = carregarImpressoras();
  return d.lista.filter((p) => d.favoritos.indexOf(p.id) >= 0);
}

function toggleFavoritoImpressora(id) {
  const d = carregarImpressoras();
  const i = d.favoritos.indexOf(id);
  if (i >= 0) d.favoritos.splice(i, 1);
  else d.favoritos.push(id);
  salvarImpressoras(d);
  return d.favoritos.indexOf(id) >= 0;
}

function isFavorita(id) {
  return carregarImpressoras().favoritos.indexOf(id) >= 0;
}

function adicionarImpressoraCustom(nome, potencia) {
  const d = carregarImpressoras();
  const id = "custom_" + Date.now().toString(36);
  d.lista.push({
    id,
    nome: String(nome || "").trim(),
    potencia: Number(potencia) || 0,
    custom: true
  });
  salvarImpressoras(d);
  return id;
}

function removerImpressoraCustom(id) {
  const d = carregarImpressoras();
  d.lista = d.lista.filter((p) => !(p.custom && p.id === id));
  d.favoritos = d.favoritos.filter((f) => f !== id);
  salvarImpressoras(d);
}

function buscarImpressora(id) {
  return carregarImpressoras().lista.find((p) => p.id === id) || null;
}

function preencherSelectFavoritas() {
  const sel = document.getElementById("impressoraFav");
  if (!sel) return;
  const favs = obterFavoritas();
  const atual = sel.value;
  sel.innerHTML = "";
  const opt0 = document.createElement("option");
  opt0.value = "";
  opt0.textContent = favs.length
    ? "Escolher favorita..."
    : "Nenhuma favorita (marque ★ nas Configurações)";
  sel.appendChild(opt0);
  favs.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.nome + " (" + p.potencia + " W)";
    sel.appendChild(opt);
  });
  if (atual && favs.some((p) => p.id === atual)) sel.value = atual;
}

function aplicarImpressoraFavorita() {
  const sel = document.getElementById("impressoraFav");
  const pot = document.getElementById("potencia");
  if (!sel || !pot) return;

  if (!sel.value) {
    const pad = (typeof CONFIG !== "undefined" && CONFIG.padroes) || {};
    if (pad.potencia !== undefined && pad.potencia !== null && pad.potencia !== "") {
      pot.value = pad.potencia;
    }
  } else {
    const p = buscarImpressora(sel.value);
    if (!p) return;
    pot.value = p.potencia;
  }

  if (typeof salvarCampos === "function") salvarCampos();
  if (typeof calcular === "function") calcular();
}
