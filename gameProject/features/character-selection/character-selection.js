
import { fetchCharacters } from "../../services/character-api.js";
import { sortByStrength } from "../../utils/character-sorters.js";

let characters = [];
let selectedId = null;

$(document).ready(async function () {
  const $grid = $("#characters");
  const $start = $("#start-game");

  $grid.html("<p>Loading characters...</p>");

  try {
    let data = await fetchCharacters(12);
    data = sortByStrength(data);
    characters = data;

    const savedId = Number(localStorage.getItem("selectedCharacterId"));
    if (savedId) {
      selectedId = savedId;
    }

    renderCharacters();
    updateStartButton();
  } catch (err) {
    console.error(err);
    $grid.html("<p>Could not load characters. Try again later.</p>");
    return;
  }

  // click handler for all cards
  $grid.on("click", ".card", function () {
    const id = Number($(this).attr("data-id"));
    selectedId = id;

    localStorage.setItem("selectedCharacterId", String(id));

    renderCharacters();
    updateStartButton();
  });

  // save and go back to hub
  $start.on("click", function () {
    if (!selectedId) return;

    const chosen = characters.find((c) => c.id === selectedId);
    if (chosen) {
      // shape Absolute Monopoly expects: { name, avatar, stats: { ... } }
      const amPlayer = {
        name: chosen.name,
        avatar: chosen.avatar,
        stats: {
          resilience: Math.max(1, Math.round(chosen.hp / 30)),
          exhaustion: Math.max(1, 5 - Math.round(chosen.speed / 40)),
          defense: Math.max(1, Math.round(chosen.defense / 30)),
        },
      };

      localStorage.setItem("am_player", JSON.stringify(amPlayer));
    }

    window.location.href = "../main-menu/main-menu.html";
  });
});

function renderCharacters() {
  const $grid = $("#characters");

  if (!characters.length) {
    $grid.html("<p>No characters found.</p>");
    return;
  }

  let html = "";

  for (let i = 0; i < characters.length; i++) {
    const c = characters[i];
    const isSelected = c.id === selectedId;

    html += `
      <button class="card ${isSelected ? "selected" : ""}" type="button" data-id="${c.id}">
        <img src="${c.avatar}" alt="${c.name}" class="card-avatar">
        <h3>${c.name}</h3>
        <p>HP: ${c.hp}</p>
        <p>ATK: ${c.attack}</p>
        <p>DEF: ${c.defense}</p>
        <p>SPD: ${c.speed}</p>
      </button>
    `;
  }

  $grid.html(html);
}

function updateStartButton() {
  const $start = $("#start-game");
  $start.prop("disabled", !selectedId);
}
