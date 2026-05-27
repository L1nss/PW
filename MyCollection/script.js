const STORAGE_KEY = "pokedex-cartas-virtuais";
const USERS_KEY = "pokedex-treinadores";
const SESSION_KEY = "pokedex-treinador-ativo";
const ARTWORK_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork";

const pokemonPresets = [
  {
    id: 25,
    name: "Pikachu",
    type: "Eletrico",
    hp: 60,
    attack: "Choque do trovao",
    damage: 50,
    description: "Um ataque eletrico rapido que pode paralisar o oponente.",
    weakness: "Terra x2",
    resistance: "Metalico -20",
    notes: "Mascote classico, otimo para cartas iniciais."
  },
  {
    id: 6,
    name: "Charizard",
    type: "Fogo",
    hp: 170,
    attack: "Explosao flamejante",
    damage: 120,
    description: "Descarte uma energia para causar dano extra no proximo turno.",
    weakness: "Agua x2",
    resistance: "Grama -30",
    notes: "Carta de destaque para colecoes raras."
  },
  {
    id: 9,
    name: "Blastoise",
    type: "Agua",
    hp: 160,
    attack: "Canhao de agua",
    damage: 110,
    description: "Este ataque fica mais forte quando ha energia de agua anexada.",
    weakness: "Eletrico x2",
    resistance: "Fogo -30",
    notes: "Perfeito para registrar cartas de evolucao final."
  },
  {
    id: 3,
    name: "Venusaur",
    type: "Grama",
    hp: 160,
    attack: "Raio solar",
    damage: 100,
    description: "Recupere 20 de HP depois de atacar.",
    weakness: "Fogo x2",
    resistance: "Agua -30",
    notes: "Visual forte para cartas antigas da colecao."
  },
  {
    id: 150,
    name: "Mewtwo",
    type: "Psiquico",
    hp: 130,
    attack: "Onda psiquica",
    damage: 90,
    description: "O dano aumenta conforme a energia do Pokemon adversario.",
    weakness: "Noturno x2",
    resistance: "Lutador -30",
    notes: "Ideal para cartas lendarias."
  },
  {
    id: 448,
    name: "Lucario",
    type: "Lutador",
    hp: 120,
    attack: "Aura esfera",
    damage: 80,
    description: "Este ataque ignora resistencia do oponente.",
    weakness: "Psiquico x2",
    resistance: "Noturno -20",
    notes: "Boa opcao para cartas de batalha."
  },
  {
    id: 197,
    name: "Umbreon",
    type: "Noturno",
    hp: 110,
    attack: "Lua sombria",
    damage: 70,
    description: "O oponente descarta uma carta aleatoria da mao.",
    weakness: "Lutador x2",
    resistance: "Psiquico -30",
    notes: "Combina com cartas brilhantes e raras."
  },
  {
    id: 700,
    name: "Sylveon",
    type: "Fada",
    hp: 110,
    attack: "Laco encantado",
    damage: 70,
    description: "Procure uma carta de suporte no baralho.",
    weakness: "Metalico x2",
    resistance: "Noturno -30",
    notes: "Otimo para uma colecao colorida."
  }
].map((pokemon) => ({
  ...pokemon,
  imageData: `${ARTWORK_BASE}/${pokemon.id}.png`
}));

const typeClassMap = {
  Eletrico: "type-eletrico",
  Fogo: "type-fogo",
  Agua: "type-agua",
  Grama: "type-grama",
  Psiquico: "type-psiquico",
  Lutador: "type-lutador",
  Noturno: "type-noturno",
  Metalico: "type-metalico",
  Fada: "type-fada",
  Normal: "type-normal"
};

const typeLabelMap = {
  Eletrico: "Elétrico",
  Fogo: "Fogo",
  Agua: "Água",
  Grama: "Grama",
  Psiquico: "Psíquico",
  Lutador: "Lutador",
  Noturno: "Noturno",
  Metalico: "Metálico",
  Fada: "Fada",
  Normal: "Normal"
};

const state = {
  imageData: "",
  cards: [],
  currentUser: null
};

const fields = {};

