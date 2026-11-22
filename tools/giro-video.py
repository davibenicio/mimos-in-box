# Cesta girando do topo em VÍDEO, na melhor qualidade: vídeo ampliado (Topaz 2x, 1920 px, 60 qps) + recorte do
# Magnific (video_remove_background, VP9 com transparência). Tira o suporte branco que o vídeo inventa embaixo da
# bandeja, faz vai-e-vem com freio suave nas pontas e grava MP4 "empilhado": cor em cima, transparência embaixo
# (o navegador junta as metades num canvas WebGL; funciona em todos, inclusive iPhone). AV1 + H.264 de reserva.
# Uso: python3 tools/giro-video.py <nn> <video_ampliado.mp4> <recorte.webm> [último_quadro]
# Saída: public/video/<nn>-{g,p}{,-av1}.mp4, public/img/giro/<nn>-0.webp, -0p.webp, sprite de reserva <nn>.webp
# e medidas em src/data/medidas-v3.json
import sys, os, json, subprocess, tempfile, math
import numpy as np, cv2
from PIL import Image

nn, src, alf = sys.argv[1], sys.argv[2], sys.argv[3]
# recorte extra (ex.: 'Heavy' + 'Matting'): fica o maior alfa dos dois (miolo sólido e borda fina do celofane)
ALF2 = os.environ.get('RECORTE2')
LIM = int(sys.argv[4]) if len(sys.argv) > 4 and sys.argv[4] != '-' else 10**9   # último quadro usado (corta o fim se o vídeo entorta)
# recorte do modelo 'Matting' (celofane semitransparente): sem a chave por diferença e sem tapar buracos
FINO = os.environ.get('RECORTE', 'fino') == 'fino'
# SUPORTE=placa: o suporte tem a cor do fundo (caixa clara, ex. 29); SUPORTE=cor (padrão): branco/cinza neutro
PELA_PLACA = os.environ.get('SUPORTE', 'cor') == 'placa'
SAT = float(os.environ.get('SAT', '0.12'))   # até que saturação o suporte conta como branco (sobe se ele reflete a bandeja)
S = 1920
tmp = tempfile.mkdtemp(prefix='giro' + nn + '-')

def fluxo(arq, extra, pix, n):
    p = subprocess.Popen(['ffmpeg', '-v', 'error'] + extra + ['-i', arq, '-vf', f'scale={S}:{S}', '-f', 'rawvideo', '-pix_fmt', pix, '-'], stdout=subprocess.PIPE)
    tam = S * S * n
    while True:
        b = p.stdout.read(tam)
        if len(b) < tam: break
        yield np.frombuffer(b, np.uint8).reshape(S, S, n)

# 0ª passada: "placa" do fundo creme do vídeo (mediana dos pixels que nunca são cesta), para achar o celofane
def placa():
    h = S // 2; soma = []
    for i, (c, a) in enumerate(zip(fluxo(src, [], 'rgb24', 3), fluxo(alf, ['-c:v', 'libvpx-vp9'], 'rgba', 4))):
        if i > LIM: break
        if i % 10: continue
        c = cv2.resize(c, (h, h), interpolation=cv2.INTER_AREA).astype(np.float32)
        a = cv2.resize(a[..., 3], (h, h), interpolation=cv2.INTER_AREA)
        c[a > 5] = np.nan; soma.append(c)
    import warnings; warnings.simplefilter('ignore')
    pl = np.nanmedian(np.stack(soma), axis=0); falta = np.isnan(pl[..., 0])
    pl = cv2.inpaint(np.nan_to_num(pl).clip(0, 255).astype(np.uint8), falta.astype(np.uint8), 15, cv2.INPAINT_TELEA)
    return cv2.GaussianBlur(cv2.resize(pl, (S, S), interpolation=cv2.INTER_CUBIC).astype(np.float32), (0, 0), 3)
