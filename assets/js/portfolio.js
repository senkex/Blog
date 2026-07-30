const IMG_RE = /\.(png|jpe?g|gif|webp|avif)$/i;
const VID_RE = /\.(mp4|webm|ogg|mov|m4v)$/i;
const AUDIO_RE = /\.(mp3|wav|ogg|m4a|flac)$/i;
const MEDIA_RE = /\.(png|jpe?g|gif|webp|avif|mp4|webm|mov|m4v)$/i;

const lightbox = document.getElementById('lightbox');
const stage = document.getElementById('lightboxStage');
const lbClose = document.getElementById('lightboxClose');

const mediaRegistry = new Set();
function registerMedia(el) {
  mediaRegistry.add(el);
  el.addEventListener('play', () => {
    mediaRegistry.forEach((m) => {
      if (m !== el && !m.paused) m.pause();
    });
  });
}

function openLightbox(node) {
  stage.innerHTML = '';
  stage.appendChild(node);
  lightbox.classList.add('is-open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  stage.querySelectorAll('video, audio').forEach((m) => {
    m.pause();
    mediaRegistry.delete(m);
  });
  lightbox.classList.remove('is-open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  setTimeout(() => {
    stage.innerHTML = '';
  }, 350);
}

if (lbClose) lbClose.addEventListener('click', closeLightbox);
if (lightbox) {
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && lightbox && lightbox.classList.contains('is-open')) closeLightbox();
});

async function listDir(path, re) {
  try {
    const res = await fetch(path);
    if (!res.ok) return [];
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return [...doc.querySelectorAll('a')]
      .map((a) => a.getAttribute('href'))
      .filter((h) => h && re.test(h))
      .map((h) => decodeURIComponent(h.split('/').pop()));
  } catch {
    return [];
  }
}

async function listEntries(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) return { dirs: [], files: [] };
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const dirs = [];
    const files = [];
    [...doc.querySelectorAll('a')].forEach((a) => {
      let h = a.getAttribute('href');
      if (!h || h.startsWith('..') || h.startsWith('/') || h.startsWith('?') || h.startsWith('#')) return;
      h = h.replace(/^\.?\//, '');
      if (h.endsWith('/')) dirs.push(h.replace(/\/$/, ''));
      else files.push(h.split('/').pop());
    });
    return { dirs, files };
  } catch {
    return { dirs: [], files: [] };
  }
}

function t(key) {
  const dict = (typeof I18N !== 'undefined' && (I18N[getLang()] || I18N.en)) || {};
  return dict[key] || key;
}

function showEmpty(container) {
  container.innerHTML =
    '<p class="gallery__empty" data-i18n="pf_empty">' + t('pf_empty') + '</p>';
}

