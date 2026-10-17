'use strict';
const assert=require('node:assert/strict');
const {harness}=require('./behavior.test.cjs');

// Deliberately retain obsolete scroll offsets after hiding tall content. A DOM
// simulation cannot reproduce WebKit compositing, but it can catch navigation
// depending on a browser to clamp those offsets or cancel momentum for us.
function leaveDeepScroll(h){
  for(const element of [h.scroll,h.elements.back,h.elements.front,h.stage,h.root]){
    element.scrollTop=2400;element.scrollLeft=24;
  }
  h.elements.detail.focus({preventScroll:true});
}
function assertAtOrigin(h,label){
  for(const element of [h.scroll,h.elements.back,h.elements.front,h.stage,h.root]){
    assert.equal(element.scrollTop,0,`${label}: ${element.id} vertical offset`);
    assert.equal(element.scrollLeft,0,`${label}: ${element.id} horizontal offset`);
  }
}
function route(h,name){h.location.hash=name;h.window.fire('hashchange');}
function assertMenu(h,label){
  assertAtOrigin(h,label);
  assert.equal(h.elements.menu.hidden,false);
  assert.equal(h.elements.detail.hidden,true);
  assert.equal(h.elements.back.inert,false);
  assert.equal(h.elements.front.inert,true);
  assert.equal(h.document.activeElement,h.elements.home);
  assert.equal(h.elements.home.focusOptions.preventScroll,true);
}

for(const viewport of [{width:320,height:568},{width:390,height:844},{width:667,height:375},{width:1280,height:800}]){
  for(const section of ['projects','cv','contact']){
    const h=harness('#'+section,viewport),e=h.elements;
    h.flushFrame();
    leaveDeepScroll(h);
    e['flip-back'].click();
    assertAtOrigin(h,`${viewport.width}px ${section} → front`);
    assert.equal(e.card.classes.has('is-flipped'),false);
    assert.equal(h.document.activeElement,e.flip);
    assert.equal(e.front.inert,false);
    assert.equal(e.back.inert,true);
    e.flip.click();h.window.fire('hashchange');
    assertMenu(h,`${viewport.width}px ${section} → front → menu`);
    h.flushFrame();
    assertMenu(h,'settled menu');
    assert.equal(h.scroll.classes.has('is-resetting-scroll'),false);

    route(h,'#'+section);h.flushFrame();leaveDeepScroll(h);
    e.detail.querySelector('.return-button').click();h.window.fire('hashchange');
    assertMenu(h,'Back to card');h.flushFrame();
    route(h,'#'+section);h.flushFrame();leaveDeepScroll(h);
    e.home.click();h.window.fire('hashchange');
    assertMenu(h,'wordmark');h.flushFrame();
    route(h,'#'+section);h.flushFrame();leaveDeepScroll(h);
    h.document.fire('keydown',{key:'Escape'});h.window.fire('hashchange');
    assertMenu(h,'Escape');h.flushFrame();

    // Hash changes also cover browser history/deep-link navigation.
    for(const destination of ['#projects','#cv','#contact','#card','']){
      leaveDeepScroll(h);route(h,destination);assertAtOrigin(h,'history '+destination);h.flushFrame();
    }
  }
}

// A late momentum update must be cleared before the next paint. Reversing a
// flip before that paint must cancel the stale reset and keep the latest focus.
const h=harness('#cv');h.flushFrame();leaveDeepScroll(h);
h.elements['flip-back'].click();
h.scroll.scrollTop=800;h.scroll.scrollLeft=9;
h.elements.flip.click();h.window.fire('hashchange');
assert.equal(h.pendingFrames.size,1,'Rapid navigation cancels older frames');
h.scroll.scrollTop=500;h.elements.back.scrollLeft=12;
h.flushFrame();assertMenu(h,'momentum and rapid flip');
assert.equal(h.pendingFrames.size,0);

// Already at #card: no hashchange will fire, so the flip itself must reset.
leaveDeepScroll(h);h.elements.flip.click();assertMenu(h,'same-hash flip');
h.flushFrame();leaveDeepScroll(h);h.elements.home.click();assertMenu(h,'same-hash home');
h.flushFrame();h.scroll.scrollTop=80;h.flushFrame();
assert.equal(h.scroll.scrollTop,80,'No delayed reset fights subsequent reading');

console.log('PASS: deep-scroll flip cycles, return/home/Escape, history and section changes, both scroll axes, focus/inert state, stale momentum, rapid reversal, and same-hash flip.');
console.log('Synthetic viewport dimensions only; these are simulated DOM checks, not rendered mobile-browser verification.');
