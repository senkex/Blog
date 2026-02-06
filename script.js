const loader = document.getElementById("loader");
window.addEventListener("load", () => {
  setTimeout(() => {
    if (!loader) return;
    loader.style.transition = "opacity 1s ease, transform 1s ease";
    loader.style.opacity = "0";
    loader.style.transform = "scale(1.12)";
    setTimeout(() => loader.remove(), 1000);
  }, 850);
});

const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

const themeBtn = document.getElementById("themeToggle");
const body = document.body;

function applyTheme(theme) {
  body.classList.remove("theme-dark", "theme-light");
  body.classList.add(theme);
  localStorage.setItem("theme", theme);

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "theme-light" ? "#ffffff" : "#000000");
}

const savedTheme = localStorage.getItem("theme");
if (savedTheme === "theme-light" || savedTheme === "theme-dark") {
  applyTheme(savedTheme);
} else {
  applyTheme("theme-light");
}

themeBtn?.addEventListener("click", () => {
  themeBtn.classList.add("flash");
  setTimeout(() => themeBtn.classList.remove("flash"), 220);

  const next = body.classList.contains("theme-light") ? "theme-dark" : "theme-light";
  applyTheme(next);
});

const nav = document.querySelector(".top-bar");
window.addEventListener("scroll", () => {
  if (!nav) return;
  const blur = Math.min(window.scrollY / 12, 34);
  nav.style.backdropFilter = `blur(${blur}px)`;
});

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener("click", e => {
    const id = link.getAttribute("href");
    const target = id ? document.querySelector(id) : null;
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth" });
  });
});
document.querySelector(".scroll-indicator")?.addEventListener("click", () => {
  document.querySelector("#about")?.scrollIntoView({ behavior: "smooth" });
});

const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll(".nav-links a");
window.addEventListener("scroll", () => {
  let current = "";
  sections.forEach(section => {
    const top = section.offsetTop - 220;
    if (scrollY >= top) current = section.getAttribute("id");
  });
  navLinks.forEach(a => {
    a.classList.remove("active");
    if (a.getAttribute("href") === `#${current}`) a.classList.add("active");
  });
});


const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity = "1";
      e.target.style.transform = "translateY(0)";
    }
  });
}, { threshold: 0.14 });

document.querySelectorAll(".section").forEach(sec => {
  sec.style.opacity = "0";
  sec.style.transform = "translateY(38px)";
  sec.style.transition = "1s cubic-bezier(.22,1,.36,1)";
  observer.observe(sec);
});

const canvas = document.getElementById("mesh");
const ctx = canvas?.getContext("2d");

function resizeCanvas() {
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

function getWavePalette() {
  const isLight = body.classList.contains("theme-light");
  if (isLight) {
    return {
      points: ["rgba(0,136,255,0.34)", "rgba(127,216,255,0.22)", "rgba(0,120,220,0.18)", "rgba(0,0,0,0.06)"],
      particle: "rgba(0,136,255,OP)"
    };
  }
  return {
    points: ["rgba(0,136,255,0.60)", "rgba(40,170,255,0.32)", "rgba(127,216,255,0.20)", "rgba(255,255,255,0.10)"],
    particle: "rgba(160,210,255,OP)"
  };
}

let points = [];
function buildPoints() {
  const pal = getWavePalette();
  points = [
    { x: 0.20, y: 0.30, r: 780, c: pal.points[0], dx: 0.00018, dy: 0.00022 },
    { x: 0.80, y: 0.22, r: 820, c: pal.points[1], dx: -0.00022, dy: 0.00018 },
    { x: 0.30, y: 0.80, r: 760, c: pal.points[2], dx: 0.00025, dy: -0.00018 },
    { x: 0.72, y: 0.72, r: 740, c: pal.points[3], dx: -0.00018, dy: -0.00022 }
  ];
}
buildPoints();

const particles = [];
for (let i = 0; i < 90; i++) {
  particles.push({
    x: Math.random(),
    y: Math.random(),
    s: Math.random() * 1.1 + 0.2,
    dx: (Math.random() - 0.5) * 0.00010,
    dy: (Math.random() - 0.5) * 0.00010,
    o: Math.random() * 0.22 + 0.05
  });
}

const _applyThemeOriginal = applyTheme;
applyTheme = function(theme) {
  _applyThemeOriginal(theme);
  buildPoints();
};

function drawWave() {
  if (!ctx || !canvas) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.globalCompositeOperation = "lighter";
  for (const p of points) {
    p.x += p.dx;
    p.y += p.dy;

    if (p.x < 0 || p.x > 1) p.dx *= -1;
    if (p.y < 0 || p.y > 1) p.dy *= -1;

    const g = ctx.createRadialGradient(
      p.x * canvas.width, p.y * canvas.height, 0,
      p.x * canvas.width, p.y * canvas.height, p.r
    );
    g.addColorStop(0, p.c);
    g.addColorStop(1, "transparent");

    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  const pal = getWavePalette();
  ctx.globalCompositeOperation = "screen";
  for (const p of particles) {
    p.x += p.dx;
    p.y += p.dy;

    if (p.x < 0) p.x = 1;
    if (p.x > 1) p.x = 0;
    if (p.y < 0) p.y = 1;
    if (p.y > 1) p.y = 0;

    ctx.fillStyle = pal.particle.replace("OP", String(p.o));
    ctx.beginPath();
    ctx.arc(p.x * canvas.width, p.y * canvas.height, p.s, 0, Math.PI * 2);
    ctx.fill();
  }

  requestAnimationFrame(drawWave);
}
drawWave();

function setupMarquee(marqueeEl) {
  const track = marqueeEl.querySelector(".marquee-track");
  if (!track) return;

  const dir = marqueeEl.dataset.direction || "left";
  const speed = Number(marqueeEl.dataset.speed || 40);

  marqueeEl.addEventListener("mouseenter", () => { track.style.animationPlayState = "paused"; });
  marqueeEl.addEventListener("mouseleave", () => { track.style.animationPlayState = "running"; });

  const containerWidth = marqueeEl.clientWidth;
  const original = Array.from(track.children);

  track.innerHTML = "";
  original.forEach(n => track.appendChild(n));

  while (track.scrollWidth < containerWidth * 2) {
    original.forEach(n => track.appendChild(n.cloneNode(true)));
  }
  original.forEach(n => track.appendChild(n.cloneNode(true)));

  const shift = track.scrollWidth / 2;
  track.style.setProperty("--shift", `${shift}px`);
  track.style.setProperty("--dur", `${speed}s`);
  track.style.animationDirection = (dir === "right") ? "reverse" : "normal";
}

function initMarquees() {
  document.querySelectorAll(".marquee.pro").forEach(setupMarquee);
}

let resizeTimer = null;
window.addEventListener("load", initMarquees);
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(initMarquees, 180);
});

