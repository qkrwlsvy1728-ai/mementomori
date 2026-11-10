// 키오스크 동작 : 작품 고르기 → 탑승권 출력 → 탑승권 누르면 크게 열기
const kiosk   = document.getElementById('kiosk');
const screen  = document.getElementById('screen');
const msg     = document.getElementById('screen-msg');
const overlay = document.getElementById('overlay');
const PRINT_TIME = 2400; // 탑승권이 다 나오는 시간(ms). style.css 의 --print-time 과 맞추세요

let busy = false;

// 1) 작품 버튼을 누르면 출력 시작
document.querySelectorAll('.tile').forEach(tile => {
  tile.addEventListener('click', () => {
    if (busy) return;
    busy = true;
    const id = tile.dataset.flight;

    document.querySelectorAll('.mini').forEach(m => m.classList.remove('printing', 'done', 'taken'));
    screen.classList.add('is-printing');
    msg.textContent = '탑승권을 출력하고 있습니다';
    kiosk.classList.add('shake');

    const mini = document.querySelector(`.mini[data-flight="${id}"]`);
    setTimeout(() => mini.classList.add('printing'), 500);
    setTimeout(() => {
      kiosk.classList.remove('shake');
      mini.classList.add('done');
      msg.textContent = '탑승권을 가져가세요 ↓';
      screen.classList.add('is-done');
      busy = false;
    }, 500 + PRINT_TIME);
  });
});

// 2) 나온 탑승권을 누르면 크게 열기
document.querySelectorAll('.mini').forEach(mini => {
  mini.addEventListener('click', () => {
    if (!mini.classList.contains('done')) return;
    mini.classList.add('taken');
    openPass(mini.dataset.flight);
  });
});

function openPass(id) {
  document.querySelectorAll('.pass').forEach(p => p.classList.remove('show'));
  document.getElementById('pass-' + id).classList.add('show');
  overlay.classList.add('open');
}

// 3) 닫기 (✕, 바깥 클릭, Esc)
function closePass() {
  overlay.classList.remove('open');
  document.querySelectorAll('.pass video').forEach(v => v.pause());
}
document.querySelectorAll('.pass-close').forEach(b => b.addEventListener('click', closePass));
overlay.addEventListener('click', e => { if (e.target === overlay) closePass(); });
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (document.documentElement.classList.contains('show-landing')) return leaveLanding();   // 첫 화면이면 체크인하러 가기
  if (overlay.classList.contains('open')) closePass();       // 탑승권이 열려 있으면 탑승권부터 닫기
  else if (caseEl.classList.contains('open')) closeCase();   // 그다음 가방 닫기
  else if (docsEl.classList.contains('open')) closeDocs();   // 기획서 화면 닫기
});

// 4) 처음 화면으로
document.getElementById('screen-back').addEventListener('click', () => {
  screen.classList.remove('is-printing', 'is-done');
  document.querySelectorAll('.mini').forEach(m => m.classList.remove('printing', 'done', 'taken'));
});

// 5) 벨트 위 사진을 누르면 해당 작품 탑승권 열기
document.querySelectorAll('.belt-photo').forEach(photo => {
  photo.addEventListener('click', () => openPass(photo.dataset.flight));
});

// 6) 여권(소개) 열기 : data-open="about" 이 붙은 것을 누르면 열림
document.querySelectorAll('[data-open="about"]').forEach(el => {
  el.addEventListener('click', () => openPass('about'));
});

// 7) 가방 열기 : 전체 작품 바둑판
const caseEl = document.getElementById('case');
const caseGrid = document.getElementById('case-grid');
let caseFrom = null;   // 어느 것(태그/가방)을 눌러서 열었는지

