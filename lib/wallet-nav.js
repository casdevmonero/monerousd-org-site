// Copyright (c) 2026, The MoneroUSD Protocol
// All rights reserved.
//
// This file is an original work of the MoneroUSD Protocol — a post-quantum,
// GHOSTDAG block-DAG, zero-knowledge confidential-value protocol. It is NOT part
// of the Monero Project. It is licensed under the MoneroUSD Protocol License
// (BSD 3-Clause with a mandatory attribution-and-display clause); see the
// LICENSE.MoneroUSD-Protocol file distributed with this source.

// lib/wallet-nav.js
//
// PAGE BACK / FORWARD FOR THE WALLET'S OWN BUTTONS.
//
// The wallet shows this app in a frame of another origin, so it can neither read nor step this page's history: on a
// phone that left an open app with no way back a page (there is no browser chrome around it). The app keeps count
// for the wallet instead:
//
//   * every history entry this frame makes carries its position (`__musdNav` in the entry's state);
//   * the frame's name carries the last position across full page loads inside the frame;
//   * each change is reported to the wallet as `monerousd:navstate {depth, top, href}`.
//
// The wallet's Back steps the app while depth > 0 and leaves for the launchpad at 0; it asks with
// `monerousd:nav {dir: back | forward | reload}`. Only the framing window is listened to and answered, and nothing it
// can send does more than step or reload this page. Outside the wallet (a plain browser tab) nothing is posted and
// nothing is stepped: the browser's own buttons do the job there.
(function () {
  'use strict';
  if (window.__MONEROUSD_WALLET_NAV_INSTALLED__) return;
  window.__MONEROUSD_WALLET_NAV_INSTALLED__ = true;
  var framed = false;
  try { framed = !!window.parent && window.parent !== window; } catch (e) { framed = false; }
  if (!framed) return;

  var heard = false;          // the wallet has said hello: only then is anything posted
  var parentOrigin = '*';
  var at = 0, top = 0;
  var hist = window.history;
  var realPush = hist.pushState, realReplace = hist.replaceState;

  function read(st) { return (st && typeof st === 'object' && typeof st.__musdNav === 'number') ? st.__musdNav : null; }
  function withMark(st, i) {
    if (st === null || st === undefined) return { __musdNav: i };
    if (typeof st !== 'object' || Array.isArray(st)) return st;        // an app's own non-object state stays as it is
    var o = {};
    for (var k in st) { if (Object.prototype.hasOwnProperty.call(st, k)) o[k] = st[k]; }
    o.__musdNav = i;
    return o;
  }
  function save() { try { window.name = 'musd-nav:' + at + ':' + top; } catch (e) { void e; } }
  function mark(i) { try { realReplace.call(hist, withMark(hist.state, i), ''); } catch (e) { void e; } }
  function report() {
    save();
    if (!heard) return;
    try {
      window.parent.postMessage({ type: 'monerousd:navstate', depth: at, top: top, href: String(window.location.href) }, parentOrigin);
    } catch (e) { void e; }
  }

  // Where this page stands when it loads: an entry already counted (a reload, or a step back or forward onto this
  // page), a new page opened inside the frame, or the first page the wallet opened.
  (function boot() {
    var here = read(hist.state);
    var m = /^musd-nav:(\d+):(\d+)$/.exec(String(window.name || ''));
    if (here !== null) { at = here; top = Math.max(here, m ? Number(m[2]) : here); }
    else if (m) { at = Number(m[1]) + 1; top = at; mark(at); }
    else { at = 0; top = 0; mark(0); }
    save();
  })();

  hist.pushState = function (st, title, url) {
    at += 1; top = at;
    var r = (url === undefined) ? realPush.call(hist, withMark(st, at), title) : realPush.call(hist, withMark(st, at), title, url);
    report();
    return r;
  };
  hist.replaceState = function (st, title, url) {
    return (url === undefined) ? realReplace.call(hist, withMark(st, at), title) : realReplace.call(hist, withMark(st, at), title, url);
  };
  function sync() {
    var here = read(hist.state);
    if (here !== null) at = here;                       // a step through entries already counted
    else { at += 1; top = at; mark(at); }               // a new entry made by a #link
    if (at > top) top = at;
    report();
  }
  window.addEventListener('popstate', sync);
  window.addEventListener('hashchange', sync);

  window.addEventListener('message', function (ev) {
    var d = ev.data;
    if (!d || ev.source !== window.parent) return;
    if (d.type === 'monerousd:hello') {
      heard = true;
      parentOrigin = (ev.origin && ev.origin !== 'null') ? ev.origin : '*';
      report();
      return;
    }
    if (d.type !== 'monerousd:nav' || !heard) return;
    if (d.dir === 'back' && at > 0) hist.back();
    else if (d.dir === 'forward' && at < top) hist.forward();
    else if (d.dir === 'reload') window.location.reload();
    else report();
  });
})();
