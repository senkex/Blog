const langBtn = document.getElementById("lang-btn");
const langMenu = document.querySelector(".lang-dropdown");
let currentLang = "en_us";

async function loadLang(lang) {
  try {
    document.body.style.transition = "opacity .25s ease";
    document.body.style.opacity = ".45";

    const res = await fetch(`locales/${lang}.json`);
    const data = await res.json();

    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.dataset.i18n;
      if (!data[key]) return;

      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        el.placeholder = data[key];
      } else {
        el.innerHTML = data[key];
      }
    });

    if (Array.isArray(data.typing_words) && typeof window.setTypingWords === "function") {
      window.setTypingWords(data.typing_words);
    }

    currentLang = lang;
    setTimeout(() => (document.body.style.opacity = "1"), 90);
  } catch (e) {
    console.error("Language load failed:", e);
    document.body.style.opacity = "1";
  }
}

langBtn?.addEventListener("click", () => {
  langMenu.style.display = langMenu.style.display === "flex" ? "none" : "flex";
});

document.addEventListener("click", e => {
  if (!langBtn?.contains(e.target) && !langMenu?.contains(e.target)) {
    if (langMenu) langMenu.style.display = "none";
  }
});

document.querySelectorAll("[data-lang]").forEach(btn => {
  btn.addEventListener("click", () => {
    loadLang(btn.dataset.lang);
    if (langMenu) langMenu.style.display = "none";
  });
});

loadLang(currentLang);
