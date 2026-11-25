// craft-floor: "Declare elevation once, border or shadow."
// - cards con borde + shadow-sm/md  -> se queda solo el borde
// - superficies con shadow-lg/xl/2xl + borde -> se queda solo la sombra
// - halos de color (shadow-blue-500/20) -> sombra neutra
// Procesa tambien los className={cond ? "..." : "..."} y las clases dentro
// de expresiones ${...}.
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

const SOFT_SHADOW = /^shadow-(sm|md)$/;
const BIG_SHADOW = /^shadow-(lg|xl|2xl|3xl)$/;
const COLORED_HALO = /^shadow-(blue|indigo|purple|pink|red|emerald|green|amber|yellow|cyan|sky)-/;

function fix(str) {
  const tokens = str.split(/\s+/).filter(Boolean);
  const hasBorder = tokens.some((t) => t === 'border' || /^border-[a-z]/.test(t));
  const hasSoft = tokens.some((t) => SOFT_SHADOW.test(t));
  const hasBig = tokens.some((t) => BIG_SHADOW.test(t));

  const out = [];
  for (const t of tokens) {
    if (COLORED_HALO.test(t)) continue;
    if (SOFT_SHADOW.test(t) && hasBorder) continue;
    if ((t === 'border' || /^border-[a-z]/.test(t)) && hasBig) continue;
    out.push(t);
  }
  return out.join(' ');
}

// procesa un literal preservando espacios
function fixLiteral(content) {
  let out = '';
  let buf = '';
  let i = 0;
  while (i < content.length) {
    if (content[i] === '$' && content[i + 1] === '{') {
      let depth = 0;
      let j = i + 1;
      for (; j < content.length; j++) {
        if (content[j] === '{') depth++;
        else if (content[j] === '}') {
          depth--;
          if (depth === 0) {
            j++;
            break;
          }
        }
      }
      out += fix(buf);
      buf = '';
      out += content.slice(i, j).replace(/'([^']*)'/g, (m, inner) => "'" + fix(inner) + "'");
      i = j;
    } else {
      buf += content[i];
      i++;
    }
  }
  out += fix(buf);
  return out;
}

// className={ ... } completo: procesa los strings de comillas simples y dobles
const CLASSNAME_EXPR_RE = /className=\{([\s\S]*?)\}(?=\s|>|\))/g;

const files = [...walk('src/app/admin'), ...walk('src/components/admin')];
let n = 0;

for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  let changed = false;

  let next = src.replace(CLASSNAME_EXPR_RE, (match, expr) => {
    const fixed = expr
      .replace(/'([^']*)'/g, (m, inner) => "'" + fixLiteral(inner) + "'")
      .replace(/"([^"]*)"/g, (m, inner) => '"' + fixLiteral(inner) + '"');
    if (fixed === expr) return match;
    changed = true;
    n++;
    return 'className={' + fixed + '}';
  });

  if (changed) fs.writeFileSync(f, next, 'utf8');
}
console.log(`${n} className={...} ajustados`);
