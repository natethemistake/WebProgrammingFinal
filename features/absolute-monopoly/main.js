// features/absolute-monopoly/main.js

import { readProfile, writeProfile } from "../../utils/profile.js";

const STORAGE_KEYS = {
  selectedCharacter: "am_selectedCharacter",
};

const FALLBACK = {
  NEED_RAW: "you need supplies first.",
  NOT_ENOUGH_FUNDS: "not enough pokédollars.",
  EARN_MORE: "earn more before upgrading the workshop.",
  NPC_DOWN: "market radio is down. keep grinding.",
  PRODUCT_DOWN: "product line is stable. keep grinding.",
};

/* =======================
   wallet / playtime config
======================= */

const PAY = {
  // base rate: $0.02 per second = $1.20 per minute
  centsPerSecondBase: 2,

  // small progress scaling
  centsPerSecondPerFactory: 1, // +$0.01/sec per factory
  centsPerSecondAtHighRep: 1,  // +$0.01/sec if rep >= 80

  // cap so it can’t run away
  centsPerSecondMax: 10, // max $0.10/sec

  // write wallet at most every N ms
  saveEveryMs: 8000,
};

class Wallet {
  constructor() {
    this.profile = readProfile();
    this.bufferCents = 0;
    this.lastSaveAt = Date.now();
    this.lastTickAt = Date.now();
  }

  getRateCentsPerSec(state) {
    let rate = PAY.centsPerSecondBase;
    rate += (Number(state.factories) || 0) * PAY.centsPerSecondPerFactory;
    if ((Number(state.reputation) || 0) >= 80) rate += PAY.centsPerSecondAtHighRep;

    return clamp(rate, 0, PAY.centsPerSecondMax);
  }

  onTick(state) {
    const now = Date.now();
    const dtSec = (now - this.lastTickAt) / 1000;
    this.lastTickAt = now;

    const safeDt = clamp(dtSec, 0, 3);

    const rate = this.getRateCentsPerSec(state);
    this.bufferCents += Math.round(rate * safeDt);

    // save sometimes
    if (now - this.lastSaveAt >= PAY.saveEveryMs) {
      this.flush();
      this.lastSaveAt = now;
    }
  }

  flush() {
    if (this.bufferCents <= 0) return;

    // refresh in case another game changed it
    this.profile = readProfile();
    this.profile.pointsCents = (Number(this.profile.pointsCents) || 0) + this.bufferCents;
    writeProfile(this.profile);

    this.bufferCents = 0;
  }
}

class Player {
  constructor(saved) {
    const s = (saved && saved.stats) || {};

    this.name = (saved && saved.name) || "manager";
    this.avatar = (saved && saved.avatar) || "./assets/player1.png";

    this.stats = {
      hp: Number(s.hp) || 1,
      attack: Number(s.attack) || 1,
      defense: Number(s.defense) || 1,
      speed: Number(s.speed) || 1,
    };
  }

  getProductionBonus() {
    return clamp(this.stats.attack / 100, 0, 1.0); // 0..1
  }

  getDemandBonus() {
    return clamp(this.stats.speed / 200, 0, 0.75); // 0..0.75
  }

  getReputationShield() {
    return clamp(this.stats.defense / 200, 0, 0.5); // 0..0.5
  }

  getEventShield() {
    return clamp(this.stats.hp / 250, 0, 0.6); // 0..0.6
  }
}

class GameState {
  constructor() {
    this.funds = 20;
    this.price = 1.0;
    this.inventory = 0;
    this.demand = 5.0;
    this.raw = 10;
    this.factories = 0;

    this.reputation = 50; // 0..100
  }

  clampReputation() {
    this.reputation = clamp(this.reputation, 0, 100);
  }

  getPriceMultiplier() {
    const delta = (this.reputation - 50) / 200;
    const mult = 1 + delta * 0.6;
    return clamp(mult, 0.85, 1.15);
  }

  getRawBaseCost() {
    if (this.reputation >= 80) return 4;
    if (this.reputation <= 20) return 6;
    return 5;
  }

