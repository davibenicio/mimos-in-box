# Cesta girando do topo em VÍDEO (qualidade máxima): cor do vídeo original (Kling, 960p) + recorte do Magnific
# (video_remove_background, VP9 com transparência). Tira o suporte branco que o vídeo inventa embaixo da bandeja,
# faz vai-e-vem com freio suave nas pontas e grava um MP4 "empilhado": cor em cima, transparência embaixo
# (o navegador junta as duas metades num canvas WebGL; funciona em todos, inclusive iPhone).
# Uso: python3 tools/giro-video.py <nn> <video_original.mp4> <recorte.webm> [quadro_final]
# Saída: public/video/<nn>-g.mp4 (PC), <nn>-p.mp4 (celular), public/img/giro/<nn>-0.webp e -0p.webp (1º quadro),
# sprite de reserva public/img/giro/<nn>.webp e medidas em src/data/medidas-v3.json
import sys, os, json, subprocess, tempfile, math
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

nn, src, alf = sys.argv[1], sys.argv[2], sys.argv[3]
fim = int(sys.argv[4]) if len(sys.argv) > 4 else None
tmp = tempfile.mkdtemp()

def quadros(arq, extra, pix, n):
    cmd = ['ffmpeg', '-v', 'error'] + extra + ['-i', arq, '-f', 'rawvideo', '-pix_fmt', pix, '-']
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, 960, 960, n)

cor = quadros(src, [], 'rgb24', 3)
alfa = quadros(alf, ['-c:v', 'libvpx-vp9'], 'rgba', 4)[..., 3]
N = min(len(cor), len(alfa)) if fim is None else fim + 1
cor, alfa = cor[:N], alfa[:N].astype(np.float32)

def limpa(rgb, a):
    # some o suporte branco: em cada coluna, abaixo da última parte rosa (a bandeja/caixa), nada fica
    f = rgb.astype(np.float32) / 255
    mx, mn = f.max(2), f.min(2)
    sat = (mx - mn) / np.maximum(mx, 1e-3)
    tem = (sat > 0.16) & (a > 128) & (mx > 0.25)
    tem = ndi.binary_opening(tem, iterations=2)
    H = a.shape[0]
    fundo = np.full(a.shape[1], -1)
    cols = np.where(tem.any(0))[0]
    for x in cols: fundo[x] = H - 1 - np.argmax(tem[::-1, x])
    if len(cols):
        v = fundo[cols].astype(float)
        v = ndi.median_filter(v, size=31, mode='nearest')
        fundo[cols] = v.astype(int)
        lado = np.where(fundo < 0)[0]
        # colunas sem rosa (só celofane ou só suporte): usa o limite das vizinhas
        if len(lado): fundo[lado] = np.interp(lado, cols, fundo[cols]).astype(int)
    yy = np.arange(H)[:, None]
    corte = np.clip((fundo[None, :] + 6 - yy) / 6.0, 0, 1)   # degrau suave de 6 px
    a = a * corte
    # só a peça maior
    lab, n = ndi.label(a > 40)
    if n > 1:
        tam = ndi.sum(a > 40, lab, range(1, n + 1)); k = 1 + int(np.argmax(tam))
        a = np.where(ndi.binary_dilation(lab == k, iterations=3), a, 0)
    return a

for i in range(N): alfa[i] = limpa(cor[i], alfa[i])
# caixa que contém a cesta em todos os quadros
m = alfa.max(0) > 30
ys, xs = np.where(m)
x0, x1, y0, y1 = max(0, xs.min() - 4), min(960, xs.max() + 5), max(0, ys.min() - 4), min(960, ys.max() + 5)
cw, ch = x1 - x0, y1 - y0
print(nn, 'quadros', N, 'caixa', cw, ch)

# vai e volta com freio nas pontas: meio ciclo = N quadros * 1.15 (24 qps)
meio = round(N * 1.15); seq = []
for k in range(2 * meio):
    t = k / meio * math.pi
    seq.append(round((N - 1) * (0.5 - 0.5 * math.cos(t))))

def grava(larg, nome, crf):
    alt = round(ch * larg / cw); alt += alt % 2; larg += larg % 2
    d = os.path.join(tmp, nome); os.makedirs(d, exist_ok=True)
    cache = {}
    for j, i in enumerate(seq):
        if i not in cache:
            c = Image.fromarray(cor[i, y0:y1, x0:x1]).resize((larg, alt), Image.LANCZOS)
            a = Image.fromarray(alfa[i, y0:y1, x0:x1].astype(np.uint8)).resize((larg, alt), Image.LANCZOS)
            # cor "sangra" para fora do recorte, senão a borda puxa o creme do fundo do vídeo
            arr = np.array(c).astype(np.float32); aa = np.array(a).astype(np.float32) / 255
            dentro = aa > 0.6
            if (~dentro).any():
                idx = ndi.distance_transform_edt(~dentro, return_distances=False, return_indices=True)
                viz = arr[idx[0], idx[1]]
                arr = np.where(dentro[..., None], arr, viz)
            pilha = np.zeros((alt * 2, larg, 3), np.uint8)
            pilha[:alt] = arr.clip(0, 255).astype(np.uint8)
            pilha[alt:] = np.array(a)[..., None]
            p = os.path.join(d, f'q{i:04d}.png'); Image.fromarray(pilha).save(p, compress_level=1); cache[i] = p
        os.symlink(cache[i], os.path.join(d, f's{j:05d}.png'))
    out = f'public/video/{nn}-{nome}.mp4'; os.makedirs('public/video', exist_ok=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', '24', '-i', os.path.join(d, 's%05d.png'), '-c:v', 'libx264', '-preset', 'veryslow',
                    '-crf', str(crf), '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-tune', 'film', '-movflags', '+faststart', '-an', out], check=True)
    print(out, larg, alt, os.path.getsize(out) // 1024, 'KB')
    return larg, alt

gw, gh = grava(min(cw, 760), 'g', 21)
pw, ph = grava(440, 'p', 23)

# 1º quadro (imagem do topo e reserva) e sprite de reserva (32 quadros) com o mesmo enquadramento
def rgba(i):
    return Image.fromarray(np.dstack([cor[i, y0:y1, x0:x1], alfa[i, y0:y1, x0:x1].astype(np.uint8)]))
P = 'public/img/giro/'
f0 = rgba(0); f0.thumbnail((760, 820), Image.LANCZOS); f0.save(P + f'{nn}-0.webp', 'WEBP', quality=84, method=6)
p0 = f0.copy(); p0.thumbnail((440, 480), Image.LANCZOS); p0.save(P + f'{nn}-0p.webp', 'WEBP', quality=78, method=6)
FW = 420; FH = round(ch * FW / cw); COLS = 8; NS = 32
sp = Image.new('RGBA', (FW * COLS, FH * (NS // COLS)), (0, 0, 0, 0))
for k in range(NS):
    i = round(k * (N - 1) / (NS - 1)); sp.paste(rgba(i).resize((FW, FH), Image.LANCZOS), ((k % COLS) * FW, (k // COLS) * FH))
sp.save(P + f'{nn}.webp', 'WEBP', quality=50, method=6, alpha_quality=65)
M = 'src/data/medidas-v3.json'; med = json.load(open(M))
med['giro' + nn] = [int(v) for v in (FW, FH, f0.size[0], f0.size[1], NS, COLS, gw, gh, pw, ph)]
json.dump(med, open(M, 'w'))
print('ok', med['giro' + nn])
