#!/usr/bin/env python3
"""Rebuild index.html (the standalone preview) from the theme's own section files.

Usage: python3 tools/preview.py

Reads the markup of every landing-page section (sections/froya-*.liquid, in the order of
templates/index.json, wrapped by the announcement bar, header and footer) and writes index.html
with the same page shell that tools/build.py produces. Run it after editing section copy so the
preview stays in sync with the theme.
"""
import json, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = 'https://shopelaren.com'
TITLE = 'Elaren – Pumpkin Seed Regrowth Oil with Caffeine Complex for Women’s Hair Loss'
DESCRIPTION = ('Elaren Pumpkin Seed Regrowth Oil with Caffeine Complex: a lightweight scalp oil for women over 35 with '
               'thinning hair, shedding and alopecia. Less shedding in 2 weeks, fuller hair in 90 days, or your money back.')
OG_IMAGE = 'https://cdn.shopify.com/s/files/1/0864/8805/6165/files/hf_20260829_035333_efaf5036-06d2-4002-8b73-07e053393e74.png?v=1787975824'


def markup(section):
    text = (ROOT / 'sections' / f'{section}.liquid').read_text(encoding='utf-8')
    body = text.split('{% endcomment %}', 1)[1]
    body = re.split(r'\{%\s*schema\s*%\}', body)[0]
    return body.strip('\n')


template = json.loads((ROOT / 'templates' / 'index.json').read_text(encoding='utf-8'))
svg_defs = (ROOT / 'snippets' / 'froya-svg-defs.liquid').read_text(encoding='utf-8').strip('\n')

parts = [svg_defs]
for handle in ('froya-announcement-bar', 'froya-header'):
    parts.append(f'\n<!-- ===== {handle} ===== -->\n' + markup(handle))
main = []
for key in template['order']:
    handle = template['sections'][key]['type']
    main.append(f'\n<!-- ===== {handle} ===== -->\n' + markup(handle))
parts.append('\n<div id="main" class="anchor" role="main">' + ''.join(main) + '\n</div>')
parts.append('\n<!-- ===== froya-footer ===== -->\n' + markup('froya-footer'))

page = f'''<!DOCTYPE html>
<html class="js" lang="en" dir="ltr" data-froya-nav="b">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="theme-color" content="#1f1f1f">
  <title>{TITLE} | Elaren</title>
  <meta name="description" content="{DESCRIPTION}">
  <link rel="canonical" href="{SITE}/">
  <meta property="og:type" content="website">
  <meta property="og:title" content="{TITLE}">
  <meta property="og:description" content="{DESCRIPTION}">
  <meta property="og:image" content="{OG_IMAGE}">
  <meta property="og:url" content="{SITE}/">
  <meta property="og:site_name" content="Elaren">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{TITLE}">
  <meta name="twitter:description" content="{DESCRIPTION}">

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
<body class="no-focus-outline features--image-zoom page elaren-pumpkin-seed-regrowth-oil template--elaren-landing">
{chr(10).join(parts)}

<script src="assets/blaze-slider.min.js"></script>
<script src="assets/main.js" defer></script>
</body>
</html>
'''
(ROOT / 'index.html').write_text(page, encoding='utf-8')
print(f'wrote index.html ({len(page)} bytes) from {2 + len(template["order"]) + 1} sections')