  getFactoryBaseCost() {
    if (this.reputation >= 80) return 45;
    if (this.reputation <= 20) return 60;
    return 50;
  }
}

class ProductManager {
  constructor() {
    this.current = {
      name: "product",
      demandBoost: 1.0,
      rawDiscount: 0,
      factoryDiscount: 0,
    };
  }

  _effectsFromName(name) {
    const len = String(name).replaceAll(" ", "").length;

    const demandBoost = len >= 10 ? 1.25 : len >= 7 ? 1.15 : 1.05;
    const rawDiscount = len >= 10 ? 1 : 0;
    const factoryDiscount = len >= 10 ? 5 : 0;

    return { demandBoost, rawDiscount, factoryDiscount };
  }

  async loadNewProduct(ui, npc, market) {
    ui.setProductName("loading...");

    try {
      if (typeof fetchRandomProductName !== "function") {
        throw new Error("poke-item-api missing");
      }

      const name = await fetchRandomProductName();
      const fx = this._effectsFromName(name);

      this.current = { name, ...fx };
      ui.setProductName(this.current.name);

      npc.say(`new product drop: ${this.current.name}.`);
    } catch (err) {
      console.log("product api failed:", err);

      this.current = {
        name: "product",
        demandBoost: 1.0,
        rawDiscount: 0,
        factoryDiscount: 0,
      };

      ui.setProductName(this.current.name);
      ui.setNpcMessage(FALLBACK.PRODUCT_DOWN);
    }

    market.recalcDemand();
    ui.updateAll();
  }
}

class NpcSpeaker {
  constructor(ui) {
    this.ui = ui;
    this.lastNpcAt = 0;
  }

  async say(prefix) {
    const now = Date.now();
    if (now - this.lastNpcAt < 2500) return;
    this.lastNpcAt = now;

    if (typeof fetchNpcLine !== "function") {
      if (prefix) this.ui.setNpcMessage(prefix);
      return;
    }

    try {
      const line = await fetchNpcLine();
      const msg = prefix ? `${prefix} ${line}` : line;
      this.ui.setNpcMessage(msg);
    } catch (err) {
      console.log("npc api error:", err);
      this.ui.setNpcMessage(FALLBACK.NPC_DOWN);
    }
  }
}

class Market {
  constructor(state, player, products, ui, npc, wallet) {
    this.state = state;
    this.player = player;
    this.products = products;
    this.ui = ui;
    this.npc = npc;
    this.wallet = wallet;
  }

  getRawCost() {
    const base = this.state.getRawBaseCost();
    return Math.max(1, base - (this.products.current.rawDiscount || 0));
  }

  getFactoryCost() {
    const base = this.state.getFactoryBaseCost();
    return Math.max(1, base - (this.products.current.factoryDiscount || 0));
  }

  changeReputation(amount) {
    const shield = this.player.getReputationShield();
    let delta = amount;

    if (delta < 0) {
      delta = Math.round(delta * (1 - shield));
      if (delta === 0) delta = -1;
    }

    this.state.reputation += delta;
    this.state.clampReputation();
  }

  recalcDemand() {
    const s = this.state;

    const base = 6.0;
    const pricePenalty = Math.max(0, s.price - 1.0) * 1.2;
    const stockPenalty = Math.min(3.0, s.inventory / 25.0);

    let d = Math.max(0, base - pricePenalty - stockPenalty);

    d += this.player.getDemandBonus();
    d = d * (this.products.current.demandBoost || 1.0);

    if (s.reputation >= 80) d += 0.5;
    if (s.reputation <= 20) d -= 0.5;

    s.demand = Math.max(0, d);
  }

