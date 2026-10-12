/*!
 * ECOL 共通ヘッダー／フッター差し込み（data.js の後に読み込む）
 * <body data-layout="full|footer|none" data-nav="products|guide|store|contact" data-bar="1">
 *   full   … サイト切り替え＋試作の帯＋ヘッダー＋フッター（既定）
 *   footer … 試作の帯＋フッターだけ（TOP案・比較入口が自前ヘッダーを持つとき）
 *   none   … 何も差し込まない（何も行わない）
 *   data-bar="1" … スマホ下部の固定CTAバー（問い合わせフォーム＋公式LINE）。詳細ページは ECOL.layout.setBar() で差し替え
 */
(function () {
  'use strict';
  var E = window.ECOL; if (!E) return;
  var I = E.info, u = E.url.page;
  var L = E.layout = {};
  var body = document.body;
  var mode = body.getAttribute('data-layout') || 'full';
  var nav = body.getAttribute('data-nav') || '';

  function norm(p) { return p.replace(/index\.html$/, ''); }
  function sameAsTop() { return norm(new URL(E.topHref()).pathname) === norm(location.pathname); }
  L.bandHTML = function () {
    return '<div class="sample-band" role="note"><div class="wrap">' +
      '<span class="sb-msg"><b>試作</b>SAMPLE<span class="l">　商品・価格はすべてサンプルです（確認用・非公開）</span><span class="s">　価格はサンプル</span></span>' +
      (sameAsTop() ? '' : '<a href="' + E.topHref() + '">← <span class="bk-l">' + E.topName() + 'へ戻る</span><span class="bk-s">トップへ</span></a>') + '</div></div>';
  };
  L.logoHTML = function (cls, lazy) {
    return '<picture><source srcset="' + u('img/brand/ecol-logo.webp') + '" type="image/webp"><img class="' + cls + '" src="' + u('img/brand/ecol-logo.png') + '" width="430" height="200" alt="ECOL（エコル）"' + (lazy ? ' loading="lazy"' : '') + '></picture>';
  };
  // 2サイト切り替え（買取・不用品回収／リユース販売）。このサイトはリユース側
  L.switchHTML = function () {
    return '<nav class="site-switch" aria-label="ECOLのサイト切り替え"><div class="wrap sw-in">' +
      '<a class="sw" href="' + I.buy + '"><small>売りたい・片付けたい方</small><b>買取・不用品回収</b><span class="sw-arw" aria-hidden="true">→</span></a>' +
      '<a class="sw is-current" href="' + E.topHref() + '" aria-current="page"><small>中古品を買いたい方</small><b>リユース品を買う</b></a>' +
      '</div></nav>';
  };
  L.headerHTML = function () {
    var items = [
      ['products', '商品一覧', u('products/index.html')],
      ['guide', '配送について', u('guide/index.html')],
      ['store', '事業者情報', u('store/index.html')],
      ['contact', '問い合わせ', u('contact/index.html')]
    ];
    var cur = function (k) { return k === nav ? ' aria-current="page"' : ''; };
    var d = items.map(function (x) { return '<a href="' + x[2] + '"' + cur(x[0]) + '>' + x[1] + '</a>'; }).join('');
    var m = items.map(function (x) { return '<a href="' + x[2] + '"' + cur(x[0]) + '>' + x[1] + '</a>'; }).join('') +
      '<a class="ext" href="' + I.buy + '">不用品を売りたい方（買取・不用品回収）</a>';
    return '<header class="site-head"><div class="wrap">' +
      '<a class="brand" href="' + E.topHref() + '" aria-label="ECOL リユース販売 トップへ">' + L.logoHTML('brand-logo') + '<span class="brand-sub">釧路買取サービスの<br>リユース販売</span></a>' +
      '<nav class="gnav" aria-label="メイン">' + d + '</nav>' +
      '<div class="head-cta">' +
      '<a class="btn btn-sm" href="' + I.line + '" target="_blank" rel="noopener">LINEで相談</a></div>' +
      '<button class="menu-btn" type="button" aria-expanded="false" aria-controls="mnav"><i></i>メニュー</button>' +
      '</div><nav class="mnav" id="mnav" aria-label="メニュー">' + m + '</nav></header>';
  };
  L.footerHTML = function () {
    return '<footer class="site-foot"><div class="wrap"><div class="cols">' +
      '<div><div class="f-brand">' + L.logoHTML('f-logo', true) + '</div>' +
      '<p>釧路買取サービスのリユース販売<br><span class="fact">運営：' + I.company + '<br>' + I.zip + ' ' + I.address + '（現買取サイト掲載情報）</span></p>' +
      '<p class="fact" style="font-size:12px">実店舗はなく、事務所内の倉庫を使っています。来店での受け取り・お渡しは行っておらず、購入後は配送が基本です。</p></div>' +
      '<div><h3>このサイト</h3><ul>' +
      '<li><a href="' + E.url.list({ sort: 'new' }) + '">新着商品</a></li>' +
      '<li><a href="' + E.url.list({}) + '">商品一覧</a></li>' +
      '<li><a href="' + u('guide/index.html') + '">配送について</a></li>' +
      '<li><a href="' + u('guide/index.html#rank') + '">状態ランクの見方</a></li>' +
      '<li><a href="' + u('store/index.html') + '">事業者情報</a></li>' +
      '<li><a href="' + u('contact/index.html') + '">問い合わせ・LINE</a></li></ul></div>' +
      '<div><h3>釧路買取サービス</h3><p class="fact">不用品の買取・不用品回収の相談は、既存の釧路買取サービスで受け付けています。</p>' +
      '<a class="ext" href="' + I.buy + '">不用品を売りたい方（買取・不用品回収）→</a>' +
      '<p class="fact" style="margin-top:10px"><a href="' + I.form + '" target="_blank" rel="noopener">問い合わせフォーム ↗</a>　<a href="' + I.line + '" target="_blank" rel="noopener">公式LINE ↗</a></p></div>' +
      '</div><div class="legal"><b>これは確認用の試作です。</b>商品・価格・在庫・配送条件はすべてサンプル・仮置きで、ECOLの実在庫や実際の条件ではありません。非公開のプレビューです。</div></div></footer>';
  };
  L.barHTML = function () {
    return '<a class="btn btn-outline" href="' + I.form + '" target="_blank" rel="noopener">問い合わせフォーム</a>' +
      '<a class="btn" href="' + I.line + '" target="_blank" rel="noopener">公式LINE</a>';
  };
  L.setBar = function (html) {
    var b = document.getElementById('ecol-bar');
    if (!b) { b = document.createElement('div'); b.id = 'ecol-bar'; b.className = 'cta-bar'; b.setAttribute('role', 'region'); b.setAttribute('aria-label', '問い合わせ'); body.appendChild(b); body.classList.add('has-bar'); }
    b.innerHTML = html;
  };

  function init() {
    if (mode === 'none') return;
    var top = document.createElement('div'); top.id = 'ecol-top';
    top.innerHTML = L.switchHTML() + L.bandHTML() + (mode === 'full' ? L.headerHTML() : '');
    body.insertBefore(top, body.firstChild);
    var skip = document.createElement('a'); skip.className = 'skip'; skip.href = '#main'; skip.textContent = '本文へ'; body.insertBefore(skip, body.firstChild);
    var f = document.createElement('div'); f.id = 'ecol-foot'; f.innerHTML = L.footerHTML(); body.appendChild(f);
    var btn = top.querySelector('.menu-btn');
    if (btn) btn.addEventListener('click', function () {
      var open = top.querySelector('.mnav').classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    if (body.getAttribute('data-bar')) L.setBar(L.barHTML());
    document.querySelectorAll('[data-top]').forEach(function (a) { a.href = E.topHref(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
