const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
let pw;
try { pw = require('playwright'); } catch { pw = require(path.join(process.env.USERPROFILE, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')); }
const digest = text => createHash('sha256').update(text, 'utf8').digest('hex');
(async () => {
  const browser = await pw.chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 }, reducedMotion: 'no-preference' });
  const errors = [], networkRequests = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => { if (/^https?:/.test(r.url())) networkRequests.push(r.url()); });
  await page.goto(pathToFileURL(path.resolve(__dirname, '../apresentacao.html')).href);
  const go = async id => {
    await page.evaluate(id => { const slides = [...document.querySelectorAll('.slide')]; location.hash = String(slides.indexOf(document.getElementById(id)) + 1); }, id);
    await page.waitForFunction(id => document.getElementById(id).classList.contains('active'), id);
  };
  const fits = async () => { const result = await page.locator('.slide.active').evaluate(s => ({ id: s.id, scroll: s.scrollHeight, height: s.clientHeight })); assert(result.scroll <= result.height + 2, JSON.stringify(result)); };
  await go('flow-slide');
  for (let i = 0; i < 4; i++) await page.locator('#flow-next').click();
  assert.equal(await page.locator('#flow-block-state').innerText(), 'confirmado'); assert(await page.locator('#flow-next').isDisabled()); await fits();
  const animated = page.locator('#flow-slide .ambient-block').first();
  assert.equal(await animated.evaluate(e => getComputedStyle(e).animationPlayState), 'running');
  await page.locator('#motion-toggle').click(); assert.equal(await animated.evaluate(e => getComputedStyle(e).animationPlayState), 'paused');
  await page.locator('#motion-toggle').click(); assert.equal(await animated.evaluate(e => getComputedStyle(e).animationPlayState), 'running');
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.waitForFunction(() => document.querySelector('#motion-toggle').disabled); assert.equal(await animated.evaluate(e => getComputedStyle(e).animationName), 'none');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await go('hash-slide');
  for (const input of ['abc', '', 'Olá 🔐\nUTF-8', '<img src=x onerror=alert(1)>']) {
    await page.locator('#hash-input').fill(input);
    await page.waitForFunction(expected => document.querySelector('#hash-output-b').textContent === expected, digest(input));
    assert.equal(await page.locator('#hash-output-b img').count(), 0);
  }
  await page.locator('#hash-reference').fill('abc'); await page.locator('#hash-match').click();
  await page.waitForFunction(() => document.querySelector('#hash-bit-count').textContent === '0');
  await page.locator('#hash-space').click(); await page.waitForFunction(expected => document.querySelector('#hash-output-b').textContent === expected, digest('abc '));
  const xorBits = [...digest('abc')].reduce((sum, c, i) => sum + (parseInt(c, 16) ^ parseInt(digest('abc ')[i], 16)).toString(2).replace(/0/g, '').length, 0);
  assert.equal(Number(await page.locator('#hash-bit-count').innerText()), xorBits);
  await page.locator('#hash-input').fill('a'.repeat(1000)); await page.locator('#hash-space').click(); assert.equal((await page.locator('#hash-input').inputValue()).length, 1000);
  await page.locator('#hash-reset').click(); await fits();
  await go('chain-slide'); await page.waitForFunction(() => !document.querySelector('#chain-data-0').disabled);
  const originalHashes = await page.locator('.current-hash').evaluateAll(nodes => nodes.map(n => n.title));
  assert.equal(originalHashes[0], digest(JSON.stringify([1, '0'.repeat(64), 'Alice envia 10 para Bob'])));

  await page.locator('#chain-data-0').fill('Alice envia 100 para Bob');
  await page.waitForFunction(() => document.querySelectorAll('.modified').length === 3);
  assert.equal(await page.locator('.bad-link').count(), 0); await fits();
  const changedHashes = await page.locator('.current-hash').evaluateAll(nodes => nodes.map(n => n.title));
  assert(changedHashes.every((h, i) => h !== originalHashes[i]));
  for (let i = 0; i < 3; i++) {
    const expected = digest(JSON.stringify([i + 1, i ? changedHashes[i - 1] : '0'.repeat(64), await page.locator('#chain-data-' + i).inputValue()]));
    assert.equal(changedHashes[i], expected);
  }
  await page.locator('.inspect-block').nth(1).click();
  assert(await page.locator('#chain-payload').evaluate(e => e.open));
  assert.equal(digest(await page.locator('#payload-json').innerText()), await page.locator('#payload-hash').innerText());
  await page.keyboard.press('Escape');
  await page.locator('[data-chain-mode=frozen]').click();
  await page.waitForFunction(() => document.querySelectorAll('.bad-link').length === 1);
  assert.equal(await page.locator('.affected').count(), 1);
  assert.deepEqual(await page.locator('.current-hash').evaluateAll(n => n.map(e => e.title).slice(1)), originalHashes.slice(1));
  await page.locator('[data-chain-mode=cascade]').click();
  await page.waitForFunction(() => document.querySelectorAll('.modified').length === 3);
  await page.locator('#chain-reset').click();
  await page.waitForFunction(() => document.querySelectorAll('.modified').length === 0);
  assert.deepEqual(await page.locator('.current-hash').evaluateAll(n => n.map(e => e.title)), originalHashes);
  await page.locator('#chain-data-1').fill('Olá 🔐 <img src=x>');
  await page.waitForFunction(() => document.querySelectorAll('.modified').length === 2);
  assert.equal(await page.locator('.current-hash').first().innerText(), originalHashes[0]);
  await page.locator('.inspect-block').nth(1).click();
  assert.equal(await page.locator('#payload-json img').count(), 0);
  assert.equal(digest(await page.locator('#payload-json').innerText()), await page.locator('#payload-hash').innerText());
  await page.keyboard.press('Escape');
  await page.locator('#chain-reset').click(); await page.waitForFunction(() => document.querySelectorAll('.modified').length === 0);
  await page.locator('#chain-data-2').fill('Último'); await page.waitForFunction(() => document.querySelectorAll('.modified').length === 1);
  await go('pow-slide');
  for (const invalid of ['-1', '1.5', '4294967296', '']) {
    await page.locator('#pow-nonce').fill(invalid); await page.locator('#pow-test').click();
    assert.match(await page.locator('#pow-status').innerText(), /inteiro/);
    assert.equal(await page.locator('#pow-attempts').innerText(), '0');
  }
  await page.locator('#pow-nonce').fill('42');
  assert.match(await page.locator('#pow-hash').innerText(), /Clique em testar/);
  await page.locator('#pow-test').click();
  await page.waitForFunction(expected => document.querySelector('#pow-hash').textContent === expected, digest(JSON.stringify(['Bloco de demonstração', 42])));
  await page.locator('#pow-test').click(); await page.waitForFunction(() => document.querySelector('#pow-attempts').textContent === '2');
  await page.locator('#pow-increment').click(); await page.waitForFunction(expected => document.querySelector('#pow-hash').textContent === expected, digest(JSON.stringify(['Bloco de demonstração', 43])));
  await page.locator('#pow-nonce').fill('4294967295'); await page.locator('#pow-increment').click(); assert.match(await page.locator('#pow-status').innerText(), /Limite/);
  await page.locator('#pow-clear').click(); assert.equal(await page.locator('#pow-attempts').innerText(), '0');
  await page.locator('#pow-nonce').fill('0'); await page.locator('#pow-difficulty').selectOption('2'); await page.locator('#pow-pace').selectOption('0');
  await page.locator('#pow-mine').click(); await page.waitForFunction(() => document.querySelector('#pow-status').textContent.startsWith('Encontrado'), null, { timeout: 20000 });
  const nonce = Number(await page.locator('#pow-nonce').inputValue());
  const powHash = digest(JSON.stringify(['Bloco de demonstração', nonce]));
  assert(powHash.startsWith('00')); assert.equal(await page.locator('#pow-hash').innerText(), powHash); await fits();
  await page.locator('#pow-data').fill('Dado adulterado'); assert.equal(await page.locator('#pow-attempts').innerText(), '0');
  await page.locator('#pow-test').click(); await page.waitForFunction(expected => document.querySelector('#pow-hash').textContent === expected, digest(JSON.stringify(['Dado adulterado', nonce])));
  await page.locator('#pow-difficulty').selectOption('4'); await page.locator('#pow-nonce').fill('0'); await page.locator('#pow-pace').selectOption('250');
  await page.locator('#pow-mine').click(); await page.locator('#pow-stop').click(); assert.match(await page.locator('#pow-status').innerText(), /interrompida/);
  const stoppedCount = await page.locator('#pow-attempts').innerText(); await page.waitForTimeout(350); assert.equal(await page.locator('#pow-attempts').innerText(), stoppedCount);
  let capData = '', candidate = 0;
  do { capData = 'Limite didático ' + candidate++; } while (Array.from({ length: 8192 }, (_, n) => digest(JSON.stringify([capData, n]))).some(h => h.startsWith('0000')));
  await page.locator('#pow-data').fill(capData); await page.locator('#pow-nonce').fill('0'); await page.locator('#pow-pace').selectOption('0');
  await page.locator('#pow-mine').click(); await page.waitForFunction(() => document.querySelector('#pow-mine').disabled === false, null, { timeout: 35000 });
  assert.equal((await page.locator('#pow-attempts').innerText()).replace(/\D/g, ''), '8192');
  assert.match(await page.locator('#pow-status').innerText(), /Limite/);
  await page.locator('#pow-nonce').fill('4294967295'); await page.locator('#pow-clear').click();
  await page.locator('#pow-mine').click(); await page.waitForFunction(() => !document.querySelector('#pow-mine').disabled);
  assert.equal(await page.locator('#pow-attempts').innerText(), '1');
  await page.locator('#pow-nonce').fill('0'); await page.locator('#pow-pace').selectOption('250');
  await page.locator('#pow-mine').click(); await go('pos-slide'); assert(await page.locator('#pow-mine').isEnabled());
  for (let i = 0; i < 4; i++) { await page.locator('[data-pos="' + i + '"]').click(); assert.equal(await page.locator('#pos-number').innerText(), '0' + (i + 1)); await fits(); }
  await go('poh-slide'); await page.waitForFunction(() => !document.querySelector('#poh-next').disabled);
  let previous = digest('inicio-poh');
  for (let i = 1; i <= 4; i++) {
    const event = i === 2 ? 'Olá <img src=x> 🔐' : 'Alice envia 1 SOL';
    await page.locator('#poh-event').fill(event); await page.locator('#poh-next').click();
    previous = digest(JSON.stringify([previous, event]));
    await page.waitForFunction(expected => [...document.querySelectorAll('.poh-node.recorded code')].at(-1).title === expected, previous);
    assert.equal(await page.locator('#poh-chain img').count(), 0); await fits();
  }
  assert(await page.locator('#poh-next').isDisabled()); await page.locator('#poh-reset').click();
  await page.waitForFunction(() => document.querySelectorAll('.poh-node.recorded').length === 1);
  await go('networks-slide');
  for (const network of ['btc', 'eth', 'sol']) { await page.locator(`[data-network=${network}]`).click(); assert.match(await page.locator('#network-detail').innerText(), new RegExp(network.toUpperCase())); await fits(); }
  await go('contract-slide'); await page.locator('#contract-release').click(); assert.match(await page.locator('#contract-result').innerText(), /Falta o depósito/);
  await page.locator('#contract-deposit').click(); await page.locator('#contract-release').click(); assert.match(await page.locator('#contract-result').innerText(), /Entrega ainda/);
  await page.locator('#contract-confirm').click(); await page.locator('#contract-caller').selectOption('outsider'); await page.locator('#contract-release').click(); assert.equal(await page.locator('#seller-balance').innerText(), '0'); assert.match(await page.locator('#contract-result').innerText(), /não autorizado/); await fits();
  await page.locator('#contract-caller').selectOption('buyer'); await page.locator('#contract-release').click(); assert.equal(await page.locator('#seller-balance').innerText(), '10'); assert.equal(await page.locator('#escrow-balance').innerText(), '0');
  await page.locator('#contract-release').click(); assert.match(await page.locator('#contract-result').innerText(), /segunda retirada/); assert.equal(await page.locator('#seller-balance').innerText(), '10'); await fits();
  await page.locator('#contract-reset').click(); assert.equal(await page.locator('#seller-balance').innerText(), '0');
  await go('solana-slide'); await page.locator('[data-conflict=yes]').click(); assert.match(await page.locator('#parallel-result').innerText(), /escrevem em X/); await fits(); await page.locator('[data-conflict=no]').click();
  await page.setViewportSize({ width: 390, height: 844 }); await go('hash-slide'); await page.locator('#hash-input').fill('abc'); await page.waitForFunction(expected => document.querySelector('#hash-output-b').textContent === expected, digest('abc')); assert.equal(await page.locator('#slide-current').innerText(), '24');
  await page.locator('#hash-input').press('ArrowRight'); assert.equal(await page.locator('#slide-current').innerText(), '25');
  assert.deepEqual(errors, []); assert.deepEqual(networkRequests, []);
  console.log('SHA-256, UTF-8, avalanche, chain tampering, mining limits/cancel, contract guards, animation controls and offline checks passed.');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