// 키오스크 작품 버튼과 탑승권에서 내용을 읽어 카드를 만듦
document.querySelectorAll('.tile').forEach(tile => {
  const id = tile.dataset.flight;
  const pass = document.getElementById('pass-' + id);
  const video = pass.querySelector('video');
  const card = document.createElement('button');
  card.className = 'case-card';
  card.style.setProperty('--c', tile.style.getPropertyValue('--c'));
  card.innerHTML = `
    <div class="cc-media">
      <img src="${video.getAttribute('poster')}" alt="">
      <video muted loop playsinline preload="none"></video>
      <span class="cc-play">▶</span>
    </div>
    <div class="cc-body">
      <p class="cc-meta">${tile.querySelector('.tile-meta').innerHTML}</p>
      <h3>${tile.querySelector('.tile-title').textContent}</h3>
      <p class="cc-desc">${pass.querySelector('.pass-desc').textContent}</p>
    </div>`;
  const preview = card.querySelector('video');
  const src = video.querySelector('source').getAttribute('src');

  // 마우스를 올리면 소리 없이 미리보기 (처음 올릴 때 영상을 불러옴)
  card.addEventListener('mouseenter', () => {
    if (!preview.src) preview.src = src;
    preview.play().then(() => card.classList.add('playing')).catch(() => {});
  });
  card.addEventListener('mouseleave', () => {
    preview.pause();
    card.classList.remove('playing');
  });
  // 누르면 탑승권 열기 (닫으면 바둑판으로 돌아옴)
  card.addEventListener('click', () => {
    preview.pause();
    card.classList.remove('playing');
    openPass(id);
  });
  caseGrid.appendChild(card);
});
document.getElementById('case-count').textContent = `작품 ${caseGrid.children.length}편`;

// 패널을 누른 물건 자리(rect)에서 화면 전체로 펼침 / 다시 접음
function expandFrom(panel, r) {
  panel.style.setProperty('--from',
    `inset(${r.top}px ${innerWidth - r.right}px ${innerHeight - r.bottom}px ${r.left}px round 24px)`);
  panel.classList.add('open');
  panel.offsetWidth;               // 시작 모양을 먼저 그리게 함
  panel.classList.add('full');
}
function collapse(panel, from, done) {
  if (from) {
    const r = from.getBoundingClientRect();
    panel.style.setProperty('--from',
      `inset(${r.top}px ${innerWidth - r.right}px ${innerHeight - r.bottom}px ${r.left}px round 24px)`);
  }
  panel.classList.remove('full');
  setTimeout(() => { panel.classList.remove('open'); if (done) done(); }, 550);
}

// 가방 안에 보일 작은 작품 사진
const intro = document.getElementById('case-intro');
const introBag = intro.querySelector('.ci-bag');
document.querySelectorAll('.tile').forEach(tile => {
  const d = document.createElement('div');
  d.className = 'ci-thumb';
  d.style.setProperty('--c', tile.style.getPropertyValue('--c'));
  d.innerHTML = `<img src="${tile.querySelector('.tile-thumb').getAttribute('src')}" alt="">`;
  document.getElementById('ci-lining').appendChild(d);
});

function openCase(from) {
  caseFrom = from;
  // ① 구석의 가방 자리에 같은 크기 · 같은 기울기로 "열리는 가방"을 겹쳐 놓음 (움직이지 않음)
  const r = from.getBoundingClientRect();
  intro.classList.add('show');
  introBag.style.transform = 'none';
  const b = introBag.getBoundingClientRect();
  const z = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--s')) || 1;   // zoom 은 transform 값에도 곱해지므로 나눠 줌
  introBag.style.transform =
    `translate(${(r.left + r.width / 2 - (b.left + b.width / 2)) / z}px, ${(r.top + r.height / 2 - (b.top + b.height / 2)) / z}px) rotate(-6deg)`;
  from.classList.add('hidden-for-open');   // 원래 가방은 잠깐 숨김
  setTimeout(() => intro.classList.add('lid-open'), 60);    // ② 그 자리에서 뚜껑이 열림
  setTimeout(() => intro.classList.add('peek'), 450);       // ③ 안에 든 작품 사진이 보임
  setTimeout(() => {                                          // ④ 가방 안쪽이 화면 전체로 확대됨
    expandFrom(caseEl, intro.querySelector('.ci-lining').getBoundingClientRect());
  }, 1050);
  setTimeout(() => {
    intro.classList.remove('show', 'lid-open', 'peek');
    introBag.style.transform = '';
    from.classList.remove('hidden-for-open');
  }, 1650);
}
function closeCase() {
  caseGrid.querySelectorAll('video').forEach(v => v.pause());
  collapse(caseEl, caseFrom, () => { if (caseFrom) caseFrom.classList.remove('opening'); });   // 구석의 가방 자리로 접힘
}
document.querySelectorAll('[data-open="case"]').forEach(el => {
  el.addEventListener('click', () => openCase(el));
});
document.querySelector('.case-close:not(.docs-close)').addEventListener('click', closeCase);

