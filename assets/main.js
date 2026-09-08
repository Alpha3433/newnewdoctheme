/* ==========================================================================
   Frøya Organics landing page – interactions
   Replaces the theme/app scripts of the live page with a small dependency-free
   script (Blaze Slider is vendored separately for the carousels).
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var mqMobile = window.matchMedia('(max-width: 767px)');

  /* ------------------------------------------------------------------ header
     Expose the sticky header height as a CSS variable so anchored sections
     (product, reviews) leave room for it. */
  function syncHeaderHeight() {
    var bar = $('.froya-nav__bar');
    if (!bar) return;
    document.documentElement.style.setProperty('--header-height', bar.offsetHeight + 'px');
  }
  syncHeaderHeight();
  window.addEventListener('resize', syncHeaderHeight);

  /* -------------------------------------------------------------- mega menus */
  var nav = $('.froya-nav');
  if (nav) {
    var triggers = $$('.froya-nav__nav-link[data-mega-target]', nav);
    var panels = $$('.froya-nav__mega', nav);
    var closeMega = function () {
      panels.forEach(function (p) { p.classList.remove('is-open'); });
      triggers.forEach(function (t) { t.classList.remove('is-active'); t.setAttribute('aria-expanded', 'false'); });
    };
    triggers.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var target = btn.getAttribute('data-mega-target');
        var panel = nav.querySelector('.froya-nav__mega[data-mega-panel="' + target + '"]');
        var wasOpen = panel && panel.classList.contains('is-open');
        closeMega();
        if (panel && !wasOpen) {
          panel.classList.add('is-open');
          btn.classList.add('is-active');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
    document.addEventListener('click', function (e) { if (!nav.contains(e.target)) closeMega(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMega(); });
    window.addEventListener('scroll', function () {
      if (panels.some(function (p) { return p.classList.contains('is-open'); }) && window.scrollY > 240) closeMega();
    }, { passive: true });

    // "Add to cart" cards inside the menu go to the product page in this static recreation.
    $$('.froya-nav-card__cta[type="button"]', nav).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var card = btn.closest('.froya-nav-card');
        var link = card && card.querySelector('a[href]');
        if (link) window.location.href = link.href;
      });
    });
  }

  /* ------------------------------------------------------------ nav drawer */
  var drawer = $('.froya-nav-drawer');
  var burger = $('.froya-nav__burger');
  if (drawer && burger) {
    var setDrawer = function (open) {
      drawer.classList.toggle('is-open', open);
      drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.classList.toggle('drawer-open', open);
    };
    burger.addEventListener('click', function () { setDrawer(!drawer.classList.contains('is-open')); });
    $$('[data-drawer-close], .froya-nav-drawer__overlay', drawer).forEach(function (el) {
      el.addEventListener('click', function () { setDrawer(false); });
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setDrawer(false); });
  }

  /* --------------------------------------------------------- smooth anchors */
  function scrollToId(id) {
    var el = document.getElementById(id) || document.querySelector('[id$="__' + id + '"]') || document.querySelector('[id$="' + id + '"]');
    if (!el) return false;
    var offset = ($('.froya-nav__bar') || { offsetHeight: 0 }).offsetHeight + 8;
    var top = el.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top: top, behavior: 'smooth' });
    return true;
  }
  $$('[data-scroll-to], a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('data-scroll-to') || (a.getAttribute('href') || '').replace(/^#/, '');
      if (!id) return;
      if (scrollToId(id)) e.preventDefault();
    });
  });
  var heroContainer = $('[data-hero-link]');
  if (heroContainer) {
    heroContainer.addEventListener('click', function (e) {
      if (e.target.closest('a, button')) return;
      scrollToId(heroContainer.getAttribute('data-hero-link').replace(/^#/, ''));
    });
  }

  /* ---------------------------------------------------------------- sliders */
  function makeSlider(el, desktop, tablet, mobile, opts) {
    if (!el || typeof BlazeSlider === 'undefined') return null;
    var pagination = el.querySelector('.blaze-pagination');
    if (pagination) pagination.innerHTML = ''; // Blaze renders its own dots
    var config = {
      all: Object.assign({ slidesToShow: desktop, slideGap: '20px', loop: false, enablePagination: true, draggable: true, transitionDuration: 300 }, opts || {}),
      '(max-width: 999px)': { slidesToShow: tablet },
      '(max-width: 767px)': { slidesToShow: mobile, slideGap: '14px' }
    };
    try { return new BlazeSlider(el, config); } catch (err) { return null; }
  }
  makeSlider($('#icons-slider'), 6.1, 3.2, 1.6);
  makeSlider($('.s-reviews-slider__slider'), 5.5, 2.4, 1.15);
  makeSlider($('#videos-slider'), 5.5, 2.4, 1.15);

  /* -------------------------------------------------- lazy video playback
     Videos ship with data-sources / data-types; attach the source on demand. */
  function loadVideo(video) {
    if (!video || video.dataset.loaded) return;
    var srcs = (video.getAttribute('data-sources') || '').split(',');
    var types = (video.getAttribute('data-types') || '').split(',');
    srcs.forEach(function (s, i) {
      s = s.trim(); if (!s) return;
      if (s.indexOf('//') === 0) s = 'https:' + s;
      var source = document.createElement('source');
      source.src = s;
      if (types[i]) source.type = types[i].trim();
      video.appendChild(source);
    });
    video.dataset.loaded = '1';
    video.load();
  }
  $$('.s-videos-slider__video-item').forEach(function (item) {
    var video = item.querySelector('video');
    item.addEventListener('click', function (e) {
      if (item.classList.contains('is-playing')) return;
      e.preventDefault();
      loadVideo(video);
      item.classList.add('is-playing');
      video.play().catch(function () {});
    });
  });
  $$('.c-review-card__video-wrapper').forEach(function (wrap) {
    var video = wrap.querySelector('video');
    var preview = wrap.querySelector('.js-review-card__preview');
    if (!preview) return;
    preview.addEventListener('click', function () {
      loadVideo(video);
      wrap.classList.add('is-playing');
      video.play().catch(function () {});
    });
  });

  /* ------------------------------------------------- featured product gallery */
  var gallery = $('.js-featured-product__gallery');
  if (gallery) {
    var slides = $$('.s-featured-product__slide', gallery);
    var thumbs = $$('.s-featured-product__thumbnail', $('.js-featured-product__thumbnails') || gallery.parentNode);
    var current = Math.max(0, slides.findIndex(function (s) { return s.classList.contains('is-active'); }));
    var show = function (i) {
      current = (i + slides.length) % slides.length;
      slides.forEach(function (s, k) {
        var active = k === current;
        s.classList.toggle('is-active', active);
        var v = s.querySelector('video');
        if (v) {
          if (active) { loadVideo(v); } else { v.pause(); }
        }
      });
      thumbs.forEach(function (t, k) { t.classList.toggle('is-active', k === current); });
      var activeThumb = thumbs[current];
      var strip = activeThumb && activeThumb.parentNode;
      if (activeThumb && strip && strip.scrollWidth > strip.clientWidth) {
        // keep the active thumbnail visible by scrolling the strip only (never the page)
        var left = activeThumb.offsetLeft - (strip.clientWidth - activeThumb.offsetWidth) / 2;
        strip.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
      }
    };
    var prev = $('.js-arrow-prev', gallery), next = $('.js-arrow-next', gallery);
    if (prev) prev.addEventListener('click', function () { show(current - 1); });
    if (next) next.addEventListener('click', function () { show(current + 1); });
    thumbs.forEach(function (t, k) { t.addEventListener('click', function () { show(k); }); });
    // swipe
    var startX = null;
    gallery.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    gallery.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) show(dx < 0 ? current + 1 : current - 1);
      startX = null;
    });
    show(current);
  }

  /* -------------------------------------------------------- ingredients modal */
  var modal = $('#ingredients-modal');
  if (modal) {
    // Hoist out of the sticky gallery column so no ancestor stacking context can paint over it.
    document.body.appendChild(modal);
    var setModal = function (open) {
      // The markup ships with hidden="" and the theme's critical CSS keys off [open].
      if (open) { modal.removeAttribute('hidden'); modal.setAttribute('open', ''); }
      else { modal.removeAttribute('open'); modal.setAttribute('hidden', ''); }
      document.body.classList.toggle('modal-open', open);
    };
    $$('.js-view-ingredients').forEach(function (b) { b.addEventListener('click', function () { setModal(true); }); });
    $$('.s-main-product__modal-close, .js-close-ingredients-modal, .s-main-product__modal-overlay', modal).forEach(function (b) {
      b.addEventListener('click', function () { setModal(false); });
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setModal(false); });
  }

  /* --------------------------------------------------------------- buy box */
  var sub = $('c-subscription, .c-subscribtion');
  if (sub) {
    var toggle = $('.js-bbt-toggle', sub);
    var radios = $$('input[name="purchase_type"]', sub);
    var sellingPlan = $('.js-default-selling-plan', sub);
    var defaultPlan = sub.getAttribute('data-default-selling-plan') || (sellingPlan && sellingPlan.value) || '';
    var priceMain = $('.c-buybox-toggle__price--sub .product_price', sub);
    var priceOtp = $('.c-buybox-toggle__price--otp .product_price', sub);
    var buttonPrice = $('.c-subscribtion__add-to-cart .js-subscribtion__main-price .product_price', sub);
    var buttonCompare = $('.c-subscribtion__add-to-cart .igcp', sub);
    var compareText = buttonCompare ? buttonCompare.textContent : '';
    var setMode = function (subscription) {
      sub.classList.toggle('is-one-time', !subscription);
      if (toggle) toggle.setAttribute('aria-checked', subscription ? 'true' : 'false');
      radios.forEach(function (r) { r.checked = (r.value === 'subscription') === subscription; });
      if (sellingPlan) sellingPlan.value = subscription ? defaultPlan : '';
      if (buttonPrice) buttonPrice.textContent = (subscription ? priceMain : priceOtp || priceMain).textContent.trim();
      // The one-time price has no compare-at price, so only show the strike-through on the subscription price.
      if (buttonCompare) buttonCompare.textContent = subscription ? compareText : '';
    };
    if (toggle) toggle.addEventListener('click', function () { setMode(toggle.getAttribute('aria-checked') !== 'true'); });
    radios.forEach(function (r) { r.addEventListener('change', function () { setMode(r.value === 'subscription'); }); });
    setMode(!radios.length || radios.some(function (r) { return r.checked && r.value === 'subscription'; }));

    var form = $('form', sub);
    if (form) {
      form.addEventListener('submit', function (e) {
        // No storefront backend in this static recreation – hand off to the product page.
        e.preventDefault();
        var handle = sub.getAttribute('data-product-handle');
        if (handle) {
          var plan = sellingPlan && sellingPlan.value ? '&selling_plan=' + encodeURIComponent(sellingPlan.value) : '';
          window.location.href = '/products/' + handle + '?variant=' + encodeURIComponent(($('input[name="id"]', form) || {}).value || '') + plan;
        }
      });
    }
  }

  /* ---------------------------------------------- backed-by-science scroll spy */
  var bbsItems = $$('.s-backed-by-science__item');
  if (bbsItems.length && 'IntersectionObserver' in window) {
    var activateBbs = function (idx) {
      bbsItems.forEach(function (li, k) {
        li.classList.toggle('is-passed', k < idx);
        li.classList.toggle('is-active', k === idx);
      });
    };
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) activateBbs(bbsItems.indexOf(en.target));
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    bbsItems.forEach(function (li) { io.observe(li); });
    activateBbs(0);
  }

  /* --------------------------------------- lazy section backgrounds / bars */
  $$('[id^="section-"].s-icons-with-text').forEach(function (sec) { sec.setAttribute('data-bg-loaded', 'true'); });
  var fills = $$('.s-image-content-grid__progress-fill');
  if (fills.length && 'IntersectionObserver' in window) {
    fills.forEach(function (f) { f.dataset.width = f.style.width; f.style.width = '0%'; });
    var fio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.style.width = en.target.dataset.width; fio.unobserve(en.target); }
      });
    }, { threshold: 0.4 });
    fills.forEach(function (f) { fio.observe(f); });
  }

  /* ------------------------------------------------------------- newsletter */
  var newsletter = $('.s-newsletter__form');
  if (newsletter) {
    newsletter.addEventListener('submit', function () {
      var btn = $('.s-newsletter__button', newsletter);
      if (btn) { btn.disabled = true; btn.style.opacity = '0.7'; }
    });
  }

  /* ---------------------------------------------- cart count (static page) */
  var cartCount = $('.header__cart-count');
  if (cartCount && !cartCount.textContent.trim()) cartCount.textContent = '0';

  document.documentElement.classList.add('loaded');
})();
