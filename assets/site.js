(function () {
  var doc = document.documentElement;

  /* ---------- header: glass on scroll ---------- */
  var header = document.getElementById('site-header');
  var bar = document.getElementById('header-bar');
  function onScroll() {
    var s = window.scrollY > 24;
    header.classList.toggle('py-2', s); header.classList.toggle('py-4', !s);
    bar.classList.toggle('glass', s); bar.classList.toggle('shadow-card', s);
    bar.classList.toggle('bg-transparent', !s);
  }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- mobile menu ---------- */
  var menuBtn = document.getElementById('menu-toggle');
  var menu = document.getElementById('mobile-menu');
  var openIcon = menuBtn.innerHTML;
  var closeIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>';
  function setMenu(open) {
    menu.hidden = !open; menuBtn.setAttribute('aria-expanded', open);
    menuBtn.innerHTML = open ? closeIcon : openIcon;
  }
  menuBtn.addEventListener('click', function () { setMenu(menu.hidden); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });

  /* ---------- animated counters ---------- */
  var counters = document.querySelectorAll('[data-count]');
  function render(el, v) {
    var dec = +el.dataset.dec;
    el.textContent = el.dataset.prefix + (dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-US')) + el.dataset.suffix;
  }
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    counters.forEach(function (el) { render(el, 0); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        var el = en.target, target = +el.dataset.count, t0 = performance.now();
        (function tick(now) {
          var p = Math.min(1, (now - t0) / 1600), k = 1 - Math.pow(1 - p, 3);
          render(el, target * k); if (p < 1) requestAnimationFrame(tick);
        })(t0);
      });
    }, { threshold: 0.2 });
    counters.forEach(function (el) { io.observe(el); });
  }

  /* ---------- image lightbox (case studies) ---------- */
  var lb = document.getElementById('lightbox');
  var lbImg = lb.querySelector('img'), lbCap = lb.querySelector('.lb-cap');
  var lastFocus = null;
  function openLb(img) {
    lastFocus = document.activeElement;
    lbImg.src = img.src; lbImg.alt = img.alt; lbCap.textContent = img.alt;
    lb.hidden = false; document.body.style.overflow = 'hidden';
    lb.querySelector('.lb-close').focus();
  }
  function closeLb() {
    lb.hidden = true; document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  document.querySelectorAll('button[aria-haspopup="dialog"]').forEach(function (b) {
    b.removeAttribute('aria-controls');
    b.addEventListener('click', function () {
      var box = b.closest('article') || b.parentElement;
      var img = box.querySelector('img'); if (img) openLb(img);
    });
  });
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target.closest('.lb-close')) closeLb(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !lb.hidden) closeLb(); });

  /* ---------- WhatsApp links ---------- */
  var WA = (window.BAARIK_WA || '').replace(/\D/g, '');
  function waHref() {
    var t = (window.BAARIK_WA_TEXT || {})[doc.lang === 'en' ? 'en' : 'ar'] || '';
    return 'https://wa.me/' + WA + (t ? '?text=' + encodeURIComponent(t) : '');
  }
  function refreshWa() {
    document.querySelectorAll('[data-wa]').forEach(function (a) {
      if (!WA) { a.hidden = true; return; }
      a.hidden = false; a.href = waHref();
    });
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-wa]');
    if (a && WA) { a.href = waHref(); if (window.fbq) try { fbq('track', 'Contact'); } catch (x) {} if (window.gtag) try { gtag('event', 'contact_whatsapp'); } catch (x) {} }
  });
  refreshWa();

  /* ---------- case studies: show more ---------- */
  var moreBtn = document.getElementById('cases-more');
  if (moreBtn) {
    var moreLabel = moreBtn.querySelector('span').textContent;
    moreBtn.addEventListener('click', function () {
      var open = moreBtn.getAttribute('aria-expanded') !== 'true';
      document.querySelectorAll('article[data-more]').forEach(function (a) { a.hidden = !open; });
      moreBtn.setAttribute('aria-expanded', open);
      var span = moreBtn.querySelector('span');
      var en = doc.lang === 'en';
      span.textContent = open ? (en ? 'Show fewer' : 'اعرض حالات أقل') : (en ? (window.BAARIK_EXTRA || {})[moreLabel] || moreLabel : moreLabel);
      if (!open) document.getElementById('cases').scrollIntoView({ behavior: 'smooth' });
    });
  }

  /* ---------- contact form -> Google Sheet ---------- */
  var SHEET_URL = 'https://script.google.com/macros/s/AKfycbwJapnVUozgB_iT8usC_C2w8ITo7kjdRdLDk9uU22S2eUCAFSBlHXoTDw3YiSwQCcJ6/exec';
  var form = document.getElementById('contact-form');
  if (form) {
    var f = form.querySelectorAll('input, select, textarea');
    ['name', 'phone', 'business', 'revenue', 'message'].forEach(function (n, i) { if (f[i]) f[i].name = n; });
    var hp = document.createElement('input');  // honeypot against spam bots
    hp.name = 'website'; hp.tabIndex = -1; hp.autocomplete = 'off'; hp.setAttribute('aria-hidden', 'true');
    hp.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0';
    form.appendChild(hp);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.style.opacity = '.7'; }
      var data = new URLSearchParams(new FormData(form));
      data.append('lang', doc.lang); data.append('page', location.href + (document.referrer ? ' | ref: ' + document.referrer : ''));
      fetch(SHEET_URL, { method: 'POST', mode: 'no-cors', body: data })
        .then(showSuccess)
        .catch(function () {
          if (btn) { btn.disabled = false; btn.style.opacity = ''; }
          alertBox(doc.lang === 'en' ? 'Something went wrong, please try again.' : 'حصلت مشكلة في الإرسال، جرّب تاني من فضلك.');
        });
    });
  }
  function alertBox(msg) {
    var p = form.querySelector('.form-error') || document.createElement('p');
    p.className = 'form-error sm:col-span-2 text-sm'; p.style.color = '#f87171'; p.textContent = msg; form.appendChild(p);
  }
  function showSuccess() {
    if (window.fbq) try { fbq('track', 'Lead'); } catch (e) {}
    if (window.gtag) try { gtag('event', 'generate_lead'); } catch (e) {}
    var box = document.createElement('div');
    box.className = 'flex h-full flex-col items-center justify-center rounded-2xl border border-primary/30 bg-primary/5 p-10 text-center';
    box.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-12 w-12 text-primary"><circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path></svg><p class="mt-4 text-base font-semibold"></p>';
    box.querySelector('p').textContent = window.BAARIK_SUCCESS[doc.lang === 'en' ? 'en' : 'ar'];
    if (WA) {
      var w = document.createElement('a');
      w.setAttribute('data-wa', ''); w.href = waHref(); w.target = '_blank'; w.rel = 'noopener';
      w.className = 'bk-wa-inline mt-5';
      w.textContent = doc.lang === 'en' ? 'Want a faster reply? Message us on WhatsApp' : 'عايز رد أسرع؟ كلّمنا واتساب';
      box.appendChild(w);
    }
    form.replaceWith(box);
  }

  /* ---------- language toggle (AR <-> EN) ---------- */
  var AR2EN = Object.assign({}, window.BAARIK_I18N || {}, window.BAARIK_EXTRA || {}), EN2AR = {};
  Object.keys(AR2EN).forEach(function (k) { EN2AR[AR2EN[k]] = k; });
  function tr(str, map) {
    var t = str.trim(); if (!t) return str;
    var out = map[t];
    if (out === undefined && t.indexOf(' · ') > -1)
      out = t.split(' · ').map(function (p) { return map[p] !== undefined ? map[p] : p; }).join(' · ');
    if (out === undefined) return str;
    return str.replace(t, out);
  }
  function translate(map) {
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null), n;
    while ((n = w.nextNode())) {
      if (n.parentElement.closest('script,style,[data-count]')) continue;
      var v = tr(n.nodeValue, map); if (v !== n.nodeValue) n.nodeValue = v;
    }
    document.querySelectorAll('[placeholder],[alt],[aria-label]').forEach(function (el) {
      ['placeholder', 'alt', 'aria-label'].forEach(function (a) {
        if (el.hasAttribute(a)) el.setAttribute(a, tr(el.getAttribute(a), map));
      });
    });
  }
  function setLang(lang, save) {
    if (doc.lang === lang) return;
    translate(lang === 'en' ? AR2EN : EN2AR);
    doc.lang = lang; doc.dir = lang === 'ar' ? 'rtl' : 'ltr';
    refreshWa();
    if (save) try { localStorage.setItem('baarik-lang', lang); } catch (e) {}
  }
  document.getElementById('lang-toggle').addEventListener('click', function () {
    setLang(doc.lang === 'ar' ? 'en' : 'ar', true);
  });
  try { if (localStorage.getItem('baarik-lang') === 'en') setLang('en'); } catch (e) {}
})();
