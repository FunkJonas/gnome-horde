/* Gnome Horde: Garden Defense – press kit.
   Language switch (English/German), the looping clips and the screenshot viewer.
   Nothing is stored in the browser and nothing is sent anywhere. */
(function () {
  'use strict';

  var root = document.documentElement;
  var each = function (sel, fn) { Array.prototype.forEach.call(document.querySelectorAll(sel), fn); };

  /* ---------------------------------------------------------------- language */

  // Attributes that hold text: the English text stays in the attribute, the German one in data-<attr>-de.
  var TEXT_ATTRS = ['alt', 'aria-label'];

  function setLang(lang) {
    if (lang !== 'de') lang = 'en';
    root.setAttribute('data-lang', lang);
    root.setAttribute('lang', lang);
    var title = root.getAttribute('data-title-' + lang);
    if (title) document.title = title;
    TEXT_ATTRS.forEach(function (attr) {
      each('[data-' + attr + '-de]', function (el) {
        if (!el.hasAttribute('data-' + attr + '-en')) el.setAttribute('data-' + attr + '-en', el.getAttribute(attr) || '');
        el.setAttribute(attr, el.getAttribute('data-' + attr + '-' + lang));
      });
    });
    each('[data-set-lang]', function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-set-lang') === lang));
    });
  }

  function remember(lang) {
    // only in the address (?lang=de), so a link can be shared; nothing is saved
    try {
      var url = new URL(window.location.href);
      if (lang === 'de') url.searchParams.set('lang', 'de'); else url.searchParams.delete('lang');
      window.history.replaceState(null, '', url.href);
    } catch (e) { /* file:// or an old browser: the switch still works */ }
  }

  var switcher = document.querySelector('.lang-switch');
  if (switcher) {
    switcher.hidden = false;
    each('[data-set-lang]', function (b) {
      b.addEventListener('click', function () {
        var lang = b.getAttribute('data-set-lang');
        setLang(lang);
        remember(lang);
      });
    });
    var m = /[?&]lang=(de|en)\b/.exec(window.location.search);
    setLang(m ? m[1] : 'en');
  }

  /* ---------------------------------------------------------------- looping clips */

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SVG_PLAY = '<svg class="icon-play" aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>';
  var SVG_PAUSE = '<svg class="icon-pause" aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor"/></svg>';
  var LABEL = '<span class="visually-hidden lbl-play">' +
    '<span data-l="en" lang="en">Play clip</span><span data-l="de" lang="de">Clip abspielen</span></span>' +
    '<span class="visually-hidden lbl-pause">' +
    '<span data-l="en" lang="en">Pause clip</span><span data-l="de" lang="de">Clip anhalten</span></span>';

  function start(v) {
    v.preload = 'auto';
    var p = v.play();
    if (p && typeof p.catch === 'function') p.catch(function () { /* autoplay refused: the button still works */ });
  }

  var clips = Array.prototype.slice.call(document.querySelectorAll('video.loop'));
  clips.forEach(function (v) {
    v.removeAttribute('controls');
    v.userPaused = reduceMotion; // with reduced motion nothing moves until the viewer presses play
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'key clip-toggle';
    b.innerHTML = SVG_PLAY + SVG_PAUSE + LABEL;
    var update = function () {
      b.setAttribute('data-state', v.paused ? 'paused' : 'playing');
    };
    b.addEventListener('click', function () {
      if (v.paused) { v.userPaused = false; start(v); } else { v.userPaused = true; v.pause(); }
    });
    v.addEventListener('play', update);
    v.addEventListener('pause', update);
    v.parentNode.appendChild(b);
    update();
  });

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) { if (!v.userPaused) start(v); }
        else if (!v.paused) v.pause();
      });
    }, { threshold: 0.3 });
    clips.forEach(function (v) { io.observe(v); });
  } else if (!reduceMotion) {
    clips.forEach(start);
  }

  /* ---------------------------------------------------------------- screenshot viewer */

  var dialog = document.getElementById('lightbox');
  var shots = Array.prototype.slice.call(document.querySelectorAll('.shot-link'));
  if (dialog && typeof dialog.showModal === 'function' && shots.length) {
    var img = dialog.querySelector('.lb-img');
    var caption = dialog.querySelector('.lb-caption');
    var download = dialog.querySelector('.lb-download');
    var size = dialog.querySelector('.lb-size');
    var current = 0;

    var show = function (i) {
      current = (i + shots.length) % shots.length;
      var a = shots[current];
      var thumb = a.querySelector('img');
      img.src = a.getAttribute('data-view');
      img.alt = thumb.getAttribute('alt');
      var cap = a.parentNode.querySelector('figcaption');
      caption.innerHTML = cap ? cap.innerHTML : '';
      download.href = a.getAttribute('href');
      size.textContent = '(' + a.getAttribute('data-size') + ')';
    };

    shots.forEach(function (a, i) {
      a.addEventListener('click', function (e) {
        if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        show(i);
        dialog.showModal();
      });
    });
    dialog.querySelector('.lb-prev').addEventListener('click', function () { show(current - 1); });
    dialog.querySelector('.lb-next').addEventListener('click', function () { show(current + 1); });
    dialog.querySelector('.lb-close').addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { show(current - 1); e.preventDefault(); }
      else if (e.key === 'ArrowRight') { show(current + 1); e.preventDefault(); }
    });
    dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
  }
}());
