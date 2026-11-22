# Gera as imagens do site a partir dos recortes do Magnific (cestas sem fundo).
# Uso: python3 tools/imagens.py <pasta recortes/> <logo.jpg>
# As fotos cruas do catálogo não vão mais para o site (pedido do Davi, 21/11): só a cesta recortada.
import sys, glob, os, json
from PIL import Image
cortes, logo = sys.argv[1:3]
os.makedirs('public/img/c', exist_ok=True)
medidas = {}
for f in sorted(glob.glob(cortes + '/[0-9][0-9].png')):
    nn = os.path.basename(f)[:2]
    c = Image.open(f).convert('RGBA'); c = c.crop(c.getbbox())
    m = c.copy(); m.thumbnail((560, 560)); m.save(f'public/img/c/{nn}.webp', 'WEBP', quality=78)
    medidas[nn] = [m.size[0], m.size[1]]
    g = c.copy(); g.thumbnail((800, 800)); g.save(f'public/img/c/{nn}-g.webp', 'WEBP', quality=76); medidas[nn + 'g'] = [g.size[0], g.size[1]]
im = Image.open(logo).convert('RGB')
for s in (96, 192, 512): im.resize((s, s), Image.LANCZOS).save(f'public/img/logo-{s}.webp', 'WEBP', quality=88)
im.resize((180, 180), Image.LANCZOS).save('public/apple-touch-icon.png')
json.dump(medidas, open('src/data/medidas.json', 'w'))
print(len(medidas) // 2, 'recortes')
