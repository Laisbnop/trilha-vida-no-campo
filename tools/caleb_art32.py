# Caleb: folha de sprites a partir da folha aprovada das quatro vistas (frente, costas, perfil esquerdo e direito).
# A folha aprovada é pixel art ampliada (cerca de 12,35 px de imagem por pixel): cada vista é lida na grade nativa
# (um ponto no centro de cada bloco, sem misturar cores), com as cores e o acabamento aprovados, e centralizada num
# quadro de 32x68 com fundo transparente (figura de 24x68, os pés na última linha).
# A caminhada sai dessas vistas: um pé sobe e a mão do outro lado vem à frente (frente e costas); de perfil, as pernas
# abrem em "V" (a de trás mais escura) e a mão balança. Cabelo e corpo não mudam entre os quadros.
# Uso: python3 tools/caleb_art32.py <folha-4-vistas.webp> assets/caleb-sprites.png [--embed] [--preview]
import sys, json, base64, io, os
import numpy as np
from PIL import Image
W, H = 32, 68
GRID = dict(s=12.35, ox=4, oy=4)
VIEWS = {'down': (9, 32), 'up': (43, 66), 'left': (79, 101), 'right': (112, 134)}   # colunas de cada vista na grade
OUT = None

def read_sheet(path):
    im = Image.open(path).convert('RGBA'); a = np.asarray(im).astype(int); s, ox, oy = GRID['s'], GRID['ox'], GRID['oy']
    GW, GH = int((im.width - ox) / s), int((im.height - oy) / s); g = np.zeros((GH, GW, 4), np.uint8)
    for j in range(GH):
        for i in range(GW):
            x, y = int(ox + (i + .5) * s), int(oy + (j + .5) * s); c = np.median(a[y - 3:y + 4, x - 3:x + 4].reshape(-1, 4), 0)
            if c[3] > 128: g[j, i, :3] = c[:3]; g[j, i, 3] = 255
    return g
def view(g, c0, c1):
    rows = np.where(g[..., 3].any(1))[0]; sub = g[rows.min():rows.max() + 1, c0:c1 + 1]
    out = np.zeros((H, W, 4), np.uint8); h, w = sub.shape[:2]; x = (W - w) // 2; out[H - h:, x:x + w] = sub[-H:]
    return out

def is_skin(c): return c[3] > 0 and c[0] > 140 and c[0] - c[2] > 45
def shift_region(v, x0, x1, y0, y1, dx, dy, dark=1.0):
    src = v[y0:y1 + 1, x0:x1 + 1].copy(); out = v.copy(); out[y0:y1 + 1, x0:x1 + 1] = 0
    for j in range(src.shape[0]):
        for i in range(src.shape[1]):
            if src[j, i, 3] == 0: continue
            y, x = y0 + j + dy, x0 + i + dx
            if 0 <= y < H and 0 <= x < W:
                c = src[j, i].copy()
                if dark != 1.0 and c[:3].max() > 30: c[:3] = (c[:3] * dark).astype(np.uint8)
                out[y, x] = c
    return out
def move_hand(v, xs, dy=0, dx=0):
    """move só a mão (pele nas linhas dos punhos); o vão fica com o tom de cima (punho)"""
    out = v.copy(); pts = [(y, x) for y in range(38, 54) for x in xs if is_skin(v[y, x])]
    for y, x in pts: out[y, x] = v[y - 1, x] if not is_skin(v[y - 1, x]) else v[y - 2, x]
    for y, x in pts:
        ny, nx = y + dy, x + dx
        if 0 <= ny < H and 0 <= nx < W: out[ny, nx] = v[y, x]
    return out
def legs_box(v):
    xs = [x for x in range(W) if v[56:, x, 3].any()]; return min(xs), max(xs)
LEG0 = 50                                                    # onde começam as pernas (abaixo da barra do moletom)
def walk_front(v, side):
    x0, x1 = legs_box(v); mid = (x0 + x1) // 2
    if side == 0: o = shift_region(v, x0, mid, LEG0, H - 1, 0, -2); o = move_hand(o, range(mid, W), dy=-1)
    else: o = shift_region(v, mid + 1, x1, LEG0, H - 1, 0, -2); o = move_hand(o, range(0, mid + 1), dy=-1)
    return o
def walk_side(v, face_left, front_near):
    x0, x1 = legs_box(v); mid = (x0 + x1) // 2; fwd = -1 if face_left else 1
    fx = (x0, mid) if face_left else (mid + 1, x1); bx = (mid + 1, x1) if face_left else (x0, mid)
    out = v.copy()
    for (a, b), d, dark in ((bx, -fwd, 0.72), (fx, fwd, 1.0)):
        for y0, y1, step in ((LEG0 + 2, LEG0 + 5, 1), (LEG0 + 6, LEG0 + 10, 2), (LEG0 + 11, H - 1, 3)):
            out = shift_region(out, a, b, y0, y1, step * d, 0, dark if y0 == LEG0 + 2 else 1.0)
    return move_hand(out, range(W), dx=(1 if front_near else -1) * fwd)

if __name__ == '__main__':
    src, out_path = sys.argv[1:3]
    g = read_sheet(src); V = {d: view(g, *cols) for d, cols in VIEWS.items()}
    frames = {'down': [V['down'], walk_front(V['down'], 0), walk_front(V['down'], 1)],
              'up': [V['up'], walk_front(V['up'], 1), walk_front(V['up'], 0)],
              'left': [V['left'], walk_side(V['left'], True, True), walk_side(V['left'], True, False)],
              'right': [V['right'], walk_side(V['right'], False, True), walk_side(V['right'], False, False)]}
    order = ['down', 'up', 'left', 'right']
    sheet = Image.new('RGBA', (W * 3, H * 4), (0, 0, 0, 0))
    for r, d in enumerate(order):
        for i, f in enumerate(frames[d]): sheet.alpha_composite(Image.fromarray(f, 'RGBA'), (i * W, r * H))
    sheet.save(out_path)
    if '--embed' in sys.argv:
        js = os.path.join(os.path.dirname(__file__), '..', 'js', 'caleb-art.js'); text = open(js).read()
        data = json.loads(text[text.index('{'):text.rindex('}') + 1])
        def b64(im):
            b = io.BytesIO(); im.save(b, 'PNG', optimize=True); return 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()
        data['h'] = H // 2                                                    # altura no mundo: 34 (dois pixels do desenho por pixel do mundo)
        data['frames'] = {'2': {d: [b64(sheet.crop((i * W, r * H, i * W + W, r * H + H))) for i in range(3)] for r, d in enumerate(order)}}
        open(js, 'w').write(text[:text.index('const CALEB_ART')] + 'const CALEB_ART = ' + json.dumps(data) + ';\n')
    if '--preview' in sys.argv:
        Z = 6; prev = Image.new('RGBA', ((W + 2) * 12 * Z, H * Z), (232, 222, 196, 255))
        for r, d in enumerate(order):
            for i in range(3): prev.alpha_composite(sheet.crop((i * W, r * H, i * W + W, r * H + H)).resize((W * Z, H * Z), Image.NEAREST), ((r * 3 + i) * (W + 2) * Z, 0))
        prev.save('preview.png')
