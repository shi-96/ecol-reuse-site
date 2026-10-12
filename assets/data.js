/*!
 * ECOL 販売サイト（確認用試作）共通データ層 / window.ECOL
 * 商品は data/products.json 1本が正本。どのページもここから描く。
 * 依存なし・ビルド不要。<script src="…/assets/data.js"> だけで使える（どの深さのページからでも root を自動判定）。
 */
(function () {
  'use strict';
  var script = document.currentScript;
  var root = script && script.src ? new URL('../', script.src).href : new URL('./', location.href).href;

  var ECOL = window.ECOL = window.ECOL || {};
  ECOL.root = root;

  /* ---- 現買取サイト掲載情報（事実）と、未確定の仮置き ---- */
  ECOL.info = {
    name: 'リサイクルショップ ECOL（エコル）',
    company: '合同会社ECOL',
    zip: '〒085-0048',
    address: '釧路市駒場町3-5-1',
    tel: '070-2033-5427',
    telHref: 'tel:07020335427',
    hours: 'AM9:00〜PM5:00（日曜休）',
    license: '第134010001407号',
    line: 'https://lin.ee/YkisLc0',
    buy: 'https://shi-96.github.io/ecol-kaitori-site/',
    form: 'https://kushiro.kaitoriok.com/#ask', // 既存の問い合わせフォーム（メール返信系）。本番サイトなので読むだけ・リンクだけ
    map: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('北海道釧路市駒場町3-5-1')
  };

  /* ---- 小さな道具 ---- */
  ECOL.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  ECOL.yen = function (n) { return '¥' + Number(n).toLocaleString('ja-JP'); };
  ECOL.date = function (s) {
    if (!s) return '';
    var m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? (+m[2]) + '/' + (+m[3]) : s;
  };
  ECOL.url = {
    list: function (params) {
      var q = [];
      Object.keys(params || {}).forEach(function (k) {
        if (params[k] !== '' && params[k] != null && params[k] !== false) q.push(k + '=' + encodeURIComponent(params[k]));
      });
      return root + 'products/index.html' + (q.length ? '?' + q.join('&') : '');
    },
    product: function (id) { return root + 'products/detail.html?id=' + encodeURIComponent(id); },
    img: function (rel) { return /^https?:|^\//.test(rel) ? rel : root + rel; },
    page: function (p) { return root + p; }
  };

  /* ---- 読み込み（1回だけ fetch してキャッシュ） ---- */
  var cache = null;
  ECOL.load = function () {
    if (cache) return cache;
    cache = fetch(root + 'data/products.json', { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error('products.json ' + r.status); return r.json(); })
      .then(function (d) {
        // 公開状態が published の商品だけを表示対象にする（draft／review は出さない）
        d.products = (d.products || []).filter(function (p) { return p.publish_state === 'published'; });
        d.catById = {}; d.subById = {}; d.rankById = {};
        (d.categories || []).forEach(function (c) {
          d.catById[c.id] = c;
          (c.sub || []).forEach(function (s) { d.subById[c.id + '/' + s.id] = s; });
        });
        ((d.condition_ranks || {}).items || []).forEach(function (r) { d.rankById[r.id] = r; });
        ECOL.data = d;
        return d;
      });
    return cache;
  };

  /* ---- 状態の意味づけ ---- */
  var STATUS = {
    available: { key: 'available', label: '在庫あり', short: '販売中' },
    reserved: { key: 'reserved', label: '取り置き中', short: '取り置き中' },
    sold: { key: 'sold', label: 'SOLD OUT', short: 'SOLD OUT' }
  };
  ECOL.status = function (p) { return STATUS[p.status] || STATUS.available; };
  ECOL.isAvailable = function (p) { return p.status === 'available'; };

  // 購入後は配送が基本。受け渡し場所（来店）は表示に使わない（products.json の pickup は内部に残すだけ）
  var DELIVERY = { available: '配送でお届けします（地域・料金は要相談）', area_limited: '配送でお届けします（地域・料金は要相談）', ask: '配送は要相談（地域・料金は未確定）', unavailable: '配送は難しい商品です（ご相談ください）' };
  ECOL.deliveryText = function (p) { return DELIVERY[p.delivery] || '要確認'; };
  ECOL.workText = function (p) { return { confirmed: '動作確認済み', unconfirmed: '動作は未確認', 'n/a': '' }[p.working_status] || ''; };

  ECOL.catLabel = function (d, id) { return d.catById[id] ? d.catById[id].label : id; };
  ECOL.subLabel = function (d, p) { var s = d.subById[p.category + '/' + p.subcategory]; return s ? s.label : ''; };
  ECOL.rank = function (d, id) { return d.rankById[id] || { id: id, label: id, desc: '' }; };
  ECOL.rankMark = function (id) { return id === 'W' ? '訳' : id; };
  ECOL.sizeText = function (p) {
    var s = p.size; if (!s) return '';
    var t = '幅' + s.w + '×奥行' + s.d + '×高さ' + s.h + (s.unit || 'cm');
    return t;
  };

  /* ---- 並べ替え・絞り込み・集計 ---- */
  ECOL.sortBy = function (list, how) {
    var a = list.slice();
    var byNew = function (x, y) { return (y.posted_at || '').localeCompare(x.posted_at || '') || (y.id > x.id ? 1 : -1); };
    if (how === 'low' || how === 'price_asc') a.sort(function (x, y) { return x.price - y.price || byNew(x, y); });
    else if (how === 'high' || how === 'price_desc') a.sort(function (x, y) { return y.price - x.price || byNew(x, y); });
    else a.sort(byNew);
    return a;
  };
  /** 新着n件。既定は SOLD OUT を除く（取り置き中は含む）。opts.includeSold / opts.availableOnly */
  ECOL.newest = function (products, n, opts) {
    opts = opts || {};
    var l = products.filter(function (p) {
      if (opts.availableOnly) return p.status === 'available';
      return opts.includeSold ? true : p.status !== 'sold';
    });
    l = ECOL.sortBy(l, 'new');
    return n ? l.slice(0, n) : l;
  };
  /** [{id,label,count,total}]。count＝在庫あり件数、total＝SOLD OUTを含む全件数 */
  ECOL.categoryCounts = function (d, products) {
    products = products || d.products;
    return d.categories.map(function (c) {
      var inCat = products.filter(function (p) { return p.category === c.id; });
      return {
        id: c.id, label: c.label, sub: c.sub || [],
        count: inCat.filter(function (p) { return p.status === 'available'; }).length,
        total: inCat.length
      };
    });
  };
  ECOL.related = function (d, p, n) {
    var pool = d.products.filter(function (x) { return x.id !== p.id && x.status !== 'sold'; });
    var same = ECOL.sortBy(pool.filter(function (x) { return x.category === p.category; }), 'new');
    var rest = ECOL.sortBy(pool.filter(function (x) { return x.category !== p.category; }), 'new');
    return same.concat(rest).slice(0, n || 4);
  };
  var PRICE = { '5': [0, 5000], '10': [0, 10000], '30': [0, 30000], '30p': [30001, Infinity] };
  ECOL.priceBands = [
    { id: '5', label: '〜5,000円' }, { id: '10', label: '〜10,000円' },
    { id: '30', label: '〜30,000円' }, { id: '30p', label: '30,001円〜' }
  ];
  /** f: {cat, ranks:[], price, delivery, large, stock:'available'|'all', q}（URLでは stock は status=available|all） */
  ECOL.filter = function (products, f) {
    f = f || {};
    var q = (f.q || '').trim().toLowerCase();
    return products.filter(function (p) {
      if (f.cat && p.category !== f.cat) return false;
      if (f.ranks && f.ranks.length && f.ranks.indexOf(p.condition_rank) < 0) return false;
      if (f.price && PRICE[f.price] && (p.price < PRICE[f.price][0] || p.price > PRICE[f.price][1])) return false;
      if (f.delivery && p.delivery === 'unavailable') return false;
      if (f.large && !p.large_item) return false;
      if (f.stock !== 'all' && p.status !== 'available') return false;
      if (q) {
        var hay = [p.title, p.brand, p.model, (p.tags || []).join(' ')].join(' ').toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    });
  };

  /* ---- 画像（aspect-ratio 固定・失敗時は無地＋商品名） ---- */
  ECOL.imgHTML = function (p, i, opts) {
    opts = opts || {};
    var src = (p.images && p.images[i || 0]) ? ECOL.url.img(p.images[i || 0]) : '';
    var eager = opts.eager ? '' : ' loading="lazy"';
    return '<span class="ph" aria-hidden="true"><span class="ph-t">' + ECOL.esc(p.title) + '</span></span>' +
      (src ? '<img class="pimg" src="' + ECOL.esc(src) + '" alt="' + ECOL.esc(opts.alt == null ? p.title : opts.alt) + '"' + eager + ' decoding="async">' : '');
  };
  // 読み込み失敗した写真は消して、無地＋商品名（.ph）だけ残す。動的に足した画像にも効く（captureで拾う）。
  document.addEventListener('error', function (e) {
    var t = e.target;
    if (t && t.tagName === 'IMG' && t.classList.contains('pimg')) {
      var cur = t.getAttribute('src') || '';
      if (!t.dataset.retry && /\.jpg$/.test(cur)) { t.dataset.retry = '1'; t.src = cur.replace(/\.jpg$/, '.png'); return; } // 生成画像が .png で置かれた場合の保険
      t.classList.add('is-broken');
      t.removeAttribute('src');
    }
  }, true);
  ECOL.checkImages = function (scope) {
    (scope || document).querySelectorAll('img.pimg').forEach(function (im) {
      if (im.complete && im.naturalWidth === 0 && im.getAttribute('src') && (im.dataset.retry || !/\.jpg$/.test(im.getAttribute('src')))) { im.classList.add('is-broken'); im.removeAttribute('src'); }
    });
  };

  /* ---- 描画：商品タイル（枠なしのカタログ表示。TOPからも同じ関数で使える） ---- */
  /** opts: {ratio:'4/3'|'1/1'|'3/4', meta:true, eager:false, cls:''} */
  ECOL.tileHTML = function (d, p, opts) {
    opts = opts || {};
    var st = ECOL.status(p);
    var ratio = opts.ratio ? ' style="--ratio:' + opts.ratio + '"' : '';
    var meta = [];
    if (p.brand) meta.push(p.brand);
    if (p.year) meta.push(p.year + '年');
    var badge = st.key === 'available' ? '' : '<span class="lbl lbl-' + st.key + '">' + ECOL.esc(st.label) + '</span>';
    var chips = '<span class="rank" title="状態ランク ' + p.condition_rank + '：' + ECOL.esc(ECOL.rank(d, p.condition_rank).label) + '">' +
      '<b>' + ECOL.rankMark(p.condition_rank) + '</b>' + ECOL.esc(ECOL.rank(d, p.condition_rank).label) + '</span>';
    var flags = [];
    if (p.large_item) flags.push('大型・要相談');
    return '<a class="pt is-' + st.key + (opts.cls ? ' ' + opts.cls : '') + '" href="' + ECOL.url.product(p.id) + '" data-id="' + p.id + '">' +
      '<span class="pt-fig"' + ratio + '>' + ECOL.imgHTML(p, 0, opts) + badge + '</span>' +
      '<span class="pt-body">' +
      '<span class="pt-top">' + chips + '<span class="pt-date">' + ECOL.date(p.posted_at) + ' 掲載</span></span>' +
      '<span class="pt-title">' + ECOL.esc(p.title) + '</span>' +
      '<span class="pt-price"><span class="yen">' + ECOL.yen(p.price) + '</span>' + (p.price_tentative ? '<small>税込・仮</small>' : '<small>税込</small>') + '</span>' +
      (opts.meta === false ? '' : '<span class="pt-meta">' + meta.concat(flags).map(function (x) { return '<span class="nb">' + ECOL.esc(x) + '</span>'; }).join('<span class="dot">・</span>') + '</span>') +
      '</span></a>';
  };
  ECOL.renderTiles = function (el, d, list, opts) {
    if (typeof el === 'string') el = document.querySelector(el);
    if (!el) return;
    el.innerHTML = list.map(function (p) { return ECOL.tileHTML(d, p, opts); }).join('');
    ECOL.checkImages(el);
  };
  /** 新着・カテゴリ件数など、TOPが1行で使う描画ヘルパ */
  ECOL.renderNewest = function (el, n, opts) {
    return ECOL.load().then(function (d) { ECOL.renderTiles(el, d, ECOL.newest(d.products, n, opts), opts); return d; });
  };
  ECOL.renderCategories = function (el, opts) {
    if (typeof el === 'string') el = document.querySelector(el);
    opts = opts || {};
    return ECOL.load().then(function (d) {
      el.innerHTML = ECOL.categoryCounts(d).map(function (c) {
        return '<a href="' + ECOL.url.list({ cat: c.id }) + '"><span>' + ECOL.esc(c.label) + '</span>' +
          (opts.counts ? '<em>' + c.count + '</em>' : '') + '</a>';
      }).join('');
      return d;
    });
  };
  ECOL.loadError = function (el, err) {
    if (typeof el === 'string') el = document.querySelector(el);
    if (!el) return;
    var local = location.protocol === 'file:';
    el.innerHTML = '<p class="note-err">商品データを読み込めませんでした。' +
      (local ? 'ファイルを直接開いた場合は表示できません。<code>python3 -m http.server</code> などで配信してからご覧ください。' : '時間をおいて再読み込みしてください。') + '</p>';
    if (window.console) console.warn(err);
  };

  /* ---- 戻り先：リユース販売ページ（B案）が既定。旧A/Cは比較用に残すだけで、導線には出さない ---- */
  ECOL.topHref = function () { return root + 'b/index.html'; };
  ECOL.topName = function () { return 'リユース販売トップ'; };
})();
