// =============================================
// PLAYER SELECTION PAGE (player-selection.html)
// =============================================

const player1 = {
  id: "p1",
  name: "Player 1",
  avatar: "./assets/player1.png",
  stats: { resilience: 3, exhaustion: 1, defense: 2 },
};

const player2 = {
  id: "p2",
  name: "Player 2",
  avatar: "./assets/player2.png",
  stats: { resilience: 2, exhaustion: 2, defense: 3 },
};

let selected = ""; // "p1", "p2", or "guest"
let guestImageData = ""; // data URL after upload

function qs(sel) {
  return document.querySelector(sel);
}
function qsa(sel) {
  return document.querySelectorAll(sel);
}

function renderPresets() {
  const p1Img = qs("#p1Img");
  const p2Img = qs("#p2Img");
  if (p1Img) {
    p1Img.src = player1.avatar;
    qs("#p1Name").textContent = player1.name;
  }
  if (p2Img) {
    p2Img.src = player2.avatar;
    qs("#p2Name").textContent = player2.name;
  }
}

function selectCard(id) {
  selected = id;

  const cards = qsa(".card");
  for (let i = 0; i < cards.length; i++) {
    const isSelected = cards[i].id === id;
    if (isSelected) cards[i].classList.add("selected");
    else cards[i].classList.remove("selected");
    cards[i].setAttribute("aria-checked", String(isSelected));
  }

  const enable = id === "guest";
  const inputs = qsa("#guest input, #guest select");
  for (let j = 0; j < inputs.length; j++) {
    inputs[j].disabled = !enable;
  }
}

function setupCardClicks() {
  const p1 = qs("#p1");
  const p2 = qs("#p2");
  const guest = qs("#guest");

  if (p1)
    p1.addEventListener("click", function () {
      selectCard("p1");
    });
  if (p2)
    p2.addEventListener("click", function () {
      selectCard("p2");
    });

  if (guest) {
    guest.addEventListener("click", function (e) {
      const tag = e.target.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "LABEL") return;
      selectCard("guest");
    });
  }
}

function setupCardKeyboard() {
  const cards = qsa(".card");
  for (let i = 0; i < cards.length; i++) {
    cards[i].addEventListener("keydown", function (e) {
      const key = e.key;
      if (key === "Enter" || key === " ") {
        e.preventDefault();
        selectCard(cards[i].id);
      }
    });
  }
}

function setupGuestPreview() {
  const fileInput = qs("#guestImage");
  const preview = qs("#guestPreview");
  if (!fileInput) return;

  fileInput.addEventListener("change", function () {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function () {
      guestImageData = reader.result;
      preview.src = guestImageData;
    };
    reader.readAsDataURL(file);
  });
}

function validateAndSave(event) {
  const errors = qs("#errors");
  if (!errors) return;
  errors.textContent = "";

  if (selected === "") {
    event.preventDefault();
    errors.textContent = "Please choose a player.";
    return;
  }

  let chosen = null;

  if (selected === "p1") {
    chosen = player1;
  } else if (selected === "p2") {
    chosen = player2;
  } else {
    const id = qs("#guestId").value.trim();
    const age = Number(qs("#guestAge").value);
    const res = Number(qs("#resilience").value);
    const exh = Number(qs("#exhaustion").value);
    const def = Number(qs("#defense").value);

    if (id.length < 2) {
      event.preventDefault();
      errors.textContent = "Guest name is required.";
      return;
    }
    if (guestImageData === "") {
      event.preventDefault();
      errors.textContent = "Please upload an image.";
      return;
    }
    if (isNaN(age) || age <= 0) {
      event.preventDefault();
      errors.textContent = "Please enter a valid age.";
      return;
    }
    if (isNaN(age) || age < 16) {
      event.preventDefault();
      errors.textContent = "Age must be 16 or older";
      return;
    }
    if (res === 0 || exh === 0 || def === 0) {
      event.preventDefault();
      errors.textContent = "Select all three stat values.";
      return;
    }

    chosen = {
      id: "guest",
      name: id,
      avatar: guestImageData,
      age: age,
      stats: { resilience: res, exhaustion: exh, defense: def },
    };
  }

  localStorage.setItem("am_player", JSON.stringify(chosen));
}