function revealItems(box, items) {
  box.innerHTML = '';
  items.forEach((el, i) => {
    el.classList.add('pf-item');
    el.style.animationDelay = Math.min(i, 10) * 0.06 + 's';
    box.appendChild(el);
  });
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const IC_PLAY = '<svg class="ico ico-play" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
const IC_PAUSE = '<svg class="ico ico-pause" viewBox="0 0 24 24"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>';
const IC_VOL = '<svg class="ico ico-vol" viewBox="0 0 24 24"><path d="M4 9v6h4l5 5V4L8 9H4z"/><path d="M16 8.5a4 4 0 0 1 0 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
const IC_MUTE = '<svg class="ico ico-mute" viewBox="0 0 24 24"><path d="M4 9v6h4l5 5V4L8 9H4z"/><path d="M16 9l5 5m0-5l-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
const IC_FS = '<svg viewBox="0 0 24 24"><path d="M7 7h3V5H5v5h2V7zm10 0v3h2V5h-5v2h3zM7 17v-3H5v5h5v-2H7zm10 0h-3v2h5v-5h-2v3z"/></svg>';

function fmtTime(t) {
  t = Math.floor(t || 0);
  return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0');
}

function makePlayer(src, autoplay) {
  const wrap = document.createElement('div');
  wrap.className = 'vidplayer paused';

  const video = document.createElement('video');
  video.src = src;
  video.playsInline = true;
  video.preload = 'metadata';
  video.oncontextmenu = () => false;
  if (autoplay) video.autoplay = true;

  const mark = document.createElement('img');
  mark.className = 'vidmark';
  mark.src = 'assets/img/logo.png';
  mark.alt = '';
  mark.draggable = false;

  const c = document.createElement('div');
  c.className = 'vp';
  c.innerHTML =
    '<div class="vp__bar"><div class="vp__fill"></div><div class="vp__head"></div></div>' +
    '<div class="vp__row">' +
      '<button class="vp__btn vp__play" aria-label="Play">' + IC_PLAY + IC_PAUSE + '</button>' +
      '<span class="vp__time"><span class="vp__cur">0:00</span> / <span class="vp__dur">0:00</span></span>' +
      '<span class="vp__spacer"></span>' +
      '<div class="vp__vol"><button class="vp__btn vp__mute" aria-label="Mute">' + IC_VOL + IC_MUTE + '</button>' +
        '<input class="vp__vol-range" type="range" min="0" max="1" step="0.05" value="1" aria-label="Volume" /></div>' +
      '<div class="vp__speed"><button class="vp__btn vp__speed-btn">x1</button><div class="vp__menu"></div></div>' +
      '<button class="vp__btn vp__fs" aria-label="Fullscreen">' + IC_FS + '</button>' +
    '</div>';

  wrap.appendChild(video);
  wrap.appendChild(mark);
  wrap.appendChild(c);

  const bar = c.querySelector('.vp__bar');
  const fill = c.querySelector('.vp__fill');
  const head = c.querySelector('.vp__head');
  const playBtn = c.querySelector('.vp__play');
  const cur = c.querySelector('.vp__cur');
  const dur = c.querySelector('.vp__dur');
  const muteBtn = c.querySelector('.vp__mute');
  const volRange = c.querySelector('.vp__vol-range');
  const speedBtn = c.querySelector('.vp__speed-btn');
  const speedBox = c.querySelector('.vp__speed');
  const menu = c.querySelector('.vp__menu');
  const fsBtn = c.querySelector('.vp__fs');

  SPEEDS.forEach((s) => {
    const opt = document.createElement('button');
    opt.className = 'vp__opt' + (s === 1 ? ' is-active' : '');
    opt.textContent = 'x' + s;
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      video.playbackRate = s;
      speedBtn.textContent = 'x' + s;
      menu.querySelectorAll('.vp__opt').forEach((o) => o.classList.toggle('is-active', o === opt));
      menu.classList.remove('is-open');
    });
    menu.appendChild(opt);
  });

  const setProgress = () => {
    const p = video.duration ? (video.currentTime / video.duration) * 100 : 0;
    fill.style.width = p + '%';
    head.style.left = p + '%';
  };
  const toggle = () => (video.paused ? video.play() : video.pause());

  playBtn.addEventListener('click', toggle);
  video.addEventListener('click', () => {
    menu.classList.remove('is-open');
    toggle();
  });
  video.addEventListener('play', () => wrap.classList.replace('paused', 'playing'));
  video.addEventListener('pause', () => wrap.classList.replace('playing', 'paused'));
  video.addEventListener('loadedmetadata', () => (dur.textContent = fmtTime(video.duration)));
  video.addEventListener('timeupdate', () => {
    setProgress();
    cur.textContent = fmtTime(video.currentTime);
  });

  const seek = (clientX) => {
    const r = bar.getBoundingClientRect();
    const ratio = Math.min(Math.max((clientX - r.left) / r.width, 0), 1);
    if (video.duration) {
      video.currentTime = ratio * video.duration;
      setProgress();
    }
  };
  bar.addEventListener('mousedown', (e) => {
    e.preventDefault();
    seek(e.clientX);
    const move = (ev) => seek(ev.clientX);
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  });

  muteBtn.addEventListener('click', () => {
    video.muted = !video.muted;
    wrap.classList.toggle('muted', video.muted);
    volRange.value = video.muted ? 0 : video.volume;
  });
  volRange.addEventListener('input', () => {
    video.volume = parseFloat(volRange.value);
    video.muted = video.volume === 0;
    wrap.classList.toggle('muted', video.muted);
  });

  speedBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('is-open');
  });

  fsBtn.addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (wrap.requestFullscreen) wrap.requestFullscreen();
  });

  registerMedia(video);
  return wrap;
}