const stage = document.getElementById("reviewStage");
const cards = stage ? Array.from(stage.querySelectorAll("[data-review]")) : [];
const dotsWrap = document.getElementById("reviewDots");
const prevBtn = document.getElementById("prevReview");
const nextBtn = document.getElementById("nextReview");

let reviewIndex = 0;
let reviewTimer = null;
let reviewPaused = false;

function renderDots() {
  if (!dotsWrap) return;
  dotsWrap.innerHTML = "";
  cards.forEach((_, i) => {
    const d = document.createElement("span");
    d.className = "rc-dot" + (i === reviewIndex ? " active" : "");
    d.addEventListener("click", () => {
      reviewIndex = i;
      applySpotlight();
      restartAuto();
    });
    dotsWrap.appendChild(d);
  });
}

function applySpotlight() {
  if (!cards.length) return;

  const left = (reviewIndex - 1 + cards.length) % cards.length;
  const right = (reviewIndex + 1) % cards.length;

  cards.forEach((c, i) => {
    c.classList.remove("is-left", "is-center", "is-right", "is-far");
    if (i === reviewIndex) c.classList.add("is-center");
    else if (i === left) c.classList.add("is-left");
    else if (i === right) c.classList.add("is-right");
    else c.classList.add("is-far");
  });

  dotsWrap?.querySelectorAll(".rc-dot").forEach((d, i) => {
    d.classList.toggle("active", i === reviewIndex);
  });
}

function nextReview() {
  reviewIndex = (reviewIndex + 1) % cards.length;
  applySpotlight();
}
function prevReview() {
  reviewIndex = (reviewIndex - 1 + cards.length) % cards.length;
  applySpotlight();
}
function restartAuto() {
  if (reviewTimer) clearInterval(reviewTimer);
  reviewTimer = setInterval(() => {
    if (!reviewPaused) nextReview();
  }, 4200);
}

if (cards.length) {
  renderDots();
  applySpotlight();
  restartAuto();

  stage.addEventListener("mouseenter", () => (reviewPaused = true));
  stage.addEventListener("mouseleave", () => (reviewPaused = false));

  prevBtn?.addEventListener("click", () => { prevReview(); restartAuto(); });
  nextBtn?.addEventListener("click", () => { nextReview(); restartAuto(); });
}

let typingWords = ["Web Development", "UI/UX", "Minecraft Systems", "Discord Bots"];
let typingIndex = 0;
let charIndex = 0;
let deleting = false;
const typingEl = document.getElementById("typingText");

function setTypingWords(words) {
  if (!Array.isArray(words) || words.length === 0) return;
  typingWords = words;
  typingIndex = 0;
  charIndex = 0;
  deleting = false;
  if (typingEl) typingEl.textContent = "";
}
window.setTypingWords = setTypingWords;

function typingLoop() {
  if (!typingEl) return requestAnimationFrame(typingLoop);

  const current = typingWords[typingIndex % typingWords.length];
  const speedType = 36;
  const speedDelete = 22;
  const pauseEnd = 900;
  const pauseStart = 260;

  if (!deleting) {
    typingEl.textContent = current.slice(0, charIndex++);
    if (charIndex > current.length) {
      deleting = true;
      setTimeout(typingLoop, pauseEnd);
      return;
    }
    setTimeout(typingLoop, speedType);
  } else {
    typingEl.textContent = current.slice(0, charIndex--);
    if (charIndex < 0) {
      deleting = false;
      typingIndex++;
      setTimeout(typingLoop, pauseStart);
      return;
    }
    setTimeout(typingLoop, speedDelete);
  }
}
typingLoop();
