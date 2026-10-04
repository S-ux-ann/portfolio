/* =========================================================
   HERO: Blindzeichnung – eine einzige Linie zeichnet meinen Weg
   Grafikdesign → Mode → Branding → UX/UI → Research & Daten → Porträt.
   Der Stift setzt nie ab; die "Kamera" fährt von Station zu Station mit.
   Jede Station hat ein eigenes Feld (1500 Einheiten breit) auf einem langen Papierstreifen.
   Punkte werden per Catmull-Rom zu einer weichen Linie verbunden; K() = Ecke (Punkt doppelt).
   ========================================================= */
(() => {
const fig = document.getElementById("hero-draw");
if (!fig) return;
const svg = fig.querySelector("svg");
const cam = fig.querySelector(".hd-cam");
const line = fig.querySelector(".hd-line");
const pen = fig.querySelector(".hd-pen");
const steps = [...fig.querySelectorAll(".hd-steps li")];
const toggle = fig.querySelector(".hd-toggle");
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const FRAME = 1500, VIEW_W = 1400, VIEW_H = 1320;
const K = (x, y) => [[x, y], [x, y]];
const circle = (cx, cy, r, a0, turns, n) => Array.from({ length: n + 1 }, (_, i) => {
  const a = a0 + (i / n) * turns * Math.PI * 2;
  return [Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r)];
});

/* ---------- Stationen (lokale Koordinaten je Feld) ---------- */
const stations = [
  { // 01 Grafikdesign: Buchstabe "A", Bleistift, Schreibschwung
    dur: 2.2, pts: [
      [120, 1190], ...K(150, 1080), ...K(420, 250), ...K(700, 1080), ...K(606, 800), ...K(241, 800),
      [330, 960], [600, 1060], ...K(820, 1080), ...K(821, 952), ...K(1078, 284), ...K(1162, 316), ...K(905, 984), ...K(820, 1080),
      [900, 1150], [1000, 1110], [1080, 1160], [1170, 1110], [1260, 1150]
    ] },
  { // 02 Modedesign: Bügel und Kleid
    dur: 2.4, pts: [
      [80, 1050], [200, 760], ...K(380, 445), ...K(690, 290), [702, 215], [668, 168], [628, 188], [652, 222], ...K(690, 290), ...K(985, 440),
      ...K(800, 445), ...K(680, 570), ...K(560, 445), [545, 600], ...K(592, 705), ...K(400, 1150),
      [520, 1115], [640, 1165], [760, 1115], [880, 1165], ...K(960, 1150), ...K(768, 705), [815, 600], ...K(800, 445),
      [960, 640], [1120, 930], [1280, 1100]
    ] },
  { // 03 Branding: Logo-Signet – Kreis mit "S"-Monogramm
    dur: 2, pts: [
      ...circle(650, 640, 360, Math.PI * .8, 1.12, 22),
      [700, 420], [770, 470], [700, 420], [600, 425], [545, 490], [575, 575], [660, 625], [745, 690], [755, 780], [690, 850], [580, 855], [520, 800],
      [700, 960], [1100, 1060], [1300, 1120]
    ] },
  { // 04 UX/UI: Smartphone-Wireframe mit Bild, Text, Button und Cursor
    dur: 2.6, pts: [
      ...K(430, 1090), [430, 230], [445, 185], [490, 170], [810, 170], [855, 185], [870, 230], [870, 1090], [855, 1135], [810, 1150],
      [490, 1150], [445, 1135], [430, 1090], [440, 700], ...K(490, 320), ...K(810, 320), ...K(810, 560), ...K(490, 560), ...K(490, 320), ...K(810, 560),
      ...K(490, 640), ...K(790, 640), ...K(490, 700), ...K(700, 700),
      [520, 820], [780, 820], [805, 860], [780, 900], [520, 900], [495, 860], [520, 820],
      ...K(700, 870), ...K(700, 1010), ...K(738, 975), ...K(778, 1050), ...K(800, 1040), ...K(762, 965), ...K(812, 960), ...K(700, 870),
      [950, 1060], [1250, 1150]
    ] },
  { // 05 Research & Daten: Balkendiagramm und Lupe
    dur: 2.3, pts: [
      ...K(250, 250), ...K(250, 1050), ...K(330, 1050), ...K(330, 760), ...K(420, 760), ...K(420, 1050),
      ...K(480, 1050), ...K(480, 610), ...K(570, 610), ...K(570, 1050), ...K(630, 1050), ...K(630, 460), ...K(720, 460), ...K(720, 1050), ...K(1060, 1050),
      [1110, 900], ...K(1120, 880), ...circle(840, 560, 175, Math.PI * .27, 1.06, 18),
      [1120, 960], [1300, 1240]
    ] },
  { // 06 Heute: Porträt
    dur: 6, pts: [[60,1298],[85,1225],[140,1120],[270,1035],[400,975],[468,912],[448,1000],[428,1075],[452,1132],[505,1040],[530,940],[528,880],[505,800],[478,700],[466,560],[476,432],[505,378],[563,322],[685,300],[808,316],[869,366],[888,320],[912,292],[900,262],[872,250],[884,224],[860,204],[838,214],[852,232],[818,198],[770,172],[720,150],[690,168],[708,184],[676,170],[640,156],[585,165],[532,188],[505,212],[528,232],[488,230],[452,262],[425,315],[414,372],[428,420],[404,470],[418,540],[400,600],[426,660],[404,720],[388,790],[372,850],[396,812],[430,760],[452,790],[470,740],[484,772],[500,800],[507,850],[497,866],[512,870],[510,848],[560,832],[620,862],[675,870],[767,845],[817,784],[862,712],[884,620],[879,529],[872,470],[892,420],[878,470],[843,477],[787,460],[726,476],[712,505],[716,536],[740,516],[761,511],[802,523],[780,538],[750,540],[716,536],[760,522],[766,532],[754,532],[700,560],[688,610],[700,645],[731,668],[703,686],[675,682],[650,688],[628,676],[640,650],[652,600],[640,565],[616,553],[590,540],[568,538],[522,558],[548,570],[580,572],[616,553],[568,552],[574,562],[560,562],[600,520],[624,503],[553,494],[492,512],[530,590],[565,660],[580,700],[570,735],[588,733],[634,726],[685,722],[740,716],[787,707],[770,740],[746,766],[685,783],[634,772],[598,745],[640,742],[700,742],[760,728],[787,707],[805,690],[815,720],[800,740],[828,856],[860,950],[889,1110],[935,1020],[910,905],[1000,935],[1074,978],[1219,1058],[1286,1147],[1315,1230],[1330,1298]] }
];
const LINK_DUR = .85;   // Übergang zwischen zwei Stationen (Kamera fährt mit)
const HOLD = .9;        // Pause, damit man die fertige Zeichnung erkennt

/* ---------- Pfad bauen: alle Punkte global, ein Catmull-Rom-Spline ---------- */
const pts = [], marks = [];   // marks[i] = Index des ersten / letzten Punktes von Station i
stations.forEach((s, i) => {
  const start = pts.length;
  s.pts.forEach(([x, y]) => pts.push([x + i * FRAME, y]));
  marks.push([start, pts.length - 1]);
});
let d = `M${pts[0][0]} ${pts[0][1]}`;
const segLen = [];   // ungefähre Länge jedes kubischen Segments (für die Zeitachse)
for (let i = 0; i < pts.length - 1; i++) {
  const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
  const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
  const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
  d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0]} ${p2[1]}`;
  let len = 0, prev = p1;
  for (let t = .125; t <= 1; t += .125) {
    const u = 1 - t, q = [0, 1].map(k => u*u*u*p1[k] + 3*u*u*t*c1[k] + 3*u*t*t*c2[k] + t*t*t*p2[k]);
    len += Math.hypot(q[0] - prev[0], q[1] - prev[1]); prev = q;
  }
  segLen.push(len);
}
line.setAttribute("d", d);
const total = line.getTotalLength();
const approx = segLen.reduce((a, b) => a + b, 0);
const lenAt = idx => segLen.slice(0, idx).reduce((a, b) => a + b, 0) * total / approx;   // Länge bis Punkt idx
line.style.strokeDasharray = `${total} ${total}`;

/* ---------- Zeitachse: Station zeichnen, dann Übergang zur nächsten ---------- */
const tl = [];   // {t0, t1, l0, l1, f0, f1, step}
let t = 0;
stations.forEach((s, i) => {
  const [a, b] = marks[i];
  tl.push({ t0: t, t1: t += s.dur, l0: lenAt(a), l1: lenAt(b), f0: i, f1: i, step: i });
  if (i < stations.length - 1) tl.push({ t0: t, t1: t += HOLD, l0: lenAt(b), l1: lenAt(b), f0: i, f1: i, step: i });   // fertige Station kurz stehen lassen
  if (i < stations.length - 1) tl.push({ t0: t, t1: t += LINK_DUR, l0: lenAt(b), l1: lenAt(marks[i + 1][0]), f0: i, f1: i + 1, step: i });
});
const END = t;
const ease = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
const camX = f => f * FRAME - (VIEW_W - 1364) / 2;

let current = -1;
const setStep = i => {
  if (i === current) return;
  current = i;
  steps.forEach((li, k) => li.classList.toggle("is-on", k === i));
};
const render = time => {
  const s = tl.find(x => time < x.t1) || tl[tl.length - 1];
  const p = Math.min(1, Math.max(0, (time - s.t0) / (s.t1 - s.t0)));
  const len = s.l0 + (s.l1 - s.l0) * (s.f0 === s.f1 ? p : ease(p));
  const f = s.f0 + (s.f1 - s.f0) * ease(p);
  cam.setAttribute("transform", `translate(${-camX(f).toFixed(1)} 0)`);
  line.style.strokeDashoffset = total - len;
  const pt = line.getPointAtLength(len);
  pen.setAttribute("cx", pt.x.toFixed(1)); pen.setAttribute("cy", pt.y.toFixed(1));
  setStep(s.step);
};

svg.setAttribute("viewBox", `0 0 ${VIEW_W} ${VIEW_H}`);

/* Reduzierte Bewegung: direkt das fertige Porträt zeigen */
const showEnd = () => { render(END); fig.classList.add("is-done"); };
if (reduce) { showEnd(); return; }

/* ---------- Abspielen / Pause / Nochmal ---------- */
let time = 0, last = 0, playing = false, raf = 0;
const setState = s => { fig.dataset.state = s; };
const tick = now => {
  time += Math.min(.25, (now - last) / 1000);   // max. 250 ms pro Frame → kein großer Sprung nach Tab-Wechsel
  last = now;
  render(Math.min(time, END));
  if (time >= END) { playing = false; fig.classList.add("is-done"); setState("done"); return; }
  raf = requestAnimationFrame(tick);
};
const play = () => {
  if (time >= END) { time = 0; fig.classList.remove("is-done"); }
  playing = true; setState("playing");
  last = performance.now(); raf = requestAnimationFrame(tick);
};
const pause = () => { playing = false; cancelAnimationFrame(raf); setState("paused"); };
toggle.addEventListener("click", () => (playing ? pause() : play()));

render(0);
setTimeout(play, 500);
})();
