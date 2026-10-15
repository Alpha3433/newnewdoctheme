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

  function readFlag(key) { try { return window.sessionStorage.getItem(key); } catch (err) { return null; } }
  function writeFlag(key, value) { try { window.sessionStorage.setItem(key, value); } catch (err) { /* private mode */ } }
  function readStored(key) { try { return window.localStorage.getItem(key); } catch (err) { return null; } }
  function writeStored(key, value) { try { window.localStorage.setItem(key, value); } catch (err) { /* private mode */ } }
  var GIFT_DECLINED_KEY = 'elaren:gift-declined';
  // The line property Kaching Subscriptions' free-gift discount looks for (see Cart.giftProperties).
  var KACHING_GIFT_PROP = '__kaching_subs_gift';
  /* The Kaching Bundles deal behind the buy box's bundle tiers ("Bundle", deal 5kg3), bar for bar.
     Kaching's discount prices one-time bottles from the quantity alone, but bottles on a
     subscription only get it when they sit in the cart the way Kaching's own widget adds them: the
     paid bottles and the free ones on two lines, both tagged __kaching_bundles with the deal, the
     bar and a bundle id they share, the free line also flagged bxgy. Cart.reconcileBundles keeps
     subscription lines in that shape. The bar ids are Kaching's own and only change if a bar is
     deleted and re-created in Kaching - then update them here (an order placed through Kaching's
     widget shows them in its __kaching_bundles line property). */
  var KACHING_BUNDLE_PROP = '__kaching_bundles';
  /* Each bar also names the Kaching Subscriptions plan its bottles renew on, so a bundle sold as a
     3- or 6-month supply is billed and shipped every 3 or 6 months, not every month. Bottles that
     fill no bar renew on basePlan. The buy box and the cart both take the plan from here
     (dealPlanFor), whichever way the subscription went in: the buy box, the drawer's Subscribe &
     save switch, or a quantity change in the drawer. Plan ids are in the plan URLs in Kaching
     Subscriptions; every one must be attached to the serum and carry the free gift. */
  var KACHING_DEAL = {
    id: '5kg3',
    productId: 9704313225573, // Elaren Pumpkin Seed Oil Serum
    basePlan: '1039991141', // Plan #1: every month, 10% off
    // Biggest first: bottles are laid out for the biggest bar they fill.
    bars: [
      { id: 'RANr', buy: 3, get: 3, plan: '1052803429' }, // Buy 3, Get 3 Free -> Plan #3: every 6 months
      { id: 'dWFI', buy: 2, get: 1, plan: '1052770661' }  // Buy 2, Get 1 Free -> Plan #2: every 3 months
    ]
  };
  var dealBar = function (quantity) {
    return KACHING_DEAL.bars.filter(function (bar) { return quantity >= bar.buy + bar.get; })[0] || null;
  };
  // The plan a subscription of `quantity` bottles of the deal product renews on.
  var dealPlanFor = function (quantity) {
    var bar = dealBar(quantity);
    return String(bar ? bar.plan : KACHING_DEAL.basePlan);
  };
  var dealPlans = function () {
    return [String(KACHING_DEAL.basePlan)].concat(KACHING_DEAL.bars.map(function (bar) { return String(bar.plan); }));
  };

  /* ================================================================ cart */
  // A cart request that gets no answer within this long fails, so a dropped connection can never
  // leave the drawer greyed out for good.
  var CART_TIMEOUT = 20000;
  var CART_ERROR = 'Something went wrong. Please try again.';
  var totalQuantity = function (lines) { return lines.reduce(function (total, line) { return total + line.quantity; }, 0); };
  var planOf = function (item) { return item.selling_plan_allocation ? item.selling_plan_allocation.selling_plan.id : ''; };

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
      if (!d) return;
      d.classList.toggle('is-loading', !!on);
      if (on) d.setAttribute('aria-busy', 'true'); else d.removeAttribute('aria-busy');
    },
    announce: function (msg) {
      var s = $('[data-cart-status]', this.drawer());
      if (s) s.textContent = msg || '';
    },
    // A change the drawer could not make is shown under the title until the next change starts.
    showError: function (msg) {
      var box = $('[data-cart-error]', this.drawer());
      if (!box) return;
      box.textContent = msg || '';
      box.hidden = !msg;
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
      // Remember where the free-shipping bar stood so the fresh markup can animate from it.
      var oldBar = $('[data-cart-shipping]', d);
      var oldProgress = oldBar ? parseInt(oldBar.getAttribute('data-progress') || '0', 10) : null;
      var wasReached = !!(oldBar && oldBar.getAttribute('data-reached') === 'true');
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
      this.animateShipping(oldProgress, wasReached);
      initCartDrawer(d);
    },
    /* The drawer is re-rendered as a whole after every cart change, which would snap the
       free-shipping bar straight to its new width. Start it at the previous width and let the CSS
       transition carry it to the new one, and pop the copy once when the threshold is first
       crossed so the switch to "eligible for FREE SHIPPING" is noticed. */
    animateShipping: function (oldProgress, wasReached) {
      var bar = $('[data-cart-shipping]', this.drawer());
      if (!bar) return;
      var fill = $('.free-shipping__progress', bar);
      var progress = parseInt(bar.getAttribute('data-progress') || '0', 10);
      var reached = bar.getAttribute('data-reached') === 'true';
      if (fill && oldProgress !== null && oldProgress !== progress) {
        fill.style.transition = 'none';
        fill.style.width = oldProgress + '%';
        void fill.offsetWidth; // flush so the next width change transitions
        fill.style.transition = '';
        fill.style.width = progress + '%';
      }
      if (reached && !wasReached && oldProgress !== null) {
        bar.classList.add('is-unlocking');
        window.setTimeout(function () { bar.classList.remove('is-unlocking'); }, 700);
      }
    },
    request: function (path, options) {
      options = options || {};
      options.headers = Object.assign({ Accept: 'application/json' }, options.headers || {});
      options.credentials = 'same-origin';
      if (!options.method) options.cache = 'no-store'; // reads must see the cart as it is now
      var controller = typeof window.AbortController === 'function' ? new window.AbortController() : null;
      var timer = controller ? window.setTimeout(function () { controller.abort(); }, CART_TIMEOUT) : null;
      if (controller) options.signal = controller.signal;
      return fetch(rootUrl() + path, options)
        .then(function (res) { return res.text().then(function (text) { return { res: res, text: text }; }); })
        .then(function (reply) {
          window.clearTimeout(timer);
          var json = null;
          try { json = reply.text ? JSON.parse(reply.text) : {}; } catch (err) { /* an HTML error page, e.g. too many requests */ }
          if (reply.res.ok && json) return json;
          throw new Error((json && (json.description || json.message)) || CART_ERROR);
        }, function () {
          window.clearTimeout(timer);
          throw new Error(CART_ERROR); // offline, or no answer within CART_TIMEOUT
        });
    },
    refresh: function () {
      var id = this.sectionId();
      if (!id) return Promise.resolve();
      var self = this;
      return this.request('?sections=' + encodeURIComponent(id)).then(function (json) { self.render(json[id]); });
    },
    fetchCart: function () {
      return this.request('cart.js');
    },
    // Every cart write goes through here. It asks for the drawer's markup along with the change
    // (unless the write is only a step on the way) so the change can draw the drawer from its last
    // write without another request - see run.
    write: function (path, body, withMarkup) {
      var id = withMarkup === false ? null : this.sectionId();
      var isForm = typeof FormData !== 'undefined' && body instanceof FormData;
      if (id) { if (isForm) body.append('sections', id); else body.sections = id; }
      var options = { method: 'POST', body: isForm ? body : JSON.stringify(body) };
      if (!isForm) options.headers = { 'Content-Type': 'application/json' };
      var self = this;
      this.writes++;
      this.html = null;
      return this.request(path, options).then(function (json) {
        self.html = (id && json.sections && json.sections[id]) || null;
        return json;
      });
    },

    /* Cart changes run one at a time, in the order they were asked for. Each one reads the cart it
       works on, and some take several requests, so two at once (a second tap on the switch, the
       page-load tidy-up still going when the shopper opens the drawer) would each rewrite a cart the
       other is halfway through - and draw the drawer from it. The drawer is drawn once per change,
       from the cart as it stands when the change is done, and not at all while another change is
       waiting behind it, since that one draws it again. A quiet change (the page-load tidy-up) only
       draws the drawer if it changed the cart. */
    queue: Promise.resolve(),
    waiting: 0,
    writes: 0,
    html: null,
    needsDraw: false,
    run: function (task, quiet) {
      var self = this;
      this.waiting++;
      if (!quiet) this.setLoading(true);
      var job = this.queue.then(function () {
        var writesBefore = self.writes;
        self.html = null;
        if (!quiet) self.showError('');
        return Promise.resolve().then(task).then(function (value) {
          return { value: value, changed: self.writes !== writesBefore };
        }, function (error) {
          return { error: error || new Error(CART_ERROR), changed: true };
        });
      }).then(function (outcome) {
        self.needsDraw = self.needsDraw || outcome.changed || !quiet;
        var draw = null, html = self.html;
        if (self.waiting === 1 && self.needsDraw) {
          self.needsDraw = false;
          draw = html ? Promise.resolve().then(function () { self.render(html); }) : self.refresh();
        }
        return Promise.resolve(draw).catch(function () { /* the next change draws it */ }).then(function () {
          self.waiting--;
          if (!self.waiting) self.setLoading(false);
          if (outcome.error) throw outcome.error;
          return outcome.value;
        });
      });
      this.queue = job.catch(function () {});
      return job;
    },

    addForm: function (form) {
      var self = this;
      var data = new FormData(form);
      // Adding on a subscription (the buy box with Subscribe & save on) is opting into the plan
      // afresh, so it brings the gift back even if it was taken out earlier this visit.
      var subscribing = !!data.get('selling_plan');
      return this.run(function () {
        if (subscribing) self.setGiftDeclined(false);
        // The buy box may have added a subscription: its bundle is laid out for Kaching and the
        // advertised gift comes along with it.
        return self.write('cart/add.js', data).then(function () { return self.reconcile(); });
      }).then(function () {
        self.announce('Added to cart');
        self.open();
      });
    },
    // Quantity and remove buttons: { line, quantity, key }. Lines are addressed by position, not by
    // key: when the quantity-break discount splits a bundle's free bottle onto its own $0 line, that
    // line shares the paid line's key, and a keyed change would hit both.
    change: function (payload) {
      var self = this;
      // Clicked while an earlier change was still running: the positions on screen may be out of date
      // by the time this one runs, so it only goes ahead if its line is still where it was.
      var recheck = this.waiting > 0 && !!payload.key;
      return this.run(function () {
        var still = recheck ? self.fetchCart().then(function (cart) {
          var item = (cart.items || [])[payload.line - 1];
          return !!item && item.key === payload.key;
        }) : Promise.resolve(true);
        return still.then(function (ok) {
          if (!ok) return null;
          return self.write('cart/change.js', { line: payload.line, quantity: payload.quantity }).then(function (cart) {
            return self.reconcile(cart);
          });
        });
      });
    },

    /* Lines are the same line to Shopify when variant, plan and properties match (a line the
       discount has split in two is listed twice with the same identity), and a "pair" is every line
       of a variant on one plan (or on none) - what the switch moves between. */
    propertiesKey: function (properties) {
      var p = properties || {};
      return JSON.stringify(Object.keys(p).sort().filter(function (k) {
        return p[k] !== null && p[k] !== undefined && p[k] !== '';
      }).map(function (k) { return [k, String(p[k])]; }));
    },
    itemIdentity: function (item) {
      return item.variant_id + '|' + planOf(item) + '|' + this.propertiesKey(item.properties);
    },
    lineIdentity: function (line) {
      return line.id + '|' + (line.selling_plan || '') + '|' + this.propertiesKey(line.properties);
    },
    totals: function (items, keyOf) {
      return items.reduce(function (totals, item) {
        var key = keyOf(item);
        totals[key] = (totals[key] || 0) + item.quantity;
        return totals;
      }, {});
    },
    pairOfItem: function (item) { return item.variant_id + '|' + planOf(item); },
    pairOfLine: function (line) { return line.id + '|' + (line.selling_plan || ''); },

    /* Take some lines out of the cart and put others in without the cart ever being short. The new
       lines go in first, in one /cart/add.js, and the old ones only come out once the new ones are
       there, in one /cart/update.js made from a fresh read of the cart. If the new lines do not go
       in, whatever part of them did is taken back out and the old lines were never touched; if the
       old lines will not come out, the new ones are taken back out. Either way a failure leaves the
       shopper with the cart they had, never an empty one. `out` are cart items, `lines` are
       /cart/add.js lines; a new line that matches one already in the cart tops it up. Resolves with
       the cart as it stands afterwards. */
    rewrite: function (cart, out, lines) {
      var self = this;
      var before = cart.items || [];
      // What each identity touched here adds up to once the rewrite is done.
      var target = {}, spec = {};
      out.forEach(function (item) { target[self.itemIdentity(item)] = 0; });
      lines.forEach(function (line) { var id = self.lineIdentity(line); target[id] = 0; spec[id] = line; });
      before.forEach(function (item) {
        var id = self.itemIdentity(item);
        if (id in target && out.indexOf(item) === -1) target[id] += item.quantity;
      });
      lines.forEach(function (line) { target[self.lineIdentity(line)] += line.quantity; });
      var had = this.totals(before, this.itemIdentity.bind(this));
      var adds = [], cuts = false;
      Object.keys(target).forEach(function (id) {
        var delta = target[id] - (had[id] || 0);
        if (delta > 0 && spec[id]) adds.push(Object.assign({}, spec[id], { quantity: delta }));
        if (delta < 0) cuts = true;
      });
      if (!adds.length && !cuts) return Promise.resolve(cart);
      // Every variant/plan pair the new lines go into, and what it must add up to once they are in.
      var expected = {}, hadPairs = this.totals(before, this.pairOfItem);
      adds.forEach(function (line) {
        var pair = self.pairOfLine(line);
        if (!(pair in expected)) expected[pair] = hadPairs[pair] || 0;
        expected[pair] += line.quantity;
      });
      var put = adds.length
        ? this.write('cart/add.js', { items: adds }, !cuts).then(function () { return null; }, function (err) { return err; })
        : Promise.resolve(null);
      return put.then(function (addError) {
        if (!adds.length) return cart; // nothing was written since the cart was read
        return self.fetchCart().then(function (now) {
          var pairs = self.totals(now.items || [], self.pairOfItem);
          var landed = Object.keys(expected).every(function (pair) { return (pairs[pair] || 0) >= expected[pair]; });
          if (landed) return now; // a request that timed out may still have gone through
          var failed = addError || new Error(CART_ERROR);
          return self.putBack(now, before, adds).then(function () { throw failed; }, function () { throw failed; });
        });
      }).then(function (now) {
        if (!cuts) return now;
        return self.settle(now, target).catch(function () {
          // Try once more from a fresh read (the first try may have gone through after all), and
          // failing that take the new lines back out so the shopper keeps the cart they had.
          return self.fetchCart().then(function (again) { return self.settle(again, target); }).catch(function (err) {
            if (!adds.length) throw err;
            return self.fetchCart().then(function (latest) { return self.putBack(latest, before, adds); })
              .then(function () { throw err; }, function () { throw err; });
          });
        });
      });
    },
    // Brings every identity in `target` down to its total with one positional /cart/update.js (a
    // line the discount has split shares its key with the rest of it, so keys cannot address it).
    // Lines not in `target` keep their quantity.
    settle: function (cart, target) {
      var self = this;
      var left = Object.assign({}, target);
      var cut = false;
      var updates = (cart.items || []).map(function (item) {
        var id = self.itemIdentity(item);
        if (!(id in left)) return item.quantity;
        var keep = Math.min(item.quantity, left[id]);
        left[id] -= keep;
        if (keep !== item.quantity) cut = true;
        return keep;
      });
      if (!cut) return Promise.resolve(cart);
      return this.write('cart/update.js', { updates: updates });
    },
    // Takes the lines a rewrite added back out, leaving every identity they touched at what it was.
    putBack: function (cart, before, adds) {
      var self = this;
      var had = this.totals(before, this.itemIdentity.bind(this));
      var target = {};
      adds.forEach(function (line) { var id = self.lineIdentity(line); target[id] = had[id] || 0; });
      return this.settle(cart, target);
    },

    /* Subscribe & save on a cart line.
       The switch acts on the whole product, not the one line it sits on. A "Buy 2, Get 1 Free"
       bundle arrives as three bottles on one line and the Kaching quantity-break discount then
       splits the free bottle onto its own $0 line - so changing only the clicked line left the
       other bottle behind as a one-time line, two paid bottles moved onto the plan, and the deal
       (three bottles on one line) was gone. Every line of the variant on the other side of the
       switch moves: the whole quantity becomes one line on the plan (or, switching off, without
       one). Switching off, the discount re-splits it exactly as it did on the first add; switching
       on, the bottles are laid out as Kaching's subscription bundle (see reconcileBundles) in the
       same pass rather than in a second one.
       A single line that only changes plan is switched in place with /cart/change.js. Anything
       else - a bundle split over two lines, the Kaching layout, a Kaching tag that has to come off
       (/cart/change.js cannot remove a property) - is one rewrite: the new lines go in before the
       old ones come out. Either way the drawer is drawn once, when the whole switch is done. */
    setLinePlan: function (variantId, planId, on) {
      var self = this;
      planId = parseInt(planId, 10) || null;
      return this.run(function () {
        if (on && !planId) return null; // nothing to switch to: the drawer is simply drawn again
        return self.fetchCart().then(function (cart) {
          return self.switchPlan(cart, variantId, planId, on, true);
        }).then(function (cart) {
          if (on) self.setGiftDeclined(false); // opting in again also brings the gift back
          return self.reconcile(cart);
        });
      });
    },
    switchPlan: function (cart, variantId, planId, on, firstTry) {
      var self = this;
      var items = cart.items || [];
      var moved = items.filter(function (item) {
        if (item.variant_id !== variantId || self.isGiftLine(item)) return false;
        return on ? !item.selling_plan_allocation : !!item.selling_plan_allocation;
      });
      if (!moved.length) return Promise.resolve(cart); // already switched (a repeated tap)
      // Kaching's subscription-bundle tag belongs to the lines laid out below, never to the merged line.
      var properties = Object.assign({}, moved[0].properties);
      var tagged = KACHING_BUNDLE_PROP in properties;
      delete properties[KACHING_BUNDLE_PROP];
      var line = { id: variantId, quantity: totalQuantity(moved) };
      if (on) line.selling_plan = planId;
      if (Object.keys(properties).length) line.properties = properties;
      // Plan Kaching's layout on the cart as it will be once the switch is done.
      var merged = {
        variant_id: variantId, product_id: moved[0].product_id, quantity: line.quantity,
        properties: line.properties || {}, selling_plan_allocation: on ? { selling_plan: { id: planId } } : null
      };
      var bundles = this.planBundles(items.filter(function (item) { return moved.indexOf(item) === -1; }).concat([merged]));
      var out = moved.concat(bundles.stale.filter(function (item) { return item !== merged; }));
      var lines = (bundles.stale.indexOf(merged) === -1 ? [line] : []).concat(bundles.lines);
      var identity = this.lineIdentity(line);
      var inPlace = firstTry && moved.length === 1 && !tagged && out.length === 1 && lines.length === 1 && lines[0] === line &&
        !items.some(function (item) { return self.itemIdentity(item) === identity; });
      if (!inPlace) return this.rewrite(cart, out, lines);
      // /cart/change.js with selling_plan only takes a position, and wants the quantity every time.
      var from = this.pairOfItem(moved[0]), to = this.pairOfLine(line);
      var had = this.totals(items, this.pairOfItem);
      return this.write('cart/change.js', { line: items.indexOf(moved[0]) + 1, quantity: moved[0].quantity, selling_plan: on ? planId : null })
        .then(function (next) {
          var pairs = self.totals(next.items || [], self.pairOfItem);
          if ((pairs[from] || 0) === (had[from] || 0) - line.quantity && (pairs[to] || 0) === (had[to] || 0) + line.quantity) return next;
          // Shopify did not do what was asked: finish the switch from the cart as it now stands.
          return self.switchPlan(next, variantId, planId, on, false);
        }, function () {
          return self.fetchCart().then(function (next) { return self.switchPlan(next, variantId, planId, on, false); });
        });
    },

    // Everything the cart puts right after a change: the subscription bundle layout, then the gift.
    // Takes the cart when the caller already has it, and saves a read.
    reconcile: function (cart) {
      var self = this;
      return (cart ? Promise.resolve(cart) : this.fetchCart())
        .then(function (current) { return self.reconcileBundles(current); })
        .catch(function () { return null; /* a discount layout must never break the cart */ })
        .then(function (current) { return self.reconcileGift(current); });
    },

    /* Subscription bundles (see KACHING_DEAL).
       The buy box adds a bundle as one line (3 bottles for Buy 2, Get 1 Free), which is all a
       one-time purchase needs. On a subscription Kaching's discount ignores that line and the
       shopper pays for every bottle. So after every cart change, the deal product's bottles on
       each selling plan are laid out for the biggest bar they fill: the paid bottles on one line,
       the free ones on another, both tagged exactly as Kaching's widget tags them. Bottles that
       fill no bar sit untagged on one line. Lines already in that shape are left alone, so this
       costs no request unless something changed. The drawer's quantity buttons act on either line
       and the layout is redone from the new total: raising the free line to 2 gives 3 paid + 1
       free, and taking the paid line below 2 drops the deal. */
    bundleTag: function (item) {
      var raw = item && item.properties && item.properties[KACHING_BUNDLE_PROP];
      if (!raw) return null;
      try { return JSON.parse(raw) || null; } catch (err) { return null; }
    },
    bundleBar: function (quantity) { return dealBar(quantity); },
    // Laid out for `bar` already: a paid line and a free line of one bundle, or nothing tagged at all.
    bundleInShape: function (lines, total, bar) {
      var self = this;
      var tags = lines.map(function (item) { return self.bundleTag(item); });
      if (!bar) return tags.every(function (tag) { return !tag; });
      if (lines.length !== 2) return false;
      var paid = tags[0] && tags[0].bxgy ? 1 : 0;
      var free = 1 - paid;
      var p = tags[paid], f = tags[free];
      if (!p || !f || p.bxgy || !f.bxgy || !p.main || !f.main || p.id !== f.id) return false;
      if (p.deal !== KACHING_DEAL.id || f.deal !== KACHING_DEAL.id || p.bar !== bar.id || f.bar !== bar.id) return false;
      return lines[free].quantity === bar.get && lines[paid].quantity === total - bar.get;
    },
    // A fresh id per bundle, like Kaching's own: two bundles in one cart must not share lines.
    bundleId: function () {
      var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', id = '';
      for (var i = 0; i < 4; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));
      return id;
    },
    // The lines out of shape (stale) and the /cart/add.js lines that replace them.
    // Every subscription bottle of a variant is one subscription, whatever plan it went in on: the
    // total decides both the bar and the plan (dealPlanFor), so 3 bottles always renew every 3
    // months and 6 every 6 months, even when the drawer's switch or a quantity change put them on
    // another plan.
    planBundles: function (items) {
      var self = this;
      var groups = [];
      items.forEach(function (item) {
        if (item.product_id !== KACHING_DEAL.productId || !item.selling_plan_allocation || self.isGiftLine(item)) return;
        var group = groups.filter(function (g) { return g.variantId === item.variant_id; })[0];
        if (!group) groups.push(group = { variantId: item.variant_id, lines: [] });
        group.lines.push(item);
      });
      var stale = [], lines = [];
      groups.forEach(function (group) {
        var total = totalQuantity(group.lines);
        var bar = self.bundleBar(total);
        var planId = dealPlanFor(total);
        var onPlan = group.lines.every(function (item) { return String(planOf(item)) === planId; });
        if (onPlan && self.bundleInShape(group.lines, total, bar)) return;
        stale = stale.concat(group.lines);
        planId = parseInt(planId, 10);
        var base = Object.assign({}, group.lines[0].properties);
        delete base[KACHING_BUNDLE_PROP];
        var line = function (quantity, tag) {
          var properties = Object.assign({}, base);
          if (tag) properties[KACHING_BUNDLE_PROP] = JSON.stringify(tag);
          var l = { id: group.variantId, quantity: quantity, selling_plan: planId };
          if (Object.keys(properties).length) l.properties = properties;
          return l;
        };
        if (!bar) { lines.push(line(total, null)); return; }
        var id = self.bundleId();
        lines.push(line(total - bar.get, { deal: KACHING_DEAL.id, pp: KACHING_DEAL.productId, main: true, id: id, bar: bar.id }));
        lines.push(line(bar.get, { id: id, deal: KACHING_DEAL.id, bar: bar.id, main: true, bxgy: true }));
      });
      return { stale: stale, lines: lines };
    },
    reconcileBundles: function (cart) {
      var plan = this.planBundles(cart.items || []);
      if (!plan.lines.length) return Promise.resolve(cart);
      return this.rewrite(cart, plan.stale, plan.lines);
    },

    /* Free subscription gift.
       The buy box advertises a free gift with Subscribe & save, so the gift travels with the
       subscription: one unit is added (tagged with a _free_gift line property) as soon as a line
       on the drawer's plan is in the cart, and removed when the last such line goes. A shopper who
       takes the gift out themselves is not handed it again until they opt into the plan afresh.
       The shopper can add more of it; only the first is free. Pricing is not the theme's to do:
       the gift only costs $0 through the merchant's free-gift discount (Kaching Subscriptions, free
       gift on the plan, quantity 1), and that discount only recognises a line tagged the way
       Kaching's own widget tags its gifts - see giftProperties. */
    giftVariantId: function () {
      var d = this.drawer();
      return d ? parseInt(d.getAttribute('data-gift-variant-id') || '0', 10) || 0 : 0;
    },
    giftPlanId: function () {
      var d = this.drawer();
      return d ? (d.getAttribute('data-gift-plan-id') || '').trim() : '';
    },
    isGiftLine: function (item) {
      return !!(item && item.properties && item.properties._free_gift);
    },
    /* Kaching's free-gift discount zeroes a line only when it carries __kaching_subs_gift naming the
       selling plan the gift comes with, and that plan is on a line in the cart - the same tag
       Kaching's widget puts on the gifts it adds. So a MicroStamp bought from "Pair with", or one
       tagged for a plan the shopper has since dropped, is charged. The _free_gift property stays:
       it is how the theme finds its own gift line. */
    giftProperties: function (planId) {
      var properties = { _free_gift: 'subscription' };
      if (planId) properties[KACHING_GIFT_PROP] = JSON.stringify({ sellingPlan: String(planId) });
      return properties;
    },
    giftTagPlan: function (item) {
      var raw = item && item.properties && item.properties[KACHING_GIFT_PROP];
      if (!raw) return '';
      try {
        var tag = JSON.parse(raw);
        return tag && tag.sellingPlan ? String(tag.sellingPlan) : '';
      } catch (err) { return ''; }
    },
    // Plans of the subscription lines that earn the gift: the drawer's pinned plan, when set, and
    // the bundle plans (every 3 and every 6 months), which carry the same free gift in Kaching.
    giftPlans: function (items) {
      var pinned = this.giftPlanId();
      var allowed = pinned ? [pinned].concat(dealPlans()) : null;
      var self = this;
      return items.reduce(function (plans, item) {
        if (self.isGiftLine(item) || !item.selling_plan_allocation) return plans;
        var id = String(item.selling_plan_allocation.selling_plan.id);
        if ((!allowed || allowed.indexOf(id) !== -1) && plans.indexOf(id) === -1) plans.push(id);
        return plans;
      }, []);
    },
    giftDeclined: function () { return readFlag(GIFT_DECLINED_KEY) === '1'; },
    setGiftDeclined: function (declined) { writeFlag(GIFT_DECLINED_KEY, declined ? '1' : ''); },
    // Takes the cart when the caller already has it. Never fails: a bonus must never break the cart.
    reconcileGift: function (cart) {
      var giftId = this.giftVariantId();
      if (!giftId) return Promise.resolve(cart || null);
      var self = this;
      return (cart ? Promise.resolve(cart) : this.fetchCart()).then(function (current) {
        var items = current.items || [];
        var plans = self.giftPlans(items);
        var subscribed = plans.length > 0;
        var gifts = items.filter(function (item) { return self.isGiftLine(item); });
        if (subscribed && !gifts.length && !self.giftDeclined()) {
          return self.write('cart/add.js', { items: [{ id: giftId, quantity: 1, properties: self.giftProperties(plans[0]) }] }).then(function () { return null; });
        }
        // A gift added before it carried Kaching's tag (or tagged for a plan no longer in the cart)
        // would stay at full price: the whole quantity goes back as one correctly tagged line.
        var stale = subscribed && gifts.some(function (item) { return plans.indexOf(self.giftTagPlan(item)) === -1; });
        if (stale) {
          return self.rewrite(current, gifts, [{ id: gifts[0].variant_id, quantity: totalQuantity(gifts), properties: self.giftProperties(plans[0]) }]);
        }
        if (!subscribed && gifts.length) {
          // The free one goes with the plan; extras the shopper chose to pay for stay as a normal line.
          var extras = totalQuantity(gifts) - 1;
          return self.rewrite(current, gifts, extras > 0 ? [{ id: gifts[0].variant_id, quantity: extras }] : []);
        }
        return current;
      }).catch(function () { return null; /* sold-out gift, offline, etc. */ });
    },
    /* The gift's quantity buttons (and its remove button) set the gift's total quantity. Once the
       free-gift discount covers one unit and there are more, Shopify splits the gift into a $0 line
       and a paid line; the buttons act on both, as one rewrite towards the new total (see rewrite).
       Taking it down to zero counts as declining the gift, so it is not added straight back. */
    setGiftQuantity: function (quantity) {
      var giftId = this.giftVariantId();
      if (!giftId) return Promise.resolve();
      var self = this;
      quantity = Math.max(0, quantity || 0);
      return this.run(function () {
        if (!quantity) self.setGiftDeclined(true);
        return self.fetchCart().then(function (cart) {
          var items = cart.items || [];
          var gifts = items.filter(function (item) { return self.isGiftLine(item); });
          var line = { id: gifts.length ? gifts[0].variant_id : giftId, quantity: quantity, properties: self.giftProperties(self.giftPlans(items)[0]) };
          return self.rewrite(cart, gifts, quantity ? [line] : []);
        }).catch(function (err) {
          // e.g. not enough stock for the new quantity: make sure the free one is still there
          return self.reconcileGift().then(function () { throw err; });
        });
      });
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

  /* ======================================================== localization */
  // Shopify only pre-selects a visitor's country on Shopify Plus. On every other plan the storefront
  // opens in the primary market's default country, so an Australian shopper sees USD (and a US
  // shopper may see AUD) until checkout asks for an address and re-prices the order. Ask Shopify
  // which country it detects for this visitor - browsing_context_suggestions.json is Shopify's own
  // GeoIP + Accept-Language lookup - and, once per browser, submit the hidden localization form in
  // layout/theme.liquid so every price, the cart and the checkout start in the local currency.
  // A shopper who picks a country themselves (footer or cart selector) is never overridden.
  var COUNTRY_CHOICE_KEY = 'elaren:country-choice';
  var AUTO_LOCALIZED_KEY = 'elaren:auto-localized';
  function isLocalizationForm(form) {
    if (!form || form.tagName !== 'FORM') return false;
    var action = (form.getAttribute('action') || '').split('?')[0];
    return /\/localization$/.test(action) || !!form.querySelector('input[name="form_type"][value="localization"]');
  }
  // A manual country/language choice anywhere on the site wins over auto-detection from then on.
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (form.id === 'localization_form_auto' || !isLocalizationForm(form)) return;
    writeStored(COUNTRY_CHOICE_KEY, '1');
  });
  function autoLocalize() {
    var form = document.getElementById('localization_form_auto');
    if (!form || !window.fetch) return;
    if (window.Shopify && window.Shopify.designMode) return;
    if (readStored(COUNTRY_CHOICE_KEY) || readStored(AUTO_LOCALIZED_KEY)) return;
    var select = form.querySelector('select[name="country_code"]');
    var current = (form.getAttribute('data-current-country') || (window.Shopify && window.Shopify.country) || '').toUpperCase();
    if (!select || !current) return;
    var url = rootUrl() + 'browsing_context_suggestions.json?country[enabled]=true&country[exclude]=' + encodeURIComponent(current);
    fetch(url, { credentials: 'same-origin', headers: { Accept: 'application/json' } })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (json) {
        if (!json) return;
        var detected = json.detected_values && json.detected_values.country && json.detected_values.country.handle;
        var first = json.suggestions && json.suggestions[0] && json.suggestions[0].parts && json.suggestions[0].parts.country;
        var country = String(detected || (first && first.handle) || '').toUpperCase();
        if (!country || country === current) return;
        var option = Array.prototype.slice.call(select.options).filter(function (o) { return o.value.toUpperCase() === country; })[0];
        if (!option) return; // Shopify detected a country the store does not sell to - leave the shopper where they are.
        writeStored(AUTO_LOCALIZED_KEY, country);
        select.value = option.value;
        if (typeof form.requestSubmit === 'function') form.requestSubmit(); else form.submit();
      })
      .catch(function () { /* offline or blocked: keep the server-rendered context */ });
  }
  window.ElarenLocalization = { detect: autoLocalize, choiceKey: COUNTRY_CHOICE_KEY, autoKey: AUTO_LOCALIZED_KEY };

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

  // A change the drawer could not make: the drawer has been drawn again from the cart as it
  // stands, and the message says why it did not change.
  function cartFailed(err) { Cart.showError((err && err.message) || CART_ERROR); }
  function lineKey(el) {
    var line = el.closest('line-item');
    return line ? line.getAttribute('data-key') : null;
  }

  document.addEventListener('click', function (e) {
    var toggle = e.target.closest('.js-cart-toggle');
    if (toggle && Cart.drawer()) { e.preventDefault(); Cart.isOpen() ? Cart.close() : Cart.open(); return; }
    if (e.target.closest('[data-cart-close]')) { e.preventDefault(); Cart.close(); return; }

    var giftQty = e.target.closest('[data-cart-gift-qty]');
    if (giftQty) {
      e.preventDefault();
      Cart.setGiftQuantity(parseInt(giftQty.getAttribute('data-cart-gift-qty'), 10)).catch(cartFailed);
      return;
    }
    var remove = e.target.closest('[data-cart-remove]');
    if (remove) {
      e.preventDefault();
      Cart.change({ line: parseInt(remove.getAttribute('data-cart-remove'), 10), quantity: 0, key: lineKey(remove) }).catch(cartFailed);
      return;
    }
    var qty = e.target.closest('[data-cart-qty]');
    if (qty) {
      e.preventDefault();
      Cart.change({ line: parseInt(qty.getAttribute('data-cart-qty'), 10), quantity: parseInt(qty.getAttribute('data-cart-qty-value'), 10), key: lineKey(qty) }).catch(cartFailed);
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
    var label = toggle.closest('.subscription-toggle');
    if (label) label.setAttribute('aria-checked', toggle.checked ? 'true' : 'false');
    Cart.setLinePlan(parseInt(toggle.getAttribute('data-variant-id'), 10), toggle.getAttribute('data-selling-plan-id'), toggle.checked).catch(cartFailed);
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
  /* Anchors resolve by id first, then by the short section keys the landing sections carry as
     data-anchor (benefits, reviews, science, results, shop, story, how, ingredients, guarantee, faq). */
  function findAnchor(id) {
    if (!id) return null;
    return document.getElementById(id) || document.querySelector('[data-anchor="' + id + '"]') || document.querySelector('[id$="__' + id + '"]') || document.querySelector('[id$="' + id + '"]');
  }
  function closeNavDrawer() {
    var drawer = $('.froya-nav-drawer');
    if (!drawer || !drawer.classList.contains('is-open')) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('drawer-open');
    var burger = $('.froya-nav__burger');
    if (burger) burger.setAttribute('aria-expanded', 'false');
  }
  function scrollToId(id) {
    var el = findAnchor(id);
    if (!el) return false;
    var offset = ($('.froya-nav__bar') || { offsetHeight: 0 }).offsetHeight + 8;
    var top = el.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top: top, behavior: 'smooth' });
    return true;
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-scroll-to], a[href^="#"]');
    if (!a) return;
    var inCart = !!a.closest('#mini-cart');
    if (inCart && !a.hasAttribute('data-scroll-to')) return;
    var id = a.getAttribute('data-scroll-to') || (a.getAttribute('href') || '').replace(/^#/, '');
    if (!id || !findAnchor(id)) return;
    e.preventDefault();
    if (inCart) Cart.close();
    closeNavDrawer();
    // let the drawer/cart release the body scroll lock before scrolling
    window.setTimeout(function () { scrollToId(id); }, inCart || a.closest('.froya-nav-drawer') ? 60 : 0);
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
  /* Finger-follow swipe for the Blaze sliders. Blaze's own drag moves exactly one slide per
     gesture, whatever the distance, and ignores a gesture that starts while the previous one is
     still animating (300ms) - on a phone that reads as "swiping does nothing". This handler
     follows the finger, rubber-bands at the ends, snaps to the nearest slide on release and lets
     a long or fast swipe travel several slides, so the shopper can run through every slide by
     dragging right-to-left. Pointer events where they exist (one code path for mouse, pen and
     touch), touch events otherwise. Vertical movement is handed back to the page immediately. */
  function attachSwipe(slider) {
    var track = slider && slider.track;
    if (!track || slider.isStatic || !once(track, 'swipe')) return;
    var usePointer = 'PointerEvent' in window;
    var active = false, moved = false, axis = null;
    var startX = 0, startY = 0, lastX = 0, lastT = 0, velocity = 0, dragged = 0;

    var stepPx = function () {
      var first = slider.slides && slider.slides[0];
      var gap = parseFloat(slider.config.slideGap) || 0;
      return (first ? first.getBoundingClientRect().width : track.clientWidth) + gap;
    };
    // Same transform Blaze paints, plus the live drag offset.
    var paint = function (dx) {
      dragged = dx;
      slider.dragged = dx;
      track.style.transform = slider.offset === 0
        ? 'translate3d(' + dx + 'px,0px,0px)'
        : 'translate3d(calc(' + dx + 'px + ' + slider.offset + ' * (var(--slide-width) + ' + slider.config.slideGap + ')),0px,0px)';
    };
    var point = function (e) { return e.touches ? (e.touches[0] || (e.changedTouches && e.changedTouches[0])) : e; };
    var atStart = function () { return slider.stateIndex === 0; };
    var atEnd = function () { return slider.stateIndex === slider.states.length - 1; };
    var listen = function (method) {
      var target = document;
      if (usePointer) {
        target[method]('pointermove', onMove, { passive: false });
        target[method]('pointerup', onEnd);
        target[method]('pointercancel', onEnd);
      } else {
        target[method]('touchmove', onMove, { passive: false });
        target[method]('touchend', onEnd);
        target[method]('touchcancel', onEnd);
      }
    };
    var finish = function () {
      active = false;
      listen('removeEventListener');
      track.style.transitionDuration = slider.config.transitionDuration + 'ms';
    };

    var onStart = function (e) {
      if (active || (e.button && e.button > 0)) return;
      var p = point(e);
      if (!p) return;
      active = true; moved = false; axis = null;
      startX = lastX = p.clientX; startY = p.clientY; lastT = Date.now(); velocity = 0;
      slider.isTransitioning = false; // a new swipe must never die because the last one is still animating
      track.style.transitionDuration = '0ms';
      listen('addEventListener');
    };
    var onMove = function (e) {
      if (!active) return;
      var p = point(e);
      if (!p) return;
      var dx = p.clientX - startX, dy = p.clientY - startY;
      if (!axis) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (axis === 'y') { finish(); return; } // vertical: it is a page scroll, not a swipe
      }
      if (e.cancelable) e.preventDefault();
      moved = true;
      var now = Date.now();
      if (now > lastT) velocity = (p.clientX - lastX) / (now - lastT); // px per ms
      lastX = p.clientX; lastT = now;
      if (!slider.config.loop && ((dx > 0 && atStart()) || (dx < 0 && atEnd()))) dx *= 0.3; // rubber-band
      paint(dx);
    };
    var onEnd = function () {
      if (!active) return;
      var dx = dragged;
      finish();
      slider.dragged = 0;
      if (!moved) { paint(0); return; }
      var step = stepPx();
      var count = step > 0 ? Math.round(Math.abs(dx) / step) : 0;
      // A short flick still turns one slide; a fast one carries on past the nearest slide.
      if (count === 0 && (Math.abs(dx) > 20 || Math.abs(velocity) > 0.3)) count = 1;
      if (Math.abs(velocity) > 0.6 && velocity * dx > 0) count += Math.min(3, Math.floor(Math.abs(velocity)));
      var before = slider.stateIndex;
      slider.isTransitioning = false;
      if (count > 0 && dx < 0) slider.next(count);
      else if (count > 0 && dx > 0) slider.prev(count);
      // Too short a drag, or already at the end of a non-looping slider: Blaze does not repaint, so snap
      // the track back. A looping slider always moves for count > 0, even when it lands on the same state.
      if (count === 0 || (!slider.config.loop && slider.stateIndex === before)) paint(0);
    };

    track.addEventListener(usePointer ? 'pointerdown' : 'touchstart', onStart, { passive: true });
    track.addEventListener('dragstart', function (e) { e.preventDefault(); });
    // A drag must not count as a click on whatever the finger happened to be over.
    track.addEventListener('click', function (e) {
      if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
    }, true);
    track.classList.add('is-swipeable');
  }

  function makeSlider(el, desktop, tablet, mobile, opts) {
    if (!el || typeof BlazeSlider === 'undefined' || !once(el, 'blaze')) return null;
    var pagination = el.querySelector('.blaze-pagination');
    if (pagination) pagination.innerHTML = ''; // Blaze renders its own dots
    var config = {
      // draggable: false - the swipe handler below replaces Blaze's one-slide-per-gesture drag
      all: Object.assign({ slidesToShow: desktop, slideGap: '20px', loop: false, enablePagination: true, draggable: false, transitionDuration: 300 }, opts || {}),
      '(max-width: 999px)': { slidesToShow: tablet },
      '(max-width: 767px)': { slidesToShow: mobile, slideGap: '14px' }
    };
    var slider = null;
    try { slider = new BlazeSlider(el, config); } catch (err) { return null; }
    attachSwipe(slider);
    return slider;
  }
  function initSliders(root) {
    $$('.s-icons-slider__slider', root).forEach(function (el) { makeSlider(el, 6.1, 3.2, 1.6); });
    // Reviews loop: after the last card the slider carries on from the first, in both directions.
    $$('.s-reviews-slider__slider', root).forEach(function (el) { makeSlider(el, 5.5, 2.4, 1.15, { loop: true }); });
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
    if (!modal || !once(modal, 'init')) return;
    // Hoist out of the sticky gallery column so no ancestor stacking context can paint over it.
    document.body.appendChild(modal);
    var setModal = function (open) {
      if (open) { modal.removeAttribute('hidden'); modal.setAttribute('open', ''); }
      else { modal.removeAttribute('open'); modal.setAttribute('hidden', ''); }
      document.body.classList.toggle('modal-open', open);
    };
    // Openers can live in other sections too (e.g. the "Learn more" link under the ingredient legend),
    // so clicks are delegated from the document; an opener that is a link falls through to its href
    // when the modal is not on the page.
    if (!document.body.hasAttribute('data-ingredients-openers')) {
      document.body.setAttribute('data-ingredients-openers', '');
      document.addEventListener('click', function (e) {
        var opener = e.target.closest && e.target.closest('.js-view-ingredients');
        var current = opener && document.getElementById('ingredients-modal');
        if (!current) return;
        e.preventDefault();
        e.stopPropagation();
        current.removeAttribute('hidden'); current.setAttribute('open', '');
        document.body.classList.add('modal-open');
      }, true);
    }
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
    // On the bundle deal's product the plan follows the selected tier (3 bottles every 3 months,
    // 6 every 6 months - see KACHING_DEAL); any other product keeps the section's plan.
    var isDealProduct = parseInt(sub.getAttribute('data-product-id'), 10) === KACHING_DEAL.productId;
    var planFor = function () {
      if (!isDealProduct || !defaultPlan) return defaultPlan;
      var qty = parseInt((quantityInput && quantityInput.value) || (tier && tier.getAttribute('data-qty')) || '1', 10) || 1;
      return dealPlanFor(qty);
    };
    var priceMain = $('.c-buybox-toggle__price--sub .product_price', sub);
    var priceOtp = $('.c-buybox-toggle__price--otp .product_price', sub);
    var buttonPrice = $('.c-subscribtion__add-to-cart .js-subscribtion__main-price .product_price', sub);
    var buttonCompare = $('.c-subscribtion__add-to-cart .igcp', sub);
    // Strike-through for each mode, rendered by the section: the page may load in either mode,
    // so what is on the button at first paint says nothing about what the other mode shows.
    var compareSub = buttonCompare ? buttonCompare.getAttribute('data-compare-sub') || '' : '';
    var compareOtp = buttonCompare ? buttonCompare.getAttribute('data-compare-otp') || '' : '';

    // Bundle tiers (quantity breaks). The selected tier drives the quantity added to cart and every
    // price in the buy box: the big price is per bottle, the button shows the bundle total.
    var tiers = $$('.js-bundle-card', sub);
    var quantityInput = $('.js-bundle-quantity', sub);
    var congrats = $('.c-buybox-toggle__congrats', sub);
    var congratsPrice = congrats ? $('.product_price', congrats) : null;
    var tier = tiers.filter(function (c) { return $('input', c).checked; })[0] || tiers[0];
    var isSubscription = true;

    var renderTier = function () {
      if (!tier) return;
      var d = tier.getAttribute.bind(tier);
      var total = d(isSubscription ? 'data-total-sub' : 'data-total-otp');
      var save = d(isSubscription ? 'data-save-sub' : 'data-save-otp');
      var saveCents = parseInt(d(isSubscription ? 'data-save-sub-cents' : 'data-save-otp-cents'), 10) || 0;
      // The data-* attributes hold the output of the `money` filter, which carries the shop's
      // money format verbatim - and that format may contain markup (a currency-converter app
      // typically wraps it in <span class=money>). Writing it with textContent would print that
      // markup as visible text, so render it as HTML, exactly as the server does on first paint.
      if (priceMain) priceMain.innerHTML = d('data-unit-sub');
      if (priceOtp) priceOtp.innerHTML = d('data-unit-otp');
      if (buttonPrice) buttonPrice.innerHTML = total;
      if (buttonCompare) buttonCompare.innerHTML = saveCents > 0 ? d('data-compare-total') : '';
      if (congratsPrice) congratsPrice.innerHTML = save;
      if (congrats) {
        if (saveCents > 0) congrats.removeAttribute('hidden');
        else congrats.setAttribute('hidden', '');
      }
    };

    var selectTier = function (card) {
      if (!card) return;
      tier = card;
      tiers.forEach(function (c) {
        var on = c === card;
        c.classList.toggle('is-selected', on);
        var input = $('input', c);
        if (input) input.checked = on;
      });
      if (quantityInput) quantityInput.value = card.getAttribute('data-qty') || '1';
      if (sellingPlan && isSubscription && !sellingPlan.disabled) sellingPlan.value = planFor();
      renderTier();
    };

    tiers.forEach(function (card) {
      card.addEventListener('change', function () { selectTier(card); });
    });

    var setMode = function (subscription) {
      isSubscription = subscription;
      sub.classList.toggle('is-one-time', !subscription);
      if (toggle) toggle.setAttribute('aria-checked', subscription ? 'true' : 'false');
      radios.forEach(function (r) { r.checked = (r.value === 'subscription') === subscription; });
      if (sellingPlan) {
        sellingPlan.value = subscription ? planFor() : '';
        // A disabled input is left out of FormData altogether, so a one-time purchase posts no
        // selling_plan key at all rather than an empty one - nothing for the cart to interpret.
        sellingPlan.disabled = !subscription;
      }
      if (tiers.length) { renderTier(); return; }
      if (buttonPrice) buttonPrice.innerHTML = ((subscription ? priceMain : priceOtp) || priceMain || { innerHTML: '' }).innerHTML.trim();
      if (buttonCompare) buttonCompare.innerHTML = subscription ? compareSub : compareOtp;
    };
    if (toggle) toggle.addEventListener('click', function () { setMode(toggle.getAttribute('aria-checked') !== 'true'); });
    radios.forEach(function (r) { r.addEventListener('change', function () { setMode(r.value === 'subscription'); }); });
    if (tier) selectTier(tier);
    // Start in whatever mode the section rendered (Subscribe & save is off unless the merchant
    // pre-selects it): the checked purchase_type radio carries that state.
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

  /* ============================================================= countdown */
  // Announcement-bar timer. "midnight" counts to the visitor's next local midnight and starts
  // over every day; "fixed" counts to a date/time the merchant typed, read in the store's
  // timezone (the section passes the store's UTC offset), and hides itself once it has passed.
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function countdownTarget(el) {
    if (el.getAttribute('data-mode') === 'fixed') {
      var raw = (el.getAttribute('data-end') || '').trim();
      var m = raw.match(/^(\d{4}-\d{2}-\d{2})(?:[ T](\d{1,2}):(\d{2}))?/);
      if (!m) return null;
      var offset = (el.getAttribute('data-offset') || '+0000').replace(/^([+-]\d{2}):?(\d{2})$/, '$1:$2');
      if (!/^[+-]\d{2}:\d{2}$/.test(offset)) offset = 'Z';
      var t = new Date(m[1] + 'T' + pad2(parseInt(m[2] || '23', 10)) + ':' + (m[3] || '59') + ':00' + offset);
      return isNaN(t.getTime()) ? null : t;
    }
    var next = new Date();
    next.setHours(24, 0, 0, 0);
    return next;
  }
  function initCountdown(root) {
    $$('[data-countdown]', root).forEach(function (el) {
      if (!once(el, 'init')) return;
      var unit = function (name) { var u = $('[data-unit="' + name + '"]', el); return u ? u.querySelector('.announcement-bar__countdown-number') : null; };
      var days = $('[data-unit="days"]', el), daysSep = $('[data-unit="days-sep"]', el);
      var nums = { d: unit('days'), h: unit('hours'), m: unit('minutes'), s: unit('seconds') };
      var target = countdownTarget(el);
      if (!target) { el.setAttribute('hidden', ''); return; }
      var timer = null;
      var tick = function () {
        var diff = target - new Date();
        if (diff <= 0) {
          if (el.getAttribute('data-mode') === 'fixed') {
            el.setAttribute('hidden', '');
            if (timer) window.clearInterval(timer);
            return;
          }
          target = countdownTarget(el); // midnight passed: start the next day
          diff = Math.max(0, target - new Date());
        }
        var total = Math.floor(diff / 1000);
        var d = Math.floor(total / 86400); total -= d * 86400;
        var h = Math.floor(total / 3600); total -= h * 3600;
        var mi = Math.floor(total / 60); total -= mi * 60;
        if (nums.d) nums.d.textContent = pad2(d);
        if (nums.h) nums.h.textContent = pad2(h);
        if (nums.m) nums.m.textContent = pad2(mi);
        if (nums.s) nums.s.textContent = pad2(total);
        if (days) { if (d > 0) days.removeAttribute('hidden'); else days.setAttribute('hidden', ''); }
        if (daysSep) { if (d > 0) daysSep.removeAttribute('hidden'); else daysSep.setAttribute('hidden', ''); }
        el.removeAttribute('hidden');
      };
      tick();
      timer = window.setInterval(tick, 1000);
    });
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


  /* ================================================================= faq */
  /* Accordion: opening one question closes the others in the same list. */
  function initFaq(root) {
    $$('.s-faq__list', root).forEach(function (list) {
      if (!once(list, 'init')) return;
      list.addEventListener('toggle', function (e) {
        var item = e.target;
        if (!item.open || !item.classList.contains('s-faq__item')) return;
        $$('.s-faq__item[open]', list).forEach(function (other) { if (other !== item) other.open = false; });
      }, true);
    });
  }

  /* ============================================================== track */
  /* Track your order page: turns a tracking number into its tracking link (a Carrier block whose
     prefix matches, otherwise the universal tracker) and opens it in a new tab. The link also stays
     under the field in case the browser blocks the tab. ?tracking=… in the address fills the field
     in, so the shipping confirmation email can link straight here. */
  function initTrack(root) {
    $$('[data-track]', root).forEach(function (el) {
      if (!once(el, 'init')) return;
      var form = $('[data-track-form]', el);
      var input = form && $('input[name="tracking"]', form);
      var message = $('[data-track-message]', el);
      var configEl = $('[data-track-config]', el);
      if (!input || !message || !configEl) return;
      var config = {};
      try { config = JSON.parse(configEl.textContent) || {}; } catch (err) { /* defaults below */ }
      var carriers = config.carriers || [];
      var universal = config.universal || 'https://t.17track.net/en#nums={number}';

      var clean = function (value) { return String(value || '').toUpperCase().replace(/[\s-]+/g, ''); };
      var resolve = function (number) {
        for (var i = 0; i < carriers.length; i++) {
          var carrier = carriers[i];
          var prefixes = carrier.prefixes || [];
          for (var j = 0; j < prefixes.length; j++) {
            if (prefixes[j] && carrier.url && number.indexOf(prefixes[j]) === 0) return carrier;
          }
        }
        return { name: '', url: universal };
      };
      var showError = function () {
        message.hidden = false;
        message.classList.add('is-error');
        message.textContent = config.invalid || '';
        input.setAttribute('aria-invalid', 'true');
        input.focus();
      };
      var show = function (number) {
        var carrier = resolve(number);
        var href = carrier.url.replace(/\{number\}/g, encodeURIComponent(number));
        var text = config.opening || '';
        text = carrier.name ? text.replace('{carrier}', carrier.name) : text.replace(/\{carrier\}\s*/, '');
        text = text.replace('{number}', number);
        input.removeAttribute('aria-invalid');
        message.classList.remove('is-error');
        message.textContent = text ? text + ' ' : '';
        var link = document.createElement('a');
        link.className = 'link-underline';
        link.href = href;
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = config.fallback || href;
        message.appendChild(link);
        message.hidden = false;
        window.open(href, '_blank', 'noopener');
      };

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var number = clean(input.value);
        if (!/^[A-Z0-9]{6,40}$/.test(number)) { showError(); return; }
        input.value = number;
        show(number);
      });

      var fromUrl = '';
      try { fromUrl = clean(new URLSearchParams(window.location.search).get('tracking')); } catch (err) { /* old browser */ }
      if (/^[A-Z0-9]{6,40}$/.test(fromUrl)) input.value = fromUrl;
    });
  }

  /* ========================================================== email popup */
  /* Mystery gift: trades an email for a 10% code. Opens once per visit, after a delay (or on exit
     intent, whichever comes first), posts the customer form in the background, reveals the code and
     attaches it to the session via /discount/CODE so checkout applies it automatically. Closing it,
     with or without signing up, is remembered per visitor in localStorage for the days set in the
     section, and it never reopens on its own within the same visit. */
  function initEmailPopup(root) {
    var popup = $('[data-email-popup]', root) || (root === document ? $('[data-email-popup]') : null);
    if (!popup || !once(popup, 'init')) return;
    // One popup per page: if another instance is already live (e.g. the section was also added to the
    // page template while the header group has one), the first in document order wins and this one is dropped.
    var live = $$('[data-email-popup][data-init]').filter(function (other) { return other !== popup && document.body.contains(other); });
    if (live.length) { if (popup.parentNode) popup.parentNode.removeChild(popup); return; }
    // Hoist to <body> so no header stacking context can paint over it (dropping the copy a previous
    // theme-editor render left there).
    $$('[data-email-popup][data-section-id="' + popup.getAttribute('data-section-id') + '"]').forEach(function (other) {
      if (other !== popup && other.parentNode) other.parentNode.removeChild(other);
    });
    if (popup.parentNode !== document.body) document.body.appendChild(popup);

    var designMode = popup.getAttribute('data-design-mode') === 'true';
    var enabled = popup.getAttribute('data-enabled') === 'true';
    var key = popup.getAttribute('data-storage-key') || 'elaren:email-popup';
    var code = popup.getAttribute('data-code') || '';
    var form = $('form', popup);
    var input = $('input[type="email"]', popup);
    var submit = $('button[type="submit"]', popup);
    var error = $('[data-popup-error]', popup);
    var dialog = $('.s-email-popup__dialog', popup);
    var timer = null;
    var opened = false;
    var fired = false; // opened on its own once already on this page: never again, whatever the storage says
    var day = 86400000;

    var hiddenUntil = function () {
      var raw = readStored(key);
      if (!raw) return 0;
      try { return parseInt(JSON.parse(raw).until, 10) || 0; } catch (err) { return parseInt(raw, 10) || 0; }
    };
    var remember = function (days, state) {
      writeStored(key, JSON.stringify({ until: Date.now() + days * day, state: state }));
    };
    var showStep = function (name) {
      $$('[data-popup-step]', popup).forEach(function (step) {
        if (step.getAttribute('data-popup-step') === name) step.removeAttribute('hidden'); else step.setAttribute('hidden', '');
      });
    };

    var open = function () {
      if (opened || !document.body.contains(popup)) return;
      opened = true;
      if (timer) { window.clearTimeout(timer); timer = null; }
      popup.removeAttribute('hidden');
      document.body.classList.add('email-popup-open');
      window.requestAnimationFrame(function () {
        popup.classList.add('is-open');
        var target = (input && !input.closest('[hidden]') && window.matchMedia('(min-width: 768px)').matches) ? input : dialog;
        if (target) target.focus({ preventScroll: true });
      });
    };
    var close = function (rememberDays) {
      if (!opened) return;
      opened = false;
      popup.classList.remove('is-open');
      document.body.classList.remove('email-popup-open');
      window.setTimeout(function () { if (!opened) popup.setAttribute('hidden', ''); }, 400);
      if (rememberDays && !designMode) remember(rememberDays, 'dismissed');
    };
    // The popup fires once per visit at most. The delay timer and exit intent both come through
    // here: the first one to fire wins, and a popup the visitor has already closed (this visit, or
    // within the remembered days from an earlier one) never comes back on its own. Only the theme
    // editor (popup.__open) can reopen it.
    var autoOpen = function () {
      if (fired || opened || hiddenUntil() > Date.now()) return;
      fired = true;
      if (exitIntent) document.removeEventListener('mouseout', exitIntent);
      open();
    };
    var exitIntent = null;

    var dismissDays = parseInt(popup.getAttribute('data-dismiss-days') || '7', 10);
    var signupDays = parseInt(popup.getAttribute('data-signup-days') || '60', 10);
    $$('[data-popup-close]', popup).forEach(function (b) {
      b.addEventListener('click', function () {
        var success = $('[data-popup-step="success"]', popup);
        close(success && !success.hasAttribute('hidden') ? signupDays : dismissDays);
      });
    });
    popup.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { close(dismissDays); return; }
      if (e.key !== 'Tab' || !dialog) return;
      var focusable = $$('a[href], button:not([disabled]), input:not([disabled]), [tabindex="0"]', dialog).filter(function (el) { return !el.closest('[hidden]'); });
      if (!focusable.length) return;
      var first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    // Attach the code to the visitor's session so checkout applies it without typing.
    var applyCode = function () {
      if (!code) return;
      var applied = $('[data-popup-applied]', popup);
      fetch(rootUrl() + 'discount/' + encodeURIComponent(code) + '?redirect=' + encodeURIComponent(rootUrl()), { credentials: 'same-origin' })
        .then(function () { if (applied) applied.removeAttribute('hidden'); })
        .catch(function () { /* the visible code still works at checkout */ });
    };
    var succeed = function () {
      showStep('success');
      applyCode();
      if (!designMode) writeStored(key, JSON.stringify({ until: Date.now() + signupDays * day, state: 'subscribed' }));
      var cta = $('.s-email-popup__button--cta', popup);
      if (cta) cta.focus({ preventScroll: true });
    };

    var copy = $('[data-popup-copy]', popup);
    if (copy) {
      copy.addEventListener('click', function () {
        var codeEl = $('[data-popup-code]', popup);
        var text = codeEl ? codeEl.textContent.trim() : code;
        var done = function () {
          var label = copy.textContent;
          copy.textContent = popup.getAttribute('data-copied-label') || 'Copied!';
          window.setTimeout(function () { copy.textContent = label; }, 1800);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, done);
        else {
          var range = document.createRange();
          if (codeEl) { range.selectNodeContents(codeEl); var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range); }
          try { document.execCommand('copy'); } catch (err) { /* unsupported */ }
          done();
        }
      });
    }

    if (form) {
      form.addEventListener('submit', function (e) {
        if (form.classList.contains('is-busy') || form.dataset.native === '1') return;
        e.preventDefault();
        if (error) error.setAttribute('hidden', '');
        if (input && !input.checkValidity()) {
          input.setAttribute('aria-invalid', 'true');
          if (error) { error.textContent = popup.getAttribute('data-error-text') || 'Please enter a valid email address.'; error.removeAttribute('hidden'); }
          input.focus();
          return;
        }
        if (input) input.removeAttribute('aria-invalid');
        form.classList.add('is-busy');
        if (submit) submit.disabled = true;
        var body = new FormData(form);
        fetch(form.getAttribute('action') || (rootUrl() + 'contact'), { method: 'POST', body: body, credentials: 'same-origin', headers: { 'Accept': 'text/html' } })
          .then(function (res) {
            // Shopify's spam challenge cannot be answered in the background: fall back to a normal submit,
            // the page reloads and the success step renders from form.posted_successfully?.
            if (!res.ok || /\/challenge/.test(res.url || '')) throw new Error('challenge');
            if (/customer_posted=true/.test(res.url || '')) return '';
            return res.text();
          })
          .then(function (html) {
            if (!html) { succeed(); return; }
            // Shopify re-rendered the page with the form's errors: read them from the popup's own error slot.
            var doc = new window.DOMParser().parseFromString(html, 'text/html');
            var slot = doc.querySelector('[data-popup-error]');
            var message = slot ? slot.textContent.trim() : '';
            if (message) { var err = new Error('invalid'); err.detail = message; throw err; }
            succeed();
          })
          .catch(function (err) {
            form.classList.remove('is-busy');
            if (submit) submit.disabled = false;
            if (err && err.message === 'invalid') {
              if (input) input.setAttribute('aria-invalid', 'true');
              if (error) { error.textContent = err.detail || popup.getAttribute('data-error-text') || 'Please enter a valid email address.'; error.removeAttribute('hidden'); }
              return;
            }
            form.dataset.native = '1';
            form.submit();
          });
      });
    }

    // Returned from a native submit: Shopify redirects back with ?customer_posted=true. Drop that
    // flag from the address bar so a reload or a shared link does not open the popup again.
    if ($('[data-popup-posted]', popup)) {
      fired = true;
      open();
      succeed();
      if (window.history && window.history.replaceState && /[?&]customer_posted=/.test(window.location.search)) {
        var clean = window.location.search.replace(/([?&])customer_posted=[^&]*&?/, '$1').replace(/[?&]$/, '');
        window.history.replaceState(window.history.state, '', window.location.pathname + clean + window.location.hash);
      }
      return;
    }
    if (form && $('.s-email-popup__error', popup) && $('.s-email-popup__error', popup).textContent.trim()) {
      $('.s-email-popup__error', popup).removeAttribute('hidden');
      open();
      return;
    }

    popup.__open = open; popup.__close = close;
    if (designMode) return; // the editor opens it when the section is selected (see below)
    if (!enabled || hiddenUntil() > Date.now()) return;

    var delay = Math.max(0, parseInt(popup.getAttribute('data-delay') || '6', 10)) * 1000;
    timer = window.setTimeout(autoOpen, delay);
    if (popup.getAttribute('data-exit-intent') === 'true' && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      exitIntent = function (e) {
        if (!e.relatedTarget && e.clientY <= 0 && !document.body.classList.contains('cart-open')) autoOpen();
      };
      document.addEventListener('mouseout', exitIntent);
    }
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
    initCountdown(root);
    initFaq(root);
    initTrack(root);
    initEmailPopup(root);
    initCartDrawer($('#mini-cart', root) || (root === document ? Cart.drawer() : null));
  }

  function boot() {
    initSection(document);
    if (Cart.drawer()) {
      var cartCount = parseInt(Cart.drawer().getAttribute('data-cart-count') || '0', 10);
      Cart.updateCount(cartCount);
      // Carts from before the gift and the subscription bundles carried Kaching's tags are still
      // charged in full for them: fix them on arrival.
      if (cartCount) Cart.run(function () { return Cart.reconcile(); }, true).catch(function () {});
    }
    document.documentElement.classList.add('loaded');
    autoLocalize();
    // Arrived from another page with a section key in the hash (e.g. /#faq): scroll to that section.
    var hash = (window.location.hash || '').replace(/^#/, '');
    if (hash && !document.getElementById(hash) && findAnchor(hash)) window.setTimeout(function () { scrollToId(hash); }, 150);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  // Theme editor: re-initialise a section after it is re-rendered, and open drawers when selected.
  document.addEventListener('shopify:section:load', function (e) {
    var old = document.querySelector('#ingredients-modal[data-for-section]');
    if (old && e.target.querySelector('.js-view-ingredients')) old.parentNode.removeChild(old);
    initSection(e.target);
  });
  var popupForSection = function (sectionEl) {
    var inline = sectionEl.querySelector('[data-email-popup]');
    var id = inline ? inline.getAttribute('data-section-id') : (sectionEl.id || '').replace(/^shopify-section-/, '');
    return document.querySelector('[data-email-popup][data-section-id="' + id + '"]');
  };
  document.addEventListener('shopify:section:select', function (e) {
    if (e.target.querySelector('#mini-cart')) Cart.open();
    var popup = popupForSection(e.target);
    if (popup && popup.__open) popup.__open();
  });
  document.addEventListener('shopify:section:deselect', function (e) {
    if (e.target.querySelector('#mini-cart')) Cart.close();
    var popup = popupForSection(e.target);
    if (popup && popup.__close) popup.__close();
  });
})();
