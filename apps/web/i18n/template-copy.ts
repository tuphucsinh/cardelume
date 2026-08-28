import type { LocaleCode } from "./messages";
const c:Record<LocaleCode,{explore:string;recommended:string;market:string;curated:string;more:string;less:string;choose:string;photo:string}>={
 en:{explore:"Explore more styles",recommended:"Recommended for this card",market:"Popular for your market",curated:"More curated picks",more:"Show 8 more",less:"Show fewer",choose:"Choose this style",photo:"Photo"},
 vi:{explore:"Xem thêm phong cách",recommended:"Phù hợp nhất với tấm thiệp này",market:"Được ưa chuộng tại thị trường của bạn",curated:"Những lựa chọn được tuyển chọn thêm",more:"Hiện thêm 8 mẫu",less:"Thu gọn",choose:"Chọn phong cách này",photo:"Có ảnh"},
 ja:{explore:"ほかのスタイルを見る",recommended:"このカードにおすすめ",market:"この地域で人気",curated:"さらに厳選したスタイル",more:"さらに8件表示",less:"閉じる",choose:"このスタイルを選ぶ",photo:"写真"},
 ko:{explore:"다른 스타일 보기",recommended:"이 카드에 추천",market:"지역 인기 스타일",curated:"추가 큐레이션 스타일",more:"8개 더 보기",less:"접기",choose:"이 스타일 선택",photo:"사진"},
 es:{explore:"Explorar más estilos",recommended:"Recomendados para esta tarjeta",market:"Populares en tu mercado",curated:"Más opciones seleccionadas",more:"Mostrar 8 más",less:"Mostrar menos",choose:"Elegir este estilo",photo:"Foto"},
 fr:{explore:"Voir plus de styles",recommended:"Recommandés pour cette carte",market:"Populaires sur votre marché",curated:"Autres choix sélectionnés",more:"Afficher 8 de plus",less:"Réduire",choose:"Choisir ce style",photo:"Photo"},
 de:{explore:"Weitere Stile entdecken",recommended:"Für diese Karte empfohlen",market:"Beliebt in Ihrem Markt",curated:"Weitere kuratierte Auswahl",more:"8 weitere anzeigen",less:"Weniger anzeigen",choose:"Diesen Stil wählen",photo:"Foto"},
 pt:{explore:"Ver mais estilos",recommended:"Recomendados para este cartão",market:"Populares no seu mercado",curated:"Mais opções selecionadas",more:"Mostrar mais 8",less:"Mostrar menos",choose:"Escolher este estilo",photo:"Foto"},
 it:{explore:"Esplora altri stili",recommended:"Consigliati per questo biglietto",market:"Popolari nel tuo mercato",curated:"Altre scelte selezionate",more:"Mostra altri 8",less:"Mostra meno",choose:"Scegli questo stile",photo:"Foto"},
 zh:{explore:"查看更多风格",recommended:"最适合这张卡片",market:"你所在市场的热门选择",curated:"更多精选风格",more:"再显示8款",less:"收起",choose:"选择这个风格",photo:"照片"}
};
export function templateCopy(locale:LocaleCode){return c[locale];}
