// services/character-api.js

export async function fetchCharacters(limit = 12) {
  const url = `https://pokeapi.co/api/v2/pokemon?limit=${limit}`;

  const res = await fetch(url);
  const data = await res.json();

  const allCharacters = [];

  for (let i = 0; i < data.results.length; i++) {
    const pokeRes = await fetch(data.results[i].url);
    const pokeData = await pokeRes.json();

    const character = {
      id: pokeData.id,
      name: pokeData.name[0].toUpperCase() + pokeData.name.slice(1),
      hp: pokeData.stats[0].base_stat,
      attack: pokeData.stats[1].base_stat,
      defense: pokeData.stats[2].base_stat,
      speed: pokeData.stats[5].base_stat,
      avatar: pokeData.sprites.front_default
    };

    allCharacters.push(character);
  }

  return allCharacters;
}
