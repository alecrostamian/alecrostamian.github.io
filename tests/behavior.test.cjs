'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..', 'dist');
const config = fs.readFileSync(path.join(root, 'audio-config.js'), 'utf8');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
class Element {
  constructor(id) {
    this.id=id; this.hidden=false; this.disabled=true; this.inert=false;
    this.listeners={}; this.attributes={}; this.classes=new Set();
    this.classList={add:n=>this.classes.add(n),remove:n=>this.classes.delete(n),toggle:(n,v)=>v?this.classes.add(n):this.classes.delete(n)};
    this.children=[]; this.clientWidth=600; this.clientHeight=400;
    this.currentTime=0; this.duration=NaN; this.paused=true; this.playCalls=0;
    this.content={cloneNode:()=>new Element('cloned-template')};
  }
  addEventListener(name, fn){(this.listeners[name]??=[]).push(fn);}
  fire(name, value={}){for(const fn of this.listeners[name]||[]) fn(value);}
  setAttribute(name,value){this.attributes[name]=value;}
  replaceChildren(...nodes){this.children=nodes; this.returnButton=new Element('return-button');}
  append(node){this.children.push(node);}
  querySelector(selector){return selector==='.return-button'?this.returnButton:null;}
  focus(){this.focused=true;}
  play(){this.playCalls++;this.paused=false;this.fire('play');return Promise.resolve();}
  pause(){this.paused=true;this.fire('pause');}
  click(){this.fire('click');}
}
function harness(hash=''){
  const ids=['card','front','back','menu','detail','audio','audio-play','audio-seek','audio-status','audio-player','audio-title','audio-credit','play-symbol','audio-time','audio-duration','home','flip','flip-back','projects-content','cv-content','contact-content'];
  const elements=Object.fromEntries(ids.map(id=>[id,new Element(id)]));
  elements.detail.hidden=true;
  const scroll = new Element('back-content');
  const frames=[new Element('frame-front'),new Element('frame-back')];
  const document={...new Element('document'), title:'',querySelector:s=>s==='.back-content'?scroll:elements[s.slice(1)],querySelectorAll:s=>s==='.embossed-frame'?frames:[],createElementNS:(ns,tag)=>new Element(tag),addEventListener:Element.prototype.addEventListener,fire:Element.prototype.fire};
  const window=new Element('window');
  const location={_hash:hash,pathname:'/',search:'',get hash(){return this._hash;},set hash(value){this._hash=value&&!value.startsWith('#')?'#'+value:value;}};
  const history={replaceState:()=>{location.hash='';}};
  const context=vm.createContext({document,window,location,history,ResizeObserver:class{observe(){}},console,Number,String,Math});
  vm.runInContext(config+'\n'+script,context);
  return {elements,document,window,location,context,scroll,frames};
}
(async()=>{
  let h=harness(); const {elements:e}=h;
  assert.equal(e.audio.src,'./assets/debussy-arabesque.mp3');
  assert.equal(e['audio-play'].disabled,false);
  assert.equal(e.audio.playCalls,0,'No autoplay before gesture');
  e.flip.click(); await new Promise(resolve=>setImmediate(resolve));
  assert.equal(e.audio.playCalls,1); assert.equal(e.audio.paused,false);
  assert.equal(e.card.classes.has('is-flipped'),true); assert.equal(e.front.inert,true);
  e['flip-back'].click();
  assert.equal(e.audio.paused,false,'Flipping back preserves playback');
  assert.equal(e.card.classes.has('is-flipped'),false);
  e.flip.click(); await new Promise(resolve=>setImmediate(resolve));
  assert.equal(e.audio.playCalls,1,'Repeated flip does not restart music');
  e['audio-play'].click(); assert.equal(e.audio.paused,true);
  e['flip-back'].click(); e.flip.click(); await new Promise(resolve=>setImmediate(resolve));
  assert.equal(e.audio.paused,true,'Manual pause survives repeated flips');
  assert.equal(e.audio.playCalls,1);
  e['audio-play'].click(); await new Promise(resolve=>setImmediate(resolve)); assert.equal(e.audio.paused,false);
  e.audio.duration=251.350204;e.audio.currentTime=60;e.audio.fire('loadedmetadata');
  assert.equal(e['audio-duration'].textContent,'4:11');assert.equal(e['audio-time'].textContent,'1:00');
  e['audio-seek'].value=50;e['audio-seek'].fire('input');assert.equal(e.audio.currentTime,125.675102);
  h.location.hash='#projects';h.window.fire('hashchange');
  assert.equal(e.detail.hidden,false);assert.equal(e.menu.hidden,true);assert.equal(h.scroll.scrollTop,0);assert.equal(h.document.title,'Projects · Alec Rostamian');
  e.detail.querySelector('.return-button').click();h.window.fire('hashchange');
  assert.equal(e.detail.hidden,true);assert.equal(e.menu.hidden,false);
  h.document.fire('keydown',{key:'Escape'});assert.equal(e.card.classes.has('is-flipped'),false);
  h.location.hash='#contact';h.window.fire('hashchange');assert.equal(h.document.title,'Contact · Alec Rostamian');
  h.document.fire('keydown',{key:'Escape'});h.window.fire('hashchange');assert.equal(h.location.hash,'#card');
  e.audio.fire('error');assert.equal(e['audio-status'].textContent,'Audio unavailable');
  assert.equal(h.frames[0].children[0].children.length,3,'Embossed frame has three SVG paths');
  h=harness('#cv');assert.equal(h.elements.card.classes.has('is-flipped'),true);assert.equal(h.elements.audio.playCalls,0,'Deep link does not autoplay');assert.equal(h.document.title,'Cv · Alec Rostamian');
  h.location.hash='#unknown';h.window.fire('hashchange');assert.equal(h.elements.menu.hidden,false);
  console.log('PASS: startup, first/repeated flips, persistent playback, manual pause, play/pause, metadata, seek, Projects/Contact/CV routes, return, Escape, unknown route, error status, and frame generation.');
  console.log('These are simulated DOM behavior tests, not rendered-browser or audible-playback tests.');
})().catch(error=>{console.error(error);process.exitCode=1;});
