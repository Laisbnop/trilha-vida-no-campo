/* Teste de fumaça: abre o jogo direto do arquivo (file://), passa pela criação, anda, usa ferramenta, testa o modo
   de desenvolvimento, salva e continua, e compara capturas da cena com as de referência (tests/ref/).
   Falha com qualquer erro no console ou exceção da página.
   Rodar: npm test. Refazer as capturas de referência (só quando o desenho mudar de propósito): npm run test:ref */
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const URL = 'file://' + path.resolve(__dirname, '..', 'index.html');
const REF = path.join(__dirname, 'ref');

/* erros do console e exceções da página */
function watch(page) {
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  page.on('pageerror', e => errs.push('exceção: ' + (e.stack || e.message)));
  return errs;
}

/* espera: com o relógio da página parado (capturas), avança o relógio; senão, espera de verdade */
const waiter = (page, fake) => async ms => { if (fake) await page.clock.runFor(ms); else await page.waitForTimeout(ms); };

/* fecha cartas, falas e o resumo do dia até o jogo ficar livre */
async function drain(page, wait) {
  for (let i = 0; i < 300; i++) {
    const st = await page.evaluate(() => ({ s: !!(window.__trilha && window.__trilha.S), busy: window.__trilha && window.__trilha.busy }));
    if (st.s && !st.busy) return;
    if (await page.locator('#letter').isVisible()) await page.click('#letter-ok');
    else if (await page.locator('#summary-go').isVisible()) await page.click('#summary-go');
    else if (await page.locator('#dialog').isVisible()) await page.keyboard.press('Enter');
    await wait(100);
  }
  throw new Error('o jogo não ficou livre (carta, fala ou resumo aberto)');
}

/* criação de personagem completa e abertura, até o jogo estar livre */
async function newGame(page, wait) {
  await expect(page.locator('#btn-new')).toBeVisible();
  await page.click('#btn-new'); await wait(150);
  for (let i = 0; i < 20; i++) {
    if (await page.locator('#name-input').isVisible()) await page.fill('#name-input', 'Rita');
    if (await page.locator('#farm-input').isVisible()) await page.fill('#farm-input', 'Sol');
    const last = /Começar/.test(await page.innerText('#btn-next'));
    await page.click('#btn-next'); await wait(150);
    if (last) break;
  }
  await drain(page, wait);
}

test('jogo: criação, andar, ferramenta, salvar e continuar', async ({ page }) => {
  const errs = watch(page), wait = waiter(page, false);
  await page.goto(URL);
  await expect(page.locator('#screen-title')).toBeVisible();
  await newGame(page, wait);

  // anda com as setas (tenta as quatro direções até sair do lugar)
  const p0 = await page.evaluate(() => ({ x: window.__trilha.P.x, y: window.__trilha.P.y }));
  let moved = false;
  for (const k of ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp']) {
    await page.keyboard.down(k); await wait(400); await page.keyboard.up(k); await wait(100);
    const p = await page.evaluate(() => ({ x: window.__trilha.P.x, y: window.__trilha.P.y }));
    if (p.x !== p0.x || p.y !== p0.y) { moved = true; break; }
  }
  expect(moved, 'o personagem anda com as setas').toBe(true);

  // ferramenta: o golpe é desenhado sem erro
  await page.evaluate(() => { window.__trilha.P.tool = { id: 'enxada', t0: performance.now() }; });
  await wait(500);

  // salvar, recarregar e continuar: dia, moedas e posição iguais
  const before = await page.evaluate(() => { const t = window.__trilha; t.S.coins += 7; t.S.pos = { map: t.map.id, x: Math.round(t.P.x), y: Math.round(t.P.y), dir: t.P.dir }; t.save(); return { day: t.S.day, coins: t.S.coins, pos: t.S.pos }; });
  await page.reload();
  await expect(page.locator('#btn-continue')).toBeVisible();
  await page.click('#btn-continue'); await wait(500);
  await drain(page, wait);
  const after = await page.evaluate(() => { const t = window.__trilha; return { day: t.S.day, coins: t.S.coins, map: t.map.id, x: Math.round(t.P.x), y: Math.round(t.P.y) }; });
  expect(after.day).toBe(before.day);
  expect(after.coins).toBe(before.coins);
  expect({ map: after.map, x: after.x, y: after.y }).toEqual({ map: before.pos.map, x: before.pos.x, y: before.pos.y });
  expect(await page.evaluate(() => typeof window.__creation === 'object' && 'look' in window.__creation), 'gancho window.__creation').toBe(true);
  expect(errs).toEqual([]);
});

