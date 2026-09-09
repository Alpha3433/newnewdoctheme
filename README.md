# Elaren Landing – Shopify theme

A Shopify landing-page theme for **Elaren** (shopelaren.com) and its Pumpkin Seed Regrowth Oil with
Caffeine Complex. The copy targets women over 35 experiencing hair loss in all its forms (female
pattern thinning, postpartum and menopausal shedding, traction alopecia, alopecia areata, stress
shedding) and is grounded in Elaren's own store data: real product names, prices, subscription
terms, verified customer reviews, the 90-day money-back guarantee and the hair-loss research
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
* **Logo** – Header → Logo (plus a width slider). Used in the bar and the mobile menu.
* **Products** – the buy box, menu bestseller cards, review-card product tiles and cart-drawer
  "Pair with" list use product pickers. Prices, the subscribe & save plan, stock, variant and
  product images all come from the product, so update those in Products, not in the theme.
* **Reviews / videos** – Review slider and Video reviews are block lists: add, remove, reorder,
  upload a photo/video and poster, or paste an mp4 URL.
* **Lists** – benefits, science steps, research bars, hair-loss pillars/badges, how-to steps,
  ingredient legend, footer links, menu links and blog links are all blocks (add/remove/reorder).
* **Cart drawer** – Header group → Cart drawer: title, empty state, subscribe toggle label,
  "Pair with" products, checkout label and trust badges. The header CART button opens it and every
  add-to-cart button adds in place and opens it.

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
* **Guarantee:** the copy uses the 90-day money-back guarantee from the "Our Elaren Story" page.
  The store's refund policy page still describes a 30-day return window – align one with the other.
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
| `sections/froya-*.liquid` | The landing page, one editable section per block (settings + blocks in each `{% schema %}`): announcement bar, sticky header with mega menus and mobile drawer, cart drawer, hero, benefits strip, logo/quote slider, review slider, backed-by-science timeline, research results, featured product (gallery, ingredients modal, buy box), founder story, hair-loss types & badges, review wall, guarantee, video reviews, how-to-use, ingredient quality, ingredient science, newsletter, footer. Markup keeps the captured page's class names so the verbatim CSS still applies. |
| `snippets/froya-image.liquid`, `snippets/froya-nav-card.liquid` | Image-picker-with-fallback helper and the menu bestseller card. |
| `sections/main-*.liquid` | Minimal, on-brand sections for the rest of the store: page, product, collection, collections list, cart, search, blog, article, 404, password, and the customer account pages. |
| `templates/*.json` | JSON templates wiring the sections above; `index.json` and `page.froya-landing.json` carry the landing page's default block content. |
| `assets/critical.css` | Verbatim copy of the inline `<head>` CSS from the live page (font faces, CSS variables, critical layout). |
| `assets/sections-inline.css` | Verbatim copy of every per-section inline `<style>` block from the live page. Section ids are preserved so these rules apply unchanged. |
| `assets/theme.css` | Reconstruction of the theme's external stylesheets that the capture did not include: base typography, buttons, header/mega menu/drawer, footer, plus a light layer for the supporting store templates. |
| `assets/sections.css` | Reconstruction of the landing-page component styles for desktop and mobile. |
| `assets/main.js` | Interactions: cart drawer (Ajax add/change/remove, subscribe & save toggle, "Pair with" upsells, re-rendered through the Section Rendering API), in-page add to cart from every product form, mega menus, mobile drawer, carousels (Blaze Slider), product gallery + thumbnails, ingredients modal, subscribe/one-time buy-box toggle, lazy video playback, science scroll-spy, animated result bars, smooth anchors, theme-editor re-initialisation. |
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
  the cart drawer; the drawer changes quantities, removes lines and switches a line between
  subscription and one-time through `/cart/change.js`, then re-renders itself with the Section
  Rendering API. The newsletter posts to Shopify's customer form. The supporting `main-*`
  sections use the connected store's own products, cart and customer accounts.
* Run `shopify theme check` (Shopify CLI) before publishing; the only remaining warnings are the
  remote placeholder images.
* Hidden/utility parts of the original page (Shopify pixels, cookie consent, chat widget, Klaviyo,
  Loox scripts, the legacy hidden header and mini-cart drawer) are intentionally omitted.