function makeVideoItem(src, extraClass) {
  const fig = document.createElement('figure');
  fig.className = 'gallery__item';
  if (extraClass) fig.classList.add(extraClass);
  const wrap = document.createElement('div');
  wrap.className = 'vid';
  const v = document.createElement('video');
  v.src = src;
  v.muted = true;
  v.preload = 'metadata';
  v.playsInline = true;
  const play = document.createElement('div');
  play.className = 'vid__play';
  play.innerHTML = '<span><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>';
  wrap.appendChild(v);
  wrap.appendChild(play);
  fig.appendChild(wrap);
  fig.addEventListener('click', () => openLightbox(makePlayer(src, true)));
  return fig;
}

function makeImageItem(src, alt, extraClass) {
  const fig = document.createElement('figure');
  fig.className = 'gallery__item';
  if (extraClass) fig.classList.add(extraClass);
  const img = document.createElement('img');
  img.loading = 'lazy';
  img.src = src;
  img.alt = alt || '';
  img.draggable = false;
  fig.appendChild(img);
  const scrollable = !!extraClass && extraClass.indexOf('branding') !== -1;
  fig.addEventListener('click', () => {
    if (scrollable) {
      openAlbum([src]);
      return;
    }
    const big = document.createElement('img');
    big.src = src;
    big.alt = img.alt;
    big.draggable = false;
    openLightbox(big);
  });
  return fig;
}

function makeMediaItem(src, extraClass) {
  const name = src.split('/').pop().replace(MEDIA_RE, '');
  return VID_RE.test(src) ? makeVideoItem(src, extraClass) : makeImageItem(src, name, extraClass);
}

async function loadSoundfx() {
  const box = document.getElementById('soundfx');
  if (!box) return;
  const { files } = await listEntries('portfolio/soundfx/');
  const audios = files.filter((f) => AUDIO_RE.test(f));
  if (!audios.length) {
    showEmpty(box);
    return;
  }
  revealItems(box, audios.map((f) => makeAudioCard('portfolio/soundfx/' + f, f)));
}

