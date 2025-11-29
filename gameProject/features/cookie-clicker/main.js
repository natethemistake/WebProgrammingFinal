// features/cookie-clicker/main.js
// 1) import player objects
import { PLAYER_ONE, PLAYER_TWO } from "./player.js";

// --- state/consts ---
let isGameOver = false;
const BAKE_POINTS  = 10;
const SMACK_DAMAGE = 10;
const CONSUME_HEAL = 10;
const RESET_DELAY  = 800; // ms back to idle after an action

// 2) render function (updates screen)
function render() {
  // numbers
  $("#p1-score").text(PLAYER_ONE.totalScore);
  $("#p1-health").text(PLAYER_ONE.totalHealth);
  $("#p2-score").text(PLAYER_TWO.totalScore);
  $("#p2-health").text(PLAYER_TWO.totalHealth);

  // health bars
  $("#p1-hp-bar").css("width", PLAYER_ONE.totalHealth + "%");
  $("#p2-hp-bar").css("width", PLAYER_TWO.totalHealth + "%");

  // images
  $("#p1-img").attr("src", PLAYER_ONE.sprites[PLAYER_ONE.currentSprite]);
  $("#p2-img").attr("src", PLAYER_TWO.sprites[PLAYER_TWO.currentSprite]);
}

// run action → render → check game over → maybe reset to idle
function step(action) {
  if (isGameOver) return; // ignore clicks after game over

  action();
  render();

  const over = checkGameOver();
  if (!over && !isGameOver) {
    setTimeout(function () {
      if (!isGameOver) {
        PLAYER_ONE.currentSprite = "idle";
        PLAYER_TWO.currentSprite = "idle";
        render();
      }
    }, RESET_DELAY);
  }
}

// 3) wire buttons (jQuery)
$(function () {
  // Player 1
  $("#p1-bake").on("click", function () {
    step(function () {
      PLAYER_ONE.updateScore(BAKE_POINTS);
      PLAYER_ONE.currentSprite = "bake";
    });
  });

  $("#p1-smack").on("click", function () {
    step(function () {
      PLAYER_ONE.currentSprite = "attack";
      PLAYER_TWO.currentSprite = "hurt";
      PLAYER_TWO.loseHealth(SMACK_DAMAGE);
    });
  });

  $("#p1-consume").on("click", function () {
    step(function () {
      PLAYER_ONE.currentSprite = "heal";
      PLAYER_ONE.gainHealth(CONSUME_HEAL);
      PLAYER_ONE.updateScore(-CONSUME_HEAL);
    });
  });

  // Player 2
  $("#p2-bake").on("click", function () {
    step(function () {
      PLAYER_TWO.updateScore(BAKE_POINTS);
      PLAYER_TWO.currentSprite = "bake";
    });
  });

  $("#p2-smack").on("click", function () {
    step(function () {
      PLAYER_TWO.currentSprite = "attack";
      PLAYER_ONE.currentSprite = "hurt";
      PLAYER_ONE.loseHealth(SMACK_DAMAGE);
    });
  });

  $("#p2-consume").on("click", function () {
    step(function () {
      PLAYER_TWO.currentSprite = "heal";
      PLAYER_TWO.gainHealth(CONSUME_HEAL);
      PLAYER_TWO.updateScore(-CONSUME_HEAL);
    });
  });

  // Reset button
  $("#reset").on("click", function () {
    PLAYER_ONE.totalScore  = 0;
    PLAYER_TWO.totalScore  = 0;
    PLAYER_ONE.totalHealth = 100;
    PLAYER_TWO.totalHealth = 100;

    PLAYER_ONE.currentSprite = "idle";
    PLAYER_TWO.currentSprite = "idle";

    isGameOver = false;
    $("#over").text("");
    $("body").removeClass("game-over-anim");
    enableButtons();
    render();
  });

  // initial render on page load
  render();
});

// checks for every action
function checkGameOver() {
  // 1) health endings
  if (PLAYER_ONE.totalHealth <= 0 && PLAYER_TWO.totalHealth <= 0) {
    showOver("Both players reached 0 health.");
    return true;
  }
  if (PLAYER_ONE.totalHealth <= 0) {
    PLAYER_ONE.currentSprite = "lose";
    PLAYER_TWO.currentSprite = "win";
    render();
    showOver("Player 2 wins (Player 1 HP reached 0).");
    return true;
  }
  if (PLAYER_TWO.totalHealth <= 0) {
    PLAYER_TWO.currentSprite = "lose";
    PLAYER_ONE.currentSprite = "win";
    render();
    showOver("Player 1 wins (Player 2 HP reached 0).");
    return true;
  }

  // 2) score domination (> 3x)
  if (PLAYER_TWO.totalScore > 0 && PLAYER_ONE.totalScore >= PLAYER_TWO.totalScore * 3) {
    PLAYER_ONE.currentSprite = "win";
    PLAYER_TWO.currentSprite = "lose";
    render();
    showOver("Player 1 wins (>3x score).");
    return true;
  }
  if (PLAYER_ONE.totalScore > 0 && PLAYER_TWO.totalScore >= PLAYER_ONE.totalScore * 3) {
    PLAYER_TWO.currentSprite = "win";
    PLAYER_ONE.currentSprite = "lose";
    render();
    showOver("Player 2 wins (>3x score).");
    return true;
  }

  return false;
}

function showOver(message) {
  isGameOver = true;
  $("#over").text("Game Over: " + message);
  $("body").addClass("game-over-anim");
  disableButtons();
}

function disableButtons() {
  $("#p1-bake, #p1-smack, #p1-consume, #p2-bake, #p2-smack, #p2-consume")
    .prop("disabled", true);
}

function enableButtons() {
  $("#p1-bake, #p1-smack, #p1-consume, #p2-bake, #p2-smack, #p2-consume")
    .prop("disabled", false);
}