test('modo de desenvolvimento: chuva, horas, noites, interiores, menu e mapa', async ({ page }) => {
  const errs = watch(page), wait = waiter(page, false);
  await page.goto(URL + '?dev=1');
  await newGame(page, wait);
  expect(await page.evaluate(() => !!window.__trilha.dev)).toBe(true);
  await page.evaluate(() => window.__trilha.dev.setRain(true)); await wait(300);
  await page.evaluate(() => window.__trilha.dev.addMinutes(180)); await wait(300);
  const d0 = await page.evaluate(() => window.__trilha.S.day);
  const d1 = await page.evaluate(() => window.__trilha.dev.night(3)); await wait(300);
  expect(d1).toBe(d0 + 3);
  await drain(page, wait);
  for (const [m, x, y] of [['casa', null, null], ['loja', null, null], ['fora', 100, 164]]) {
    await page.evaluate(([m, x, y]) => { const tt = window.__trilha, mp = World.get(m); tt.place(m, x != null ? x : mp.spawn.x, y != null ? y : mp.spawn.y, 'down'); }, [m, x, y]);
    await wait(300); await drain(page, wait);
    expect(await page.evaluate(() => window.__trilha.map.id)).toBe(m);
  }
  await page.keyboard.press('e'); await wait(300);
  expect(await page.locator('#modal').isVisible(), 'menu (E)').toBe(true);
  await page.keyboard.press('Escape'); await wait(300);
  await page.keyboard.press('m'); await wait(300);
  expect(await page.locator('#modal').isVisible(), 'mapa (M)').toBe(true);
  await page.keyboard.press('Escape'); await wait(300);
  expect(errs).toEqual([]);
});

/* Quadro de pedidos da praça: fechado antes das boas-vindas; depois, sortear, aceitar, conseguir os itens,
   entregar a quem pediu e conferir as moedas. */
test('quadro de pedidos: sortear, aceitar, entregar e receber', async ({ page }) => {
  const errs = watch(page), wait = waiter(page, false);
  await page.goto(URL + '?dev=1');
  await newGame(page, wait);
  const click = () => page.evaluate(() => { const t = window.__trilha; t.place('fora', World.SPOT.board[0], World.SPOT.board[1] + 24, 'up'); const h = t.targetAt(World.SPOT.board[0], World.SPOT.board[1] - 14); h.act(); return h.label; });
  expect(await click(), 'o quadro é clicável na praça').toMatch(/Quadro de pedidos/);
  await wait(300);
  expect(await page.innerText('#dialog'), 'antes das boas-vindas: aviso curto').toMatch(/Ainda não tem nada aqui/);
  await drain(page, wait);
  await page.evaluate(() => window.__trilha.talk('celeste')); await wait(200); await drain(page, wait);   // boas-vindas no Armazém
  const o = await page.evaluate(() => window.__trilha.dev.newOrder());
  expect(o && o.qty >= 1 && o.qty <= 10 && o.coins % 5 === 0, 'pedido sorteado: quantidade de 1 a 10, moedas em múltiplo de 5').toBe(true);
  expect(await page.evaluate(() => window.__trilha.S.board.seen), 'pedido novo ainda não lido').toBe(false);
  await click(); await wait(300);
  await expect(page.locator('#board-accept')).toBeVisible();
  await page.click('#board-accept'); await wait(200);
  const act = await page.evaluate(() => window.__trilha.S.board.active);
  expect(act && act.item === o.item && act.due === act.accepted + 1, 'pedido aceito, com prazo até o fim do dia seguinte').toBe(true);
  await page.evaluate(() => window.__trilha.openTab('diario')); await wait(200);
  expect(await page.innerText('#modal-body'), 'Diário: seção própria com o progresso').toMatch(/Pedidos do quadro[\s\S]*Progresso: 0\//);
  await page.keyboard.press('Escape'); await wait(200);
  const coins0 = await page.evaluate(() => { window.__trilha.dev.completeOrder(); return window.__trilha.S.coins; });
  await page.evaluate(id => window.__trilha.talk(id), o.from); await wait(200); await drain(page, wait);
  const end = await page.evaluate(() => ({ coins: window.__trilha.S.coins, active: window.__trilha.S.board.active, done: window.__trilha.S.board.done }));
  expect(end).toEqual({ coins: coins0 + o.coins, active: null, done: 1 });
  expect(errs).toEqual([]);
});

/* Lixeira do Inventário: joga fora só 1, depois o resto; ferramenta não vai para o lixo. */
test('lixeira: jogar fora itens da mochila', async ({ page }) => {
  const errs = watch(page), wait = waiter(page, false);
  await page.goto(URL);
  await newGame(page, wait);
  await page.evaluate(() => { const S = window.__trilha.S; S.inv[12] = { id: 'pedra', n: 10 }; });
  await page.keyboard.press('e'); await wait(300);
  await page.click('.inv-row .slot[data-i="12"]'); await page.click('#inv-trash'); await wait(100);
  await expect(page.locator('.item-info')).toContainText('Jogar fora Pedra × 10?');
  await page.click('#btn-trash-one'); await wait(100);
  expect(await page.evaluate(() => window.__trilha.S.inv[12])).toEqual({ id: 'pedra', n: 9 });
  await page.click('#inv-trash'); await page.click('#btn-trash-all'); await wait(100);
  expect(await page.evaluate(() => window.__trilha.S.inv[12])).toBeNull();
  await page.click('.inv-row .slot[data-i="0"]'); await page.click('#inv-trash'); await wait(100);
  expect(await page.evaluate(() => window.__trilha.S.inv[0] && window.__trilha.S.inv[0].id), 'ferramenta continua na mochila').toBe('enxada');
  expect(await page.locator('#btn-trash-all').count()).toBe(0);
  await page.keyboard.press('Escape'); await wait(200);
  expect(errs).toEqual([]);
});

test('som: golpes de quebrar e volume nas Configurações', async ({ page }) => {
  const errs = watch(page), wait = waiter(page, false);
  await page.goto(URL);
  await newGame(page, wait);
  await page.keyboard.press('ArrowDown');                                         // libera o áudio (primeira tecla)
  const hits = await page.evaluate(() => {
    const out = [], o = playBreak; window.playBreak = (fx, last) => { out.push([fx, last, audioOn()]); o(fx, last); };
    const P = window.__trilha.P;
    strike('teste-r', RESIST.rock, 'picareta', [P.x, P.y], () => {});            // golpe que não quebra
    strike('teste-m', RESIST.weed, 'foice', [P.x, P.y], () => {});               // mato: quebra no primeiro
    delete window.__trilha.S.dmg['teste-r']; window.playBreak = o; return out;
  });
  expect(hits.map(h => h.slice(0, 2))).toEqual([['stone', false], ['leaf', true]]);
  await page.keyboard.press('e'); await wait(300);
  await page.click('#tabs button[data-tab="config"]');
  await page.locator('#sound-vol').fill('0'); await wait(100);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem(SOUND_KEY)).vol)).toBe(0);
  await expect(page.locator('.vol-val')).toHaveText('mudo');
  await page.keyboard.press('Escape'); await wait(200);
  expect(errs).toEqual([]);
});

