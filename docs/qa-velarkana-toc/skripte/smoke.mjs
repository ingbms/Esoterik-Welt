/** Startfähigkeit prüfen: Chromium, Server, Pilotseite. */
import { DIST, launchChromium, startServer } from './lib.mjs';

const server = await startServer(DIST);
const browser = await launchChromium();
console.log('browser', browser.version());
const page = await browser.newPage();
const resp = await page.goto(`${server.base}/frequenzen/quellen.html`, { waitUntil: 'load' });
console.log('status', resp.status(), 'title', await page.title());
console.log('toc links', await page.locator('.page-toc__link').count());
await browser.close();
await server.close();
