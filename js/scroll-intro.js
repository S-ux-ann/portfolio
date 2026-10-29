/* ---------- Projekte: Karussell (.sm) ----------
   Karten kommen versetzt herein und richten sich beim Scrollen in einer Linie aus,
   dann erscheinen "zurück" / "weiter" fürs Karussell.
   Bei "weniger Bewegung" stehen die Karten sofort in einer Linie (nur CSS), das Karussell lässt sich trotzdem bedienen. */
(() => {
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

const clamp = v => Math.min(1, Math.max(0, v));
const seg = (v, a, b) => b > a ? clamp((v - a) / (b - a)) : +(v >= b);   // Abschnitt a–b → 0–1
const smooth = t => t * t * (3 - 2 * t);                // sanft an- und auslaufend
const updates = [], refreshes = [];

const sm = document.querySelector(".sm");
if (sm) {
  const track = sm.querySelector(".sm-track");
  const prev = sm.querySelector(".sm-prev"), next = sm.querySelector(".sm-next");
  /* Karten sind unterschiedlich breit: zur nächsten / vorigen Karte springen statt um eine feste Breite */
  const go = dir => {
    const pad = parseFloat(getComputedStyle(track).scrollPaddingLeft) || 0, x0 = track.getBoundingClientRect().left;
    const xs = [...track.children].map(t => t.getBoundingClientRect().left - x0 + track.scrollLeft - pad);
    const x = track.scrollLeft;
    const to = dir > 0 ? xs.find(v => v > x + 2) : xs.filter(v => v < x - 2).pop();
    track.scrollTo({ left: to ?? (dir > 0 ? track.scrollWidth : 0), behavior: reduce ? "auto" : "smooth" });
  };
  prev.addEventListener("click", () => go(-1));
  next.addEventListener("click", () => go(1));
  const ends = () => {   // am Anfang / Ende den jeweiligen Knopf ausgrauen
    const max = track.scrollWidth - track.clientWidth;
    prev.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= max - 2;
  };
  track.addEventListener("scroll", ends, { passive: true });
  refreshes.push(ends);
  /* Startlage: Karten so weit anheben, dass ihre Oberkanten im Startscreen unten zu sehen sind (peek),
     aber nie über den Hero-Inhalt. Ausrichten: vom Seitenanfang bis "Reihe steht im oberen Drittel". */
  const heroParts = document.querySelectorAll(".hero-text, .hero-art");
  const peek = .2;                                         // sichtbarer Anteil unten im Startscreen
  let end = 1;
  if (reduce) sm.classList.add("is-aligned");
  else {
    refreshes.push(() => {
      const y = scrollY, vh = innerHeight;
      const heroBottom = Math.max(0, ...[...heroParts].map(el => el.getBoundingClientRect().bottom + y));
      const trackTop = track.getBoundingClientRect().top + y + parseFloat(getComputedStyle(track).paddingTop);
      const target = Math.max(vh * (1 - peek), heroBottom + 24);
      sm.style.setProperty("--lift", Math.max(0, trackTop - target).toFixed(0) + "px");
      end = Math.max(1, trackTop - vh * .45);
    });
    updates.push(() => {
      const a = smooth(seg(scrollY, 0, end));
      sm.style.setProperty("--align", a.toFixed(4));
      sm.classList.toggle("is-aligned", a > .97);
    });
  }
}

/* Videos in den Karten: mit Maus erst beim Hovern (oder Tastaturfokus) abspielen, ohne Maus solange die Karte zu sehen ist.
   Bei "weniger Bewegung" bleibt das Standbild (poster). */
const vids = document.querySelectorAll(".sm-track video");
if (vids.length && !reduce) {
  const hover = () => matchMedia("(hover: hover)").matches;    // erst beim Ereignis prüfen (Fenster/Gerät kann wechseln)
  const play = v => v.play().catch(() => {});
  vids.forEach(v => {
    const tile = v.closest(".sm-tile");
    tile.addEventListener("mouseenter", () => { if (hover()) play(v); });
    tile.addEventListener("mouseleave", () => { if (hover()) v.pause(); });
    tile.addEventListener("focusin", () => play(v));
    tile.addEventListener("focusout", () => v.pause());
  });
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (hover()) { if (!e.isIntersecting) e.target.pause(); return; }
      if (e.isIntersecting) play(e.target); else e.target.pause();
    }), { threshold: .4 });
    vids.forEach(v => io.observe(v));
  }
}

/* Vorher → Nachher als Pixel-Wipe (img mit data-wipe = Vorher-Bild, src = Nachher):
   In Ruhe steht das Nachher. Entlang einer Diagonale springen die Bildpixel ins Vorher und danach wieder zurück, endlos.
   Wie die Videos: mit Maus nur beim Hovern (oder Tastaturfokus), ohne Maus solange die Karte zu sehen ist.
   Bei "weniger Bewegung" bleibt das Nachher als Standbild. */