function makeScrollable(inner) {
  const wrap = document.createElement('div');
  wrap.className = 'album-wrap';
  const track = document.createElement('div');
  track.className = 'cscroll';
  const thumb = document.createElement('div');
  thumb.className = 'cscroll__thumb';
  track.appendChild(thumb);
  wrap.appendChild(inner);
  wrap.appendChild(track);

  const update = () => {
    const ch = inner.clientHeight;
    const sh = inner.scrollHeight;
    if (sh <= ch + 1) {
      track.style.display = 'none';
      return;
    }
    track.style.display = 'block';
    const th = Math.max((ch / sh) * ch, 34);
    const maxTop = ch - th;
    const p = inner.scrollTop / (sh - ch);
    thumb.style.height = th + 'px';
    thumb.style.transform = 'translateY(' + p * maxTop + 'px)';
  };

  inner.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  inner.querySelectorAll('img, video').forEach((m) => {
    m.addEventListener('load', update);
    m.addEventListener('loadedmetadata', update);
  });
  requestAnimationFrame(update);
  setTimeout(update, 250);
  setTimeout(update, 800);

  thumb.addEventListener('mousedown', (e) => {
    e.preventDefault();
    const trackRect = track.getBoundingClientRect();
    const thumbRect = thumb.getBoundingClientRect();
    const grab = e.clientY - thumbRect.top;
    const move = (ev) => {
      const maxTop = trackRect.height - thumbRect.height;
      let top = ev.clientY - trackRect.top - grab;
      top = Math.min(Math.max(top, 0), maxTop);
      const p = maxTop > 0 ? top / maxTop : 0;
      inner.scrollTop = p * (inner.scrollHeight - inner.clientHeight);
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  });

  return wrap;
}

function openAlbum(items) {
  const album = document.createElement('div');
  album.className = 'album';
  items.forEach((src) => {
    if (VID_RE.test(src)) {
      album.appendChild(makePlayer(src, false));
    } else {
      const img = document.createElement('img');
      img.loading = 'lazy';
      img.src = src;
      img.draggable = false;
      album.appendChild(img);
    }
  });
  openLightbox(makeScrollable(album));
}

async function buildMediaCards(base, cardClass) {
  const { dirs, files } = await listEntries(base);
  const singles = files.filter((f) => MEDIA_RE.test(f));
  const albums = [];
  for (const d of dirs) {
    const sub = await listEntries(base + d + '/');
    const media = sub.files
      .filter((f) => MEDIA_RE.test(f))
      .map((f) => base + d + '/' + f);
    if (media.length) albums.push({ name: d, items: media });
  }
  const cards = [];
  albums.forEach((al) => {
    const card = document.createElement('figure');
    card.className = 'gallery__item design-item' + (cardClass ? ' ' + cardClass : '');
    const cover = al.items[0];
    let coverEl;
    if (VID_RE.test(cover)) {
      coverEl = document.createElement('video');
      coverEl.src = cover;
      coverEl.muted = true;
      coverEl.preload = 'metadata';
      coverEl.playsInline = true;
    } else {
      coverEl = document.createElement('img');
      coverEl.loading = 'lazy';
      coverEl.src = cover;
      coverEl.alt = al.name;
    }
    coverEl.draggable = false;
    const badge = document.createElement('span');
    badge.className = 'design-badge';
    badge.textContent = '▤ ' + al.items.length;
    card.appendChild(coverEl);
    card.appendChild(badge);
    card.addEventListener('click', () => openAlbum(al.items));
    cards.push(card);
  });
  singles.forEach((f) => cards.push(makeMediaItem(base + f, cardClass)));
  return cards;
}

async function loadMediaGallery(boxId, base, cardClass) {
  const box = document.getElementById(boxId);
  if (!box) return;
  const cards = await buildMediaCards(base, cardClass);
  if (!cards.length) {
    showEmpty(box);
    return;
  }
  revealItems(box, cards);
}

function fetchJson(url) {
  return fetch(url)
    .then((r) => (r.ok ? r.json() : []))
    .then((d) => (Array.isArray(d) ? d : []))
    .catch(() => []);
}

function ytId(url) {
  const m = String(url).match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([\w-]{11})/
  );
  return m ? m[1] : '';
}

function makeEmbedItem(entry) {
  const url = typeof entry === 'string' ? entry : (entry && entry.url) || '';
  if (!url) return null;
  const thumb = typeof entry === 'object' && entry ? entry.thumb : '';
  const isYT = /youtu\.be|youtube\.com/i.test(url);
  const isTT = /tiktok\.com/i.test(url);
  if (!isYT && !isTT) return null;

  const fig = document.createElement('figure');
  fig.className = 'gallery__item embed-item';
  const img = document.createElement('img');
  img.loading = 'lazy';
  img.draggable = false;
  const play = document.createElement('div');
  play.className = 'vid__play';
  play.innerHTML = '<span><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>';
  const badge = document.createElement('span');
  badge.className = 'embed-badge';

  if (isYT) {
    const id = ytId(url);
    img.src = thumb || (id ? 'https://img.youtube.com/vi/' + id + '/hqdefault.jpg' : '');
    img.alt = 'YouTube';
    badge.textContent = 'YouTube';
    fig.addEventListener('click', () => {
      const iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube.com/embed/' + id + '?autoplay=1&rel=0';
      iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      iframe.allowFullscreen = true;
      openLightbox(iframe);
    });
  } else {
    img.alt = 'TikTok';
    badge.textContent = 'TikTok';
    if (thumb) {
      img.src = thumb;
    } else {
      fig.classList.add('embed-item--noimg');
      fetch('https://www.tiktok.com/oembed?url=' + encodeURIComponent(url))
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d && d.thumbnail_url) {
            img.src = d.thumbnail_url;
            fig.classList.remove('embed-item--noimg');
          }
        })
        .catch(() => {});
    }
    fig.addEventListener('click', () => window.open(url, '_blank', 'noopener'));
  }

  fig.appendChild(img);
  fig.appendChild(play);
  fig.appendChild(badge);
  return fig;
}

