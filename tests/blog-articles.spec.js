// Blog — die zwei Bestände als eine Liste.
//
// Geprüft wird die Abnahme der Karte A-5: 22 Artikel im Grid, Sortierung nach
// Datum, vollständige Filter (inklusive der neuen Kategorie Astrologie), Suche,
// Deep-Link #blog/12 und die Fokus-Rückkehr beim Schließen des Dialogs.

const { test, expect } = require('playwright/test');

const { E2E_BASE_URL: BASE } = require('./helpers/e2e-target.cjs');
const url = (hash = '') => `${BASE}/${hash}`;

const ARTICLE_12 = {
  title: 'Minor Arcana: Die vier Suits verstehen',
  excerpt: 'Die 56 Karten der Minor Arcana verteilen sich auf vier Farben',
  bodyPart: 'Jede Farbe umfasst vierzehn Karten',
};

const EXPECTED_CATEGORIES = ['tarot', 'crystals', 'runes', 'moon', 'astrologie', 'rituals', 'history'];

test.describe('Blog: 22 Artikel aus Markdown und kuratiertem Bestand', () => {
  test('zeigt 22 Karten, meldet 22 und sortiert nach Datum absteigend', async ({ page }) => {
    await page.goto(url('#blog'));
    await expect(page.locator('#articleGrid > *')).toHaveCount(22);
    await expect(page.locator('#articleListStatus')).toHaveText('Alle 22 Artikel werden angezeigt.');
    await expect(page.locator('#loadMoreArticles')).toBeHidden();
    await expect(page.locator('#loadMoreArticles')).toBeDisabled();

    const ids = await page
      .locator('#articleGrid .article-card')
      .evaluateAll((nodes) => nodes.map((node) => Number(node.dataset.id)));
    // Die zwölf Markdown-Artikel (11–22) sind die jüngsten und stehen vorn,
    // innerhalb ihres Bestands absteigend nach Datum.
    expect(ids.slice(0, 12)).toEqual([22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11]);
    expect(ids).toHaveLength(22);
    expect(new Set(ids).size).toBe(22);
  });

  test('#blog/12 öffnet den richtigen Artikel; Escape schließt und gibt den Fokus zurück', async ({ page }) => {
    await page.goto(url('#blog'));
    const card = page.locator('#articleGrid .article-card[data-id="12"]');
    await card.scrollIntoViewIfNeeded();
    await expect(card).toHaveAttribute('aria-label', `Artikel: ${ARTICLE_12.title}`);
    await card.click();

    const modal = page.locator('#articleModal');
    await expect(modal).toHaveClass(/open/);
    await expect(modal).toBeVisible();
    await expect(page.locator('#articleModalTitle')).toHaveText(ARTICLE_12.title);
    const body = page.locator('#articleModalBody');
    await expect(body).toContainText(ARTICLE_12.bodyPart);
    await expect(body).toContainText('Kelche, Schwerter, Stäbe und Münzen');
    // Der Renderer setzt Markdown als Textknoten: keine unaufgelösten Sternchen.
    await expect(body).not.toContainText('**');
    await expect(page).toHaveURL(/#blog\/12$/);
    await expect(page).toHaveTitle(new RegExp(ARTICLE_12.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

    await page.keyboard.press('Escape');
    await expect(modal).not.toHaveClass(/open/);
    await expect(page).toHaveURL(/#blog$/);
    await expect(card).toBeFocused();
  });

  test('Deep-Link #blog/12 öffnet den Dialog direkt und setzt die Metadaten', async ({ page }) => {
    await page.goto(url('#blog/12'));
    await expect(page.locator('#articleModal')).toHaveClass(/open/);
    await expect(page.locator('#articleModalTitle')).toHaveText(ARTICLE_12.title);
    await expect(page.locator('#articleModalBody')).toContainText(ARTICLE_12.excerpt);
    await expect(page).toHaveTitle(new RegExp('Minor Arcana'));
    // Die Seitenbeschreibung kommt aus dem generierten Excerpt des Artikels.
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Minor Arcana/);
  });

  test('jede Filterkategorie liefert mindestens einen Treffer und die exakte Anzahl', async ({ page }) => {
    await page.goto(url('#blog'));
    await expect(page.locator('#articleGrid > *')).toHaveCount(22);
    const expected = await page.evaluate(async () => {
      const [curated, markdown] = await Promise.all([
        import('./js/data/articles.js'),
        import('./js/data/articles-markdown.js'),
      ]);
      const all = [...curated.articles, ...markdown.articlesMarkdown];
      const counts = {};
      for (const article of all) counts[article.category] = (counts[article.category] || 0) + 1;
      return { counts, total: all.length };
    });
    expect(expected.total).toBe(22);
    for (const category of EXPECTED_CATEGORIES) {
      expect(expected.counts[category], `Kategorie ${category} hat keinen Artikel`).toBeGreaterThan(0);
      await page.selectOption('#categoryFilter', category);
      await expect(page.locator('#articleGrid > *')).toHaveCount(expected.counts[category]);
      await expect(page.locator('#articleListStatus')).toHaveText(
        `${expected.counts[category]} von 22 Artikeln werden angezeigt.`
      );
    }
    await page.selectOption('#categoryFilter', 'all');
    await expect(page.locator('#articleGrid > *')).toHaveCount(22);
  });

  test('Suche findet Artikel aus beiden Beständen', async ({ page }) => {
    await page.goto(url('#blog'));
    const search = page.locator('#articleSearch');
    await search.fill('Runen');
    await expect(page.locator('#articleGrid > *')).not.toHaveCount(22);
    const hits = await page
      .locator('#articleGrid .article-card')
      .evaluateAll((nodes) => nodes.map((node) => node.dataset.id));
    // Runenlesen (15) und Tarot vs. Runen (16) stammen aus den Markdown-Quellen.
    expect(hits).toContain('15');
    expect(hits).toContain('16');
    await expect(page.locator('#articleListStatus')).toHaveText(`${hits.length} von 22 Artikeln werden angezeigt.`);
    await search.fill('');
    await expect(page.locator('#articleGrid > *')).toHaveCount(22);
  });
});
