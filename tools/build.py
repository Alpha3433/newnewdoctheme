#!/usr/bin/env python3
"""Build the Frøya Organics landing page as a Shopify theme (plus a standalone preview).

Usage: python3 tools/build.py [work-dir/sections] [blaze-slider-package-dir]
Run tools/extract.py first. The blaze-slider directory is optional; when omitted the vendored
copy already in assets/ is kept.

Reads the cleaned per-section markup produced by extract.py and writes:
  sections/froya-*.liquid           – one Liquid section per page section (markup + schema)
  snippets/froya-svg-defs.liquid    – shared SVG symbols used by the star ratings
  templates/index.json              – home page = the landing page
  templates/page.froya-landing.json – the landing page as a page template
  assets/critical.css               – verbatim inline <head> CSS from the live page (fonts, variables)
  assets/sections-inline.css        – verbatim per-section inline CSS from the live page
  assets/blaze.css, blaze-slider.min.js – slider library used by the live page
  index.html                        – standalone preview of the same markup (no Shopify needed)
Hand-written files (layout/, config/, locales/, the other templates/sections, theme.css,
sections.css, main.js) are left untouched.
"""
import os, re, json, shutil, sys, pathlib
from bs4 import BeautifulSoup, Comment

ROOT = pathlib.Path(__file__).resolve().parent.parent
SEC = sys.argv[1] if len(sys.argv) > 1 else str(ROOT / 'tools' / '.work' / 'sections')
OUT = str(ROOT)
VENDOR = sys.argv[2] if len(sys.argv) > 2 else None  # path to an unpacked blaze-slider npm package
SITE = 'https://froyaorganics.com'
PAGE_URL = SITE + '/pages/fr-ya-organics-hyper-potent-arctic-balms-for-mature-skin'

for d in ('assets', 'sections', 'snippets', 'templates'):
    os.makedirs(f'{OUT}/{d}', exist_ok=True)

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
        if t.name == 'img' and t.get('decoding') == 'sync':
            t['decoding'] = 'async'
    return el

# ---------------------------------------------------------------- shared pieces
SVG_DEFS = '''<svg class="visually-hidden" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="rating-star-gradient-half">
      <stop offset="50%" stop-color="rgb(var(--product-star-rating))"></stop>
      <stop offset="50%" stop-color="rgb(var(--product-star-rating))" stop-opacity="0.4"></stop>
    </linearGradient>
    <symbol id="looxicons-rating-icon" viewBox="0 0 24 24">
      <path d="M12 2.5l2.83 6.05 6.63.72-4.9 4.53 1.32 6.55L12 17.06l-5.88 3.29 1.32-6.55-4.9-4.53 6.63-.72L12 2.5z"></path>
    </symbol>
  </defs>
</svg>
<a class="visually-hidden skip-to-content" href="#main">Skip to content</a>'''

# (source file, section handle, editor name ≤ 25 chars)
HEADER_GROUP = [
    ('04-announcement-bar.html', 'froya-announcement-bar', 'Frøya announcement bar'),
    ('12-froya-nav-variant.html', 'froya-header', 'Frøya header'),
]
MAIN_ORDER = [
    ('01-hero_banner_BnFCDE.html', 'froya-hero', 'Frøya hero'),
    ('02-icons_with_text_hPpB9d.html', 'froya-benefits-strip', 'Frøya benefits strip'),
    ('04-icons_slider_Nt3UqE.html', 'froya-press-slider', 'Frøya press slider'),
    ('05-reviews_slider_hyUAzq.html', 'froya-reviews-slider', 'Frøya before & afters'),
    ('06-backed_by_science_VNNFmb.html', 'froya-backed-by-science', 'Frøya backed by science'),
    ('07-image_content_grid_XgREqy.html', 'froya-clinical-trial', 'Frøya clinical trial'),
    ('08-custom_featured_product_m69X4b.html', 'froya-featured-product', 'Frøya featured product'),
    ('09-custom_image_and_text_hqnCVC.html', 'froya-founder-story', 'Frøya founder story'),
    ('10-icons_with_text_HTCEin.html', 'froya-arctic-plants', 'Frøya arctic plants'),
    ('11-custom_liquid_rgXzGz.html', 'froya-review-wall', 'Frøya review wall'),
    ('12-guarantee_section_Bmz8mb.html', 'froya-guarantee', 'Frøya guarantee'),
    ('13-videos_slider_r6HaLL.html', 'froya-video-reviews', 'Frøya video reviews'),
    ('14-how_to_use_Qx9RrL.html', 'froya-how-to-use', 'Frøya how to use'),
    ('15-custom_image_with_text_blocks_bwNcEH.html', 'froya-ingredient-quality', 'Frøya ingredient quality'),
    ('16-custom_image_and_text_HqBW3P.html', 'froya-arctic-ingredients', 'Frøya arctic ingredients'),
    ('17-guarantee_section_wQCwd3.html', 'froya-guarantee-2', 'Frøya guarantee (2)'),
    ('18-custom_newsletter_d3YipT.html', 'froya-newsletter', 'Frøya newsletter'),
]
FOOTER = ('17-footer.html', 'froya-footer', 'Frøya footer')

