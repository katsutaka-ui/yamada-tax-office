import fs from 'node:fs';
import path from 'node:path';

// 既存の Pages CMS の posts/*.md をブログページへ反映する。
// Netlify の環境変数に GA_MEASUREMENT_ID (G-...) と
// GOOGLE_SITE_VERIFICATION を設定すると、公開時に計測・所有権確認タグを埋め込む。
const cwd = process.cwd();
const siteUrl = 'https://yamada-tax-office-2026.netlify.app';
const indexHtml = fs.readFileSync(path.join(cwd, 'index.html'), 'utf8');
const blogHtml = fs.readFileSync(path.join(cwd, 'blog.html'), 'utf8');
const postsDir = path.join(cwd, 'posts');
const files = fs.existsSync(postsDir)
  ? fs.readdirSync(postsDir).filter(name => name.endsWith('.md'))
  : [];

function unquote(value) {
  const v = value.trim();
  if (v.startsWith('"') && v.endsWith('"')) {
    try { return JSON.parse(v); } catch { return v.slice(1, -1); }
  }
  if (v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1).replace(/''/g, "'");
  return v;
}

function textFromMarkdown(md) {
  return md
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '・')
    .replace(/^\s*\d+\.\s+/gm, '・')
    .replace(/^>\s?/gm, '')
    .replace(/(\*\*|__|~~|`)/g, '')
    .trim();
}

const posts = files.map(filename => {
  const raw = fs.readFileSync(path.join(postsDir, filename), 'utf8').replace(/^\uFEFF/, '');
  const match = raw.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n([\s\S]*)$/);
  if (!match) { console.warn(`Skipped ${filename}: front matter missing`); return null; }
  const meta = {};
  for (const line of match[1].split(/\r?\n/)) {
    const found = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (found) meta[found[1]] = unquote(found[2]);
  }
  const content = textFromMarkdown(match[2]);
  const title = meta.title || filename.replace(/\.md$/, '');
  const date = String(meta.date || '').slice(0, 10);
  const summary = content.replace(/\s+/g, ' ').slice(0, 140) + (content.length > 140 ? '…' : '');
  return { id: filename, title, date, category: meta.category || '', summary, content };
}).filter(Boolean).sort((a, b) => b.date.localeCompare(a.date));

const json = JSON.stringify(posts).replace(/</g, '\\u003c');
const dataTag = /(<script id="blog-data" type="application\/json">)[\s\S]*?(<\/script>)/;
if (!dataTag.test(blogHtml)) throw new Error('blog.html の blog-data セクションが見つかりません');
let builtBlogHtml = blogHtml.replace(dataTag, (_, start, end) => start + json + end);
// 公開ページから旧編集画面を隠す。Pages CMS で管理する。
builtBlogHtml = builtBlogHtml.replace('</style>', '#blog-admin{display:none!important}\n</style>');

function escapeAttr(value) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function addGoogleTags(html) {
  const id = (process.env.GA_MEASUREMENT_ID || '').trim();
  const verification = (process.env.GOOGLE_SITE_VERIFICATION || '').trim();
  let snippets = '';
  if (verification) {
    if (!/^[A-Za-z0-9_-]{10,300}$/.test(verification)) {
      throw new Error('GOOGLE_SITE_VERIFICATION の値を確認してください');
    }
    snippets += `\n<meta name="google-site-verification" content="${escapeAttr(verification)}">`;
  }
  if (id) {
    if (!/^G-[A-Z0-9]+$/.test(id)) throw new Error('GA_MEASUREMENT_ID は G- から始まる測定 ID にしてください');
    snippets += `\n<!-- Google tag (GA4) -->\n<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>\n<script>\n  window.dataLayer = window.dataLayer || [];\n  function gtag(){dataLayer.push(arguments);}\n  gtag('js', new Date());\n  gtag('config', '${id}');\n</script>`;
  }
  if (!snippets) return html;
  return html.replace('</head>', `${snippets}\n</head>`);
}

let builtIndexHtml = indexHtml;
if (process.env.GA_MEASUREMENT_ID) {
  // 計測を有効にした場合にのみ、プライバシーポリシーにも記載する。
  const anchor = '<h3>4．第三者への提供</h3>';
  if (!builtIndexHtml.includes(anchor)) throw new Error('プライバシーポリシーの位置が見つかりません');
  const notice = '<p>当サイトはアクセス状況を把握するために Google アナリティクスを使用しています。Google が Cookie 等を利用してアクセス情報を収集することがあります。詳細は <a href="https://policies.google.com/privacy?hl=ja" target="_blank" rel="noopener noreferrer">Google のプライバシーポリシー</a>をご確認ください。</p>\n        ';
  builtIndexHtml = builtIndexHtml.replace(anchor, notice + anchor);
}

builtIndexHtml = addGoogleTags(builtIndexHtml);
builtBlogHtml = addGoogleTags(builtBlogHtml);

const outputDir = path.join(cwd, 'dist');
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, 'index.html'), builtIndexHtml, 'utf8');
fs.writeFileSync(path.join(outputDir, 'blog.html'), builtBlogHtml, 'utf8');
fs.writeFileSync(path.join(outputDir, 'robots.txt'),
  `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`, 'utf8');
fs.writeFileSync(path.join(outputDir, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${siteUrl}/</loc></url>\n  <url><loc>${siteUrl}/blog</loc></url>\n</urlset>\n`, 'utf8');
console.log(`Built SEO-ready dist/index.html, dist/blog.html, sitemap.xml, robots.txt with ${posts.length} article(s).`);

await import('./site-enhancements.mjs');
