#!/usr/bin/env python3
"""Download every remote asset the page references (images, fonts, videos) into
assets/remote/ and rewrite the page + stylesheets to use the local copies.

The recreation ships with assets hot-linked to the Frøya Organics CDN because the
environment it was built in could not reach that CDN. Run this once from a machine
with normal internet access to make the repo fully self-contained:

    python3 scripts/localize_assets.py            # download + rewrite
    python3 scripts/localize_assets.py --dry-run  # only list what would be fetched
"""
import os
import re
import sys
import pathlib
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
TARGETS = [
    ROOT / 'index.html',
    ROOT / 'assets/css/critical.css',
    ROOT / 'assets/css/sections-inline.css',
    ROOT / 'assets/css/theme.css',
    ROOT / 'assets/css/sections.css',
]
OUT = ROOT / 'assets' / 'remote'
URL_RE = re.compile(r'(?:https?:)?//(?:froyaorganics\.com|cdn\.shopify\.com)/[^\s"\'()<>,]+')
DRY = '--dry-run' in sys.argv


def local_path(url: str) -> pathlib.Path:
    """Map a CDN URL (query string included) to a stable file name under assets/remote/."""
    clean = url.replace('&amp;', '&')
    if clean.startswith('//'):
        clean = 'https:' + clean
    u = urllib.parse.urlsplit(clean)
    q = urllib.parse.parse_qs(u.query)
    stem, ext = os.path.splitext(u.path.lstrip('/'))
    suffix = ''.join(f'_{k[0]}{q[k][0]}' for k in ('width', 'height', 'crop') if k in q)
    if q.get('format', [''])[0] == 'webp':
        ext = '.webp'
    return OUT / u.netloc / (stem + suffix + ext)


def fetch(url: str, dest: pathlib.Path) -> bool:
    if dest.exists():
        return True
    clean = url.replace('&amp;', '&')
    if clean.startswith('//'):
        clean = 'https:' + clean
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(clean, headers={'User-Agent': 'Mozilla/5.0 (asset localizer)'})
    try:
        with urllib.request.urlopen(req, timeout=60) as r, open(dest, 'wb') as f:
            f.write(r.read())
        return True
    except Exception as exc:  # keep going; report at the end
        print(f'  ! failed {clean}: {exc}')
        if dest.exists():
            dest.unlink()
        return False


def main() -> int:
    seen, failed = {}, []
    for target in TARGETS:
        text = target.read_text(encoding='utf-8')
        urls = sorted(set(URL_RE.findall(text)), key=len, reverse=True)
        print(f'{target.relative_to(ROOT)}: {len(urls)} remote references')
        for url in urls:
            dest = local_path(url)
            if url not in seen:
                ok = True if DRY else fetch(url, dest)
                seen[url] = ok
                if not ok:
                    failed.append(url)
            if seen[url] and not DRY:
                rel = os.path.relpath(dest, target.parent).replace(os.sep, '/')
                text = text.replace(url, rel)
        if not DRY:
            target.write_text(text, encoding='utf-8')
    print(f'\n{len(seen)} unique assets, {len(failed)} failed')
    for url in failed:
        print('  -', url)
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main())
