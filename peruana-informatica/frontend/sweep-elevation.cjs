// craft-floor: "Declare elevation once, border or shadow."
// - cards con borde + shadow-sm/md  -> se queda solo el borde
// - superficies con shadow-lg/xl/2xl + borde -> se queda solo la sombra
// - halos de color (shadow-blue-500/20) -> sombra neutra
const fs = require('fs');
const path = require('path');

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(tsx|ts)$/.test(e.name)) out.push(p);
  }
  return out;
}

const CLASSNAME_RE = /className=(?:"([^"]*)"|\{`([^`]*)`\}|\{'([^']*)'\})/g;

const SOFT_SHADOW = /^shadow-(sm|md)$/;
const BIG_SHADOW = /^shadow-(lg|xl|2xl|3xl)$/;
const COLORED_HALO = /^shadow-(blue|indigo|purple|pink|red|emerald|green|amber|yellow|cyan|sky)-/;

function fix(str) {
  const tokens = str.split(/\s+/).filter(Boolean);
  const hasBorder = tokens.some((t) => t === 'border' || /^border-[a-z]/.test(t));
  const hasSoft = tokens.some((t) => SOFT_SHADOW.test(t));
  const hasBig = tokens.some((t) => BIG_SHADOW.test(t));

  let out = [];
  for (const t of tokens) {
    // halo de color: se queda la sombra, sin el tinte
    if (COLORED_HALO.test(t)) continue;
    // sombra suave + borde -> fuera la sombra (ghost card)
    if (SOFT_SHADOW.test(t) && hasBorder) continue;
    // sombra grande + borde -> fuera el borde (se queda la sombra)
    if ((t === 'border' || /^border-[a-z]/.test(t)) && hasBig) continue;
    out.push(t);
  }
  return out.join(' ');
}

const files = [...walk('src/app/admin'), ...walk('src/components/admin')];
let n = 0;
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  let changed = false;
  const next = src.replace(CLASSNAME_RE, (m, dq, bt, sq) => {
    const raw = dq !== undefined ? dq : bt !== undefined ? bt : sq;
    const fixed = fix(raw);
    if (fixed === raw) return m;
    changed = true;
    n++;
    if (dq !== undefined) return 'className="' + fixed + '"';
    if (bt !== undefined) return 'className={`' + fixed + '`}';
    return "className={'" + fixed + "'}";
  });
  if (changed) fs.writeFileSync(f, next, 'utf8');
}
console.log(`${n} className ajustados (elevacion unica, sin halos de color)`);
