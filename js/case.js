/* =========================================================
   CASE STUDY – Karussell & Vorher/Nachher-Vergleich
   ========================================================= */

/* ---------- Karussell (Design-Fokus) ---------- */
document.querySelectorAll(".cs-carousel").forEach(carousel => {
  const track = carousel.querySelector(".cs-track");
  const slides = [...track.children];
  const dots = [...carousel.parentElement.querySelectorAll(".cs-pager span")];

  function current(){
    const center = track.scrollLeft + track.clientWidth / 2;
    let best = 0, dist = Infinity;
    slides.forEach((s, i) => {
      const d = Math.abs(s.offsetLeft + s.offsetWidth / 2 - center);
      if (d < dist){ dist = d; best = i; }
    });
    return best;
  }
  function go(i){
    const s = slides[(i + slides.length) % slides.length];
    track.scrollTo({ left: s.offsetLeft + s.offsetWidth / 2 - track.clientWidth / 2, behavior: reduce ? "auto" : "smooth" });
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
