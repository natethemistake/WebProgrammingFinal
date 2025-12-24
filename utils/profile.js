// utils/profile.js

const STORAGE_KEYS = {
  profile: "am_profile",
};

function readProfile() {
  const raw = localStorage.getItem(STORAGE_KEYS.profile);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch { 
    return null;
  }
}

function writeProfile(profile) {
  localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
}

/**
 * @param {number} cents positive or negative integer cents
 * @returns {{ ok: boolean, pointsCents?: number }}
 */
export function addPointsCents(cents) {
  const profile = readProfile();
  if (!profile) return { ok: false };

  const current = Number.isFinite(profile.pointsCents) ? profile.pointsCents : 0;
  const delta = Math.round(Number(cents) || 0);

  profile.pointsCents = Math.max(0, current + delta);
  writeProfile(profile);

  return { ok: true, pointsCents: profile.pointsCents };
}
