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

let queued = false;
const update = () => { queued = false; updates.forEach(f => f()); };
const queue = () => { if (!queued){ queued = true; requestAnimationFrame(update); } };
function refresh(){ refreshes.forEach(f => f()); update(); }
addEventListener("scroll", queue, { passive: true });
addEventListener("resize", refresh);
addEventListener("load", refresh);   // Bilder und Schrift ändern die Höhen
refresh();
})();
