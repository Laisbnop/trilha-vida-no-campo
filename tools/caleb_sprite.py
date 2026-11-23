# Caleb: sprites do mapa desenhados à mão, pixel a pixel, na grade de 16x32 (cada quadro), a partir da ficha aprovada
# (moletom preto com capuz abaixado, cordões e bolso canguru, calça e botas pretas, cabelo preto volumoso e espetado com
# franja sobre o olho direito dele). Tons de grafite separam braços, tronco, pernas e botas.
# Folha: 4 direções (down, up, left, right) x 3 quadros (parado, passo 1, passo 2), pés sempre na última linha.
# Uso: python3 tools/caleb_sprite.py assets/caleb-sprites.png --embed [--preview]
# --embed também copia os quadros para js/caleb-art.js (embutidos, para o jogo funcionar aberto direto do arquivo).
import copy, sys
from PIL import Image
W, H = 16, 32
PAL = {
 'O': '#0b0a0e',                                                          # contorno
 'H': '#251c2b', 'h': '#45355a', 'd': '#120d16',                          # cabelo preto com reflexo violeta (como nos retratos)
 'S': '#e2a473', 's': '#b8784e', 'n': '#6e4230', 'E': '#6e6a3a', 'w': '#e8e6ee', 'e': '#16121a', 'm': '#a86a5e',
 'J': '#2f2c37', 'L': '#45414f', 'D': '#1c1b22', 'k': '#66626f', 'C': '#3a3744', 'c': '#26242d',   # moletom grafite
 'P': '#27252e', 'R': '#3d3a47', 'Q': '#18171d',                          # calça
 'K': '#1b1a20', 'G': '#383540',                                          # botas
}
def parse(lines):
    assert len(lines) == H, len(lines)
    for i, l in enumerate(lines): assert len(l) == W, (i, len(l), l)
    return [list(l) for l in lines]

