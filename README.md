# Frøya Organics – "Hyper Potent Arctic Balms for Mature Skin" landing page

A static, dependency-free recreation of
<https://froyaorganics.com/pages/fr-ya-organics-hyper-potent-arctic-balms-for-mature-skin>
(Shopify storefront, captured 2026-09-08). Open `index.html` in a browser, or serve the
folder with any static server:

```sh
python3 -m http.server 8000   # then visit http://localhost:8000/
```

## What is in the repo

| Path | Purpose |
| --- | --- |
| `index.html` | The full page: announcement bar, sticky header with mega menus and mobile drawer, hero, benefits strip, press slider, before/after review slider, "Backed by science", clinical-trial panel, featured product with gallery, ingredients modal and buy box, founder story, Arctic-ingredients sections, review wall, guarantee, video testimonials, how-to-use, ingredient quality blocks, newsletter and footer. Markup is the live page's rendered DOM, cleaned of tracking/app scripts. |
| `assets/css/critical.css` | Verbatim copy of the inline `<head>` CSS from the live page (font faces, CSS variables, critical layout). |
| `assets/css/sections-inline.css` | Verbatim copy of every per-section inline `<style>` block from the live page. Section ids are preserved so these rules apply unchanged. |
| `assets/css/theme.css` | Reconstruction of the theme's external stylesheets that the capture did not include (`theme.css`, `global-new.css`, `custom.css`): base typography, buttons, header/mega menu/drawer, footer. |
| `assets/css/sections.css` | Reconstruction of the section component styles (hero, sliders, product, image/text sections, guarantee, newsletter …) for desktop and mobile. |
| `assets/js/main.js` | Interactions: mega menus, mobile drawer, carousels (via Blaze Slider), product gallery + thumbnails, ingredients modal, subscribe/one-time buy-box toggle with live prices, lazy video playback, scroll-spy for the science timeline, animated progress bars, smooth anchors. |
| `assets/vendor/blaze-slider/` | Blaze Slider 1.9.3 (MIT), the carousel library the live page uses. |
| `scripts/localize_assets.py` | Downloads every remote image/font/video into `assets/remote/` and rewrites references so the repo is fully self-contained. |
| `tools/extract.py`, `tools/build.py` | The pipeline that produced `index.html` and the two verbatim stylesheets from a Chrome "Webpage, Complete" capture of the live page (`python3 tools/extract.py <capture.html> && python3 tools/build.py`). Needs `beautifulsoup4` and `html5lib`. |

## Assets

Images, fonts and videos are referenced from the store's CDN (`froyaorganics.com/cdn/…`
and `cdn.shopify.com/…`) exactly as the live page references them. The environment this
recreation was built in could not reach those hosts, so they were not vendored. To make the
repo self-contained, run once from a machine with normal internet access:

```sh
python3 scripts/localize_assets.py          # downloads ~260 files and rewrites the references
python3 scripts/localize_assets.py --dry-run
```

## Behaviour notes

* The header, mega menus, drawer, carousels, gallery, modal, buy-box toggle and videos are
  fully functional client-side.
* There is no storefront backend: "Add to cart" hands off to the live product page with the
  chosen variant/selling plan, the newsletter form posts to the live store's contact endpoint,
  and navigation links point at the live store.
* Hidden/utility parts of the original page (Shopify pixels, cookie consent, chat widget,
  Klaviyo, Loox scripts, the legacy hidden header and mini-cart drawer) are intentionally
  omitted; nothing visible depends on them.
