/* ENOCI Bistro: header, drawer, pop-up, bottom bar, opening hours, booking message, menu chips. */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* header: the small logo takes over once the big wordmark has scrolled away */
  var header = $('.site-header');
  var mark = $('.hero-mark');
  if (header && mark && hasIO) {
    new IntersectionObserver(function (es) {
      header.classList.toggle('is-scrolled', !es[0].isIntersecting);
    }, { rootMargin: '-' + header.offsetHeight + 'px 0px 0px 0px' }).observe(mark);
  }

  /* drawer */
  var drawer = $('#drawer'), burger = $('.burger'), closeBtn = $('.drawer__close');
  function setDrawer(open, refocus) {
    if (!drawer) return;
    drawer.classList.toggle('is-open', open);
    if (open) { drawer.removeAttribute('inert'); drawer.removeAttribute('aria-hidden'); }
    else { drawer.setAttribute('inert', ''); drawer.setAttribute('aria-hidden', 'true'); }
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    d.body.classList.toggle('drawer-open', open);
    if (open) setTimeout(function () { closeBtn.focus(); }, 40);
    else if (refocus) burger.focus();
  }
  if (drawer && burger) {
    burger.addEventListener('click', function () { setDrawer(!drawer.classList.contains('is-open')); });
    closeBtn.addEventListener('click', function () { setDrawer(false, true); });
    $$('a', drawer).forEach(function (a) { a.addEventListener('click', function () { setDrawer(false); }); });
    d.addEventListener('keydown', function (e) {
      if (!drawer.classList.contains('is-open')) return;
      if (e.key === 'Escape') { setDrawer(false, true); return; }
      if (e.key !== 'Tab') return;
      var f = $$('a, button', drawer);
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && d.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    window.addEventListener('resize', function () { if (window.innerWidth >= 900 && drawer.classList.contains('is-open')) setDrawer(false); });
  }

  /* Arabic pop-up */
  var pop = $('#ar-pop');
  if (pop) {
    $$('[data-ar]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (typeof pop.showModal === 'function') { if (!pop.open) pop.showModal(); } else { pop.setAttribute('open', ''); }
      });
    });
    $('[data-pop-close]', pop).addEventListener('click', function () { if (pop.close) pop.close(); else pop.removeAttribute('open'); });
    pop.addEventListener('click', function (e) { if (e.target === pop && pop.close) pop.close(); });
  }

  /* bottom bar: appears once the hero button has gone, hides over the footer */
  var bb = $('.bar-bottom');
  if (bb) {
    var heroCta = $('.hero__cta'), footer = $('.footer'), past = !heroCta, covered = false;
    var sync = function () { bb.classList.toggle('is-in', past); bb.classList.toggle('is-covered', covered); };
    if (heroCta && hasIO) {
      new IntersectionObserver(function (es) { past = !es[0].isIntersecting && es[0].boundingClientRect.top < 0; sync(); }).observe(heroCta);
    }
    if (footer && hasIO) {
      new IntersectionObserver(function (es) { covered = es[0].isIntersecting; sync(); }, { threshold: 0 }).observe(footer);
    }
    sync();
  }

  /* reveals: text blocks only, visible by default without script */
  var rvs = $$('.rv');
  if (hasIO && !reduce) {
    var rio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    rvs.forEach(function (el) { rio.observe(el); });
  } else { rvs.forEach(function (el) { el.classList.add('in'); }); }

  /* opening hours: the bar sits where the clock is, in Cairo time */
  function cairoNow() {
    try {
      var p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
      var o = {};
      p.forEach(function (x) { o[x.type] = x.value; });
      return { iso: o.year + '-' + o.month + '-' + o.day, min: (parseInt(o.hour, 10) % 24) * 60 + parseInt(o.minute, 10) };
    } catch (err) {
      var n = new Date(), pad = function (v) { return (v < 10 ? '0' : '') + v; };
      return { iso: n.getFullYear() + '-' + pad(n.getMonth() + 1) + '-' + pad(n.getDate()), min: n.getHours() * 60 + n.getMinutes() };
    }
  }
  $$('[data-hours]').forEach(function (el) {
    var m = cairoNow().min, pos = 0, state = 'Opens at 9 AM';
    if (m >= 540) { pos = Math.min(1, (m - 540) / 960); state = 'Open now'; }
    else if (m < 60) { pos = (m + 1440 - 540) / 960; state = 'Open now'; }
    var st = $('[data-hours-state]', el);
    if (st) st.textContent = state;
    window.setTimeout(function () { el.style.setProperty('--now', pos.toFixed(3)); }, 250);
  });

  /* booking: writes the message, you send it by email or call */
  var form = $('#book-form');
  if (form) {
    var el = form.elements, out = $('#msg-text'), err = $('#msg-err'), mail = $('#send-mail'), copy = $('#copy-msg');
    var now = cairoNow();
    el.date.min = now.iso;
    var pickDate = function () {
      var iso = now.iso;
      if (now.min >= 22 * 60) {
        var p = iso.split('-'), t = new Date(+p[0], +p[1] - 1, +p[2] + 1);
        iso = t.getFullYear() + '-' + ('0' + (t.getMonth() + 1)).slice(-2) + '-' + ('0' + t.getDate()).slice(-2);
      }
      return iso;
    };
    el.date.value = pickDate();
    var timeOpts = $$('option', el.time);
    var syncTimes = function () {
      var today = el.date.value === now.iso;
      timeOpts.forEach(function (o) {
        if (!o.value) return;
        var parts = o.value.split(':'), mins = +parts[0] * 60 + +parts[1];
        if (mins < 60) mins += 1440;
        var cur = now.min < 60 ? now.min + 1440 : now.min;
        o.disabled = today && mins <= cur;
      });
      if (el.time.selectedOptions[0] && el.time.selectedOptions[0].disabled) el.time.value = '';
    };
    syncTimes();
    if (!el.time.value) {
      var pref = timeOpts.filter(function (o) { return o.value === '20:00' && !o.disabled; })[0] || timeOpts.filter(function (o) { return o.value && !o.disabled; })[0];
      if (pref) el.time.value = pref.value;
    }
    var dateLabel = function (iso) {
      if (!iso) return '';
      var p = iso.split('-');
      return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    };
    var build = function () {
      var name = el.guest.value.trim();
      var dt = dateLabel(el.date.value) || '(pick a date)';
      var tm = el.time.value ? el.time.options[el.time.selectedIndex].text : '(pick a time)';
      var g = el.guests.value, gtxt = g === '13' ? '13 or more people' : (g === '1' ? '1 person' : g + ' people');
      var seat = el.seat.value === 'terrace' ? 'on the terrace' : (el.seat.value === 'inside' ? 'inside' : 'on the terrace or inside, whichever is free');
      return "Hi ENOCI, I'd like to book a table for " + gtxt + ' on ' + dt + ' at ' + tm + ', ' + seat + '. My name is ' + (name || '(your name)') + '. Could you confirm? Thank you!';
    };
    var refresh = function () {
      var msg = build();
      out.textContent = msg;
      var g = el.guests.value;
      mail.setAttribute('href', 'mailto:Info@enocibistro.com?subject=' + encodeURIComponent('Table request for ' + (g === '13' ? '13 or more' : g) + ', ' + (dateLabel(el.date.value) || '')) + '&body=' + encodeURIComponent(msg));
      return msg;
    };
    var missing = function () {
      var m = [];
      if (!el.guest.value.trim()) m.push(el.guest);
      if (!el.date.value) m.push(el.date);
      if (!el.time.value) m.push(el.time);
      return m;
    };
    ['input', 'change'].forEach(function (ev) {
      form.addEventListener(ev, function (e) {
        if (e.target === el.date) syncTimes();
        err.textContent = '';
        $$('[aria-invalid]', form).forEach(function (x) { x.removeAttribute('aria-invalid'); });
        refresh();
      });
    });
    var guard = function (e) {
      var m = missing();
      if (!m.length) return true;
      e.preventDefault();
      m.forEach(function (x) { x.setAttribute('aria-invalid', 'true'); });
      err.textContent = 'Add your name, a date and a time first.';
      m[0].focus();
      return false;
    };
    mail.addEventListener('click', function (e) {
      if (guard(e)) err.textContent = 'Your email app should open. If it does not, copy the message and send it to Info@enocibistro.com.';
    });
    copy.addEventListener('click', function (e) {
      if (!guard(e)) return;
      var msg = refresh(), done = function () { copy.textContent = 'Copied'; window.setTimeout(function () { copy.textContent = 'Copy message'; }, 2200); };
      if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(msg).then(done, done); }
      else {
        var ta = d.createElement('textarea'); ta.value = msg; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
        d.body.appendChild(ta); ta.select();
        try { d.execCommand('copy'); } catch (x) { /* nothing to do */ }
        d.body.removeChild(ta); done();
      }
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    refresh();
  }

  /* menu chips: scroll-spy with the bar under the active chip */
  var chips = $('.chips');
  if (chips) {
    var links = $$('.chip', chips), scroller = $('.chips__scroll', chips);
    var secs = links.map(function (l) { return d.getElementById(l.hash.slice(1)); });
    var lock = 0;
    var setActive = function (id) {
      links.forEach(function (l) {
        var on = l.hash === '#' + id;
        if (on) { l.setAttribute('aria-current', 'true'); } else { l.removeAttribute('aria-current'); }
        if (on) scroller.scrollTo({ left: l.offsetLeft - (scroller.clientWidth - l.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
      });
    };
    links.forEach(function (l) {
      l.addEventListener('click', function () { lock = Date.now() + 900; setActive(l.hash.slice(1)); });
    });
    var spy = null, headSpy = null;
    var arm = function () {
      if (!hasIO) return;
      if (spy) spy.disconnect();
      if (headSpy) headSpy.disconnect();
      var top = chips.offsetHeight + 24;
      var bottom = Math.max(0, window.innerHeight - top - 4);
      spy = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting && Date.now() > lock) setActive(e.target.id); });
      }, { rootMargin: '-' + top + 'px 0px -' + bottom + 'px 0px', threshold: 0 });
      secs.forEach(function (s) { if (s) spy.observe(s); });
      var head = $('.m-head');
      if (head) headSpy = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting && Date.now() > lock) setActive(secs[0].id);
      }, { rootMargin: '-' + top + 'px 0px -' + bottom + 'px 0px', threshold: 0 }).observe(head);
    };
    arm();
    window.addEventListener('resize', arm);
    setActive(window.location.hash && d.getElementById(window.location.hash.slice(1)) ? window.location.hash.slice(1) : secs[0].id);
  }
})();