/* Capturas da cena com relógio parado e sorteios fixos: mesmas a cada execução. */
test('capturas: fazenda, vila e interior iguais às de referência', async ({ page }) => {
  const errs = watch(page), wait = waiter(page, true);
  await page.addInitScript(() => {                                   // Math.random com semente fixa
    let s = 12345; Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  });
  await page.clock.install({ time: new Date('2026-01-01T12:00:00Z') });
  await page.clock.pauseAt(new Date('2026-01-01T12:01:00Z'));         // o tempo só anda quando o teste manda (runFor)
  await page.goto(URL + '?dev=1');
  await wait(500);
  await newGame(page, wait);
  await page.evaluate(() => { const t = window.__trilha; t.dev.markers = false; t.dev.setRain(false); });
  const shots = [['fazenda', 'fora', 100, 164], ['vila', 'fora', 632, 230], ['interior', 'loja', null, null]];
  const update = !!process.env.UPDATE_REF;
  for (const [name, m, x, y] of shots) {
    await page.evaluate(([m, x, y]) => { const t = window.__trilha, mp = World.get(m); t.place(m, x != null ? x : mp.spawn.x, y != null ? y : mp.spawn.y, 'down'); t.dev.setTime(600); }, [m, x, y]);
    await wait(400);
    await page.evaluate(() => window.__trilha.dev.setTime(600)); await wait(40);
    const url = await page.evaluate(() => document.getElementById('scene').toDataURL());
    const file = path.join(REF, name + '.png');
    if (update || !fs.existsSync(file)) { fs.mkdirSync(REF, { recursive: true }); fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64')); continue; }
    const ref = 'data:image/png;base64,' + fs.readFileSync(file).toString('base64');
    const diff = await page.evaluate(async ([a, b]) => {
      const load = src => new Promise(r => { const im = new Image(); im.onload = () => r(im); im.src = src; });
      const [A, B] = await Promise.all([load(a), load(b)]);
      if (A.width !== B.width || A.height !== B.height) return { size: [A.width, A.height, B.width, B.height] };
      const px = im => { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d'); g.drawImage(im, 0, 0); return g.getImageData(0, 0, c.width, c.height).data; };
      const da = px(A), db = px(B); let n = 0; for (let i = 0; i < da.length; i += 4) if (da[i] !== db[i] || da[i + 1] !== db[i + 1] || da[i + 2] !== db[i + 2] || da[i + 3] !== db[i + 3]) n++;
      return { n };
    }, [url, ref]);
    if (diff.n) { fs.mkdirSync(test.info().outputDir, { recursive: true }); fs.writeFileSync(path.join(test.info().outputDir, name + '-atual.png'), Buffer.from(url.split(',')[1], 'base64')); }
    expect(diff, `captura "${name}" igual à de referência`).toEqual({ n: 0 });
  }
  expect(errs).toEqual([]);
});
