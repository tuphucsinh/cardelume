import type { LocaleCode } from "./messages";

type DirectionCopy={name:string;sub:string;badge:string};
type StyleCopy={name?:string;material:string};

const direction:Record<LocaleCode,Record<"editorial"|"midnight"|"photo",DirectionCopy>>={
 en:{
  editorial:{name:"Elegant Editorial",sub:"Cotton paper · quiet foil · considered whitespace",badge:"Editorial"},
  midnight:{name:"Midnight Lume",sub:"Deep navy · celestial detail · dramatic contrast",badge:"Midnight"},
  photo:{name:"Photo Story",sub:"Image-led · editorial crop · emotion first",badge:"Photo"}
 },
 ja:{
  editorial:{name:"上質なエディトリアル",sub:"コットン紙 · 控えめな箔 · 余白を活かした構成",badge:"エディトリアル"},
  midnight:{name:"ミッドナイト・リューム",sub:"深いネイビー · 星のディテール · 劇的なコントラスト",badge:"ミッドナイト"},
  photo:{name:"フォトストーリー",sub:"写真中心 · エディトリアルな切り取り · 感情を主役に",badge:"フォト"}
 },
 ko:{
  editorial:{name:"엘리건트 에디토리얼",sub:"코튼지 · 절제된 포일 · 여백 중심 구성",badge:"에디토리얼"},
  midnight:{name:"미드나이트 룸",sub:"딥 네이비 · 셀레스티얼 디테일 · 강한 대비",badge:"미드나이트"},
  photo:{name:"포토 스토리",sub:"사진 중심 · 에디토리얼 크롭 · 감정 우선",badge:"포토"}
 },
 es:{
  editorial:{name:"Editorial elegante",sub:"Papel de algodón · dorado discreto · espacio bien medido",badge:"Editorial"},
  midnight:{name:"Lume de medianoche",sub:"Azul noche · detalle celeste · contraste dramático",badge:"Medianoche"},
  photo:{name:"Historia fotográfica",sub:"Imagen protagonista · recorte editorial · emoción primero",badge:"Foto"}
 },
 fr:{
  editorial:{name:"Éditorial élégant",sub:"Papier coton · dorure discrète · espace maîtrisé",badge:"Éditorial"},
  midnight:{name:"Lume de minuit",sub:"Bleu nuit · détail céleste · contraste affirmé",badge:"Minuit"},
  photo:{name:"Histoire photo",sub:"Image centrale · cadrage éditorial · émotion d’abord",badge:"Photo"}
 },
 de:{
  editorial:{name:"Elegantes Editorial",sub:"Baumwollpapier · dezente Folie · bewusster Weißraum",badge:"Editorial"},
  midnight:{name:"Midnight Lume",sub:"Tiefes Nachtblau · Himmelsdetails · starker Kontrast",badge:"Nacht"},
  photo:{name:"Foto-Story",sub:"Bildgeführt · redaktioneller Beschnitt · Emotion zuerst",badge:"Foto"}
 },
 pt:{
  editorial:{name:"Editorial elegante",sub:"Papel de algodão · dourado discreto · respiro bem pensado",badge:"Editorial"},
  midnight:{name:"Lume da meia-noite",sub:"Azul profundo · detalhe celeste · contraste marcante",badge:"Noturno"},
  photo:{name:"História em foto",sub:"Imagem em destaque · corte editorial · emoção primeiro",badge:"Foto"}
 },
 it:{
  editorial:{name:"Editoriale elegante",sub:"Carta cotone · doratura discreta · spazio ben calibrato",badge:"Editoriale"},
  midnight:{name:"Lume di mezzanotte",sub:"Blu profondo · dettagli celesti · forte contrasto",badge:"Notte"},
  photo:{name:"Storia fotografica",sub:"Immagine protagonista · taglio editoriale · emozione prima",badge:"Foto"}
 },
 zh:{
  editorial:{name:"优雅编辑风",sub:"棉纸 · 克制烫金 · 留白构图",badge:"编辑风"},
  midnight:{name:"午夜微光",sub:"深海军蓝 · 星辰细节 · 强烈对比",badge:"午夜"},
  photo:{name:"照片故事",sub:"照片主导 · 编辑式裁切 · 情感优先",badge:"照片"}
 },
 vi:{
  editorial:{name:"Editorial thanh lịch",sub:"Giấy cotton · nhũ vàng tinh tế · khoảng trắng có chủ đích",badge:"Editorial"},
  midnight:{name:"Midnight Lume",sub:"Navy sâu · chi tiết thiên thể · tương phản mạnh",badge:"Midnight"},
  photo:{name:"Câu chuyện ảnh",sub:"Ảnh làm chủ đạo · cắt cúp kiểu tạp chí · cảm xúc đi trước",badge:"Ảnh"}
 }
};