document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("is-locked");

  [
    "pokemonPreset",
    "pokemonName",
    "pokemonType",
    "pokemonHp",
    "pokemonImage",
    "pokemonAttack",
    "pokemonDamage",
    "pokemonDescription",
    "pokemonWeakness",
    "pokemonResistance",
    "pokemonNotes"
  ].forEach((id) => {
    fields[id] = document.getElementById(id);
  });

  state.cards = loadCards();
  populatePresetOptions();
  populatePresetButtons();
  bindEvents();
  bindAuthEvents();
  applyPreset(pokemonPresets[0].name);

  const activeTrainer = sessionStorage.getItem(SESSION_KEY);
  if (activeTrainer && getUsers()[activeTrainer]) {
    startTrainerSession(activeTrainer);
  } else {
    showLogin();
  }
});

function bindEvents() {
  document.getElementById("pokemonForm").addEventListener("submit", saveCard);
  document.getElementById("downloadCard").addEventListener("click", downloadCurrentCard);
  document.getElementById("clearCollection").addEventListener("click", clearCollection);
  fields.pokemonPreset.addEventListener("change", () => applyPreset(fields.pokemonPreset.value));

  Object.entries(fields).forEach(([id, field]) => {
    if (id !== "pokemonPreset" && id !== "pokemonImage") {
      field.addEventListener("input", updatePreview);
      field.addEventListener("change", updatePreview);
    }
  });

  fields.pokemonImage.addEventListener("change", handleImageUpload);
}

function bindAuthEvents() {
  document.getElementById("loginForm").addEventListener("submit", handleLogin);
  document.getElementById("logoutButton").addEventListener("click", logoutTrainer);
}

async function handleLogin(event) {
  event.preventDefault();

  const trainerInput = document.getElementById("trainerName");
  const passwordInput = document.getElementById("trainerPassword");
  const authMessage = document.getElementById("authMessage");
  const trainerName = trainerInput.value.trim();
  const password = passwordInput.value;
  const trainerId = getTrainerId(trainerName);

  authMessage.textContent = "";

  if (!trainerName || !password) {
    authMessage.textContent = "Preencha treinador e senha.";
    return;
  }

  if (password.length < 4) {
    authMessage.textContent = "Use uma senha com pelo menos 4 caracteres.";
    return;
  }

  const users = getUsers();
  const passwordHash = await hashPassword(password);

  if (users[trainerId] && users[trainerId].passwordHash !== passwordHash) {
    authMessage.textContent = "Senha incorreta para este treinador.";
    return;
  }

  if (!users[trainerId]) {
    users[trainerId] = {
      name: trainerName,
      passwordHash,
      createdAt: new Date().toISOString()
    };
    saveUsers(users);
  }

  passwordInput.value = "";
  startTrainerSession(trainerId);
}

function startTrainerSession(trainerId) {
  const users = getUsers();
  const user = users[trainerId];

  if (!user) {
    showLogin();
    return;
  }

  state.currentUser = {
    id: trainerId,
    name: user.name
  };
  sessionStorage.setItem(SESSION_KEY, trainerId);
  state.cards = loadCards();
  document.getElementById("activeTrainer").textContent = user.name;
  document.getElementById("loginScreen").classList.add("is-hidden");
  document.body.classList.remove("is-locked");
  renderCollection();
}

function showLogin() {
  state.currentUser = null;
  state.cards = [];
  sessionStorage.removeItem(SESSION_KEY);
  document.getElementById("loginScreen").classList.remove("is-hidden");
  document.body.classList.add("is-locked");
  document.getElementById("trainerName").focus();
}

