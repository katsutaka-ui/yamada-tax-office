// 山田勝隆税理士事務所：SEO・導線・記事ページの改善
// build.mjs が dist を生成した後に実行する。既存フォーム・GA4設定は変更しない。
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const out = path.join(root, 'dist');
const baseUrl = 'https://yamada-tax-office-2026.netlify.app';
const indexPath = path.join(out, 'index.html');
const blogPath = path.join(out, 'blog.html');
let home = fs.readFileSync(indexPath, 'utf8');
let blog = fs.readFileSync(blogPath, 'utf8');
const escapeHtml = (x='') => String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const articlePath = (post) => `/articles/${encodeURIComponent(String(post.id||'').replace(/\.md$/i,'').replace(/-+$/,''))}/`;
const fit = (s, n=132) => String(s||'').replace(/\s+/g,' ').trim().slice(0,n);
const requireReplace = (src, oldText, newText, label) => {
  if (!src.includes(oldText)) throw new Error(`サイトの構成が変わっています：${label}`);
  return src.replace(oldText,newText);
};
const injectAfterSection = (html, token, addition, label) => {
  const start = html.indexOf(token);
  if (start < 0) throw new Error(`挿入先が見つかりません：${label}`);
  const end = html.indexOf('</section>', start);
  if (end < 0) throw new Error(`挿入先の終わりが見つかりません：${label}`);
  return html.slice(0, end + '</section>'.length) + '\n' + addition + html.slice(end + '</section>'.length);
};

const enhancementCss = `
/* 改善版：視認性・問い合わせ導線・スマートフォン表示 */
.section-head h1{font-size:clamp(1.8rem,3vw,2.8rem);color:#17324d;margin:.2em 0}
.skip-to-content{position:absolute;top:-100px;left:14px;z-index:3000;background:#fff;color:#17324d;padding:12px 18px;border-radius:8px;box-shadow:0 6px 16px #17324d33}
.skip-to-content:focus{top:12px}
.hero h1{font-size:clamp(2.05rem,4.3vw,3.9rem);line-height:1.3;letter-spacing:-.045em;word-break:keep-all;overflow-wrap:anywhere}
.hero .hero-lede{font-size:1.11rem;line-height:1.95;max-width:630px}
.hero .hero-note{font-size:.87rem;color:#526476;margin:14px 0 0}
.hero .hero-note strong{color:#17324d}
.hero-actions .btn-primary,.hero-actions .btn-secondary{min-height:48px}
.proof-strip{padding:24px 0;background:#fff;border-bottom:1px solid #e2e9ef}
.proof-strip .container{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:12px 30px}
.proof-strip .proof-item{font-size:.92rem;color:#17324d;font-weight:700;display:inline-flex;gap:8px;align-items:center}
.proof-strip .proof-item:before{content:'✓';display:inline-grid;place-items:center;width:23px;height:23px;border-radius:50%;background:#f3ebda;color:#80612a;font-weight:900}
.flow-section{background:linear-gradient(180deg,#f8fafc,#fff)}
.flow-steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}
.flow-step{position:relative;padding:28px;border:1px solid #dae3e9;background:#fff;border-radius:18px;box-shadow:0 5px 22px #17324d0a}
.flow-number{font-size:.75rem;letter-spacing:.1em;font-weight:800;color:#9d792d}
.flow-step h3{color:#17324d;margin:9px 0;font-size:1.15rem}
.flow-step p{margin:0;color:#526170;font-size:.96rem}
.flow-note{max-width:800px;margin:24px auto 0;text-align:center;color:#5b6b77;font-size:.91rem}
.area-note{margin:30px 0 0;padding:22px 25px;border-left:4px solid #c8a76a;border-radius:0 12px 12px 0;background:#fff;color:#42525d}
.area-note strong{color:#17324d}
.home-blog{background:#f7f8fa}
.home-blog-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}
.home-blog-card{display:flex;flex-direction:column;padding:24px 24px 21px;background:#fff;border:1px solid #e1e7ed;border-radius:18px;box-shadow:0 5px 20px #17324d09;transition:transform .2s ease,box-shadow .2s ease}
.home-blog-card:hover{transform:translateY(-3px);box-shadow:0 11px 25px #17324d13}
.home-blog-date{font-size:.84rem;color:#637483}
.home-blog-card h3{font-size:1.12rem;line-height:1.6;color:#17324d;margin:12px 0}
.home-blog-card p{font-size:.93rem;color:#526170;margin:0 0 20px;flex:1}
.home-blog-card a{font-weight:700;color:#174468;text-decoration:underline;text-decoration-color:#c8a76a;text-underline-offset:5px;align-self:flex-start}
.home-blog-all{text-align:center;margin:34px 0 0}
.blog-read{font:inherit;text-decoration:underline;text-decoration-color:#c8a76a;text-underline-offset:5px}
.blog-page-lede{max-width:680px;text-align:center;margin:-15px auto 28px;color:#586775}
@media(max-width:860px){.flow-steps,.home-blog-grid{grid-template-columns:1fr}.proof-strip .container{justify-content:flex-start}.hero h1{font-size:clamp(2rem,7vw,3.2rem)}}
@media(max-width:520px){.proof-strip{padding:17px 0}.proof-strip .container{gap:10px}.proof-strip .proof-item{font-size:.84rem}.hero .hero-lede{font-size:1rem}.flow-step{padding:23px}.home-blog-card{padding:21px}}
@media(prefers-reduced-motion:reduce){.home-blog-card{transition:none}}
`;
const styleSnippet = `<style id="site-enhancements">${enhancementCss}</style>`;
for (const which of ['home','blog']) {
  const value = which === 'home' ? home : blog;
  const withStyles = requireReplace(value, '</head>', styleSnippet+'\n</head>', `${which} head`);
  const withSkip = requireReplace(withStyles, '<body>', '<body>\n<a class="skip-to-content" href="#main-content">本文へスキップ</a>', `${which} body`);
  if (which === 'home') home = withSkip; else blog = withSkip;
}

