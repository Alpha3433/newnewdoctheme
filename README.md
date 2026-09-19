# Elaren Landing – Shopify theme

A Shopify landing-page theme for **Elaren** (shopelaren.com) and its Pumpkin Seed Regrowth Oil with
Caffeine Complex. The copy targets women over 35 experiencing hair loss in all its forms (female
pattern thinning, postpartum and menopausal shedding, traction alopecia, alopecia areata, stress
shedding) and is grounded in Elaren's own store data: real product names, prices, subscription
terms, verified customer reviews, the 30-day money-back guarantee and the hair-loss research
donation from the "Our Elaren Story" page.

The layout was recreated from the Frøya Organics landing page
<https://froyaorganics.com/pages/fr-ya-organics-hyper-potent-arctic-balms-for-mature-skin>
(captured 2026-09-08). Every section is now a real, editable Shopify section: text, links, images,
videos and products are changed in the theme editor (Online Store → Themes → Customize), not in
code. The landing page is the home page (`templates/index.json`) and is also available as a page
template (`templates/page.froya-landing.json`).

## Editing the page in the theme editor

* **Text** – every heading, paragraph, label, button and badge is a section setting or a block
  setting. Click the section (or the item inside it) in the editor sidebar and edit the field.
* **Images** – every image has an *Image* picker. Until you upload one, the placeholder from the
  Frøya capture is shown (its URL sits in a "Fallback … URL" field on blocks, so you can also
  clear it). Recommended sizes are shown under each picker.
* **Hero on phones** – the hero is tall on a phone, so a landscape desktop photo gets cropped to
  about a third of its width. Upload a portrait crop (820 × 1100 px) as *Mobile background image*
  for the best result. Hero → *Mobile image framing* offers *Fill the hero* (crops; *Mobile focal
  point* chooses which part is kept) or *Whole photo at the top* (uncropped, with *Colour
  behind the text* filling the area under it). *Photo space under the text* keeps room below the
  last proof point so the person in a portrait shot stays visible under the copy, as on the reference.
* **Logo** – Header → Logo (plus a width slider). Used in the bar and the mobile menu.
* **Products** – the buy box, menu bestseller cards, review-card product tiles and cart-drawer
  "Pair with" list use product pickers. Prices, the subscribe & save plan, stock, variant and
  product images all come from the product, so update those in Products, not in the theme.
* **Bundles** – Featured product → *Bundle tier* blocks are the quantity breaks in the buy box
  (add, remove or reorder them). Each tier sets the quantity added to cart and a discount that
  comes off the price per bottle, so the per-bottle price falls as the bundle grows. The theme only
  displays that price: the real discount is applied at checkout by the Kaching Bundles app, so the
  tier quantities and discounts here must match the quantity breaks configured there.
* **Reviews / videos** – Review slider and Video reviews are block lists: add, remove, reorder,
  upload a photo/video and poster, or paste an mp4 URL.
* **Lists** – benefits, science steps, research bars, hair-loss pillars/badges, how-to steps,
  ingredient legend, footer links, menu links and blog links are all blocks (add/remove/reorder).
