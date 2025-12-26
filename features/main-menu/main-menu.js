$(document).ready(function () {
  const raw = localStorage.getItem("am_selectedCharacter");

  if (!raw) {
    window.location.href = "../character-selection/character-selection.html";
    return;
  }

  let character;
  try {
    character = JSON.parse(raw);
  } catch (error) {
    console.log("bad selected character in storage:", error);
    localStorage.removeItem("am_selectedCharacter");
    window.location.href = "../character-selection/character-selection.html";
    return;
  }

  if (!character || !character.name) {
    localStorage.removeItem("am_selectedCharacter");
    window.location.href = "../character-selection/character-selection.html";
    return;
  }

  // optional image spot
  const $img = $("#menuPlayerImg");
  if ($img.length && character.avatar) {
    $img.attr("src", character.avatar);
    $img.attr("alt", character.name);
  }

  const $header = $(".hub-header");
  if (!$header.length) return;

  const $banner = $("<div>");
  $banner.addClass("current-player-banner");
  $banner.text("current fighter: " + character.name);

  $header.append($banner);
});