async function loadEmbedGallery(boxId, base, jsonUrl) {
  const box = document.getElementById(boxId);
  if (!box) return;
  const [local, entries] = await Promise.all([buildMediaCards(base, null), fetchJson(jsonUrl)]);
  const embeds = entries.map(makeEmbedItem).filter(Boolean);
  const all = [...embeds, ...local];
  if (!all.length) {
    showEmpty(box);
    return;
  }
  revealItems(box, all);
}

const loadImages = () => loadMediaGallery('gallery-images', 'portfolio/images/');
const loadVideos = () => loadEmbedGallery('gallery-videos', 'portfolio/videos/', 'portfolio/previews.json');
const loadEditions = () => loadEmbedGallery('editions', 'portfolio/editions/', 'portfolio/editions.json');
const loadDiscord = () => loadMediaGallery('discord', 'portfolio/discord/');
const loadDesign = () => loadMediaGallery('design', 'portfolio/design/');
const loadRenders = () => loadMediaGallery('renders', 'portfolio/renders/');
const loadBuilding = () => loadMediaGallery('building', 'portfolio/building/');
const loadLogos = () => loadMediaGallery('logos', 'portfolio/logos/');
const loadSetups = () => loadEmbedGallery('setups', 'portfolio/setups/', 'portfolio/setups.json');
const loadBranding = () => loadMediaGallery('branding', 'portfolio/branding/', 'branding-item');

let sharedAC;
function getAudioContext() {
  if (sharedAC === undefined) {
    const AC = window.AudioContext || window.webkitAudioContext;
    sharedAC = AC ? new AC() : null;
  }
  return sharedAC;
}

async function buildWaveform(url, barCount) {
  const ac = getAudioContext();
  if (!ac) return null;
  try {
    const arr = await fetch(url).then((r) => r.arrayBuffer());
    const audioBuf = await ac.decodeAudioData(arr);
    const data = audioBuf.getChannelData(0);
    const block = Math.floor(data.length / barCount) || 1;
    const peaks = [];
    for (let i = 0; i < barCount; i++) {
      let sum = 0;
      for (let j = 0; j < block; j++) {
        const v = data[i * block + j] || 0;
        sum += v * v;
      }
      peaks.push(Math.sqrt(sum / block));
    }
    const max = Math.max(...peaks) || 1;
    return peaks.map((p) => Math.pow(p / max, 0.85));
  } catch {
    return null;
  }
}