const wipes = document.querySelectorAll(".sm-track img[data-wipe]");
if (wipes.length && !reduce) {
  const CELL = 4, FLIP = .07, JITTER = .04, HOLD = 2800, WIPE = 3200;
  const LOOP = 2 * (HOLD + WIPE);
  const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const load = src => new Promise((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = fail; i.src = src; });
  // Zeitpunkt im Loop → Fortschritt 1 (Nachher) bis 0 (Vorher).
  // Der Loop beginnt direkt mit dem Wipe ins Vorher, das Stehen auf dem Nachher kommt am Ende.
  const progress = t => {
    t %= LOOP;
    if (t < WIPE) return 1 - ease(t / WIPE);
    if ((t -= WIPE) < HOLD) return 0;
    if ((t -= HOLD) < WIPE) return ease(t / WIPE);
    return 1;
  };
  const setup = async img => {
    let a, b;
    try { [a, b] = await Promise.all([load(img.dataset.wipe), load(img.currentSrc || img.src)]); } catch { return; }
    const cv = document.createElement("canvas");
    cv.className = "sm-wipe"; cv.setAttribute("aria-hidden", "true");
    img.after(cv);
    const ctx = cv.getContext("2d");
    let W = 0, H = 0, cells = [], ca, cb, raf = 0, start = 0, elapsed = 0, playing = false;
    // object-fit: cover, Ausschnitt mittig
    const cover = im => { const s = Math.max(W / im.width, H / im.height); return { s, ox: (W - im.width * s) / 2, oy: (H - im.height * s) / 2 }; };
    const size = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      if (!W || !H) return;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ca = cover(a); cb = cover(b);
      const cols = Math.ceil(W / CELL), rows = Math.ceil(H / CELL);
      cells = [];
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++)
        cells.push({ x: x * CELL, y: y * CELL, n: 2 + Math.floor(Math.random() * 3),
          t: ((x + .5) / cols * .62 + (y + .5) / rows * .38) * (1 - JITTER - FLIP) + Math.random() * JITTER });
    };
    const tile = (im, c, x, y) => ctx.drawImage(im, (x - c.ox) / c.s, (y - c.oy) / c.s, CELL / c.s, CELL / c.s, x, y, CELL, CELL);
    const draw = p => {
      // Grundbild ist das, was gerade überwiegt; darauf nur die abweichenden Pixel
      const base = p < .5 ? a : b, cbase = p < .5 ? ca : cb;
      ctx.drawImage(base, cbase.ox, cbase.oy, base.width * cbase.s, base.height * cbase.s);
      for (const c of cells) {
        const f = (p - c.t) / FLIP;
        // beim Umspringen n-mal hin und her, ungerade Phasen zeigen das Nachher
        const after = f >= 1 || (f > 0 && Math.floor(f * c.n * 2) % 2 === 1);
        if (after && base === a) tile(b, cb, c.x, c.y);
        else if (!after && base === b) tile(a, ca, c.x, c.y);
      }
    };
    const frame = now => { elapsed = now - start; draw(progress(elapsed)); raf = requestAnimationFrame(frame); };
    // anhalten und an derselben Stelle weiterlaufen lassen (wie pause / play beim Video)
    const run = on => {
      if (on === playing) return;
      playing = on;
      cancelAnimationFrame(raf);
      if (!on) return;
      if (!cells.length) size();
      start = performance.now() - elapsed; raf = requestAnimationFrame(frame);
    };
    size(); draw(1);
    refreshes.push(() => { size(); draw(progress(elapsed)); });
    const hover = () => matchMedia("(hover: hover)").matches;
    const card = img.closest(".sm-tile");
    card.addEventListener("mouseenter", () => { if (hover()) run(true); });
    card.addEventListener("mouseleave", () => { if (hover()) run(false); });
    card.addEventListener("focusin", () => run(true));
    card.addEventListener("focusout", () => run(false));
    if ("IntersectionObserver" in window) new IntersectionObserver(([e]) => {
      if (hover()) { if (!e.isIntersecting) run(false); return; }
      run(e.isIntersecting);
    }, { threshold: .2 }).observe(cv);
  };
  wipes.forEach(setup);
}

let queued = false;
const update = () => { queued = false; updates.forEach(f => f()); };
const queue = () => { if (!queued){ queued = true; requestAnimationFrame(update); } };
function refresh(){ refreshes.forEach(f => f()); update(); }
addEventListener("scroll", queue, { passive: true });
addEventListener("resize", refresh);
addEventListener("load", refresh);   // Bilder und Schrift ändern die Höhen
refresh();
})();
