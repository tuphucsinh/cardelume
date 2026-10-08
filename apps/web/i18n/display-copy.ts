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
 en:{
  "Cotton · Restrained foil":"Cotton · Restrained foil",
  "Cotton · Foil":"Cotton · Foil",
  "Cotton rag · Letterpress":"Cotton rag · Letterpress",
  "Navy · Foil":"Navy · Foil",
  "Letterpress · Botanical":"Letterpress · Botanical",
  "Washi · Ink":"Washi · Ink",
  "Hanji · Soft color":"Hanji · Soft color",
  "Noir · Gold foil":"Noir · Gold foil",
  "Photo · Editorial":"Photo · Editorial",
  "Uncoated · Minimal":"Uncoated · Minimal",
  "Editorial · Rule grid":"Editorial · Rule grid",
  "Parametric · Personal mark":"Parametric · Personal mark",
  "Photo fragment · Caption":"Photo fragment · Caption",
  "Parametric ellipse · Botanical abstraction":"Parametric ellipse · Botanical abstraction",
  "Fold geometry · Quiet plane":"Fold geometry · Quiet plane"
 },
 ja:{
  "Cotton · Restrained foil":"コットン · 控えめな箔",
  "Cotton · Foil":"コットン · 箔",
  "Cotton rag · Letterpress":"コットン紙 · 活版印刷",
  "Navy · Foil":"ネイビー · 箔",
  "Letterpress · Botanical":"活版 · ボタニカル",
  "Washi · Ink":"和紙 · インク",
  "Hanji · Soft color":"韓紙 · やわらかな色",
  "Noir · Gold foil":"ノワール · 金箔",
  "Photo · Editorial":"写真 · エディトリアル",
  "Uncoated · Minimal":"非塗工紙 · ミニマル",
  "Editorial · Rule grid":"エディトリアル · 罫線グリッド",
  "Parametric · Personal mark":"幾何学軌道 · パーソナルマーク",
  "Photo fragment · Caption":"写真の断片 · キャプション",
  "Parametric ellipse · Botanical abstraction":"花弁の楕円 · 抽象ボタニカル",
  "Fold geometry · Quiet plane":"折り目幾何 · 静かな余白"
 },
 ko:{
  "Cotton · Restrained foil":"코튼 · 절제된 포일",
  "Cotton · Foil":"코튼 · 포일",
  "Cotton rag · Letterpress":"코튼지 · 레터프레스",
  "Navy · Foil":"네이비 · 포일",
  "Letterpress · Botanical":"레터프레스 · 보태니컬",
  "Washi · Ink":"와시 · 잉크",
  "Hanji · Soft color":"한지 · 소프트 컬러",
  "Noir · Gold foil":"누아르 · 골드 포일",
  "Photo · Editorial":"사진 · 에디토리얼",
  "Uncoated · Minimal":"무코팅 · 미니멀",
  "Editorial · Rule grid":"에디토리얼 · 그리드 라인",
  "Parametric · Personal mark":"파라메트릭 · 퍼스널 마크",
  "Photo fragment · Caption":"사진 프레임 · 캡션",
  "Parametric ellipse · Botanical abstraction":"타원형 곡선 · 보태니컬 추상",
  "Fold geometry · Quiet plane":"접힘 구조 · 차분한 평면"
 },
 es:{
  "Cotton · Restrained foil":"Algodón · dorado discreto",
  "Cotton · Foil":"Algodón · Dorado discreto",
  "Cotton rag · Letterpress":"Papel de algodón · Letterpress",
  "Navy · Foil":"Azul noche · detalle metalizado",
  "Letterpress · Botanical":"Letterpress · botánico",
  "Washi · Ink":"Washi · tinta",
  "Hanji · Soft color":"Hanji · color suave",
  "Noir · Gold foil":"Noir · dorado",
  "Photo · Editorial":"Foto · editorial",
  "Uncoated · Minimal":"Sin estucar · minimal",
  "Editorial · Rule grid":"Editorial · Cuadrícula de líneas",
  "Parametric · Personal mark":"Geometría · Sello personal",
  "Photo fragment · Caption":"Recorte fotográfico · Pie de foto",
  "Parametric ellipse · Botanical abstraction":"Elipses · Botánica abstracta",
  "Fold geometry · Quiet plane":"Geometría de pliegue · Plano sereno"
 },
 fr:{
  "Cotton · Restrained foil":"Coton · dorure discrète",
  "Cotton · Foil":"Coton · Dorure discrète",
  "Cotton rag · Letterpress":"Papier coton · Letterpress",
  "Navy · Foil":"Bleu nuit · dorure",
  "Letterpress · Botanical":"Letterpress · botanique",
  "Washi · Ink":"Washi · encre",
  "Hanji · Soft color":"Hanji · teinte douce",
  "Noir · Gold foil":"Noir · dorure or",
  "Photo · Editorial":"Photo · éditorial",
  "Uncoated · Minimal":"Non couché · minimal",
  "Editorial · Rule grid":"Éditorial · Grille lignée",
  "Parametric · Personal mark":"Géométrie · Marque personnelle",
  "Photo fragment · Caption":"Fragment photo · Légende",
  "Parametric ellipse · Botanical abstraction":"Ellipses · Botanique abstraite",
  "Fold geometry · Quiet plane":"Géométrie de pli · Plan épuré"
 },
 de:{
  "Cotton · Restrained foil":"Baumwolle · dezente Folie",
  "Cotton · Foil":"Baumwolle · Dezente Folie",
  "Cotton rag · Letterpress":"Baumwollpapier · Letterpress",
  "Navy · Foil":"Navy · Folie",
  "Letterpress · Botanical":"Letterpress · botanisch",
  "Washi · Ink":"Washi · Tinte",
  "Hanji · Soft color":"Hanji · sanfte Farbe",
  "Noir · Gold foil":"Noir · Goldfolie",
  "Photo · Editorial":"Foto · Editorial",
  "Uncoated · Minimal":"Ungestrichen · minimal",
  "Editorial · Rule grid":"Editorial · Linienraster",
  "Parametric · Personal mark":"Geometrie · Persönliches Siegel",
  "Photo fragment · Caption":"Foto-Ausschnitt · Bildunterschrift",
  "Parametric ellipse · Botanical abstraction":"Ellipsen · Botanische Abstraktion",
  "Fold geometry · Quiet plane":"Faltgeometrie · Ruhige Fläche"
 },
 pt:{
  "Cotton · Restrained foil":"Algodão · dourado discreto",
  "Cotton · Foil":"Algodão · Dourado discreto",
  "Cotton rag · Letterpress":"Papel de algodão · Letterpress",
  "Navy · Foil":"Azul profundo · detalhe metalizado",
  "Letterpress · Botanical":"Letterpress · botânico",
  "Washi · Ink":"Washi · tinta",
  "Hanji · Soft color":"Hanji · cor suave",
  "Noir · Gold foil":"Noir · dourado",
  "Photo · Editorial":"Foto · editorial",
  "Uncoated · Minimal":"Sem revestimento · minimal",
  "Editorial · Rule grid":"Editorial · Grade de linhas",
  "Parametric · Personal mark":"Geometria · Marca pessoal",
  "Photo fragment · Caption":"Fragmento de foto · Legenda",
  "Parametric ellipse · Botanical abstraction":"Elipses · Botânica abstrata",
  "Fold geometry · Quiet plane":"Geometria de dobra · Plano sereno"
 },
 it:{
  "Cotton · Restrained foil":"Cotone · doratura discreta",
  "Cotton · Foil":"Cotone · Doratura discreta",
  "Cotton rag · Letterpress":"Carta cotone · Letterpress",
  "Navy · Foil":"Blu profondo · dettaglio metallico",
  "Letterpress · Botanical":"Letterpress · botanico",
  "Washi · Ink":"Washi · inchiostro",
  "Hanji · Soft color":"Hanji · colore morbido",
  "Noir · Gold foil":"Noir · doratura oro",
  "Photo · Editorial":"Foto · editoriale",
  "Uncoated · Minimal":"Naturale · minimal",
  "Editorial · Rule grid":"Editoriale · Griglia a linee",
  "Parametric · Personal mark":"Geometria · Tocco personale",
  "Photo fragment · Caption":"Frammento fotografico · Didascalia",
  "Parametric ellipse · Botanical abstraction":"Ellissi · Botanica astratta",
  "Fold geometry · Quiet plane":"Geometria di piega · Piano quieto"
 },
 zh:{
  "Cotton · Restrained foil":"棉纸 · 克制烫金",
  "Cotton · Foil":"棉纸 · 克制烫金",
  "Cotton rag · Letterpress":"棉纸 · 凸版印刷",
  "Navy · Foil":"海军蓝 · 烫金",
  "Letterpress · Botanical":"凸版 · 植物",
  "Washi · Ink":"和纸 · 墨色",
  "Hanji · Soft color":"韩纸 · 柔和色",
  "Noir · Gold foil":"黑色 · 金箔",
  "Photo · Editorial":"照片 · 编辑风",
  "Uncoated · Minimal":"无涂层 · 极简",
  "Editorial · Rule grid":"编辑排版 · 细线网格",
  "Parametric · Personal mark":"参数化轨迹 · 专属印记",
  "Photo fragment · Caption":"照片片段 · 留白旁白",
  "Parametric ellipse · Botanical abstraction":"参数化椭圆 · 植物抽象",
  "Fold geometry · Quiet plane":"折痕几何 · 静谧留白"
 },
 vi:{
  "Cotton · Restrained foil":"Cotton · nhũ vàng tiết chế",
  "Cotton · Foil":"Cotton · Nhũ vàng tiết chế",
  "Cotton rag · Letterpress":"Giấy cotton · Letterpress",
  "Navy · Foil":"Navy · nhũ kim loại",
  "Letterpress · Botanical":"Letterpress · thực vật",
  "Washi · Ink":"Washi · mực",
  "Hanji · Soft color":"Hanji · màu dịu",
  "Noir · Gold foil":"Noir · nhũ vàng",
  "Photo · Editorial":"Ảnh · editorial",
  "Uncoated · Minimal":"Không tráng phủ · tối giản",
  "Editorial · Rule grid":"Editorial · Lưới kẻ mảnh",
  "Parametric · Personal mark":"Hình học quỹ đạo · Dấu ấn cá nhân",
  "Photo fragment · Caption":"Khung ảnh kỷ niệm · Chú thích tinh tế",
  "Parametric ellipse · Botanical abstraction":"Hình elip · Thực vật cách điệu",
  "Fold geometry · Quiet plane":"Hình học nếp gấp · Mặt phẳng tĩnh lặng"
 }
};

