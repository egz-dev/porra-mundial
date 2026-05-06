const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

async function post(payload) {
  if (!APPS_SCRIPT_URL) {
    console.warn('VITE_APPS_SCRIPT_URL no configurada — modo demo');
    return { ok: true, demo: true };
  }
  // Content-Type: text/plain evita preflight CORS en Apps Script
  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

export async function submitBet({ nombre, apellido, alias, paises }) {
  return post({ action: 'createBet', nombre, apellido, alias, paises });
}

export async function updateBet({ token, nombre, apellido, alias, paises }) {
  return post({ action: 'updateBet', token, nombre, apellido, alias, paises });
}