// 9) 노란 BAGGAGE 태그 : 기획서 · 스토리보드 모음
const docsEl = document.getElementById('docs');
const docsList = document.getElementById('docs-list');
let docsFrom = null;
const tilts = ['-4deg', '3deg', '-2deg', '4deg', '-3deg', '2deg'];
document.querySelectorAll('.tile').forEach(tile => {
  const id = tile.dataset.flight;
  const link = document.querySelector(`#pass-${id} .pass-doc`);
  if (!link) return;               // 기획서 버튼이 없는 작품(퍼플에그 등)은 빠짐
  const a = document.createElement('a');
  a.className = 'doc-tag';
  a.href = link.getAttribute('href');
  a.target = '_blank';
  a.style.setProperty('--c', tile.style.getPropertyValue('--c'));
  a.style.setProperty('--t', tilts[docsList.children.length % tilts.length]);
  a.innerHTML = `
    <span class="dt-label">BAGGAGE TAG · No.${String(docsList.children.length + 1).padStart(2, '0')}</span>
    <img src="${tile.querySelector('.tile-thumb').getAttribute('src')}" alt="">
    <span class="dt-title">${tile.querySelector('.tile-title').textContent}</span>
    <span class="dt-sub">기획서 · 스토리보드 PDF</span>
    <span class="dt-open">열기 ↗</span>`;
  docsList.appendChild(a);
});
document.getElementById('docs-count').textContent = `${docsList.children.length}편`;

function openDocs(from) {
  docsFrom = from;
  from.classList.add('opening');
  setTimeout(() => expandFrom(docsEl, from.getBoundingClientRect()), 250);
}
function closeDocs() {
  collapse(docsEl, docsFrom, () => { if (docsFrom) docsFrom.classList.remove('opening'); });
}
document.querySelectorAll('[data-open="docs"]').forEach(el => {
  el.addEventListener('click', () => openDocs(el));
});
document.querySelector('.docs-close').addEventListener('click', closeDocs);

// 8) 창문 : 마우스를 올리면 가리개가 올라가고 작품 하이라이트가 이어서 나옴
//    start = 보여 줄 장면의 시작 시간(초). 바꾸고 싶으면 숫자만 고치면 됩니다.
const REEL = [
  { id: 'sf',    start: 89 },   // 샤프란 : 임금이 시트 향을 맡는 장면
  { id: 'biff1', start: 10 },   // WHEN THE FESTIVAL ENDS : 장면 확인 후 고칠 것
  { id: 'biff2', start: 10 },   // WHEN THE FESTIVAL ENDS 2 : 장면 확인 후 고칠 것
  { id: 'pe',    start: 3 },    // 퍼플에그 : 캐릭터 등장 장면
];
const CLIP_TIME = 3000;          // 한 장면을 보여 주는 시간(ms)

const win = document.querySelector('.window');
if (win) {
  const reel = win.querySelector('.window-reel');
  const label = win.querySelector('.window-label');
  let idx = 0, timer = null, hovering = false;

  function playClip(i) {
    idx = i % REEL.length;
    const item = REEL[idx];
    const pass = document.getElementById('pass-' + item.id);
    if (!pass) return playClip(idx + 1);
    const src = pass.querySelector('video source').getAttribute('src');
    label.textContent = document.querySelector(`.tile[data-flight="${item.id}"] .tile-title`).textContent;
    reel.classList.remove('ready');
    reel.preload = 'auto';   // 마우스를 올렸을 때만 영상을 불러옴
    reel.src = src;
    reel.load();
    reel.onloadedmetadata = () => { reel.currentTime = Math.min(item.start, reel.duration - 1); };
    reel.onseeked = () => { if (hovering) reel.play().then(() => reel.classList.add('ready')).catch(() => {}); };
    reel.onerror = () => { clearTimeout(timer); if (hovering) timer = setTimeout(() => playClip(idx + 1), 300); };  // 영상이 없으면 다음 작품으로
    clearTimeout(timer);
    timer = setTimeout(() => { if (hovering) playClip(idx + 1); }, CLIP_TIME);
  }
  win.addEventListener('mouseenter', () => {
    hovering = true;
    win.classList.add('open');
    playClip(idx);
  });
  win.addEventListener('mouseleave', () => {
    hovering = false;
    win.classList.remove('open');
    clearTimeout(timer);
    reel.pause();
  });
  // 누르면 지금 나오는 작품의 탑승권 열기
  win.addEventListener('click', () => {
    hovering = false;
    win.classList.remove('open');
    clearTimeout(timer);
    reel.pause();
    openPass(REEL[idx].id);
  });
}