PLACA = placa() if (PELA_PLACA or not FINO) else None
PLACA_M = cv2.resize(PLACA, (S // 2, S // 2), interpolation=cv2.INTER_AREA) if PLACA is not None else None
PERTO = np.ones((121, 121), np.uint8)

def limpa(rgb, a):
    # celofane transparente: onde o quadro difere do fundo creme, perto da cesta, também é cesta (alfa suave)
    if not FINO:
        d = np.abs(rgb.astype(np.float32) - PLACA).max(2)
        ad = np.clip((d - 7) / 28, 0, 1) * 255
        ad *= cv2.dilate((a > 128).astype(np.uint8), PERTO)
        a = np.maximum(a.astype(np.float32), ad).astype(np.uint8)
    # análise em meia resolução: em cada coluna, abaixo da última parte que não é branco neutro (a bandeja/caixa), sai tudo (o suporte)
    h = S // 2
    r = cv2.resize(rgb, (h, h), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
    al = cv2.resize(a, (h, h), interpolation=cv2.INTER_AREA)
    mx, mn = r.max(2), r.min(2)
    sat = (mx - mn) / np.maximum(mx, 1e-3)
    if PELA_PLACA: suporte = np.abs(r * 255 - PLACA_M).max(2) < 14   # igual ao fundo creme = suporte branco
    else: suporte = (sat < SAT) & (mx > 0.30)    # branco/cinza neutro do suporte (bandeja rosa ou caixa preta)
    tem = ((al > 128) & ~suporte).astype(np.uint8)
    tem = cv2.morphologyEx(tem, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    fundo = np.full(h, -1.0)
    cols = np.where(tem.any(0))[0]
    if len(cols):
        ult = h - 1 - np.argmax(tem[::-1, cols], axis=0)
        from scipy.ndimage import maximum_filter1d
        # o limite nunca sobe acima da cesta: pega o ponto mais baixo das colunas vizinhas (não come os cantos)
        cheio = np.full(h, -1.0); cheio[cols] = ult
        fundo[cols] = maximum_filter1d(cheio, size=13, mode='nearest')[cols]
        falta = np.where(fundo < 0)[0]
        if len(falta): fundo[falta] = np.interp(falta, cols, fundo[cols])
    linha = cv2.resize(fundo.reshape(1, -1).astype(np.float32) * 2, (S, 1), interpolation=cv2.INTER_LINEAR)[0]
    yy = np.arange(S, dtype=np.float32)[:, None]
    corte = np.clip((linha[None, :] + 12 - yy) / 12.0, 0, 1)
    a = a.astype(np.float32) * corte
    # buracos fechados dentro da cesta (celofane que o recorte achou que era fundo) são preenchidos
    from scipy.ndimage import binary_fill_holes
    if not FINO:
        cheio = binary_fill_holes(a > 128)
        a = np.where(cheio & (a < 128), np.maximum(a, 255 * cheio), a)
    # só a peça maior
    m = (a > 40).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
    if n > 2:
        k = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
        keep = cv2.dilate((lab == k).astype(np.uint8), np.ones((7, 7), np.uint8))
        a = a * keep
    return a.clip(0, 255).astype(np.uint8)

# 1ª passada: recorte limpo de cada quadro (guardado em disco) e a caixa que contém a cesta em todos
N = 0; caixa = [S, S, 0, 0]
def alfas():
    f1 = fluxo(alf, ['-c:v', 'libvpx-vp9'], 'rgba', 4)
    if not ALF2:
        for a in f1: yield a[..., 3]
    else:
        for a, b in zip(f1, fluxo(ALF2, ['-c:v', 'libvpx-vp9'], 'rgba', 4)): yield np.maximum(a[..., 3], b[..., 3])
for i, (c, a) in enumerate(zip(fluxo(src, [], 'rgb24', 3), alfas())):
    if i > LIM: break
    al = limpa(c, a)
    cv2.imwrite(f'{tmp}/a{i:04d}.png', al, [cv2.IMWRITE_PNG_COMPRESSION, 1])
    ys, xs = np.where(al > 30)
    if len(xs): caixa = [min(caixa[0], xs.min()), min(caixa[1], ys.min()), max(caixa[2], xs.max() + 1), max(caixa[3], ys.max() + 1)]
    N = i + 1
# suaviza no tempo (mediana de 3 quadros): o recorte não pisca nem perde pedaços num quadro só
for i in range(N):
    viz = [cv2.imread(f'{tmp}/a{j:04d}.png', cv2.IMREAD_GRAYSCALE) for j in (max(0, i - 1), i, min(N - 1, i + 1))]
    cv2.imwrite(f'{tmp}/m{i:04d}.png', np.median(np.stack(viz), axis=0).astype(np.uint8), [cv2.IMWRITE_PNG_COMPRESSION, 1])
x0, y0 = max(0, caixa[0] - 8), max(0, caixa[1] - 8)
x1, y1 = min(S, caixa[2] + 8), min(S, caixa[3] + 8)
cw, ch = x1 - x0, y1 - y0
print(nn, 'quadros', N, 'caixa', cw, ch, flush=True)

ALVOS = {'g': min(cw, 1080), 'p': 600}
dims = {}
for k, w in ALVOS.items():
    w -= w % 2; h = round(ch * w / cw); h -= h % 2; dims[k] = (w, h); os.makedirs(f'{tmp}/{k}', exist_ok=True)

def prepara(c, a, w, h):
    c = cv2.resize(c, (w, h), interpolation=cv2.INTER_AREA); a = cv2.resize(a, (w, h), interpolation=cv2.INTER_AREA)
    af = a.astype(np.float32) / 255
    s = max(w, h) / 40
    num = cv2.GaussianBlur(c.astype(np.float32) * af[..., None], (0, 0), s)
    den = cv2.GaussianBlur(af, (0, 0), s)[..., None]
    fora = np.where(den > 0.02, num / np.maximum(den, 1e-3), c.astype(np.float32).mean((0, 1)))
    peso = np.clip((af - 0.05) / 0.6, 0, 1)[..., None]
    cor = c.astype(np.float32) * peso + fora * (1 - peso)
    pilha = np.empty((h * 2, w, 3), np.uint8)
    pilha[:h] = cor.clip(0, 255).astype(np.uint8)
    pilha[h:] = a[..., None]
    return pilha

# 2ª passada: quadros recortados e empilhados (JPEG quase sem perda) para cada tamanho
primeiro = None
for i, c in enumerate(fluxo(src, [], 'rgb24', 3)):
    if i >= N: break
    a = cv2.imread(f'{tmp}/m{i:04d}.png', cv2.IMREAD_GRAYSCALE)
    cc, aa = c[y0:y1, x0:x1], a[y0:y1, x0:x1]
    if i == 0: primeiro = (cc.copy(), aa.copy())
    if i % 10 == 0 or i == N - 1: np.save(f'{tmp}/f{i:04d}.npy', np.dstack([cc, aa]))
    for k, (w, h) in dims.items():
        cv2.imwrite(f'{tmp}/{k}/q{i:04d}.jpg', cv2.cvtColor(prepara(cc, aa, w, h), cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 97])

# vai e volta com freio suave nas pontas (60 qps): meio ciclo = N * 1.15 quadros
meio = round(N * 1.15)
seq = [round((N - 1) * (0.5 - 0.5 * math.cos(k / meio * math.pi))) for k in range(2 * meio)]
os.makedirs('public/video', exist_ok=True)
for k, (w, h) in dims.items():
    lista = f'{tmp}/{k}.txt'
    with open(lista, 'w') as f:
        for i in seq: f.write(f"file '{tmp}/{k}/q{i:04d}.jpg'\nduration {1/60:.6f}\n")
    base = ['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lista, '-r', '60', '-an', '-pix_fmt', 'yuv420p', '-movflags', '+faststart']
    crf264, crfav1 = (24, 36) if k == 'g' else (25, 37)
    subprocess.run(base + ['-c:v', 'libx264', '-preset', 'slow', '-crf', str(crf264), '-profile:v', 'high', '-x264-params', 'keyint=120', f'public/video/{nn}-{k}.mp4'], check=True)
    subprocess.run(base + ['-c:v', 'libsvtav1', '-preset', '6', '-crf', str(crfav1), '-g', '120', f'public/video/{nn}-{k}-av1.mp4'], check=True)
    for suf in ('', '-av1'):
        arq = f'public/video/{nn}-{k}{suf}.mp4'; print(arq, w, h, os.path.getsize(arq) // 1024, 'KB', flush=True)

# 1º quadro (imagem do topo, LCP) e sprite de reserva (32 quadros), com o mesmo enquadramento
P = 'public/img/giro/'
f0 = Image.fromarray(np.dstack(primeiro)); f0.thumbnail((900, 960), Image.LANCZOS); f0.save(P + f'{nn}-0.webp', 'WEBP', quality=84, method=6)
p0 = f0.copy(); p0.thumbnail((480, 520), Image.LANCZOS); p0.save(P + f'{nn}-0p.webp', 'WEBP', quality=78, method=6)
FW = 420; FH = round(ch * FW / cw); COLS = 8; NS = 32
guardados = sorted(int(f[1:5]) for f in os.listdir(tmp) if f.endswith('.npy'))
sp = Image.new('RGBA', (FW * COLS, FH * (NS // COLS)), (0, 0, 0, 0))
for j in range(NS):
    alvo = j * (N - 1) / (NS - 1); i = min(guardados, key=lambda g: abs(g - alvo))
    sp.paste(Image.fromarray(np.load(f'{tmp}/f{i:04d}.npy')).resize((FW, FH), Image.LANCZOS), ((j % COLS) * FW, (j // COLS) * FH))
sp.save(P + f'{nn}.webp', 'WEBP', quality=50, method=6, alpha_quality=65)
M = 'src/data/medidas-v3.json'; med = json.load(open(M))
med['giro' + nn] = [int(v) for v in (FW, FH, f0.size[0], f0.size[1], NS, COLS, *dims['g'], *dims['p'])]
json.dump(med, open(M, 'w'))
print('ok', nn, med['giro' + nn], flush=True)