* **Menu (single page)** – Header → *Menu style*. *Single page* replaces the shop/bestsellers/more mega
  menus and the long mobile drawer with the *Section link* blocks: each one scrolls to a section of
  the landing page (benefits, reviews, science, results, story, guarantee, how to use, FAQ or a custom
  element id). The bar shows the first few links; the mobile drawer lists them all as numbered rows
  with the note and the testimonial.
  *Full store menu* brings the original mega menus back. Every other link on the page (guarantee
  buttons, "Shop now" on review and video cards, the cart drawer's product links and empty-cart
  button, the footer's "About" column) also scrolls to a section instead of leaving the page; only the
  policies and *Manage Subscription* in the footer, and the checkout, lead off it. A link such as
  `/#faq` from another page lands on the home page and scrolls to that section.
* **FAQ** – a numbered accordion at the bottom of the page in the "Backed by science" style. Each
  question is a block (question + rich-text answer); *Open the first question by default* and the
  closing "still wondering?" line are settings. Menu and footer "FAQ" links scroll here.
* **Email popup** – Header group → *Email popup (gift)*. A wrapped gift box with a "?" tag
  beside the sign-up: full screen on phones, a split card on desktop. It opens after a delay and, on
  desktop, when the cursor leaves the page. The email posts to Shopify's customer form with the tags
  `newsletter` and `popup`; then the lid lifts, the tag flips to "10% OFF" and the popup reveals the
  *Discount code* and attaches it to the visitor's cart, so checkout takes it off automatically. The
  gift is always the same code, only the framing is a mystery. The code itself lives in Discounts:
  `EXTRA10` is a 10% order code that combines with product discounts, so it stacks on the Kaching
  bundle price. Every line of copy (both gift-tag states included), the delay and how many days the
  popup stays hidden after a close or a sign-up are settings; the popup only opens in the editor when
  the section is selected.
* **Backed by science photo** – the landscape photo beside the steps is a *Photo* picker (with a
  fallback URL until one is uploaded); it stays in view while the steps scroll on desktop.
* **Announcement bar** – Header group → Announcement bar: message and countdown text sizes
  (message, label before the timer, numbers and unit labels are separate sliders, with a mobile
  size for the message) and *Position*: a desktop layout (message left / countdown left / both
  centered in either order / stacked in either order) and a mobile layout (stacked or side by side,
  in either order).
* **Buy-box header** – the star-rating line (Featured product → Rating line) sits above the product
  name, as on Frøya's page, and the whole line scrolls to the review wall ("Real women, real hair,
  real reviews"); *Scrolls to* takes another element id. The old two-label line under the name is
  still available (*Labels under the name*) and empty by default. The cart no longer repeats the
  selling plan's own name ("Delivery: every month | 10% off") under a subscription line: the
  Subscribe & save switch shows the state.
* **Add-to-cart button** – Featured product → Button & stock → *Price on the button*: label only
  (the bundle total already sits in the price line and on the selected bundle card), label with the
  bundle total (the landing page's choice), or label with the total and the regular price struck
  through. The
  "-" separator is added automatically when a price is shown. The *Savings line* renders as a pill
  directly above the button ("🎉 Congrats! You’re saving $7.00") and follows the selected bundle
  and the Subscribe & save switch; the two static info lines under the plan are still available as
  *Info line 1 / 2* but are empty by default now that the pill carries that spot.
* **Low-stock notice** – Featured product → Button & stock → *Number shown*: *Tracked inventory*
  reads the variant's real stock and only shows at or below the threshold; *A fixed number* shows
  the figure typed below on every visit. The store tracks more than 2,000 units of the serum, so the
  landing page uses the fixed number; switch back to tracked inventory once real stock is low.
* **Typography** – the Pangram and Apercu Mono fonts are served from this store's own Files (see the
  `@font-face` rules in `assets/critical.css`). Weight 400 maps to the Regular face and 600/700 to the
  Bold face; an earlier mapping pointed regular text at the Light file, which is why paragraphs looked
  thin. Secondary copy uses the same black as body text (`--brand-muted` equals `--brand-ink`); only
  struck-through prices keep a grey (`--brand-strike`).
* **Sliders** – the logo & quote, review and video sliders can be swiped: the track follows the
  finger (or mouse), snaps to the nearest slide and a long or fast swipe moves several slides, so
  the whole set can be run through right-to-left. The dots still work.
* **Hair-loss fit quiz** – three questions, one result screen that says how well Elaren fits the
  *kind* of hair loss the visitor has (never a probability). *Question* blocks are asked in sidebar
  order; each *Answer* block names the question it belongs to and the hair-loss type it points to;
  each *Result* block is the screen for one type, with what to expect, what the research measured
  and a button that scrolls to the buy box with a bundle tier pre-selected. Precedence: a "See a
  doctor first" answer always wins, then "Traction", then whichever of pattern / shedding got more
  answers. Clicking a Result block in the editor previews that screen.
* **Cart drawer** – Header group → Cart drawer: title, empty state, subscribe toggle label,
  "Pair with" products, checkout label, country/currency selector and trust badges. The header
  CART button opens it and every add-to-cart button adds in place and opens it.
  * The line's **Subscribe & save switch acts on the whole product**, not on the one line it sits
    on. A "Buy 2, Get 1 Free" bundle goes into the cart as three bottles on one line and Kaching
    Bundles then splits the free bottle onto its own $0 line; the switch gathers every line of that
    variant back into one line of the full quantity, with or without the plan, so the quantity
    break still applies after switching. The "Save …" figure next to the switch is what the plan
    takes off everything the shopper is currently paying for that product (the free bottle counts
    for nothing, a discounted bottle for less).
  * **Free subscription gift** – pick the gift product the buy box advertises (Featured product →
    Free subscription gift). The drawer adds one unit, tagged with a `_free_gift` line property, as
    soon as a line on the drawer's *Subscription plan ID* is in the cart (from the buy box or the
    switch) and removes it when the last such line goes; a shopper who takes the gift out
    themselves is not handed it again until they opt into the plan afresh. The gift line shows
    "FREE GIFT", no quantity control, and "FREE" once its price is $0. **The theme does not price
    the gift**: it is only free once the same product is set up as a free gift on that plan in
    Kaching Subscriptions or as a Shopify automatic Buy X get Y discount, otherwise the cart charges
    its normal price.