const materials:Record<LocaleCode,Record<string,string>>={
 en:{},
 ja:{"Cotton · Restrained foil":"コットン · 控えめな箔","Navy · Foil":"ネイビー · 箔","Letterpress · Botanical":"活版 · ボタニカル","Washi · Ink":"和紙 · インク","Hanji · Soft color":"韓紙 · やわらかな色","Noir · Gold foil":"ノワール · 金箔","Photo · Editorial":"写真 · エディトリアル","Uncoated · Minimal":"非塗工紙 · ミニマル"},
 ko:{"Cotton · Restrained foil":"코튼 · 절제된 포일","Navy · Foil":"네이비 · 포일","Letterpress · Botanical":"레터프레스 · 보태니컬","Washi · Ink":"와시 · 잉크","Hanji · Soft color":"한지 · 소프트 컬러","Noir · Gold foil":"누아르 · 골드 포일","Photo · Editorial":"사진 · 에디토리얼","Uncoated · Minimal":"무코팅 · 미니멀"},
 es:{"Cotton · Restrained foil":"Algodón · dorado discreto","Navy · Foil":"Azul noche · detalle metalizado","Letterpress · Botanical":"Letterpress · botánico","Washi · Ink":"Washi · tinta","Hanji · Soft color":"Hanji · color suave","Noir · Gold foil":"Noir · dorado","Photo · Editorial":"Foto · editorial","Uncoated · Minimal":"Sin estucar · minimal"},
 fr:{"Cotton · Restrained foil":"Coton · dorure discrète","Navy · Foil":"Bleu nuit · dorure","Letterpress · Botanical":"Letterpress · botanique","Washi · Ink":"Washi · encre","Hanji · Soft color":"Hanji · teinte douce","Noir · Gold foil":"Noir · dorure or","Photo · Editorial":"Photo · éditorial","Uncoated · Minimal":"Non couché · minimal"},
 de:{"Cotton · Restrained foil":"Baumwolle · dezente Folie","Navy · Foil":"Navy · Folie","Letterpress · Botanical":"Letterpress · botanisch","Washi · Ink":"Washi · Tinte","Hanji · Soft color":"Hanji · sanfte Farbe","Noir · Gold foil":"Noir · Goldfolie","Photo · Editorial":"Foto · Editorial","Uncoated · Minimal":"Ungestrichen · minimal"},
 pt:{"Cotton · Restrained foil":"Algodão · dourado discreto","Navy · Foil":"Azul profundo · detalhe metalizado","Letterpress · Botanical":"Letterpress · botânico","Washi · Ink":"Washi · tinta","Hanji · Soft color":"Hanji · cor suave","Noir · Gold foil":"Noir · dourado","Photo · Editorial":"Foto · editorial","Uncoated · Minimal":"Sem revestimento · minimal"},
 it:{"Cotton · Restrained foil":"Cotone · doratura discreta","Navy · Foil":"Blu profondo · dettaglio metallico","Letterpress · Botanical":"Letterpress · botanico","Washi · Ink":"Washi · inchiostro","Hanji · Soft color":"Hanji · colore morbido","Noir · Gold foil":"Noir · doratura oro","Photo · Editorial":"Foto · editoriale","Uncoated · Minimal":"Naturale · minimal"},
 zh:{"Cotton · Restrained foil":"棉纸 · 克制烫金","Navy · Foil":"海军蓝 · 烫金","Letterpress · Botanical":"凸版 · 植物","Washi · Ink":"和纸 · 墨色","Hanji · Soft color":"韩纸 · 柔和色","Noir · Gold foil":"黑色 · 金箔","Photo · Editorial":"照片 · 编辑风","Uncoated · Minimal":"无涂层 · 极简"},
 vi:{"Cotton · Restrained foil":"Cotton · nhũ vàng tiết chế","Navy · Foil":"Navy · nhũ kim loại","Letterpress · Botanical":"Letterpress · thực vật","Washi · Ink":"Washi · mực","Hanji · Soft color":"Hanji · màu dịu","Noir · Gold foil":"Noir · nhũ vàng","Photo · Editorial":"Ảnh · editorial","Uncoated · Minimal":"Không tráng phủ · tối giản"}
};

