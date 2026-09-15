// Gera falas-pessoa-3.pdf a partir do index.html. Run: node falas.cjs
// A fonte é sempre o deck: título, faixa problema/resposta/ainda falta e as notas de cada slide.
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
let playwright;
try { playwright = require('playwright'); }
catch { playwright = require(path.join(process.env.USERPROFILE, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')); }

const root = __dirname;
// O intervalo vem do próprio deck: todo slide com data-act="3" é fala da Pessoa 3.
const escape = text => String(text ?? '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

async function collect(page) {
  return page.evaluate(() => {
    const clean = node => (node?.textContent || '').replace(/\s+/g, ' ').trim();
    return [...document.querySelectorAll('.slide')].map((slide, i) => ({ slide, n: i + 1 }))
      .filter(entry => entry.slide.dataset.act === '3')
      .map(({ slide, n }) => {
        const note = clean(slide.querySelector('aside.notes'));
        const tag = note.match(/^Tempo:\s*([^·]+)·\s*Pessoa\s*(\d)\.\s*/);
        const body = slide.cloneNode(true);
        body.querySelector('aside.notes')?.remove();
        body.querySelector('.chain-atmosphere')?.remove();
        body.querySelector('.evo-rail')?.remove();
        // Sem isto, "Gasto duplo<br>e quem define a ordem" vira "Gasto duploe quem define a ordem".
        body.querySelectorAll('br').forEach(brk => brk.replaceWith(' '));
        const cell = selector => clean(body.querySelector(`.why-band .${selector} p`));
        // O slide de abertura não tem faixa: os três cartões do conceito já são problema, resposta e pergunta.
        const conceito = [...body.querySelectorAll('.concept-grid article')].map(card => clean(card.querySelector('p')));
        return {
          n,
          tempo: tag ? tag[1].trim() : '',
          pessoa: tag ? `Pessoa ${tag[2]}` : '',
          evo: slide.dataset.evo || '',
          eyebrow: clean(body.querySelector('.eyebrow')),
          titulo: slide.dataset.title,
          heading: clean(body.querySelector('h2')),
          problema: cell('why-problem') || conceito[0] || '',
          resposta: cell('why-answer') || conceito[1] || '',
          falta: cell('why-gap') || conceito[2] || '',
          intro: clean(body.querySelector('p.intro')),
          cartoes: [...body.querySelectorAll('.milestones article, .compare-columns article, .network-card, .flow-stages article, .decision-grid button, .choice-list button')]
            .map(card => ({
              rotulo: clean(card.querySelector('.mono, .year, .network-ticker, span')),
              titulo: clean(card.querySelector('h3, b')),
              texto: clean(card.querySelector('.mini-why')) || clean(card.querySelector('p, small, dd')),
            })).filter(card => card.titulo || card.texto),
          linhas: [...body.querySelectorAll('table tr')]
            .map(row => [...row.querySelectorAll('th, td')].map(clean)).filter(cells => cells.length > 1),
          takeaway: [clean(body.querySelector('.takeaway strong')), clean(body.querySelector('.takeaway span'))].filter(Boolean).join(' '),
          // O rodapé do laboratório de hash é um status vivo ("123 bits diferentes"), não uma ressalva.
          rodape: clean(body.querySelector('p.footnote:not([role=status]):not([aria-live])')),
          interativo: !!body.querySelector('button, input, textarea, select'),
          notas: tag ? note.slice(tag[0].length) : note,
        };
      });
  });
}

const bloco = slide => {
  const fala = [
    slide.problema && `<div class="beat abre"><span>Abre com</span><p>${escape(slide.problema)}</p></div>`,
    slide.resposta && `<div class="beat mostra"><span>Mostra</span><p>${escape(slide.resposta)}</p></div>`,
    slide.falta && `<div class="beat fecha"><span>Fecha com</span><p>${escape(slide.falta)}</p></div>`,
  ].filter(Boolean).join('');
  const tela = [
    slide.intro && `<p>${escape(slide.intro)}</p>`,
    slide.cartoes.length && `<ul>${slide.cartoes.map(card =>
      `<li>${card.titulo ? `<b>${escape(card.titulo)}</b>` : ''}${card.titulo && card.texto ? ' — ' : ''}${escape(card.texto)}</li>`).join('')}</ul>`,
    slide.linhas.length && `<table>${slide.linhas.map((cells, i) =>
      `<tr>${cells.map(text => `<${i ? 'td' : 'th'}>${escape(text)}</${i ? 'td' : 'th'}>`).join('')}</tr>`).join('')}</table>`,
    slide.takeaway && `<p class="destaque">${escape(slide.takeaway)}</p>`,
  ].filter(Boolean).join('');
  return `<section class="slide-fala">
  <header>
    <span class="num">${slide.n}</span>
    <div>
      <p class="eyebrow">${escape(slide.eyebrow)}</p>
      <h2>${escape(slide.heading)}</h2>
    </div>
    <span class="tempo">${escape(slide.tempo)}${slide.interativo ? '<i>demo ao vivo</i>' : ''}</span>
  </header>
  ${fala ? `<div class="fala">${fala}</div>` : ''}
  ${tela ? `<div class="tela"><h3>Na tela</h3>${tela}</div>` : ''}
  <div class="notas"><h3>Condução</h3><p>${escape(slide.notas)}</p></div>
  ${slide.rodape ? `<p class="ressalva"><b>Ressalva no slide:</b> ${escape(slide.rodape)}</p>` : ''}
</section>`;
};

(async () => {
  let browser;
  try { browser = await playwright.chromium.launch({ headless: true, channel: 'msedge' }); }
  catch { browser = await playwright.chromium.launch({ headless: true }); }
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
  await page.waitForFunction(() => document.querySelector('#overview-grid').children.length > 0);
  const slides = await collect(page);

  const total = slides.reduce((sum, slide) => sum + (parseInt(slide.tempo, 10) || 0), 0);
  const semTag = slides.filter(slide => slide.pessoa && slide.pessoa !== 'Pessoa 3');
  if (semTag.length) console.warn('Aviso: slides fora da Pessoa 3 no intervalo:', semTag.map(s => s.n));

  const sumario = slides.map(slide =>
    `<tr><td class="n">${slide.n}</td><td>${escape(slide.titulo)}</td><td class="t">${escape(slide.tempo)}</td></tr>`).join('');

  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Falas · Pessoa 3 · Ato III</title>
<style>
@page{size:A4;margin:16mm 15mm 14mm}
*{box-sizing:border-box}
body{margin:0;font:11pt/1.5 "Segoe UI",Arial,sans-serif;color:#10272e}
h1{font-size:26pt;line-height:1.1;margin:0 0 6px;letter-spacing:-.01em}
.capa{margin-bottom:22px;padding-bottom:16px;border-bottom:2px solid #10272e}
.capa .sub{font-size:11pt;color:#5d7178;margin:0}
.capa .meta{margin:14px 0 0;font:9.5pt/1.5 Consolas,monospace;color:#087f7b;letter-spacing:.06em;text-transform:uppercase}
.sumario{width:100%;border-collapse:collapse;margin:14px 0 4px;font-size:9.5pt}
.sumario td{padding:3px 6px;border-bottom:1px solid #e4eaeb;vertical-align:top}
.sumario .n{width:26px;color:#087f7b;font:600 9pt Consolas,monospace;text-align:right}
.sumario .t{width:46px;text-align:right;color:#5d7178;white-space:nowrap}
.aviso{margin:14px 0 0;padding:10px 13px;background:#fbf4ec;border-left:3px solid #a65b08;font-size:9.5pt;line-height:1.5}
.aviso b{color:#a65b08}
.slide-fala{break-inside:avoid;page-break-inside:avoid;margin:0 0 16px;padding:0 0 14px;border-bottom:1px solid #dde4e5}
.slide-fala header{display:flex;gap:11px;align-items:baseline;margin-bottom:9px}
.num{flex:none;width:26px;font:700 15pt/1 Consolas,monospace;color:#087f7b}
header>div{flex:1}
.eyebrow{margin:0 0 2px;font:9pt/1.3 Consolas,monospace;color:#5d7178;letter-spacing:.07em}
.slide-fala h2{margin:0;font-size:14.5pt;line-height:1.2}
.tempo{flex:none;font:600 9.5pt Consolas,monospace;color:#10272e;text-align:right}
.tempo i{display:block;font:italic 8pt "Segoe UI",Arial;color:#a65b08;letter-spacing:0}
.fala{margin:0 0 9px}
.beat{display:flex;gap:10px;padding:5px 0;border-top:1px solid #edf1f2}
.beat:first-child{border-top:0}
.beat span{flex:none;width:74px;font:600 8pt/1.7 "Segoe UI",Arial;letter-spacing:.11em;text-transform:uppercase}
.beat p{margin:0;flex:1}
.abre span{color:#b74732}
.mostra span{color:#087f7b}
.fecha span{color:#a65b08}
.tela,.notas{margin:9px 0 0;font-size:10pt}
.tela h3,.notas h3{margin:0 0 4px;font:600 8pt "Segoe UI",Arial;letter-spacing:.11em;text-transform:uppercase;color:#5d7178}
.tela ul{margin:3px 0;padding-left:17px}
.tela li{margin:1px 0}
.tela p,.notas p{margin:3px 0}
.tela table{width:100%;border-collapse:collapse;margin:5px 0;font-size:9pt}
.tela th,.tela td{border:1px solid #dde4e5;padding:3px 6px;text-align:left;vertical-align:top}
.tela th{background:#f3f7f7;font-weight:600}
.destaque{padding:5px 10px;background:#f0f7f6;border-left:3px solid #087f7b}
.notas{padding:8px 11px;background:#f7f9f9;border-radius:3px}
.ressalva{margin:8px 0 0;font-size:8.5pt;line-height:1.45;color:#5d7178}
.ressalva b{color:#10272e}
</style></head><body>
<div class="capa">
  <h1>Ato III · Blockchain</h1>
  <p class="sub">Falas da Pessoa 3 — slides ${slides[0].n} a ${slides[slides.length - 1].n} de ${await page.locator('.slide').count()}</p>
  <p class="meta">${total} min · gerado de index.html · ${new Date().toLocaleDateString('pt-BR')}</p>
</div>

<p><b>Como ler.</b> Cada slide traz três batidas: <b style="color:#b74732">Abre com</b> é o problema herdado do slide anterior, <b style="color:#087f7b">Mostra</b> é a peça que responde, <b style="color:#a65b08">Fecha com</b> é a lacuna que vira o título do próximo. Essa é a corrente do ato — se perder o fio, volte à trilha no rodapé do slide. "Condução" são as notas do deck: ressalvas, números e o que não afirmar.</p>

<p><b>Entrada.</b> A Pessoa 2 passa com: <i>"As alternativas existem, mas têm tamanhos e regras diferentes. A Pessoa 3 vai mostrar por que isso pesa mais em uma rede replicada por milhares de nós."</i></p>

<table class="sumario">${sumario}</table>

<div class="aviso"><b>Tempo.</b> O ato soma ${total} minutos. O deck inteiro vai a 88 min contra uma janela de 80, então há 8 min a cortar. Sem quebrar a corrente: juntar os slides 35 e 36 em uma fala única de 1 min, e reduzir o 27 para 2 min, o 28 para 1 min e o 30 para 1 min. O resto tem de sair do Ato I.</div>

${slides.map(bloco).join('\n')}

<section class="slide-fala" style="border-bottom:0">
  <header><span class="num">→</span><div><p class="eyebrow">SAÍDA · PASSAGEM PARA A PESSOA 2</p><h2>Fechamento do ato</h2></div></header>
  <div class="notas"><p><i>"A blockchain não muda a matemática da ameaça; ela multiplica o custo e a coordenação da resposta. A Pessoa 2 fecha com as opções de transição."</i></p></div>
</section>
</body></html>`;

  const source = path.join(root, 'tmp', 'falas-pessoa-3.html');
  fs.mkdirSync(path.dirname(source), { recursive: true });
  fs.writeFileSync(source, html);
  const sheet = await browser.newPage();
  await sheet.goto(pathToFileURL(source).href, { waitUntil: 'load' });
  await sheet.pdf({ path: path.join(root, 'falas-pessoa-3.pdf'), format: 'A4', printBackground: true });
  await browser.close();
  console.log(`Criado: falas-pessoa-3.pdf (${slides.length} slides, ${total} min).`);
})();
