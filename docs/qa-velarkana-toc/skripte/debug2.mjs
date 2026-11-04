/** AX-Details: aria-current-Exposition und Name des Summary. */
import { DIST, launchChromium, startServer } from './lib.mjs';

const PILOT = '/frequenzen/quellen.html';
const server = await startServer(DIST);
const browser = await launchChromium();

const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(`${server.base}${PILOT}`, { waitUntil: 'load' });
await page.waitForTimeout(1200);
const client = await ctx.newCDPSession(page);
const { nodes } = await client.send('Accessibility.getFullAXTree');
const byId = new Map(nodes.map((n) => [n.nodeId, n]));
const nav = nodes.find((n) => n.role?.value === 'navigation' && n.name?.value === 'Inhaltsverzeichnis');
const descendants = [];
const walk = (node) => {
  for (const childId of node.childIds || []) {
    const child = byId.get(childId);
    if (!child) continue;
    descendants.push(child);
    walk(child);
  }
};
walk(nav);
const roles = descendants.reduce((acc, n) => ((acc[n.role?.value] = (acc[n.role?.value] || 0) + 1), acc), {});
console.log('TOC nav: role=%s name=%s children=%d', nav.role.value, nav.name.value, (nav.childIds || []).length);
console.log('descendant roles:', JSON.stringify(roles));
const links = descendants.filter((n) => n.role?.value === 'link');
console.log('first link:', JSON.stringify({ name: links[0]?.name?.value, props: links[0]?.properties }));
const currentLink = links.find((n) => (n.properties || []).some((p) => String(p.name).includes('current')));
console.log('link with current-ish prop:', JSON.stringify(currentLink ? { name: currentLink.name?.value, properties: currentLink.properties } : null));
console.log('all property names on links:', JSON.stringify([...new Set(links.flatMap((l) => (l.properties || []).map((p) => p.name)))]));
const listNode = descendants.find((n) => n.role?.value === 'list');
console.log('list node:', JSON.stringify({ name: listNode?.name?.value, props: listNode?.properties }));
await client.detach();
await ctx.close();

const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
const mp = await mctx.newPage();
await mp.goto(`${server.base}${PILOT}`, { waitUntil: 'load' });
await mp.waitForTimeout(900);
const mclient = await mctx.newCDPSession(mp);
const mTree = await mclient.send('Accessibility.getFullAXTree');
const mNodes = mTree.nodes;
const summary = mNodes.filter((n) => n.role?.value === 'DisclosureTriangle');
console.log('mobile disclosure nodes:', JSON.stringify(summary.map((n) => ({ role: n.role?.value, name: n.name?.value, props: (n.properties || []).map((p) => [p.name, p.value?.value]) }))));
const mNav = mNodes.filter((n) => n.role?.value === 'navigation');
console.log('mobile navs:', JSON.stringify(mNav.map((n) => n.name?.value)));
const mComp = mNodes.filter((n) => n.role?.value === 'complementary');
console.log('mobile complementary:', JSON.stringify(mComp.map((n) => n.name?.value)));
// Zustand nach Öffnen
await mp.evaluate(() => document.querySelector('.page-toc__summary').click());
await mp.waitForTimeout(300);
const mTree2 = (await mclient.send('Accessibility.getFullAXTree')).nodes;
console.log('mobile disclosure after open:', JSON.stringify(mTree2.filter((n) => n.role?.value === 'DisclosureTriangle').map((n) => ({ name: n.name?.value, expanded: (n.properties || []).find((p) => p.name === 'expanded')?.value?.value }))));
console.log('mobile nav after open:', JSON.stringify(mTree2.filter((n) => n.role?.value === 'navigation').map((n) => n.name?.value)));
await browser.close();
await server.close();