function logoutTrainer() {
  persistCards();
  showLogin();
  document.getElementById("authMessage").textContent = "Sessao encerrada. Escolha outro treinador.";
}

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || {};
  } catch {
    return {};
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getTrainerId(name) {
  return slugify(name).slice(0, 40);
}

async function hashPassword(password) {
  if (window.crypto && window.crypto.subtle) {
    const bytes = new TextEncoder().encode(password);
    const digest = await window.crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  return btoa(unescape(encodeURIComponent(password)));
}

function populatePresetOptions() {
  fields.pokemonPreset.innerHTML = "";

  pokemonPresets.forEach((pokemon) => {
    const option = document.createElement("option");
    option.value = pokemon.name;
    option.textContent = pokemon.name;
    fields.pokemonPreset.appendChild(option);
  });
}

function populatePresetButtons() {
  const grid = document.getElementById("presetGrid");
  grid.innerHTML = "";

  pokemonPresets.forEach((pokemon) => {
    const button = document.createElement("button");
    const image = document.createElement("img");
    const name = document.createElement("span");

    button.type = "button";
    button.className = "preset-button";
    button.dataset.pokemon = pokemon.name;
    image.src = pokemon.imageData;
    image.alt = pokemon.name;
    name.textContent = pokemon.name;

    button.append(image, name);
    button.addEventListener("click", () => applyPreset(pokemon.name));
    grid.appendChild(button);
  });
}

function applyPreset(name) {
  const pokemon = pokemonPresets.find((preset) => preset.name === name) || pokemonPresets[0];

  fields.pokemonPreset.value = pokemon.name;
  fields.pokemonName.value = pokemon.name;
  fields.pokemonType.value = pokemon.type;
  fields.pokemonHp.value = pokemon.hp;
  fields.pokemonAttack.value = pokemon.attack;
  fields.pokemonDamage.value = pokemon.damage;
  fields.pokemonDescription.value = pokemon.description;
  fields.pokemonWeakness.value = pokemon.weakness;
  fields.pokemonResistance.value = pokemon.resistance;
  fields.pokemonNotes.value = pokemon.notes;
  fields.pokemonImage.value = "";
  state.imageData = pokemon.imageData;
  markActivePreset(pokemon.name);
  updatePreview();
}

function markActivePreset(name) {
  document.querySelectorAll(".preset-button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.pokemon === name);
  });
}

function handleImageUpload(event) {
  const file = event.target.files[0];

  if (!file) {
    const preset = pokemonPresets.find((pokemon) => pokemon.name === fields.pokemonPreset.value);
    state.imageData = preset ? preset.imageData : "";
    updatePreview();
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    state.imageData = reader.result;
    updatePreview();
  };
  reader.readAsDataURL(file);
}

function getFormData() {
  return {
    id: makeId(),
    name: fields.pokemonName.value.trim() || "Pokemon sem nome",
    type: fields.pokemonType.value,
    hp: fields.pokemonHp.value || "0",
    attack: fields.pokemonAttack.value.trim() || "Ataque desconhecido",
    damage: fields.pokemonDamage.value || "0",
    description: fields.pokemonDescription.value.trim() || "Sem descricao informada.",
    weakness: fields.pokemonWeakness.value.trim() || "Nao informada",
    resistance: fields.pokemonResistance.value.trim() || "Nao informada",
    notes: fields.pokemonNotes.value.trim() || "Sem observacoes.",
    imageData: state.imageData
  };
}

function makeId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function updatePreview() {
  const card = getFormData();
  const preview = document.getElementById("cardPreview");

  preview.className = `pokemon-card ${typeClassMap[card.type] || "type-eletrico"}`;
  setText("previewName", card.name);
  setText("previewType", getTypeLabel(card.type));
  setText("previewHp", card.hp);
  setText("previewAttack", card.attack);
  setText("previewDamage", card.damage);
  setText("previewDescription", card.description);
  setText("previewWeakness", card.weakness);
  setText("previewResistance", card.resistance);
  setText("previewNotes", card.notes);
  renderPreviewImage(card.imageData);
}

function renderPreviewImage(src) {
  const frame = document.getElementById("previewImage");
  frame.innerHTML = "";

  if (src) {
    const image = document.createElement("img");
    image.src = src;
    image.alt = "Imagem enviada para a carta";
    frame.appendChild(image);
    return;
  }

  const fallback = document.createElement("span");
  fallback.textContent = "Imagem da carta";
  frame.appendChild(fallback);
}

async function saveCard(event) {
  event.preventDefault();
  if (!state.currentUser) return;

  const card = getFormData();
  card.ownerId = state.currentUser.id;
  card.cardImage = await createCardImage(card);
  state.cards.unshift(card);
  persistCards();
  renderCollection();
  document.getElementById("pokemonForm").reset();
  applyPreset(pokemonPresets[0].name);
}

async function downloadCurrentCard() {
  if (!state.currentUser) return;

  const card = getFormData();
  const image = await createCardImage(card);
  const link = document.createElement("a");
  link.href = image;
  link.download = `${slugify(card.name)}-card.png`;
  link.click();
}

function renderCollection() {
  const grid = document.getElementById("collectionGrid");
  document.getElementById("cardCount").textContent = state.cards.length;
  grid.innerHTML = "";

  if (state.cards.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "Nenhuma carta salva ainda. Crie a primeira usando o formulario acima.";
    grid.appendChild(empty);
    return;
  }

  state.cards.forEach((card) => {
    const article = document.createElement("article");
    article.className = "saved-card";

    const image = document.createElement("img");
    image.src = card.cardImage || card.imageData || "";
    image.alt = `Carta virtual de ${card.name}`;

    const title = document.createElement("h3");
    title.textContent = card.name;

    const meta = document.createElement("p");
    meta.textContent = `${getTypeLabel(card.type)} - ${card.hp} HP - ${card.attack}`;

    const download = document.createElement("button");
    download.type = "button";
    download.className = "secondary";
    download.textContent = "Baixar";
    download.addEventListener("click", () => downloadSavedCard(card));

    article.append(image, title, meta, download);
    grid.appendChild(article);
  });
}

function downloadSavedCard(card) {
  const link = document.createElement("a");
  link.href = card.cardImage || card.imageData;
  link.download = `${slugify(card.name)}-card.png`;
  link.click();
}

function clearCollection() {
  if (!state.currentUser) return;
  if (!state.cards.length) return;

  const confirmed = confirm("Deseja apagar todas as cartas salvas nesta Pokedex?");
  if (!confirmed) return;

  state.cards = [];
  persistCards();
  renderCollection();
}

function loadCards() {
  if (!state.currentUser) return [];

  try {
    return JSON.parse(localStorage.getItem(getCardsKey())) || [];
  } catch {
    return [];
  }
}

function persistCards() {
  if (!state.currentUser) return;
  localStorage.setItem(getCardsKey(), JSON.stringify(state.cards));
}

function getCardsKey() {
  return `${STORAGE_KEY}:${state.currentUser.id}`;
}

function setText(id, value) {
  document.getElementById(id).textContent = value;
}

function getTypeLabel(type) {
  return typeLabelMap[type] || type;
}

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || "pokemon";
}

