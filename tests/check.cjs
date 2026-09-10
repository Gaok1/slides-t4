// Run: node tests/check.cjs. Uses the Codex bundled Playwright, or NODE_PATH.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
let playwright;
try { playwright = require('playwright'); }
catch { playwright = require(path.join(process.env.USERPROFILE, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')); }

(async () => {
  const root = path.resolve(__dirname, '..');
  const requestedFile = process.argv[2] || process.env.DECK_FILE || 'index.html';
  const output = path.join(root, 'tmp/qa');
  fs.mkdirSync(output, { recursive: true });
  let browser;
  try { browser = await playwright.chromium.launch({ headless: true, channel: 'msedge' }); }
  catch { browser = await playwright.chromium.launch({ headless: true }); }
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(pathToFileURL(path.join(root, requestedFile)).href);
  await page.waitForFunction(() => document.querySelector('#overview-grid').children.length === 32);
  assert.equal(await page.locator('.slide').count(), 32);
  assert.equal(await page.locator('.slide.active').count(), 1);
  assert(await page.locator('#prev').isDisabled());
  assert(await page.evaluate(() => [...document.images].every(image => image.complete && image.naturalWidth > 0)));
  const layout = [];
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1366, height: 768 }]) {
    await page.setViewportSize(viewport);
    for (let i = 1; i <= 32; i++) {
      await page.evaluate(i => { location.hash = String(i); }, i);
      await page.waitForFunction(i => document.querySelector('#slide-current').textContent === String(i).padStart(2, '0'), i);
      const sizes = await page.locator('.slide.active').evaluate(slide => ({ width: slide.clientWidth, height: slide.clientHeight, scrollWidth: slide.scrollWidth, scrollHeight: slide.scrollHeight }));
      if (sizes.scrollHeight > sizes.height + 2 || sizes.scrollWidth > sizes.width + 2) layout.push({ viewport, slide: i, ...sizes });
      if (viewport.width === 1440) await page.screenshot({ path: path.join(output, `slide-${String(i).padStart(2, '0')}.png`) });
    }
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  const go = async n => { await page.evaluate(n => { location.hash = String(n); }, n); await page.waitForFunction(n => document.querySelector('#slide-current').textContent === String(n).padStart(2, '0'), n); };
  await go(3); await page.locator('#dh-reveal').click(); assert.match(await page.locator('#dh-result').innerText(), /compartilhado: 2/);
  await go(5); for (let i = 0; i < 3; i++) await page.locator('#shor-step').click(); assert.match(await page.locator('#shor-answer').innerText(), /15 = 3 × 5/); assert(await page.locator('#shor-step').isDisabled()); await page.locator('#shor-reset').click(); assert.equal(await page.locator('#shor-counter').innerText(), '0 / 3');
  await go(9); assert.match(await page.locator('#mosca-result').innerText(), /excede.*3 anos/);
  await page.locator('#quantum-years').fill('25'); assert.match(await page.locator('#mosca-result').innerText(), /Margem hipotética de 10 anos/);
  await page.locator('#quantum-years').fill('15'); assert.match(await page.locator('#mosca-result').innerText(), /Sem margem/);
  await go(12); await page.locator('#xmss-sign').click(); await page.locator('#xmss-backup').click(); await page.locator('#xmss-sign').click(); assert.match(await page.locator('#xmss-result').innerText(), /reutilizado/); await page.locator('#xmss-reset').click(); for (let i = 0; i < 8; i++) await page.locator('#xmss-sign').click(); assert(await page.locator('#xmss-sign').isDisabled());
  await go(13); await page.locator('[data-size-mode=total]').click(); assert.match(await page.locator('#size-chart').innerText(), /3\.732 B/); await page.locator('[data-size-mode=signature]').click(); assert.match(await page.locator('#size-chart').innerText(), /2\.420 B/);
  await go(22); await page.locator('[data-exposure=public]').click(); assert.match(await page.locator('#exposure-window').innerText(), /prolongada/);
  await go(23); assert.equal(await page.locator('#volume-pq').innerText(), '2,42 GB'); await page.locator('#signature-count').fill('10'); assert.equal(await page.locator('#volume-pq').innerText(), '24,2 GB'); await page.locator('#scheme-select').selectOption('3'); assert.equal(await page.locator('#volume-pq').innerText(), '78,56 GB');
  await go(25); await page.locator('[data-decision=protect]').click(); assert.match(await page.locator('#decision-result').innerText(), /legítimos/);
  await go(30); for (const answer of [1, 0, 2]) { await page.locator('.quiz-option').nth(answer).click(); await page.locator('#quiz-next').click(); } assert.match(await page.locator('#quiz-feedback').innerText(), /3 de 3/); await page.locator('#quiz-restart').click(); assert.match(await page.locator('#quiz-number').innerText(), /01/);
  await page.locator('#overview-open').click(); assert(await page.locator('#overview').evaluate(e => e.open)); await page.locator('#overview-grid button').nth(7).click(); assert.equal(await page.locator('#slide-current').innerText(), '08');
  await page.locator('#notes-toggle').click(); assert(await page.locator('#notes-panel').isVisible()); await page.keyboard.press('Escape'); assert(await page.locator('#notes-panel').isHidden());
  await page.locator('#help-open').click(); await page.keyboard.press('ArrowRight'); assert.equal(await page.locator('#slide-current').innerText(), '08'); await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 1366, height: 768 });
  const interactionOverflow = [];
  for (const n of [3, 5, 9, 12, 13, 22, 23, 25, 30]) {
    await go(n);
    const fits = await page.locator('.slide.active').evaluate(s => s.scrollHeight <= s.clientHeight + 2 && s.scrollWidth <= s.clientWidth + 2);
    if (!fits) interactionOverflow.push(n);
  }
  assert.deepEqual(interactionOverflow, [], 'Post-interaction slide overflow');
  await go(1); await page.locator('.cover [data-goto]').click(); await page.keyboard.press('Space'); assert.equal(await page.locator('#slide-current').innerText(), '03');
  await go(8);
  await page.locator('body').click({ position: { x: 10, y: 10 } }); await page.keyboard.press('ArrowRight'); assert.equal(await page.locator('#slide-current').innerText(), '09'); await page.keyboard.press('Home'); assert.equal(await page.locator('#slide-current').innerText(), '01'); await page.keyboard.press('End'); assert.equal(await page.locator('#slide-current').innerText(), '32'); assert(await page.locator('#next').isDisabled());
  await page.evaluate(() => { location.hash = 'garbage'; }); await page.waitForFunction(() => document.querySelector('#slide-current').textContent === '01');
  await page.setViewportSize({ width: 390, height: 844 });
  for (let i = 1; i <= 32; i++) {
    await go(i);
    const overflow = await page.locator('.slide.active').evaluate(s => s.scrollWidth > s.clientWidth + 1);
    assert.equal(overflow, false, `Mobile horizontal overflow on slide ${i}`);
    if ([1, 5, 13, 17].includes(i)) await page.screenshot({ path: path.join(output, `mobile-${i}.png`) });
  }
  fs.writeFileSync(path.join(output, 'layout.json'), JSON.stringify(layout, null, 2));
  console.log(JSON.stringify({ slides: 32, errors, desktopOverflow: layout, interactionChecks: 'passed', mobileChecks: 'passed' }, null, 2));
  assert.deepEqual(errors, []);
  assert.deepEqual(layout, [], 'Desktop slides must fit without scroll');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ media: 'print' });
  assert.equal(await page.locator('.slide:visible').count(), 32);
  await page.emulateMedia({ media: 'screen' });
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
