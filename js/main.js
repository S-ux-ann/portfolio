
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
  document.querySelectorAll("[data-i18n-aria]").forEach(el => {
    const t = TEXT[l][el.dataset.i18nAria]; if (t) el.setAttribute("aria-label", t);
  });
  const toggle = document.querySelector(".lang");
  toggle.dataset.active = l;
  toggle.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", b.dataset.lang === l));
  try { localStorage.setItem("lang", l); } catch(e){}
  startTyping();
}
document.querySelectorAll(".lang button").forEach(b => b.addEventListener("click", () => setLang(b.dataset.lang)));

/* ---------- Tipp-Animation ---------- */
const typedEl = document.getElementById("typed");
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let timer;
function startTyping(){
  clearTimeout(timer);
  if (!typedEl) return;
  const words = ROLES[lang];
  if (reduce){ typedEl.textContent = words[0]; return; }
  let w = 0, i = 0, deleting = false;
  (function tick(){
    const word = words[w];
    i += deleting ? -1 : 1;
    typedEl.textContent = word.slice(0, i);
    let delay = deleting ? 45 : 90;
    if (!deleting && i === word.length){ deleting = true; delay = 1600; }
    else if (deleting && i === 0){ deleting = false; w = (w + 1) % words.length; delay = 350; }
    timer = setTimeout(tick, delay);
  })();
}

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
