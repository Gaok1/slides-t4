'use strict';

// All data stays in this page. Web Crypto supplies SHA-256; no custom crypto.
async function sha256(text) {
  if (!globalThis.crypto?.subtle) throw new Error('SHA-256 indisponível. Abra o arquivo em um navegador atual ou via localhost/HTTPS.');
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(bytes)].map(n => n.toString(16).padStart(2, '0')).join('');
}
const shortHash = hash => `${hash.slice(0, 12)}…${hash.slice(-8)}`;

// Decorative flow, not live network telemetry. Paused when hidden or requested.
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let motionPaused = reducedMotion.matches;
$$('.slide[data-act="3"]').forEach(slide => {
  const backdrop = document.createElement('div');
  backdrop.className = 'chain-atmosphere'; backdrop.setAttribute('aria-hidden', 'true');
  backdrop.innerHTML = '<div class="ambient-rail">' + Array.from({ length: 7 }, (_, i) => `<div class="ambient-unit" style="--order:${i}"><div class="ambient-block"><b>BLOCK ${String(i + 1).padStart(2, '0')}</b><i></i><i></i><i></i><small>HASH →</small></div><span class="ambient-link"></span></div>`).join('') + '</div>';
  slide.prepend(backdrop);
});
function syncMotion() {
  if (reducedMotion.matches) motionPaused = true;
  $('#motion-toggle').disabled = reducedMotion.matches;
  $('#motion-toggle').title = reducedMotion.matches ? 'Movimento reduzido ativo nas preferências do sistema' : 'Pausar ou retomar animações (M)';
  document.body.classList.toggle('motion-paused', motionPaused || document.hidden);
  $('#motion-toggle').textContent = motionPaused ? '▷' : '⏸';
  $('#motion-toggle').setAttribute('aria-pressed', String(motionPaused));
  $('#motion-toggle').setAttribute('aria-label', motionPaused ? 'Retomar animações de blockchain' : 'Pausar animações de blockchain');
}
$('#motion-toggle').addEventListener('click', () => { motionPaused = !motionPaused; syncMotion(); });
reducedMotion.addEventListener('change', () => { motionPaused = reducedMotion.matches; syncMotion(); });
document.addEventListener('visibilitychange', () => { syncMotion(); if (document.hidden) stopMining(); });
document.addEventListener('keydown', event => {
  if (!event.ctrlKey && !event.metaKey && !event.altKey && event.key.toLowerCase() === 'm' && !event.target.closest('input,textarea,select,[contenteditable=true]') && !$('dialog[open]')) { motionPaused = !motionPaused; syncMotion(); }
});
syncMotion();

let hashRevision = 0;
async function updateHashLab() {
  const revision = ++hashRevision;
  const a = $('#hash-reference').value, b = $('#hash-input').value;
  try {
    const [ha, hb] = await Promise.all([sha256(a), sha256(b)]);
    if (revision !== hashRevision) return;
    $('#hash-output-a').textContent = ha;
    // Only fixed hexadecimal output enters markup, never user-supplied text.
    $('#hash-output-b').innerHTML = [...hb].map((char, i) => `<span class="${char === ha[i] ? '' : 'changed'}">${char}</span>`).join('');
    const bits = [...ha].reduce((sum, digit, i) => sum + (parseInt(digit, 16) ^ parseInt(hb[i], 16)).toString(2).replace(/0/g, '').length, 0);
    $('#hash-bit-count').textContent = bits;
    $('#hash-percent').textContent = `${fmt(bits / 256 * 100, 1)}%`;
    $('#hash-bytes-a').textContent = `${new TextEncoder().encode(a).length} bytes UTF-8`;
    $('#hash-bytes-b').textContent = `${new TextEncoder().encode(b).length} bytes UTF-8`;
    $('#hash-status').textContent = a === b ? 'Hashes iguais.' : `${bits} bits diferentes.`;
  } catch (error) { if (revision === hashRevision) $('#hash-status').textContent = error.message; }
}
['hash-reference', 'hash-input'].forEach(id => document.getElementById(id).addEventListener('input', updateHashLab));
$('#hash-match').addEventListener('click', () => { $('#hash-input').value = $('#hash-reference').value; updateHashLab(); });
$('#hash-space').addEventListener('click', () => {
  if ($('#hash-input').value.length >= 1000) { toast('Limite de 1.000 caracteres atingido. Apague um caractere para adicionar o espaço.'); return; }
  $('#hash-input').value += ' '; updateHashLab();
});
$('#hash-reset').addEventListener('click', () => { $('#hash-reference').value = 'Alice envia 10 para Bob'; $('#hash-input').value = 'Alice envia 11 para Bob'; updateHashLab(); });
updateHashLab();

