
/* ---------- Sprache ---------- */
let lang = "de";
try { lang = new URLSearchParams(location.search).get("lang") || localStorage.getItem("lang") || "de"; } catch(e){}
if (!TEXT[lang]) lang = "de";

function setLang(l){
  lang = l;
  document.documentElement.lang = l;
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const t = TEXT[l][el.dataset.i18n]; if (t) el.textContent = t;
  });
  document.querySelectorAll("[data-i18n-html]").forEach(el => {
    const t = TEXT[l][el.dataset.i18nHtml]; if (t) el.innerHTML = t;
  });
  document.querySelectorAll("[data-i18n-alt]").forEach(el => {
    const t = TEXT[l][el.dataset.i18nAlt]; if (t) el.alt = t;
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const t = TEXT[l][el.dataset.i18nPlaceholder]; if (t) el.placeholder = t;
  });
  document.querySelectorAll("[data-i18n-aria]").forEach(el => {
    const t = TEXT[l][el.dataset.i18nAria]; if (t) el.setAttribute("aria-label", t);
  });
  /* Meta-Tags im <head> (Beschreibung, Open Graph, Twitter Card) */
  document.querySelectorAll("[data-i18n-content]").forEach(el => {
    const t = TEXT[l][el.dataset.i18nContent]; if (t) el.setAttribute("content", t);
  });
  const toggle = document.querySelector(".lang");
  toggle.dataset.active = l;
  toggle.querySelectorAll("[data-lang]").forEach(b => b.setAttribute("aria-pressed", b.dataset.lang === l));
  try { localStorage.setItem("lang", l); } catch(e){}
}
/* Sprach-Icon: Klick öffnet die Auswahl DE / EN */
const langToggle = document.querySelector(".lang-toggle");
const langMenu = document.getElementById("lang-menu");
function setLangMenu(open){ langMenu.hidden = !open; langToggle.setAttribute("aria-expanded", open); }
langToggle.addEventListener("click", () => setLangMenu(langMenu.hidden));
document.querySelectorAll(".lang [data-lang]").forEach(b => b.addEventListener("click", () => { setLang(b.dataset.lang); setLangMenu(false); langToggle.focus(); }));
document.addEventListener("click", e => { if (!langMenu.hidden && !e.target.closest(".lang")) setLangMenu(false); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && !langMenu.hidden){ setLangMenu(false); langToggle.focus(); } });

/* ---------- Burger-Menü ---------- */
const menu = document.getElementById("menu");
const burger = document.querySelector(".burger");
const closeBtn = document.querySelector(".menu-close");
function openMenu(){ menu.classList.add("open"); burger.setAttribute("aria-expanded","true"); document.body.style.overflow="hidden"; closeBtn.focus(); }
function closeMenu(){ menu.classList.remove("open"); burger.setAttribute("aria-expanded","false"); document.body.style.overflow=""; burger.focus(); }
burger.addEventListener("click", openMenu);
closeBtn.addEventListener("click", closeMenu);
document.addEventListener("keydown", e => { if (e.key === "Escape" && menu.classList.contains("open")) closeMenu(); });

setLang(lang);

/* ---------- Tab-Titel (Page Visibility API) ----------
   Ist der Tab 4 Sekunden am Stück im Hintergrund, erscheint einmalig "Psst... come back! 👀".
   Kommt die Person früher zurück, wird der Wechsel abgebrochen; bei Rückkehr steht sofort
   wieder der eigene Titel der jeweiligen Seite im Tab.
   Browser bremsen Timer in Hintergrund-Tabs stark aus – deshalb läuft der 4-Sekunden-Timer
   in einem kleinen Web Worker (wird kaum gebremst). Ohne Worker-Unterstützung: normaler Timer. */
let pageTitle = document.title;   /* wird beim Verlassen des Tabs aktualisiert, falls die Sprache gewechselt wurde */
const awayTitle = "Psst... come back! 👀";
const awayDelay = 4000;
const showAway = () => { if (document.visibilityState === "hidden") document.title = awayTitle; };

let awayWorker = null, awayTimer = null;
try {
  const src = "let t; onmessage = e => { clearTimeout(t); if (e.data > 0) t = setTimeout(() => postMessage('away'), e.data); };";
  awayWorker = new Worker(URL.createObjectURL(new Blob([src], { type: "text/javascript" })));
  awayWorker.onmessage = showAway;
} catch (e) { awayWorker = null; }

function startAwayTimer(){ awayWorker ? awayWorker.postMessage(awayDelay) : (awayTimer = setTimeout(showAway, awayDelay)); }
function stopAwayTimer(){ awayWorker ? awayWorker.postMessage(0) : clearTimeout(awayTimer); awayTimer = null; }

document.addEventListener("visibilitychange", () => {
  stopAwayTimer();
  if (document.visibilityState === "hidden"){
    if (document.title !== awayTitle) pageTitle = document.title;
    startAwayTimer();
  }
  else if (document.title !== pageTitle) document.title = pageTitle;
});
/* Aufräumen beim Verlassen der Seite; bei Rückkehr über Vor/Zurück wieder den eigenen Titel zeigen */
window.addEventListener("pagehide", stopAwayTimer);
window.addEventListener("pageshow", () => { if (document.title !== pageTitle) document.title = pageTitle; });

/* ---------- Projektkarten komplett klickbar ----------
   Karten mit einem "Ansehen"-Link führen bei Klick irgendwo auf der Karte zu diesem Link.
   Text markieren bleibt möglich; Strg/Cmd-Klick und Mittelklick öffnen einen neuen Tab. */
document.querySelectorAll(".card").forEach(card => {
  const link = card.querySelector("a.btn-view[href]");
  if (!link) return;
  card.classList.add("is-link");
  const open = e => {
    if (e.target.closest("a, button")) return;
    if (String(window.getSelection()).trim()) return;
    if (e.button === 1 || e.ctrlKey || e.metaKey) window.open(link.href, "_blank");
    else if (e.button === 0) link.click();
  };
  card.addEventListener("click", open);
  card.addEventListener("auxclick", open);
});

/* ---------- Abschnitts-Navigation (Visual & Brand Work) ----------
   Markiert den Abschnitt, der gerade im Blick ist. */
const tocLinks = [...document.querySelectorAll(".vb-toc a")];
if (tocLinks.length && "IntersectionObserver" in window){
  const byId = new Map(tocLinks.map(a => [a.getAttribute("href").slice(1), a]));
  const secs = tocLinks.map(a => document.getElementById(a.getAttribute("href").slice(1))?.closest("section")).filter(Boolean);
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const id = e.target.querySelector("h2[id]")?.id;
      tocLinks.forEach(a => a.removeAttribute("aria-current"));
      if (byId.get(id)) byId.get(id).setAttribute("aria-current", "true");
    });
  }, { rootMargin: "-40% 0px -55% 0px" });
  secs.forEach(s => io.observe(s));
}
