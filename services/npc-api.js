// services/npc-api.js

/**
 * fetch a random npc line (advice slip)
 * note: api caches for ~2s, so we add a cachebuster query param
 * @returns {Promise<string>}
 */
async function fetchNpcLine() {
  const url = "https://api.adviceslip.com/advice?t=" + Date.now();

  const response = await fetch(url);
  if (!response.ok) throw new Error("npc api failed: " + response.status);

  const data = await response.json();
  if (!data || !data.slip || !data.slip.advice) {
    throw new Error("npc api returned unexpected shape");
  }

  return data.slip.advice;
}
