const fs = require('node:fs');
const file = '.github/workflows/ci.yml';
let yml = fs.readFileSync(file, 'utf8');
const crlf = yml.includes('\r\n');
if (crlf) yml = yml.replace(/\r\n/g, '\n');
const oldBlock = `      - name: Type check (astro check, TypeScript strict)
        run: npm run check
      - name: Static production build (Astro -> dist/)
        run: npm run build
`;
const newBlock = `      - name: Type check (astro check, TypeScript strict)
        run: npm run check
      - name: Format check (Prettier)
        run: npm run format:check
      - name: Static production build (Astro -> dist/)
        run: npm run build
      - name: Migration gate (routes, counts, SEO parity, internal links)
        run: npm run verify:migration
      - name: Build audit (single H1, single WebPage node, .nojekyll)
        run: node scripts/migration/audit-build.cjs
`;
if (!yml.includes(oldBlock)) {
  console.error('CI-Block nicht gefunden');
  process.exit(1);
}
yml = yml.replace(oldBlock, newBlock);
if (crlf) yml = yml.replace(/\n/g, '\r\n');
fs.writeFileSync(file, yml, 'utf8');
console.log('CI um verify:migration und audit erweitert');