document.addEventListener("DOMContentLoaded", function () {
  const form = qs("#startForm");
  if (form) {
    renderPresets();
    setupCardClicks();
    setupCardKeyboard();
    setupGuestPreview();
    form.addEventListener("submit", validateAndSave);
  }
});

// =============================================
// GAME PAGE (absolute-monopoly.html)
// =============================================

function $(sel) {
  return document.querySelector(sel);
}

let savedPlayer = null;
try {
  savedPlayer = JSON.parse(localStorage.getItem("am_player"));
} catch (e) {
  savedPlayer = null;
}

// if game opened directly without selecting a player, send back
document.addEventListener("DOMContentLoaded", function () {
  const isGamePage = $("#funds") !== null;
  if (isGamePage && !savedPlayer) {
    window.location.href = "../character-selection/character-selection.html";
  }
});

const state = {
  funds: 20,
  price: 1.0,
  inventory: 0,
  demand: 5.0,
  raw: 10,
  factories: 0,
};

// TWIST: reputation / customer trust
let reputation = 50; // 0..100

function getPriceMultiplier() {
  // customers pay a bit more with high rep, less with low rep (about 0.85x–1.15x)
  const delta = (reputation - 50) / 200; // -0.25..+0.25 compressed later
  let mult = 1 + delta * 0.6; // -0.15..+0.15 around 1
  if (mult < 0.85) mult = 0.85;
  if (mult > 1.15) mult = 1.15;
  return mult;
}
function getRawCost() {
  // base $5 → discount at high rep, surcharge at low rep
  if (reputation >= 80) return 4;
  if (reputation <= 20) return 6;
  return 5;
}
function getFactoryCost() {
  // base $50 → discount/surcharge
  if (reputation >= 80) return 45;
  if (reputation <= 20) return 60;
  return 50;
}
function changeReputation(amount) {
  reputation += amount;
  if (reputation < 0) reputation = 0;
  if (reputation > 100) reputation = 100;
}
// --------------------------------------------------------

function initPlayerPanel() {
  let name = "Player";
  let avatar = "/assets/avatars/player1.png";
  let stats = { resilience: 1, exhaustion: 1, defense: 1 };

  if (savedPlayer) {
    if (savedPlayer.name) name = savedPlayer.name;
    if (savedPlayer.avatar) avatar = savedPlayer.avatar;
    if (savedPlayer.stats) stats = savedPlayer.stats;
  }

  const plName = $("#plName");
  const plAvatar = $("#plAvatar");
  const plStats = $("#plStats");

  if (!plName) return;

  plName.textContent = name;
  if (plAvatar) plAvatar.src = avatar;

  if (plStats) {
    let list = "";
    list += "<li>resilience: " + stats.resilience + "</li>";
    list += "<li>exhaustion: " + stats.exhaustion + "</li>";
    list += "<li>defense: " + stats.defense + "</li>";
    plStats.innerHTML = list;
  }
}

function updateUI() {
  if ($("#funds")) $("#funds").textContent = state.funds.toFixed(2);
  if ($("#price")) $("#price").textContent = state.price.toFixed(2);
  if ($("#inventory")) $("#inventory").textContent = state.inventory;
  if ($("#demand")) $("#demand").textContent = state.demand.toFixed(1);
  if ($("#raw")) $("#raw").textContent = state.raw;
  if ($("#ips")) $("#ips").textContent = state.factories.toFixed(1);
  if ($("#reputation")) $("#reputation").textContent = reputation;

  // reflect dynamic costs in button labels
  const buyMatsBtn = $("#buyMats");
  const buyFactoryBtn = $("#buyFactory");
  if (buyMatsBtn) buyMatsBtn.textContent = "Buy 10 Raw ($" + getRawCost() + ")";
  if (buyFactoryBtn)
    buyFactoryBtn.textContent = "Buy Factory ($" + getFactoryCost() + ")";
}