const styleNames:Record<LocaleCode,Record<string,string>>={
 en:{
  "Luxury Editorial":"Luxury Editorial",
  "Midnight Lume":"Midnight Lume",
  "Botanical Poise":"Botanical Poise",
  "Washi Elegance":"Washi Elegance",
  "Soft Seoul":"Soft Seoul",
  "Art Deco Noir":"Art Deco Noir",
  "Photo Story":"Photo Story",
  "Quiet Minimal":"Quiet Minimal",
  "Classic Letterpress":"Classic Letterpress",
  "Museum Note":"Museum Note",
  "Monogram Orbit":"Monogram Orbit",
  "Memory Window":"Memory Window",
  "Petal Geometry":"Petal Geometry",
  "Soft Fold":"Soft Fold",
  "Bold Pop":"Bold Pop",
  "Celestial Night":"Celestial Night",
  "Golden Hour":"Golden Hour",
  "Ink Pause":"Ink Pause",
  "Kawaii Joy":"Kawaii Joy",
  "Little Wonders":"Little Wonders",
  "Night Ledger":"Night Ledger",
  "Pressed Shadow":"Pressed Shadow",
  "Quiet Noir":"Quiet Noir",
  "Quiet Seal":"Quiet Seal",
  "Ribbon Line":"Ribbon Line",
  "Type Celebration":"Type Celebration",
  "Watercolor Bloom":"Watercolor Bloom",
  "Whispered Type":"Whispered Type"
 },
 ja:{
  "Classic Letterpress":"クラシック・レタープレス",
  "Midnight Lume":"ミッドナイト・リューム",
  "Monogram Orbit":"モノグラム・オービット",
  "Memory Window":"メモリー・ウィンドウ",
  "Photo Story":"フォトストーリー",
  "Museum Note":"ミュージアム・ノート",
  "Petal Geometry":"ペタル・ジオメトリー",
  "Soft Fold":"ソフト・フォールド",
  "Luxury Editorial":"上質なエディトリアル",
  "Botanical Poise":"ボタニカル・ポイズ",
  "Quiet Minimal":"クワイエット・ミニマル",
  "Washi Elegance":"和紙エレガンス",
  "Soft Seoul":"ソフト・ソウル",
  "Art Deco Noir":"アールデコ・ノワール"
 },
 ko:{
  "Classic Letterpress":"클래식 레터프레스",
  "Midnight Lume":"미드나이트 룸",
  "Monogram Orbit":"모노그램 오르빗",
  "Memory Window":"메모리 윈도우",
  "Photo Story":"포토 스토리",
  "Museum Note":"뮤지엄 노트",
  "Petal Geometry":"페탈 지오메트리",
  "Soft Fold":"소프트 폴드",
  "Luxury Editorial":"럭셔리 에디토리얼",
  "Botanical Poise":"보태니컬 포이즈",
  "Quiet Minimal":"콰이어트 미니멀",
  "Washi Elegance":"와시 엘레강스",
  "Soft Seoul":"소프트 서울",
  "Art Deco Noir":"아르데코 누아르"
 },
 es:{
  "Classic Letterpress":"Letterpress clásico",
  "Midnight Lume":"Lume de medianoche",
  "Monogram Orbit":"Órbita monograma",
  "Memory Window":"Ventana de recuerdos",
  "Photo Story":"Historia fotográfica",
  "Museum Note":"Nota de museo",
  "Petal Geometry":"Geometría de pétalos",
  "Soft Fold":"Pliegue suave",
  "Luxury Editorial":"Editorial de lujo",
  "Botanical Poise":"Equilibrio botánico",
  "Quiet Minimal":"Minimal sereno",
  "Washi Elegance":"Elegancia washi",
  "Soft Seoul":"Seúl suave",
  "Art Deco Noir":"Art déco noir"
 },
 fr:{
  "Classic Letterpress":"Letterpress classique",
  "Midnight Lume":"Lume de minuit",
  "Monogram Orbit":"Orbite monogramme",
  "Memory Window":"Fenêtre souvenir",
  "Photo Story":"Histoire photo",
  "Museum Note":"Note de musée",
  "Petal Geometry":"Géométrie pétale",
  "Soft Fold":"Pli délicat",
  "Luxury Editorial":"Éditorial de luxe",
  "Botanical Poise":"Équilibre botanique",
  "Quiet Minimal":"Minimal silencieux",
  "Washi Elegance":"Élégance washi",
  "Soft Seoul":"Séoul douceur",
  "Art Deco Noir":"Art déco noir"
 },
 de:{
  "Classic Letterpress":"Klassischer Letterpress",
  "Midnight Lume":"Midnight Lume",
  "Monogram Orbit":"Monogramm-Orbit",
  "Memory Window":"Erinnerungsfenster",
  "Photo Story":"Foto-Story",
  "Museum Note":"Museumsnotiz",
  "Petal Geometry":"Blütenblatt-Geometrie",
  "Soft Fold":"Sanfte Faltung",
  "Luxury Editorial":"Luxus-Editorial",
  "Botanical Poise":"Botanische Balance",
  "Quiet Minimal":"Ruhiger Minimalismus",
  "Washi Elegance":"Washi-Eleganz",
  "Soft Seoul":"Soft Seoul",
  "Art Deco Noir":"Art-déco Noir"
 },
 pt:{
  "Classic Letterpress":"Letterpress clássico",
  "Midnight Lume":"Lume da meia-noite",
  "Monogram Orbit":"Órbita monograma",
  "Memory Window":"Janela de memórias",
  "Photo Story":"História em foto",
  "Museum Note":"Nota de museu",
  "Petal Geometry":"Geometria de pétalas",
  "Soft Fold":"Dobra suave",
  "Luxury Editorial":"Editorial de luxo",
  "Botanical Poise":"Equilíbrio botânico",
  "Quiet Minimal":"Minimal sereno",
  "Washi Elegance":"Elegância washi",
  "Soft Seoul":"Seul suave",
  "Art Deco Noir":"Art déco noir"
 },
 it:{
  "Classic Letterpress":"Letterpress classico",
  "Midnight Lume":"Lume di mezzanotte",
  "Monogram Orbit":"Orbita monogramma",
  "Memory Window":"Finestra dei ricordi",
  "Photo Story":"Storia fotografica",
  "Museum Note":"Nota museale",
  "Petal Geometry":"Geometria di petali",
  "Soft Fold":"Piega morbida",
  "Luxury Editorial":"Editoriale di lusso",
  "Botanical Poise":"Equilibrio botanico",
  "Quiet Minimal":"Minimal quieto",
  "Washi Elegance":"Eleganza washi",
  "Soft Seoul":"Seoul morbida",
  "Art Deco Noir":"Art déco noir"
 },
 zh:{
  "Classic Letterpress":"经典凸版",
  "Midnight Lume":"午夜微光",
  "Monogram Orbit":"轨迹印记",
  "Memory Window":"记忆视窗",
  "Photo Story":"照片故事",
  "Museum Note":"博物馆笺",
  "Petal Geometry":"花瓣几何",
  "Soft Fold":"柔和折影",
  "Luxury Editorial":"奢华编辑风",
  "Botanical Poise":"植物平衡",
  "Quiet Minimal":"静谧极简",
  "Washi Elegance":"和纸雅韵",
  "Soft Seoul":"柔和首尔",
  "Art Deco Noir":"黑金装饰艺术"
 },
 vi:{
  "Classic Letterpress":"Letterpress cổ điển",
  "Midnight Lume":"Midnight Lume",
  "Monogram Orbit":"Quỹ đạo Monogram",
  "Memory Window":"Cửa sổ kỷ niệm",
  "Photo Story":"Câu chuyện ảnh",
  "Museum Note":"Ghi chép bảo tàng",
  "Petal Geometry":"Hình học cánh hoa",
  "Soft Fold":"Nếp gấp dịu êm",
  "Luxury Editorial":"Editorial cao cấp",
  "Botanical Poise":"Cân bằng thực vật",
  "Quiet Minimal":"Tối giản tĩnh lặng",
  "Washi Elegance":"Washi thanh lịch",
  "Soft Seoul":"Seoul dịu nhẹ",
  "Art Deco Noir":"Art Deco Noir",
  "Bold Pop":"Pop nổi bật",
  "Celestial Night":"Đêm thiên hà",
  "Golden Hour":"Giờ hoàng hôn",
  "Ink Pause":"Khoảng lặng mực",
  "Kawaii Joy":"Niềm vui Kawaii",
  "Little Wonders":"Điều nhỏ diệu kỳ",
  "Night Ledger":"Sổ đêm",
  "Pressed Shadow":"Bóng ép",
  "Quiet Noir":"Noir tĩnh lặng",
  "Quiet Seal":"Ấn tín tĩnh lặng",
  "Ribbon Line":"Dải ruy băng",
  "Type Celebration":"Chữ mừng",
  "Watercolor Bloom":"Hoa màu nước",
  "Whispered Type":"Chữ thì thầm"
 }
};

