import json,html
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
root=Path(__file__).resolve().parent.parent
d=json.loads((root/'assets/portraits/inventory.json').read_text())
log=root/'assets/portraits/generated-log.jsonl'; paths={x['key']:x['source'] for x in map(json.loads,log.read_text().splitlines())}
ready=[]
for c in d['characters']:
 p=root/(c.get('asset') or paths.get(c['key'],'__pending__'))
 if p.exists():ready.append((c,p))
font=ImageFont.truetype('/System/Library/Fonts/STHeiti Medium.ttc',16)
for batch in range((len(ready)+19)//20):
 items=ready[batch*20:(batch+1)*20]; canvas=Image.new('RGB',(1000,1200),'#f3f0e8');draw=ImageDraw.Draw(canvas)
 for i,(c,p) in enumerate(items):
  x=(i%5)*200;y=(i//5)*300;im=Image.open(p).convert('RGBA');im.thumbnail((182,250))
  canvas.paste(im,(x+(200-im.width)//2,y+8),im)
  draw.text((x+8,y+265),c['name'],font=font,fill='#16302b')
 canvas.save(root/f'outputs/portraits-20261013/contact-{batch+1:02d}.jpg',quality=90)
print(f'Contact sheets: {len(ready)} ready portraits')