FRONT = [
 "......H.........",   # 0  topete
 "....HHHHHH.HH...",   # 1
 "...HHhHHHHHHHH..",   # 2
 "..HHhhHHHHhHHHH.",   # 3
 ".HHhHHHHhHHHHHH.",   # 4  pontas dos lados
 "..HHHHHhHHHhHHH.",   # 5
 "..HHHHhHHHHHhHH.",   # 6
 ".HHHHhHHHdHHHHH.",   # 7
 "..HHHhHHdsSdHH..",   # 8  testa sob a franja
 "..HSHHHHdEwsH...",   # 9  orelha, franja sobre o olho direito; olho esquerdo verde
 "..HsHHdSSSSsH...",   # 10
 "...HHHSSSSsHH...",   # 11 queixo
 "...JLLnnnLLJ....",   # 12 gola do capuz e sombra do pescoço
 "...JLLDSSDLLJ...",   # 13
 "...JLJJkDDkJJD..",   # 14 cordões
 "..JLJJJkDDkJJJD.",   # 15 ombros
 "..JLDJJkJJkJDJD.",   # 16 braços separados do tronco
 "..JLDJJJJJJJDJD.",   # 17
 "..JLDJJJJJJJDJD.",   # 18
 "..JLDJDDDDDJDJD.",   # 19 bolso canguru
 "..CcDJDJJJDJDCc.",   # 20 punhos
 "..SsCCDDDDDCCSs.",   # 21 mãos e barra
 "..ss.CCCCCCC.ss.",   # 22
 "....RPPPPPPQ....",   # 23 calça
 "....RPPPPPPQ....",   # 24
 "....RPPQRPPQ....",   # 25 pernas
 "....RRPQRRPQ....",   # 26
 "....RPPQRPPQ....",   # 27
 "....PRPQPRPQ....",   # 28
 "...GKKK..GKKK...",   # 29 botas
 "...KKKK..KKKK...",   # 30
 "...KKKK..KKKK...",   # 31
]
BACK = [
 "......H.........",
 "....HHHHHH.HH...",
 "...HHhHHHHHHHH..",
 "..HHhhHHHHhHHHH.",
 ".HHhHHHHhHHHHHH.",
 "..HHHHhHHHhHHHH.",
 "..HHHhHHHHHhHHH.",
 ".HHHhHHHdHHHhHH.",
 "..HHHHHdHHHHHH..",
 "..HSHHdHHdHHSH..",   # 9  orelhas aparecem dos lados
 "..HsHHHHHHHHsH..",
 "...HdHHdHHdHH...",   # 11 nuca em pontas
 "...JLLLLLLLJ....",   # 12 capuz abaixado nas costas
 "...JLDDDDDDLJ...",   # 13
 "...JLDDDDDDLJD..",   # 14
 "..JLJLDDDDLJJJD.",   # 15
 "..JLDJLDDLJJDJD.",   # 16 ponta do capuz
 "..JLDJJLLJJJDJD.",   # 17
 "..JLDJJJJJJJDJD.",   # 18
 "..JLDJJJJJJJDJD.",   # 19
 "..CcDJJJJJJJDCc.",   # 20
 "..SsCCJJJJJCCSs.",   # 21
 "..ss.CCCCCCC.ss.",   # 22
 "....RPPPPPPQ....",
 "....RPPPPPPQ....",
 "....RPPQRPPQ....",
 "....RRPQRRPQ....",
 "....RPPQRPPQ....",
 "....PRPQPRPQ....",
 "...GKKK..GKKK...",
 "...KKKK..KKKK...",
 "...KKKK..KKKK...",
]
# perfil olhando para a esquerda: lado esquerdo dele (a franja vai para o outro lado; olho e orelha à mostra)
LEFT = [
 ".......H........",
 ".....HHHHH.H....",
 "....HHhHHHHHH...",
 "...HhhHHHHHhHH..",
 "..HhHHHHHhHHHHH.",
 "..HHHHhHHHHHHHH.",
 ".HHHHhHHHHHhHH..",
 "..HHhHHHHHHHHHH.",
 "..HdsSSdHHHhHH..",   # 8  franja curta na frente, testa
 "..HSEwSSSHHHH...",   # 9  olho
 "..sSSSSSSsHHH...",   # 10 nariz à frente
 "...SSmSSSsHH....",   # 11 boca contida
 "....SSSnsLLJ....",   # 12 queixo e capuz embolado atrás
 ".....DSSLLLJ....",   # 13
 ".....JJJJLLJD...",   # 14
 "....JJJLJJJJD...",   # 15
 "....JJDLJDJJD...",   # 16 braço à frente do tronco
 "....JJDLJDJJD...",   # 17
 "....JJDLJDJJD...",   # 18
 "....JJDLJDJJD...",   # 19
 "....JJDCcDJJD...",   # 20 punho
 "....CCCSsCCCC...",   # 21 mão e barra
 ".....CCssCCC....",   # 22
 ".....RPPPPQ.....",   # 23
 ".....RPPPPQ.....",   # 24
 "......RPPQ......",   # 25
 "......RRPQ......",   # 26
 "......RPPQ......",   # 27
 "......PRPQ......",   # 28
 ".....GKKKK......",   # 29
 "....GKKKKK......",   # 30
 "....KKKKKK......",   # 31
]
# perfil olhando para a direita: lado direito dele (a franja longa cai na frente do olho)
RIGHT = [
 "........H.......",
 "....H.HHHHH.....",
 "...HHHHHHhHH....",
 "..HHhHHHHHhhH...",
 ".HHHHHhHHHHHhH..",
 ".HHHHHHHHHhHHH..",
 "..HHhHHHHHHhHHH.",
 ".HHHHHHHHHHHhH..",
 "..HHhHHHdHHHHdH.",   # 8  franja longa descendo na frente
 "...HHHHSHHHHHd..",   # 9  orelha; a franja desce até o olho
 "...HHHHsSSwESS..",   # 10 olho logo abaixo da franja, nariz à frente
 "....HHsSSSSSSs..",   # 11
 "....JLLnSSSmS...",   # 12 boca contida; capuz embolado atrás
 "....JLLLSSSD....",   # 13
 "...DJLLJJJJ.....",   # 14
 "...DJJJJLJJJ....",   # 15
 "...DJJDJLDJJ....",   # 16
 "...DJJDJLDJJ....",   # 17
 "...DJJDJLDJJ....",   # 18
 "...DJJDJLDJJ....",   # 19
 "...DJJDcCDJJ....",   # 20
 "...CCCCsSCCC....",   # 21
 "....CCCssCC.....",   # 22
 ".....QPPPPR.....",   # 23
 ".....QPPPPR.....",   # 24
 "......QPPR......",   # 25
 "......QPRR......",   # 26
 "......QPPR......",   # 27
 "......QPRP......",   # 28
 "......KKKKG.....",   # 29
 "......KKKKKG....",   # 30
 "......KKKKKK....",   # 31
]

def outline(G):
    out = [r[:] for r in G]
    for y in range(H):
        for x in range(W):
            if G[y][x] != '.': continue
            if any(0 <= x + dx < W and 0 <= y + dy < H and G[y + dy][x + dx] != '.' for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))): out[y][x] = 'O'
    return out
def shift_up(G, x0, x1, y0, y1):
    """a parte [x0..x1] x [y0..y1] sobe um pixel (pé que dá o passo / mão que vem à frente)"""
    for y in range(y0, y1):
        for x in range(x0, x1 + 1): G[y][x] = G[y + 1][x]
    for x in range(x0, x1 + 1): G[y1][x] = '.'
def walk_front(G, side):
    A = copy.deepcopy(G)
    if side == 0: shift_up(A, 3, 7, 25, 31); shift_up(A, 13, 14, 20, 22)    # pé esquerdo sobe; a mão do outro lado vem à frente
    else: shift_up(A, 8, 12, 25, 31); shift_up(A, 2, 3, 20, 22)
    return A
