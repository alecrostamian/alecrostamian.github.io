from pathlib import Path
from html.parser import HTMLParser
import re

root=Path(__file__).resolve().parents[1]
dist=root/'dist'
html=(dist/'index.html').read_text()
js=(dist/'script.js').read_text()
config=(dist/'audio-config.js').read_text()
class Parser(HTMLParser):
    def __init__(self):super().__init__();self.ids=[];self.refs=[];self.audio=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if 'id' in a:self.ids.append(a['id'])
        for key in ['src','href']:
            if a.get(key,'').startswith('./'):self.refs.append(a[key].split('?')[0])
        if tag=='audio':self.audio.append(a)
p=Parser();p.feed(html)
assert len(set(p.ids))==len(p.ids),'Duplicate HTML IDs'
for ref in p.refs:assert (dist/ref).is_file(),ref
for name in re.findall(r"querySelector\(['\"]#([a-z-]+)['\"]\)",js):assert name in p.ids,name
assert len(p.audio)==1 and 'loop' in p.audio[0]
assert html.count('Sample project · layout preview')==10
assert 'The full CV will be added here.' in html
source=re.search(r"source: '([^']+)'",config).group(1)
assert (dist/source).is_file(),source
for path in dist.rglob('*'):
    assert path.name not in ['.openai','hosting.json','_headers']
    if path.is_file() and path.suffix!='.mp3':
        text=path.read_text()
        for forbidden in ['crepuscolo','Piero Umiliani','BMPGD30Ymx0','appgprj_','Bearer ']:
            assert forbidden.lower() not in text.lower(),(path,forbidden)
assert len(list(dist.rglob('*.mp3')))==1
assert (dist/'.nojekyll').is_file()
print('PASS: local references, IDs, audio source/loop, ten labeled samples, placeholder CV, and publish-directory exclusion checks.')
