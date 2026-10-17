from pathlib import Path
from html.parser import HTMLParser
import re

root=Path(__file__).resolve().parents[1]
dist=root/'dist'
html=(dist/'index.html').read_text()
js=(dist/'script.js').read_text()
css=(dist/'style.css').read_text()
config=(dist/'audio-config.js').read_text()
class Parser(HTMLParser):
    def __init__(self):
        super().__init__();self.ids=[];self.refs=[];self.audio=[];self.template=None;self.tags={};self.text={}
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if 'id' in a:self.ids.append(a['id'])
        for key in ['src','href']:
            if a.get(key,'').startswith('./'):self.refs.append(a[key].split('?')[0])
        if tag=='audio':self.audio.append(a)
        if tag=='template':self.template=a['id'];self.tags[self.template]=[];self.text[self.template]=[]
        if self.template:self.tags[self.template].append((tag,a))
    def handle_endtag(self,tag):
        if tag=='template':self.template=None
    def handle_data(self,data):
        if self.template:self.text[self.template].append(data)
p=Parser();p.feed(html)
assert len(set(p.ids))==len(p.ids),'Duplicate HTML IDs'
for ref in p.refs:assert (dist/ref).is_file(),ref
for name in re.findall(r"querySelector\(['\"]#([a-z-]+)['\"]\)",js):assert name in p.ids,name
assert len(p.audio)==1 and 'loop' in p.audio[0]
projects=re.search(r'<template id="projects-content">(.*?)</template>',html,re.S).group(1)
assert sum(tag=='div' and a.get('class')=='project' for tag,a in p.tags['projects-content'])==3
assert projects.index('Courtsift.com')<projects.index('NBA News Intelligence &amp; Market Analysis')<projects.index('NBA Shot Make Predictor')
goal='Ultimately, the goal is to have a live X NBA injury reporting data pipeline with an accompanying model to predict changes in Kalshi betting lines'
assert '<strong>'+goal+'</strong>' in projects
assert any(tag=='a' and a.get('href')=='https://courtsift.com/' for tag,a in p.tags['projects-content'])
assert any(tag=='img' and a.get('src')=='./assets/courtsift-wordmark.png' for tag,a in p.tags['projects-content'])
for fact in ['18,519','41.4 million','88 announcement-linked','425K+','58 shot-geometry','0.620','10% improvement']:
    assert fact in projects,fact
assert 'Sample project' not in html and 'In Progress' not in html and 'The full CV' not in html
cv=re.search(r'<template id="cv-content">(.*?)</template>',html,re.S).group(1)
assert 'UCLA · Mathematics of Computation' in cv and 'GPA: 3.8 / 4.0' in cv and 'Class of 2028' in cv
assert sum(tag=='section' and a.get('class')=='experience' for tag,a in p.tags['cv-content'])==7
orgs=['UCLA Mobility Lab','BruinML','UCLA Math Circle','UCLA Discovering Math Summer Institute','Algoverse','NASA Robotics Systems Technology','Robotics For The Spectrum']
for org in orgs:assert org in cv,org
assert re.search(r'<section class="experience"><h3>(.*?)</h3>',cv).group(1)=='ML Research Assistant'
assert cv.index('UCLA Mobility Lab')<min(cv.index(org) for org in orgs[1:])
contact=' '.join(x.strip() for x in p.text['contact-content'] if x.strip())
assert contact=='Back to card Contact alecjrostamian@gmail.com',contact
assert any(tag=='a' and a.get('href')=='mailto:alecjrostamian@gmail.com' for tag,a in p.tags['contact-content'])
assert 'alecr2024@gmail.com' not in html
assert "back.classList.toggle('contact-open',name==='contact')" in js
assert '.back.contact-open .back-footer{display:none}' in css
assert 'overscroll-behavior:contain' in css and 'overflow-y:auto;overflow-x:hidden' in css
source=re.search(r"source: '([^']+)'",config).group(1)
assert (dist/source).is_file(),source
for path in dist.rglob('*'):
    assert path.name not in ['.openai','hosting.json','_headers']
    if path.is_file() and path.suffix not in ['.mp3','.png']:
        text=path.read_text()
        for forbidden in ['crepuscolo','Piero Umiliani','BMPGD30Ymx0','appgprj_','Bearer ']:
            assert forbidden.lower() not in text.lower(),(path,forbidden)
assert len(list(dist.rglob('*.mp3')))==1
assert not list(dist.rglob('*.pdf')),'No resume PDFs should be published'
assert (dist/'.nojekyll').is_file()
print('PASS: references, IDs, audio, three ordered projects, exact bold goal, all seven CV experiences, UCLA/GPA, minimal Contact/email, contained scrolling, and publish-directory exclusions.')
