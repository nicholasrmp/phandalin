// Grade de combate: quadrados de 1,5 m (5 pés).
//
// Distância pela regra padrão do SRD: diagonal custa o mesmo que ortogonal,
// ou seja, distância de Chebyshev × 5 pés. É o que torna o netcode trivial —
// posição é um par de inteiros e não existe erro de arredondamento.

export const FEET_PER_SQUARE = 5;

export const key = (x, y) => `${x},${y}`;
export const parseKey = (k) => {
  const [x, y] = k.split(',');
  return { x: Number(x), y: Number(y) };
};

/** Distância em pés entre dois quadrados (diagonal = 5 pés). */
export function distanceFt(a, b) {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) * FEET_PER_SQUARE;
}

export function isAdjacent(a, b) {
  return a !== b && Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) === 1;
}

const NEIGHBORS = [
  { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
  { dx: 1, dy: 1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: -1, dy: -1 },
];

export class Battlefield {
  /**
   * @param {number} w largura em quadrados
   * @param {number} h altura em quadrados
   * @param {string[]} rows mapa em texto: '.' chão, '#' parede, '~' difícil, 'o' cobertura
   */
  constructor(w, h, rows = null) {
    this.w = w;
    this.h = h;
    this.tiles = new Uint8Array(w * h);   // 0 chão, 1 parede, 2 terreno difícil, 3 cobertura
    this.heights = new Uint8Array(w * h); // nível de elevação; cada nível = 5 pés
    if (rows) {
      for (let y = 0; y < Math.min(h, rows.length); y++) {
        for (let x = 0; x < Math.min(w, rows[y].length); x++) {
          const c = rows[y][x];
          const i = y * w + x;
          if (c >= '1' && c <= '9') {
            this.tiles[i] = 0;
            this.heights[i] = Number(c);
          } else {
            this.tiles[i] = c === '#' ? 1 : c === '~' ? 2 : c === 'o' ? 3 : 0;
          }
        }
      }
    }
  }

  heightAt(x, y) {
    return this.inside(x, y) ? this.heights[y * this.w + x] : 0;
  }

  inside(x, y) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  tileAt(x, y) {
    return this.inside(x, y) ? this.tiles[y * this.w + x] : 1;
  }

  /** Parede bloqueia movimento e linha de visão. Cobertura bloqueia só movimento. */
  blocksMove(x, y) {
    const t = this.tileAt(x, y);
    return t === 1 || t === 3;
  }

  blocksSight(x, y) {
    return this.tileAt(x, y) === 1;
  }

  /**
   * Custo de entrar num quadrado, em pés.
   * Terreno difícil custa o dobro (SRD). Subir um nível é escalada: no SRD,
   * cada pé escalado custa 1 pé extra, então o degrau de 5 pés sai por 10.
   */
  costOf(x, y, fromX = null, fromY = null) {
    let cost = this.tileAt(x, y) === 2 ? FEET_PER_SQUARE * 2 : FEET_PER_SQUARE;
    if (fromX !== null) {
      const climb = this.heightAt(x, y) - this.heightAt(fromX, fromY);
      if (climb > 0) cost += climb * FEET_PER_SQUARE;
    }
    return cost;
  }

  /** Degrau de mais de um nível é parede: não dá para escalar num passo. */
  stepBlocked(fromX, fromY, toX, toY) {
    return Math.abs(this.heightAt(toX, toY) - this.heightAt(fromX, fromY)) > 1;
  }

  /**
   * Busca em largura por custo: todos os quadrados alcançáveis com o orçamento.
   * @param {{x:number,y:number}} from
   * @param {number} budgetFt
   * @param {(x:number,y:number)=>boolean} occupied quadrado ocupado por outra criatura
   * @returns {Map<string,{x:number,y:number,cost:number,from:string|null}>}
   */
  reachable(from, budgetFt, occupied = () => false) {
    const seen = new Map();
    seen.set(key(from.x, from.y), { x: from.x, y: from.y, cost: 0, from: null });
    // Fila simples ordenada por custo: a grade é pequena, não precisa de heap.
    const queue = [{ x: from.x, y: from.y, cost: 0 }];

    while (queue.length) {
      queue.sort((a, b) => a.cost - b.cost);
      const cur = queue.shift();
      const curKey = key(cur.x, cur.y);
      if (seen.get(curKey).cost < cur.cost) continue;

      for (const { dx, dy } of NEIGHBORS) {
        const nx = cur.x + dx;
        const ny = cur.y + dy;
        if (!this.inside(nx, ny) || this.blocksMove(nx, ny)) continue;
        // Não corta quina entre duas paredes.
        if (dx !== 0 && dy !== 0 && this.blocksMove(cur.x + dx, cur.y) && this.blocksMove(cur.x, cur.y + dy)) continue;
        if (this.stepBlocked(cur.x, cur.y, nx, ny)) continue;

        const cost = cur.cost + this.costOf(nx, ny, cur.x, cur.y);
        if (cost > budgetFt) continue;
        const nKey = key(nx, ny);
        const prev = seen.get(nKey);
        if (prev && prev.cost <= cost) continue;
        seen.set(nKey, { x: nx, y: ny, cost, from: curKey });
        // Atravessa aliados, mas não pode parar em cima deles.
        if (!occupied(nx, ny)) queue.push({ x: nx, y: ny, cost });
      }
    }
    return seen;
  }

  /** Reconstrói o caminho a partir do mapa devolvido por `reachable`. */
  static pathFrom(reached, target) {
    const path = [];
    let cur = key(target.x, target.y);
    while (cur) {
      const node = reached.get(cur);
      if (!node) return [];
      path.unshift({ x: node.x, y: node.y });
      cur = node.from;
    }
    return path;
  }

  /** Bresenham entre centros de quadrados, para linha de visão. */
  line(a, b) {
    const points = [];
    let x0 = a.x; let y0 = a.y;
    const x1 = b.x; const y1 = b.y;
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    for (;;) {
      points.push({ x: x0, y: y0 });
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x0 += sx; }
      if (e2 < dx) { err += dx; y0 += sy; }
    }
    return points;
  }

  /**
   * Linha de visão. Além das paredes, um platô mais alto que os DOIS pontos
   * corta a visão — é isso que faz o terreno alto importar de verdade.
   */
  hasLineOfSight(a, b) {
    const eye = Math.max(this.heightAt(a.x, a.y), this.heightAt(b.x, b.y));
    const pts = this.line(a, b);
    for (let i = 1; i < pts.length - 1; i++) {
      if (this.blocksSight(pts[i].x, pts[i].y)) return false;
      if (this.heightAt(pts[i].x, pts[i].y) > eye) return false;
    }
    return true;
  }

  /** Cobertura parcial dá +2 de CA no SRD: obstáculo ou degrau na linha. */
  coverBetween(a, b) {
    const low = Math.min(this.heightAt(a.x, a.y), this.heightAt(b.x, b.y));
    const pts = this.line(a, b);
    for (let i = 1; i < pts.length - 1; i++) {
      if (this.tileAt(pts[i].x, pts[i].y) === 3) return 2;
      if (this.heightAt(pts[i].x, pts[i].y) > low) return 2;
    }
    return 0;
  }

  /** Quadrados dentro de um raio em pés (para explosões e auras). */
  within(center, radiusFt) {
    const r = Math.floor(radiusFt / FEET_PER_SQUARE);
    const out = [];
    for (let y = center.y - r; y <= center.y + r; y++) {
      for (let x = center.x - r; x <= center.x + r; x++) {
        if (!this.inside(x, y)) continue;
        if (distanceFt(center, { x, y }) > radiusFt) continue;
        out.push({ x, y });
      }
    }
    return out;
  }

  /** Cone do SRD: comprimento = largura. Aproximação em grade. */
  cone(origin, dir, lengthFt) {
    const len = Math.floor(lengthFt / FEET_PER_SQUARE);
    const out = [];
    const nx = Math.sign(dir.x);
    const ny = Math.sign(dir.y);
    for (let step = 1; step <= len; step++) {
      for (let spread = -step; spread <= step; spread++) {
        const x = origin.x + nx * step + (nx === 0 ? spread : 0);
        const y = origin.y + ny * step + (ny === 0 ? spread : 0);
        const px = nx !== 0 && ny !== 0 ? origin.x + nx * step : x;
        const py = nx !== 0 && ny !== 0 ? origin.y + ny * step + spread : y;
        if (this.inside(px, py)) out.push({ x: px, y: py });
      }
    }
    // remove repetidos
    const seen = new Set();
    return out.filter((p) => {
      const k = key(p.x, p.y);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }
}