def walk_side(G, face_left, front):
    """perfil: pernas em passada (a de trás mais escura) e braço balançando ao contrário"""
    A = copy.deepcopy(G)
    legs = [
     ".....RPPPPQ.....",   # 24
     ".....RPQRPQ.....",   # 25
     "....RPQ..RPQ....",   # 26
     "....RPQ..RPQ....",   # 27
     "...RPQ....RPQ...",   # 28
     "..GKKK....GKKK..",   # 29
     "..KKKK....KKKK..",   # 30
     "..KKKK....KKKK..",   # 31
    ]
    if not face_left: legs = [l[::-1].replace('R', '#').replace('Q', 'R').replace('#', 'Q').replace('G', '%').replace('%', 'G') for l in legs]
    for i, l in enumerate(legs): A[24 + i] = list(l)
    hand = (-1 if front else 1) * (1 if face_left else -1)                   # a mão vai para a frente ou para trás
    for y in (20, 21, 22):
        row = A[y][:]; skin = [x for x in range(W) if row[x] in 'Ss']; cuff = [x for x in range(W) if row[x] in 'Cc' and y == 20]
        for x in skin + cuff: A[y][x] = 'C' if y >= 21 else 'J'
        for x in skin + cuff:
            nx = x + hand * 2
            if 0 <= nx < W: A[y][nx] = row[x]
    return A

def strands(G, lines):
    """reflexo do cabelo em mechas contínuas (em vez de pontinhos): limpa os reflexos soltos e traça as linhas"""
    for y in range(0, 9):
        for x in range(W):
            if G[y][x] == 'h': G[y][x] = 'H'
    for pts in lines:
        for x, y in pts:
            if G[y][x] in 'Hh': G[y][x] = 'h'
    return G
frames = {}
F, B, L, R = parse(FRONT), parse(BACK), parse(LEFT), parse(RIGHT)
strands(B, [[(5, 2), (4, 3), (3, 4)], [(8, 2), (7, 3), (6, 4), (6, 5)], [(10, 3), (11, 4), (11, 5)], [(5, 6), (4, 7)], [(10, 6), (11, 7)]])
strands(L, [[(6, 2), (5, 3), (4, 4)], [(9, 2), (8, 3), (7, 4), (6, 5), (5, 6)], [(11, 3), (12, 4), (12, 5)], [(10, 6), (11, 7)]])
strands(R, [[(9, 2), (10, 3), (11, 4)], [(6, 2), (7, 3), (8, 4), (9, 5), (10, 6)], [(4, 3), (3, 4), (3, 5)], [(5, 6), (4, 7)]])
frames['down'] = [F, walk_front(F, 0), walk_front(F, 1)]
frames['up'] = [B, walk_front(B, 1), walk_front(B, 0)]
frames['left'] = [L, walk_side(L, True, True), walk_side(L, True, False)]
frames['right'] = [R, walk_side(R, False, True), walk_side(R, False, False)]

def img(G):
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); P = im.load()
    for y in range(H):
        for x in range(W):
            c = G[y][x]
            if c != '.': h = PAL[c]; P[x, y] = (int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16), 255)
    return im

if __name__ == '__main__':
    order = ['down', 'up', 'left', 'right']
    sheet = Image.new('RGBA', (W * 3, H * 4), (0, 0, 0, 0))
    for r, d in enumerate(order):
        for i, G in enumerate(frames[d]): sheet.alpha_composite(img(outline(G)), (i * W, r * H))
    sheet.save(sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('--') else 'caleb-sprites.png')
    if '--embed' in sys.argv:
        import json, base64, io, os
        js = os.path.join(os.path.dirname(__file__), '..', 'js', 'caleb-art.js'); src = open(js).read()
        data = json.loads(src[src.index('{'):src.rindex('}') + 1])
        def b64(im):
            b = io.BytesIO(); im.save(b, 'PNG', optimize=True); return 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()
        data['h'] = H; data['frames'] = {'1': {d: [b64(sheet.crop((i * W, r * H, i * W + W, r * H + H))) for i in range(3)] for r, d in enumerate(order)}}
        open(js, 'w').write(src[:src.index('const CALEB_ART')] + 'const CALEB_ART = ' + json.dumps(data) + ';\n')
    if '--preview' in sys.argv:
        Z = 10; prev = Image.new('RGBA', (W * 12 * Z + 11 * Z, H * Z), (236, 226, 200, 255))
        for r, d in enumerate(order):
            for i in range(3):
                f = sheet.crop((i * W, r * H, i * W + W, r * H + H)).resize((W * Z, H * Z), Image.NEAREST)
                prev.alpha_composite(f, ((r * 3 + i) * (W + 1) * Z, 0))
        prev.save('preview.png')
