import fs from 'node:fs';
import path from 'node:path';

const cwd = process.cwd();
const source = fs.readFileSync(path.join(cwd, 'index.html'), 'utf8');
const dir = path.join(cwd, 'posts');
const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(n => n.endsWith('.md')) : [];

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
  const raw = fs.readFileSync(path.join(dir, filename), 'utf8').replace(/^\uFEFF/, '');
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
if (!dataTag.test(source)) throw new Error('index.html の blog-data セクションが見つかりません');
let output = source.replace(dataTag, (_, start, end) => start + json + end);
// 従来のHTMLエクスポート式編集画面は公開サイトには表示しない。
output = output.replace('</style>', '#blog-admin{display:none!important}\n</style>');
fs.mkdirSync(path.join(cwd, 'dist'), { recursive: true });
fs.writeFileSync(path.join(cwd, 'dist', 'index.html'), output, 'utf8');
console.log(`Built dist/index.html with ${posts.length} article(s).`);
