/* ECOL TOP A案：../data/products.json を読んで、棚・カテゴリ・帯を描く（data.js には依存しない） */
(function () {
  'use strict';
  try { localStorage.setItem('ecol_last_top', 'a'); } catch (e) { /* 保存できなくても表示は続ける */ }

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

  var WD = ['日', '月', '火', '水', '木', '金', '土'];
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var yen = function (n) { return '¥' + Number(n).toLocaleString('ja-JP'); };
  var md = function (s) { var p = s.split('-'); return Number(p[1]) + '/' + Number(p[2]); };
  var wd = function (s) { var p = s.split('-'); return WD[new Date(+p[0], +p[1] - 1, +p[2]).getDay()]; };
  var detail = function (id) { return '../products/detail.html?id=' + encodeURIComponent(id); };
  var byNew = function (a, b) {
    return b.posted_at < a.posted_at ? -1 : b.posted_at > a.posted_at ? 1 : (a.id < b.id ? -1 : 1);
  };

  fetch('../data/products.json')
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (d) { d.products = d.products.filter(function (p) { return p.publish_state === 'published'; }); return d; })
    .then(render)
    .catch(function () {
      $('heroNote').textContent = '商品データを読み込めませんでした（../data/products.json）。';
      $('shelfGrid').innerHTML = '<li class="tile more"><a href="../products/"><b>商品一覧へ</b></a></li>';
    });

  // 商品写真が読めなければ消して、下の無地＋商品名を見せる（.jpg→.png を試したあと）
  document.addEventListener('error', function (e) {
    var t = e.target;
    if (t && t.tagName === 'IMG' && t.parentNode && t.parentNode.classList.contains('pic')) t.remove();
  }, true);

  function pic(p, overlay) {
    var src = '../' + (p.images && p.images[0] ? p.images[0] : 'img/products/' + p.id + '.jpg');
    return '<div class="pic">' +
      '<span class="pic-fb">' + esc(p.title) + '</span>' +
      '<img src="' + esc(src) + '" alt="' + esc(p.title) + '" loading="lazy">' +
      (overlay || '') + '</div>';
  }

  function render(data) {
    var cats = data.categories, ranks = data.condition_ranks.items;
    var all = data.products.slice().sort(byNew);
    var live = all.filter(function (p) { return p.status !== 'sold'; });
    var newest = all[0].posted_at;
    var rankMap = {};
    ranks.forEach(function (r) { rankMap[r.id] = r; });

    // ヒーロー注記（データ由来の事実だけ）
    var newCount = live.filter(function (p) { return p.posted_at === newest; }).length;
    $('heroNote').textContent = 'サンプルデータ｜最新の入荷日 ' + md(newest) + '（' + wd(newest) + '）に ' + newCount + '点を掲載。';

    // ヒーロー画像が無いとき
    var hi = document.querySelector('#heroPhoto img');
    hi.addEventListener('error', function () { hi.remove(); $('heroPhoto').classList.add('no-img'); });
    if (hi.complete && hi.naturalWidth === 0) { hi.remove(); $('heroPhoto').classList.add('no-img'); }

    // 帯：新しい順の入荷ティッカー
    var items = all.slice(0, 12).map(function (p) {
      return '<li><a href="' + detail(p.id) + '"' + (p.status === 'sold' ? ' class="is-sold"' : '') + '>' +
        '<span class="d">' + md(p.posted_at) + '</span><span>' + esc(p.title) + '</span>' +
        '<span class="p">' + yen(p.price) + '</span></a></li>';
    }).join('');
    $('tickerTrack').innerHTML = items + items;
    Array.prototype.forEach.call($('tickerTrack').querySelectorAll('li'), function (li, i) { if (i >= items.split('</li>').length - 1) { var a = li.firstChild; a.setAttribute('tabindex', '-1'); a.setAttribute('aria-hidden', 'true'); } });

    // カテゴリ件数（販売中＋取り置き中）
    var count = {}, byCat = {};
    live.forEach(function (p) { count[p.category] = (count[p.category] || 0) + 1; });
    all.forEach(function (p) { (byCat[p.category] = byCat[p.category] || []).push(p); });

    $('catTabs').insertAdjacentHTML('beforeend', cats.map(function (c) {
      return '<a class="cat-tab" href="../products/?cat=' + c.id + '">' + esc(c.label) + '<small>' + (count[c.id] || 0) + '</small></a>';
    }).join(''));

    // 棚：全点を入荷順に。先頭だけ大きく、SOLD OUTも同じ棚に残す
    var grid = $('shelfGrid');
    grid.innerHTML = all.map(function (p, i) {
      var sold = p.status === 'sold', rsv = p.status === 'reserved', isNew = p.posted_at === newest && !sold;
      var rk = p.condition_rank, r = rankMap[rk] || {};
      var flags = (isNew ? '<span class="new">NEW</span>' : '') + (rsv ? '<span class="rsv">取り置き中</span>' : '');
      var overlay = (flags ? '<div class="flag">' + flags + '</div>' : '') +
        '<span class="rank' + (rk === 'W' ? ' w' : '') + '" title="' + esc(r.label || '') + '">' + (rk === 'W' ? '訳あり' : rk) + '</span>';
      return '<li class="tile' + (i === 0 ? ' big' : '') + (sold ? ' is-sold' : '') + '">' +
        '<a href="' + detail(p.id) + '">' + pic(p, overlay) +
        '<div class="meta"><span class="mono">' + md(p.posted_at) + ' 入荷</span>' +
        '<span>' + esc(r.label || '') + '</span>' +
        (p.large_item ? '<span class="lg">大型・要相談</span>' : '') + '</div>' +
        '<h3 class="ttl">' + esc(p.title) + '</h3>' +
        '<p class="price">' + yen(p.price) + (p.price_tentative ? '<small>仮</small>' : '') + '</p>' +
        '</a></li>';
    }).join('');
    grid.insertAdjacentHTML('beforeend', '<li class="tile more" id="moreTile"><a href="../products/?sort=new"><span>→</span><b>すべての商品を見る</b></a></li>');
    fillLast();
    var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(fillLast, 120); });

    // カテゴリ：写真の並ぶ段
    $('catList').innerHTML = cats.map(function (c) {
      var list = (byCat[c.id] || []).filter(function (p) { return p.status !== 'sold'; }).slice(0, 4);
      var thumbs = '';
      for (var i = 0; i < 4; i++) thumbs += list[i] ? pic(list[i]) : '<div class="pic empty"></div>';
      var sub = c.sub && c.sub.length ? c.sub.map(function (s) { return esc(s.label); }).join('・') : '上のどれにも入らないもの';
      return '<li class="cat-row"><a href="../products/?cat=' + c.id + '">' +
        '<div class="cat-name"><b>' + esc(c.label) + '</b><span class="n">' + (count[c.id] || 0) + '点</span><span class="cat-sub">' + sub + '</span></div>' +
        '<div class="cat-thumbs">' + thumbs + '</div></a></li>';
    }).join('');

    // タグ
    var tags = {};
    live.forEach(function (p) { (p.tags || []).forEach(function (g) { tags[g] = (tags[g] || 0) + 1; }); });
    $('tagChips').innerHTML = Object.keys(tags).sort(function (a, b) { return tags[b] - tags[a]; }).slice(0, 10).map(function (g) {
      return '<li><a href="../products/?q=' + encodeURIComponent(g) + '">' + esc(g) + '</a></li>';
    }).join('');

    // ランク説明
    $('rankList').innerHTML = ranks.map(function (r) {
      return '<div><dt><i' + (r.id === 'W' ? ' class="w"' : '') + '>' + (r.id === 'W' ? '訳あり' : r.id) + '</i>' + esc(r.label) + '</dt><dd>' + esc(r.desc) + '</dd></div>';
    }).join('');
  }

  // 最後の行の空きを「すべての商品を見る」で埋める
  function fillLast() {
    var grid = $('shelfGrid'), more = $('moreTile');
    if (!grid || !more) return;
    var cols = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
    more.style.gridColumn = 'span 1';
    var tiles = Array.prototype.filter.call(grid.children, function (el) { return el !== more; });
    var used = 0;
    tiles.forEach(function (el) {
      if (el.classList.contains('big')) {
        used += cols >= 4 ? 4 : 2; // 大きい1枚は幅2×高さ2（スマホは幅2×高さ1）
      } else { used += 1; }
    });
    var rest = cols - (used % cols);
    more.style.gridColumn = 'span ' + (rest === 0 ? cols : rest);
  }
})();
