// public/index.js

const STORAGE_KEYS = {
  selectedCharacter: "am_selectedCharacter",
};

function getSelectedCharacter() {
  const raw = localStorage.getItem(STORAGE_KEYS.selectedCharacter);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (e) {
    console.log("bad selected character in storage:", e);
    return null;
  }
}

$(function () {
  $("#start-btn").on("click", function () {
    const character = getSelectedCharacter();

    if (character && character.name) {
      window.location.href = "../features/main-menu/main-menu.html";
      return;
    }

    window.location.href =
      "../features/character-selection/character-selection.html";
  });
});
