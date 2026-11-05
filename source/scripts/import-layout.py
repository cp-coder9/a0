from pathlib import Path
from html.parser import HTMLParser
import json,re,shutil,urllib.request
root=Path('D:/Sitrak-website'); source=Path('D:/Sitrak-website-source')
for folder in ['assets','uploads','tokens']:
 shutil.copytree(source/folder,root/'public'/folder,dirs_exist_ok=True)
# Keep the supplied tokens unchanged; self-host genuine font binaries.
css=urllib.request.urlopen('https://fonts.googleapis.com/css2?family=Barlow:wght@300;400;500;600;700&family=Barlow+Condensed:wght@600;700;800;900&family=Share+Tech+Mono&display=swap').read().decode()
(root/'public/fonts').mkdir(exist_ok=True)
for i,url in enumerate(dict.fromkeys(re.findall(r'https://[^)\s]+',css))):
 name=f'brand-{i}.'+url.split('?')[0].rsplit('.',1)[-1]
 (root/'public/fonts'/name).write_bytes(urllib.request.urlopen(url).read());css=css.replace(url,'/fonts/'+name)
(root/'app/fonts.css').write_text(css,encoding='utf8')
class Convert(HTMLParser):
 def __init__(self):super().__init__(convert_charrefs=True);self.out=[];self.stack=[]
 def handle_starttag(self,tag,attrs):
  attrs=dict(attrs)
  if tag=='sc-if':self.stack.append(None);return
  if tag=='x-import':tag=attrs.pop('component-from-global-scope').split('.')[-1]
  attrs={k:v for k,v in attrs.items() if k not in ['hint-size','style-hover','base-path']}
  if tag=='Button' and attrs.get('href')=='#the-proof':tag='EnquiryButton'
  if tag=='Button' and attrs.get('href')=='#the-specs':attrs['href']='#the-range'
  a=[]
  for k,v in attrs.items():
   if k=='style':
    style={re.sub(r'-([a-z])',lambda m:m[1].upper(),key.strip()):val.strip() for pair in v.split(';') if ':' in pair for key,val in [pair.split(':',1)]};a.append('style={'+json.dumps(style)+'}')
   elif '{{' in v:
    expr=v.replace('{{','').replace('}}','').strip();a.append(k+'={'+expr+'}')
   else:a.append(k+'='+json.dumps(v.replace('./','/'),ensure_ascii=False))
  void=tag in ['img','br','hr','input','link'];self.out.append('<'+tag+(' '+' '.join(a) if a else '')+(' />' if void else '>'))
  if not void:self.stack.append(tag)
 def handle_endtag(self,tag):
  actual=self.stack.pop()
  if actual:self.out.append('</'+actual+'>')
 def handle_data(self,s):self.out.append(s.replace('{','&#123;').replace('}','&#125;'))
text=(source/'Truk Afrik Landing.dc.html').read_text(encoding='utf8');text=text[text.index('<section id="top"'):text.index('<sc-if value="{{ showEnquiryBar }}"')]
p=Convert();p.feed(text)
vals='''const logoHeight=44,showHeroStats=true,showGrillTexture=true,showRangeList=true;
const c7hSpecs=['480hp','2300Nm','80T GCM','ZF 12-speed AMT'],howoSpecs=['290hp','1160Nm','27T GVW','Hardox 450'],maxSpecs=['6×4','Long haul','AMT'];
const mathsRows=[{label:'Rated power',value:'480hp'},{label:'Peak torque',value:'2300Nm'},{label:'Gross combination mass',value:'80T GCM'},{label:'Gearbox',value:'ZF 12TX2621 TD · 12-speed AMT'},{label:'Engine',value:'SINOTRUK MC13 · 12.419L · Euro III'},{label:'Cab',value:'Double sleeper · RHD'}];
const rangeRows=[{label:'Locatelli',value:'Crane trucks'}];'''
code='''import {Button,Eyebrow,SectionHeader,SpecTable,SpecPill,StatBlock,Card,BranchCard,TruckCard,Footer} from '../components/Primitives';
import {Header} from '../components/Header';
import {EnquiryExperience,EnquiryButton} from '../components/Enquiry';
'''+vals+'''\nexport default function Home(){return <EnquiryExperience><a className="skip-link" href="#main">Skip to content</a><Header/><main id="main">'''+''.join(p.out)+'''</main><Footer/><div className="mobile-enquiry"><a href="tel:0820748725">Call 0820SITRAK</a><EnquiryButton/></div></EnquiryExperience>}'''
(root/'app/page.tsx').write_text(code,encoding='utf8')
print('Generated native TSX from six source sections; copied exact assets, uploads and tokens; downloaded fonts.')