function makeAudioCard(src, filename) {
  const name = filename.replace(/\.[^.]+$/, '');
  const BARS = 56;
  const card = document.createElement('div');
  card.className = 'audio-card';
  card.innerHTML =
    '<div class="audio-card__head">' +
      '<button class="audio-card__btn" aria-label="Play">' +
        '<svg class="ico-play" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>' +
        '<svg class="ico-pause" viewBox="0 0 24 24"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>' +
      '</button>' +
      '<div class="audio-card__name"></div>' +
    '</div>' +
    '<div class="audio-card__wave">' +
      '<div class="wave-layer wave-base"></div>' +
      '<div class="wave-layer wave-played"></div>' +
    '</div>' +
    '<div class="audio-card__time"><span class="cur">0:00</span> / <span class="dur">0:00</span></div>';
  card.querySelector('.audio-card__name').textContent = name;

  const audio = new Audio(src);
  audio.preload = 'metadata';
  card._audio = audio;

  const btn = card.querySelector('.audio-card__btn');
  const wave = card.querySelector('.audio-card__wave');
  const base = card.querySelector('.wave-base');
  const played = card.querySelector('.wave-played');
  const cur = card.querySelector('.cur');
  const dur = card.querySelector('.dur');
  const fmt = (t) => {
    t = Math.floor(t || 0);
    return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0');
  };

  let peaks = Array.from({ length: BARS }, () => 0.2 + Math.random() * 0.8);
  function makeBar(h) {
    const b = document.createElement('span');
    b.className = 'wbar';
    b.style.height = h;
    return b;
  }
  function renderBars() {
    base.innerHTML = '';
    played.innerHTML = '';
    peaks.forEach((p) => {
      const h = 12 + p * 88 + '%';
      base.appendChild(makeBar(h));
      played.appendChild(makeBar(h));
    });
    updateProgress();
  }
  function updateProgress() {
    const ratio = audio.duration ? Math.min(audio.currentTime / audio.duration, 1) : 0;
    played.style.clipPath = 'inset(0 ' + (100 - ratio * 100) + '% 0 0)';
  }
  renderBars();
  buildWaveform(src, BARS).then((real) => {
    if (real) {
      peaks = real;
      renderBars();
    }
  });

  audio.addEventListener('loadedmetadata', () => {
    dur.textContent = fmt(audio.duration);
  });
  audio.addEventListener('timeupdate', () => {
    updateProgress();
    cur.textContent = fmt(Math.min(audio.currentTime, audio.duration || audio.currentTime));
  });
  audio.addEventListener('ended', () => card.classList.remove('is-playing'));
  audio.addEventListener('pause', () => card.classList.remove('is-playing'));
  audio.addEventListener('play', () => card.classList.add('is-playing'));
  registerMedia(audio);

  btn.addEventListener('click', () => {
    if (audio.paused) {
      document.querySelectorAll('.audio-card.is-playing').forEach((c) => {
        if (c !== card && c._audio) {
          c._audio.pause();
          c.classList.remove('is-playing');
        }
      });
      audio.play();
      card.classList.add('is-playing');
    } else {
      audio.pause();
      card.classList.remove('is-playing');
    }
  });
  wave.addEventListener('click', (e) => {
    const rect = wave.getBoundingClientRect();
    if (audio.duration) audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
  });

  return card;
}

async function loadProducer() {
  const box = document.getElementById('producer');
  if (!box) return;
  const { files } = await listEntries('portfolio/producer/');
  const audios = files.filter((f) => AUDIO_RE.test(f));
  const videos = files.filter((f) => VID_RE.test(f) && !AUDIO_RE.test(f));
  if (!audios.length && !videos.length) {
    showEmpty(box);
    return;
  }
  const cards = [
    ...audios.map((f) => makeAudioCard('portfolio/producer/' + f, f)),
    ...videos.map((f) => makeVideoItem('portfolio/producer/' + f)),
  ];
  revealItems(box, cards);
}

