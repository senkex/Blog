const header = document.getElementById('header');
let lastScroll = window.scrollY;
const headerTopOnly = /portfolio\.html$/i.test(location.pathname);

window.addEventListener('scroll', () => {
  const current = window.scrollY;

  if (current <= 20) {
    header.classList.remove('is-hidden');
  } else if (current > lastScroll) {
    header.classList.add('is-hidden');
  } else if (!headerTopOnly) {
    header.classList.remove('is-hidden');
  }
  lastScroll = current;
}, { passive: true });

function renderClock() {
  const time = new Date().toLocaleTimeString([navigator.language, 'en-US'], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Argentina/Buenos_Aires',
  });
  document.querySelectorAll('.footer__time').forEach((el) => {
    el.textContent = '— ' + time;
  });
}
function scheduleClock() {
  const now = new Date();
  const ms = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
  setTimeout(() => {
    renderClock();
    scheduleClock();
  }, ms);
}
renderClock();
scheduleClock();

window.addEventListener('load', () => {
  const root = document.documentElement;
  root.style.scrollBehavior = 'unset';
  window.scroll({ top: 0 });
  root.style.scrollBehavior = 'smooth';
});

(() => {
  const values = [...document.querySelectorAll('.stat__value')];
  if (!values.length) return;

  const countUp = (el) => {
    const m = el.textContent.trim().match(/^(\d+)(.*)$/);
    if (!m) return;
    const target = parseInt(m[1], 10);
    const suffix = m[2] || '';
    const duration = 1200;
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const start = performance.now();
    el.textContent = '0' + suffix;
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(ease(p) * target) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const pending = new Set(values);
  const check = () => {
    pending.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.88 && r.bottom > 0) {
        countUp(el);
        pending.delete(el);
      }
    });
    if (!pending.size) {
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    }
  };
  window.addEventListener('scroll', check, { passive: true });
  window.addEventListener('resize', check, { passive: true });
  window.addEventListener('load', check);
})();

(() => {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const cursor = document.createElement('div');
  cursor.className = 'cursor';
  document.body.appendChild(cursor);

  const interactive =
    'a, button, input, textarea, select, label, [role="button"], .nav__link, .logo, ' +
    '.gallery__item, .web-card, .repo-card, .service, .chip, .lang, .audio-card, ' +
    '.audio-card__btn, .contact-card, .vid, .embed-item, .lightbox__close, ' +
    '.vp__btn, .vp__bar, .vp__opt, .vp__vol-range, .cscroll, .cscroll__thumb';

  let shown = false;
  const zoom = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;

  window.addEventListener('mousemove', (e) => {
    cursor.style.transform =
      'translate(' + e.clientX / zoom + 'px,' + e.clientY / zoom + 'px)';
    if (!shown) {
      shown = true;
      document.body.classList.add('cursor-on');
    }
    const hot = !!(e.target.closest && e.target.closest(interactive));
    cursor.classList.toggle('is-hover', hot);
  }, { passive: true });

  document.addEventListener('mouseleave', () => document.body.classList.remove('cursor-on'));
  document.addEventListener('mouseenter', () => {
    if (shown) document.body.classList.add('cursor-on');
  });
  window.addEventListener('mousedown', () => cursor.classList.add('is-press'));
  window.addEventListener('mouseup', () => cursor.classList.remove('is-press'));
})();
