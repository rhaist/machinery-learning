// research/canon.yaml lists works a researcher would expect the guide to know.
// Every `cited` entry must be linked somewhere in the guide; every `excluded` one needs a reason.
import fs from 'node:fs';
import path from 'node:path';
import { load } from 'js-yaml';

const canon = load(fs.readFileSync('research/canon.yaml', 'utf8')).canon ?? [];
const files = [
  ...['src/content/chapters', 'src/content/notes'].flatMap(d => fs.readdirSync(d).map(f => path.join(d, f))),
  ...['claims.yaml', 'debates.yaml', 'reading.yaml', 'figures.yaml'].map(f => path.join('src/data', f)),
];
const blob = files.map(f => fs.readFileSync(f, 'utf8')).join('\n');
const problems = [];
for (const c of canon) {
  if (!['cited', 'excluded'].includes(c.status)) problems.push(`canon: bad status for ${c.id}`);
  if (c.status === 'excluded' && !c.reason) problems.push(`canon: excluded without a reason: ${c.title}`);
  if (c.status === 'cited' && !new RegExp(`arxiv\\.org/(abs|html|pdf)/${c.id.replace('.', '\\.')}`).test(blob)) problems.push(`canon: marked cited but not linked anywhere: ${c.id} ${c.title}`);
}
if (problems.length) { console.error(problems.map(p => '✗ ' + p).join('\n')); process.exit(1); }
console.log(`Canon check: OK (${canon.filter(c => c.status === 'cited').length} cited, ${canon.filter(c => c.status === 'excluded').length} excluded with reasons)`);
