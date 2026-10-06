/* 商品一覧：絞り込み・並び替え・件数・スマホのシート。状態は URL に反映。
 * 【引数の正本】cat=カテゴリid ／ q=キーワード ／ status=available(既定・販売中のみ)|all(取り置き中・SOLD OUTも) ／
 *   sort=new(既定)|price_asc|price_desc ／ price=5|10|30|30p（〜5,000／〜10,000／〜30,000／30,001〜） ／
 *   rank=S,A,B,C,W ／ delivery=1(配送相談可) ／ large=1(大型・要相談)
 *   旧名 stock=all・sort=low|high も読める（旧 pickup= は無視）（書き出しは正本の名前）。 */
(function () {
  'use strict';
  var E = window.ECOL, $ = function (s, r) { return (r || document).querySelector(s); };
  var grid = $('#grid'), filters = $('#filters'), scrim = $('#scrim');
  var D, S;
  var SORTS = { 'new': 'new', price_asc: 'price_asc', price_desc: 'price_desc', low: 'price_asc', high: 'price_desc' };

  function readState() {
    var q = new URLSearchParams(location.search);
    return {
      cat: q.get('cat') || '', price: q.get('price') || '',
      ranks: (q.get('rank') || '').split(',').filter(Boolean),
      delivery: q.get('delivery') === '1', large: q.get('large') === '1',
      stock: (q.get('status') || q.get('stock')) === 'all' ? 'all' : 'available',
      sort: SORTS[q.get('sort')] || 'new',
      q: q.get('q') || ''
    };
  }
  function writeState() {
    var p = new URLSearchParams();
    if (S.cat) p.set('cat', S.cat);
    if (S.price) p.set('price', S.price);
    if (S.ranks.length) p.set('rank', S.ranks.join(','));
    if (S.delivery) p.set('delivery', '1');
    if (S.large) p.set('large', '1');
    if (S.stock === 'all') p.set('status', 'all');
    if (S.sort !== 'new') p.set('sort', S.sort);
    if (S.q) p.set('q', S.q);
    var s = p.toString();
    history.replaceState(null, '', location.pathname + (s ? '?' + s : ''));
  }
  function activeCount() {
    return (S.cat ? 1 : 0) + (S.price ? 1 : 0) + S.ranks.length + (S.delivery ? 1 : 0) + (S.large ? 1 : 0) + (S.stock === 'all' ? 1 : 0) + (S.q ? 1 : 0);
  }

  function buildFilters() {
    var cats = D.categories;
    var ranks = D.condition_ranks.items;
    var h = '<div class="f-head"><span>絞り込み</span><button type="button" data-close aria-label="閉じる">×</button></div><div class="f-body">';
    h += '<fieldset class="fgroup"><legend>キーワード</legend><input class="f-q" type="search" id="fq" placeholder="商品名・メーカー・型番" autocomplete="off"></fieldset>';
    h += '<fieldset class="fgroup"><legend>カテゴリ</legend><div class="opts" id="fcat"></div></fieldset>';
    h += '<fieldset class="fgroup"><legend>価格帯</legend><div class="opts" id="fprice">' +
      '<label class="fopt"><input type="radio" name="price" value=""> すべて</label>' +
      E.priceBands.map(function (b) { return '<label class="fopt"><input type="radio" name="price" value="' + b.id + '"> ' + b.label + '</label>'; }).join('') +
      '</div></fieldset>';
    h += '<fieldset class="fgroup"><legend>状態ランク</legend><div class="opts" id="frank">' +
      ranks.map(function (r) { return '<label class="fopt"><input type="checkbox" name="rank" value="' + r.id + '"> <span class="rank"><b>' + E.rankMark(r.id) + '</b>' + E.esc(r.label) + '</span></label>'; }).join('') +
      '</div><a class="f-link" href="' + E.url.page('guide/index.html#rank') + '">ランクの見方（仮）</a></fieldset>';
    h += '<fieldset class="fgroup"><legend>配送</legend><div class="opts">' +
      '<label class="fopt"><input type="checkbox" id="fdeli"> 配送相談可</label>' +
      '<label class="fopt"><input type="checkbox" id="flarge"> 大型・要相談</label></div></fieldset>';
    h += '<fieldset class="fgroup"><legend>在庫</legend><div class="opts">' +
      '<label class="fopt"><input type="checkbox" id="fstock"> 在庫ありのみ</label></div>' +
      '<button type="button" class="f-reset" id="freset">条件をすべてクリア</button></fieldset>';
    h += '</div><div class="f-foot"><button type="button" class="btn btn-outline" id="freset2">クリア</button><button type="button" class="btn" data-close id="fapply">見る</button></div>';
    filters.innerHTML = h;
    // カテゴリのタブ（スマホ）
    $('#tabs').innerHTML = '<button type="button" data-cat="">すべて</button>' +
      cats.map(function (c) { return '<button type="button" data-cat="' + c.id + '">' + E.esc(c.label) + '</button>'; }).join('');
  }

  function syncControls(res) {
    $('#fq').value = S.q;
    $('#fdeli').checked = S.delivery; $('#flarge').checked = S.large;
    $('#fstock').checked = S.stock !== 'all';
    filters.querySelectorAll('input[name=price]').forEach(function (i) { i.checked = i.value === S.price; });
    filters.querySelectorAll('input[name=rank]').forEach(function (i) { i.checked = S.ranks.indexOf(i.value) >= 0; });
    // カテゴリ：ほかの条件を掛けた件数つき
    var base = Object.assign({}, S, { cat: '' });
    var total = E.filter(D.products, base).length;
    var fc = $('#fcat');
    if (!fc.children.length) {
      fc.innerHTML = '<label class="fopt"><input type="radio" name="cat" value=""> すべて<em data-n=""></em></label>' +
        D.categories.map(function (c) { return '<label class="fopt"><input type="radio" name="cat" value="' + c.id + '"> ' + E.esc(c.label) + '<em data-n="' + c.id + '"></em></label>'; }).join('');
    }
    fc.querySelectorAll('input').forEach(function (i) { i.checked = i.value === S.cat; });
    fc.querySelectorAll('em').forEach(function (em) {
      var id = em.getAttribute('data-n');
      var n = id ? E.filter(D.products, Object.assign({}, base, { cat: id })).length : total;
      em.textContent = n; em.parentNode.classList.toggle('is-zero', id !== '' && !n);
    });
    document.querySelectorAll('#tabs button').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-cat') === S.cat ? 'true' : 'false'); });
    $('#sort').value = S.sort;
    var n = activeCount();
    $('#fcount').textContent = n ? String(n) : '';
    $('#fapply').textContent = res.length + '件を見る';
  }

  function chips() {
    var c = [];
    if (S.cat) c.push(['cat', 'カテゴリ：' + E.catLabel(D, S.cat)]);
    if (S.price) c.push(['price', '価格：' + E.priceBands.filter(function (b) { return b.id === S.price; })[0].label]);
    S.ranks.forEach(function (r) { c.push(['rank:' + r, '状態：' + E.rankMark(r) + '（' + E.rank(D, r).label + '）']); });
    if (S.delivery) c.push(['delivery', '配送相談可']);
    if (S.large) c.push(['large', '大型・要相談']);
    if (S.stock === 'all') c.push(['stock', '取り置き中・SOLD OUTも表示']);
    if (S.q) c.push(['q', 'キーワード：' + S.q]);
    var h = c.map(function (x) { return '<button type="button" class="chip" data-chip="' + E.esc(x[0]) + '">' + E.esc(x[1]) + '</button>'; }).join('');
    if (c.length > 1) h += '<button type="button" class="chip clear" data-chip="all">すべてクリア</button>';
    $('#chips').innerHTML = h;
  }

  function render() {
    var res = E.sortBy(E.filter(D.products, S), S.sort);
    E.renderTiles(grid, D, res, { ratio: '1/1' });
    $('#num').textContent = res.length;
    var hidden = 0;
    if (S.stock !== 'all') hidden = E.filter(D.products, Object.assign({}, S, { stock: 'all' })).length - res.length;
    var note = $('#hidden');
    note.innerHTML = hidden > 0 ? '取り置き中・SOLD OUTの商品が' + hidden + '点あります。<a href="#" id="showall">あわせて表示する</a>' : '';
    if (!res.length) {
      grid.innerHTML = '';
      $('#empty').hidden = false;
    } else $('#empty').hidden = true;
    grid.hidden = !res.length;
    chips(); syncControls(res); writeState();
    document.title = (S.cat ? E.catLabel(D, S.cat) + ' ｜ ' : '') + '商品一覧 ｜ ECOL（試作）';
  }

  function reset() { S = { cat: '', price: '', ranks: [], delivery: false, large: false, stock: 'available', sort: S.sort, q: '' }; render(); }
  function openSheet() { filters.classList.add('is-open'); scrim.classList.add('is-open'); document.body.classList.add('lock'); $('#fapply').focus(); }
  function closeSheet() { filters.classList.remove('is-open'); scrim.classList.remove('is-open'); document.body.classList.remove('lock'); }

  function bind() {
    filters.addEventListener('change', function (e) {
      var t = e.target;
      if (t.name === 'cat') S.cat = t.value;
      else if (t.name === 'price') S.price = t.value;
      else if (t.name === 'rank') { S.ranks = Array.prototype.map.call(filters.querySelectorAll('input[name=rank]:checked'), function (i) { return i.value; }); }
      else if (t.id === 'fdeli') S.delivery = t.checked;
      else if (t.id === 'flarge') S.large = t.checked;
      else if (t.id === 'fstock') S.stock = t.checked ? 'available' : 'all';
      render();
    });
    var qt; $('#fq').addEventListener('input', function (e) { clearTimeout(qt); var v = e.target.value; qt = setTimeout(function () { S.q = v; render(); $('#fq').focus(); }, 250); });
    $('#tabs').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; S.cat = b.getAttribute('data-cat'); render(); });
    $('#sort').addEventListener('change', function (e) { S.sort = e.target.value; render(); });
    $('#fbtn').addEventListener('click', openSheet);
    scrim.addEventListener('click', closeSheet);
    filters.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) closeSheet(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(); });
    $('#freset').addEventListener('click', reset); $('#freset2').addEventListener('click', reset); $('#emptyReset').addEventListener('click', reset);
    $('#chips').addEventListener('click', function (e) {
      var b = e.target.closest('[data-chip]'); if (!b) return;
      var k = b.getAttribute('data-chip');
      if (k === 'all') return reset();
      if (k === 'cat') S.cat = ''; else if (k === 'price') S.price = '';
      else if (k === 'delivery') S.delivery = false; else if (k === 'large') S.large = false; else if (k === 'stock') S.stock = 'available'; else if (k === 'q') S.q = '';
      else if (k.indexOf('rank:') === 0) S.ranks = S.ranks.filter(function (r) { return r !== k.slice(5); });
      render();
    });
    $('#hidden').addEventListener('click', function (e) { if (e.target.id === 'showall') { e.preventDefault(); S.stock = 'all'; render(); } });
  }

  E.load().then(function (d) {
    D = d; S = readState();
    buildFilters(); bind(); render();
  }).catch(function (err) { E.loadError(grid, err); });
})();