const originalChainData = ['Alice envia 10 para Bob', 'Bob envia 4 para Carol', 'Carol envia 2 para Dani'];
let originalChainHashes = [], chainMode = 'cascade', chainRevision = 0;
const chainAnchor = '0'.repeat(64);
const payloadDialog = document.createElement('dialog');
payloadDialog.id = 'chain-payload';
payloadDialog.innerHTML = '<div class="dialog-head"><h2 id="payload-title">Entrada do hash</h2><button class="icon-button" aria-label="Fechar entrada do hash">×</button></div><p>Todos os campos deste bloco didático entram nesta sequência JSON, codificada em UTF-8.</p><pre id="payload-json"></pre><p id="payload-bytes" class="small muted"></p><div class="hash-output-label">SHA-256 DA ENTRADA EXATA ACIMA</div><code id="payload-hash"></code><p class="small muted">O próprio hash não entra na conta: ele é o resultado. Cores e estados de validação são informações da interface.</p>';
document.body.append(payloadDialog);
$('button', payloadDialog).addEventListener('click', () => payloadDialog.close());
$$('.linked-block').forEach((block, i) => {
  const button = document.createElement('button');
  button.className = 'text-button inspect-block'; button.textContent = 'Ver entrada completa ↗';
  button.addEventListener('click', () => {
    $('#payload-title').textContent = `Bloco ${i + 1}: o que entra no hash`;
    $('#payload-json').textContent = block.dataset.payload || '';
    $('#payload-bytes').textContent = `${new TextEncoder().encode(block.dataset.payload || '').length} bytes UTF-8. Ordem: índice, hash anterior completo, dados.`;
    $('#payload-hash').textContent = $('.current-hash', block).title;
    payloadDialog.showModal();
  });
  block.append(button);
});
$$('.chain-data').forEach(input => { input.disabled = true; });
async function updateChain() {
  if (originalChainHashes.length !== 3) return;
  const revision = ++chainRevision, mode = chainMode;
  const data = $$('.chain-data').map(input => input.value), hashes = [], previous = [], payloads = [];
  $('#chain-reset').disabled = true;
  try {
    for (let i = 0; i < 3; i++) {
      previous[i] = i ? (mode === 'cascade' ? hashes[i - 1] : originalChainHashes[i - 1]) : chainAnchor;
      payloads[i] = JSON.stringify([i + 1, previous[i], data[i]]);
      hashes.push(await sha256(payloads[i]));
    }
    if (revision !== chainRevision) return;
    let broken = 0, changed = 0, inherited = false;
    $$('.linked-block').forEach((block, i) => {
      const badLink = i > 0 && previous[i] !== hashes[i - 1], modified = hashes[i] !== originalChainHashes[i];
      if (badLink) broken++;
      if (modified) changed++;
      block.classList.toggle('bad-link', badLink); block.classList.toggle('modified', modified); block.classList.toggle('affected', inherited && !badLink);
      $('.block-state', block).textContent = badLink ? 'ELO QUEBRADO' : inherited ? 'CADEIA AFETADA' : modified ? 'HASH ALTERADO' : 'ORIGINAL';
      const prev = $('.previous-hash', block), hash = $('.current-hash', block);
      prev.textContent = shortHash(previous[i]); prev.title = previous[i];
      hash.textContent = hashes[i]; hash.title = hashes[i]; block.dataset.payload = payloads[i];
      if (badLink) inherited = true;
    });
    $('#chain-status').classList.toggle('warn', changed > 0);
    $('#chain-status').textContent = broken ? `${broken} elo(s) quebrado(s).` : changed ? (mode === 'cascade' ? `${changed} hash(es) alterado(s).` : 'Hash do último bloco alterado.') : mode === 'cascade' ? 'Cadeia original.' : 'Referências congeladas.';
  } catch (error) { if (revision === chainRevision) $('#chain-status').textContent = error.message; }
  finally { if (revision === chainRevision) $('#chain-reset').disabled = false; }
}
$$('.chain-data').forEach(input => input.addEventListener('input', updateChain));
$$('[data-chain-mode]').forEach(button => button.addEventListener('click', () => {
  chainMode = button.dataset.chainMode;
  $$('[data-chain-mode]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  updateChain();
}));
$('#chain-reset').addEventListener('click', () => { $$('.chain-data').forEach((input, i) => { input.value = originalChainData[i]; }); updateChain(); });
(async () => {
  try {
    for (let i = 0; i < 3; i++) originalChainHashes.push(await sha256(JSON.stringify([i + 1, i ? originalChainHashes[i - 1] : chainAnchor, originalChainData[i]])));
    $$('.chain-data').forEach(input => { input.disabled = false; }); await updateChain();
  } catch (error) { $('#chain-status').textContent = error.message; }
})();

// Proof of work: manual attempts for the audience, timed search for the sense of scale.
let mining = false, miningRevision = 0, powAttempts = 0, powStarted = 0, powElapsed = 0, powRate = 0;
const powBatch = 512;
function renderPowMetrics() {
  $('#pow-attempts').textContent = fmt(powAttempts);
  $('#pow-elapsed').textContent = `${fmt(powElapsed / 1000, 1)} s`;
  $('#pow-rate').textContent = powRate ? `${fmt(powRate)} h/s` : '—';
}
function setMining(active) {
  mining = active;
  $('#pow-stop').disabled = !active;
  ['pow-mine','pow-data','pow-nonce','pow-difficulty','pow-test','pow-increment','pow-clear'].forEach(id => document.getElementById(id).disabled = active);
}
function stopMining() {
  if (!mining) return;
  ++miningRevision; powElapsed = performance.now() - powStarted; setMining(false); renderPowMetrics();
  $('#pow-status').textContent = 'Busca parada.';
}
function getNonce() {
  const value = $('#pow-nonce').value.trim();
  if (!/^\d+$/.test(value)) throw new Error('Informe um nonce inteiro não negativo, sem espaços ou sinais.');
  return BigInt(value);
}
const powPayload = (data, nonce) => `[${JSON.stringify(data)},${nonce.toString()}]`;
function getDifficulty() {
  const difficulty = Number($('#pow-difficulty').value);
  if (!Number.isInteger(difficulty) || difficulty < 0 || difficulty > 64) throw new Error('Informe uma quantidade inteira de zeros entre 0 e 64.');
  return difficulty;
}
function pendingPow(reset = false) {
  stopMining(); ++miningRevision;
  if (reset) { powAttempts = 0; powElapsed = 0; powRate = 0; }
  renderPowMetrics();
  $('#pow-hash').textContent = '—';
  $('#pow-status').classList.remove('warn');
  try {
    const d = getDifficulty();
    $('#pow-expected').textContent = d <= 5 ? fmt(16 ** d) : `16^${d}`;
    $('.pow-expectation p').textContent = `tentativas para ${d} ${d === 1 ? 'zero hexadecimal' : 'zeros hexadecimais'}`;
    $('#pow-status').textContent = 'Pronto.';
  } catch (error) {
    $('#pow-expected').textContent = '—';
    $('.pow-expectation p').textContent = 'quantidade personalizada de zeros';
    $('#pow-status').textContent = error.message;
  }
}
async function testNonce(increment = false) {
  if (mining) return;
  const revision = ++miningRevision;
  try {
    let nonce = getNonce(), difficulty = getDifficulty();
    if (increment) {
      nonce++; $('#pow-nonce').value = nonce.toString();
    }
    const hash = await sha256(powPayload($('#pow-data').value, nonce));
    if (revision !== miningRevision) return;
    powAttempts++; renderPowMetrics(); $('#pow-hash').textContent = hash;
    const success = hash.startsWith('0'.repeat(difficulty));
    $('#pow-status').classList.toggle('warn', !success);
    $('#pow-status').textContent = success ? `Válido · nonce ${fmt(nonce)}.` : `Inválido · nonce ${fmt(nonce)}.`;
  } catch (error) { if (revision === miningRevision) { $('#pow-hash').textContent = '—'; $('#pow-status').textContent = error.message; } }
}
$('#pow-test').addEventListener('click', () => testNonce());
$('#pow-increment').addEventListener('click', () => testNonce(true));
$('#pow-clear').addEventListener('click', () => pendingPow(true));
$('#pow-mine').addEventListener('click', async () => {
  if (mining) return;
  let start, difficulty;
  try { start = getNonce(); difficulty = getDifficulty(); } catch (error) { $('#pow-status').textContent = error.message; return; }
  const data = $('#pow-data').value, prefix = '0'.repeat(difficulty), revision = ++miningRevision;
  let searched = 0;
  powStarted = performance.now(); powElapsed = 0; powRate = 0; setMining(true);
  try {
    while (true) {
      const size = powBatch;
      const first = start + BigInt(searched);
      // One batch per turn of the event loop: the clock stays honest and the page stays responsive.
      const hashes = await Promise.all(Array.from({ length: size }, (_, k) => sha256(powPayload(data, first + BigInt(k)))));
      if (revision !== miningRevision) return;
      const hit = hashes.findIndex(hash => hash.startsWith(prefix));
      const shown = hit === -1 ? size - 1 : hit;
      searched += hit === -1 ? size : hit + 1;
      powAttempts += hit === -1 ? size : hit + 1;
      powElapsed = performance.now() - powStarted;
      powRate = powElapsed > 0 ? Math.round(searched / (powElapsed / 1000)) : 0;
      $('#pow-nonce').value = (first + BigInt(shown)).toString(); $('#pow-hash').textContent = hashes[shown]; renderPowMetrics();
      if (hit !== -1) {
        $('#pow-status').classList.remove('warn');
        $('#pow-status').textContent = `Nonce ${fmt(first + BigInt(hit))} · ${fmt(searched)} tentativas · ${fmt(powElapsed / 1000, 1)} s.`;
        return;
      }
      $('#pow-status').classList.add('warn');
      $('#pow-status').textContent = `${fmt(searched)} tentativas · ${fmt(powElapsed / 1000, 1)} s.`;
      await new Promise(resolve => setTimeout(resolve));
      if (revision !== miningRevision) return;
    }
  } catch (error) { if (revision === miningRevision) $('#pow-status').textContent = error.message; }
  finally { if (revision === miningRevision) { powElapsed = performance.now() - powStarted; setMining(false); renderPowMetrics(); } }
});
$('#pow-stop').addEventListener('click', stopMining);
$('#pow-nonce').addEventListener('input', () => pendingPow());
$('#pow-data').addEventListener('input', () => pendingPow(true));
$('#pow-difficulty').addEventListener('input', () => pendingPow(true));
document.addEventListener('slidechange', () => { if (!$('#pow-slide').classList.contains('active')) stopMining(); });
pendingPow(true);

// Proof of stake: a weighted lottery, so the share of turns can be compared to the share of stake.
const stakeNames = ['Ana', 'Bruno', 'Carla', 'Davi'];
const stakeRows = $$('#stake-grid .stake-row');
let stakeTurns = stakeNames.map(() => 0);
const stakeWeights = () => $$('.stake-input').map(input => Number(input.value));
const stakeTotal = weights => weights.reduce((sum, weight) => sum + weight, 0);
const stakeRounds = () => stakeTurns.reduce((sum, turns) => sum + turns, 0);
function renderStake(message, picked = -1, failed = false) {
  const weights = stakeWeights(), total = stakeTotal(weights), rounds = stakeRounds();
  stakeRows.forEach((row, i) => {
    $('.stake-share', row).textContent = total ? `${fmt(weights[i] / total * 100)}%` : '0%';
    $('.stake-turns', row).textContent = rounds ? `${fmt(stakeTurns[i] / rounds * 100)}%` : '—';
    row.classList.toggle('picked', i === picked);
  });
  $('#stake-result').classList.toggle('warn', failed);
  $('#stake-result').textContent = message;
}
function drawProposer() {
  const weights = stakeWeights(), total = stakeTotal(weights);
  if (!total) return -1;
  let ticket = Math.random() * total;
  return weights.findIndex(weight => (ticket -= weight) < 0);
}
function drawRounds(times) {
  let picked = -1;
  for (let i = 0; i < times; i++) {
    picked = drawProposer();
    if (picked < 0) return -1;
    stakeTurns[picked]++;
  }
  return picked;
}
$('#stake-draw').addEventListener('click', () => {
  const picked = drawRounds(1);
  if (picked < 0) { renderStake('Defina algum stake.', -1, true); return; }
  renderStake(`${stakeNames[picked]} · rodada ${fmt(stakeRounds())}.`, picked);
});
$('#stake-run').addEventListener('click', () => {
  if (drawRounds(200) < 0) { renderStake('Defina algum stake.', -1, true); return; }
  const weights = stakeWeights(), total = stakeTotal(weights), rounds = stakeRounds(), lead = weights.indexOf(Math.max(...weights));
  renderStake(`${fmt(rounds)} rodadas · ${stakeNames[lead]}: ${fmt(weights[lead] / total * 100)}% do stake, ${fmt(stakeTurns[lead] / rounds * 100)}% dos turnos.`);
});
$('#stake-reset').addEventListener('click', () => { stakeTurns = stakeNames.map(() => 0); renderStake('Contagem zerada.'); });
$$('.stake-input').forEach(input => input.addEventListener('input', () => {
  stakeTurns = stakeNames.map(() => 0);
  renderStake('Pesos atualizados.');
}));
renderStake('Pronto para sortear.');

// Proof of History: each tick hashes the previous state; transactions can enter the sequence.
const pohTransactions = ['Alice → Bob · 2 SOL', 'Swap SOL / USDC', 'Carol → Davi · 0,4 SOL', 'Voto do validador'];
let pohTick = 0, pohHash = '0'.repeat(64), pohTxIndex = 0, pohPending = false, pohRunning = false, pohPaused = false, pohTimer = 0, pohRevision = 0;
async function stepPoh(revision) {
  if (!pohRunning || revision !== pohRevision) return;
  const transaction = pohPending || pohTick % 3 === 2 ? pohTransactions[pohTxIndex++ % pohTransactions.length] : '';
  pohPending = false;
  const next = await sha256(transaction ? `${pohHash}|${transaction}` : pohHash);
  if (!pohRunning || revision !== pohRevision) return;
  pohHash = next; pohTick++;
  $('#poh-tick').textContent = String(pohTick).padStart(6, '0');
  $('#poh-hash').textContent = shortHash(pohHash);
  const row = document.createElement('div');
  row.className = transaction ? 'has-tx' : '';
  row.innerHTML = `<b>#${String(pohTick).padStart(6, '0')}</b><code>${shortHash(pohHash)}</code><span>${transaction}</span>`;
  $('#poh-stream').prepend(row);
  while ($('#poh-stream').children.length > 4) $('#poh-stream').lastElementChild.remove();
  pohTimer = setTimeout(() => stepPoh(revision), 550);
}
function startPoh() {
  if (pohRunning || pohPaused || !$('#poh-slide').classList.contains('active')) return;
  pohRunning = true; stepPoh(++pohRevision);
}
function stopPoh() {
  pohRunning = false; clearTimeout(pohTimer); pohRevision++;
}
$('#poh-add').addEventListener('click', () => { pohPending = true; });
$('#poh-toggle').addEventListener('click', () => {
  pohPaused = !pohPaused;
  $('#poh-toggle').textContent = pohPaused ? 'Retomar' : 'Pausar';
  $('#poh-toggle').setAttribute('aria-pressed', String(pohPaused));
  if (pohPaused) stopPoh(); else startPoh();
});
document.addEventListener('slidechange', () => { if ($('#poh-slide').classList.contains('active')) startPoh(); else stopPoh(); });
startPoh();
