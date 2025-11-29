// features/cookie-clicker/player.js

export const PLAYER_ONE = {
  name: "P1",
  totalScore: 0,
  totalHealth: 100,
  currentSprite: "idle",
  sprites: {
    idle: "./assets/1-p1-idle.png",
    heal: "./assets/2-p1-heal.png",
    attack: "./assets/3-p1-attack.png",
    hurt: "./assets/4-p1-hurt.png",
    win: "./assets/5-p1-win.png",
    lose: "./assets/6-p2-lose.png", // or whatever your file name is
    bake: "./assets/7-p1-bake.png",
  },
  updateScore(amount) {
    this.totalScore += amount;
  },
  loseHealth(amount) {
    this.totalHealth = Math.max(0, this.totalHealth - amount);
  },
  gainHealth(amount) {
    this.totalHealth = Math.min(100, this.totalHealth + amount);
  },
};

export const PLAYER_TWO = {
  name: "P2",
  totalScore: 0,
  totalHealth: 100,
  currentSprite: "idle",
  sprites: {
    idle: "./assets/1-p2-idle.png",
    heal: "./assets/2-p2-heal.png",
    attack: "./assets/3-p2-attack.png",
    hurt: "./assets/4-p2-hurt.png",
    win: "./assets/5-p2-win.png",
    lose: "./assets/6-p2-lose.png",
    bake: "./assets/7-p2-bake.png",
  },
  updateScore(amount) {
    this.totalScore += amount;
  },
  loseHealth(amount) {
    this.totalHealth = Math.max(0, this.totalHealth - amount);
  },
  gainHealth(amount) {
    this.totalHealth = Math.min(100, this.totalHealth + amount);
  },
};