  tick() {
    const s = this.state;

    this.wallet.onTick(s);

    // production
    const baseMade = Math.min(s.factories, s.raw);

    const prodBonus = this.player.getProductionBonus();
    const bonus = Math.random() < prodBonus ? 1 : 0;

    const made = Math.min(s.raw, baseMade + bonus);

    s.inventory += made;
    s.raw -= made;

    // sales
    const potential = Math.floor(s.demand);
    const sold = Math.min(potential, s.inventory);
    s.inventory -= sold;

    const paidPerItem = s.price * s.getPriceMultiplier();
    s.funds += sold * paidPerItem;

    if (sold > 0) this.changeReputation(1);
    else this.changeReputation(-1);

    if (s.price > 2.5) {
      const shield = this.player.getEventShield();
      if (Math.random() > shield) this.changeReputation(-1);
    }

    this.recalcDemand();
    this.ui.updateAll();
    this.checkMilestones();
  }

  checkMilestones() {
    const s = this.state;

    if (s.funds < 5) this.npc.say("low funds warning.");
    if (s.reputation <= 20) this.npc.say("reputation is tanking.");

    if (s.funds >= 100 && s.funds < 150) this.npc.say("big bankroll.");
    if (s.reputation >= 80 && s.reputation < 90) this.npc.say("trainers love this mart.");
    if (s.factories === 3) this.npc.say("workshops are humming.");
  }
}

class UI {
  constructor(state, player, products, market, wallet) {
    this.state = state;
    this.player = player;
    this.products = products;
    this.market = market;
    this.wallet = wallet;
  }

  initPlayerPanel() {
    $("#plName").text(this.player.name);

    const $avatar = $("#plAvatar");
    if ($avatar.length) $avatar.attr("src", this.player.avatar).attr("alt", this.player.name);

    const st = this.player.stats;
    $("#plStats").html(
      `<li>hp: ${st.hp}</li>` +
        `<li>atk: ${st.attack}</li>` +
        `<li>def: ${st.defense}</li>` +
        `<li>spd: ${st.speed}</li>`
    );
  }

  setNpcMessage(msg) {
    const $npc = $("#npc");
    if (!$npc.length) return;

    $npc.stop(true, true).fadeOut(120, () => {
      $npc.text(msg).fadeIn(120).addClass("flash");
      setTimeout(() => $npc.removeClass("flash"), 450);
    });
  }

  setProductName(name) {
    $("#productName").text(name);
  }

  updateAll() {
    const s = this.state;

    $("#funds").text(s.funds.toFixed(2));
    $("#price").text(s.price.toFixed(2));
    $("#inventory").text(String(s.inventory));
    $("#demand").text(s.demand.toFixed(1));
    $("#raw").text(String(s.raw));
    $("#ips").text(s.factories.toFixed(1));
    $("#reputation").text(String(s.reputation));

    $("#buyMats").text(`buy 10 supplies ($${this.market.getRawCost()})`);
    $("#buyFactory").text(`upgrade workshop ($${this.market.getFactoryCost()})`);
  }

  bindControls(navigateToCharacterSelect) {
    $(document).on("pointerdown", "button", function (e) {
      const rect = this.getBoundingClientRect();
      this.style.setProperty("--x", `${e.clientX - rect.left}px`);
      this.style.setProperty("--y", `${e.clientY - rect.top}px`);
      $(this).addClass("ripple");
      setTimeout(() => $(this).removeClass("ripple"), 220);
    });

    $("#priceUp").on("click", () => {
      this.state.price += 0.25;
      this.market.recalcDemand();
      this.updateAll();
      pulse("#price");
    });

    $("#priceDown").on("click", () => {
      this.state.price = Math.max(0.25, this.state.price - 0.25);
      this.market.recalcDemand();
      this.updateAll();
      pulse("#price");
    });

    $("#makeOne").on("click", () => {
      if (this.state.raw > 0) {
        this.state.raw -= 1;
        this.state.inventory += 1;
        this.updateAll();
        floatFx("+1", 120, 0);
        return;
      }

      this.setNpcMessage(FALLBACK.NEED_RAW);
      this.market.changeReputation(-1);
      this.updateAll();
      shake("#raw");
    });

    $("#buyMats").on("click", () => {
      const cost = this.market.getRawCost();
      if (this.state.funds >= cost) {
        this.state.funds -= cost;
        this.state.raw += 10;
        this.market.changeReputation(1);
        this.updateAll();
        floatFx("-$", 110, 0);
        pulse("#raw");
        return;
      }

      this.setNpcMessage(FALLBACK.NOT_ENOUGH_FUNDS);
      this.market.changeReputation(-1);
      this.updateAll();
      shake("#funds");
    });

    $("#buyFactory").on("click", () => {
      const cost = this.market.getFactoryCost();
      if (this.state.funds >= cost) {
        this.state.funds -= cost;
        this.state.factories += 1;
        this.market.changeReputation(2);
        this.updateAll();
        pulse("#ips");
        return;
      }

      this.setNpcMessage(FALLBACK.EARN_MORE);
      this.market.changeReputation(-1);
      this.updateAll();
      shake("#funds");
    });

    $("#resetGame").on("click", () => {
      // flush wallet before leaving
      this.wallet.flush();
      localStorage.removeItem(STORAGE_KEYS.selectedCharacter);
      navigateToCharacterSelect(true);
    });
  }
}