async function loadData() {
  try {
    const res = await fetch('portfolio/data.json');
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}

let dataPromise;
function getData() {
  if (!dataPromise) dataPromise = loadData();
  return dataPromise;
}

function loadWebsites(sites) {
  const box = document.getElementById('websites');
  if (!box) return;
  if (!sites || !sites.length) {
    showEmpty(box);
    return;
  }
  const cards = [];
  const mount = [];
  sites.forEach((site) => {
    const card = document.createElement('article');
    card.className = 'web-card';
    const tags = (site.tags || []).map((t) => '<span class="web-card__tag">' + t + '</span>').join('');
    card.innerHTML =
      '<div class="web-card__preview">' +
        '<span class="web-card__badge">Live preview</span>' +
        '<iframe class="web-card__frame" src="' + site.url + '" loading="lazy" scrolling="no" tabindex="-1"></iframe>' +
      '</div>' +
      '<div class="web-card__body">' +
        '<h3 class="web-card__title">' + (site.title || '') + '</h3>' +
        '<p class="web-card__desc">' + (site.description || '') + '</p>' +
        '<div class="web-card__tags">' + tags + '</div>' +
        '<a class="web-card__link" href="' + site.url + '" target="_blank" rel="noopener">Visit site ↗</a>' +
      '</div>';
    const preview = card.querySelector('.web-card__preview');
    const frame = card.querySelector('.web-card__frame');
    const fit = (entries) => {
      const w = entries ? entries[0].contentRect.width : preview.clientWidth;
      if (!w) return;
      const scale = w / 1280;
      frame.style.transform = 'scale(' + scale + ')';
      preview.style.height = 800 * scale + 'px';
    };
    preview.addEventListener('click', () => {
      const big = document.createElement('iframe');
      big.src = site.url;
      big.loading = 'lazy';
      openLightbox(big);
    });
    cards.push(card);
    mount.push(() => new ResizeObserver(fit).observe(preview));
  });
  revealItems(box, cards);
  mount.forEach((run) => run());
}

async function loadRepos(handle, exclude) {
  const box = document.getElementById('repos');
  if (!box) return;
  if (!handle) {
    showEmpty(box);
    return;
  }
  const skip = (exclude || []).map((n) => n.toLowerCase());
  let repos = [];
  const endpoints = [
    'https://api.github.com/orgs/' + handle + '/repos?per_page=100&sort=updated',
    'https://api.github.com/users/' + handle + '/repos?per_page=100&sort=updated',
  ];
  for (const url of endpoints) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        repos = await res.json();
        break;
      }
    } catch {}
  }
  repos = repos.filter((r) => !skip.includes(r.name.toLowerCase()));
  if (!repos.length) {
    showEmpty(box);
    return;
  }
  repos.sort(
    (a, b) =>
      b.stargazers_count - a.stargazers_count ||
      new Date(b.updated_at) - new Date(a.updated_at)
  );
  const cards = repos.map((r) => {
    const card = document.createElement('a');
    card.className = 'repo-card';
    card.href = r.html_url;
    card.target = '_blank';
    card.rel = 'noopener';
    const lang = r.language ? '<span><i class="repo-dot"></i>' + r.language + '</span>' : '';
    card.innerHTML =
      '<div class="repo-card__top">' +
        '<svg class="repo-card__ico" viewBox="0 0 16 16" width="18" height="18" fill="currentColor"><path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"/></svg>' +
        '<span class="repo-card__name">' + r.name + '</span>' +
      '</div>' +
      '<p class="repo-card__desc">' + (r.description || 'Sin descripción.') + '</p>' +
      '<div class="repo-card__meta">' +
        '<span>★ ' + r.stargazers_count + '</span>' +
        '<span>⎇ ' + r.forks_count + '</span>' +
        lang +
      '</div>';
    return card;
  });
  revealItems(box, cards);
}

function initPortfolio() {
  loadImages();
  loadSetups();
  loadVideos();
  loadDiscord();
  loadEditions();
  loadLogos();
  loadDesign();
  loadBuilding();
  loadRenders();
  loadBranding();

  const loadHeavy = () => {
    loadSoundfx();
    loadProducer();
    getData().then((data) => {
      loadWebsites(data.websites);
      loadRepos(data.github, data.githubExclude);
    });
  };
  if ('requestIdleCallback' in window) {
    requestIdleCallback(loadHeavy, { timeout: 1500 });
  } else {
    setTimeout(loadHeavy, 500);
  }
}

if (document.readyState === 'complete') {
  requestAnimationFrame(initPortfolio);
} else {
  window.addEventListener('load', () => requestAnimationFrame(initPortfolio));
}

document.addEventListener('contextmenu', (e) => {
  if (e.target.closest('img, video, audio, .gallery, .album, .lightbox, .producer, .vidplayer')) {
    e.preventDefault();
  }
});
document.addEventListener('dragstart', (e) => {
  if (e.target.matches('img, video, a')) e.preventDefault();
});