async function createCardImage(card) {
  const canvas = document.createElement("canvas");
  const scale = 2;
  canvas.width = 390 * scale;
  canvas.height = 560 * scale;
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  drawCardBackground(ctx, card.type);
  drawCardText(ctx, card);

  if (card.imageData) {
    try {
      const image = await loadImage(card.imageData);
      drawCroppedImage(ctx, image, 36, 98, 318, 210);
    } catch {
      drawFallbackImage(ctx);
    }
  } else {
    drawFallbackImage(ctx);
  }

  return canvas.toDataURL("image/png");
}

function drawCardBackground(ctx, type) {
  const colors = {
    Eletrico: ["#ffe46b", "#ff9f1c"],
    Fogo: ["#ffb169", "#e84a5f"],
    Agua: ["#7bdff2", "#2274a5"],
    Grama: ["#b7e4c7", "#2a9d8f"],
    Psiquico: ["#ffc8dd", "#9b5de5"],
    Lutador: ["#f7c59f", "#bc6c25"],
    Noturno: ["#8d99ae", "#2b2d42"],
    Metalico: ["#d8e2dc", "#7d8597"],
    Fada: ["#ffc6ff", "#ff70a6"],
    Normal: ["#f1e8d8", "#a98467"]
  };
  const [start, end] = colors[type] || colors.Eletrico;
  const gradient = ctx.createLinearGradient(0, 0, 390, 560);

  gradient.addColorStop(0, start);
  gradient.addColorStop(0.52, end);
  gradient.addColorStop(0.53, "#ffffff");
  gradient.addColorStop(1, "#fffaf0");

  roundedRect(ctx, 0, 0, 390, 560, 8, "#f8d34f");
  roundedRect(ctx, 10, 10, 370, 540, 6, gradient);
  roundedRect(ctx, 20, 20, 350, 520, 6, "rgba(255,255,255,0.34)");
}

