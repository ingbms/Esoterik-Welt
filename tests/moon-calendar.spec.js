// Browser-Regressionstest für den Mondkalender (Review-Befunde B1–B3).
//
// B1: Der Minutentakt zog die Ansicht in den aktuellen Monat zurück, sobald
//     geblättert wurde (Vergleich Ansichtsmonat gegen aktuellen Monat).
// B2: Nach dem Blättern trug keine Zelle tabindex="0", das Raster war per Tab
//     nicht erreichbar und das Detail zeigte einen Tag außerhalb des Monats.
// B3: „heute / morgen / in N Tagen" wurde aus verstrichenen Stunden gerundet
//     und widersprach damit dem daneben gedruckten Datum.
//
// Die Uhr wird mit Playwright `clock` installiert und vorgespult, damit der
// 60-Sekunden-Takt deterministisch prüfbar ist. Kein Testwert ist geschätzt:
// alle Datumsangaben stammen aus der Berechnung (data/moon-astro.mjs), die
// gegen USNO/JPL geprüft ist.
import { test, expect } from 'playwright/test';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3100/Esoterik-Welt';

async function openMoon(page, iso) {
  await page.clock.install({ time: new Date(iso) });
  await page.goto(`${BASE}/#moon`);
  await page.waitForFunction(() => {
    const title = document.getElementById('moonPhaseName');
    const label = document.getElementById('moonCalendarLabel');
    return (
      title &&
      title.textContent.trim() &&
      !title.textContent.includes('Lade') &&
      label &&
      label.textContent.trim() !== '—'
    );
  });
}

/** Zustand des Kalenders: Monatslabel, Auswahl, tabindex, Detailtitel. */
function calendarState(page) {
  return page.evaluate(() => {
    const cells = [...document.querySelectorAll('#moonCalendar button[data-day]')];
    const label = document.getElementById('moonCalendarLabel').textContent.trim();
    const pressed = cells.filter((cell) => cell.getAttribute('aria-pressed') === 'true');
    return {
      label,
      days: cells.length,
      pressed: pressed.map((cell) => cell.dataset.day),
      tabZero: cells.filter((cell) => cell.tabIndex === 0).map((cell) => cell.dataset.day),
      selectedClass: cells.filter((cell) => cell.classList.contains('is-selected')).map((cell) => cell.dataset.day),
      todayCells: cells.filter((cell) => cell.classList.contains('is-today')).map((cell) => cell.dataset.day),
      detailTitle: document.querySelector('#moonDayDetail h3')?.textContent.trim() || '',
    };
  });
}

async function expectSingleSelection(page, expectedKey) {
  const state = await calendarState(page);
  expect(state.pressed).toEqual([expectedKey]);
  expect(state.tabZero).toEqual([expectedKey]);
  expect(state.selectedClass).toEqual([expectedKey]);
  return state;
}

