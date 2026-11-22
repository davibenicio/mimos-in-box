import sys, glob
from PIL import Image
pasta, saida, cols, larg = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
fs = sorted(glob.glob(pasta + '/*.png')); sel = sys.argv[5].split(',') if len(sys.argv) > 5 else None
if sel: fs = [f for f in fs if f.split('/')[-1][:2] in sel]
ims = [Image.open(f).convert('RGB') for f in fs]
for im in ims: im.thumbnail((larg, 9999))
h = max(i.size[1] for i in ims); lin = (len(ims) + cols - 1) // cols
o = Image.new('RGB', (cols * (larg + 6), lin * (h + 6)), (40, 40, 40))
for k, im in enumerate(ims): o.paste(im, ((k % cols) * (larg + 6), (k // cols) * (h + 6)))
o.save(saida, quality=82)
