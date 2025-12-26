/**
 * use ES module import for product data.
 * items.js exports: export const ITEMS = [ ... ]
 */
import { ITEMS } from "./constants/items.js";
import { readProfile, writeProfile } from "../../utils/profile.js";

/* ============================
   state and DOM references
============================ */

/** shared wallet in profile */
let profile = readProfile();

/** keep score in cents to avoid floating-point issues. */
let player = { name: "Player 1", scoreCents: profile.pointsCents }; // from saved wallet

// jQuery refs (asg3 requirement)
const $shop = $(".shop");
const $scoreValue = $("#scoreValue");
const $template = $(".item.template");
const $emptyState = $(".empty");
const $shopLogo = $("#shopLogo");
const $shopAvatarImg = $("#shopPlayerAvatar");
const $shopPlayerName = $("#shopPlayerName");

// raw DOM elements where needed
const shop = $shop[0];
const template = $template[0];

// set logo
if ($shopLogo.length) {
  $shopLogo.attr("src", "./assets/the_shop_alternate.png");
}

/* ============================
   load selected fighter (canonical key)
============================ */

const savedFighterRaw = localStorage.getItem("am_selectedCharacter");

if (savedFighterRaw) {
  try {
    const fighter = JSON.parse(savedFighterRaw);

    if (fighter && fighter.name) {
      player.name = fighter.name;
      if ($shopPlayerName.length) {
        $shopPlayerName.text("Shopping as: " + fighter.name);
      }
    }

    if (fighter && fighter.avatar && $shopAvatarImg.length) {
      $shopAvatarImg
        .attr("src", fighter.avatar)
        .attr("alt", fighter.name || "Selected fighter")
        .prop("hidden", false);
    }
  } catch (e) {
    // ignore bad data
  }
}

/* ============================
   helpers
============================ */

const MAX_STARS = 5;

/** dollars -> cents (integer) */
function toCents(n) {
  return Math.round(Number(n) * 100);
}

/** cents -> "x.xx" string */
function fromCents(cents) {
  return (Number(cents) / 100).toFixed(2);
}

/** format plain number dollars -> "$x.xx" (for item display) */
function formatPrice(n) {
  return "$" + Number(n).toFixed(2);
}

/** simple star string */
function makeStars(rate, count) {
  let stars = "";
  const rounded = Math.round(rate);
  for (let i = 0; i < MAX_STARS; i++) {
    stars += i < rounded ? "★" : "☆";
  }
  return stars + " (" + count + ")";
}

/** update header score always with two decimals */
function updateScore() {
  if ($scoreValue.length) {
    $scoreValue.text(fromCents(player.scoreCents));
  }
}

function saveWallet() {
  profile.pointsCents = player.scoreCents;
  writeProfile(profile);
}

/* ============================
   constants
============================ */

const MESSAGES = {
  purchased: "Purchased!",
  insufficient: "Not enough points.",
};

/* ============================
   rendering
============================ */

function renderShop() {
  if (!$shop.length || !template || !$emptyState.length) return;

  // remove old rendered items
  $shop.find(".item:not(.template)").remove();

  if (!Array.isArray(ITEMS) || ITEMS.length === 0) {
    $emptyState.prop("hidden", false);
    return;
  }

  $emptyState.prop("hidden", true);

  ITEMS.forEach((data, i) => {
    const card = template.cloneNode(true);
    card.classList.remove("template");
    card.hidden = false;
    card.dataset.index = String(i);

    const $card = $(card);
    const $title = $card.find(".item__title");
    const $desc = $card.find(".item__desc");
    const $img = $card.find(".item__img");
    const $price = $card.find(".item__price");
    const $stars = $card.find(".stars");
    const $btn = $card.find("[data-action='buy']");
    const $msg = $card.find(".msg");

    $title.text(data.title);
    $desc.text(data.description);

    // store url for lazy-load
    $img.attr("data-src", data.image).attr("alt", data.title);

    $price.text(formatPrice(data.price));
    $stars.text(makeStars(data.rating.rate, data.rating.count));

    // keep purchase state across refresh
    const purchased = !!profile.purchases[String(i)];
    if ($btn.length) $btn.prop("disabled", purchased);
    if (purchased && $msg.length) $msg.prop("hidden", false).text(MESSAGES.purchased);

    shop.appendChild(card);
  });
}

/* ============================
   purchase logic (jQuery)
============================ */

function bindShopEvents() {
  if (!$shop.length) return;

  $shop.on("click", "[data-action='buy']", function () {
    const button = this;
    const $card = $(button).closest(".item");
    if (!$card.length || $card.hasClass("template")) return;

    const index = Number($card.data("index"));
    const itemData = ITEMS[index];
    if (!itemData) return;

    const $msg = $card.find(".msg");
    const priceCents = toCents(itemData.price);

    if (player.scoreCents >= priceCents) {
      player.scoreCents -= priceCents;

      // mark purchase persistent
      profile.purchases[String(index)] = true;
      saveWallet();

      button.disabled = true;
      if ($msg.length) $msg.prop("hidden", false).text(MESSAGES.purchased);

      updateScore();
    } else {
      if ($msg.length) $msg.prop("hidden", false).text(MESSAGES.insufficient);
    }
  });
}

/* ============================
   IntersectionObserver (single)
============================ */

const THRESHOLD = 0.6;

function setupObserver() {
  const cards = document.querySelectorAll(".item:not(.template)");
  if (cards.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const card = entry.target;
        const $card = $(card);

        // lazy-load image once
        if (entry.isIntersecting) {
          const img = $card.find(".item__img")[0];
          if (img && !img.src) {
            const src = img.getAttribute("data-src");
            if (src) img.src = src;
          }
        }

        // fade info in/out based on threshold
        const info = $card.find(".item__info")[0];
        if (info) {
          const visibleEnough = entry.intersectionRatio >= THRESHOLD;
          info.classList.toggle("is-visible", visibleEnough);
        }
      });
    },
    { threshold: [0, THRESHOLD, 1] }
  );

  cards.forEach((card) => observer.observe(card));
}

/* ============================
   Init
============================ */

function init() {
  if (!template || !$shop.length || !$scoreValue.length) return;

  // refresh from storage in case another game updated it
  profile = readProfile();
  player.scoreCents = profile.pointsCents;

  renderShop();
  updateScore();
  bindShopEvents();
  setupObserver();
}

$(init);
