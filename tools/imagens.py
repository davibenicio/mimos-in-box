# Gera as imagens do site a partir do catálogo aprovado e dos recortes do Magnific.
# Uso: python3 tools/imagens.py <pasta fotos/> <pasta recortes/> <logo.jpg>
import sys, glob, os, json
from PIL import Image
fotos, cortes, logo = sys.argv[1:4]
os.makedirs('public/img/p', exist_ok=True); os.makedirs('public/img/c', exist_ok=True)
medidas = {}
for d in sorted(glob.glob(fotos + '/*/')):
    pid = os.path.basename(d.rstrip('/')); nn = pid[:2]
    for f in sorted(glob.glob(d + 'foto-*.jpg')):
        k = f.split('foto-')[1].split('.')[0]
        im = Image.open(f).convert('RGB')
        g = im.copy(); g.thumbnail((900, 1200)); g.save(f'public/img/p/{nn}-{k}.webp', 'WEBP', quality=76)
        p = im.copy(); p.thumbnail((360, 480)); p.save(f'public/img/p/{nn}-{k}-p.webp', 'WEBP', quality=72)
    c = Image.open(f'{cortes}/{nn}.png').convert('RGBA'); c = c.crop(c.getbbox())
    m = c.copy(); m.thumbnail((560, 560)); m.save(f'public/img/c/{nn}.webp', 'WEBP', quality=78)
    medidas[nn] = [m.size[0], m.size[1]]
    if nn in ('08', '14', '10'):
        g = c.copy(); g.thumbnail((800, 800)); g.save(f'public/img/c/{nn}-g.webp', 'WEBP', quality=76); medidas[nn + 'g'] = [g.size[0], g.size[1]]
im = Image.open(logo).convert('RGB')
for s in (96, 192, 512): im.resize((s, s), Image.LANCZOS).save(f'public/img/logo-{s}.webp', 'WEBP', quality=88)
im.resize((180, 180), Image.LANCZOS).save('public/apple-touch-icon.png')
json.dump(medidas, open('src/data/medidas.json', 'w'))
print(len(medidas), 'recortes')