const styleNames:Record<LocaleCode,Record<string,string>>={
 en:{},
 ja:{"Luxury Editorial":"上質なエディトリアル","Midnight Lume":"ミッドナイト・リューム","Botanical Poise":"ボタニカル・ポイズ","Washi Elegance":"和紙エレガンス","Soft Seoul":"ソフト・ソウル","Art Deco Noir":"アールデコ・ノワール","Photo Story":"フォトストーリー","Quiet Minimal":"クワイエット・ミニマル"},
 ko:{"Luxury Editorial":"럭셔리 에디토리얼","Midnight Lume":"미드나이트 룸","Botanical Poise":"보태니컬 포이즈","Washi Elegance":"와시 엘레강스","Soft Seoul":"소프트 서울","Art Deco Noir":"아르데코 누아르","Photo Story":"포토 스토리","Quiet Minimal":"콰이어트 미니멀"},
 es:{"Luxury Editorial":"Editorial de lujo","Midnight Lume":"Lume de medianoche","Botanical Poise":"Equilibrio botánico","Washi Elegance":"Elegancia washi","Soft Seoul":"Seúl suave","Art Deco Noir":"Art déco noir","Photo Story":"Historia fotográfica","Quiet Minimal":"Minimal sereno"},
 fr:{"Luxury Editorial":"Éditorial de luxe","Midnight Lume":"Lume de minuit","Botanical Poise":"Équilibre botanique","Washi Elegance":"Élégance washi","Soft Seoul":"Séoul douceur","Art Deco Noir":"Art déco noir","Photo Story":"Histoire photo","Quiet Minimal":"Minimal silencieux"},
 de:{"Luxury Editorial":"Luxus-Editorial","Midnight Lume":"Midnight Lume","Botanical Poise":"Botanische Balance","Washi Elegance":"Washi-Eleganz","Soft Seoul":"Soft Seoul","Art Deco Noir":"Art-déco Noir","Photo Story":"Foto-Story","Quiet Minimal":"Ruhiger Minimalismus"},
 pt:{"Luxury Editorial":"Editorial de luxo","Midnight Lume":"Lume da meia-noite","Botanical Poise":"Equilíbrio botânico","Washi Elegance":"Elegância washi","Soft Seoul":"Seul suave","Art Deco Noir":"Art déco noir","Photo Story":"História em foto","Quiet Minimal":"Minimal sereno"},
 it:{"Luxury Editorial":"Editoriale di lusso","Midnight Lume":"Lume di mezzanotte","Botanical Poise":"Equilibrio botanico","Washi Elegance":"Eleganza washi","Soft Seoul":"Seoul morbida","Art Deco Noir":"Art déco noir","Photo Story":"Storia fotografica","Quiet Minimal":"Minimal quieto"},
 zh:{"Luxury Editorial":"奢华编辑风","Midnight Lume":"午夜微光","Botanical Poise":"植物平衡","Washi Elegance":"和纸雅韵","Soft Seoul":"柔和首尔","Art Deco Noir":"黑金装饰艺术","Photo Story":"照片故事","Quiet Minimal":"静谧极简"},
 vi:{"Luxury Editorial":"Editorial cao cấp","Midnight Lume":"Midnight Lume","Botanical Poise":"Cân bằng thực vật","Washi Elegance":"Washi thanh lịch","Soft Seoul":"Seoul dịu nhẹ","Art Deco Noir":"Art Deco Noir","Photo Story":"Câu chuyện ảnh","Quiet Minimal":"Tối giản tĩnh lặng"}
};

export function directionDisplay(locale:LocaleCode,id:"editorial"|"midnight"|"photo"){return direction[locale][id];}
export function styleDisplay(locale:LocaleCode,name:string,material:string):StyleCopy{
 return{name:styleNames[locale][name]||name,material:materials[locale][material]||material};
}
