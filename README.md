# Elaren Landing – Shopify theme

A Shopify landing-page theme for **Elaren** (shopelaren.com) and its Pumpkin Seed Regrowth Oil with
Caffeine Complex. The copy targets women over 35 experiencing hair loss in all its forms (female
pattern thinning, postpartum and menopausal shedding, traction alopecia, alopecia areata, stress
shedding) and is grounded in Elaren's own store data: real product names, prices, subscription
terms, verified customer reviews, the 90-day money-back guarantee and the hair-loss research
donation from the "Our Elaren Story" page.

The layout and section markup were recreated from the Frøya Organics landing page
<https://froyaorganics.com/pages/fr-ya-organics-hyper-potent-arctic-balms-for-mature-skin>
(captured 2026-09-08); only the copy, links, prices and product wiring have been rewritten for
Elaren. The landing page is the home page (`templates/index.json`) and is also available as a page
template (`templates/page.froya-landing.json`) so it can be assigned to any page in the Shopify
admin. Every landing-page section is a real theme section, so the page can be reordered or trimmed
in the theme editor.

## Before you publish

* **Imagery and video are still Frøya's.** Every `<img>`, `<video>` and background image still
  points at the Frøya CDN (skincare product shots, before/after photos, press logos, review
  videos). Replace them with Elaren assets – the alt text already describes what each slot should
  show – or hide the sections you cannot fill yet (press slider, review wall, video reviews).
* **Testimonials are real Elaren reviews** pulled from the store's review app (43 serum reviews,
  22 capsule reviews). The three video-review slots are labelled "Verified Elaren customer / Video
  review" as placeholders until you have your own video reviews.
* **Claims to confirm against the formula:** "no parabens, no silicones", "no water, no mineral
  oil", "3rd party tested", "cold-pressed", and the "precision applicator + scalp massager" in the
  what-you-get list (both are mentioned in customer reviews). The research figures quote published
  ingredient studies (Cho 2014, Dhurat 2017, Otberg 2008) and are footnoted as such.
* **Guarantee:** the copy uses the 90-day money-back guarantee from the "Our Elaren Story" page.
  The store's refund policy page still describes a 30-day return window – align one with the other.
* Links point at the connected store (`/products/...`, `/collections/all`, `/pages/about-us`,
  `/pages/contact`, `/policies/...`). `/pages/faq` and `/blogs/news` articles do not exist yet.

## Connecting the theme

Online Store → Themes → Add theme → Connect from GitHub → pick this repository and the branch.
The theme folders Shopify needs (`layout`, `templates`, `sections`, `snippets`, `config`,
`locales`, a flat `assets`) all live at the repository root.

## What is in the repo

| Path | Purpose |
| --- | --- |
| `layout/theme.liquid` | Page shell: meta/fonts, the five stylesheets, `content_for_header`, announcement bar + header sections, `content_for_layout`, footer section, scripts. |
| `sections/froya-*.liquid` | The landing page, one section per block: announcement bar, sticky header with mega menus and mobile drawer, hero, benefits strip, press slider, before/after review slider, backed-by-science timeline, clinical-trial panel, featured product (gallery, ingredients modal, buy box), founder story, Arctic-plants section, review wall, guarantee, video reviews, how-to-use, ingredient-quality blocks, Arctic-ingredients section, newsletter, footer. Markup is the live page's rendered DOM, cleaned of tracking/app scripts. |
| `sections/main-*.liquid` | Minimal, on-brand sections for the rest of the store: page, product, collection, collections list, cart, search, blog, article, 404, password, and the customer account pages. |
| `templates/*.json` | JSON templates wiring the sections above (`index` and `page.froya-landing` render the landing page). |
| `assets/critical.css` | Verbatim copy of the inline `<head>` CSS from the live page (font faces, CSS variables, critical layout). |
| `assets/sections-inline.css` | Verbatim copy of every per-section inline `<style>` block from the live page. Section ids are preserved so these rules apply unchanged. |
| `assets/theme.css` | Reconstruction of the theme's external stylesheets that the capture did not include: base typography, buttons, header/mega menu/drawer, footer, plus a light layer for the supporting store templates. |
| `assets/sections.css` | Reconstruction of the landing-page component styles for desktop and mobile. |
| `assets/main.js` | Interactions: mega menus, mobile drawer, carousels (Blaze Slider), product gallery + thumbnails, ingredients modal, subscribe/one-time buy-box toggle with live prices, lazy video playback, scroll-spy for the science timeline, animated progress bars, smooth anchors. |
| `assets/blaze.css`, `assets/blaze-slider.min.js` | Blaze Slider 1.9.3 (MIT, <https://github.com/MananTank/blaze-slider>), the carousel library the live page uses, vendored unmodified. |
| `index.html` | Standalone preview of the same markup; open it in a browser or `python3 -m http.server`. No Shopify needed. |
| `scripts/localize_assets.py` | Vendors every remote image/font/video into `assets/` and rewrites the references (Liquid gets `asset_url`). |
| `tools/extract.py`, `tools/build.py` | The pipeline that produced the original `froya-*` sections, the two verbatim stylesheets and `index.html` from a Chrome "Webpage, Complete" capture of the Frøya page (`python3 tools/extract.py <capture.html> && python3 tools/build.py`). Needs `beautifulsoup4` and `html5lib`. Re-running it would overwrite the Elaren copy. |
| `tools/preview.py` | Rebuilds `index.html` from the current section files (`python3 tools/preview.py`). Run it after editing section copy so the standalone preview stays in sync. |

## Assets

Images, fonts and videos are still referenced from the Frøya store's CDN (`froyaorganics.com/cdn/…` and
`cdn.shopify.com/…`) exactly as the captured page references them (see "Before you publish"). Once
the Elaren assets are in place, this script vendors whatever is still remote into `assets/`. Run it
from a machine with normal internet access and commit the result:

```sh
python3 scripts/localize_assets.py                # downloads ~260 files into assets/ and rewrites references
python3 scripts/localize_assets.py --skip-videos  # same, but leave the large mp4 files on the CDN
python3 scripts/localize_assets.py --dry-run
```

## Behaviour notes

* Header, mega menus, drawer, carousels, gallery, modal, buy-box toggle and videos are fully
  functional client-side.
* The landing page's buy box is wired to the Elaren serum (monthly variant + monthly
  subscribe-and-save plan); the static preview hands off to `/products/<handle>` because it has
  no storefront backend. Navigation, footer and newsletter links are relative to the connected
  store. The supporting `main-*` sections use the connected store's own products, cart and
  customer accounts.
* Hidden/utility parts of the original page (Shopify pixels, cookie consent, chat widget, Klaviyo,
  Loox scripts, the legacy hidden header and mini-cart drawer) are intentionally omitted.
