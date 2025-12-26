const _cache = {
  listByLimit: new Map(), // limit -> fighters[]
  byUrl: new Map(), // url -> fighter
};

/**
 * @param {number} limit
 * @returns {Promise<Array<{id:number,name:string,avatar:string,stats:{hp:number,attack:number,defense:number,speed:number}}>>}
 */
export async function fetchCharacters(limit = 12) {
  const n = Math.max(1, Math.min(Number(limit) || 12, 30));

  if (_cache.listByLimit.has(n)) return _cache.listByLimit.get(n);

  const listRes = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${n}`);
  if (!listRes.ok) throw new Error("failed to fetch pokemon list");
  const listJson = await listRes.json();

  const urls = (listJson.results || []).map((p) => p.url).filter(Boolean);

  const fighters = await Promise.all(
    urls.map(async (url) => {
      if (_cache.byUrl.has(url)) return _cache.byUrl.get(url);

      const res = await fetch(url);
      if (!res.ok) throw new Error("failed to fetch pokemon details");
      const p = await res.json();

      const statsArr = Array.isArray(p.stats) ? p.stats : [];
      const getStat = (key) => {
        const found = statsArr.find((s) => s?.stat?.name === key);
        return Number(found?.base_stat) || 1;
      };

      const fighter = {
        id: Number(p.id) || 0,
        name: String(p.name || "unknown").replaceAll("-", " "),
        avatar:
          p?.sprites?.other?.["official-artwork"]?.front_default ||
          p?.sprites?.front_default ||
          "",
        stats: {
          hp: getStat("hp"),
          attack: getStat("attack"),
          defense: getStat("defense"),
          speed: getStat("speed"),
        },
      };

      _cache.byUrl.set(url, fighter);
      return fighter;
    })
  );

  _cache.listByLimit.set(n, fighters);
  return fighters;
}
