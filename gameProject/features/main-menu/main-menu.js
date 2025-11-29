
$(document).ready(function () {
  const saved = localStorage.getItem("am_player");

  // if no saved player, force the user to the character selection screen first
  if (!saved) {
    window.location.href = "../character-selection/character-selection.html";
    return;
  }

  let player;
  try {
    player = JSON.parse(saved);
  } catch (e) {
    // if something is wrong with the data, clear it and send them back
    localStorage.removeItem("am_player");
    window.location.href = "../character-selection/character-selection.html";
    return;
  }

  if (!player || !player.name) {
    window.location.href = "../character-selection/character-selection.html";
    return;
  }

  const header = document.querySelector(".hub-header");
  if (!header) return;

  const banner = document.createElement("div");
  banner.className = "current-player-banner";
  banner.textContent = "Current fighter: " + player.name;

  header.appendChild(banner);
});