function findMappedStyleName(locale:LocaleCode,name:string):string|undefined{
 const table=styleNames[locale];
 if(!table)return undefined;
 if(table[name])return table[name];
 for(const val of Object.values(table)){
  if(val===name)return val;
 }
 return undefined;
}

function findMappedMaterial(locale:LocaleCode,material:string):string|undefined{
 const table=materials[locale];
 if(!table)return undefined;
 if(table[material])return table[material];
 for(const val of Object.values(table)){
  if(val===material)return val;
 }
 return undefined;
}

const neutralPrefix:Record<LocaleCode,string>={
 en:"Direction",
 ja:"デザイン",
 ko:"디자인",
 es:"Dirección",
 fr:"Direction",
 de:"Richtung",
 pt:"Direção",
 it:"Direzione",
 zh:"方向",
 vi:"Hướng"
};

export function getNeutralLabel(locale:LocaleCode,slotIndex?:number):string{
 if(slotIndex!==undefined&&Number.isFinite(slotIndex)){
  const prefix=neutralPrefix[locale]||"Direction";
  return `${prefix} ${String(slotIndex+1).padStart(2,"0")}`;
 }
 return "CardeLume";
}

export function directionDisplay(locale:LocaleCode,id:"editorial"|"midnight"|"photo"){return direction[locale][id];}

export function styleDisplay(locale:LocaleCode,name:string,material:string):StyleCopy{
 const mappedName=findMappedStyleName(locale,name);
 const mappedMat=findMappedMaterial(locale,material);
 return{name:mappedName||name,material:mappedMat||material};
}

export type CustomerStyleDisplay={
 name:string;
 material:string;
 badge:string;
 sub:string;
};

export function resolveCustomerStyleDisplay(input:{
 locale:LocaleCode;
 templateName?:string|null;
 material?:string|null;
 slotIndex?:number;
}):CustomerStyleDisplay{
 const name=input.templateName?.trim();
 const mat=input.material?.trim();
 const neutral=getNeutralLabel(input.locale,input.slotIndex);

 if(name){
  const mappedName=findMappedStyleName(input.locale,name);
  if(mappedName){
   const mappedMat=mat?findMappedMaterial(input.locale,mat):undefined;
   const finalMat=mappedMat||"";
   return{
    name:mappedName,
    material:finalMat,
    badge:mappedName,
    sub:finalMat
   };
  }
 }

 return{
  name:neutral,
  material:"",
  badge:neutral,
  sub:""
 };
}
