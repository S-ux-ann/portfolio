/* =========================================================
   HERO: Porträt + Linie
   Eine leicht wackelige, "handgezeichnete" Linie läuft in ca. 3 s einmal um das Porträt,
   lässt dabei die Labels (was ich mache) erscheinen und endet am Porträt.
   Position der Labels: data-angle in Grad (0 = rechts, 90 = unten, im Uhrzeigersinn).
   ========================================================= */
(() => {
const fig = document.getElementById("hero-path");
if (!fig) return;
const line = fig.querySelector(".hp-line");
const pen = fig.querySelector(".hp-pen");
const items = [...fig.querySelectorAll(".hp-steps li")];
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const VB_W = 720, VB_H = 680, CX = 380, CY = 330, R = 282;
const A0 = 128, A1 = 412;          // Start unten links, eine Runde im Uhrzeigersinn …
const END = [CX + 140, CY + 150];  // … und zum Schluss hinein ans Porträt (Schulter rechts)
const DUR = 2800;
const rad = a => a * Math.PI / 180;
const radius = a => R + 9 * Math.sin(rad(a) * 3) + 6 * Math.sin(rad(a) * 7 + 1);   // kleine Unregelmäßigkeit = Handzeichnung
const at = a => [CX + Math.cos(rad(a)) * radius(a), CY + Math.sin(rad(a)) * radius(a)];

/* Punkte entlang der Runde + Endpunkt, dann Catmull-Rom → weiche Kurve */
const pts = [];
for (let a = A0; a <= A1; a += 12) pts.push(at(a));
pts.push(END);
let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
for (let i = 0; i < pts.length - 1; i++) {
  const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
  const c = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
  d += `C${c.map(v => v.toFixed(1)).join(" ")} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
}
line.setAttribute("d", d);
const total = line.getTotalLength();

/* Labels auf die Linie setzen; Seite merken, damit der Hinweistext nach innen aufklappt */
const arc = A1 - A0;
items.forEach(li => {
  const a = +li.dataset.angle, [x, y] = at(a);
  li._x = x / VB_W;
  li.style.top = (y / VB_H * 100) + "%";
  li.dataset.side = x > CX ? "right" : "left";
  li._at = (a - A0) / arc * .9;   // Anteil der Linie, ab dem das Label erscheint (Runde ≈ 90 % der Länge)
});
/* Label mittig auf die Linie setzen, aber nie über den Rand der Grafik hinaus
   (neu berechnen bei Größenänderung und Sprachwechsel – dann ändert sich die Label-Breite) */
const layout = () => {
  const W = fig.clientWidth;
  items.forEach(li => {
    const w = li.firstElementChild.offsetWidth;
    li.style.left = Math.max(0, Math.min(W - w, li._x * W - w / 2)) + "px";
  });
};
layout();
if ("ResizeObserver" in window) {
  const ro = new ResizeObserver(layout);
  ro.observe(fig); items.forEach(li => ro.observe(li.firstElementChild));
} else window.addEventListener("resize", layout);
fig.classList.add("is-ready");

const draw = p => {
  const len = total * p;
  line.style.strokeDasharray = `${total} ${total}`;
  line.style.strokeDashoffset = total - len;
  const pt = line.getPointAtLength(len);
  pen.setAttribute("cx", pt.x.toFixed(1)); pen.setAttribute("cy", pt.y.toFixed(1));
  items.forEach(li => li.classList.toggle("is-on", p >= li._at));
};

if (reduce) { draw(1); return; }
draw(0);
const ease = x => 1 - Math.pow(1 - x, 2.2);
let t0 = 0;
const tick = now => {
  if (!t0) t0 = now;
  const p = Math.min(1, (now - t0) / DUR);
  draw(ease(p));
  if (p < 1) requestAnimationFrame(tick);
  else setTimeout(peek, 700);
};

/* Einmal zeigen, dass die Labels etwas verraten: die Figur schaut zum ersten Label,
   dessen Hinweistext klappt kurz auf. Fährt man vorher selbst über ein Label, entfällt das. */
let touched = false;
items.forEach(li => li.addEventListener("pointerenter", () => { touched = true; }));
const peek = () => {
  const li = items[0];
  if (touched || !li) return;
  const r = li.firstElementChild.getBoundingClientRect();
  if (r.bottom < 0 || r.top > innerHeight) return;   // Hero nicht mehr im Blick
  dispatchEvent(new CustomEvent("toon:look", { detail: { x: r.left + r.width / 2, y: r.top + r.height / 2 } }));
  li.classList.add("is-peek");
  setTimeout(() => {
    li.classList.remove("is-peek");
    dispatchEvent(new CustomEvent("toon:look", { detail: null }));
  }, 2800);
};
setTimeout(() => requestAnimationFrame(tick), 400);
})();
