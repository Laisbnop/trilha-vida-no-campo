/* Jogo — diálogo: falas, escolhas, retratos e a fila de cenas.
   Parte de js/game/ (antes era js/game.js). São scripts comuns, carregados em ordem pelo index.html:
   as declarações de nível superior (estado S, P, map etc. e as funções) valem para todos os arquivos, sem
   cópias (não são módulos). O jogo começa em js/game/main.js, o último. */

/* =====================================================
   DIÁLOGO
   ===================================================== */
let onAdvance = null, typer = 0;
/* Retrato do diálogo. Quem tem retrato próprio (Lúcio) usa a expressão pedida. */
function setSpeaker(who, expr) {
  const sp = who === 'narr' ? { name: '', look: null } : who, pc = $('portrait');
  $('dlg-who').textContent = sp.name; $('dlg-who').hidden = !sp.name;
  pc.hidden = !sp.look;
  if (sp.look || sp.portrait) {
    const make = Sprites.PORTRAITS[sp.portrait] || Sprites.PORTRAITS._reserva, src = make(expr || 'neutro');
    if (pc.width !== src.width) { pc.width = src.width; pc.height = src.height; }
    pc.dataset.expr = expr || 'neutro'; pc.dataset.who = Sprites.PORTRAITS[sp.portrait] ? sp.portrait : '_reserva'; pc.classList.add('square');
    const g = pc.getContext('2d'); g.clearRect(0, 0, pc.width, pc.height); g.drawImage(src, 0, 0);
  }
  $('dlg-text').classList.toggle('narr', who === 'narr');
}
/* "[contente]Texto" → expressão + texto. */
const splitExpr = t => { const m = /^\[(neutro|desconfiado|contente|emocionado|concentrada|triste|surpresa|sorriso|envergonhado)\]/.exec(t); return m ? [m[1], t.slice(m[0].length)] : [null, t]; };
function say(who, text) {
  return new Promise(resolve => {
    const [expr, rest] = splitExpr(String(text)); text = fmt(rest); setSpeaker(who, expr);
    $('dlg-choices').replaceChildren(); $('dlg-form').hidden = true; $('dlg-more').hidden = false;
    const box = $('dlg-text'), myRun = dlgRun; let n = 0;
    clearInterval(typer); box.textContent = ''; shownRun = myRun;
    const finish = () => { clearInterval(typer); typer = 0; if (dlgRun === myRun) box.textContent = text; };
    typer = setInterval(() => { if (dlgRun !== myRun) return finish(); n += 2; box.textContent = text.slice(0, n); if (n >= text.length) finish(); }, 16);
    onAdvance = () => { if (dlgRun !== myRun) return; if (typer) finish(); else { onAdvance = null; resolve(); } };
  });
}
/* Pergunta com opções, sem precisar avançar o texto antes. */
/* Confirmação Sim/Não: E e Esc valem "Não". */
function ask(text, labels) { return choose(labels, labels.findIndex(l => /^Não\b/.test(l)), { who: 'narr', text }); }
/* cancel = índice da opção que E/Esc escolhem (ou -1: escolha obrigatória, sem atalho). */
let cancelChoice = null;
/* prompt = { who, text }: quem pergunta e o quê. Sem prompt, as opções só podem
   aparecer depois de uma fala desta mesma conversa (nunca com o conteúdo da anterior). */