// ----------------------
// helpers
// ----------------------

function clamp(num, min, max) {
  return Math.max(min, Math.min(max, num));
}

function getSavedCharacter() {
  const raw = localStorage.getItem(STORAGE_KEYS.selectedCharacter);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.log("bad selected character in storage:", err);
    return null;
  }
}

function redirectToCharacterSelection(reset) {
  const suffix = reset ? "?reset=true" : "";
  window.location.href = "../character-selection/character-selection.html" + suffix;
}

function pulse(selector) {
  const $el = $(selector);
  $el.addClass("pulse");
  setTimeout(() => $el.removeClass("pulse"), 450);
}

function shake(selector) {
  const $el = $(selector);
  $el.addClass("shake");
  setTimeout(() => $el.removeClass("shake"), 420);
}

function ensureFxLayer() {
  if ($(".am-fx-layer").length) return;
  $("body").append('<div class="am-fx-layer"></div>');
}

function floatFx(text, dx, dy) {
  ensureFxLayer();
  const $layer = $(".am-fx-layer");

  const x = window.innerWidth / 2 + (dx || 0);
  const y = window.innerHeight / 2 + (dy || 0);

  const $node = $('<div class="am-float"></div>').text(text).css({ left: x, top: y });
  $layer.append($node);

  setTimeout(() => $node.remove(), 950);
}

// ----------------------
// init
// ----------------------

$(function () {
  if ($("#funds").length === 0) return;

  const saved = getSavedCharacter();
  if (!saved || !saved.name) {
    localStorage.removeItem(STORAGE_KEYS.selectedCharacter);
    redirectToCharacterSelection(false);
    return;
  }

  const state = new GameState();
  const player = new Player(saved);
  const products = new ProductManager();
  const wallet = new Wallet();

  let market = null;

  const ui = new UI(state, player, products, {
    getRawCost: () => state.getRawBaseCost(),
    getFactoryCost: () => state.getFactoryBaseCost(),
    recalcDemand: () => {},
    changeReputation: () => {},
  }, wallet);

  const npc = new NpcSpeaker(ui);

  market = new Market(state, player, products, ui, npc, wallet);
  ui.market = market;

  const $npcImg = $("#npc-img");
  if ($npcImg.length) $npcImg.attr("src", "./assets/npc.png");

  ui.initPlayerPanel();
  market.recalcDemand();
  ui.updateAll();

  products.loadNewProduct(ui, npc, market);
  setInterval(() => products.loadNewProduct(ui, npc, market), 30000);

  ui.bindControls(redirectToCharacterSelection);

  setInterval(() => {
    if (Math.random() < 0.35) npc.say("market tip:");
  }, 12000);

  // flush wallet if they close tab
  window.addEventListener("beforeunload", () => wallet.flush());

  setInterval(() => market.tick(), 2000);
});
