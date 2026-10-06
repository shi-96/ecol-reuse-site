/* ECOL 試作 B案 — ../data/products.json を1本の正本として描画（data.js には依存しない） */
(function () {
  'use strict';
  try { localStorage.setItem('ecol_last_top', 'b'); } catch (e) {}

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

  var DATA_URL = '../data/products.json';
  var ROOT = '../'; // products.json の images は site/ からの相対パス

  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function yen(n) { return '¥' + Number(n).toLocaleString('ja-JP'); }
  function md(d) { var a = String(d).split('-'); return Number(a[1]) + '/' + Number(a[2]); }
  function ymd(d) { return String(d).replace(/-/g, '.'); }
  function imgOf(p) { return ROOT + ((p.images && p.images[0]) || ('img/products/' + p.id + '.jpg')); }
  function href(p) { return '../products/detail.html?id=' + encodeURIComponent(p.id); }
  function byNew(a, b) {
    return (b.posted_at || '').localeCompare(a.posted_at || '') ||
      (b.updated_at || '').localeCompare(a.updated_at || '') ||
      a.id.localeCompare(b.id);
  }

  var rankMap = {};

  function ph(p, extra) {
    return '<span class="ph" data-t="' + esc(p.title) + '"><img src="' + esc(imgOf(p)) + '" alt="' + esc(p.title) + '（SAMPLE）" loading="lazy" decoding="async">' + (extra || '') + '</span>';
  }
  function flag(p) {
    if (p.status === 'sold') return '<span class="stamp">SOLD OUT</span>';
    if (p.status === 'reserved') return '<span class="badge">取り置き中</span>';
    return '';
  }
  function cls(p) { return p.status === 'sold' ? ' is-sold' : (p.status === 'reserved' ? ' is-res' : ''); }
  function rankTxt(p) {
    var r = rankMap[p.condition_rank];
    return '状態 ' + esc(p.condition_rank) + (r ? '・' + esc(r) : '');
  }
  function priceHtml(p) { return yen(p.price) + '<span class="smp">SAMPLE</span>'; }

  function statusLabel(p) {
    if (p.status === 'sold') return 'SOLD OUT';
    if (p.status === 'reserved') return '取り置き中';
    return '<i class="dot"></i>販売中';
  }
  function deliveryTxt(v) {
    return v === 'unavailable' ? '難しい商品（要相談）' : '配送でお届け（地域・料金は要相談）';
  }

  /* ---- 新着：特集1点 ---- */
  function renderFeature(p) {
    var s = p.size || {};
    var sizeTxt = s.w ? '幅' + s.w + '×奥行' + s.d + '×高さ' + s.h + (s.unit || 'cm') : '';
    var rows = [];
    if (p.brand) rows.push(['メーカー', esc(p.brand)]);
    if (p.year) rows.push(['年式', esc(p.year) + '年']);
    if (sizeTxt) rows.push(['サイズ', esc(sizeTxt)]);
    rows.push(['状態', rankTxt(p).replace('状態 ', '')]);
    rows.push(['配送', deliveryTxt(p.delivery) + (p.large_item ? '・大型品は搬入も相談' : '')]);
    var dl = rows.map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>'; }).join('');

    $('[data-feat-img]').innerHTML =
      '<a class="feat-img' + cls(p) + '" href="' + href(p) + '" aria-label="' + esc(p.title) + 'の詳細">' + ph(p, flag(p)) + '</a>';
    $('[data-feat-body]').innerHTML =
      '<div class="feat-body' + cls(p) + '">' +
      '<p class="eyebrow"><span>LATEST</span><span>' + md(p.posted_at) + ' 掲載・' + statusLabel(p) + '</span></p>' +
      '<h3><a href="' + href(p) + '">' + esc(p.title) + '</a></h3>' +
      '<p class="price">' + priceHtml(p) + '</p>' +
      '<dl class="spec">' + dl + '</dl>' +
      (p.condition_note ? '<p class="note">' + esc(p.condition_note) + '</p>' : '') +
      '<div class="cta-row"><a class="btn" href="' + href(p) + '">詳細を見る<span class="arw" aria-hidden="true">→</span></a>' +
      '<a class="tl" href="https://lin.ee/YkisLc0" target="_blank" rel="noopener">公式LINEで相談<span class="arw" aria-hidden="true">↗</span></a>' +
      '<a class="tl" href="https://kushiro.kaitoriok.com/#ask" target="_blank" rel="noopener">問い合わせフォーム<span class="arw" aria-hidden="true">↗</span></a></div>' +
      '</div>';
  }

  /* ---- 新着：ほかの4点（罫線の一覧） ---- */
  function renderList(items) {
    $('[data-list]').innerHTML =
      '<p class="new-list-h">OTHERS</p>' +
      items.map(function (p) {
        return '<a class="row' + cls(p) + '" href="' + href(p) + '">' + ph(p, flag(p)) +
          '<span class="row-t"><b>' + esc(p.title) + '</b><span class="row-m">' + rankTxt(p) + '・' + md(p.posted_at) + '掲載</span></span>' +
          '<span class="row-p">' + yen(p.price) + '</span></a>';
      }).join('');
  }

  /* ---- 新着：ずらして置く3点 ---- */
  function tile(p) {
    return '<a class="tile' + cls(p) + '" href="' + href(p) + '">' + ph(p, flag(p)) +
      '<span class="tile-m"><span class="tile-t">' + esc(p.title) + '</span><span class="tile-p">' + yen(p.price) + '</span></span>' +
      '<span class="tile-s">' + rankTxt(p) + '・' + md(p.posted_at) + '掲載・SAMPLE</span></a>';
  }

  /* ---- カテゴリ ---- */
  function renderCats(cats, prods) {
    var live = prods.filter(function (p) { return p.status !== 'sold'; }).sort(byNew);
    $('[data-cats]').innerHTML = cats.map(function (c, i) {
      var list = live.filter(function (p) { return p.category === c.id; });
      var subs = (c.sub || []).map(function (s) { return s.label; }).join('・');
      var th = list[0] ? '<span class="ph cat-th" data-t="' + esc(c.label) + '"><img src="' + esc(imgOf(list[0])) + '" alt="" loading="lazy" decoding="async"></span>' : '<span></span>';
      return '<a class="cat' + (list.length ? '' : ' is-empty') + '" href="../products/?cat=' + encodeURIComponent(c.id) + '">' +
        '<span class="cat-name">' + esc(c.label) + '</span>' +
        '<span class="cat-sub">' + esc(subs || 'ほかの品目') + '</span>' + th +
        '<span class="cat-n">' + (list.length ? '<b>' + list.length + '</b>点' : '—') + '</span>' +
        '<span class="cat-arw" aria-hidden="true">→</span></a>';
    }).join('');

    var tabs = $('[data-tabs]');
    if (tabs) {
      tabs.innerHTML = '<a href="../products/">すべて</a>' + cats.map(function (c) {
        return '<a href="../products/?cat=' + encodeURIComponent(c.id) + '">' + esc(c.label) + '</a>';
      }).join('');
    }
  }

  function renderRanks(items) {
    $('[data-ranks]').innerHTML = items.map(function (r) {
      return '<li><span class="rk" aria-hidden="true">' + esc(r.id) + '</span><b>' + esc(r.label) + '</b><p>' + esc(r.desc) + '</p></li>';
    }).join('');
  }

  function render(d) {
    (d.condition_ranks.items || []).forEach(function (r) { rankMap[r.id] = r.label; });
    var prods = d.products.slice();

    var fresh = prods.filter(function (p) { return p.status !== 'sold'; }).sort(byNew);
    if (fresh.length) {
      renderFeature(fresh[0]);
      renderList(fresh.slice(1, 5));
      $('[data-stagger]').innerHTML = fresh.slice(5, 8).map(tile).join('');
    }

    var mark = prods.filter(function (p) { return p.status !== 'available'; })
      .sort(function (a, b) { return (a.status === b.status ? 0 : a.status === 'reserved' ? -1 : 1) || byNew(a, b); })
      .slice(0, 4);
    $('[data-sold]').innerHTML = mark.map(tile).join('');

    renderCats(d.categories, prods);
    renderRanks(d.condition_ranks.items || []);

    var last = prods.reduce(function (m, p) { return (p.updated_at || '') > m ? p.updated_at : m; }, '');
    if (last) $('[data-updated]').textContent = 'UPDATED ' + ymd(last) + '（SAMPLE）';
  }

  /* ---- 画像が無いとき：無地背景＋商品名 ---- */
  document.addEventListener('error', function (e) {
    var t = e.target;
    if (t && t.tagName === 'IMG' && t.parentNode && t.parentNode.classList) t.parentNode.classList.add('noimg');
  }, true);
  function sweep() {
    var im = document.images;
    for (var i = 0; i < im.length; i++) {
      if (im[i].complete && im[i].naturalWidth === 0 && im[i].parentNode.classList) im[i].parentNode.classList.add('noimg');
    }
  }
  sweep();

  /* ---- スマホのメニュー ---- */
  var hd = $('.hd'), mb = $('.menu-btn');
  if (mb) {
    mb.addEventListener('click', function () {
      var o = hd.classList.toggle('open');
      mb.setAttribute('aria-expanded', o ? 'true' : 'false');
    });
    document.querySelectorAll('.gnav a').forEach(function (a) {
      a.addEventListener('click', function () { hd.classList.remove('open'); mb.setAttribute('aria-expanded', 'false'); });
    });
  }

  fetch(DATA_URL).then(function (r) {
    if (!r.ok) throw new Error(r.status);
    return r.json();
  }).then(function (d) { d.products = d.products.filter(function (p) { return p.publish_state === 'published'; }); render(d); sweep(); })
    .catch(function () { var e = $('[data-err]'); if (e) e.hidden = false; });
})();