// 10) 첫 화면 (랜딩) : 종이비행기가 날아와 펼쳐져 탑승 안내가 되고,
//     "체크인하러 가기"를 누르면 다시 접혀 날아가며 키오스크 화면이 드러남. 처음 방문 때만 나옴.
const landing = document.getElementById('landing');
const ldSvg = document.getElementById('ld-svg');
const ldCard = document.getElementById('ld-card');
const faces = [...ldSvg.querySelectorAll('.ld-face')];
const creases = [...ldSvg.querySelectorAll('.ld-creases line')];
document.getElementById('guide-count').textContent = document.querySelectorAll('.tile').length;

// 종이비행기 모양 (참고 그림 기준 좌표, 면 4개 = 삼각형 4개). 그리는 순서: 먼 날개 → 몸통 → 안쪽 접힘 → 가까운 날개
const PLANE = [
  [[42, 265], [585, 140], [318, 270]],   // 먼 날개
  [[318, 270], [585, 140], [215, 450]],  // 몸통 (그늘)
  [[318, 270], [215, 450], [230, 350]],  // 안쪽 접힘 (가장 어두움)
  [[230, 350], [585, 140], [430, 505]],  // 가까운 날개 (가장 밝음)
];
const PLANE_COLORS = ['#EDE7DB', '#D6CDBD', '#C7BDAB', '#FBF8F1'];
const PAPER = '#FBF8F1';
const PLANE_CENTER = [314, 322];

const ease = {
  out: t => 1 - Math.pow(1 - t, 3),
  in: t => t * t * t,
  inOut: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
};
const lerp = (a, b, t) => a + (b - a) * t;
const wait = ms => new Promise(r => setTimeout(r, ms));
function tween(ms, fn) {
  return new Promise(done => {
    const t0 = performance.now();
    (function step(now) {
      const t = Math.min(1, (now - t0) / ms);
      fn(t);
      t < 1 ? requestAnimationFrame(step) : done();
    })(t0);
  });
}
function mixColor(a, b, t) {
  const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const A = p(a), B = p(b);
  return '#' + A.map((v, i) => Math.round(lerp(v, B[i], t)).toString(16).padStart(2, '0')).join('');
}
// 화면 가운데 기준으로 비행기 꼭짓점 위치 계산 (dx, dy 이동 · rot 회전 · k 크기)
function planePoints(dx = 0, dy = 0, rot = 0, k = 1) {
  const cx = innerWidth / 2 + dx, cy = innerHeight / 2 + dy;
  const sc = Math.min(1, innerWidth / 760) * .8 * k;
  const r = rot * Math.PI / 180, cos = Math.cos(r), sin = Math.sin(r);
  return PLANE.map(tri => tri.map(([x, y]) => {
    const px = (x - PLANE_CENTER[0]) * sc, py = (y - PLANE_CENTER[1]) * sc;
    return [cx + px * cos - py * sin, cy + px * sin + py * cos];
  }));
}
// 펼쳐진 종이(안내문 크기)의 삼각형 4개 : 위 · 오른쪽 · 왼쪽 · 아래
function sheetPoints() {
  const r = ldCard.getBoundingClientRect();
  const TL = [r.left, r.top], TR = [r.right, r.top], BR = [r.right, r.bottom], BL = [r.left, r.bottom];
  const M = [(r.left + r.right) / 2, (r.top + r.bottom) / 2];
  return [[TL, TR, M], [M, TR, BR], [M, BL, TL], [BL, M, BR]];
}
function draw(pts, colorT) {
  faces.forEach((f, i) => {
    f.setAttribute('points', pts[i].map(p => p.join(',')).join(' '));
    f.setAttribute('fill', mixColor(PLANE_COLORS[i], PAPER, colorT));
  });
}
function mixPts(A, B, t) { return A.map((tri, i) => tri.map((p, j) => [lerp(p[0], B[i][j][0], t), lerp(p[1], B[i][j][1], t)])); }
function setCreases(op) {
  const r = ldCard.getBoundingClientRect();
  [[r.left, r.top, r.right, r.bottom], [r.right, r.top, r.left, r.bottom]].forEach((c, i) => {
    ['x1', 'y1', 'x2', 'y2'].forEach((k, j) => creases[i].setAttribute(k, c[j]));
    creases[i].style.opacity = op;
  });
}
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let ldBusy = false, ldReady = false, ldPending = false;   // ldPending : 펼쳐지는 중에 눌렀으면 끝난 뒤 바로 나감