// 主な対象エリアは都内・多摩地区。国分寺市は所在地として控えめに表記する。
// meta keywords ではなく、ページタイトルと説明文を自然な日本語に整える。
const setSearchMetadata = (html, {title, description}, label) => {
  const fields = [
    [/<title>[^<]*<\/title>/i, `<title>${escapeHtml(title)}</title>`, 'title'],
    [/<meta name="description" content="[^"]*"\s*\/?>/i, `<meta name="description" content="${escapeHtml(description)}">`, 'description'],
    [/<meta property="og:title" content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${escapeHtml(title)}">`, 'og:title'],
    [/<meta property="og:description" content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${escapeHtml(description)}">`, 'og:description'],
  ];
  for (const [pattern, replacement, field] of fields) {
    if (!pattern.test(html)) throw new Error(`${label} の ${field} が見つかりません`);
    html = html.replace(pattern, replacement);
  }
  return html;
};

home = setSearchMetadata(home, {
  title: '都内・多摩地区の中小企業向け税務・会計｜山田勝隆税理士事務所',
  description: '都内・多摩地区の中小企業・個人事業主の税務・会計をサポート。法人決算・法人税申告、記帳代行、税務顧問、確定申告に対応する山田勝隆税理士事務所（東京都国分寺市）。',
}, 'トップページ');
blog = setSearchMetadata(blog, {
  title: '税務・会計のブログ・お知らせ｜山田勝隆税理士事務所',
  description: '都内・多摩地区の中小企業・個人事業主に役立つ税務・会計の話題、事務所からのお知らせや日々の出来事を発信する山田勝隆税理士事務所のブログ。',
}, 'ブログ');

// 所在地はフッターや構造化データに残し、冒頭では対象地域を優先する。
home = requireReplace(home,
  '東京都国分寺市を拠点に、都内・多摩地区の税務・会計を支える山田勝隆税理士事務所です。',
  '都内・多摩地区の中小企業・個人事業主の税務・会計を支える山田勝隆税理士事務所です。',
  '冒頭の事務所案内');

// トップページ：ご相談内容がすぐ分かる見出しと、根拠のある案内にする。
home = requireReplace(home,'<main>','<main id="main-content">','トップ main');
home = requireReplace(home,'<h1>中小企業の<br>税務・会計をサポート</h1>',
  '<h1>都内・多摩地区の<br>中小企業を税務・会計で<br>サポート</h1>', '見出し');
home = requireReplace(home,'<a class="btn-primary" href="#contact">無料相談を申し込む</a>',
  '<a class="btn-primary" href="#contact">税務・会計について相談する</a>', 'CTA');
home = requireReplace(home,'<div class="hero-actions">\n', '<div class="hero-actions">\n', 'hero-actions');
home = requireReplace(home, '<a class="btn-secondary" href="#service">業務内容を見る</a>',
  '<a class="btn-secondary" href="#service">対応業務を見る</a>', '副CTA');
home = requireReplace(home, '<div class="hero-card">',
  '<div class="hero-card">', 'hero card');
home = requireReplace(home,'<h2>選ばれる3つの理由</h2>', '<h2>当事務所の3つの特徴</h2>', '特徴見出し');
home = requireReplace(home,'<a href="#strength">選ばれる理由</a>', '<a href="#strength">当事務所の特徴</a>', 'メニュー');
// お問い合わせにより料金等が確定すると誤解させない。
home = requireReplace(home, '<div class="hero-actions">\n          <a class="btn-primary"', '<div class="hero-actions">\n          <a class="btn-primary"', 'hero actions area');
const heroNote = '<p class="hero-note"><strong>お問い合わせだけで契約にはなりません。</strong> 内容を確認して折り返しご連絡します。</p>';
home = requireReplace(home, '</div>\n      </div>\n\n      <div class="hero-card">',
  '</div>\n        '+heroNote+'\n      </div>\n\n      <div class="hero-card">', 'hero補足');

const proof = `<aside class="proof-strip" aria-label="事務所の基本情報">
  <div class="container">
    <span class="proof-item">都内・多摩地区の税務・会計に対応</span>
    <span class="proof-item">東京税理士会 立川支部</span>
    <span class="proof-item">税理士登録番号 98674</span>
  </div>
</aside>`;
home = injectAfterSection(home, '<section class="hero">', proof, 'hero');

const locationInfo = `<p class="area-note"><strong>都内・多摩地区からのご相談に対応しています。</strong>
法人決算・法人税申告、記帳代行、税務顧問、個人の確定申告など、現在の状況に合わせて業務範囲をご案内します。オンラインでのご相談も可能です。</p>`;
home = requireReplace(home,
  '      </div>\n    </div>\n  </section>\n\n\n  <section id="corporate-closing">',
  '      </div>\n      '+locationInfo+'\n    </div>\n  </section>\n\n\n  <section id="corporate-closing">', '対応地域');

const flow = `<section id="consultation-flow" class="flow-section" aria-labelledby="flow-title">
 <div class="container">
  <div class="section-head"><div class="eyebrow">HOW IT WORKS</div><h2 id="flow-title">ご相談からご依頼までの流れ</h2>
   <p>まずは状況をお聞かせください。業務の範囲や進め方を整理してご案内します。</p></div>
  <div class="flow-steps">
   <div class="flow-step"><div class="flow-number">STEP 01</div><h3>お問い合わせ</h3><p>フォームから決算月やご相談内容をお知らせください。分かる範囲で大丈夫です。</p></div>
   <div class="flow-step"><div class="flow-number">STEP 02</div><h3>内容の確認・ご案内</h3><p>現在の状況を確認し、必要な資料、対応する業務の範囲、費用の見積りをご案内します。</p></div>
   <div class="flow-step"><div class="flow-number">STEP 03</div><h3>ご依頼後、業務開始</h3><p>内容をご確認いただき、ご依頼となった場合に、資料の確認と実務を進めます。</p></div>
  </div>
  <p class="flow-note">お問い合わせの送信だけで顧問契約が成立することはありません。</p>
  <div class="home-blog-all"><a class="btn-primary" href="#contact">お問い合わせフォームへ</a></div>
 </div>
</section>`;
home = injectAfterSection(home, '<section id="corporate-closing">', flow, '法人決算');

// CMSの記事データをビルド時に読んで、独立ページとホームの新着記事を生成。
const data = blog.match(/<script id="blog-data" type="application\/json">([\s\S]*?)<\/script>/);
if (!data) throw new Error('記事データが見つかりません');
const posts = JSON.parse(data[1]);
for (const post of posts) post.url = articlePath(post);
const latest = posts.slice(0,3);
const articleCards = latest.map(post=>`<article class="home-blog-card">
 <time class="home-blog-date" datetime="${escapeHtml(post.date)}">${escapeHtml(post.date)}</time>
 <h3>${escapeHtml(post.title)}</h3>
 <p>${escapeHtml(fit(post.summary,85))}</p>
 <a href="${post.url}">記事を読む →</a>
</article>`).join('\n');
const homeBlog = `<section class="home-blog" id="latest-posts" aria-labelledby="latest-title">
 <div class="container">
  <div class="section-head"><div class="eyebrow">BLOG & NEWS</div><h2 id="latest-title">ブログ・お知らせ</h2>
   <p>税務・会計のお知らせや、事務所の日々の出来事を発信しています。</p></div>
  <div class="home-blog-grid">${articleCards}</div>
  <div class="home-blog-all"><a class="btn-secondary" href="/blog">ブログ記事をすべて見る →</a></div>
 </div>
</section>`;
if (latest.length) home = injectAfterSection(home, '<section id="profile"', homeBlog, '事務所紹介');

// ブログの動的カードも個別記事を開くようにする（検索とカテゴリ機能はそのまま）。
blog = requireReplace(blog,'<main>','<main id="main-content">','ブログmain');
blog = requireReplace(blog,'<h2>税務・会計ブログ</h2>', '<h1>税務・会計ブログ</h1>', 'ブログh1');
const prevRead = `const read=el('button','記事を読む →','blog-read');read.type='button';
      read.addEventListener('click',()=>{
        const m=byId('blog-dialog-meta');m.replaceChildren(el('time',post.date||''));
        if(post.category)m.append(el('span',post.category,'blog-tag'));
        byId('blog-dialog-title').textContent=post.title||'';
        byId('blog-dialog-body').textContent=post.content||'';
        byId('blog-dialog').showModal();
      });`;
const newRead = `const read=el('a','記事を読む →','blog-read');
      read.href='/articles/'+encodeURIComponent(String(post.id||'').replace(/\\.md$/i,'').replace(/-+$/,''))+'/';`;
blog = requireReplace(blog,prevRead,newRead,'ブログカードのリンク');
blog = requireReplace(blog,'<a href="/#strength">選ばれる理由</a>', '<a href="/#strength">当事務所の特徴</a>', 'ブログメニュー');
blog = requireReplace(blog, '<div id="blog-list" class="blog-grid" aria-live="polite"></div>',
  '<div id="blog-list" class="blog-grid" aria-live="polite"></div>\n'+
  `<noscript><div class="blog-grid">${posts.map(p=>`<article class="blog-card"><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(fit(p.summary,120))}</p><a class="blog-read" href="${p.url}">記事を読む →</a></article>`).join('')}</div></noscript>`, 'ブログnoscript');

// 記事はSEO向け静的HTMLを生成する。記事本文はHTMLエスケープして安全に表示する。
const articleCss = `
:root{--navy:#17324d;--muted:#556773;--gold:#c8a76a}
*{box-sizing:border-box}body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Hiragino Kaku Gothic ProN','Yu Gothic',Meiryo,sans-serif;color:#26323d;background:#f7f8fa;line-height:1.9}
a{color:#1b5278}a:hover{text-decoration:none}a:focus-visible{outline:3px solid #b58b39;outline-offset:4px}
.skip-to-content{position:absolute;top:-100px;left:12px;z-index:3000;background:white;padding:10px 14px}.skip-to-content:focus{top:8px}
.article-container{width:min(820px,calc(100% - 36px));margin:auto}
.article-header{background:#fff;border-bottom:1px solid #e2e8ec}.article-header .article-container{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:20px 0}.article-brand{font-weight:800;text-decoration:none;color:var(--navy)}
.article-layout{padding:35px 0 76px}.article-back{font-size:.9rem}.article-paper{margin-top:18px;padding:clamp(25px,5vw,54px);background:#fff;border:1px solid #e0e6eb;border-radius:20px;box-shadow:0 12px 34px #17324d0c}
.article-meta{font-size:.87rem;color:#647381;display:flex;gap:16px;flex-wrap:wrap}.article-tag{background:#edf3f7;padding:2px 12px;border-radius:999px;color:#254963}
h1{font-size:clamp(1.65rem,4vw,2.6rem);line-height:1.4;color:var(--navy);margin:18px 0 28px;overflow-wrap:anywhere}
.article-body{font-size:1.05rem}.article-body p{margin:0 0 1.6em;white-space:normal;overflow-wrap:anywhere}.article-cta{margin:40px 0 0;padding:27px;background:#edf3f7;border-radius:15px}.article-cta h2{font-size:1.1rem;color:var(--navy);margin:0 0 6px}.article-cta p{margin:0 0 10px;font-size:.94rem}
.article-footer{padding:26px 0 44px;text-align:center;color:#637383;font-size:.86rem}
@media(max-width:600px){.article-header .article-container{align-items:flex-start;flex-direction:column;gap:5px}.article-layout{padding-top:22px}.article-body{font-size:1rem}}
`;

for(const post of posts){
  const uri=baseUrl+post.url;
  const paragraphs=String(post.content||'').trim().split(/\n\s*\n/).filter(Boolean)
    .map(p=>'<p>'+escapeHtml(p).replace(/\n/g,'<br>')+'</p>').join('\n');
  const metadata={'@context':'https://schema.org','@type':'BlogPosting',headline:post.title,datePublished:post.date,dateModified:post.date,
    author:{'@type':'Person',name:'山田勝隆'},publisher:{'@type':'Organization',name:'山田勝隆税理士事務所',url:baseUrl+'/'} ,mainEntityOfPage:uri,description:fit(post.summary,155)};
  const seoJson=JSON.stringify(metadata).replace(/</g,'\\u003c');
  const article=`<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(post.title)}｜山田勝隆税理士事務所</title>
<meta name="description" content="${escapeHtml(fit(post.summary,155))}">
<link rel="canonical" href="${uri}"><meta name="robots" content="index,follow,max-image-preview:large">
<meta property="og:type" content="article"><meta property="og:locale" content="ja_JP"><meta property="og:site_name" content="山田勝隆税理士事務所">
<meta property="og:title" content="${escapeHtml(post.title)}｜山田勝隆税理士事務所"><meta property="og:description" content="${escapeHtml(fit(post.summary,155))}"><meta property="og:url" content="${uri}">
<script type="application/ld+json">${seoJson}</script><style>${articleCss}</style></head>
<body><a class="skip-to-content" href="#article-main">本文へスキップ</a><header class="article-header"><div class="article-container"><a class="article-brand" href="/">山田勝隆税理士事務所</a><a href="/blog">ブログ一覧へ →</a></div></header>
<main id="article-main" class="article-container article-layout"><a class="article-back" href="/blog">← ブログ一覧に戻る</a>
<article class="article-paper"><div class="article-meta"><time datetime="${escapeHtml(post.date)}">${escapeHtml(post.date)}</time>${post.category?`<span class="article-tag">${escapeHtml(post.category)}</span>`:''}</div>
<h1>${escapeHtml(post.title)}</h1><div class="article-body">${paragraphs}</div>
<div class="article-cta"><h2>税務・会計のご相談</h2><p>法人決算や記帳代行、税務顧問については、お問い合わせフォームからご相談いただけます。</p><a href="/#contact">お問い合わせはこちら →</a></div>
</article></main><footer class="article-footer">© 2026 山田勝隆税理士事務所 · <a href="/#privacy">プライバシーポリシー</a></footer>
</body></html>`;
  // GA4タグを記事ページにも挿入。既存の環境変数を利用する。
  const id=(process.env.GA_MEASUREMENT_ID||'').trim();
  const ga = id && /^G-[A-Z0-9]+$/.test(id) ? `\n<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${id}');</script>` : '';
  const target=path.join(out,post.url.slice(1),'index.html');
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target, article.replace('</head>',ga+'\n</head>'),'utf8');
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  [`${baseUrl}/`,`${baseUrl}/blog`,...posts.map(p=>baseUrl+p.url)].map(uri => `  <url><loc>${escapeHtml(uri)}</loc></url>`).join('\n') + '\n</urlset>\n';
fs.writeFileSync(path.join(out,'sitemap.xml'),sitemap,'utf8');
fs.writeFileSync(indexPath,home,'utf8');
fs.writeFileSync(blogPath,blog,'utf8');
console.log(`Enhanced site built: home, blog, ${posts.length} standalone articles, refreshed sitemap.`);