function say(msg) {
  const npc = $("#npc");
  if (npc) npc.textContent = msg;
}

function checkMilestones() {
  // positive feedback
  if (state.funds >= 100 && state.funds < 150) {
    say("Nice bankroll ! you're rolling !");
  }
  if (reputation >= 80 && reputation < 90) {
    say("Customers love you. Prices can stretch a bit !");
  }
  if (state.factories === 3) {
    say("Factory row ! Production's humming.");
  }

  // negative feedback
  if (state.funds < 5) {
    say("You're running low on funds!");
  }
  if (reputation <= 20) {
    say("Your reputation's tanking... time to fix that.");
  }
}

function recalcDemand() {
  const base = 6.0;
  const pricePenalty = Math.max(0, state.price - 1.0) * 1.2;
  const stockPenalty = Math.min(3.0, state.inventory / 25.0);
  state.demand = Math.max(0, base - pricePenalty - stockPenalty);
}

function tick() {
  // manufacture
  const made = Math.min(state.factories, state.raw);
  state.inventory += made;
  state.raw -= made;

  // sell with reputation multiplier
  const potential = Math.floor(state.demand);
  const sold = Math.min(potential, state.inventory);
  state.inventory -= sold;

  const paidPerItem = state.price * getPriceMultiplier();
  state.funds += sold * paidPerItem;

  // reputation changes
  if (sold > 0) changeReputation(1);
  else changeReputation(-1);
  if (state.price > 2.5) changeReputation(-1); // overpricing hurts rep

  // demand is nudged by reputation
  recalcDemand();
  if (reputation >= 80) state.demand += 0.5;
  if (reputation <= 20) state.demand -= 0.5;

  updateUI();
}

function bindControls() {
  const up = $("#priceUp");
  const down = $("#priceDown");
  const make = $("#makeOne");
  const mats = $("#buyMats");
  const factory = $("#buyFactory");
  const reset = $("#resetGame");

  if (up) {
    up.addEventListener("click", function () {
      state.price = state.price + 0.25;
      recalcDemand();
      updateUI();
    });
  }

  if (down) {
    down.addEventListener("click", function () {
      state.price = Math.max(0.25, state.price - 0.25);
      recalcDemand();
      updateUI();
    });
  }

  if (make) {
    make.addEventListener("click", function () {
      if (state.raw > 0) {
        state.raw = state.raw - 1;
        state.inventory = state.inventory + 1;
        updateUI();
      } else {
        say("You need raw materials first.");
        changeReputation(-1);
      }
    });
  }

  if (mats) {
    mats.addEventListener("click", function () {
      const cost = getRawCost();
      if (state.funds >= cost) {
        state.funds = state.funds - cost;
        state.raw = state.raw + 10;
        changeReputation(1); // suppliers like steady buyers
        updateUI();
      } else {
        say("Not enough funds.");
        changeReputation(-1);
      }
    });
  }

  if (factory) {
    factory.addEventListener("click", function () {
      const cost = getFactoryCost();
      if (state.funds >= cost) {
        state.funds = state.funds - cost;
        state.factories = state.factories + 1;
        changeReputation(2); // big investment = respect
        updateUI();
      } else {
        say("Earn more before buying a factory.");
        changeReputation(-1);
      }
    });
  }

  if (reset) {
    reset.addEventListener("click", function () {
      localStorage.removeItem("am_player");
      window.location.href = "../character-selection/character-selection.html";
    });
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const isGamePage = $("#funds") !== null;
  if (isGamePage) {
    initPlayerPanel();
    recalcDemand();
    updateUI();
    bindControls();
    setInterval(tick, 1000);
  }
});
