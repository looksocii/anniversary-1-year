/* =========================================================
   1st Anniversary — main.js
   ========================================================= */
(function () {
  'use strict';

  var CFG      = window.APP_CONFIG || {};
  var STORY    = window.STORY || [];
  var HAS_GSAP = typeof window.gsap !== 'undefined';
  var REDUCED  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!HAS_GSAP) document.body.classList.add('no-gsap');
  if (HAS_GSAP && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /** ย่อ duration ให้เหลือแทบเป็นศูนย์เมื่อผู้ใช้ปิด motion */
  function d(v) { return REDUCED ? 0.01 : v; }

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* =======================================================
     1) หัวใจลอยเป็นฉากหลัง
     ======================================================= */
  var HEART_PATH = 'M16 28.5C16 28.5 1.5 19.8 1.5 10.4 1.5 5.6 5.3 2 9.8 2c2.7 0 5 1.4 6.2 3.5C17.2 3.4 19.5 2 22.2 2 26.7 2 30.5 5.6 30.5 10.4c0 9.4-14.5 18.1-14.5 18.1z';

  function initPetals() {
    if (REDUCED || !HAS_GSAP) return;
    var wrap = $('#petals');
    if (!wrap) return;

    var count = window.innerWidth < 700 ? 10 : 18;

    for (var i = 0; i < count; i++) {
      var el = document.createElement('span');
      el.className = 'petal';
      var size = gsap.utils.random(9, 22);
      el.style.width  = size + 'px';
      el.style.height = size + 'px';
      el.style.left   = gsap.utils.random(0, 100) + '%';
      el.style.opacity = gsap.utils.random(0.18, 0.5);
      el.innerHTML = '<svg viewBox="0 0 32 29"><path d="' + HEART_PATH + '"/></svg>';
      wrap.appendChild(el);

      gsap.set(el, { y: gsap.utils.random(-200, 0), rotation: gsap.utils.random(-40, 40) });

      gsap.to(el, {
        y: window.innerHeight + 160,
        duration: gsap.utils.random(16, 30),
        repeat: -1,
        ease: 'none',
        delay: gsap.utils.random(0, 14)
      });
      gsap.to(el, {
        x: gsap.utils.random(-70, 70),
        rotation: gsap.utils.random(-140, 140),
        duration: gsap.utils.random(6, 12),
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
    }
  }

  /* =======================================================
     2) ประตูจดหมาย : ตราหัวใจ + รหัสผ่าน
     ======================================================= */
  var gate      = $('#gate');
  var envelope  = $('#envelope');
  var seal      = $('#seal');
  var lock      = $('#lock');
  var gateHint  = $('#gateHint');
  var codeBox   = $('#codeBox');
  var codeInput = $('#codeInput');
  var cells     = $$('.code__cell');
  var lockMsg   = $('#lockMsg');
  var unlockBtn = $('#unlockBtn');

  var CODE      = String(CFG.passcode || '19082025');
  var attempts  = 0;
  var unlocked  = false;
  var checking  = false;

  /* ---- intro ของหน้า gate ---- */
  function introGate() {
    if (!HAS_GSAP) return;
    var tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      onComplete: startBeat   // เริ่มเต้นหลัง intro จบ กัน tween ชนกัน
    });

    gsap.set(seal, { scale: 0, opacity: 0, rotate: -50 });
    tl.from('[data-gate-intro]', { y: 18, opacity: 0, duration: d(0.9), stagger: 0.12 })
      .to(seal, { scale: 1, opacity: 1, rotate: 0, duration: d(0.9), ease: 'back.out(1.7)' }, '-=0.55');
  }

  /* หัวใจเต้นเบา ๆ */
  function startBeat() {
    if (REDUCED || unlocked) return;
    gsap.to(seal, {
      scale: 1.055,
      duration: 1.15,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }

  /* ---- เปิดแผงรหัส ---- */
  function openLock() {
    if (lock.hidden === false) { codeInput.focus(); return; }

    lock.hidden = false;
    gateHint.classList.add('is-out');

    if (HAS_GSAP) {
      gsap.killTweensOf(seal);
      gsap.to(seal, { scale: 1, opacity: 1, rotate: 0, duration: d(0.3), ease: 'power2.out' });
      gsap.to(gateHint, { opacity: 0, y: -8, duration: d(0.35) });
      gsap.fromTo(lock,
        { opacity: 0, y: 22 },
        { opacity: 1, y: 0, duration: d(0.7), ease: 'power3.out' }
      );
      gsap.fromTo(cells,
        { y: 14, opacity: 0 },
        { y: 0, opacity: 1, duration: d(0.5), stagger: 0.045, ease: 'power2.out', delay: 0.1 }
      );
    } else {
      lock.style.opacity = 1;
    }

    setTimeout(function () { codeInput.focus(); }, REDUCED ? 0 : 380);
  }

  /* ---- วาดตัวเลขลงช่อง ---- */
  function renderCode() {
    var v = codeInput.value;
    cells.forEach(function (cell, i) {
      var ch = v[i] || '';
      cell.textContent = ch;
      cell.classList.toggle('is-filled', ch !== '');
      cell.classList.toggle('is-active', i === v.length && document.activeElement === codeInput);
    });
  }

  function setMsg(text, isHint) {
    lockMsg.textContent = text || '';
    lockMsg.classList.toggle('is-hint', !!isHint);
  }

  /* ---- ตรวจรหัส ---- */
  function checkCode() {
    if (checking || unlocked) return;
    var v = codeInput.value;

    if (v.length < 8) {
      setMsg('กรอกให้ครบ 8 หลักก่อนนะ (วว/ดด/ปปปป)');
      shake();
      return;
    }

    checking = true;

    if (v === CODE) {
      setMsg('');
      codeInput.blur();
      cells.forEach(function (c) { c.classList.remove('is-active'); });
      unlock();
      return;
    }

    attempts++;
    checking = false;
    codeBox.classList.add('is-error');
    shake();

    if (attempts >= 3 && CFG.hint) {
      setMsg(CFG.hint, true);
    } else {
      setMsg('ยังไม่ใช่วันนั้นนะ ลองใหม่อีกครั้ง 💗');
    }

    setTimeout(function () {
      codeBox.classList.remove('is-error');
      codeInput.value = '';
      renderCode();
      codeInput.focus();
    }, 700);
  }

  function shake() {
    if (!HAS_GSAP || REDUCED) return;
    gsap.fromTo(codeBox,
      { x: -11 },
      { x: 0, duration: 0.6, ease: 'elastic.out(1, 0.32)', clearProps: 'x' }
    );
  }

  /* ---- events ของช่องกรอก ---- */
  if (codeInput) {
    codeInput.addEventListener('input', function () {
      var clean = codeInput.value.replace(/\D/g, '').slice(0, 8);
      if (clean !== codeInput.value) codeInput.value = clean;
      codeBox.classList.remove('is-error');
      if (lockMsg.textContent && !lockMsg.classList.contains('is-hint')) setMsg('');
      renderCode();

      if (clean.length === 8) setTimeout(checkCode, 260); // กรอกครบ = ตรวจให้เลย
    });

    codeInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); checkCode(); }
    });
    codeInput.addEventListener('focus', renderCode);
    codeInput.addEventListener('blur', renderCode);
    codeBox.addEventListener('click', function () { codeInput.focus(); });
  }

  if (seal)      seal.addEventListener('click', openLock);
  if (unlockBtn) unlockBtn.addEventListener('click', checkCode);

  /* =======================================================
     3) ปลดล็อก : เปิดซองจดหมาย
     ======================================================= */
  function unlock() {
    unlocked = true;
    envelope.classList.add('is-open');

    var site = $('#site');
    site.setAttribute('aria-hidden', 'false');
    site.classList.add('is-visible');

    function afterOpen() {
      document.body.classList.remove('is-locked');
      gate.style.display = 'none';
      window.scrollTo(0, 0);
      initSite();
    }

    if (!HAS_GSAP) {
      site.style.opacity = 1;
      afterOpen();
      return;
    }

    var tl = gsap.timeline({ defaults: { ease: 'power3.inOut' }, onComplete: afterOpen });

    tl.to(seal, { scale: 0, rotate: 140, opacity: 0, duration: d(0.5), ease: 'back.in(1.6)' })
      .to(lock, { opacity: 0, y: 14, duration: d(0.45) }, '-=0.35')
      .to('#flap', { rotateX: -178, duration: d(0.85) }, '-=0.15')
      .to('.envelope__letter', { opacity: 1, y: '-34%', duration: d(0.8), ease: 'power3.out' }, '-=0.4')
      .to('.envelope__letter', { scale: 14, opacity: 0, duration: d(0.9), ease: 'power2.in' }, '+=0.15')
      .to(gate, { opacity: 0, duration: d(0.6) }, '-=0.55')
      .fromTo(site, { opacity: 0 }, { opacity: 1, duration: d(0.7) }, '-=0.4');
  }

  /* =======================================================
     4) สร้าง timeline จาก mock data
     ======================================================= */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function isVideo(src) { return /\.(mp4|webm|ogv|mov)(\?|$)/i.test(src || ''); }

  function mediaTag(item) {
    var src = item.src || item.image || '';
    var alt = esc(item.alt || item.title || '');

    if (isVideo(src)) {
      return '<video class="tl-item__vid" src="' + esc(src) + '"' +
             (item.poster ? ' poster="' + esc(item.poster) + '"' : '') +
             ' muted loop playsinline preload="none"' +
             (REDUCED ? ' controls' : '') +
             ' aria-label="' + alt + '"></video>';
    }
    return '<img src="' + esc(src) + '" alt="' + alt + '" loading="lazy" decoding="async">';
  }

  function buildTimeline() {
    var list = $('#timelineList');
    if (!list) return;

    list.innerHTML = STORY.map(function (item, i) {
      var side = i % 2 === 0 ? 'tl-item--left' : 'tl-item--right';
      return [
        '<li class="tl-item ' + side + '">',
        '  <figure class="tl-item__media">' + mediaTag(item) + '</figure>',
        '  <span class="tl-item__dot"></span>',
        '  <div class="tl-item__body">',
        item.date ? '    <p class="tl-item__date">' + esc(item.date) + '</p>' : '',
        '    <h3 class="tl-item__title">' + esc(item.title) + '</h3>',
        item.text ? '    <p class="tl-item__text">' + esc(item.text) + '</p>' : '',
        '  </div>',
        '</li>'
      ].join('');
    }).join('');
  }

  /* เล่นวิดีโอเฉพาะตอนที่อยู่ในจอ — ประหยัดเน็ตและแบตเตอรี่ */
  function initVideos() {
    var vids = $$('.tl-item__vid');
    if (!vids.length) return;

    if (REDUCED || !('IntersectionObserver' in window)) {
      vids.forEach(function (v) { v.preload = 'metadata'; v.controls = true; });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) {
          if (v.preload !== 'auto') v.preload = 'auto';
          var p = v.play();
          if (p && p.catch) p.catch(function () { v.controls = true; });
        } else {
          v.pause();
        }
      });
    }, { rootMargin: '10% 0px', threshold: 0.25 });

    vids.forEach(function (v) { io.observe(v); });
  }

  /* =======================================================
     5) แอนิเมชันของหน้าเว็บหลัก
     ======================================================= */
  function initSite() {
    heroIntro();
    initVideos();
    if (HAS_GSAP && window.ScrollTrigger) {
      timelineMotion();
      railMotion();
      sectionMotion();
      ScrollTrigger.refresh();
    } else {
      $$('.tl-item__media, .tl-item__body, .tl-item__dot').forEach(function (el) {
        el.style.opacity = 1;
        el.style.transform = 'none';
      });
    }
  }

  function heroIntro() {
    // ห่อข้อความแต่ละบรรทัดเพื่อทำ mask reveal
    $$('.hero__title .line').forEach(function (line) {
      if (line.querySelector('.line__in')) return;
      var inner = document.createElement('span');
      inner.className = 'line__in';
      inner.innerHTML = line.innerHTML;
      line.innerHTML = '';
      line.appendChild(inner);
    });

    if (!HAS_GSAP) return;

    /* กันเหนียว: ถ้าแอนิเมชันค้างกลางทางด้วยเหตุใดก็ตาม อีก 5 วินาที
       ให้ล้าง style ที่ GSAP เขียนค้างไว้ทิ้ง ข้อความจะกลับมาแสดงตาม CSS เสมอ
       (ถ้าแอนิเมชันจบปกติ บรรทัดนี้ไม่มีผลอะไร) */
    setTimeout(function () {
      $$('.hero__title .line__in, .hero__label').forEach(function (el) {
        ['opacity', 'transform', 'translate', 'rotate', 'scale'].forEach(function (p) {
          el.style.removeProperty(p);
        });
      });
    }, 5000);

    var tl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.15 });
    tl.from('.hero__label', { y: 16, opacity: 0, duration: d(0.8) })
      .from('.line__in', {
        yPercent: 108, opacity: 0, duration: d(1), stagger: 0.12,
        clearProps: 'transform'
      }, '-=0.5')
      .from('.hero__date', { y: 14, opacity: 0, letterSpacing: '.6em', duration: d(0.9) }, '-=0.6')
      .from('.hero__lead', { y: 14, opacity: 0, duration: d(0.8) }, '-=0.6')
      .from('.scrollcue', { opacity: 0, duration: d(0.8) }, '-=0.4');
  }

  function timelineMotion() {
    $$('.tl-item').forEach(function (item) {
      var media = $('.tl-item__media', item);
      var body  = $('.tl-item__body', item);
      var dot   = $('.tl-item__dot', item);
      var img   = $('img, video', media);
      var isLeft = item.classList.contains('tl-item--left');

      var tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
        scrollTrigger: { trigger: item, start: 'top 78%', once: true }
      });

      tl.to(media, { opacity: 1, y: 0, duration: d(1.05) })
        .from(img, { scale: 1.22, duration: d(1.4), ease: 'power2.out' }, '-=1.05')
        .to(dot, { opacity: 1, scale: 1, duration: d(0.5), ease: 'back.out(2.4)' }, '-=0.85')
        .to(body, { opacity: 1, y: 0, duration: d(0.9) }, '-=0.7');

      // พารัลแลกซ์เบา ๆ ของรูป
      if (!REDUCED) {
        gsap.to(media, {
          yPercent: isLeft ? -5 : 5,
          ease: 'none',
          scrollTrigger: { trigger: item, start: 'top bottom', end: 'bottom top', scrub: 1 }
        });
      }
    });
  }

  function railMotion() {
    var track = $('.timeline__track');
    var prog  = $('#railProgress');
    var spark = $('#railSpark');
    if (!track || !prog) return;

    var st = { trigger: track, start: 'top 62%', end: 'bottom 72%', scrub: 0.6 };

    gsap.to(prog,  { height: '100%', ease: 'none', scrollTrigger: st });
    gsap.to(spark, { top: '100%',    ease: 'none', scrollTrigger: st });

    ScrollTrigger.create({
      trigger: track,
      start: 'top 62%',
      end: 'bottom 72%',
      onToggle: function (self) {
        gsap.to(spark, { opacity: self.isActive ? 1 : 0, duration: d(0.4) });
      }
    });
  }

  function sectionMotion() {
    ['.timeline__head', '.counter__card', '.finale__card'].forEach(function (sel) {
      gsap.from(sel, {
        y: 40, opacity: 0, duration: d(1), ease: 'power3.out',
        scrollTrigger: { trigger: sel, start: 'top 82%', once: true }
      });
    });

    gsap.from('.counter__unit', {
      y: 22, opacity: 0, duration: d(0.7), stagger: 0.09, ease: 'power3.out',
      scrollTrigger: { trigger: '.counter__grid', start: 'top 85%', once: true }
    });
  }

  /* =======================================================
     6) ตัวนับเวลาที่อยู่ด้วยกัน
     ======================================================= */
  function initCounter() {
    var start = CFG.startDate instanceof Date ? CFG.startDate : new Date(2025, 7, 19);
    var out = {
      d: $('[data-c="d"]'), h: $('[data-c="h"]'),
      m: $('[data-c="m"]'), s: $('[data-c="s"]')
    };
    if (!out.d) return;

    function pad(n) { return n < 10 ? '0' + n : String(n); }

    function tick() {
      var diff = Math.max(0, Date.now() - start.getTime());
      var sec  = Math.floor(diff / 1000);
      out.d.textContent = Math.floor(sec / 86400).toLocaleString('en-US');
      out.h.textContent = pad(Math.floor(sec / 3600) % 24);
      out.m.textContent = pad(Math.floor(sec / 60) % 60);
      out.s.textContent = pad(sec % 60);
    }

    tick();
    setInterval(tick, 1000);
  }

  /* =======================================================
     boot
     ======================================================= */
  buildTimeline();
  initCounter();
  initPetals();
  introGate();
  renderCode();
})();
