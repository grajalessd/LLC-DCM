/* LLC DCM · Cargo & Transport */
(() => {
  'use strict';

  // ---- Settings the owner may change ----
  const PHONE = '13464249245';
  const GOOGLE_REVIEW_URL = ''; // paste the Google review link here when the profile exists

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  const capture = root.classList.contains('capture');
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const wa = (text) => `https://wa.me/${PHONE}?text=${encodeURIComponent(text)}`;
  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  const BASE = "Hi! I found your website and I'd like a quote.";
  const quoteTo = (city) => `${BASE}\nPickup address: \nDrop-off city: ${city}\nDrop-off address: \nItems (I'll send a photo): \nDate: `;
  const MSG = {
    general: `${BASE}\nPickup address: \nDrop-off address: \nItems (I'll send a photo): \nDate: `,
    personal: "Hi! I found your website and I'd like a quote for a pickup from my home.\nPickup address: \nDrop-off address: \nItems (I'll send a photo): \nDate: ",
    business: "Hi! I found your website and I'd like a quote for a business load.\nCompany: \nPickup address: \nDrop-off address: \nItems (I'll send a photo): \nDate: ",
    city: "Hi! I found your website. Can you deliver to my town?\nTown: \nWhat I'm sending (I'll send a photo): ",
    review: "Hi! I'd like to share how my delivery with LLC DCM went: ",
  };
  $$('[data-wa]').forEach((a) => {
    if (MSG[a.dataset.wa]) a.href = wa(MSG[a.dataset.wa]);
    a.target = '_blank';
    a.rel = 'noopener';
  });

  // ---- Intro (home, first visit in this tab session) ----
  let introMs = 0;
  if (root.classList.contains('intro')) {
    try { sessionStorage.setItem('dcm-intro', '1'); } catch (e) {}
    const stage = $('.intro-stage'), van = $('.intro-van'), mark = $('.intro-mark');
    const START = 150, DRIVE = 1900, HOLD = 1500, LEAVE = 950;
    introMs = START + DRIVE + HOLD;
    // lock the page while the intro plays and always start at the very top
    try { history.scrollRestoration = 'manual'; } catch (e) {}
    scrollTo(0, 0);
    const KEYS = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Spacebar'];
    const block = (e) => { if (e.type !== 'keydown' || KEYS.includes(e.key)) e.preventDefault(); };
    const holdTop = () => { if (scrollY) scrollTo(0, 0); };
    addEventListener('wheel', block, { passive: false });
    addEventListener('touchmove', block, { passive: false });
    addEventListener('keydown', block);
    addEventListener('scroll', holdTop);
    setTimeout(() => {
      removeEventListener('wheel', block); removeEventListener('touchmove', block);
      removeEventListener('keydown', block); removeEventListener('scroll', holdTop);
      scrollTo(0, 0);
    }, introMs + LEAVE);
    const vr = van.getBoundingClientRect(), vw = vr.width, vh = vr.height;
    const sr = stage.getBoundingClientRect(), sL = sr.left, sB = sr.bottom;
    const ROAD = 16, FLOOR = 4 + vh * 28 / 116; // road top / cargo floor (px from stage bottom)
    // each letter rides in its own box: it slides out of the back door, bounces on the road,
    // and the box comes apart to leave the letter in its place (first out, first opened)
    const tilt = [-11, 9, -7, 10, -9, 12];
    const drops = $$('.drop', mark).map((el, i) => {
      const r = el.getBoundingClientRect();
      const w = r.width + 6, h = Math.min(r.height + 8, vh * 0.62);
      const box = document.createElement('div');
      box.className = 'pkg';
      box.style.cssText = `width:${w}px;height:${h}px`;
      box.innerHTML = '<i class="pk-l"></i><i class="pk-r"></i><i class="pk-fl"></i><i class="pk-fr"></i>';
      stage.appendChild(box);
      el.style.setProperty('--dy', (sB - r.top - r.height / 2) - (ROAD + h / 2) + 'px');
      return { el, box, w, h, cx: r.left - sL + r.width / 2, tilt: tilt[i % tilt.length], t: null };
    });
    // enters and leaves fast, eases off while it drops the boxes
    const x0 = -sL - vw - 10, x1 = innerWidth - sL + 10;
    const ease = (p) => p + 0.5 * Math.sin(2 * Math.PI * p) / (2 * Math.PI);
    const T1 = 440, B1 = 210, B2 = 130, SETTLE = T1 + B1 + B2;
    const squash = (dt, amp) => (dt > 0 && dt < 110 ? amp * Math.sin(Math.PI * dt / 110) : 0);
    const place = (d, now) => {
      const k = now - d.t;
      let x, b, rot = 0;
      if (k < T1) {
        const u = k / T1;
        x = d.sx + (d.cx - d.sx) * (1 - (1 - u) * (1 - u));
        b = d.b0 + (ROAD - d.b0) * u * u + 22 * u * (1 - u);
        rot = d.tilt * Math.sin(Math.PI * u);
      } else {
        x = d.cx;
        const u1 = (k - T1) / B1, u2 = (k - T1 - B1) / B2;
        b = ROAD + (u1 < 1 ? 12 * 4 * u1 * (1 - u1) : u2 < 1 ? 4 * 4 * u2 * (1 - u2) : 0);
      }
      const s = squash(k - T1, 0.16) + squash(k - T1 - B1, 0.08) + squash(k - SETTLE, 0.04);
      d.box.style.transform = `translate(${x - d.w / 2}px,${-b}px) rotate(${rot}deg) scale(${1 + s * 0.6},${1 - s})`;
      if (k >= SETTLE && !d.open) {
        d.open = true;
        d.box.classList.add('open');
        d.el.classList.add('show');
        setTimeout(() => d.box.remove(), 800);
      }
    };
    let t0 = null;
    const frame = (now) => {
      if (t0 === null) t0 = now;
      const p = Math.min(Math.max((now - t0 - START) / DRIVE, 0), 1);
      const x = x0 + (x1 - x0) * ease(p);
      const rear = x + vw * 10 / 260;
      van.style.transform = `translateX(${x}px)`;
      drops.forEach((d) => {
        if (d.t === null && (rear > d.cx + d.w * 0.55 || p === 1)) {
          d.t = now; d.sx = rear + d.w * 0.45; d.b0 = FLOOR; d.box.classList.add('go');
        }
        if (d.t !== null && !d.open) place(d, now);
      });
      if (p < 1 || drops.some((d) => !d.open)) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    setTimeout(() => root.classList.add('intro-leave', 'hero-in'), introMs);
    setTimeout(() => root.classList.remove('intro', 'intro-leave'), introMs + LEAVE);
  }

  // ---- Header / menu ----
  const head = $('.site-head');
  const onScroll = () => head.classList.toggle('scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const menuBtn = $('.menu-btn');
  const menu = $('#menu');
  if (menu && menuBtn) {
    menu.removeAttribute('hidden');
    menu.inert = true;
    const setMenu = (open) => {
      menu.classList.toggle('open', open);
      menu.inert = !open;
      menuBtn.setAttribute('aria-expanded', open);
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.classList.toggle('menu-open', open);
    };
    menuBtn.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
    $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
    addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  }

  const navLinks = $$('.nav a');
  if (navLinks.length) {
    const map = new Map(navLinks.map((a) => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver((ents) => {
      ents.forEach((en) => {
        if (en.isIntersecting) {
          navLinks.forEach((a) => a.classList.remove('on'));
          map.get(en.target.id)?.classList.add('on');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    map.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }

  // ---- Reveals ----
  const revealIO = new IntersectionObserver((ents) => {
    ents.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); revealIO.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  $$('.reveal, .sign, .limits, .close').forEach((el) => revealIO.observe(el));
  $$('.ledger li, .price-rows li').forEach((el) => {
    el.style.transitionDelay = `${[...el.parentNode.children].indexOf(el) * 0.07}s`;
  });
  const lanes = $('.lanes');
  if (lanes) new IntersectionObserver(([en]) => lanes.classList.toggle('live', en.isIntersecting)).observe(lanes);

  const fab = $('.wa-float');
  setTimeout(() => fab && fab.classList.add('show'), introMs + 600);

  // =====================================================================
  //  MAP ENGINE (hero route map + "where should we take it" reach map)
  // =====================================================================
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs = {}, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  const proj = (lon, lat) => [(lon + 99) * 100, (31.2 - lat) * 116];
  const HOU = proj(-95.37, 29.76);

  // Towns come from the signs in the page (one source of truth)
  const TOWNS = $$('.band li').map((li) => {
    const [lon, lat] = li.dataset.ll.split(',').map(Number);
    return { name: li.textContent.trim(), mi: +li.dataset.mi, band: +li.closest('.band').dataset.band, pt: proj(lon, lat), key: li.dataset.key || null, li };
  });

  // Main routes (roads roughly follow the real highways)
  const P = (lon, lat) => proj(lon, lat);
  const ROUTES = {
    austin:     { name: 'Austin', mi: 165, via: [P(-95.7, 29.97), P(-96.08, 30.1), P(-96.4, 30.17), P(-96.94, 30.18), P(-97.4, 30.23)], end: P(-97.74, 30.27), lab: [0, -15], anchor: 'middle' },
    sanantonio: { name: 'San Antonio', mi: 197, via: [P(-96.16, 29.78), P(-96.54, 29.7), P(-96.9, 29.68), P(-97.5, 29.62), P(-97.96, 29.57)], end: P(-98.49, 29.42), lab: [0, 25], anchor: 'middle' },
    portarthur: { name: 'Port Arthur', mi: 90, via: [P(-94.98, 29.74), P(-94.38, 29.82)], end: P(-93.94, 29.89), lab: [10, 25], anchor: 'start' },
    lafayette:  { name: 'Lafayette, LA', mi: 217, via: [P(-94.98, 29.74), P(-94.38, 29.82), P(-94.1, 30.08), P(-93.22, 30.23), P(-92.66, 30.22)], end: P(-92.02, 30.22), lab: [0, -15], anchor: 'middle' },
  };

  const smooth = (p) => {
    let d = `M${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`;
    for (let i = 0; i < p.length - 1; i++) {
      const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return d;
  };

  // drive-time rings (approximate, straight-line radius in map units)
  const RINGS = [[110, '1 HR'], [225, '2 HR'], [335, '3 HR']];
  const COAST = '-300 400 120 360 220 325 260 296 310 280 370 262 405 236 425 219 450 203 500 183 515 174 550 168 600 166 640 186 680 191 720 197 770 209 900 214 1100 205';

  function createMap(svg, opts) {
    const stage = svg.parentNode;
    const uid = svg.id;
    const defs = el('defs', {}, svg);
    const pat = el('pattern', { id: `${uid}-hatch`, width: 14, height: 14, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(-18)' }, defs);
    el('path', { d: 'M0 7h14', stroke: '#16365f', 'stroke-width': 1 }, pat);
    const glow = el('radialGradient', { id: `${uid}-glow` }, defs);
    el('stop', { offset: 0, 'stop-color': '#B22234', 'stop-opacity': '.38' }, glow);
    el('stop', { offset: 1, 'stop-color': '#B22234', 'stop-opacity': '0' }, glow);

    el('rect', { x: -1200, y: -1000, width: 3200, height: 2600, fill: '#0B2545' }, svg);
    const gulf = `M-800 1400V420L${COAST} 1600 210V1400z`;
    el('path', { d: gulf, class: 'gulf' }, svg);
    el('path', { d: gulf, fill: `url(#${uid}-hatch)`, opacity: '.9' }, svg);
    el('path', { d: 'M400 215 395 191 405 171 425 176 435 197 425 213z M515 157 522 147 529 154 524 166z', class: 'gulf' }, svg);
    el('path', { d: `M${COAST}`, class: 'coast' }, svg);
    el('path', { d: 'M515 166 530 128 538 80 545 23 548 -46 560 -400', class: 'border' }, svg);
    el('text', { x: 250, y: 30, class: 'state' }, svg).textContent = 'TEXAS';
    el('text', { x: 600, y: 30, class: 'state' }, svg).textContent = 'LOUISIANA';

    // reach area + rings
    el('circle', { cx: HOU[0], cy: HOU[1], r: 335, class: 'reach-fill' }, svg);
    RINGS.forEach(([r, label], i) => {
      el('circle', { cx: HOU[0], cy: HOU[1], r, class: `ring ring-${i + 1}` }, svg);
      const id = `${uid}-ring${i}`;
      el('path', { id, d: `M${HOU[0] - r} ${HOU[1]} a${r} ${r} 0 0 1 ${2 * r} 0`, fill: 'none' }, defs);
      const t = el('text', { class: 'ring-label' }, svg);
      const tp = el('textPath', { href: `#${id}`, startOffset: '50%', 'text-anchor': 'middle' }, t);
      tp.textContent = label;
    });

    const gRoutes = el('g', {}, svg);
    const baseLayer = el('g', {}, gRoutes);
    const inkLayer = el('g', {}, gRoutes);
    const gTowns = el('g', {}, svg);
    const gTop = el('g', {}, svg);

    // routes
    const R = {};
    for (const k in ROUTES) {
      const c = ROUTES[k];
      const d = smooth([HOU, ...c.via, c.end]);
      R[k] = { ...c, base: el('path', { d, class: 'road' }, baseLayer), ink: el('path', { d, class: 'road-ink' }, inkLayer) };
      R[k].len = R[k].base.getTotalLength();
      R[k].ink.style.strokeDasharray = R[k].len;
      R[k].ink.style.strokeDashoffset = R[k].len;
      R[k].pts = [HOU, ...c.via, c.end];
    }
    const loopR = 20;
    R.houston = { name: 'Houston metro', loop: true, pts: [[HOU[0] - 60, HOU[1] - 40], [HOU[0] + 60, HOU[1] + 40]] };
    const ld = `M${HOU[0] + loopR} ${HOU[1]} a${loopR} ${loopR} 0 1 1 ${-2 * loopR} 0 a${loopR} ${loopR} 0 1 1 ${2 * loopR} 0`;
    R.houston.base = el('path', { d: ld, class: 'road road-loop' }, baseLayer);
    R.houston.ink = el('path', { d: ld, class: 'road-ink' }, inkLayer);
    R.houston.len = R.houston.base.getTotalLength();
    R.houston.ink.style.strokeDasharray = R.houston.len;
    R.houston.ink.style.strokeDashoffset = R.houston.len;

    // highway tags
    [['I-10', P(-96.7, 29.62)], ['US 290', P(-96.7, 30.32)], ['I-10', P(-93.6, 30.36)], ['I-45', P(-95.3, 30.5)]].forEach(([t, [x, y]]) => {
      const g = el('g', { transform: `translate(${x} ${y})`, class: 'road-tag' }, gRoutes);
      const s = el('g', { class: 'sc' }, g);
      const w = t.length * 7 + 12;
      el('rect', { x: -w / 2, y: -9, width: w, height: 17, rx: 3 }, s);
      el('text', { x: 0, y: 4, 'text-anchor': 'middle' }, s).textContent = t;
    });

    // towns as stars
    const nodes = new Map();
    TOWNS.forEach((t) => {
      const main = !!t.key;
      const g = el('g', { class: `town${main ? ' main' : ''}`, transform: `translate(${t.pt[0].toFixed(1)} ${t.pt[1].toFixed(1)})` }, gTowns);
      const s = el('g', { class: 'sc' }, g);
      el('circle', { r: 12, class: 'town-hit' }, s);
      const sz = main ? 15 : 9;
      el('use', { href: '#star', x: -sz / 2, y: -sz / 2, width: sz, height: sz, class: 'town-star' }, s);
      const lab = main ? (ROUTES[t.key].lab) : [0, -11];
      const anchor = main ? ROUTES[t.key].anchor : 'middle';
      const tl = el('text', { x: lab[0], y: lab[1], 'text-anchor': anchor, class: 'town-label' }, s);
      tl.textContent = t.name;
      const tm = el('text', { x: lab[0], y: lab[1] + (lab[1] < 0 ? -14 : 13), 'text-anchor': anchor, class: 'town-mi' }, s);
      tm.textContent = `${t.mi} mi`;
      g.addEventListener('click', () => opts.onTown && opts.onTown(t));
      nodes.set(t.name, g);
    });

    // Houston hub
    const hub = el('g', { class: 'hub', transform: `translate(${HOU[0].toFixed(1)} ${HOU[1].toFixed(1)})` }, gTop);
    const hs = el('g', { class: 'sc' }, hub);
    el('circle', { r: 26, class: 'hub-pulse', fill: `url(#${uid}-glow)` }, hs);
    el('circle', { r: 11, class: 'hub-disc' }, hs);
    el('use', { href: '#star', x: -8, y: -8, width: 16, height: 16, class: 'hub-star' }, hs);
    el('text', { x: 0, y: 26, 'text-anchor': 'middle', class: 'town-label hub-label' }, hs).textContent = 'Houston';
    if (opts.onHub) hub.addEventListener('click', opts.onHub);

    // dashed "as the crow flies" line for towns without a drawn route
    const crow = el('path', { class: 'crow', d: '' }, gRoutes);

    // van
    const van = el('g', { class: 'map-van gone' }, gTop);
    const vs = el('g', { class: 'sc' }, van);
    el('use', { href: '#van-tc', x: -25, y: -20, width: 50, height: 22.3 }, vs);

    // camera
    let vb = [0, 0, 760, 270];
    let camAnim = 0;
    const aspect = () => stage.clientWidth / Math.max(1, stage.clientHeight);
    const fit = (pts, padPx) => {
      const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
      const bx = Math.min(...xs), by = Math.min(...ys);
      const bw = Math.max(...xs) - bx, bh = Math.max(...ys) - by;
      const a = aspect(), cw = Math.max(1, stage.clientWidth);
      let w = Math.max(bw, 1);
      for (let i = 0; i < 5; i++) { const p = padPx * w / cw; w = Math.max(bw + 2 * p, (bh + 2 * p) * a); }
      const h = w / a;
      return [bx + bw / 2 - w / 2, by + bh / 2 - h / 2, w, h];
    };
    const apply = () => {
      svg.setAttribute('viewBox', vb.map((n) => n.toFixed(2)).join(' '));
      svg.style.setProperty('--k', (vb[2] / Math.max(1, stage.clientWidth)).toFixed(4));
    };
    const camTo = (target, ms = 1300) => {
      cancelAnimationFrame(camAnim);
      if (reduce || capture) { vb = target; apply(); return; }
      const from = vb.slice(), t0 = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - t0) / ms), e = ease(t);
        vb = from.map((v, i) => v + (target[i] - v) * e);
        apply();
        if (t < 1) camAnim = requestAnimationFrame(step);
      };
      camAnim = requestAnimationFrame(step);
    };

    // driving
    let driveAnim = 0;
    const placeVan = (c, p) => {
      const L = c.len * p;
      const a = c.base.getPointAtLength(Math.max(0, L));
      const b = c.base.getPointAtLength(Math.min(c.len, L + 2));
      let ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI, flip = false;
      if (ang > 90 || ang < -90) { flip = true; ang = ang > 0 ? ang - 180 : ang + 180; }
      ang = Math.max(-28, Math.min(28, ang));
      van.setAttribute('transform', `translate(${a.x.toFixed(1)} ${a.y.toFixed(1)}) rotate(${ang.toFixed(1)})${flip ? ' scale(-1 1)' : ''}`);
      c.ink.style.strokeDashoffset = (c.len * (1 - p)).toFixed(1);
    };
    const ping = (pt) => {
      const g = el('g', { transform: `translate(${pt[0]} ${pt[1]})` }, gTop);
      el('circle', { r: 10, class: 'drop-ping' }, el('g', { class: 'sc' }, g));
      setTimeout(() => g.remove(), 1300);
    };
    const clearInk = () => { for (const j in R) R[j].ink.style.strokeDashoffset = R[j].len; };
    const setActive = (name) => nodes.forEach((n, k) => n.classList.toggle('on', k === name));
    const drive = (k) => new Promise((res) => {
      cancelAnimationFrame(driveAnim);
      clearInk();
      crow.setAttribute('d', '');
      const c = R[k];
      setActive(c.loop ? null : c.name);
      van.classList.remove('gone');
      if (reduce || capture) { placeVan(c, 1); res(); return; }
      const ms = c.loop ? 2600 : 1500 + c.len * 4.2, t0 = performance.now() + 250;
      const step = (now) => {
        const t = Math.max(0, Math.min(1, (now - t0) / ms));
        placeVan(c, ease(t));
        if (t < 1) driveAnim = requestAnimationFrame(step);
        else { if (!c.loop) ping(c.end); res(); }
      };
      placeVan(c, 0);
      driveAnim = requestAnimationFrame(step);
    });
    const showTown = (t) => {
      cancelAnimationFrame(driveAnim);
      clearInk();
      if (t.key) { drive(t.key); camTo(fit(R[t.key].pts, stage.clientWidth < 700 ? 60 : 110)); return; }
      van.classList.add('gone');
      setActive(t.name);
      crow.setAttribute('d', `M${HOU[0]} ${HOU[1]} L${t.pt[0]} ${t.pt[1]}`);
      const len = crow.getTotalLength();
      crow.style.strokeDasharray = `${len}`;
      crow.style.strokeDashoffset = reduce || capture ? 0 : len;
      requestAnimationFrame(() => requestAnimationFrame(() => { crow.style.strokeDashoffset = 0; }));
      const d = Math.hypot(t.pt[0] - HOU[0], t.pt[1] - HOU[1]);
      const r = Math.max(d, 70);
      camTo(fit([[HOU[0] - r * 0.35, HOU[1] - r * 0.35], [HOU[0] + r * 0.35, HOU[1] + r * 0.35], t.pt], stage.clientWidth < 700 ? 70 : 120));
    };
    const overview = (pts) => { setActive(null); crow.setAttribute('d', ''); camTo(fit(pts, stage.clientWidth < 700 ? 56 : 90)); };

    return { R, fit, camTo, apply, drive, showTown, overview, van, setVB: (v) => { vb = v; apply(); }, stage, setActive };
  }

  const mainPts = [HOU, ...Object.values(ROUTES).map((r) => r.end)];
  const allPts = [HOU, ...TOWNS.map((t) => t.pt)];

  // ---------------- HERO MAP ----------------
  const heroSvg = $('#map');
  if (heroSvg) {
    let userPicked = false, current = null, touring = false, tourTimer = 0, heroVisible = true;
    const m = createMap(heroSvg, {
      onTown: (t) => { if (t.key) choose(t.key); else location.hash = '#area'; },
      onHub: () => choose('houston'),
    });
    const framing = (k) => (k ? m.fit(m.R[k].pts, m.stage.clientWidth < 700 ? 60 : 110) : m.fit(mainPts, m.stage.clientWidth < 700 ? 56 : 90));
    m.setVB(framing(null));
    let rz;
    addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => m.setVB(framing(current)), 120); });

    const rrTo = $('.rr-to'), rrMi = $('.rr-mi'), cta = $('#hero-cta');
    const readout = (k) => {
      if (!k) { rrTo.textContent = 'Pick a city'; rrMi.textContent = ''; return; }
      rrTo.textContent = k === 'houston' ? 'Around town' : m.R[k].name;
      rrMi.textContent = k === 'houston' ? 'same day' : `about ${m.R[k].mi} mi`;
    };
    const setCTA = (k) => {
      let msg = MSG.general;
      if (k === 'houston') msg = `${BASE}\nPickup address: \nDrop-off address (Houston area): \nItems (I'll send a photo): \nDate: `;
      else if (k) msg = quoteTo(m.R[k].name);
      cta.href = wa(msg);
      cta.querySelector('span').textContent = k ? `Get a quote to ${k === 'houston' ? 'anywhere in Houston' : m.R[k].name.replace(', LA', '')}` : 'Get a quote on WhatsApp';
    };
    setCTA(null);
    const plates = $$('.plate[data-dest]');
    async function choose(k) {
      userPicked = true; touring = false; clearTimeout(tourTimer);
      current = k;
      plates.forEach((p) => p.setAttribute('aria-pressed', p.dataset.dest === k));
      setCTA(k); readout(k);
      m.camTo(framing(k));
      await m.drive(k);
    }
    plates.forEach((p) => p.addEventListener('click', () => choose(p.dataset.dest)));

    const order = ['portarthur', 'austin', 'lafayette', 'sanantonio', 'houston'];
    let ti = 0;
    const tour = async () => {
      if (userPicked || !heroVisible || document.hidden) { touring = false; return; }
      touring = true;
      const k = order[ti++ % order.length];
      readout(k);
      m.camTo(framing(k), 1400);
      await m.drive(k);
      if (!touring || userPicked) return;
      tourTimer = setTimeout(() => {
        if (userPicked) return;
        m.van.classList.add('gone');
        tourTimer = setTimeout(tour, 650);
      }, 1500);
    };
    new IntersectionObserver(([en]) => {
      heroVisible = en.isIntersecting;
      if (heroVisible && !touring && !userPicked && !reduce && !capture) { clearTimeout(tourTimer); tourTimer = setTimeout(tour, 400); }
    }, { threshold: 0.15 }).observe(m.stage);
    if (!reduce && !capture) setTimeout(() => { if (!userPicked) { touring = false; clearTimeout(tourTimer); tour(); } }, introMs + 700);
  }

  // ---------------- REACH MAP + TOWN CHECKER ----------------
  const reachSvg = $('#reach-map');
  if (reachSvg) {
    const input = $('#city-q');
    const list = $('#city-list');
    const verdict = $('#city-verdict');
    const clear = $('.city-check .checker-clear');
    const idle = verdict.innerHTML;
    TOWNS.forEach((t) => { const o = document.createElement('option'); o.value = t.name; list.appendChild(o); });
    const bandName = ['', 'under 1 hour', '1 to 2 hours', '2 to 3 hours'];

    const rm = createMap(reachSvg, { onTown: (t) => pick(t, true), onHub: () => { input.value = 'Houston'; check(); } });
    const over = () => rm.fit(allPts, rm.stage.clientWidth < 700 ? 40 : 70);
    rm.setVB(over());
    let sel = null, rz2;
    addEventListener('resize', () => { clearTimeout(rz2); rz2 = setTimeout(() => { if (!sel) rm.setVB(over()); }, 120); });

    const norm = (s) => s.toLowerCase().replace(/,?\s*(la|tx|louisiana|texas)\.?$/, '').replace(/[^a-z]/g, '');
    const HOUSTON_AREA = ['houston', 'spring', 'cypress', 'kingwood', 'bellaire', 'missouricity', 'friendswood', 'stafford', 'richmond', 'rosenberg', 'atascocita', 'channelview', 'deerpark', 'laporte', 'seabrook', 'webster', 'clearlake', 'jerseyvillage', 'aldine', 'alvin', 'fulshear'];

    function pick(t, fromMap) {
      sel = t;
      input.value = t.name;
      clear.hidden = false;
      TOWNS.forEach((x) => x.li.classList.toggle('on', x === t));
      verdict.dataset.kind = 'yes';
      verdict.innerHTML = `<p class="cv-line"><span class="vd-mark"><svg aria-hidden="true"><use href="#i-check"/></svg></span><span><b>Yes, we go to ${esc(t.name)}.</b> About ${t.mi} miles from Houston, ${bandName[t.band]} on the road.</span></p><a class="btn btn-red" target="_blank" rel="noopener" href="${wa(quoteTo(t.name))}"><svg aria-hidden="true"><use href="#i-wa"/></svg><span>Get a quote to ${esc(t.name.replace(', LA', ''))}</span></a>`;
      rm.showTown(t);
      if (!fromMap && matchMedia('(max-width: 959px)').matches) {
        $('.reach').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      }
    }
    function check() {
      const raw = input.value.trim();
      clear.hidden = !raw;
      if (raw.length < 2) {
        sel = null; verdict.dataset.kind = 'idle'; verdict.innerHTML = idle;
        TOWNS.forEach((x) => x.li.classList.remove('on')); rm.overview(allPts); rm.van.classList.add('gone'); return;
      }
      const n = norm(raw);
      const hit = TOWNS.find((t) => norm(t.name) === n) || (n.length >= 4 && TOWNS.find((t) => norm(t.name).startsWith(n)));
      if (hit) { pick(hit, true); return; }
      sel = null;
      TOWNS.forEach((x) => x.li.classList.remove('on'));
      if (HOUSTON_AREA.some((h) => n.startsWith(h) || (h.startsWith(n) && n.length >= 4))) {
        verdict.dataset.kind = 'yes';
        verdict.innerHTML = `<p class="cv-line"><span class="vd-mark"><svg aria-hidden="true"><use href="#i-check"/></svg></span><span><b>That's home turf.</b> We cover all of Houston and its surrounding areas.</span></p><a class="btn btn-red" target="_blank" rel="noopener" href="${wa(quoteTo(raw))}"><svg aria-hidden="true"><use href="#i-wa"/></svg><span>Get a quote on WhatsApp</span></a>`;
        rm.drive('houston'); rm.camTo(rm.fit(rm.R.houston.pts, 60));
        return;
      }
      verdict.dataset.kind = 'ask';
      verdict.innerHTML = `<p class="cv-line"><span><b>${esc(raw)} isn't on our signs yet.</b> If it's within about 3 hours of Houston, we can probably get there. Ask us and we'll check.</span></p><a class="btn btn-outline-light" target="_blank" rel="noopener" href="${wa(`Hi! I found your website. Can you deliver to ${raw}?\nWhat I'm sending (I'll send a photo): \nDate: `)}"><svg aria-hidden="true"><use href="#i-wa"/></svg><span>Ask about ${esc(raw.length > 18 ? 'my town' : raw)}</span></a>`;
      rm.van.classList.add('gone'); rm.overview(allPts);
    }
    let t;
    input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(check, 220); });
    input.addEventListener('change', check);
    clear.addEventListener('click', () => { input.value = ''; check(); input.focus(); });
    TOWNS.forEach((tw) => {
      tw.li.tabIndex = 0;
      tw.li.setAttribute('role', 'button');
      tw.li.setAttribute('aria-label', `${tw.name}, about ${tw.mi} miles`);
      tw.li.dataset.miles = tw.mi;
      tw.li.addEventListener('click', () => pick(tw, false));
      tw.li.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(tw, false); } });
    });
    if (capture) { const w = TOWNS.find((x) => x.name === 'Waco'); if (w) pick(w, true); }
  }

  // ---- How it works: van drives down the road as you scroll ----
  const road = $('.steps-road');
  const steps = $$('.step');
  let onRoad = null; // receipt hooks in here (desktop)
  const LINE = 0.55; // share of the screen height where the van sits
  if (road && steps.length) {
    const vanEl = $('.road-van', road), fill = $('.road-fill', road);
    let ticking = false;
    // the road runs exactly from circle 1 to the last circle
    const layout = () => {
      road.style.bottom = 'auto';
      road.style.height = (steps[steps.length - 1].getBoundingClientRect().top - steps[0].getBoundingClientRect().top) + 'px';
    };
    const update = () => {
      ticking = false;
      const r = road.getBoundingClientRect();
      const target = innerHeight * LINE;
      const p = Math.max(0, Math.min(1, (target - r.top) / Math.max(1, r.height)));
      if (onRoad) onRoad(p, target < r.top);
      const y = p * r.height;
      vanEl.style.transform = `translate3d(0, ${(y - 22).toFixed(1)}px, 0)`;
      fill.style.transform = `scaleY(${p.toFixed(4)})`;
      steps.forEach((s) => {
        const c = s.getBoundingClientRect().top + 42 - r.top;
        s.classList.toggle('passed', y >= c - 4);
      });
    };
    const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    addEventListener('scroll', req, { passive: true });
    addEventListener('resize', () => { layout(); req(); });
    layout();
    update();
    road.relayout = () => { layout(); update(); };
  }

  // ---- Receipt fills in as the steps go by ----
  const receipt = $('#receipt');
  if (receipt) {
    const wide = matchMedia('(min-width: 960px)');
    const slot = $('.receipt-slot'), now = $('.rc-now');
    const parts = $$('[data-on]', receipt);
    // 1-3 = steps 1-3; 4-7 = step 4 told piece by piece; 8 = stamp
    const LABELS = ['', 'Message us on WhatsApp.', 'Get your quote.', 'We remind you the day before.',
      'We photograph your items.', 'You sign the pickup receipt.', 'You pay with Zelle or Apple Pay.',
      'We deliver, with photos at drop-off.', 'Delivered the same day.'];
    let cur = -1, curSt = -1;
    const setState = (n, step) => {
      const st = step === undefined ? Math.min(4, n) : step;
      if (n === cur && st === curSt) return;
      cur = n; curSt = st; receipt.dataset.state = n;
      parts.forEach((el) => el.classList.toggle('lit', n >= +el.dataset.on));
      receipt.classList.toggle('stamped', n >= 8);
      steps.forEach((s) => s.classList.toggle('on', +s.dataset.step === st));
      if (!n || wide.matches) return;
      now.classList.add('swap');
      setTimeout(() => { now.firstChild.textContent = st + '/4'; now.lastChild.textContent = LABELS[n]; now.classList.remove('swap'); }, 200);
    };
    // shrink the sheet (CSS zoom keeps layout honest) so it is never cut off by the screen
    const fit = () => {
      receipt.style.zoom = 1;
      const headH = parseFloat(getComputedStyle(root).getPropertyValue('--head-h')) || 64;
      const room = innerHeight - headH - (wide.matches ? 48 : 20 + (now.offsetHeight || 0) + 10);
      receipt.style.zoom = Math.max(0.55, Math.min(1, room / receipt.offsetHeight)).toFixed(3);
    };
    const clamp01 = (v) => Math.max(0, Math.min(1, v));
    if (reduce || capture) setState(8);
    else {
      slot.classList.add('pinned');
      let tick = false;
      const track = () => {
        tick = false;
        if (wide.matches) return; // desktop is driven by the red line (onRoad)
        // phone: progress through the pinned track drives all 8 stages
        const r = slot.getBoundingClientRect(), pin = slot.firstElementChild.offsetHeight;
        const p = clamp01((innerHeight * 0.15 - r.top) / Math.max(1, r.height - pin));
        // stays blank until the sheet is well on screen, so the first ink is seen
        setState(r.top > innerHeight * 0.45 ? 0 : Math.min(8, 1 + Math.floor(p * 8.5)));
      };
      addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(track); } }, { passive: true });
      addEventListener('resize', track);
      track();
      // desktop: circles 1-3 light steps 1-3; between circles 3 and 4 the sheet finishes
      // (photos → signature → payment → drop-off) and the stamp lands exactly on circle 4
      onRoad = (p, before) => {
        if (!wide.matches) return;
        if (before) { setState(0, 0); return; }
        const seg = p * 3;
        if (p >= 0.999) { setState(8, 4); return; }
        setState(seg < 2 ? 1 + Math.floor(seg) : 3 + Math.floor((seg - 2) * 5), 1 + Math.floor(seg));
      };
    }
    // desktop: size step 4 so the column ends right when circle 4 reaches the line,
    // i.e. the sticky receipt stops moving the moment it is stamped (no long blank run after)
    const sizeLast = () => {
      const last = steps[steps.length - 1];
      last.style.minHeight = '';
      if (!wide.matches) return;
      const headH = parseFloat(getComputedStyle(root).getPropertyValue('--head-h')) || 64;
      const circle = parseFloat(getComputedStyle(last, '::before').top) + 22;
      const stop = headH + 24 + slot.getBoundingClientRect().height; // receipt bottom while pinned
      last.style.minHeight = Math.max(0, circle + stop - innerHeight * LINE) + 'px';
    };
    const relayout = () => { fit(); sizeLast(); if (road && road.relayout) road.relayout(); };
    relayout();
    addEventListener('resize', relayout);
    wide.addEventListener('change', relayout);
  }

  // ---- Will it ride? item checker ----
  const q = $('#item-q');
  if (q) {
    const verdict = $('#verdict');
    const clear = $('.checker .checker-clear');
    const rows = $$('.manifest li').map((li) => ({ li, yes: !!li.closest('.mf-yes'), keys: li.dataset.k.split(/\s+/), label: li.childNodes[0].textContent.trim() }));
    const icon = (id) => `<span class="vd-mark"><svg aria-hidden="true"><use href="#${id}"/></svg></span>`;
    const idle = verdict.innerHTML;
    let t;
    const check = () => {
      const raw = q.value.trim();
      clear.hidden = !raw;
      rows.forEach((r) => r.li.classList.remove('hit'));
      if (raw.length < 2) { verdict.dataset.kind = 'idle'; verdict.innerHTML = idle; return; }
      const toks = raw.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter((w) => w.length >= 2);
      const score = (r) => {
        let s = 0;
        toks.forEach((w) => r.keys.forEach((k) => {
          if (k === w || k === w.replace(/s$/, '') || w === k.replace(/s$/, '')) s += 3;
          else if (w.length >= 3 && k.startsWith(w)) s += 1;
        }));
        return s;
      };
      const ranked = rows.map((r) => [r, score(r)]).filter(([, s]) => s > 0).sort((a, b) => b[1] - a[1] || (a[0].yes ? 1 : -1));
      if (!ranked.length) {
        verdict.dataset.kind = 'unknown';
        verdict.innerHTML = `<span>It's not on our list. <a href="${wa(`Hi! Can you haul this? ${raw}. I'll send you a photo.`)}" target="_blank" rel="noopener">Send us a photo on WhatsApp</a> and we'll tell you.</span>`;
        return;
      }
      const [r] = ranked[0];
      r.li.classList.add('hit');
      if (r.yes) {
        verdict.dataset.kind = 'yes';
        const med = r.keys.includes('medication') ? " Bring the pharmacy paperwork or your doctor's authorization." : '';
        verdict.innerHTML = `${icon('i-check')}<span>Yes, that rides with us. It falls under <b>${esc(r.label)}</b>.${med} <a href="${wa(`${BASE}\nItem: ${raw}\nPickup address: \nDrop-off address: \nDate: `)}" target="_blank" rel="noopener">Get a quote for it</a></span>`;
      } else {
        verdict.dataset.kind = 'no';
        verdict.innerHTML = `${icon('i-x')}<span>Sorry, we can't take that. It falls under <b>${esc(r.label)}</b>.</span>`;
      }
    };
    q.addEventListener('input', () => { clearTimeout(t); t = setTimeout(check, 180); });
    clear.addEventListener('click', () => { q.value = ''; check(); q.focus(); });
  }

  // ---- FAQ: smooth open/close ----
  $$('.acc details').forEach((d) => {
    const sum = d.querySelector('summary'), body = d.querySelector('.acc-body');
    let anim;
    sum.addEventListener('click', (e) => {
      if (reduce) return;
      e.preventDefault();
      anim?.cancel();
      if (d.open) {
        anim = body.animate([{ height: body.offsetHeight + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 450, easing: 'cubic-bezier(.16,1,.3,1)' });
        anim.onfinish = () => { d.open = false; };
      } else {
        d.open = true;
        anim = body.animate([{ height: '0px', opacity: 0 }, { height: body.offsetHeight + 'px', opacity: 1 }], { duration: 600, easing: 'cubic-bezier(.16,1,.3,1)' });
      }
    });
  });

  // ---- Waving flag (closing) ----
  const flag = $('canvas.flag');
  if (flag) {
    const ctx = flag.getContext('2d');
    const src = document.createElement('canvas');
    const W = 760, H = 400;
    src.width = W; src.height = H;
    const s = src.getContext('2d');
    const sh = H / 13;
    for (let i = 0; i < 13; i++) { s.fillStyle = i % 2 ? '#ffffff' : '#B22234'; s.fillRect(0, i * sh, W, sh + 0.5); }
    const cw = W * 0.4, ch = sh * 7;
    s.fillStyle = '#123a73'; s.fillRect(0, 0, cw, ch);
    const star = (cx, cy, r) => {
      s.beginPath();
      for (let k = 0; k < 10; k++) {
        const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.382 : r;
        s.lineTo(cx + rr * Math.cos(a), cy + rr * Math.sin(a));
      }
      s.closePath(); s.fill();
    };
    s.fillStyle = '#fff';
    for (let row = 0; row < 9; row++) {
      const n = row % 2 ? 5 : 6;
      for (let j = 0; j < n; j++) {
        const x = row % 2 ? (j * 2 + 2) * cw / 12 : (j * 2 + 1) * cw / 12;
        star(x, (row + 1) * ch / 10, H * 0.0308);
      }
    }
    let raf = 0, visible = false;
    const t0 = performance.now();
    const size = () => {
      const dpr = Math.min(2, devicePixelRatio || 1);
      flag.width = Math.round(flag.clientWidth * dpr);
      flag.height = Math.round(flag.clientHeight * dpr);
    };
    const draw = (now) => {
      const w = flag.width, h = flag.height;
      ctx.clearRect(0, 0, w, h);
      const t = reduce || capture ? 1.2 : (now - t0) / 1000;
      const fw = w * 0.94, fh = fw * (H / W);
      const top = (h - fh) / 2, amp = fh * 0.05;
      const cols = 90, colW = fw / cols;
      for (let i = 0; i < cols; i++) {
        const x = i * colW, u = x / fw;
        const phase = u * 7.5 - t * 2.4;
        const dy = Math.sin(phase) * amp * (0.15 + u * 0.85);
        const shade = Math.cos(phase) * (0.15 + u * 0.85);
        ctx.drawImage(src, (i / cols) * W, 0, W / cols + 0.6, H, x, top + dy, colW + 0.8, fh);
        ctx.fillStyle = shade > 0 ? `rgba(255,255,255,${(shade * 0.13).toFixed(3)})` : `rgba(4,14,30,${(-shade * 0.28).toFixed(3)})`;
        ctx.fillRect(x, top + dy, colW + 0.8, fh);
      }
      if (visible && !reduce && !capture) raf = requestAnimationFrame(draw);
    };
    size();
    addEventListener('resize', () => { size(); draw(performance.now()); });
    new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(draw);
    }).observe(flag);
    draw(performance.now());
  }

  // ---- Reviews button ----
  const rb = $('#review-btn');
  if (rb) {
    if (GOOGLE_REVIEW_URL) rb.href = GOOGLE_REVIEW_URL;
    else { rb.href = wa(MSG.review); rb.querySelector('span').textContent = 'Tell us how it went on WhatsApp'; }
    rb.target = '_blank'; rb.rel = 'noopener';
  }

  $$('.yr').forEach((y) => (y.textContent = new Date().getFullYear()));
})();
