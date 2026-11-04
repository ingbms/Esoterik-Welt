const fs = require('node:fs');
const file = 'src/styles/content.css';
let css = fs.readFileSync(file, 'utf8');
const start = css.search(/\/\*\r?\n \* Navigation ohne Burger/);
const endMarker = '.site-main > .container';
const end = css.indexOf(endMarker);
if (start < 0 || end < 0 || end < start) {
  console.error('Marker nicht gefunden');
  process.exit(1);
}
const replacement =
  '/*\n * Header/Navigation: Das Bestands-CSS regelt Burger, gestapeltes Menue und die\n' +
  ' * Sichtbarkeit unter 900 px vollstaendig (css/design-system.css). Die Komponente\n' +
  ' * SiteHeader liefert Toggle, Escape und Fokusverhalten; eigene Mobile-Overrides\n' +
  ' * gibt es deshalb bewusst nicht mehr (Review B-5).\n */\n\n';
css = css.slice(0, start) + replacement + css.slice(end);
fs.writeFileSync(file, css, 'utf8');
console.log('Mobile-Override entfernt');
