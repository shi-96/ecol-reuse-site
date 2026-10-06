/* ECOL 試作 C案：商品データ（../data/products.json）を読んで描画する。共通スクリプトには依存しない。 */
(function () {
  'use strict';

  try { localStorage.setItem('ecol_last_top', 'c'); } catch (e) { /* 保存できなくても表示は続ける */ }

  /* 画像は .jpg → .png の順に試す（生成画像の拡張子が揺れるため）。両方だめなら、各所の代替表示（無地＋商品名）へ */
  function retryPng(im) {
    var s = im.getAttribute('src') || '';
    if (im.dataset.png || !/\.jpg$/.test(s)) return false;
    im.dataset.png = '1'; im.src = s.replace(/\.jpg$/, '.png'); return true;
  }
  document.addEventListener('error', function (e) {
    var t = e.target;
    if (t && t.tagName === 'IMG' && retryPng(t)) e.stopImmediatePropagation();
  }, true);
  Array.prototype.forEach.call(document.images, function (im) { if (im.complete && im.naturalWidth === 0) retryPng(im); });
  // ヒーロー写真：.jpg→.png のどちらも無ければ隠す（濃い緑の面だけ残す）
  var heroImg = document.querySelector('.hero-img');
  if (heroImg) {
    heroImg.addEventListener('error', function () { heroImg.style.display = 'none'; });
    if (heroImg.complete && heroImg.naturalWidth === 0 && heroImg.dataset.png) heroImg.style.display = 'none';
  }

  var WORKING_LABEL = { confirmed: '動作確認済', unconfirmed: '動作未確認', 'n/a': '' };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function yen(n) { return Number(n).toLocaleString('ja-JP'); }
  function md(d) { var p = String(d).split('-'); return Number(p[1]) + '/' + Number(p[2]); }
  function byNew(a, b) {
    return a.posted_at < b.posted_at ? 1 : a.posted_at > b.posted_at ? -1 : (a.id < b.id ? -1 : 1);
  }
  function $(id) { return document.getElementById(id); }

  function imgSrc(p) { return '../img/products/' + p.id + '.jpg'; }
  function detailHref(p) { return '../products/detail.html?id=' + encodeURIComponent(p.id); }

  function condText(p, ranks) {
    var r = ranks.filter(function (x) { return x.id === p.condition_rank; })[0];
    var t = '状態 ' + (p.condition_rank === 'W' ? '訳あり' : p.condition_rank + '・' + (r ? r.label : ''));
    var w = WORKING_LABEL[p.working_status];
    return t + (w ? '・' + w : '');
  }

  function tile(p, cats, ranks, opt) {
    opt = opt || {};
    var cat = cats.filter(function (c) { return c.id === p.category; })[0];
    var stamp = p.status === 'sold' ? '<span class="stamp">SOLD OUT</span>'
      : p.status === 'reserved' ? '<span class="stamp jp">取り置き中</span>' : '';
    return '<a class="item' + (opt.lead ? ' lead' : '') + ' rv" href="' + detailHref(p) + '" data-status="' + esc(p.status) + '">' +
      '<figure class="ph' + (opt.tall ? ' tall' : '') + '">' +
        '<img src="' + imgSrc(p) + '" alt="' + esc(p.title) + '（サンプル画像）" loading="lazy">' +
        '<span class="ph-fallback">' + esc(p.title) + '</span>' +
        stamp +
        '<span class="price-tag"><span class="pt-in"><span class="yen">¥</span><span class="val">' + yen(p.price) + '</span>' +
          (p.price_tentative ? '<span class="kari">仮</span>' : '') + '</span></span>' +
      '</figure>' +
      '<div class="meta">' +
        '<p class="cat">' + esc(cat ? cat.label : '') + '　' + md(p.posted_at) + ' 入荷</p>' +
        '<h3>' + esc(p.title) + '</h3>' +
        '<p class="cond">' + esc(condText(p, ranks)) + (p.large_item ? '・大型（要相談）' : '') + '</p>' +
      '</div>' +
    '</a>';
  }

  /* 画像が無い・読めない間は、無地の背景に商品名を出す */
  function guardImages(root) {
    root.querySelectorAll('.ph img, .lph img').forEach(function (img) {
      var box = img.closest('.ph, .lph');
      function fail() { box.classList.add('noimg'); }
      img.addEventListener('error', fail);
      if (img.complete && img.naturalWidth === 0) fail();
    });
  }

  function reveal(root) {
    var els = root.querySelectorAll('.rv');
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      els.forEach(function (e) { e.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (e, i) { e.style.transitionDelay = (i % 4) * 60 + 'ms'; io.observe(e); });
  }

  function render(data) {
    var cats = data.categories, ranks = data.condition_ranks.items, all = data.products;
    var sorted = all.slice().sort(byNew);

    /* ヒーローの入荷札：最新の掲載日と、掲載点数（サンプルデータの件数） */
    var newest = sorted[0];
    var live = all.filter(function (p) { return p.status !== 'sold'; }).length;
    $('heroTag').innerHTML = '<small>最新の入荷</small><strong>' + md(newest.posted_at) + '</strong>' +
      '<span>掲載中 ' + live + '点（サンプル）</span>';

    /* 新着：掲載日の新しい順。先頭だけ大きく */
    var fresh = sorted.filter(function (p) { return p.status === 'available'; }).slice(0, 5);
    $('newGrid').innerHTML = fresh.map(function (p, i) { return tile(p, cats, ranks, { lead: i === 0 }); }).join('');

    /* 取り置き中・SOLD OUT：帳簿の行 */
    var moved = sorted.filter(function (p) { return p.status !== 'available'; }).slice(0, 4);
    $('ledgerList').innerHTML = moved.map(function (p) {
      var tag = p.status === 'sold' ? 'SOLD OUT' : '取り置き中';
      var date = p.status === 'sold' && p.sold_at ? md(p.sold_at) + ' 売却' : md(p.posted_at) + ' 入荷';
      return '<li><a href="' + detailHref(p) + '">' +
        '<span class="lph"><img src="' + imgSrc(p) + '" alt="" loading="lazy"></span>' +
        '<span><span class="lt">' + esc(p.title) + '</span><span class="ls">' + date + '</span></span>' +
        '<span class="lp"><b>¥' + yen(p.price) + '</b><em>' + tag + '</em></span></a></li>';
    }).join('');

    /* 冬支度の棚 */
    var winter = sorted.filter(function (p) { return p.category === 'winter' && p.status === 'available'; }).slice(0, 4);
    $('winterRow').innerHTML = winter.map(function (p) { return tile(p, cats, ranks, { tall: true }); }).join('');

    /* 通路の索引：カテゴリごとの販売中の点数 */
    $('aisleList').innerHTML = cats.map(function (c, i) {
      var n = all.filter(function (p) { return p.category === c.id && p.status === 'available'; }).length;
      var subs = c.sub && c.sub.length ? c.sub.map(function (s) { return s.label; }).join('・') : '';
      return '<li><a href="../products/?cat=' + encodeURIComponent(c.id) + '">' +
        '<span class="al">' + String.fromCharCode(65 + i) + '</span>' +
        '<span class="an">' + esc(c.label) + (subs ? '<small>' + esc(subs) + '</small>' : '') + '</span>' +
        '<span class="ac">' + n + '<small>点販売中</small></span>' +
        '<span class="ar" aria-hidden="true">→</span></a></li>';
    }).join('');

    /* ヘッダー下のカテゴリ横スクロール（スマホ） */
    $('catRail').innerHTML = '<a href="../products/?status=available&sort=new">新着</a>' + cats.map(function (c) {
      return '<a href="../products/?cat=' + encodeURIComponent(c.id) + '">' + esc(c.label) + '</a>';
    }).join('');

    /* 状態のみかた */
    $('rankList').innerHTML = ranks.map(function (r) {
      return '<li><span class="rk' + (r.id === 'W' ? ' w' : '') + '">' + (r.id === 'W' ? '訳あり' : esc(r.id)) + '</span>' +
        '<span><b>' + esc(r.label) + '</b><span class="d">' + esc(r.desc) + '</span></span></li>';
    }).join('');

    [$('newGrid'), $('winterRow'), $('ledgerList')].forEach(guardImages);
    reveal(document);
  }

  function failed() {
    ['newGrid', 'winterRow', 'ledgerList', 'aisleList'].forEach(function (id) {
      $(id).innerHTML = '<p style="padding:12px 0">商品データを読み込めませんでした（試作の表示です）。</p>';
    });
  }

  fetch('../data/products.json').then(function (r) {
    if (!r.ok) throw new Error(r.status);
    return r.json();
  }).then(function (d) { d.products = d.products.filter(function (p) { return p.publish_state === 'published'; }); return render(d); }).catch(failed);

  /* 静的なブロックの出現アニメ */
  document.querySelectorAll('.sec-head, .guide-list li, .facts, .steps, .line-cta').forEach(function (e) { e.classList.add('rv'); });
  reveal(document);
})();
