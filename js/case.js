/* =========================================================
   PROJEKTSEITEN – Karussell, Bild-Slider, Vorher/Nachher-Vergleich & Fortschrittsanzeige
   ========================================================= */

/* ---------- Karussell mit Karten (z. B. Design-Fokus) ---------- */
document.querySelectorAll(".cs-carousel:not(.cs-gallery)").forEach(carousel => {
  const track = carousel.querySelector(".cs-track");
  const slides = [...track.children];
  const dots = [...(carousel.querySelector(".cs-pager") || carousel.parentElement.querySelector(".cs-pager") || document.createElement("i")).children];
  const target = s => s.offsetLeft + s.offsetWidth / 2 - track.clientWidth / 2;

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

/* ---------- Bild-Slider über die volle Breite, endlos in beide Richtungen ----------
   Vor und hinter die echten Bilder kommen unsichtbare Kopien. Landet der Slider auf einer
   Kopie, springt er ohne Animation zum gleichen echten Bild – so entsteht ein Endlos-Loop. */
document.querySelectorAll(".cs-gallery").forEach(gallery => {
  const track = gallery.querySelector(".cs-track");
  const real = [...track.children];
  const n = real.length;
  const copies = () => real.map(s => {
    const c = s.cloneNode(true);
    c.classList.add("is-clone");
    c.setAttribute("aria-hidden", "true");
    c.inert = true;
    return c;
  });
  track.prepend(...copies());
  track.append(...copies());
  const all = [...track.children];            /* Kopien · echte Bilder · Kopien */
  const dots = [...gallery.querySelector(".cs-pager").children];
  const center = s => s.offsetLeft + s.offsetWidth / 2 - track.clientWidth / 2;

  function current(){
    let best = 0, dist = Infinity;
    all.forEach((s, i) => {
      const d = Math.abs(center(s) - track.scrollLeft);
      if (d < dist){ dist = d; best = i; }
    });
    return best;
  }
  function scrollToSlide(i, smooth){
    i = Math.max(0, Math.min(all.length - 1, i));
    track.scrollTo({ left: center(all[i]), behavior: smooth && !reduce ? "smooth" : "auto" });
  }
  function update(){
    const r = current() % n;
    dots.forEach((d, k) => d.classList.toggle("on", k === r));
  }
  /* nach dem Scrollen: von einer Kopie zurück in den echten Bereich springen */
  function settle(){
    const i = current();
    if (i < n) scrollToSlide(i + n, false);
    else if (i >= 2 * n) scrollToSlide(i - n, false);
    update();
  }

  gallery.querySelector(".cs-arrow-prev").addEventListener("click", () => scrollToSlide(current() - 1, true));
  gallery.querySelector(".cs-arrow-next").addEventListener("click", () => scrollToSlide(current() + 1, true));
  let timer;
  track.addEventListener("scroll", () => {
    requestAnimationFrame(update);
    clearTimeout(timer);
    timer = setTimeout(settle, 150);          /* Scrollen ist zur Ruhe gekommen */
  }, { passive: true });
  window.addEventListener("resize", () => scrollToSlide(n + current() % n, false));
  scrollToSlide(n, false);                     /* Start beim ersten echten Bild */
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
