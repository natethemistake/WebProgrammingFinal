// utils/character-sorters.js

/**
 * sort by a simple "strength" score
 * score = hp + atk + def + spd
 * @param {Array<{hp:number,attack:number,defense:number,speed:number}>} list
 * @returns {Array}
 */
export function sortByStrength(list) {
  return [...list].sort(function (a, b) {
    const aScore =
      Number(a.hp || 0) +
      Number(a.attack || 0) +
      Number(a.defense || 0) +
      Number(a.speed || 0);

    const bScore =
      Number(b.hp || 0) +
      Number(b.attack || 0) +
      Number(b.defense || 0) +
      Number(b.speed || 0);

    return bScore - aScore;
  });
}
