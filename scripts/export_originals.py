import pymupdf as fitz, pathlib,json
from PIL import Image
root=pathlib.Path(__file__).resolve().parents[1]
catalog=json.loads((root/'audit/catalog.json').read_text(encoding='utf-8'))
ids=['amino','carbohydrates','enzymes','inhibition','glycogen','glycolysis','heme','vitamins','lipids','etc','tca']
for item,id in zip(catalog,ids):
    out=root/'public'/'originals'/id;out.mkdir(parents=True,exist_ok=True)
    for i,p in enumerate(fitz.open(root/item['file'])):
        m=fitz.Matrix(1600/p.rect.width,1600/p.rect.width)
        pix=p.get_pixmap(matrix=m,alpha=False)
        Image.frombytes('RGB',(pix.width,pix.height),pix.samples).save(out/f'{i+1}.webp','WEBP',quality=86,method=4)
    print(id,item['pages'],flush=True)