def section_file(handle, name, markup, presets=True):
    schema = {"name": name, "settings": []}
    if presets:
        schema["presets"] = [{"name": name}]
    body = (f"{{% comment %}}\n  {name} – markup recreated from the live Frøya Organics landing page.\n"
            f"  Styles: assets/sections-inline.css (verbatim) + assets/sections.css / theme.css.\n{{% endcomment %}}\n"
            f"{markup}\n\n{{% schema %}}\n{json.dumps(schema, ensure_ascii=False, indent=2)}\n{{% endschema %}}\n")
    open(f'{OUT}/sections/{handle}.liquid', 'w', encoding='utf-8').write(body)

html_parts = []  # for the standalone preview
html_parts.append(SVG_DEFS)

for f, handle, name in HEADER_GROUP:
    el = clean(root_of(f'{SEC}/{f}'), handle)
    markup = str(el)
    section_file(handle, name, markup, presets=False)
    html_parts.append(f'\n<!-- ===== {handle} ===== -->\n' + markup)

main_parts = []
template_sections, template_order = {}, []
for f, handle, name in MAIN_ORDER:
    el = clean(root_of(f'{SEC}/main/{f}'), handle)
    markup = str(el)
    section_file(handle, name, markup)
    key = handle.replace('froya-', '')
    template_sections[key] = {"type": handle, "settings": {}}
    template_order.append(key)
    main_parts.append(f'\n<!-- ===== {handle} ===== -->\n' + markup)
html_parts.append('\n<div id="main" class="anchor" role="main">' + ''.join(main_parts) + '\n</div>')

f, handle, name = FOOTER
footer = clean(root_of(f'{SEC}/{f}'), handle)
section_file(handle, name, str(footer), presets=False)
html_parts.append(f'\n<!-- ===== {handle} ===== -->\n' + str(footer))

open(f'{OUT}/snippets/froya-svg-defs.liquid', 'w', encoding='utf-8').write(SVG_DEFS + '\n')

template = {"sections": template_sections, "order": template_order}
for t in ('index.json', 'page.froya-landing.json'):
    open(f'{OUT}/templates/{t}', 'w', encoding='utf-8').write(json.dumps(template, indent=2, ensure_ascii=False) + '\n')

# ---------------------------------------------------------------- CSS captured verbatim from the live page
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
open(f'{OUT}/assets/critical.css', 'w', encoding='utf-8').write(critical)

sec_css = ['/* Verbatim per-section inline CSS captured from the live page. Section ids are preserved in the markup so these rules apply unchanged. */']
for label, css in section_styles:
    sec_css.append(f'\n/* ---- {label} ---- */\n{fix_url(css)}')
open(f'{OUT}/assets/sections-inline.css', 'w', encoding='utf-8').write('\n'.join(sec_css) + '\n')

# ---------------------------------------------------------------- vendor (Blaze Slider, MIT)
if VENDOR:
    shutil.copy(f'{VENDOR}/dist/blaze.css', f'{OUT}/assets/blaze.css')
    shutil.copy(f'{VENDOR}/dist/blaze-slider.min.js', f'{OUT}/assets/blaze-slider.min.js')

# ---------------------------------------------------------------- standalone preview
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

  <link rel="stylesheet" href="assets/critical.css">
  <link rel="stylesheet" href="assets/blaze.css">
  <link rel="stylesheet" href="assets/theme.css">
  <link rel="stylesheet" href="assets/sections-inline.css">
  <link rel="stylesheet" href="assets/sections.css">
</head>
<body class="no-focus-outline features--image-zoom page froya-organics-hyper-potent-arctic-balms-for-mature-skin template--fr-ya-organics-hyper-potent-arctic-balms-for-mature-skin">
{chr(10).join(html_parts)}

<script src="assets/blaze-slider.min.js"></script>
<script src="assets/main.js" defer></script>
</body>
</html>
'''
open(f'{OUT}/index.html', 'w', encoding='utf-8').write(page)
print(f'wrote {len(HEADER_GROUP) + len(MAIN_ORDER) + 1} sections, 2 templates, index.html ({len(page)} bytes), '
      f'{len(section_styles)} inline style blocks, critical.css {len(critical)} bytes')
