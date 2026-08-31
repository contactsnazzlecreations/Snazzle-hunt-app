import base64, io, re, hashlib
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'assets'/'cards'/'v211'
OUT.mkdir(parents=True,exist_ok=True)

def read_sheet(path):
    text=(ROOT/path).read_text(encoding='utf-8')
    m=re.search(r'data:image/jpeg;base64,([A-Za-z0-9+/=]+)',text)
    if not m:
        raise RuntimeError(f'Geen JPEG data gevonden in {path}')
    raw=base64.b64decode(m.group(1),validate=True)
    im=Image.open(io.BytesIO(raw)).convert('RGB')
    im.load()
    return im

def crop_and_save(sheet,cols,rows,prefix):
    made=[]
    for i in range(12):
        col=i%cols; row=i//cols
        x0=round(col*sheet.width/cols); x1=round((col+1)*sheet.width/cols)
        y0=round(row*sheet.height/rows); y1=round((row+1)*sheet.height/rows)
        card=sheet.crop((x0,y0,x1,y1))
        canvas=Image.new('RGB',(180,300),(23,36,46))
        card.thumbnail((180,300),Image.Resampling.LANCZOS)
        canvas.paste(card,((180-card.width)//2,(300-card.height)//2))
        number=f'S01-{prefix}{i+1:02d}'
        path=OUT/f'{number}.jpg'
        canvas.save(path,'JPEG',quality=90,optimize=True,progressive=False)
        check=Image.open(path); check.load()
        if check.size!=(180,300): raise RuntimeError(f'Verkeerde maat {number}: {check.size}')
        extrema=check.convert('L').getextrema()
        if not extrema or extrema[1]-extrema[0]<12: raise RuntimeError(f'Kaart lijkt leeg: {number}')
        made.append((number,path.stat().st_size,hashlib.sha256(path.read_bytes()).hexdigest()))
    return made

spark=read_sheet('snazzle-card-sheet-spark-v204.js')
wild=read_sheet('snazzle-card-sheet-wild-v204.js')
print('SPARK sheet',spark.size,'WILD sheet',wild.size)
rows=[]
rows += crop_and_save(spark,6,2,'S')
rows += crop_and_save(wild,4,3,'W')
if len(rows)!=24 or len({r[2] for r in rows})!=24:
    raise RuntimeError('Niet 24 unieke kaartafbeeldingen gemaakt')
manifest='\n'.join(f'{n} {size} {sha}' for n,size,sha in rows)+'\n'
(OUT/'MANIFEST.txt').write_text(manifest,encoding='utf-8')
print(manifest)
