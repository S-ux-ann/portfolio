/* =========================================================
   Gezeichnete Linie um Karten (data-scribble)
   Eine gelbe, leicht wackelige Linie läuft einmal um die Karte, ragt mal etwas hinein,
   mal etwas hinaus und überlappt am Ende ihren Anfang – wie von Hand gezogen.
   Sie zeichnet sich einmal, sobald die Karte ins Bild kommt – oder mit data-scribble="hover" beim Drüberfahren.
   Jede Linie ist etwas anders (Zufall mit festem Startwert je Karte → bleibt bei Resize gleich).
   ========================================================= */
(() => {
const cards = [...document.querySelectorAll("[data-scribble]")];
if (!cards.length) return;
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const NS = "http://www.w3.org/2000/svg";
const PAD = 16;   // so weit darf die Linie über die Karte hinausragen (px)

/* kleiner Zufallsgenerator mit Startwert, damit jede Karte ihre eigene, aber feste Form hat */
const rng = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

/* Punkt auf dem Rand eines abgerundeten Rechtecks + Normale nach außen; t = 0…1 einmal herum (Start oben links, im Uhrzeigersinn) */
const onRect = (w, h, r, t) => {
  const straight = [w - 2 * r, h - 2 * r, w - 2 * r, h - 2 * r], arc = Math.PI * r / 2;
  const total = 2 * (w + h - 4 * r) + 4 * arc;
  let s = ((t % 1) + 1) % 1 * total;
  const corners = [[w - r, r, -Math.PI / 2], [w - r, h - r, 0], [r, h - r, Math.PI / 2], [r, r, Math.PI]];
  const starts = [[r, 0, 1, 0], [w, r, 0, 1], [w - r, h, -1, 0], [0, h - r, 0, -1]];
  for (let i = 0; i < 4; i++) {
    if (s <= straight[i]) { const [x, y, dx, dy] = starts[i]; return [x + dx * s, y + dy * s, dy, -dx]; }
    s -= straight[i];
    if (s <= arc) { const [cx, cy, a0] = corners[i], a = a0 + s / r; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r, Math.cos(a), Math.sin(a)]; }
    s -= arc;
  }
  return [r, 0, 0, -1];
};

const build = (card, i) => {
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("class", "scribble");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(NS, "path");
  svg.appendChild(path);
  card.appendChild(svg);
  const seed = 1000 + i * 7919;

  const layout = () => {
    const w = card.offsetWidth, h = card.offsetHeight;
    svg.setAttribute("viewBox", `${-PAD} ${-PAD} ${w + 2 * PAD} ${h + 2 * PAD}`);
    const rand = rng(seed), start = rand(), over = .06 + rand() * .05;   // Startpunkt + wie weit sie über den Anfang hinausläuft
    const n = 48, phase = rand() * 6;
    const pts = [];
    for (let k = 0; k <= n; k++) {
      const t = start + (1 + over) * k / n;
      const [x, y, nx, ny] = onRect(w, h, 22, t);
      /* Abstand zur Kante: langsame Welle + etwas Zittern; negativ = ragt in die Karte hinein */
      const off = 3 + 7 * Math.sin(t * 9 + phase) + (rand() - .5) * 1.5;
      pts.push([x + nx * off, y + ny * off]);
    }
    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let k = 0; k < pts.length - 1; k++) {
      const p0 = pts[Math.max(0, k - 1)], p1 = pts[k], p2 = pts[k + 1], p3 = pts[Math.min(pts.length - 1, k + 2)];
      d += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    path.setAttribute("d", d);
    const len = path.getTotalLength();
    path.style.strokeDasharray = `${len} ${len}`;
    if (!card.classList.contains("is-drawn")) path.style.strokeDashoffset = len;
  };
  layout();
  if ("ResizeObserver" in window) new ResizeObserver(layout).observe(card);
  return path;
};

cards.forEach(build);
const draw = card => { card.classList.add("is-drawn"); card.querySelector(".scribble path").style.strokeDashoffset = 0; };
const erase = card => { card.classList.remove("is-drawn"); const p = card.querySelector(".scribble path"); p.style.strokeDashoffset = p.getTotalLength(); };

/* data-scribble="hover": Linie erscheint beim Drüberfahren (bzw. Tastaturfokus darin) und verschwindet wieder.
   Geräte ohne Hover (Handy) zeichnen sie stattdessen einmal beim Reinscrollen. */
const canHover = window.matchMedia("(hover: hover)").matches;
const onScroll = [];
cards.forEach(card => {
  if (card.dataset.scribble === "hover" && canHover) {
    card.addEventListener("mouseenter", () => draw(card));
    card.addEventListener("mouseleave", () => { if (!card.contains(document.activeElement)) erase(card); });
    card.addEventListener("focusin", () => draw(card));
    card.addEventListener("focusout", e => { if (!card.contains(e.relatedTarget) && !card.matches(":hover")) erase(card); });
  } else onScroll.push(card);
});
if (reduce || !("IntersectionObserver" in window)) { onScroll.forEach(draw); return; }
const io = new IntersectionObserver(entries => entries.forEach(e => {
  if (e.isIntersecting) { draw(e.target); io.unobserve(e.target); }
}), { threshold: .35 });
onScroll.forEach(c => io.observe(c));
})();
