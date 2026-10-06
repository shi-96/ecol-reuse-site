/* 商品詳細：?id=ecol-0001 。状態（在庫あり／取り置き中／SOLD OUT）で導線を出し分ける */
(function () {
  'use strict';
  var E = window.ECOL, I = E.info, esc = E.esc;
  var root = document.getElementById('detail');

  function row(k, v) { return v ? '<div><dt>' + k + '</dt><dd>' + v + '</dd></div>' : ''; }

  function reserveText(p, kind) {
    var head = kind === 'wait' ? '【順番待ちのご相談】' : '【取り置き・購入のご相談】';
    return head + '\n商品ID：' + p.id + '\n商品名：' + p.title + '\n価格（サンプル）：' + E.yen(p.price) + '（税込・仮）\n\n' +
      'お名前：\nご連絡先（電話 or LINE）：\nお届け先の地域（市町村まででも可）：\n戸建て / アパート・マンション等：\n階数・エレベーター：\nその他（搬入経路・ご希望など）：';
  }

  function ctaBlocks(p) {
    var st = p.status;
    var lineLabel = st === 'sold' ? '入荷の相談（公式LINE）' : st === 'reserved' ? '順番待ちの相談（公式LINE）' : '公式LINEで相談・取り置き';
    var formLabel = st === 'sold' ? '入荷の相談（問い合わせフォーム）' : st === 'reserved' ? '順番待ちの相談（フォーム）' : '問い合わせフォームで相談';
    var line = '<a class="btn" href="' + I.line + '" target="_blank" rel="noopener">' + lineLabel + '</a>';
    var form = '<a class="btn btn-outline" href="' + I.form + '" target="_blank" rel="noopener">' + formLabel + ' ↗</a>';
    var note = '<p class="cta-note">公式LINEと問い合わせフォーム（メールで返信）のどちらでもご相談いただけます。商品IDと商品名をお伝えください。購入の可否・お支払い・配送の詳細は、内容を確認してからご案内します（決済方法・配送条件は未確定）。</p>';
    if (st === 'sold') {
      return '<div class="dt-cta"><p style="margin:0;font-size:14px">この商品は売れました。似た商品を探すか、入荷の相談をしてください。</p>' +
        '<a class="btn btn-block" href="' + E.url.list({ cat: p.category }) + '">同じカテゴリの商品を見る</a>' +
        '<div class="two">' + line + form + '</div>' + note + '</div>';
    }
    return '<div class="dt-cta"><div class="two">' + line + form + '</div>' +
      '<a class="btn btn-quiet btn-block" href="#reserve">' + (st === 'reserved' ? '順番待ちの文面をコピーする' : '相談用の文面をコピーする') + '</a>' + note +
      '<ol class="buy-flow" aria-label="購入までの流れ（試作）"><li>問い合わせ</li><li>取り置き・確認</li><li>配送の相談</li></ol></div>';
  }

  function render(d, p) {
    var st = E.status(p), rk = E.rank(d, p.condition_rank);
    var cat = E.catLabel(d, p.category), sub = E.subLabel(d, p);
    document.title = p.title + ' ｜ ECOL（試作）';
    var imgs = (p.images && p.images.length) ? p.images : [''];
    var deli = E.deliveryText(p);
    if (p.delivery !== 'unavailable') deli += '<span class="tag tag-tbd">未確定</span>';

    var thumbs = imgs.length > 1 ? '<div class="gal-thumbs" role="group" aria-label="写真の切り替え">' +
      imgs.map(function (_, i) { return '<button type="button" data-i="' + i + '" aria-label="写真' + (i + 1) + '" aria-current="' + (i === 0) + '"><span class="pt-fig" style="--ratio:1/1;border-radius:0">' + E.imgHTML(p, i, { alt: '' }) + '</span></button>'; }).join('') + '</div>' : '';

    var h = '<div class="dt-gal"><div class="gal-main" id="galMain">' + E.imgHTML(p, 0, { eager: true }) +
      (st.key === 'available' ? '' : '<span class="lbl lbl-' + st.key + '">' + esc(st.label) + '</span>') + '</div>' + thumbs +
      '<p class="gal-note">' + (imgs.length > 1 ? '' : '写真は1枚のサンプルです。実際の掲載では、全体・傷汚れの接写・付属品など複数枚を載せる想定です。') + '</p></div>';

    h += '<div class="dt-info">' +
      '<div class="dt-flags"><span class="stock ' + st.key + '">' + esc(st.label) + '</span>' +
      (p.sample ? '<span class="tag tag-sample" style="margin:0">SAMPLE</span>' : '') +
      '<span style="color:var(--mute)">' + esc(cat) + (sub ? ' ／ ' + esc(sub) : '') + '　' + E.date(p.posted_at) + ' 掲載</span></div>' +
      '<h1>' + esc(p.title) + '</h1>' +
      '<div class="dt-price"><span class="yen">' + E.yen(p.price) + '</span><small>税込' + (p.price_tentative ? '・仮表記（サンプル価格）' : '') + '</small></div>' +
      '<dl class="dt-quick">' +
      (st.key === 'reserved' ? row('取り置き', '現在、取り置き中です<span class="tag tag-tbd">期間は要確認</span>') : '') +
      row('配送', deli) +
      (p.large_item ? row('大型品', '搬入サイズ・階段・お届け先の地域は、公式LINEまたは問い合わせフォームでご相談ください。') : '') +
      '</dl>' + ctaBlocks(p);

    // 商品状態
    var work = E.workText(p);
    h += '<section class="dsec" id="condition"><h2>商品の状態</h2>' +
      '<div class="rank-box"><div class="rank-big" aria-hidden="true">' + E.rankMark(p.condition_rank) + '</div><div>' +
      '<h3>ランク' + E.rankMark(p.condition_rank) + '｜' + esc(rk.label) + '<span class="tag tag-prov">定義は仮</span></h3>' +
      '<p>' + esc(rk.desc) + ' <a href="' + E.url.page('guide/index.html#rank') + '">ランクの定義を見る</a></p></div></div>' +
      (p.condition_note ? '<p style="margin:14px 0 0;font-size:14px">' + esc(p.condition_note) + '</p>' : '') +
      (work ? '<p style="margin:8px 0 0;font-size:14px"><b>' + esc(work) + '</b></p>' : '') +
      ((p.damage_notes || []).length ? '<ul class="damage" aria-label="傷・汚れ">' + p.damage_notes.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '<p style="margin-top:12px;font-size:14px">傷・汚れ：特記なし</p>') +
      '</section>';

    // 基本情報
    var size = E.sizeText(p) + (p.size && p.size.weight_kg ? '　重さ 約' + p.size.weight_kg + 'kg' : '');
    h += '<section class="dsec"><h2>商品情報</h2><dl class="spec">' +
      row('カテゴリ', esc(cat) + (sub ? ' ／ ' + esc(sub) : '')) + row('メーカー', esc(p.brand || '―')) +
      row('型番', esc(p.model || '―') + (p.model && /^SAMPLE/.test(p.model) ? '<span class="tag tag-sample">架空の型番</span>' : '')) +
      row('年式', p.year ? p.year + '年' : '―') + row('サイズ', esc(size)) +
      row('付属品', (p.accessories || []).length ? esc(p.accessories.join('、')) : 'なし') +
      row('説明', p.description ? esc(p.description) : '') + '</dl></section>';

    // 配送の詳細
    h += '<section class="dsec"><h2>配送について</h2><dl class="spec">' +
      row('配送', deli) +
      (p.recycle_law_item ? row('家電リサイクル', '対象の品目です。古い家電の引き取り可否・リサイクル料金は<span class="tag tag-tbd">要確認</span>') : '') +
      row('お支払い', 'ご相談のうえで決定<span class="tag tag-tbd">方法は未確定</span>') + '</dl>' +
      '<p style="margin:10px 0 0;font-size:13px"><a href="' + E.url.page('guide/index.html') + '">配送について</a></p></section>';

    // 取り置き依頼
    if (st.key !== 'sold') {
      var kind = st.key === 'reserved' ? 'wait' : 'reserve';
      h += '<section class="dsec" id="reserve"><h2>' + (kind === 'wait' ? '順番待ちの相談' : '取り置きの依頼') + '</h2>' +
        '<p style="font-size:13.5px;color:var(--ink-2)">' + (kind === 'wait' ? '現在、取り置き中です。キャンセルが出た場合の順番待ちをご相談ください。' : 'この試作ではオンライン決済を持ちません。下の文面をコピーして、公式LINEまたは問い合わせフォームでお伝えください。') + '</p>' +
        '<div class="reserve-box"><label class="sr" for="rtext">相談の文面</label><textarea id="rtext" readonly>' + esc(reserveText(p, kind)) + '</textarea>' +
        '<div class="row"><button type="button" class="btn btn-outline" id="copy">文面をコピー</button>' +
        '<a class="btn" href="' + I.line + '" target="_blank" rel="noopener">公式LINEを開く</a>' +
        '<a class="btn btn-outline" href="' + I.form + '" target="_blank" rel="noopener">フォームを開く ↗</a></div>' +
        '<p class="copied" id="copied" role="status"></p>' +
        '<p class="cta-note" style="margin:0">取り置き期間・キャンセルの扱いは<span class="tag tag-tbd">要確認</span>　LINEだけで購入が完了するとは限りません。内容確認のうえ、次の手順をご案内します。</p></div>' +
        (st.key === 'available' ? '<div class="pay-future"><button type="button" class="btn btn-block" disabled aria-disabled="true">オンラインで支払う</button>' +
          '<p><span class="tag tag-prov">将来対応（試作）</span>この試作では押せません。オンライン決済は、将来の提案としてボタンの位置だけ示した見本です。</p></div>' : '') +
        '</section>';
    }
    h += '</div>';
    root.innerHTML = h;
    E.checkImages(root);

    // ギャラリー
    root.querySelectorAll('.gal-thumbs button').forEach(function (b) {
      b.addEventListener('click', function () {
        var i = +b.getAttribute('data-i');
        var st0 = root.querySelector('#galMain .lbl');
        root.querySelector('#galMain').innerHTML = E.imgHTML(p, i, { eager: true }) + (st0 ? st0.outerHTML : '');
        root.querySelectorAll('.gal-thumbs button').forEach(function (x) { x.setAttribute('aria-current', x === b ? 'true' : 'false'); });
        E.checkImages(root);
      });
    });
    if (st.key === 'sold') root.querySelector('.gal-main').classList.add('is-sold');
    // コピー
    var cp = root.querySelector('#copy');
    if (cp) cp.addEventListener('click', function () {
      var ta = root.querySelector('#rtext'), msg = root.querySelector('#copied');
      var done = function () { msg.textContent = 'コピーしました。公式LINEのトーク画面、または問い合わせフォームの内容欄に貼り付けてください。'; };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(ta.value).then(done, function () { ta.select(); document.execCommand('copy'); done(); });
      else { ta.select(); try { document.execCommand('copy'); done(); } catch (e) { msg.textContent = '文面を選択してコピーしてください。'; } }
    });

    // 下部固定バー（問い合わせフォーム＋公式LINE）
    var bar;
    if (st.key === 'sold') bar = '<a class="btn btn-quiet" href="' + E.url.list({ cat: p.category }) + '">似た商品を見る</a><a class="btn" href="' + I.line + '" target="_blank" rel="noopener">公式LINE</a>';
    else bar = E.layout.barHTML();
    E.layout.setBar(bar);

    // 関連商品
    var rel = E.related(d, p, 4);
    var relEl = document.getElementById('rel');
    if (rel.length) { relEl.hidden = false; E.renderTiles(relEl.querySelector('.pgrid'), d, rel, { ratio: '1/1' }); }
    var crumb = document.getElementById('crumbCat');
    crumb.innerHTML = '<a href="' + E.url.list({ cat: p.category }) + '">' + esc(cat) + '</a>';
  }

  function notFound() {
    root.innerHTML = '<div class="empty" style="grid-column:1/-1"><p>この商品は見つかりませんでした。</p><a class="btn btn-outline" href="' + E.url.list({}) + '">商品一覧へ</a></div>';
    E.layout.setBar('<a class="btn grow" href="' + E.url.list({}) + '">商品一覧へ</a>');
  }

  E.load().then(function (d) {
    var id = new URLSearchParams(location.search).get('id') || '';
    var p = d.products.filter(function (x) { return x.id === id; })[0];
    if (p) render(d, p); else notFound();
  }).catch(function (e) { E.loadError(root, e); });
})();
