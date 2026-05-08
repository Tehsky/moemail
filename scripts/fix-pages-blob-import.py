from pathlib import Path
import re

worker = Path('.vercel/output/static/_worker.js/index.js')
if not worker.exists():
    raise SystemExit('worker file not found')

text = worker.read_text(encoding='utf-8', errors='ignore')

blob_pattern = re.compile(r'async function xe\(e\)\{if\(e\.url\.startsWith\("blob:"\)\)try\{.*?\}catch\{\}return null\}', re.S)
text, blob_count = blob_pattern.subn('async function xe(e){return null}', text, count=1)

cache_pattern = re.compile(r'async function _e\(\)\{return process\.env\.__NEXT_ON_PAGES__KV_SUSPENSE_CACHE\?W\("kv"\):W\("cache-api"\)\}async function W\(e\)\{let t=await import\(`\./__next-on-pages-dist__/cache/\$\{e\}\.js`\);return new t\.default\}', re.S)
cache_replacement = 'async function _e(){return null}async function W(e){return null}'
text, cache_count = cache_pattern.subn(cache_replacement, text, count=1)

if blob_count == 0 and cache_count == 0:
    raise SystemExit('no target patches applied')

worker.write_text(text, encoding='utf-8')
print(f'patched worker: blob={blob_count}, cache={cache_count}')
