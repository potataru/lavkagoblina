const MAX_INGREDIENTS = 3;

// все отдельные ингредиенты-картинки
const ingridientItems = Array.from(
  document.querySelectorAll(".ingridient-item")
);

// котёл — зона дропа
const kotelDrop = document.getElementById("kotelDrop");
const statusText = document.getElementById("statusText");

const overlay = document.getElementById("potionOverlay");
const potionNameEl = document.getElementById("potionName");
const potionDescEl = document.getElementById("potionDescription");
const potionKeyEl = document.getElementById("potionKey");
const brewAgainBtn = document.getElementById("brewAgainBtn");
const potionBottleEl = document.querySelector(".potion-bottle");


let selected = []; // { id, label }
let draggedId = null;

/**
 * РЕЦЕПТЫ: ключ = отсортированные id через "_"
 * berry, mushroom, dust, tear
 */
const recipes = {
  rose_scale_troll: {
    name: "Зелье хорошего сна",
    description: "Помогает уснуть без кошмаров и не просыпаться от каждого шороха. Не смешивать с ночными дежурствами.",
    image: "zeliesna.png",
  },

  goblin_rose_troll: {
    name: "Зелье для полировки ушей",
    description: "После пары капель слышно даже то, что о тебе шепчут в другом конце Хогвартса.",
    image: "zelieushey.png",
  },

  goblin_rose_scale: {
    name: "Зелье «Сытость»",
    description: "Дарит ощущение плотного обеда на несколько часов. Организм всё равно помнит, что ты ешь плохо.",
    image: "zeliesitost.png",
  },

  goblin_scale_troll: {
    name: "Зелье от аллергии на печенье",
    description: "Снимает чих, зуд и моральную травму от овсяного печенья. Вкус, к сожалению, соответствующий.",
    image: "zeliecookie.png",
  },
};



function normalizeKey(ids) {
  return ids.slice().sort().join("_");
}

function updateStatusText() {
  if (selected.length === 0) {
    statusText.textContent =
      "Брось в котёл три ингредиента, чтобы сварить зелье.";
    return;
  }
  const list = selected.map((x) => x.label).join(" + ");
  statusText.textContent = "В котле: " + list;
}

function showPotionResult() {
  const ids = selected.map((x) => x.id);
  const key = normalizeKey(ids);
  const potion =
    recipes[key] || {
      name: "Нестабильное варево",
      description:
        "Странная смесь, которая меняет вкус и цвет каждый раз, когда о ней вспоминают.",
    };

  potionNameEl.textContent = potion.name;
  potionDescEl.textContent = potion.description;
  potionBottleEl.style.backgroundImage = `url("images/${potion.image}")`;


  // показываем комбинацию по красивым названиям
  const labels = selected.map((x) => x.label);
  potionKeyEl.textContent = "Ингредиенты: " + labels.join(" + ");
  
  overlay.classList.add("visible");
}

function resetBrew() {
  selected = [];
  ingridientItems.forEach((el) => {
    el.classList.remove("used");
    el.setAttribute("draggable", "true");
  });
  updateStatusText();
  overlay.classList.remove("visible");
}

/**
 * Общая функция: попытаться добавить ингредиент по id
 * Используется и для drop, и для тапа на телефоне
 */
function tryAddIngredient(id) {
  if (!id) return;
  if (selected.length >= MAX_INGREDIENTS) return;
  if (selected.some((x) => x.id === id)) return;

  const el = ingridientItems.find((item) => item.dataset.id === id);
  if (!el || el.classList.contains("used")) return;

  const label = el.dataset.label || id;

  selected.push({ id, label });
  el.classList.add("used");
  el.setAttribute("draggable", "false");

  updateStatusText();

  if (selected.length === MAX_INGREDIENTS) {
    setTimeout(showPotionResult, 400);
  }
}

// DRAG & DROP — для компьютера / мыши

ingridientItems.forEach((el) => {
  el.addEventListener("dragstart", (e) => {
    if (el.classList.contains("used") || selected.length >= MAX_INGREDIENTS) {
      e.preventDefault();
      return;
    }
    draggedId = el.dataset.id;
    e.dataTransfer.setData("text/plain", draggedId);
  });

  el.addEventListener("dragend", () => {
    draggedId = null;
  });
});

// зона котла
kotelDrop.addEventListener("dragover", (e) => {
  e.preventDefault();
  kotelDrop.classList.add("kotel-hover");
});

kotelDrop.addEventListener("dragleave", () => {
  kotelDrop.classList.remove("kotel-hover");
});

kotelDrop.addEventListener("drop", (e) => {
  e.preventDefault();
  kotelDrop.classList.remove("kotel-hover");

  const idFromData = e.dataTransfer.getData("text/plain");
  const id = idFromData || draggedId;
  tryAddIngredient(id);
});

// ===== ТАЧ-ДРАГ ДЛЯ ТЕЛЕФОНА: зажал → потащил → отпустил на котле =====

let draggingEl = null;

function isOverKotel(clientX, clientY) {
  const r = kotelDrop.getBoundingClientRect();
  return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
}

ingridientItems.forEach((el) => {
  el.addEventListener("pointerdown", (e) => {
    // Мышь живёт с обычным drag&drop, тут — палец/стилус
    if (e.pointerType === "mouse") return;

    if (el.classList.contains("used") || selected.length >= MAX_INGREDIENTS) return;

    e.preventDefault();

    draggingEl = el;
    el.classList.add("dragging");
    el.setPointerCapture(e.pointerId);

    // ставим под палец
    el.style.left = e.clientX + "px";
    el.style.top = e.clientY + "px";
    el.style.transform = "translate(-50%, -50%)";
  });

  el.addEventListener("pointermove", (e) => {
    if (!draggingEl || draggingEl !== el) return;
    e.preventDefault();

    el.style.left = e.clientX + "px";
    el.style.top = e.clientY + "px";

    // подсветка котла
    if (isOverKotel(e.clientX, e.clientY)) kotelDrop.classList.add("kotel-hover");
    else kotelDrop.classList.remove("kotel-hover");
  });

  el.addEventListener("pointerup", (e) => {
    if (!draggingEl || draggingEl !== el) return;

    kotelDrop.classList.remove("kotel-hover");

    // отпустили над котлом — засчитываем
    if (isOverKotel(e.clientX, e.clientY)) {
      tryAddIngredient(el.dataset.id);
    }

    // вернуть обратно (чтобы снова стоял в своей позиции по CSS)
    el.classList.remove("dragging");
    el.style.left = "";
    el.style.top = "";
    el.style.transform = "";

    draggingEl = null;
  });

  el.addEventListener("pointercancel", () => {
    if (!draggingEl || draggingEl !== el) return;

    kotelDrop.classList.remove("kotel-hover");

    el.classList.remove("dragging");
    el.style.left = "";
    el.style.top = "";
    el.style.transform = "";

    draggingEl = null;
  });
});



brewAgainBtn.addEventListener("click", resetBrew);

// Клик по фону оверлея — тоже сброс
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) {
    resetBrew();
  }
});

updateStatusText();

