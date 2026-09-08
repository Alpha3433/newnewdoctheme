"""Split a Chrome "Webpage, Complete" capture of the live page into cleaned per-section files.

Usage: python3 tools/extract.py <saved-page.html> [work-dir]
Rewrites local `_files/` asset references back to the store CDN and writes one HTML file per
Shopify section (plus the inline <head> CSS) for tools/build.py to consume.
"""
import re, os, json
from bs4 import BeautifulSoup, Comment

import sys
SRC=sys.argv[1] if len(sys.argv)>1 else 'src.html'
OUT=sys.argv[2] if len(sys.argv)>2 else '.work/sections'
CDN='https://froyaorganics.com/cdn/shop/files/'
os.makedirs(OUT, exist_ok=True)
s=open(SRC,encoding='utf-8').read()
soup=BeautifulSoup(s,'html5lib')

# ---- collect head style blocks before stripping
head_styles=[''.join(str(c) for c in st.contents) for st in soup.head.find_all('style')]
open(f'{OUT}/00-head-styles.css','w').write('\n\n/* ---- block ---- */\n'.join(head_styles))

# ---- strip scripts (keep ld+json), links, comments
for t in soup.find_all('script'):
    if t.get('type')!='application/ld+json': t.decompose()
for t in soup.find_all('link'): t.decompose()
for c in soup.find_all(string=lambda x: isinstance(x, Comment)): c.extract()

def local_name(u):
    n=u.split('_files/')[-1]
    n=re.sub(r'\(\d+\)(?=\.[a-z0-9]+$)','',n)
    return n

def first_srcset_url(ss):
    if not ss: return None
    u=ss.split(',')[0].strip().split(' ')[0]
    return u or None

def base_from_srcset_url(u):
    if u.startswith('//'): u='https:'+u
    path,_,q=u.partition('?')
    v=re.search(r'v=(\d+)',q)
    return path+('?v='+v.group(1) if v else '')

log=[]
# ---- rewrite <img>
for img in soup.find_all('img'):
    src=img.get('src','')
    if '_files/' in src:
        cand=None
        own=first_srcset_url(img.get('srcset'))
        if own and 'cdn/shop' in own: cand=base_from_srcset_url(own)
        if not cand and img.parent and img.parent.name=='picture':
            for so in img.parent.find_all('source'):
                u=first_srcset_url(so.get('srcset'))
                if u and 'cdn/shop' in u:
                    cand=base_from_srcset_url(u); cand=cand  # webp variant ok as base? strip format
                    break
        if not cand:
            cand=CDN+local_name(src)
            log.append(('reconstructed',local_name(src)))
        img['src']=cand
# ---- fix protocol-relative srcsets and other attrs
for tag in soup.find_all(True):
    for attr in ('srcset','src','href','poster','data-src','data-bg','content'):
        v=tag.get(attr)
        if isinstance(v,str):
            if v.startswith('//froyaorganics.com'): tag[attr]='https:'+v
            elif '//froyaorganics.com' in v and attr=='srcset': tag[attr]=v.replace('//froyaorganics.com','https://froyaorganics.com')
            elif '_files/' in v and attr!='src':
                n=local_name(v)
                if n.endswith('.html'): tag[attr]='#'
                else: tag[attr]=CDN+n; log.append(('reconstructed-attr',attr,n))
    st=tag.get('style')
    if st and '_files/' in st:
        tag['style']=re.sub(r'url\(["\']?[^)]*_files/([^)"\']*)["\']?\)', lambda m: f'url({CDN}{local_name(m.group(1))})', st)
        log.append(('style-url',tag.name))

# ---- split body into sections
body=soup.body
i=0
def section_iter(el):
    for ch in el.children:
        if getattr(ch,'name',None) is None: continue
        if ch.get('id','').startswith('shopify-section-'):
            yield ch
        else:
            yield ch
for ch in section_iter(body):
    i+=1
    sid=ch.get('id') or ch.name
    name=re.sub(r'shopify-section-(sections--\d+__|template--\d+__)?','',sid)[:60]
    html=str(ch)
    open(f'{OUT}/{i:02d}-{name}.html','w').write(html)
    print(f"{i:02d} {name:55s} {len(html):7d} chars  styles={len(ch.find_all('style'))}")
json.dump(log,open(f'{OUT}/rewrite-log.json','w'),indent=1)
print("reconstructed:",len(log))
open(f'{OUT}/clean-full.html','w').write(str(soup))

# ---- split the <main> wrapper into its template sections
main_file=[f for f in os.listdir(OUT) if f.endswith('-main.html')]
if main_file:
    msoup=BeautifulSoup(open(f'{OUT}/{main_file[0]}').read(),'html5lib')
    main=msoup.body.find(True)
    os.makedirs(f'{OUT}/main',exist_ok=True)
    j=0
    for ch in main.find_all(True,recursive=False):
        j+=1
        sid=ch.get('id') or ch.name
        name=re.sub(r'shopify-section-(template--\d+__)?','',sid)[:60]
        open(f'{OUT}/main/{j:02d}-{name}.html','w').write(str(ch))
    print('main split into',j,'sections')
