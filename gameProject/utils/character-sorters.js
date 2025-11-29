export function sortByStrength(list) {
  return list.sort((a, b) => {
    const aPower = a.attack + a.defense + a.speed + a.hp;
    const bPower = b.attack + b.defense + b.speed + b.hp;
    return bPower - aPower;
  });
}