async function enterLanding() {
  ldBusy = true; ldReady = false;
  document.documentElement.classList.add('show-landing');
  landing.style.clipPath = '';
  ldCard.classList.remove('show');
  ldSvg.style.opacity = 1;
  if (reduceMotion) { ldSvg.style.opacity = 0; ldCard.classList.add('show'); ldBusy = false; ldReady = true; return; }
  setCreases(0);
  // ① 왼쪽 아래에서 살짝 흔들리며 날아 들어옴
  await tween(1300, t => {
    const e = ease.out(t);
    draw(planePoints(lerp(-innerWidth / 2 - 350, 0, e), lerp(260, 0, e) + Math.sin(t * Math.PI * 3) * 14 * (1 - t), lerp(16, 0, e)), 0);
  });
  await wait(250);
  // ② 접힌 면들이 펴지며 종이 한 장이 됨
  const from = planePoints(), to = sheetPoints();
  await tween(1000, t => { const e = ease.inOut(t); draw(mixPts(from, to, e), e); setCreases(e); });
  // ③ 종이 위에 안내문
  ldCard.classList.add('show');
  await wait(350);
  ldSvg.style.opacity = 0;
  ldBusy = false; ldReady = true;
  if (ldPending) { ldPending = false; leaveLanding(); }
}

async function leaveLanding() {
  if (ldBusy || !ldReady) { if (ldBusy) ldPending = true; return; }
  ldBusy = true; ldReady = false;
  if (!window.RESET_EVERY_TIME) { try { localStorage.setItem(window.LANDING_KEY || 'landingSeen', '1'); } catch (e) {} }
  if (reduceMotion) { document.documentElement.classList.remove('show-landing'); ldBusy = false; return; }
  // ④ 안내문이 사라지고 종이가 다시 비행기로 접힘
  const sheet = sheetPoints(), plane = planePoints();
  draw(sheet, 1); setCreases(1);
  ldSvg.style.opacity = 1;
  ldCard.classList.remove('show');
  await wait(200);
  await tween(750, t => { const e = ease.inOut(t); draw(mixPts(sheet, plane, e), 1 - e); setCreases(1 - e); });
  // ⑤ 오른쪽 위로 날아가며, 왼쪽부터 하늘이 걷히고 키오스크 화면이 드러남
  await tween(950, t => {
    const e = ease.in(t);
    draw(planePoints(lerp(0, innerWidth / 2 + 450, e), lerp(0, -innerHeight / 2 - 250, e), lerp(0, -20, e), lerp(1, .7, e)), 0);
    landing.style.clipPath = `inset(0 0 0 ${ease.inOut(t) * 100}%)`;
  });
  document.documentElement.classList.remove('show-landing');
  landing.style.clipPath = '';
  ldBusy = false;
}

document.getElementById('guide-go').addEventListener('click', leaveLanding);
document.getElementById('guide-btn').addEventListener('click', () => { if (!ldBusy) enterLanding(); });
if (document.documentElement.classList.contains('show-landing')) enterLanding();
