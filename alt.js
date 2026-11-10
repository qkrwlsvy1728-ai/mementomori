// =========================================================
// B 버전에서 더한 것 (index-b.html 에서만 불러옴, script.js 다음에 실행)
// =========================================================
(() => {
  const $ = s => document.querySelector(s);
  const visible = el => el && getComputedStyle(el).display !== 'none' && el.offsetParent !== null;
  const anyOpen = () =>
    $('#overlay').classList.contains('open') || $('#case').classList.contains('open') ||
    $('#docs').classList.contains('open') || document.documentElement.classList.contains('show-landing');

  // 작품 목록 (키오스크 버튼에서 읽음)
  const works = [...document.querySelectorAll('.tile')].map(t => {
    const id = t.dataset.flight;
    const dt = [...document.querySelectorAll(`#pass-${id} .pass-info dt`)].find(d => d.textContent.trim() === 'FLIGHT');
    const v = document.querySelector(`#pass-${id} video`);
    return {
      id,
      title: t.querySelector('.tile-title').textContent,
      color: t.style.getPropertyValue('--c'),
      flight: dt ? dt.nextElementSibling.textContent.trim() : id.toUpperCase(),
      poster: v ? v.getAttribute('poster') : '',
      src: v ? v.querySelector('source').getAttribute('src') : '',
    };
  });
  const used = new Set();   // 써 본 기능 (안내 방송 · 툭 건드리기에서 뺌)

  // ---------- ② 탑승 기록 (여권 도장) ----------
  const KEY = 'stampsB';
  let stamps = new Set();
  // 켤 때마다 초기화 (index-b.html 의 RESET_EVERY_TIME 이 true 이면 도장 기록을 저장하지 않음)
  if (!window.RESET_EVERY_TIME) { try { stamps = new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch (e) {} }
  const save = () => { if (window.RESET_EVERY_TIME) return; try { localStorage.setItem(KEY, JSON.stringify([...stamps])); } catch (e) {} };
  const tilts = ['-8deg', '6deg', '-4deg', '9deg', '-6deg', '4deg'];

  function render() {
    $('#bb-dots').innerHTML = works.map(w =>
      `<i class="${stamps.has(w.id) ? 'on' : ''}" style="--c:${w.color}"></i>`).join('');
    const n = stamps.size, all = works.length;
    $('#bb-count').textContent = n === all ? '탑승 완료 ✓' : `탑승 기록 ${n}/${all}`;
    $('#bb-stamps').classList.toggle('done', n === all);
    $('#pp-stamp-count').textContent = `${n} / ${all}`;
    $('#stamp-list').innerHTML = works.map((w, i) => stamps.has(w.id)
      ? `<li class="on" style="--c:${w.color};--t:${tilts[i % tilts.length]}"><b>${w.flight}</b>BOARDED</li>`
      : `<li>NOT YET</li>`).join('');
  }
  let toastTimer;
  function toast(msg) {
    const t = $('#toast-b');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  // 탑승권(영상)이 열릴 때마다 도장 찍기 : script.js 의 openPass 를 감쌈
  const baseOpenPass = openPass;
  openPass = function (id) {
    baseOpenPass(id);
    if (id === 'about') { used.add('about'); return; }
    used.add('kiosk');
    if (works.some(w => w.id === id) && !stamps.has(id)) {
      stamps.add(id); save(); render();
      $('#bb-stamps').classList.remove('pop'); void $('#bb-stamps').offsetWidth; $('#bb-stamps').classList.add('pop');
      toast(stamps.size === works.length
        ? '🌏 모든 작품 탑승 완료! 여권에서 탑승 기록을 확인해 보세요'
        : `🛂 여권에 도장이 찍혔어요 · ${stamps.size} / ${works.length}`);
    }
  };
  $('#bb-stamps').addEventListener('click', () => openPass('about'));
  render();

  // 기능을 써 봤는지 기록
  $('.suitcase').addEventListener('click', () => used.add('case'));
  $('.tag').addEventListener('click', () => used.add('docs'));
  $('.window').addEventListener('mouseenter', () => used.add('window'));

  // ---------- ② 안내 방송 ----------
  const FEATURES = [
    { key: 'case', sel: '.suitcase', text: `분홍 가방에 작품 ${works.length}편이 모두 실려 있어요 — 가방을 눌러 보세요` },
    { key: 'docs', sel: '.tag', text: '노란 BAGGAGE 태그 안에 기획서 · 스토리보드가 들어 있어요' },
    { key: 'window', sel: '.window', text: '비행기 창문에 마우스를 올리면 작품 하이라이트가 나와요' },
    { key: 'about', sel: '.passport', text: '여권을 펼치면 제 소개와 탑승 기록이 있어요' },
  ];
  function messages() {
    const list = [];
    works.filter(w => !stamps.has(w.id)).forEach(w =>
      list.push({ sel: '.kiosk', text: `✈ ${w.flight}편 〈${w.title}〉 탑승 수속 중 — 키오스크에서 체크인하세요` }));
    FEATURES.filter(f => !used.has(f.key) && visible($(f.sel))).forEach(f => list.push(f));
    if (!list.length) list.push({ sel: '.passport', text: '모든 작품 탑승 완료! 여권에서 탑승 기록을 확인해 보세요' });
    return list;
  }
  let msgIdx = 0, current = null;
  function nextMessage() {
    const list = messages();
    current = list[msgIdx % list.length];
    msgIdx++;
    const el = $('#bb-text');
    el.classList.add('fade');
    setTimeout(() => { el.textContent = current.text; el.classList.remove('fade'); }, 300);
  }
  nextMessage();
  setInterval(nextMessage, 5500);
  // 안내 방송을 누르면 해당 물건이 빛남
  function spot(el) {
    if (!el) return;
    el.classList.remove('spot'); void el.offsetWidth; el.classList.add('spot');
    setTimeout(() => el.classList.remove('spot'), 2500);
  }
  $('#bb-msg').addEventListener('click', () => current && spot($(current.sel)));

  // ---------- ② 10초 동안 가만히 있으면 툭 건드리기 ----------
  let lastAct = Date.now();
  ['pointerdown', 'keydown', 'wheel'].forEach(ev => addEventListener(ev, () => { lastAct = Date.now(); }, true));
  setInterval(() => {
    if (Date.now() - lastAct < 10000 || anyOpen()) return;
    const order = [
      { key: 'kiosk', sel: '.kiosk' }, { key: 'case', sel: '.suitcase' }, { key: 'docs', sel: '.tag' },
      { key: 'about', sel: '.passport' }, { key: 'window', sel: '.window' },
    ];
    const target = order.find(o => !used.has(o.key) && visible($(o.sel)));
    if (target) {
      const el = $(target.sel);
      el.classList.remove('nudge'); void el.offsetWidth; el.classList.add('nudge');
      setTimeout(() => el.classList.remove('nudge'), 1000);
    }
    lastAct = Date.now();
  }, 1000);

  // ---------- ① 마우스가 가까이 오면 반응 ----------
  const nearEls = ['.passport', '.tag', '.suitcase', '.window'].map(s => $(s)).filter(Boolean);
  let mx = -999, my = -999, rafOn = false;
  addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    if (rafOn) return;
    rafOn = true;
    requestAnimationFrame(() => {
      rafOn = false;
      nearEls.forEach(el => {
        const r = el.getBoundingClientRect();
        const dx = Math.max(r.left - mx, 0, mx - r.right), dy = Math.max(r.top - my, 0, my - r.bottom);
        el.classList.toggle('near', Math.hypot(dx, dy) < 90);
      });
    });
  });

  // ---------- ③ 키오스크 대기 화면 ----------
  const kiosk = $('#kiosk'), scr = $('#screen'), at = $('#attract'), av = at.querySelector('video');
  const reel = (typeof REEL !== 'undefined' ? REEL : works.map(w => ({ id: w.id, start: 5 })));
  let attractOn = false, aIdx = 0, aTimer = null, lastKiosk = 0;
  const ATTRACT_CLIP = 4000;     // 한 작품 보여 주는 시간(ms)
  const ATTRACT_IDLE = 15000;    // 키오스크를 이만큼 안 만지면 대기 화면으로(ms)

  function playClip(i) {
    aIdx = i % reel.length;
    const w = works.find(x => x.id === reel[aIdx].id);
    if (!w) return playClip(aIdx + 1);
    $('#at-title').textContent = w.title;
    av.poster = w.poster;          // 영상이 늦게 뜨거나 없으면 대표 사진이 보임
    av.preload = 'auto';
    av.src = w.src;
    av.load();
    av.onloadedmetadata = () => { av.currentTime = Math.min(reel[aIdx].start, av.duration - 1); };
    av.onseeked = () => { if (attractOn) av.play().catch(() => {}); };
    clearTimeout(aTimer);
    aTimer = setTimeout(() => { if (attractOn) playClip(aIdx + 1); }, ATTRACT_CLIP);
  }
  function showAttract() {
    if (attractOn || scr.classList.contains('is-printing')) return;
    attractOn = true;
    scr.classList.add('attract-on');
    playClip(aIdx);
  }
  function hideAttract() {
    lastKiosk = Date.now();
    if (!attractOn) return;
    attractOn = false;
    scr.classList.remove('attract-on');
    clearTimeout(aTimer);
    av.pause();
  }
  // 키오스크 화면 위에서 마우스를 움직이거나 누르면 작품 목록으로 바뀜
  scr.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') hideAttract(); });   // 휴대폰은 화면을 눌러야 바뀜
  at.addEventListener('click', e => { e.stopPropagation(); hideAttract(); });   // 누른 손가락이 아래 작품 버튼까지 누르지 않게 click 에서 처리
  // 처음엔 바로, 그 뒤엔 키오스크 화면을 15초 동안 안 만지면 다시 대기 화면
  setInterval(() => {
    if (attractOn || anyOpen() || scr.classList.contains('is-printing')) return;
    if (lastKiosk === 0 || Date.now() - lastKiosk > ATTRACT_IDLE) showAttract();
  }, 500);
})();
