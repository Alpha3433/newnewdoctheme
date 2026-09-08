#!/usr/bin/env python3
"""Assemble the static recreation of the Frøya Organics landing page.

Usage: python3 tools/build.py [work-dir/sections] [blaze-slider-package-dir]
Run tools/extract.py first. The blaze-slider directory is optional; when omitted the vendored
copy already in assets/vendor/blaze-slider is kept.

Reads the cleaned per-section markup produced by extract.py and writes:
  index.html                      – the page
  assets/css/critical.css         – verbatim inline <head> CSS from the live page (fonts, variables)
  assets/css/sections-inline.css  – verbatim per-section inline CSS from the live page
  assets/vendor/blaze-slider/*    – slider library used by the live page
"""
import os, re, shutil, html
from bs4 import BeautifulSoup, Comment

import sys, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
SEC = sys.argv[1] if len(sys.argv) > 1 else str(ROOT / 'tools' / '.work' / 'sections')
OUT = str(ROOT)
VENDOR = sys.argv[2] if len(sys.argv) > 2 else None  # path to an unpacked blaze-slider npm package
SITE = 'https://froyaorganics.com'
PAGE_URL = SITE + '/pages/fr-ya-organics-hyper-potent-arctic-balms-for-mature-skin'

os.makedirs(f'{OUT}/assets/css', exist_ok=True)
os.makedirs(f'{OUT}/assets/js', exist_ok=True)
os.makedirs(f'{OUT}/assets/vendor/blaze-slider', exist_ok=True)

def root_of(path):
    soup = BeautifulSoup(open(path, encoding='utf-8').read(), 'html5lib')
    return soup.body.find(True)

def fix_url(v):
    v = v.replace('//froyaorganics.com', 'https://froyaorganics.com').replace('https:https://', 'https://')
    v = v.replace('http://froyaorganics.com', 'https://froyaorganics.com')
    return v

section_styles = []

def clean(el, label):
    """Strip lazy-load leftovers, tracking hooks and inline <style> (collected separately)."""
    for st in el.find_all('style'):
        css = ''.join(str(c) for c in st.contents).strip()
        if css:
            section_styles.append((label, css))
        st.decompose()
    for c in el.find_all(string=lambda x: isinstance(x, Comment)):
        c.extract()
    for so in el.find_all('source'):
        if not so.get('srcset') and not so.get('src'):
            so.decompose()
    for t in el.find_all(True):
        for a in list(t.attrs):
            v = t.attrs[a]
            if isinstance(v, list):
                v = ' '.join(v).strip()
                if not v:
                    del t.attrs[a]
                else:
                    t.attrs[a] = v
                continue
            if a in ('onclick', 'onload', 'onerror'):
                del t.attrs[a]; continue
            if a in ('srcset', 'sizes', 'style', 'class') and v.strip() == '':
                del t.attrs[a]; continue
            if a == 'sizes' and not t.get('srcset'):
                del t.attrs[a]; continue
            if 'froyaorganics.com' in v or v.startswith('//'):
                t.attrs[a] = fix_url(v)
        h = t.get('href')
        if h:
            if h.startswith(PAGE_URL + '#'):
                t['href'] = '#' + h.split('#', 1)[1]
            elif h == PAGE_URL:
                t['href'] = '#'
        # decoding="sync" is a saved-DOM artefact
        if t.name == 'img' and t.get('decoding') == 'sync':
            t['decoding'] = 'async'
    return el

def serialize(el):
    s = str(el)
    return s

# ---------------------------------------------------------------- pieces
pieces = []

svg_defs = '''<svg class="visually-hidden" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="rating-star-gradient-half">
      <stop offset="50%" stop-color="rgb(var(--product-star-rating))"></stop>
      <stop offset="50%" stop-color="rgb(var(--product-star-rating))" stop-opacity="0.4"></stop>
    </linearGradient>
    <symbol id="looxicons-rating-icon" viewBox="0 0 24 24">
      <path d="M12 2.5l2.83 6.05 6.63.72-4.9 4.53 1.32 6.55L12 17.06l-5.88 3.29 1.32-6.55-4.9-4.53 6.63-.72L12 2.5z"></path>
    </symbol>
  </defs>
</svg>'''
pieces.append(svg_defs)
pieces.append('<a class="visually-hidden skip-to-content" href="#main">Skip to content</a>')

ORDER = [
    ('04-announcement-bar.html', 'announcement-bar'),
    ('12-froya-nav-variant.html', 'froya-nav-variant'),
]
MAIN_ORDER = [
    ('01-hero_banner_BnFCDE.html', 'hero'),
    ('02-icons_with_text_hPpB9d.html', 'icons-with-text-benefits'),
    ('04-icons_slider_Nt3UqE.html', 'icons-slider-press'),
    ('05-reviews_slider_hyUAzq.html', 'reviews-slider'),
    ('06-backed_by_science_VNNFmb.html', 'backed-by-science'),
    ('07-image_content_grid_XgREqy.html', 'image-content-grid-clinical'),
    ('08-custom_featured_product_m69X4b.html', 'featured-product'),
    ('09-custom_image_and_text_hqnCVC.html', 'image-and-text-story'),
    ('10-icons_with_text_HTCEin.html', 'icons-with-text-arctic'),
    ('11-custom_liquid_rgXzGz.html', 'raw-reviews'),
    ('12-guarantee_section_Bmz8mb.html', 'guarantee-1'),
    ('13-videos_slider_r6HaLL.html', 'videos-slider'),
    ('14-how_to_use_Qx9RrL.html', 'how-to-use'),
    ('15-custom_image_with_text_blocks_bwNcEH.html', 'image-with-text-blocks'),
    ('16-custom_image_and_text_HqBW3P.html', 'image-and-text-arctic'),
    ('17-guarantee_section_wQCwd3.html', 'guarantee-2'),
    ('18-custom_newsletter_d3YipT.html', 'newsletter'),
]

