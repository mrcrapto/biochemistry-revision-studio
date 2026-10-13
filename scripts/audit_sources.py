import fitz, json, pathlib
from PIL import Image, ImageDraw
root=pathlib.Path(__file__).resolve().parents[1]
out=root/'audit'; out.mkdir(exist_ok=True)
catalog=[]
for path in sorted(root.glob('*.pdf')):
    doc=fitz.open(path); slug=path.stem.replace(' ','-').replace('&','and')
    folder=out/slug; folder.mkdir(exist_ok=True)
    pages=[]; thumbs=[]
    for i,p in enumerate(doc):
        txt=p.get_text(); pages.append({'page':i+1,'text':txt,'images':len(p.get_images())})
        pix=p.get_pixmap(matrix=fitz.Matrix(.5,.5),alpha=False)
        im=Image.frombytes('RGB',[pix.width,pix.height],pix.samples); im.thumbnail((310,210))
        tile=Image.new('RGB',(330,240),'#dddddd');tile.paste(im,((330-im.width)//2,20));ImageDraw.Draw(tile).text((10,220),f'Page {i+1}',fill='black');thumbs.append(tile)
    for start in range(0,len(thumbs),20):
        sheet=Image.new('RGB',(1650,240*4),'white')
        for j,im in enumerate(thumbs[start:start+20]):sheet.paste(im,((j%5)*330,(j//5)*240))
        sheet.save(folder/f'contact-{start//20+1}.jpg',quality=90)
    (folder/'text.json').write_text(json.dumps(pages,ensure_ascii=False,indent=2),encoding='utf-8')
    (folder/'text.txt').write_text('\n\n'.join(f'PAGE {x["page"]}\n{x["text"]}' for x in pages),encoding='utf-8')
    catalog.append({'file':path.name,'slug':slug,'pages':len(doc),'images':sum(p['images'] for p in pages),'first':pages[0]['text'],'last':pages[-1]['text']})
(out/'catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(catalog,ensure_ascii=False,indent=2))
