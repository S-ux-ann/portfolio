/* =========================================================
   HERO: Live-Heatmap
   Ein ruhiges Punkteraster "erwärmt" sich dort, wo sich die Maus aufhält:
   Punkte werden größer und färben sich Grau → Gelb → Orange. Verweilen erzeugt Hotspots,
   die Wärme kühlt langsam ab. Ein kleines Label zeigt die Session wie in einem Analytics-Tool.
   Ohne Maus (oder solange sich niemand über der Fläche bewegt) spielt eine Beispiel-Session
   mit einem "Geister-Cursor" (Label: Demo-Session). Es wird nichts gespeichert oder gesendet. Reduzierte Bewegung: fertige, stehende Heatmap.
   ========================================================= */
(() => {
const box = document.querySelector(".hm");
if (!box) return;
const canvas = box.querySelector("canvas");
const ctx = canvas.getContext("2d");
const fig = box.closest("figure") || box;
const hud = fig.querySelector(".hm-hud");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const canHover = matchMedia("(hover: hover)").matches;

/* Rasterabstand und Radius der "Wärme" wachsen mit der Fläche mit (gesetzt in resize) */
let GAP = 18, SIGMA = 30;
const DECAY = .9965;            // Abkühlen pro 1/60 s (≈ 3 s Halbwertszeit)
const HEAT_MOVE = .009, HEAT_STILL = .02;   // Wärme pro 1/60 s: in Bewegung / beim Verweilen
/* Farbverlauf der Wärme: Grau → Gelb → Orange → Dunkel (Website-Farben) */
const STOPS = [[0, [211, 211, 211]], [.35, [232, 225, 84]], [.7, [232, 160, 84]], [1, [74, 72, 41]]];

let W = 0, H = 0, cols = 0, rows = 0, heat = new Float32Array(0), dpr = 1;
const resize = () => {
  dpr = Math.min(2, window.devicePixelRatio || 1);
  W = box.clientWidth; H = box.clientHeight;
  GAP = Math.max(13, Math.min(20, W / 26));
  SIGMA = Math.max(20, W * .065);
  canvas.width = W * dpr; canvas.height = H * dpr;
  const c = Math.floor(W / GAP), r = Math.floor(H / GAP);
  if (c !== cols || r !== rows) { cols = c; rows = r; heat = new Float32Array(cols * rows); }
};
/* Fläche nach links hinter die Überschrift ausdehnen: ab 70 % der Schriftbreite volles Raster
   (also ~30 % der Überschrift liegen im Raster), links davon läuft es weich aus.
   Nur wenn Überschrift und Grafik nebeneinander stehen. */
const headline = document.querySelector(".hero-h1");
let fadeL = 0;   // Breite des weichen Auslaufs links (px)
const place = () => {
  box.style.left = ""; box.style.width = ""; fadeL = 0;
  if (headline) {
    const range = document.createRange(); range.selectNodeContents(headline);
    const t = range.getBoundingClientRect(), f = fig.getBoundingClientRect();
    if (t.right < f.left + 20) {
      fadeL = t.width * .35;                                   // Auslauf links davon
      const left = t.left + t.width * .7 - fadeL - f.left;     // ab 70 % der Schrift volles Raster
      box.style.left = left + "px";
      box.style.width = (f.width - left) + "px";
    }
  }
  resize();
};
place();
if ("ResizeObserver" in window) { const ro = new ResizeObserver(place); ro.observe(fig); if (headline) ro.observe(headline); }
else addEventListener("resize", place);

const mix = h => {
  for (let i = 1; i < STOPS.length; i++) if (h <= STOPS[i][0]) {
    const [a, ca] = STOPS[i - 1], [b, cb] = STOPS[i], t = (h - a) / (b - a);
    return `rgb(${ca.map((v, k) => Math.round(v + (cb[k] - v) * t)).join(",")})`;
  }
  return `rgb(${STOPS[STOPS.length - 1][1].join(",")})`;
};
const ox = () => (W - (cols - 1) * GAP) / 2, oy = () => (H - (rows - 1) * GAP) / 2;

/* Wärme an Position (x, y) hinzufügen; amount pro Frame */
const warm = (x, y, amount) => {
  const x0 = ox(), y0 = oy(), reach = SIGMA * 2.5;
  const c0 = Math.max(0, Math.floor((x - reach - x0) / GAP)), c1 = Math.min(cols - 1, Math.ceil((x + reach - x0) / GAP));
  const r0 = Math.max(0, Math.floor((y - reach - y0) / GAP)), r1 = Math.min(rows - 1, Math.ceil((y + reach - y0) / GAP));
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
    const dx = x0 + c * GAP - x, dy = y0 + r * GAP - y;
    const i = r * cols + c;
    heat[i] = Math.min(1, heat[i] + amount * Math.exp(-(dx * dx + dy * dy) / (2 * SIGMA * SIGMA)));
  }
};

const draw = () => {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const x0 = ox(), y0 = oy();
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const h = heat[r * cols + c];
    /* weicher Rand: Punkte zum Rand hin transparenter statt hart abgeschnitten */
    const edge = Math.min(c, r, cols - 1 - c, rows - 1 - r);
    let a = Math.min(1, .15 + edge * .28);
    if (fadeL) a = Math.min(a, Math.pow(Math.min(1, (x0 + c * GAP) / fadeL), 1.6));   // links lang auslaufen (hinter der Überschrift)
    ctx.globalAlpha = a;
    ctx.fillStyle = mix(h);
    ctx.beginPath();
    ctx.arc(x0 + c * GAP, y0 + r * GAP, GAP * (.11 + h * .26), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
};

/* ---------- Session-Label ("Demo-Session" bzw. "Deine Session · nicht gespeichert"): Dauer + Hotspots (Verweilen > 0,7 s an einer Stelle) ---------- */
const setHud = (sec, spots) => {
  if (!hud) return;
  const t = `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
  hud.querySelectorAll(".hm-time").forEach(e => e.textContent = t);
  hud.querySelectorAll(".hm-spots").forEach(e => e.textContent = spots);
  hud.querySelectorAll(".hm-word").forEach(e => e.textContent = spots === 1 ? "Hotspot" : "Hotspots");
};

/* ---------- Buttons (data-x / data-y = Position als Anteil der Fläche) ---------- */
const items = [...fig.querySelectorAll(".hp-steps li")];
const layout = () => {
  const FW = fig.clientWidth;
  items.forEach(li => {
    const w = li.firstElementChild.offsetWidth;
    li.style.top = (+li.dataset.y * 100) + "%";
    const left = Math.max(0, Math.min(FW - w, +li.dataset.x * FW));
    li.style.left = left + "px";
    li.dataset.side = left + w / 2 > FW * .45 ? "right" : "left";   // Hinweistext klappt zur Mitte hin auf
    li.dataset.v = +li.dataset.y > .6 ? "up" : "down";                // untere Labels klappen nach oben auf (nicht über das Session-Label)
  });
};
layout();
if ("ResizeObserver" in window) { const ro = new ResizeObserver(layout); ro.observe(fig); items.forEach(li => ro.observe(li.firstElementChild)); }
items.forEach((li, k) => setTimeout(() => li.classList.add("is-on"), reduce ? 0 : 300 + k * 250));
fig.classList.add("is-ready");
/* Buttons: Tippen öffnet/schließt den Hinweistext (Touch-Geräte fokussieren Buttons nicht immer),
   Esc blendet ihn aus, bis Maus oder Fokus das Label verlassen (WCAG 1.4.13) */
items.forEach(li => {
  const btn = li.querySelector("button");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const open = !li.classList.contains("is-open");
    items.forEach(o => o.classList.remove("is-open"));
    li.classList.toggle("is-open", open);
    li.classList.remove("is-dismissed");
  });
  li.addEventListener("mouseleave", () => li.classList.remove("is-dismissed"));
  li.addEventListener("focusout", () => { li.classList.remove("is-dismissed"); li.classList.remove("is-open"); });
});
addEventListener("keydown", e => {
  if (e.key === "Escape") items.forEach(li => { li.classList.add("is-dismissed"); li.classList.remove("is-open"); });
});
/* Mitte eines Buttons relativ zur Heatmap-Fläche (0…1) */
const centerOf = li => {
  const b = box.getBoundingClientRect(), r = li.firstElementChild.getBoundingClientRect();
  return [(r.left + r.width * .45 - b.left) / b.width, (r.top + r.height * .6 - b.top) / b.height];
};

/* ---------- Beispiel-Session: Geister-Cursor steuert die Buttons an, "klickt" (Hinweistext klappt auf) ---------- */
const ghostEl = box.querySelector(".hm-ghost");
const TARGETS = [{ li: 0 }, [.62, .2], { li: 1 }, [.8, .7], { li: 2 }, [.55, .88], [.35, .4]];
let ghost = { x: .75, y: .3, ti: 0, wait: 0 };
let demoSec = 0, demoSpots = 0, demoStill = false;   // Zähler der Beispiel-Session
const targetPos = t => t.li !== undefined && items[t.li] ? centerOf(items[t.li]) : t;
/* nur ein Hinweistext zur Zeit: öffnet der Demo-Cursor einen, schließen sich angetippte andere */
const press = (li, on) => { if (li) {
  if (on) {
    items.forEach(o => o !== li && o.classList.remove("is-open"));
    /* per Maus angeklickter Button behält sonst den Fokus und damit seinen Text – Tastatur-Fokus bleibt unangetastet */
    const a = document.activeElement;
    if (a && a.closest(".hp-steps") && !li.contains(a) && !a.matches(":focus-visible")) a.blur();
  }
  li.classList.toggle("is-peek", on); li.classList.toggle("is-pressed", on);
} };
const ghostStep = dt => {
  const t = TARGETS[ghost.ti], li = t.li !== undefined ? items[t.li] : null;
  const [tx, ty] = targetPos(t);
  const dx = tx - ghost.x, dy = ty - ghost.y, d = Math.hypot(dx, dy);
  if (d < .01) {
    ghost.wait += dt;
    press(li, true);
    if (ghost.wait > (li ? 2.4 : .9)) {
      press(li, false); ghost.wait = 0; ghost.ti = (ghost.ti + 1) % TARGETS.length;
      if (ghost.ti === 0) setDemo("done");   // eine Runde, dann bleibt die fertige Heatmap stehen
    }
  } else {
    const v = Math.min(d, dt * .35);   // Geschwindigkeit in Flächenanteilen pro Sekunde
    ghost.x += dx / d * v + Math.sin(performance.now() / 300) * .0008;
    ghost.y += dy / d * v;
  }
  return [ghost.x * W, ghost.y * H, d < .01];
};

/* Reduzierte Bewegung: Beispiel-Session "vorspulen" und als Standbild zeigen */
if (reduce) {
  for (let k = 0; k < 900; k++) { const [x, y, still] = ghostStep(1 / 60); warm(x, y, still ? HEAT_STILL : HEAT_MOVE); heat.forEach((h, i) => heat[i] = h * DECAY); }
  draw(); setHud(15, 4);
  return;
}

/* ---------- Demo-Steuerung: playing → paused / done (WCAG 2.2.2: automatische Bewegung anhaltbar) ---------- */
const toggle = fig.querySelector(".hm-toggle");
let demo = "playing";
function setDemo(state) {
  demo = state;
  fig.dataset.demo = state;
  if (state !== "playing") items.forEach(li => press(li, false));
}
setDemo("playing");
if (toggle) toggle.addEventListener("click", () => {
  mouse = null; lastMove = 0;   // eigene Session beenden, damit die Demo sofort sichtbar ist
  if (demo === "playing") return setDemo("paused");
  if (demo === "done") {   // erneut abspielen: frische Session
    ghost = { x: .75, y: .3, ti: 0, wait: 0 }; demoSec = 0; demoSpots = 0; demoStill = false; heat.fill(0);
  }
  setDemo("playing");
});

let mouse = null, lastMove = 0, session = 0, spots = 0, dwell = { x: 0, y: 0, t: 0, counted: false };
if (canHover) addEventListener("pointermove", e => {
  if (e.pointerType !== "mouse") return;
  const r = box.getBoundingClientRect();
  const x = e.clientX - r.left, y = e.clientY - r.top;
  /* nur auf der Fläche (plus etwas Rand) zählt die Maus – nicht über dem Session-Label mit dem Pause-Knopf */
  const overHud = e.target instanceof Element && e.target.closest(".hm-hud");
  mouse = !overHud && x > -40 && y > -40 && x < W + 40 && y < H + 40 ? [x, y] : null;
  if (mouse) lastMove = performance.now();
});
addEventListener("pointerdown", e => {   // Tippen / Klicken auf der Fläche: kurzer, kräftiger Wärmeimpuls
  const r = box.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
  if (x >= 0 && y >= 0 && x <= W && y <= H) warm(x, y, .6);
});

let prev = performance.now();
const frame = now => {
  const dt = Math.min(.1, (now - prev) / 1000); prev = now;
  const live = mouse && now - lastMove < 2500;
  let pos, still;
  if (live) {
    items.forEach(li => press(li, false));
    pos = mouse;
    session += dt;
    /* Verweilen erkennen → Hotspot zählen */
    if (Math.hypot(pos[0] - dwell.x, pos[1] - dwell.y) > 30) dwell = { x: pos[0], y: pos[1], t: 0, counted: false };
    else if ((dwell.t += dt) > .7 && !dwell.counted) { dwell.counted = true; spots++; }
    still = dwell.t > .15;
  } else if (demo === "playing") {
    const g = ghostStep(dt); pos = [g[0], g[1]]; still = g[2];
    demoSec += dt;
    if (still && !demoStill) demoSpots++;
    demoStill = still;
  }
  /* angehalten / fertig: Heatmap bleibt als Standbild stehen (keine Wärme, kein Abkühlen) */
  if (pos) {
    const f = dt * 60;   // zeitbasiert, damit es auf 60 Hz und 120 Hz gleich wirkt
    warm(pos[0], pos[1], (still ? HEAT_STILL : HEAT_MOVE) * f);
    const dec = Math.pow(DECAY, f);
    for (let i = 0; i < heat.length; i++) heat[i] *= dec;
    draw();
  }
  if (ghostEl) {
    ghostEl.style.opacity = live || demo !== "playing" ? 0 : 1;
    if (pos) ghostEl.style.transform = `translate(${pos[0]}px, ${pos[1]}px)`;
  }
  fig.classList.toggle("is-live", !!live);
  live ? setHud(session, spots) : setHud(demoSec, demoSpots);
  if (onScreen()) requestAnimationFrame(frame); else running = false;
};
/* Nur rechnen, solange der Hero im Bild ist (spart Akku); beim Zurückscrollen geht es weiter */
const onScreen = () => { const r = fig.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; };
let running = true;
const resume = () => { if (!running && onScreen()) { running = true; prev = performance.now(); requestAnimationFrame(frame); } };
addEventListener("scroll", resume, { passive: true });
addEventListener("resize", resume);
requestAnimationFrame(frame);
})();