function choose(labels, cancel = -1, prompt = null) {
  return new Promise(resolve => {
    if (prompt) { const [expr, rest] = splitExpr(String(prompt.text)); setSpeaker(prompt.who, expr); clearInterval(typer); typer = 0; $('dlg-text').textContent = fmt(rest); shownRun = dlgRun; }
    else if (shownRun !== dlgRun) { setSpeaker('narr'); clearInterval(typer); typer = 0; $('dlg-text').textContent = ''; }
    $('dlg-form').hidden = true;
    onAdvance = null; $('dlg-more').hidden = true;
    const box = $('dlg-choices'); box.replaceChildren();
    const pick = i => { cancelChoice = null; box.replaceChildren(); resolve(i); };
    labels.forEach((label, i) => box.append(btn('btn', fmt(label), e => { e.stopPropagation(); pick(i); })));
    cancelChoice = cancel >= 0 ? () => pick(cancel) : null;
    box.firstChild.focus();
  });
}
/* Pede um nome curto (galinha, bicho). Valida como os outros nomes; vazio usa o padrão. */
/* Pergunta um nome na caixa de diálogo. kind = regra de nome ('hen' só letras de A a Z;
   'pet' a regra anterior). suggest vem preenchido (Enter aceita); keep = nome atual,
   mantido se o campo ficar vazio (renomear sem mudar). Nome vazio ou inválido não passa. */
function askText(who, text, suggest, kind = 'pet', keep = null) {
  return new Promise(resolve => {
    { const [expr, rest] = splitExpr(String(text)); setSpeaker(who, expr); clearInterval(typer); typer = 0; $('dlg-text').textContent = fmt(rest); shownRun = dlgRun; }
    onAdvance = null; $('dlg-more').hidden = true; $('dlg-choices').replaceChildren();
    const form = $('dlg-form'), input = $('dlg-input'), msg = $('dlg-msg'); form.hidden = false;
    const strict = STRICT_KINDS.includes(kind);
    input.value = strict && keep === null && nameOk(suggest, kind) ? suggest : ''; input.placeholder = keep !== null ? keep : suggest; msg.textContent = ''; input.focus();
    input.oninput = () => { const r = cleanName(input.value, kind); if (r.value !== input.value) input.value = r.value; msg.textContent = r.msg; };
    form.onsubmit = e => {
      e.preventDefault();
      const v = cleanName(input.value, kind).value.trim();
      if (!v && keep !== null) { done(keep); return; }
      if (!v && !strict) { done(suggest); return; }          // bicho de estimação: vazio usa a sugestão, como antes
      if (!nameOk(v, kind)) { msg.textContent = v || !STRICT_KINDS.includes(kind) ? (STRICT_KINDS.includes(kind) ? NAME_RULE_MSG : 'Digite um nome.') : 'Digite um nome. ' + NAME_RULE_MSG; input.focus(); return; }
      done(v);
    };
    const done = v => { form.hidden = true; form.onsubmit = null; input.oninput = null; input.blur(); msg.textContent = ''; resolve(v); };
  });
}
$('dlg-form').addEventListener('submit', e => e.preventDefault());     // nunca recarrega a página, mesmo com Enter repetido
$('dialog').addEventListener('click', e => { if (!e.target.closest('button, input, form') && onAdvance) onAdvance(); });
/* Cada conversa tem um número. Ao começar e ao terminar, a caixa é limpa (nome,
   retrato, texto, opções), e falas, digitação ou cliques atrasados de uma conversa
   antiga não conseguem mexer na seguinte. Só uma conversa por vez. */
let dlgRun = 0, shownRun = -1;
function clearDialog() {
  clearInterval(typer); typer = 0; onAdvance = null; cancelChoice = null;
  $('dlg-who').textContent = ''; $('dlg-who').hidden = true; $('portrait').hidden = true;
  $('dlg-text').textContent = ''; $('dlg-choices').replaceChildren(); $('dlg-form').hidden = true; $('dlg-more').hidden = true;
}
async function run(flow) {
  if (busy) return;
  busy = true; dlgRun++; clearDialog(); $('dialog').hidden = false; $('dock').hidden = true;
  try { await flow(); }
  finally { busy = false; dlgRun++; clearDialog(); $('dialog').hidden = true; $('dock').hidden = false; save(); renderHud(); renderHotbar(); }
}
async function sayAll(who, lines) { for (const l of lines) await say(who, l); }
function toast(text) { const t = el('div', 'toast', text); $('toasts').append(t); while ($('toasts').children.length > 4) $('toasts').firstChild.remove(); setTimeout(() => t.remove(), 2300); }
