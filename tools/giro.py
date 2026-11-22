# Monta os quadros da cesta girando (topo) a partir de uma grade 4x4 já sem fundo (Magnific).
# Uso: python3 tools/giro.py <grade.png> <nn> <largura_da_celula> <altura_da_celula>
# Saída: public/img/giro/<nn>.webp (sprite 4x4, 500 px por quadro), <nn>-0.webp e <nn>-0p.webp (1º quadro) e medidas em src/data/medidas-v3.json
import sys, json, os
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
src, nn, CW, CH = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
g = Image.open(src).convert('RGBA')
cells, bx = [], [CW, CH, 0, 0]
for i in range(16):
    c = np.array(g.crop(((i % 4) * CW, (i // 4) * CH, (i % 4 + 1) * CW, (i // 4 + 1) * CH)))
    al = c[:, :, 3]; lab, n = ndi.label(al > 50)
    if n > 1:  # fica só a peça maior (tira resto de vizinho e de pedestal)
        tam = ndi.sum(al > 50, lab, range(1, n + 1)); k = 1 + int(np.argmax(tam))
        c[:, :, 3] = np.where(ndi.binary_dilation(lab == k, iterations=4), al, 0)
    ys, xs = np.where(c[:, :, 3] > 30)
    bx = [min(bx[0], xs.min()), min(bx[1], ys.min()), max(bx[2], xs.max() + 1), max(bx[3], ys.max() + 1)]
    cells.append(Image.fromarray(c))
bx = [max(0, bx[0] - 3), max(0, bx[1] - 3), min(CW, bx[2] + 3), min(CH, bx[3] + 3)]
fw, fh = bx[2] - bx[0], bx[3] - bx[1]
FW = 500; FH = round(fh * FW / fw)
sp = Image.new('RGBA', (FW * 4, FH * 4), (0, 0, 0, 0))
for i, c in enumerate(cells): sp.paste(c.crop(bx).resize((FW, FH), Image.LANCZOS), ((i % 4) * FW, (i // 4) * FH))
P = 'public/img/giro/'; os.makedirs(P, exist_ok=True)
f0 = cells[0].crop(bx); f0.thumbnail((700, 760), Image.LANCZOS); f0.save(P + f'{nn}-0.webp', 'WEBP', quality=80, method=6)
p0 = f0.copy(); p0.thumbnail((420, 460), Image.LANCZOS); p0.save(P + f'{nn}-0p.webp', 'WEBP', quality=76, method=6)
sp.save(P + f'{nn}.webp', 'WEBP', quality=52, method=6, alpha_quality=70)
M = 'src/data/medidas-v3.json'; med = json.load(open(M)) if os.path.exists(M) else {}
med['giro' + nn] = [FW, FH, f0.size[0], f0.size[1]]; json.dump(med, open(M, 'w'))
print(nn, 'quadro', FW, FH, 'primeiro', f0.size, 'sprite', os.path.getsize(P + f'{nn}.webp') // 1024, 'KB')
