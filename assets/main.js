/* ==========================================================================
   Elaren landing theme – interactions
   Dependency-free (Blaze Slider is vendored separately for the carousels).
   Everything is initialised per section so the Shopify theme editor can
   re-render a section (shopify:section:load) without a page reload.
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var once = function (el, key) {
    if (!el || el.dataset[key]) return false;
    el.dataset[key] = '1';
    return true;
  };
  var rootUrl = function () {
    var r = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
    return r.charAt(r.length - 1) === '/' ? r : r + '/';
  };

  /* ================================================================ cart */
  var Cart = {
    drawer: function () { return document.getElementById('mini-cart'); },
    sectionId: function () { var d = this.drawer(); return d ? d.getAttribute('data-section-id') : null; },
    isOpen: function () { var d = this.drawer(); return !!(d && d.hasAttribute('open')); },
    open: function () {
      var d = this.drawer();
      if (!d) { window.location.href = rootUrl() + 'cart'; return; }
      d.removeAttribute('hidden');
      // next frame so the slide-in transition runs
      window.requestAnimationFrame(function () { d.setAttribute('open', ''); d.classList.add('is-open'); });
      document.body.classList.add('cart-open');
      $$('.js-cart-toggle').forEach(function (b) { b.setAttribute('aria-expanded', 'true'); });
      var close = $('[data-cart-close].drawer__close-button', d);
      if (close) close.focus({ preventScroll: true });
    },
    close: function () {
      var d = this.drawer();
      if (!d) return;
      d.removeAttribute('open'); d.classList.remove('is-open');
      document.body.classList.remove('cart-open');
      $$('.js-cart-toggle').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
      window.setTimeout(function () { if (!d.hasAttribute('open')) d.setAttribute('hidden', ''); }, 350);
    },
    setLoading: function (on) {
      var d = this.drawer();
      if (d) d.classList.toggle('is-loading', !!on);
    },
    announce: function (msg) {
      var s = $('[data-cart-status]', this.drawer());
      if (s) s.textContent = msg || '';
    },
    updateCount: function (count) {
      $$('[data-cart-count-bubble]').forEach(function (b) {
        b.textContent = count;
        b.classList.toggle('hidden', !count);
      });
    },
    render: function (html) {
      var d = this.drawer();
      if (!d || !html) return;
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var fresh = doc.getElementById('mini-cart');
      if (!fresh) return;
      ['[data-cart-title]', '[data-cart-content]', '[data-cart-footer]'].forEach(function (sel) {
        var a = $(sel, d), b = $(sel, fresh);
        if (a && b) {
          a.innerHTML = b.innerHTML;
          a.className = b.className;
          if (b.hasAttribute('hidden')) a.setAttribute('hidden', ''); else a.removeAttribute('hidden');
        }
      });
      var count = parseInt(fresh.getAttribute('data-cart-count') || '0', 10);
      d.setAttribute('data-cart-count', count);
      this.updateCount(count);
      initCartDrawer(d);
    },
    request: function (path, options) {
      options = options || {};
      options.headers = Object.assign({ Accept: 'application/json' }, options.headers || {});
      options.credentials = 'same-origin';
      return fetch(rootUrl() + path, options).then(function (res) {
        return res.json().then(function (json) {
          if (!res.ok) throw new Error(json.description || json.message || 'Something went wrong. Please try again.');
          return json;
        });
      });
    },
    refresh: function () {
      var id = this.sectionId();
      if (!id) return Promise.resolve();
      var self = this;
      return fetch(rootUrl() + '?sections=' + encodeURIComponent(id), { credentials: 'same-origin' })
        .then(function (r) { return r.json(); })
        .then(function (json) { self.render(json[id]); });
    },
    addForm: function (form) {
      var id = this.sectionId();
      var data = new FormData(form);
      if (id) data.append('sections', id);
      var self = this;
      this.setLoading(true);
      return this.request('cart/add.js', { method: 'POST', body: data }).then(function (json) {
        if (id && json.sections && json.sections[id]) self.render(json.sections[id]);
        else return self.refresh();
      }).then(function () {
        self.setLoading(false);
        self.announce('Added to cart');
        self.open();
      }).catch(function (err) {
        self.setLoading(false);
        throw err;
      });
    },
    addItems: function (items) {
      var id = this.sectionId();
      var self = this;
      return this.request('cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: items, sections: id })
      }).then(function (json) {
        if (id && json.sections && json.sections[id]) self.render(json.sections[id]);
        else return self.refresh();
      });
    },
    change: function (payload) {
      var id = this.sectionId();
      var self = this;
      payload.sections = id;
      this.setLoading(true);
      return this.request('cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (json) {
        if (id && json.sections && json.sections[id]) self.render(json.sections[id]);
        else return self.refresh();
      }).then(function () { self.setLoading(false); })
        .catch(function (err) { self.setLoading(false); self.announce(err.message); return self.refresh(); });
    }
  };
  window.ElarenCart = Cart;

  function showFormError(form, message) {
    var box = $('[data-form-error]', form);
    if (!box) {
      box = document.createElement('p');
      box.className = 'c-subscribtion__error';
      box.setAttribute('data-form-error', '');
      form.appendChild(box);
    }
    box.textContent = message || '';
    if (message) box.removeAttribute('hidden'); else box.setAttribute('hidden', '');
  }

  // Product forms anywhere on the page (buy box, menu cards, drawer upsells) add in place and open the drawer.
  document.addEventListener('submit', function (e) {
    var form = e.target.closest('form.js-ajax-add');
    if (!form || !window.fetch) return;
    e.preventDefault();
    var button = $('button[type="submit"]', form);
    if (button) { button.disabled = true; button.classList.add('is-loading'); }
    showFormError(form, '');
    Cart.addForm(form).catch(function (err) {
      showFormError(form, err.message);
    }).then(function () {
      if (button) { button.disabled = false; button.classList.remove('is-loading'); }
    });
  });

  document.addEventListener('click', function (e) {
    var toggle = e.target.closest('.js-cart-toggle');
    if (toggle && Cart.drawer()) { e.preventDefault(); Cart.isOpen() ? Cart.close() : Cart.open(); return; }
    if (e.target.closest('[data-cart-close]')) { e.preventDefault(); Cart.close(); return; }

    var remove = e.target.closest('[data-cart-remove]');
    if (remove) {
      e.preventDefault();
      Cart.change({ line: parseInt(remove.getAttribute('data-cart-remove'), 10), quantity: 0 });
      return;
    }
    var qty = e.target.closest('[data-cart-qty]');
    if (qty) {
      e.preventDefault();
      Cart.change({ line: parseInt(qty.getAttribute('data-cart-qty'), 10), quantity: parseInt(qty.getAttribute('data-cart-qty-value'), 10) });
      return;
    }
    var prev = e.target.closest('[data-rec-prev]'), next = e.target.closest('[data-rec-next]');
    if (prev || next) {
      var scroller = $('[data-rec-scroller]', Cart.drawer());
      if (scroller) scroller.scrollBy({ left: (prev ? -1 : 1) * Math.max(160, scroller.clientWidth * 0.8), behavior: 'smooth' });
    }
  });

  document.addEventListener('change', function (e) {
    var toggle = e.target.closest('[data-cart-plan-toggle]');
    if (!toggle) return;
    var line = parseInt(toggle.getAttribute('data-line'), 10);
    var quantity = parseInt(toggle.getAttribute('data-quantity'), 10) || 1;
    var label = toggle.closest('.subscription-toggle');
    if (label) label.setAttribute('aria-checked', toggle.checked ? 'true' : 'false');
    if (toggle.checked) {
      Cart.change({ line: line, quantity: quantity, selling_plan: toggle.getAttribute('data-selling-plan-id') });
    } else {
      // Switch back to a one-time purchase: drop the subscription line and re-add the variant without a plan.
      var variantId = parseInt(toggle.getAttribute('data-variant-id'), 10);
      Cart.setLoading(true);
      Cart.request('cart/change.js', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ line: line, quantity: 0 }) })
        .then(function () { return Cart.addItems([{ id: variantId, quantity: quantity }]); })
        .then(function () { Cart.setLoading(false); })
        .catch(function (err) { Cart.setLoading(false); Cart.announce(err.message); Cart.refresh(); });
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && Cart.isOpen()) Cart.close();
  });

  function initCartDrawer(drawer) {
    if (!drawer) return;
    var scroller = $('[data-rec-scroller]', drawer);
    var arrows = $$('[data-rec-prev], [data-rec-next]', drawer);
    if (scroller && arrows.length) {
      var overflow = scroller.scrollWidth > scroller.clientWidth + 4;
      arrows.forEach(function (a) { a.style.display = overflow ? '' : 'none'; });
    }
  }

  /* ============================================================== header */
  function syncHeaderHeight() {
    var bar = $('.froya-nav__bar');
    if (!bar) return;
    document.documentElement.style.setProperty('--header-height', bar.offsetHeight + 'px');
  }
  window.addEventListener('resize', syncHeaderHeight);

  function initHeader(root) {
    var nav = $('.froya-nav', root);
    if (nav && once(nav, 'init')) {
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
    }

    var drawer = $('.froya-nav-drawer', root);
    var burger = $('.froya-nav__burger', root);
    if (drawer && burger && once(drawer, 'init')) {
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
    syncHeaderHeight();
  }

  /* ====================================================== smooth anchors */
  function scrollToId(id) {
    var el = document.getElementById(id) || document.querySelector('[id$="__' + id + '"]') || document.querySelector('[id$="' + id + '"]');
    if (!el) return false;
    var offset = ($('.froya-nav__bar') || { offsetHeight: 0 }).offsetHeight + 8;
    var top = el.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top: top, behavior: 'smooth' });
    return true;
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-scroll-to], a[href^="#"]');
    if (!a || a.closest('#mini-cart')) return;
    var id = a.getAttribute('data-scroll-to') || (a.getAttribute('href') || '').replace(/^#/, '');
    if (!id) return;
    if (scrollToId(id)) e.preventDefault();
  });
  function initHero(root) {
    var heroContainer = $('[data-hero-link]', root);
    if (heroContainer && once(heroContainer, 'init')) {
      heroContainer.addEventListener('click', function (e) {
        if (e.target.closest('a, button')) return;
        scrollToId(heroContainer.getAttribute('data-hero-link').replace(/^#/, ''));
      });
    }
  }

  /* ============================================================= sliders */
  function makeSlider(el, desktop, tablet, mobile, opts) {
    if (!el || typeof BlazeSlider === 'undefined' || !once(el, 'blaze')) return null;
    var pagination = el.querySelector('.blaze-pagination');
    if (pagination) pagination.innerHTML = ''; // Blaze renders its own dots
    var config = {
      all: Object.assign({ slidesToShow: desktop, slideGap: '20px', loop: false, enablePagination: true, draggable: true, transitionDuration: 300 }, opts || {}),
      '(max-width: 999px)': { slidesToShow: tablet },
      '(max-width: 767px)': { slidesToShow: mobile, slideGap: '14px' }
    };
    try { return new BlazeSlider(el, config); } catch (err) { return null; }
  }
  function initSliders(root) {
    $$('.s-icons-slider__slider', root).forEach(function (el) { makeSlider(el, 6.1, 3.2, 1.6); });
    $$('.s-reviews-slider__slider', root).forEach(function (el) { makeSlider(el, 5.5, 2.4, 1.15); });
    $$('.s-videos-slider__slider', root).forEach(function (el) { makeSlider(el, 5.5, 2.4, 1.15); });
  }

  /* ------------------------------------------------------ lazy videos
     Videos may ship with data-sources / data-types; attach the source on demand.
     Uploaded (Shopify-hosted) videos already carry <source> tags. */
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
    if (srcs.join('').trim()) video.load();
  }
  function initVideos(root) {
    $$('.s-videos-slider__video-item', root).forEach(function (item) {
      if (!once(item, 'init')) return;
      var video = item.querySelector('video');
      item.addEventListener('click', function (e) {
        if (item.classList.contains('is-playing')) return;
        e.preventDefault();
        loadVideo(video);
        item.classList.add('is-playing');
        if (video) video.play().catch(function () {});
      });
    });
    $$('.c-review-card__video-wrapper', root).forEach(function (wrap) {
      if (!once(wrap, 'init')) return;
      var video = wrap.querySelector('video');
      var preview = wrap.querySelector('.js-review-card__preview');
      if (!preview) return;
      preview.addEventListener('click', function () {
        loadVideo(video);
        wrap.classList.add('is-playing');
        if (video) video.play().catch(function () {});
      });
    });
    $$('.js-review-card__read-more, .js-review-card__read-less', root).forEach(function (btn) {
      if (!once(btn, 'init')) return;
      btn.addEventListener('click', function () {
        var text = btn.closest('.js-review-card__text');
        if (!text) return;
        var truncated = text.querySelector('[data-text="truncated"]'), full = text.querySelector('[data-text="full"]');
        var showFull = btn.classList.contains('js-review-card__read-more');
        if (truncated) truncated.classList.toggle('is-hidden', showFull);
        if (full) full.classList.toggle('is-hidden', !showFull);
      });
    });
  }

  /* ============================================== featured product gallery */
  function initGallery(root) {
    var gallery = $('.js-featured-product__gallery', root);
    if (!gallery || !once(gallery, 'init')) return;
    var slides = $$('.s-featured-product__slide', gallery);
    var strip = $('.js-featured-product__thumbnails', root) || gallery.parentNode;
    var thumbs = $$('.s-featured-product__thumbnail', strip);
    var current = Math.max(0, slides.findIndex(function (s) { return s.classList.contains('is-active'); }));
    var show = function (i) {
      if (!slides.length) return;
      current = (i + slides.length) % slides.length;
      slides.forEach(function (s, k) {
        var active = k === current;
        s.classList.toggle('is-active', active);
        var v = s.querySelector('video');
        if (v) { if (active) loadVideo(v); else v.pause(); }
      });
      thumbs.forEach(function (t, k) { t.classList.toggle('is-active', k === current); });
      var activeThumb = thumbs[current];
      if (activeThumb && strip && strip.scrollWidth > strip.clientWidth) {
        var left = activeThumb.offsetLeft - (strip.clientWidth - activeThumb.offsetWidth) / 2;
        strip.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
      }
    };
    var prev = $('.js-arrow-prev', gallery), next = $('.js-arrow-next', gallery);
    if (prev) prev.addEventListener('click', function () { show(current - 1); });
    if (next) next.addEventListener('click', function () { show(current + 1); });
    thumbs.forEach(function (t, k) { t.addEventListener('click', function () { show(k); }); });
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

  /* ===================================================== ingredients modal */
  function initModal(root) {
    var modal = $('#ingredients-modal', root) || (root === document ? $('#ingredients-modal') : null);
    var openers = $$('.js-view-ingredients', root);
    if (!modal || !once(modal, 'init')) return;
    // Hoist out of the sticky gallery column so no ancestor stacking context can paint over it.
    document.body.appendChild(modal);
    var setModal = function (open) {
      if (open) { modal.removeAttribute('hidden'); modal.setAttribute('open', ''); }
      else { modal.removeAttribute('open'); modal.setAttribute('hidden', ''); }
      document.body.classList.toggle('modal-open', open);
    };
    openers.forEach(function (b) { b.addEventListener('click', function () { setModal(true); }); });
    $$('.s-main-product__modal-close, .js-close-ingredients-modal, .s-main-product__modal-overlay', modal).forEach(function (b) {
      b.addEventListener('click', function () { setModal(false); });
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setModal(false); });
    modal.setAttribute('data-for-section', (root.getAttribute && root.getAttribute('data-section-id')) || '');
  }

  /* ============================================================= buy box */
  function initBuyBox(root) {
    var sub = $('c-subscription, .c-subscribtion', root);
    if (!sub || !once(sub, 'init')) return;
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
      if (buttonPrice) buttonPrice.textContent = ((subscription ? priceMain : priceOtp) || priceMain || { textContent: '' }).textContent.trim();
      // The one-time price has no compare-at price, so only show the strike-through on the subscription price.
      if (buttonCompare) buttonCompare.textContent = subscription ? compareText : '';
    };
    if (toggle) toggle.addEventListener('click', function () { setMode(toggle.getAttribute('aria-checked') !== 'true'); });
    radios.forEach(function (r) { r.addEventListener('change', function () { setMode(r.value === 'subscription'); }); });
    setMode(!!defaultPlan && (!radios.length || radios.some(function (r) { return r.checked && r.value === 'subscription'; })));
  }

  /* ============================================ backed-by-science scroll spy */
  function initScience(root) {
    var bbsItems = $$('.s-backed-by-science__item', root);
    if (!bbsItems.length || !('IntersectionObserver' in window) || !once(bbsItems[0], 'init')) return;
    var activateBbs = function (idx) {
      bbsItems.forEach(function (li, k) {
        li.classList.toggle('is-passed', k < idx);
        li.classList.toggle('is-active', k === idx);
      });
    };
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) activateBbs(bbsItems.indexOf(en.target)); });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    bbsItems.forEach(function (li) { io.observe(li); });
    activateBbs(0);
  }

  /* ============================================ animated result bars */
  function initBars(root) {
    var fills = $$('.s-image-content-grid__progress-fill', root).filter(function (f) { return once(f, 'init'); });
    if (!fills.length) return;
    if (!('IntersectionObserver' in window)) return;
    fills.forEach(function (f) { f.dataset.width = f.style.width; f.style.width = '0%'; });
    var fio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.style.width = en.target.dataset.width; fio.unobserve(en.target); }
      });
    }, { threshold: 0.4 });
    fills.forEach(function (f) { fio.observe(f); });
  }

  /* ============================================================ newsletter */
  function initNewsletter(root) {
    $$('.s-newsletter__form', root).forEach(function (form) {
      if (!once(form, 'init')) return;
      form.addEventListener('submit', function () {
        var btn = $('.s-newsletter__button', form);
        if (btn) { btn.disabled = true; btn.style.opacity = '0.7'; }
      });
    });
  }

  /* ================================================================ init */
  function initSection(root) {
    root = root || document;
    initHeader(root);
    initHero(root);
    initSliders(root);
    initVideos(root);
    initGallery(root);
    initModal(root);
    initBuyBox(root);
    initScience(root);
    initBars(root);
    initNewsletter(root);
    initCartDrawer($('#mini-cart', root) || (root === document ? Cart.drawer() : null));
  }

  function boot() {
    initSection(document);
    if (Cart.drawer()) Cart.updateCount(parseInt(Cart.drawer().getAttribute('data-cart-count') || '0', 10));
    document.documentElement.classList.add('loaded');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  // Theme editor: re-initialise a section after it is re-rendered, and open drawers when selected.
  document.addEventListener('shopify:section:load', function (e) {
    var old = document.querySelector('#ingredients-modal[data-for-section]');
    if (old && e.target.querySelector('.js-view-ingredients')) old.parentNode.removeChild(old);
    initSection(e.target);
  });
  document.addEventListener('shopify:section:select', function (e) {
    if (e.target.querySelector('#mini-cart')) Cart.open();
  });
  document.addEventListener('shopify:section:deselect', function (e) {
    if (e.target.querySelector('#mini-cart')) Cart.close();
  });
})();
