// features/character-selection/character-selection.js
import { fetchCharacters } from "../../services/character-api.js";

const STORAGE_KEYS = {
  selectedCharacter: "am_selectedCharacter",
};

let selected = null;

function setError(msg) {
  $("#errors").text(msg || "");
}

function setSelected(cardEl, character) {
  $(".character-card").removeClass("is-selected");
  $(cardEl).addClass("is-selected");

  selected = character;

  // enable submit once a character is picked
  $("#start-game").prop("disabled", false);

  // clear errors and reset confirm input
  $("#confirmName").val("");
  setError("");
}

function renderCharacters(characters) {
  const $grid = $("#characters");
  $grid.empty();

  characters.forEach((c) => {
    const $card = $(`
      <button type="button" class="character-card">
        <img class="character-avatar" alt="" />
        <div class="character-meta">
          <h3 class="character-name"></h3>
          <ul class="character-stats">
            <li>hp: <span class="stat-hp"></span></li>
            <li>atk: <span class="stat-atk"></span></li>
            <li>def: <span class="stat-def"></span></li>
            <li>spd: <span class="stat-spd"></span></li>
          </ul>
        </div>
      </button>
    `);

    $card.find(".character-avatar").attr("src", c.avatar).attr("alt", c.name);
    $card.find(".character-name").text(c.name);

    $card.find(".stat-hp").text(c.stats.hp);
    $card.find(".stat-atk").text(c.stats.attack);
    $card.find(".stat-def").text(c.stats.defense);
    $card.find(".stat-spd").text(c.stats.speed);

    $card.on("click", function () {
      setSelected(this, c);
    });

    $grid.append($card);
  });
}

function validateForm() {
  if (!selected) {
    setError("Pick a character first.");
    return false;
  }

  const typed = $("#confirmName").val().trim();

  if (!typed) {
    setError("Please confirm the character name.");
    return false;
  }

  if (typed.toLowerCase() !== String(selected.name).toLowerCase()) {
    setError("Name does not match the selected character.");
    return false;
  }

  return true;
}

function saveSelectedCharacter() {
  localStorage.setItem(STORAGE_KEYS.selectedCharacter, JSON.stringify(selected));
}

$(async function () {
  if (!$("#characters").length) return;

  $("#characters").text("loading characters...");
  setError("");

  try {
    const characters = await fetchCharacters(12);
    renderCharacters(characters);
  } catch (err) {
    console.error(err);
    $("#characters").empty();
    setError("Could not load characters. Try refreshing.");
  }

  $("#characterForm").on("submit", function (e) {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    saveSelectedCharacter();
    window.location.href = "../main-menu/main-menu.html";
  });
});
