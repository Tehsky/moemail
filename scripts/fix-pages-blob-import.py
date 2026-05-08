from pathlib import Path
import re

worker = Path('.vercel/output/static/_worker.js/index.js')
if not worker.exists():
    raise SystemExit('worker file not found')

text = worker.read_text(encoding='utf-8', errors='ignore')
pattern = re.compile(r'async function xe\(e\)\{if\(e\.url\.startsWith\("blob:"\)\)try\{.*?\}catch\{\}return null\}', re.S)
new = 'async function xe(e){return null}'
text2, count = pattern.subn(new, text, count=1)
if count == 0:
    raise SystemExit('target blob import function not found')
worker.write_text(text2, encoding='utf-8')
print('patched blob import function in', worker)
