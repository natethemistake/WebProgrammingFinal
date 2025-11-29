/**
 * use ES module import for product data.
 * items.js exports: export const ITEMS = [ ... ]
 */
import { ITEMS } from "./constants/items.js";

/* ============================
   state and DOM references
============================ */

/** keep score in cents to avoid floating-point issues. */
let player = { name: "Player 1", scoreCents: 50000 }; // $500.00

/** Main containers and template elements */
const shop = document.querySelector(".shop");
const scoreValue = document.querySelector("#scoreValue");
const template = document.querySelector(".item.template");
const emptyState = document.querySelector(".empty");

// read selected fighter from localStorage (same as Absolute Monopoly)
const savedFighter = localStorage.getItem("am_player");
const shopAvatarImg = document.querySelector("#shopPlayerAvatar");
const shopPlayerName = document.querySelector("#shopPlayerName");

if (savedFighter) {
  try {
    const fighter = JSON.parse(savedFighter);

    if (fighter && fighter.name) {
      player.name = fighter.name;
      if (shopPlayerName) {
        shopPlayerName.textContent = "Shopping as: " + fighter.name;
      }
    }

    if (fighter && fighter.avatar && shopAvatarImg) {
      shopAvatarImg.src = fighter.avatar;
      shopAvatarImg.alt = fighter.name || "Selected fighter";
      shopAvatarImg.hidden = false;
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
  if (scoreValue) {
    scoreValue.textContent = fromCents(player.scoreCents);
  }
}

/* ============================
   constants
============================ */

const MESSAGES = {
  purchased: "Purchased!",
  insufficient: "Not enough score.",
};

/* ============================
   rendering
============================ */

function renderShop() {
  // clear previous render (keep template and empty-state)
  shop.querySelectorAll(".item:not(.template)").forEach(function (node) {
    node.remove();
  });

  if (!Array.isArray(ITEMS) || ITEMS.length === 0) {
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;

  ITEMS.forEach(function (data, i) {
    const card = template.cloneNode(true);
    card.classList.remove("template");
    card.hidden = false;
    card.dataset.index = String(i);

    card.querySelector(".item__title").textContent = data.title;
    card.querySelector(".item__desc").textContent = data.description;

    const imgEl = card.querySelector(".item__img");
    imgEl.setAttribute("data-src", data.image);
    imgEl.setAttribute("alt", data.title);

    card.querySelector(".item__price").textContent = formatPrice(data.price);
    card.querySelector(".stars").textContent = makeStars(
      data.rating.rate,
      data.rating.count
    );

    shop.appendChild(card);
  });
}

/* ============================
   purchase logic
============================ */

/**
 * delegated click handler for "Purchase" buttons
 * deducts score (in cents) and disables the button on success
 */
shop.addEventListener("click", function (event) {
  const button = event.target.closest("[data-action='buy']");
  if (!button) return;

  const card = button.closest(".item");
  if (!card || card.classList.contains("template")) return;

  const index = Number(card.dataset.index);
  const itemData = ITEMS[index];
  const msg = card.querySelector(".msg");

  const priceCents = toCents(itemData.price);

  if (player.scoreCents >= priceCents) {
    player.scoreCents -= priceCents;
    button.disabled = true;
    if (msg) {
      msg.hidden = false;
      msg.textContent = MESSAGES.purchased;
    }
    updateScore();
  } else {
    if (msg) {
      msg.hidden = false;
      msg.textContent = MESSAGES.insufficient;
    }
  }
});


/* ============================
   IntersectionObservers
============================ */

/**
 * lazy load images when the card first appears
 * threshold 0.01 to trigger as soon as it enters view a bit
 */
const imageObserver = new IntersectionObserver(
  function (entries, obs) {
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (!entry.isIntersecting) continue;

      const img = entry.target.querySelector(".item__img");
      if (img && !img.src) {
        const src = img.getAttribute("data-src");
        if (src) {
          img.src = src;
          img.addEventListener(
            "load",
            function () {
              img.classList.add("is-visible");
            },
            { once: true }
          );
        }
      }
      obs.unobserve(entry.target); // load once
    }
  },
  { threshold: 0.01 }
);

/**
 * show info at => 0.25 visibility; hide when leaving and <= 0.75
 * detect "leaving" by comparing current ratio to previous ratio
 */
const infoObserver = new IntersectionObserver(
  function (entries) {
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const card = entry.target;
      const info = card.querySelector(".item__info");
      if (!info) continue;

      const ratio = entry.intersectionRatio;
      const prev = Number(card.dataset.prevRatio || 0);
      const decreasing = ratio < prev;

      if (ratio >= 0.25) {
        info.classList.add("is-visible");
      }
      if (decreasing && ratio <= 0.75) {
        info.classList.remove("is-visible");
      }

      card.dataset.prevRatio = String(ratio);
    }
  },
  { threshold: [0, 0.25, 0.75, 1] }
);

/** start observing every rendered card */
function observeCards() {
  const cards = document.querySelectorAll(".item:not(.template)");
  cards.forEach(function (card) {
    imageObserver.observe(card);
    infoObserver.observe(card);
  });
}

/* ============================
   navigation
============================ */

const backButton = document.querySelector("#backButton");

if (backButton) {
  backButton.addEventListener("click", function () {
    // Return to main menu (index.html)
    window.location.href = "../../index.html";
  });
}

/* ============================
   Init
============================ */
if (!template || !shop || !scoreValue) {
  // required elements not found
} else {
  renderShop();
  updateScore();
  observeCards();
}