for f, label in ORDER:
    el = clean(root_of(f'{SEC}/{f}'), label)
    pieces.append(f'\n<!-- ===== {label} ===== -->\n' + serialize(el))

main_parts = []
for f, label in MAIN_ORDER:
    el = clean(root_of(f'{SEC}/main/{f}'), label)
    main_parts.append(f'\n<!-- ===== {label} ===== -->\n' + serialize(el))
pieces.append('\n<div id="main" class="anchor" role="main">' + ''.join(main_parts) + '\n</div>')

footer = clean(root_of(f'{SEC}/17-footer.html'), 'footer')
pieces.append('\n<!-- ===== footer ===== -->\n' + serialize(footer))

body_html = '\n'.join(pieces)

# ---------------------------------------------------------------- head CSS (verbatim from the live page)
head_css = open(f'{SEC}/00-head-styles.css', encoding='utf-8').read().split('/* ---- block ---- */')
KEEP = [0, 1, 3, 4, 5, 6, 7, 8, 9, 10, 13]
crit = []
for i in KEEP:
    b = head_css[i].strip()
    if not b:
        continue
    b = fix_url(b)
    b = re.sub(r"@import 'https://fonts.googleapis.com[^']*';\n?", '', b)  # loaded via <link> instead
    crit.append(f'/* ---- live-page inline head style block {i} ---- */\n{b}')
critical = ('/* Verbatim inline <head> CSS captured from the live page (fonts, CSS variables, critical layout). */\n\n'
            + '\n\n'.join(crit) + '\n')
open(f'{OUT}/assets/css/critical.css', 'w', encoding='utf-8').write(critical)

sec_css = ['/* Verbatim per-section inline CSS captured from the live page. Section ids are preserved in index.html so these rules apply unchanged. */']
for label, css in section_styles:
    sec_css.append(f'\n/* ---- {label} ---- */\n{fix_url(css)}')
open(f'{OUT}/assets/css/sections-inline.css', 'w', encoding='utf-8').write('\n'.join(sec_css) + '\n')

# ---------------------------------------------------------------- vendor
if VENDOR:
    shutil.copy(f'{VENDOR}/dist/blaze.css', f'{OUT}/assets/vendor/blaze-slider/blaze.css')
    shutil.copy(f'{VENDOR}/dist/blaze-slider.min.js', f'{OUT}/assets/vendor/blaze-slider/blaze-slider.min.js')

# ---------------------------------------------------------------- page
page = f'''<!DOCTYPE html>
<html class="js" lang="en" dir="ltr" data-froya-nav="b">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="theme-color" content="#1f1f1f">
  <title>Frøya Organics - Hyper Potent Arctic Balms for Mature Skin | Frøya Organics</title>
  <meta name="description" content="Frøya Organics - Arctic skincare made from potent Nordic plants. Better skin in 60 days or money back. 80,000+ happy customers. Shop now and save 46%.">
  <link rel="canonical" href="{PAGE_URL}">
  <link rel="shortcut icon" href="https://froyaorganics.com/cdn/shop/files/Frame_19.svg?crop=center&amp;height=96&amp;v=1726043861&amp;width=96" type="image/svg+xml">
  <meta property="og:type" content="website">
  <meta property="og:title" content="Frøya Organics - Hyper Potent Arctic Balms for Mature Skin">
  <meta property="og:description" content="Arctic skincare made from potent Nordic plants. Better skin guaranteed.">
  <meta property="og:image" content="https://froyaorganics.com/cdn/shop/files/The_Complete_System_for_Mature_Women_s_Skin-02.webp?v=1743832396">
  <meta property="og:url" content="{PAGE_URL}">
  <meta property="og:site_name" content="Frøya Organics">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Frøya Organics - Hyper Potent Arctic Balms for Mature Skin">
  <meta name="twitter:description" content="Arctic skincare made from potent Nordic plants. Better skin guaranteed.">

  <link rel="preconnect" href="https://cdn.shopify.com" crossorigin>
  <link rel="preconnect" href="https://froyaorganics.com" crossorigin>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Caveat:wght@400..700&display=swap">

  <link rel="stylesheet" href="assets/css/critical.css">
  <link rel="stylesheet" href="assets/vendor/blaze-slider/blaze.css">
  <link rel="stylesheet" href="assets/css/theme.css">
  <link rel="stylesheet" href="assets/css/sections-inline.css">
  <link rel="stylesheet" href="assets/css/sections.css">
</head>
<body class="no-focus-outline features--image-zoom page froya-organics-hyper-potent-arctic-balms-for-mature-skin template--fr-ya-organics-hyper-potent-arctic-balms-for-mature-skin">
{body_html}

<script src="assets/vendor/blaze-slider/blaze-slider.min.js"></script>
<script src="assets/js/main.js" defer></script>
</body>
</html>
'''
open(f'{OUT}/index.html', 'w', encoding='utf-8').write(page)
print('index.html', len(page), 'bytes;', len(section_styles), 'section style blocks;', 'critical.css', len(critical))
