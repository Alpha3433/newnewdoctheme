#!/usr/bin/env python3
"""Vendor every remote asset the theme references (images, fonts, videos) into the flat
Shopify `assets/` folder and rewrite the references:

  sections/*.liquid, snippets/*.liquid  ->  {{ 'file.ext' | asset_url }}
  assets/*.css                          ->  url(file.ext)            (relative, same folder)
  index.html (standalone preview)       ->  assets/file.ext

The recreation ships with assets hot-linked to the Frøya Organics CDN because the
environment it was built in could not reach that CDN. Run this once from a machine
with normal internet access to make the theme fully self-contained:

    python3 scripts/localize_assets.py                 # download + rewrite
    python3 scripts/localize_assets.py --dry-run       # only list what would be fetched
    python3 scripts/localize_assets.py --skip-videos   # leave the (large) mp4 files on the CDN
"""
import hashlib
import os
import re
import sys
import pathlib
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
ASSETS = ROOT / 'assets'
TARGETS = (
    [ROOT / 'index.html']
    + sorted((ROOT / 'assets').glob('*.css'))
    + sorted((ROOT / 'sections').glob('froya-*.liquid'))
    + sorted((ROOT / 'snippets').glob('froya-*.liquid'))
)
URL_RE = re.compile(r'(?:https?:)?//(?:froyaorganics\.com|cdn\.shopify\.com)/[^\s"\'()<>,]+')
DRY = '--dry-run' in sys.argv
SKIP_VIDEOS = '--skip-videos' in sys.argv

_names = {}  # asset file name -> canonical URL (collision guard)


def canonical(url: str) -> str:
    clean = url.replace('&amp;', '&')
    if clean.startswith('//'):
        clean = 'https:' + clean
    return clean


def asset_name(url: str) -> str:
    """Map a CDN URL (query string included) to a flat, Shopify-safe asset file name."""
    u = urllib.parse.urlsplit(canonical(url))
    q = urllib.parse.parse_qs(u.query)
    base = urllib.parse.unquote(os.path.basename(u.path))
    stem, ext = os.path.splitext(base)
    suffix = ''.join(f'_{k[0]}{q[k][0]}' for k in ('width', 'height', 'crop') if k in q)
    if q.get('format', [''])[0] == 'webp':
        ext = '.webp'
    name = re.sub(r'[^A-Za-z0-9._-]+', '_', stem + suffix) + ext.lower()
    key = canonical(url).split('?')[0] + suffix + ext
    if name in _names and _names[name] != key:  # same file name, different source file
        name = f"{os.path.splitext(name)[0]}_{hashlib.sha1(key.encode()).hexdigest()[:6]}{ext.lower()}"
    _names[name] = key
    return name


def fetch(url: str, dest: pathlib.Path) -> bool:
    if dest.exists():
        return True
    req = urllib.request.Request(canonical(url), headers={'User-Agent': 'Mozilla/5.0 (asset localizer)'})
    try:
        with urllib.request.urlopen(req, timeout=120) as r, open(dest, 'wb') as f:
            f.write(r.read())
        return True
    except Exception as exc:  # keep going; report at the end
        print(f'  ! failed {canonical(url)}: {exc}')
        if dest.exists():
            dest.unlink()
        return False


def reference(target: pathlib.Path, name: str) -> str:
    if target.suffix == '.liquid':
        return "{{ '" + name + "' | asset_url }}"
    if target.parent == ASSETS:
        return name
    return 'assets/' + name


def main() -> int:
    ASSETS.mkdir(exist_ok=True)
    seen, failed = {}, []
    for target in TARGETS:
        text = target.read_text(encoding='utf-8')
        urls = sorted(set(URL_RE.findall(text)), key=len, reverse=True)
        print(f'{target.relative_to(ROOT)}: {len(urls)} remote references')
        for url in urls:
            if SKIP_VIDEOS and '/videos/' in url:
                continue
            name = asset_name(url)
            if url not in seen:
                seen[url] = True if DRY else fetch(url, ASSETS / name)
                if not seen[url]:
                    failed.append(url)
            if seen[url] and not DRY:
                text = text.replace(url, reference(target, name))
        if not DRY:
            target.write_text(text, encoding='utf-8')
    print(f'\n{len(seen)} unique assets, {len(failed)} failed')
    for url in failed:
        print('  -', url)
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main())