test.describe('Mondkalender — Monatswechsel, Takt und Relativtage', () => {
  test('B1/B2: geblätterter Monat und Auswahl überleben den Minutentakt', async ({ page }) => {
    // 02.11.2026 23:59 MEZ — der erste Takt fällt auf den 3. November.
    await openMoon(page, '2026-11-02T22:59:00Z');
    await expect(page.locator('#moonCalendarLabel')).toHaveText('November 2026');
    await expectSingleSelection(page, '2026-11-02');

    for (let i = 0; i < 3; i++) await page.click('#moonNextMonth');
    await expect(page.locator('#moonCalendarLabel')).toHaveText('Februar 2027');
    let state = await expectSingleSelection(page, '2027-02-01');
    expect(state.detailTitle).toBe('Montag, 01. Februar 2027');

    // Das Raster ist per Tab erreichbar: von „Nächster Monat" auf die Auswahl.
    await page.focus('#moonNextMonth');
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => ({
      day: document.activeElement?.dataset?.day || null,
      tabIndex: document.activeElement?.tabIndex ?? null,
    }));
    expect(focused).toEqual({ day: '2027-02-01', tabIndex: 0 });

    // Ein Tagwechsel im Takt (03.11. 00:00 MEZ) darf den geblätterten Monat
    // nicht zurücksetzen und die Auswahl nicht verlieren.
    await page.clock.runFor(70_000); // 00:00:10 MEZ — erster Takt über Mitternacht
    await expect(page.locator('#moonCalendarLabel')).toHaveText('Februar 2027');
    await expectSingleSelection(page, '2027-02-01');

    await page.clock.runFor(120_000); // zwei weitere Takte, 03.11. 00:02 MEZ
    await expect(page.locator('#moonCalendarLabel')).toHaveText('Februar 2027');
    state = await expectSingleSelection(page, '2027-02-01');
    expect(state.detailTitle).toBe('Montag, 01. Februar 2027');

    // Pfeiltaste wechselt die Auswahl; auch die überlebt die folgenden Takte.
    await page.keyboard.press('ArrowRight');
    await expectSingleSelection(page, '2027-02-02');
    await page.clock.runFor(120_000);
    state = await expectSingleSelection(page, '2027-02-02');
    expect(state.detailTitle).toBe('Dienstag, 02. Februar 2027');

    // „Heute" führt zurück in den aktuellen Monat und wählt den heutigen Tag.
    await page.click('#moonTodayBtn');
    await expect(page.locator('#moonCalendarLabel')).toHaveText('November 2026');
    state = await expectSingleSelection(page, '2026-11-03');
    expect(state.todayCells).toEqual(['2026-11-03']);
    expect(state.detailTitle).toBe('Dienstag, 03. November 2026');
  });

  test('B1: ohne Blättern zieht der Takt über Mitternacht in den neuen Monat', async ({ page }) => {
    // 30.11.2026 23:59 MEZ → 01.12.2026 00:01 MEZ
    await openMoon(page, '2026-11-30T22:59:00Z');
    await expect(page.locator('#moonCalendarLabel')).toHaveText('November 2026');
    await expectSingleSelection(page, '2026-11-30');

    await page.clock.runFor(120_000);
    await expect(page.locator('#moonCalendarLabel')).toHaveText('Dezember 2026');
    const state = await expectSingleSelection(page, '2026-12-01');
    expect(state.todayCells).toEqual(['2026-12-01']);
    expect(state.detailTitle).toBe('Dienstag, 01. Dezember 2026');
  });

  test('B3: Relativtage folgen dem Kalendertag, nicht den Stunden', async ({ page }) => {
    // 02.11.2026 02:45 MEZ: Letztes Viertel war am 01.11. 21:28 MEZ → "gestern".
    await openMoon(page, '2026-11-02T01:45:00Z');
    const nextStamp = page.locator('#moonNextPhase');
    await expect(nextStamp).toContainText('Letztes Viertel am 01. November 2026');
    await expect(nextStamp).toContainText('gestern');
    await expect(nextStamp).not.toContainText('· heute');
    // Auch die Zeitachse nutzt dieselbe Kalendertag-Rechnung.
    const lastQuarterItem = page
      .locator('#moonTimeline .moon-timeline-item')
      .filter({ hasText: 'Letztes Viertel' })
      .first();
    await expect(lastQuarterItem.locator('.moon-timeline-rel')).toHaveText('gestern');

    // Gegenprobe mit vorgespulter Uhr auf den 16.11. 23:30 MEZ:
    // Erstes Viertel am 17.11. 12:47 MEZ ist "morgen".
    await page.clock.setFixedTime(new Date('2026-11-16T22:30:00Z'));
    await page.clock.runFor(60_000);
    await expect(nextStamp).toContainText('Erstes Viertel am 17. November 2026');
    await expect(nextStamp).toContainText('morgen');

    // 17.11. 00:30 MEZ: dasselbe Ereignis ist "heute", nicht "morgen".
    await page.clock.setFixedTime(new Date('2026-11-16T23:30:00Z'));
    await page.clock.runFor(60_000);
    await expect(nextStamp).toContainText('Erstes Viertel am 17. November 2026');
    await expect(nextStamp).toContainText('heute');
    await expect(nextStamp).not.toContainText('morgen');
  });
});
