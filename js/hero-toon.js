/* =========================================================
   HERO: Comic-Porträt (Stil per data-style, Standard B: flach & farbig)
   Kopf und Augen folgen der Maus. Die Ebenen bewegen sich unterschiedlich stark
   (Parallaxe) → wirkt wie eine leichte Kopfdrehung. Blinzelt alle paar Sekunden.
   Ohne Maus (Touch): nur Blinzeln und gelegentliches Umschauen.
   Reduzierte Bewegung: steht still.
   Wird in jedes <svg class="hp-toon" viewBox="0 0 400 420"> gezeichnet.
   ========================================================= */
(() => {
const els = [...document.querySelectorAll(".hp-toon")];
if (!els.length) return;

/* Stile: Farben + Effekte. Auswahl per data-style am <svg> (Standard: "b").
   outline = Konturfarbe, ht = Schatten als Rasterpunkte, grain = Papierkorn, shadeOp = Deckkraft der Schatten */
const INK = "#1D1D1D";
const STYLES = {
  b:    { bg:"#FFFFFF", skin:"#F2CFB3", skinShade:"#E2B394", hair:"#BF9A5E", hairShade:"#8F6E3D", shirt:"#C7DBEA", shirtShade:"#9DBBD1",
          lips:"#A24F4A", iris:"#7E9188", brow:"#7E6038", blush:"#EE9C88", nose:"#E2B394", freckles:true, shadeOp:.5 },
  ink:  { bg:"#FFFFFF", skin:"#FFFFFF", skinShade:"#D3D3D3", hair:INK, hairShade:INK, hairLine:"#5A5A5A", shirt:"#E8E154", shirtShade:"#E8C054",
          lips:INK, iris:INK, brow:INK, blush:null, nose:INK, outline:INK, shadeOp:1 },
  riso: { bg:"#E8E154", skin:"#FBEFE2", skinShade:"#E8A054", hair:"#E8A054", hairShade:INK, hairLine:INK, shirt:INK, shirtShade:"#E8A054",
          lips:INK, iris:INK, brow:INK, blush:"#E8A054", nose:"#E8A054", freckles:true, ht:true, grain:true, shadeOp:1 },
  line: { bg:"#E8E154", skin:"#E8E154", skinShade:null, hair:"#E8E154", hairShade:"#E8E154", strand:INK, hairLine:INK, shirt:"#E8E154", shirtShade:"#E8E154",
          lips:"#E8E154", iris:INK, brow:INK, blush:null, nose:INK, outline:INK, shadeOp:1 },
  /* Line ohne Hintergrund: Flächen in Seitenfarbe (--bg), damit Linien dahinter verdeckt werden, aber nichts farbig wirkt */
  lineClear: { bg:"none", skin:"#F6F6F6", skinShade:null, hair:"#F6F6F6", hairShade:"#F6F6F6", strand:INK, hairLine:INK, shirt:"#F6F6F6", shirtShade:"#F6F6F6",
          lips:"#F6F6F6", iris:INK, brow:INK, blush:null, nose:INK, outline:INK, shadeOp:1 }
};

function draw(uid, C){
  const strand = C.strand || C.hair, hairLine = C.hairLine || C.hairShade;
  /* Schattenfläche: normal halbtransparent, bei "ht" als Rasterpunkte, bei null gar nicht */
  const shade = (color, d, extra = "") => !color ? "" : C.ht
    ? `<path fill="url(#${uid}-ht-${color.slice(1)})" stroke="none" d="${d}" ${extra}/>`
    : `<path fill="${color}" opacity="${C.shadeOp}" stroke="none" d="${d}" ${extra}/>`;
  const htDefs = !C.ht ? "" : [...new Set([C.skinShade, C.hairShade, C.shirtShade])].map(c =>
    `<pattern id="${uid}-ht-${c.slice(1)}" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="4.5" cy="4.5" r="2.6" fill="${c}"/></pattern>`).join("");
  const grainDef = !C.grain ? "" : `<filter id="${uid}-grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch" result="n"/>
      <feColorMatrix in="n" type="saturate" values="0" result="g"/>
      <feComponentTransfer in="g" result="g2"><feFuncA type="table" tableValues="0 .45"/></feComponentTransfer>
      <feComposite in="g2" in2="SourceGraphic" operator="in" result="gm"/>
      <feBlend in="SourceGraphic" in2="gm" mode="multiply"/></filter>`;
  const ol = C.outline ? `stroke="${C.outline}" stroke-width="4" stroke-linejoin="round"` : "";
  const eye = (cx, cy, id) => {
    const lid = `M${cx-15} ${cy+1}C${cx-9} ${cy-10} ${cx+9} ${cy-10} ${cx+15} ${cy+1}C${cx+9} ${cy+7} ${cx-9} ${cy+7} ${cx-15} ${cy+1}Z`;
    return `<g class="eye" data-cy="${cy}">
      <clipPath id="${id}"><path d="${lid}"/></clipPath>
      <path fill="#fff" stroke="none" d="${lid}"/>
      <g clip-path="url(#${id})" stroke="none"><g class="pupil"><circle cx="${cx}" cy="${cy}" r="7" fill="${C.iris}"/><circle cx="${cx}" cy="${cy}" r="3.4" fill="${INK}"/><circle cx="${cx+2.5}" cy="${cy-2.5}" r="1.6" fill="#fff"/></g></g>
      <path d="M${cx-16} ${cy+1}C${cx-9} ${cy-11} ${cx+9} ${cy-11} ${cx+16} ${cy+1}" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
    </g>`;
  };
  const freckles = !C.freckles ? "" : [[160,212],[168,218],[176,212],[226,210],[234,216],[242,210],[198,206]]
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.5" fill="${C.skinShade}" stroke="none"/>`).join("");
  const blush = !C.blush ? "" : `<ellipse cx="152" cy="228" rx="15" ry="9" fill="${C.blush}" opacity=".35" stroke="none"/><ellipse cx="248" cy="226" rx="15" ry="9" fill="${C.blush}" opacity=".35" stroke="none"/>`;
  return `
  <defs><clipPath id="${uid}-circle"><circle cx="200" cy="215" r="188"/></clipPath>${htDefs}${grainDef}</defs>
  <g ${C.grain ? `filter="url(#${uid}-grain)"` : ""}>
  <circle cx="200" cy="215" r="188" fill="${C.bg}"/>
  <g clip-path="url(#${uid}-circle)" ${ol}>
    <path fill="${C.shirt}" d="M30 440C34 372 60 350 110 338L168 318L232 318L292 338C340 352 366 372 370 440Z"/>
    <path fill="${C.skin}" d="M172 262L228 262L232 330L200 392L168 330Z"/>
    ${shade(C.skinShade, "M172 270C186 292 214 292 228 270L230 300C214 312 186 312 170 300Z")}
    <path fill="${C.shirtShade}" d="M168 316L140 362L176 402L200 392L172 336Z"/>
    <path fill="${C.shirt}" d="M232 316L266 356L230 404L200 392L228 336Z"/>
    ${shade(C.shirtShade, "M232 316L266 356L250 360L228 336Z")}
    <circle cx="212" cy="404" r="3.2" fill="#fff" stroke="none"/>
  </g>
  <g class="head" ${ol}>
    <g class="l-back">
      <path fill="${C.hairShade}" d="M116 196C104 128 142 80 204 78C266 78 302 126 290 194C284 210 276 214 268 210L136 210C126 214 118 208 116 196Z"/>
      <circle cx="214" cy="62" r="33" fill="${C.hair}"/>
      <path d="M192 52C206 34 234 38 240 58" fill="none" stroke="${hairLine}" stroke-width="5" stroke-linecap="round"/>
    </g>
    <g class="l-face">
      <ellipse cx="129" cy="200" rx="12" ry="20" fill="${C.skin}"/><ellipse cx="271" cy="198" rx="12" ry="20" fill="${C.skin}"/>
      <path fill="${C.skin}" d="M200 96C250 96 272 136 272 186C272 246 238 292 200 292C162 292 128 246 128 186C128 136 150 96 200 96Z"/>
      ${shade(C.skinShade, "M128 186C128 246 162 292 200 292C176 280 150 246 146 196Z")}
    </g>
    <g class="l-feat">
      ${blush}${freckles}
      <path d="M156 162C164 154 178 153 188 158" fill="none" stroke="${C.brow}" stroke-width="5" stroke-linecap="round"/>
      <path d="M212 155C222 150 236 151 244 158" fill="none" stroke="${C.brow}" stroke-width="5" stroke-linecap="round"/>
      ${eye(172, 186, uid + "-l")}${eye(228, 184, uid + "-r")}
      <g class="l-nose"><path d="M201 196C199 212 192 222 196 228C200 231 206 230 209 226" fill="none" stroke="${C.nose}" stroke-width="4" stroke-linecap="round"/></g>
      <path fill="${C.lips}" d="M166 240C184 252 216 252 234 238C228 264 214 274 200 274C184 274 170 264 166 240Z"/>
      <path fill="#fff" stroke="none" d="M171 243C188 252 212 252 229 241L227 249C211 257 189 257 173 250Z"/>
    </g>
    <g class="l-front">
      <path fill="${C.hair}" d="M120 178C112 112 150 74 204 74C258 74 292 112 284 176C276 142 258 120 232 113C206 106 172 110 152 124C134 138 126 156 120 178Z"/>
      <path d="M126 146C112 186 108 236 118 286C121 300 114 312 108 318" fill="none" stroke="${strand}" stroke-width="6" stroke-linecap="round"/>
      <path d="M134 150C124 190 126 224 134 250" fill="none" stroke="${strand}" stroke-width="5" stroke-linecap="round"/>
      <path d="M278 146C290 176 292 206 284 232" fill="none" stroke="${strand}" stroke-width="5" stroke-linecap="round"/>
      <path d="M160 104C180 92 214 90 236 100M150 120C166 112 182 110 196 112" fill="none" stroke="${hairLine}" stroke-width="3" stroke-linecap="round" opacity=".7"/>
      <path d="M118 200C108 236 112 270 104 300" fill="none" stroke="${hairLine}" stroke-width="3" stroke-linecap="round"/>
    </g>
  </g>
  </g>`;
}

const figs = els.map((el, i) => {
  el.innerHTML = draw("toon" + i, STYLES[el.dataset.style] || STYLES.b);
  const q = s => el.querySelector(s);
  return { el, head: q(".head"), back: q(".l-back"), face: q(".l-face"), feat: q(".l-feat"), nose: q(".l-nose"), front: q(".l-front"),
    eyes: [...el.querySelectorAll(".eye")], pupils: [...el.querySelectorAll(".pupil")], x: 0, y: 0, tx: 0, ty: 0, blink: 0 };
});

if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

/* Ziel = Richtung eines Punktes auf der Seite, normiert auf −1…1 (range = Abstand, bei dem voll gedreht wird) */
const lookAt = (x, y, range) => figs.forEach(f => {
  const r = f.el.getBoundingClientRect();
  f.tx = Math.max(-1, Math.min(1, (x - (r.left + r.width / 2)) / (range ? r.width * range : innerWidth * .45)));
  f.ty = Math.max(-1, Math.min(1, (y - (r.top + r.height * .45)) / (range ? r.height * range : innerHeight * .45)));
});
addEventListener("pointermove", e => { if (e.pointerType === "mouse") lookAt(e.clientX, e.clientY); });
/* Von außen steuerbar (z. B. hero-path.js): Figur schaut auf einen Punkt bzw. mit null wieder geradeaus */
let guided = false;
addEventListener("toon:look", e => {
  guided = !!e.detail;
  if (e.detail) lookAt(e.detail.x, e.detail.y, .5);
  else figs.forEach(f => { f.tx = 0; f.ty = 0; });
});
/* Ohne Maus: ab und zu umschauen, öfter mal geradeaus */
if (matchMedia("(hover: none)").matches) setInterval(() => !guided && figs.forEach(f => {
  const ahead = Math.random() < .35;
  f.tx = ahead ? 0 : Math.random() * 1.6 - .8;
  f.ty = ahead ? 0 : Math.random() * 1.2 - .6;
}), 2400);

/* Blinzeln alle 2,5–6 s (150 ms) */
const blinkLater = f => setTimeout(() => { f.blink = performance.now(); blinkLater(f); }, 2500 + Math.random() * 3500);
figs.forEach(blinkLater);

const T = (el, x, y, extra = "") => el.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)})${extra}`);
const frame = now => {
  figs.forEach(f => {
    f.x += (f.tx - f.x) * .1; f.y += (f.ty - f.y) * .1;
    const { x, y } = f;
    T(f.head, x * 6, y * 4, ` rotate(${(x * 4).toFixed(2)} 200 300)`);
    T(f.back, -x * 5, -y * 3);
    T(f.face, x * 2, y * 2);
    T(f.feat, x * 9, y * 7);
    T(f.nose, x * 3, y * 1.5);
    T(f.front, x * 4, y * 3);
    f.pupils.forEach(p => T(p, x * 5, y * 3.5));
    const b = now - f.blink, s = b < 150 ? Math.max(.08, Math.abs(1 - b / 75)) : 1;
    f.eyes.forEach(e => e.setAttribute("transform", `translate(0 ${e.dataset.cy * (1 - s)}) scale(1 ${s})`));
  });
  requestAnimationFrame(frame);
};
requestAnimationFrame(frame);
})();
