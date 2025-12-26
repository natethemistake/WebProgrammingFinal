// services/poke-item-api.js

/**
 * fetch a random pokemart-ish item name from pokéapi
 * @returns {Promise<string>}
 */
async function fetchRandomProductName() {
  // pick from common shop items (safe + recognizable)
  const itemIds = [17, 18, 19, 20, 21, 22, 23, 24, 25, 26]; 
  // potions / pokeballs / antidote-ish range depending on api version

  const id = itemIds[Math.floor(Math.random() * itemIds.length)];
  const url = "https://pokeapi.co/api/v2/item/" + id;

  const response = await fetch(url);
  if (!response.ok) throw new Error("poke item api failed: " + response.status);

  const data = await response.json();
  if (!data || !data.name) throw new Error("poke item api bad shape");

  // nicer display
  return String(data.name).replaceAll("-", " ");
}
