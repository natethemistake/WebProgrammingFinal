// utils/profile.js

const STORAGE_KEYS = {
  profile: "am_profile",
};

export function readProfile() {
  const raw = localStorage.getItem(STORAGE_KEYS.profile);
  if (!raw) {
    return { pointsCents: 0, purchases: {} };
  }

  try {
    const p = JSON.parse(raw);
    return {
      pointsCents: Number(p.pointsCents) || 0,
      purchases: p.purchases && typeof p.purchases === "object" ? p.purchases : {},
    };
  } catch {
    return { pointsCents: 0, purchases: {} };
  }
}

export function writeProfile(profile) {
  const safe = {
    pointsCents: Number(profile?.pointsCents) || 0,
    purchases:
      profile?.purchases && typeof profile.purchases === "object"
        ? profile.purchases
        : {},
  };

  localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(safe));
}
