# Caleb: retratos de diálogo (128x128, fundo transparente) a partir das quatro expressões da ficha aprovada.
# Cada expressão é recortada da ficha, o fundo creme sai (preenchimento a partir das bordas) e a redução usa a cor
# mais frequente de cada bloco (sem suavização), com a paleta reduzida para manter os pixels nítidos.
# Uso: python3 tools/caleb_portraits.py ficha.webp assets/ --embed
import sys, os, json, base64, io
import numpy as np
from PIL import Image
EXPR = {'neutro': (102, 101, 497, 527), 'sorriso': (528, 101, 938, 527), 'contente': (100, 541, 505, 980), 'envergonhado': (528, 541, 938, 980)}
N = 128
def no_background(im):
    a = np.asarray(im.convert('RGBA')).copy(); h, w, _ = a.shape; bg = a[2, 2, :3].astype(int)
    near = (np.abs(a[..., :3].astype(int) - bg).sum(2) < 60)
    seen = np.zeros((h, w), bool); stack = [(0, x) for x in range(w)] + [(h - 1, x) for x in range(w)] + [(y, 0) for y in range(h)] + [(y, w - 1) for y in range(h)]
    while stack:
        y, x = stack.pop()
        if y < 0 or x < 0 or y >= h or x >= w or seen[y, x] or not near[y, x]: continue
        seen[y, x] = True; stack += [(y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)]
    a[seen, 3] = 0
    return Image.fromarray(a, 'RGBA')
def majority(im, Wd, Ht):
    a = np.asarray(im).astype(int); h, w, _ = a.shape; out = np.zeros((Ht, Wd, 4), np.uint8); sy, sx = h / Ht, w / Wd
    for j in range(Ht):
        y0, y1 = int(j * sy), max(int(j * sy) + 1, int((j + 1) * sy))
        for i in range(Wd):
            x0, x1 = int(i * sx), max(int(i * sx) + 1, int((i + 1) * sx))
            blk = a[y0:y1, x0:x1].reshape(-1, 4); op = blk[blk[:, 3] > 128]
            if len(op) * 2 < len(blk): continue
            q = op[:, :3] // 20; keys = q[:, 0] * 10000 + q[:, 1] * 100 + q[:, 2]
            vals, cnt = np.unique(keys, return_counts=True); sel = op[keys == vals[cnt.argmax()]][:, :3]
            out[j, i, :3] = sel.mean(0).round(); out[j, i, 3] = 255
    return Image.fromarray(out, 'RGBA')
def portrait(ficha, box):
    x0, y0, x1, y1 = box; im = no_background(ficha.crop(box)); s = max(im.width, im.height)
    sq = Image.new('RGBA', (s, s), (0, 0, 0, 0)); sq.alpha_composite(im, ((s - im.width) // 2, s - im.height))
    p = majority(sq, N, N)
    return p.quantize(colors=48, method=Image.Quantize.FASTOCTREE).convert('RGBA') if False else p
if __name__ == '__main__':
    ficha = Image.open(sys.argv[1]).convert('RGBA'); out = sys.argv[2]
    ps = {e: portrait(ficha, b) for e, b in EXPR.items()}
    sheet = Image.new('RGBA', (N * 4, N), (0, 0, 0, 0))
    for i, (e, p) in enumerate(ps.items()): p.save(os.path.join(out, f'caleb-retrato-{e}.png')); sheet.alpha_composite(p, (i * N, 0))
    sheet.save(os.path.join(out, 'caleb-retratos.png'))
    if '--embed' in sys.argv:
        js = os.path.join(os.path.dirname(__file__), '..', 'js', 'caleb-art.js'); src = open(js).read()
        data = json.loads(src[src.index('{'):src.rindex('}') + 1])
        def b64(im):
            b = io.BytesIO(); im.save(b, 'PNG', optimize=True); return 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()
        data['portraits'] = {e: b64(p) for e, p in ps.items()}; data['portraitSize'] = N
        open(js, 'w').write(src[:src.index('const CALEB_ART')] + 'const CALEB_ART = ' + json.dumps(data) + ';\n')