function drawCardText(ctx, card) {
  ctx.fillStyle = "#202124";
  ctx.font = "700 12px Segoe UI, Arial";
  ctx.fillText("BASICO", 34, 43);

  ctx.font = "900 28px Segoe UI, Arial";
  drawWrappedText(ctx, card.name, 34, 72, 230, 30, 1);

  ctx.fillStyle = "#c1121f";
  ctx.font = "900 20px Segoe UI, Arial";
  ctx.textAlign = "right";
  ctx.fillText(`${card.hp} HP`, 354, 69);
  ctx.textAlign = "left";

  roundedRect(ctx, 36, 318, 318, 28, 14, "rgba(255,255,255,0.76)");
  ctx.fillStyle = "#202124";
  ctx.font = "900 12px Segoe UI, Arial";
  ctx.fillText(getTypeLabel(card.type).toUpperCase(), 52, 337);
  ctx.textAlign = "right";
  ctx.fillText("CARD VIRTUAL", 338, 337);
  ctx.textAlign = "left";

  roundedRect(ctx, 34, 360, 322, 105, 8, "rgba(255,255,255,0.82)");
  ctx.fillStyle = "#202124";
  ctx.font = "900 20px Segoe UI, Arial";
  drawWrappedText(ctx, card.attack, 50, 390, 210, 24, 1);
  ctx.textAlign = "right";
  ctx.font = "900 26px Segoe UI, Arial";
  ctx.fillText(card.damage, 338, 390);
  ctx.textAlign = "left";

  ctx.font = "500 14px Segoe UI, Arial";
  drawWrappedText(ctx, card.description, 50, 420, 290, 18, 3);

  ctx.strokeStyle = "rgba(32,33,36,0.25)";
  ctx.beginPath();
  ctx.moveTo(34, 484);
  ctx.lineTo(356, 484);
  ctx.moveTo(34, 519);
  ctx.lineTo(356, 519);
  ctx.stroke();

  ctx.font = "700 11px Segoe UI, Arial";
  ctx.fillText("FRAQUEZA", 42, 501);
  ctx.fillText(card.weakness, 42, 516);
  ctx.fillText("RESISTENCIA", 206, 501);
  ctx.fillText(card.resistance, 206, 516);

  ctx.font = "500 11px Segoe UI, Arial";
  drawWrappedText(ctx, card.notes, 42, 538, 300, 13, 1);
}

function drawFallbackImage(ctx) {
  roundedRect(ctx, 36, 98, 318, 210, 8, "#dce7f5");
  ctx.fillStyle = "#526070";
  ctx.font = "900 18px Segoe UI, Arial";
  ctx.textAlign = "center";
  ctx.fillText("Imagem da carta", 195, 210);
  ctx.textAlign = "left";
}

function drawCroppedImage(ctx, image, x, y, width, height) {
  const imageRatio = image.width / image.height;
  const boxRatio = width / height;
  let sourceWidth = image.width;
  let sourceHeight = image.height;
  let sourceX = 0;
  let sourceY = 0;

  if (imageRatio > boxRatio) {
    sourceWidth = image.height * boxRatio;
    sourceX = (image.width - sourceWidth) / 2;
  } else {
    sourceHeight = image.width / boxRatio;
    sourceY = (image.height - sourceHeight) / 2;
  }

  roundedRect(ctx, x - 4, y - 4, width + 8, height + 8, 8, "rgba(255,255,255,0.9)");
  ctx.save();
  roundedClip(ctx, x, y, width, height, 8);
  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
  ctx.restore();
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    if (/^https?:\/\//.test(src)) {
      image.crossOrigin = "anonymous";
    }
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function roundedRect(ctx, x, y, width, height, radius, fillStyle) {
  ctx.save();
  roundedClip(ctx, x, y, width, height, radius);
  ctx.fillStyle = fillStyle;
  ctx.fill();
  ctx.restore();
}

function roundedClip(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const words = String(text).split(" ");
  let line = "";
  let lines = 0;

  for (let index = 0; index < words.length; index += 1) {
    const testLine = line ? `${line} ${words[index]}` : words[index];
    const tooWide = ctx.measureText(testLine).width > maxWidth;

    if (tooWide && line) {
      ctx.fillText(line, x, y + lines * lineHeight);
      line = words[index];
      lines += 1;

      if (lines === maxLines) return;
    } else {
      line = testLine;
    }
  }

  if (line && lines < maxLines) {
    ctx.fillText(line, x, y + lines * lineHeight);
  }
}
