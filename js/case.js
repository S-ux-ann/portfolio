/* =========================================================
   PROJEKTSEITEN – Karussell, Vorher/Nachher-Vergleich    CASE STUDY – Karussell & Vorher/Nachher-Vergleich Fortschrittsanzeige
   ========================================================= */

/* ---------- Karussell (Design-Fokus) ---------- */
document.querySelectorAll(".cs-carousel").forEach(carousel => {
  const track = carousel.querySelector(".cs-track");
  const slides = [...track.children];
  const dots = [...(carousel.querySelector(".cs-pager") || carousel.parentElement.querySelector(".cs-pager") || document.createElement("i")).children];

  /* Karten werden mittig ausgerichtet, Bild-Slider (.cs-gallery) linksbündig an der Textspalte */
  const alignStart = carousel.classList.contains("cs-gallery");
  const pad = () => parseFloat(getComputedStyle(track).paddingLeft) || 0;
  const target = s => alignStart ? s.offsetLeft - pad() : s.offsetLeft + s.offsetWidth / 2 - track.clientWidth / 2;
  function current(){
    let best = 0, dist = Infinity;
    slides.forEach((s, i) => {
      const d = Math.abs(target(s) - track.scrollLeft);
      if (d < dist){ dist = d; best = i; }
    });
    return best;
  }
  function go(i){
    const s = slides[(i + slides.length) % slides.length];
    track.scrollTo({ left: target(s), behavior: reduce ? "auto" : "smooth" });
  }
  function update(){
    const i = current();
    dots.forEach((d, n) => d.classList.toggle("on", n === i));
  }

  carousel.querySelector(".cs-arrow-prev").addEventListener("click", () => go(current() - 1));
  carousel.querySelector(".cs-arrow-next").addEventListener("click", () => go(current() + 1));
  track.addEventListener("scroll", () => requestAnimationFrame(update), { passive: true });
  update();
});

/* ---------- Vorher/Nachher-Regler ---------- */
document.querySelectorAll(".cs-compare").forEach(box => {
  const range = box.querySelector(".cs-range");
  const set = () => box.style.setProperty("--pos", range.value + "%");
  range.addEventListener("input", set);
  set();
});

/* ---------- Fortschrittsanzeige (rechts, ein Punkt pro Abschnitt) ---------- */
(function(){
  const sections = [...document.querySelectorAll("main .cs-challenge, main .cs-sec, main .cs-outcome, main .cs-darkbox")]
    .filter(s => !s.parentElement.closest(".cs-challenge, .cs-sec, .cs-outcome, .cs-darkbox"));   /* nur oberste Ebene */
  if (sections.length < 2) return;

  const nav = document.createElement("nav");
  nav.className = "cs-progress";
  const dots = sections.map((sec, i) => {
    if (!sec.id) sec.id = "abschnitt-" + (i + 1);
    const a = document.createElement("a");
    a.className = "cs-progress-dot";
    a.href = "#" + sec.id;
    a.innerHTML = '<span class="cs-progress-tip"></span>';
    nav.appendChild(a);
    return a;
  });
  document.body.appendChild(nav);

  /* Beschriftung = kleines Label bzw. Überschrift des Abschnitts – in der aktuellen Sprache */
  function labels(){
    nav.setAttribute("aria-label", TEXT[lang]["cs.progress"]);
    sections.forEach((sec, i) => {
      /* eigene Kurzbeschriftung möglich: data-progress-label="…" am Abschnitt */
      const el = sec.querySelector(".cs-eyebrow") || sec.querySelector("h2, h3");
      dots[i].firstChild.textContent = sec.dataset.progressLabel || (el ? el.innerText.trim() : "");
    });
  }
  document.querySelectorAll(".lang button").forEach(b => b.addEventListener("click", labels));

  /* Aktiv ist der letzte Abschnitt, dessen Oberkante die obere Bildschirmhälfte erreicht hat */
  function update(){
    const line = window.innerHeight * 0.4;
    let active = -1;
    sections.forEach((sec, i) => { if (sec.getBoundingClientRect().top <= line) active = i; });
    nav.classList.toggle("show", sections[0].getBoundingClientRect().top < window.innerHeight * 0.85);
    dots.forEach((d, i) => i === active ? d.setAttribute("aria-current", "location") : d.removeAttribute("aria-current"));
  }
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { update(); ticking = false; });
  }, { passive: true });
  window.addEventListener("resize", update);
  labels();
  update();
})();
