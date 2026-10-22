// RNG semeado. TODA rolagem do jogo passa por aqui.
//
// Num jogo multiplayer autoritativo isso não é só higiene: é o que permite o
// servidor replayar um encontro, auditar uma sessão e sincronizar clientes sem
// mandar o resultado de cada dado. `Math.random()` só pode aparecer em efeito
// visual puro — nunca em nada que mude o estado do combate.

export function makeRng(seed) {
  let s = seed >>> 0;
  if (s === 0) s = 0x9e3779b9;

  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  next.int = (n) => Math.floor(next() * n);
  next.die = (sides) => 1 + Math.floor(next() * sides);
  next.pick = (arr) => arr[Math.floor(next() * arr.length)];
  next.chance = (p) => next() < p;
  next.shuffle = (arr) => {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };
  next.state = () => s;
  return next;
}

export function seedFromString(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