## Before you publish

* **Imagery and video are still Frøya's placeholders** until you upload your own (product shots,
  before/after photos, press logos, review videos). Alt text already describes each slot.
* **Testimonials are real Elaren reviews** pulled from the store's review app (43 serum reviews,
  22 capsule reviews). The video slots are labelled "Verified Elaren customer / Video review" as
  placeholders until you have your own video reviews.
* **Claims to confirm against the formula:** "no parabens, no silicones", "no water, no mineral
  oil", "3rd party tested", "cold-pressed", and the "precision applicator + scalp massager" in the
  what-you-get list (both are mentioned in customer reviews). The research figures quote published
  ingredient studies (Cho 2014, Dhurat 2017, Otberg 2008) and are footnoted as such.
* **Guarantee:** the copy promises a 30-day money-back guarantee and fuller hair in 30 days, which
  matches the 30-day return window on the store's refund policy page. The "Our Elaren Story" page
  still says 90 days – update it, or change the guarantee copy back in the theme editor.
* **Currency and country.** Shopify only pre-selects a visitor's country automatically on Shopify
  Plus; on the store's Basic plan every visitor starts in the primary market's default country, and
  checkout only re-prices the order once it has a shipping address. So the theme does the detection
  itself: on a visitor's first page view `assets/main.js` asks Shopify which country it detects
  (`browsing_context_suggestions.json`, Shopify's own GeoIP) and submits the hidden localization
  form in `layout/theme.liquid`, which reloads the page in that country's currency. The cart keeps
  that currency through to checkout, which also pre-fills the address country. It runs once per
  browser (`localStorage` key `elaren:auto-localized`) and never after a shopper has picked a
  country in the cart or footer selector (`elaren:country-choice`); Theme settings → Localization
  turns it off. A VPN does not reliably change the result: VPN exit IPs are often registered to the
  provider's home country, so a UK exit node can still read as the US. To test another market,
  switch country with the selector in the cart drawer or the footer (or use Shopify's own market
  preview), not a VPN. The currency code next to the cart totals is on by default in Theme
  settings → Currency format, because most of the store's markets use the `$` symbol.
* **Subscription cadence lives on the variant, not the variant name.** The serum's variants
  (Monthly / Quarterly / Biannual) exist only to hang selling plans on; the buy box pins one plan
  with "Subscription plan ID" and never shows a variant picker. Cart lines therefore print the
  plan's own name and suppress a variant title the shopper never chose. Shopify's checkout has no
  such setting: it always prints the variant title, so a line still reads "… - Monthly" there until
  the product is restructured to a single default variant carrying all three plans.
* Links point at the connected store (`/products/...`, `/collections/all`, `/pages/about-us`,
  `/pages/contact`, `/policies/...`). `/pages/faq` and `/blogs/news` articles do not exist yet;
  select a blog in Header → Blog links once you publish articles.

## Connecting the theme

Online Store → Themes → Add theme → Connect from GitHub → pick this repository and the branch.
The theme folders Shopify needs (`layout`, `templates`, `sections`, `snippets`, `config`,
`locales`, a flat `assets`) all live at the repository root.

## What is in the repo

| Path | Purpose |
| --- | --- |
| `layout/theme.liquid` | Page shell: meta/fonts, the five stylesheets, `content_for_header`, the header section group (announcement bar, header, cart drawer), `content_for_layout`, the footer section group, scripts. |
| `sections/header-group.json`, `sections/footer-group.json` | Section groups with the default header/footer content (menu links, bestseller cards, blog links, footer links, cart-drawer badges and upsells). |
| `sections/froya-*.liquid` | The landing page, one editable section per block (settings + blocks in each `{% schema %}`): announcement bar, sticky header with mega menus and mobile drawer, cart drawer, hero, benefits strip, logo/quote slider, review slider, backed-by-science timeline, research results, featured product (gallery, ingredients modal, buy box with bundle tiers), founder story, hair-loss types & badges, review wall, guarantee, video reviews, how-to-use, ingredient quality, ingredient science, newsletter, footer. Markup keeps the captured page's class names so the verbatim CSS still applies. |
| `snippets/froya-image.liquid`, `snippets/froya-nav-card.liquid` | Image-picker-with-fallback helper and the menu bestseller card. |
| `sections/main-*.liquid` | Minimal, on-brand sections for the rest of the store: page, product, collection, collections list, cart, search, blog, article, 404, password, and the customer account pages. |
| `templates/*.json` | JSON templates wiring the sections above; `index.json` and `page.froya-landing.json` carry the landing page's default block content. |
| `assets/critical.css` | Verbatim copy of the inline `<head>` CSS from the live page (font faces, CSS variables, critical layout). |
| `assets/sections-inline.css` | Verbatim copy of every per-section inline `<style>` block from the live page. Section ids are preserved so these rules apply unchanged. |
| `assets/theme.css` | Reconstruction of the theme's external stylesheets that the capture did not include: base typography, buttons, header/mega menu/drawer, footer, plus a light layer for the supporting store templates. |
| `assets/sections.css` | Reconstruction of the landing-page component styles for desktop and mobile. |
| `assets/main.js` | Interactions: cart drawer (Ajax add/change/remove, subscribe & save toggle, "Pair with" upsells, re-rendered through the Section Rendering API), in-page add to cart from every product form, mega menus, mobile drawer, carousels (Blaze Slider), product gallery + thumbnails, ingredients modal, subscribe/one-time buy-box toggle, bundle tier selection (quantity + per-bottle and total prices), lazy video playback, science scroll-spy, animated result bars, smooth anchors, theme-editor re-initialisation. |
| `assets/blaze.css`, `assets/blaze-slider.min.js` | Blaze Slider 1.9.3 (MIT, <https://github.com/MananTank/blaze-slider>), the carousel library the live page uses, vendored unmodified. |
| `scripts/localize_assets.py` | Vendors every remote placeholder image/font/video into `assets/` and rewrites the references (Liquid and JSON get `asset_url`). |
| `tools/extract.py`, `tools/build.py` | Historical: the pipeline that produced the original static `froya-*` sections from a Chrome capture of the Frøya page. **Do not re-run it** – it would overwrite the editable Elaren sections. |

## Assets

Images, fonts and videos are still referenced from the Frøya store's CDN (`froyaorganics.com/cdn/…` and
`cdn.shopify.com/…`) exactly as the captured page references them (see "Before you publish"). Once
the Elaren assets are in place, this script vendors whatever is still remote into `assets/`. Run it
from a machine with normal internet access and commit the result:

```sh
python3 scripts/localize_assets.py                # downloads the placeholder files into assets/ and rewrites references
python3 scripts/localize_assets.py --skip-videos  # same, but leave the large mp4 files on the CDN
python3 scripts/localize_assets.py --dry-run
```

## Behaviour notes

* Header, mega menus, drawer, carousels, gallery, modal, buy-box toggle and videos are fully
  functional client-side, and every section re-initialises itself when the theme editor
  re-renders it.
* The buy box uses the product chosen in the section: first available variant, the first
  subscribe & save plan (price, discount and savings are computed from the selling plan),
  tracked inventory for the low-stock notice. Submitting adds through `/cart/add.js` and opens
  the cart drawer; the drawer changes quantities and removes lines through `/cart/change.js`,
  switches a product between subscription and one-time by zeroing its lines with a positional
  `/cart/update.js` and re-adding the full quantity through `/cart/add.js` (positions, not keys:
  a discount-split line shares its key with the paid line), adds or removes the free
  subscription gift after every cart change, and re-renders itself with the Section Rendering
  API. The newsletter posts to Shopify's customer form. The supporting `main-*`
  sections use the connected store's own products, cart and customer accounts.
* Run `shopify theme check` (Shopify CLI) before publishing; the only remaining warnings are the
  remote placeholder images.
* Hidden/utility parts of the original page (Shopify pixels, cookie consent, chat widget, Klaviyo,
  Loox scripts, the legacy hidden header and mini-cart drawer) are intentionally omitted.
