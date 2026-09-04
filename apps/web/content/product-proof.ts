import type { VisualDirection, TemplateMaterialWorld, TemplateMeta } from "@cardelume/templates";
import type { LocaleCode } from "../i18n/messages";
import type { LaunchCopy } from "../i18n/launch-copy";

export type ProofFormatKey =
  | "portrait-5x7"
  | "folded-5x7"
  | "square-5x5"
  | "landscape-7x5"
  | "postcard-6x4";

export type ProofDirection = {
  directionId: VisualDirection;
  templateSlug: string;
  templateId: string;
  familyId: string;
  versionId: string;
  version: number;
  name: string;
  material: string;
  materialWorld: TemplateMaterialWorld;
  kickerKey: keyof LaunchCopy;
  headlineKey: keyof LaunchCopy;
  bodyKey: keyof LaunchCopy;
};

export type ProofCase = {
  id: string;
  goldenRef: string;
  titleKey: keyof LaunchCopy;
  occasionKey: keyof LaunchCopy;
  recipientKey: keyof LaunchCopy;
  feelingKey: keyof LaunchCopy;
  detailKey: keyof LaunchCopy;
  formatKey: ProofFormatKey;
  formatLabelKey: keyof LaunchCopy;
  hasPhoto: boolean;
  photoUrl?: string | null;
  directions: [ProofDirection, ProofDirection, ProofDirection];
  chosenIndex: number;
  chosenRationaleKey: keyof LaunchCopy;
  provenance: {
    goldenBriefId: string;
    templateId: string;
    familyId: string;
    versionId: string;
    version: number;
    launchStatus: string;
    health: string;
    schemaVersion: string;
  };
};

export const RETAINED_MVP_FAMILY_SLUGS = [
  "classic-letterpress",
  "midnight-lume",
  "monogram-orbit",
  "memory-window",
  "photo-story",
  "museum-note",
  "botanical-poise",
  "luxury-editorial"
] as const;

export type RetainedMvpSlug = typeof RETAINED_MVP_FAMILY_SLUGS[number];

const proofCases: ProofCase[] = [
  {
    id: "case-maya-birthday",
    goldenRef: "golden-v1-en-01",
    titleKey: "proofCase1Title",
    occasionKey: "proofCase1BriefOccasion",
    recipientKey: "proofCase1BriefRecipient",
    feelingKey: "proofCase1BriefFeeling",
    detailKey: "proofCase1BriefDetail",
    formatKey: "portrait-5x7",
    formatLabelKey: "proofFormatPortrait5x7",
    hasPhoto: false,
    directions: [
      {
        directionId: "letterpress",
        templateSlug: "classic-letterpress",
        templateId: "10000000-0000-4000-8000-000000000014",
        familyId: "20000000-0000-4000-8000-000000000014",
        versionId: "30000000-0000-4000-8000-000000000014",
        version: 1,
        name: "Classic Letterpress",
        material: "Cotton rag · Letterpress",
        materialWorld: "letterpress_tactile",
        kickerKey: "proofCase1DirAKicker",
        headlineKey: "proofCase1DirAHeadline",
        bodyKey: "proofCase1DirABody"
      },
      {
        directionId: "midnight",
        templateSlug: "midnight-lume",
        templateId: "10000000-0000-4000-8000-000000000002",
        familyId: "20000000-0000-4000-8000-000000000002",
        versionId: "30000000-0000-4000-8000-000000000002",
        version: 1,
        name: "Midnight Lume",
        material: "Navy · Foil",
        materialWorld: "nocturne_foil",
        kickerKey: "proofCase1DirBKicker",
        headlineKey: "proofCase1DirBHeadline",
        bodyKey: "proofCase1DirBBody"
      },
      {
        directionId: "museum",
        templateSlug: "museum-note",
        templateId: "10000000-0000-4000-8000-000000000102",
        familyId: "20000000-0000-4000-8000-000000000102",
        versionId: "30000000-0000-4000-8000-000000000102",
        version: 1,
        name: "Museum Note",
        material: "Editorial · Rule grid",
        materialWorld: "editorial_luxury",
        kickerKey: "proofCase1DirCKicker",
        headlineKey: "proofCase1DirCHeadline",
        bodyKey: "proofCase1DirCBody"
      }
    ],
    chosenIndex: 0,
    chosenRationaleKey: "proofCase1ChosenRationale",
    provenance: {
      goldenBriefId: "golden-v1-en-01",
      templateId: "10000000-0000-4000-8000-000000000014",
      familyId: "20000000-0000-4000-8000-000000000014",
      versionId: "30000000-0000-4000-8000-000000000014",
      version: 1,
      launchStatus: "candidate",
      health: "healthy",
      schemaVersion: "cardelume.card.v1"
    }
  },
  {
    id: "case-leo-anniversary",
    goldenRef: "golden-v1-en-02",
    titleKey: "proofCase2Title",
    occasionKey: "proofCase2BriefOccasion",
    recipientKey: "proofCase2BriefRecipient",
    feelingKey: "proofCase2BriefFeeling",
    detailKey: "proofCase2BriefDetail",
    formatKey: "portrait-5x7",
    formatLabelKey: "proofFormatPortrait5x7",
    hasPhoto: true,
    photoUrl: null,
    directions: [
      {
        directionId: "memory",
        templateSlug: "memory-window",
        templateId: "10000000-0000-4000-8000-000000000105",
        familyId: "20000000-0000-4000-8000-000000000105",
        versionId: "30000000-0000-4000-8000-000000000105",
        version: 1,
        name: "Memory Window",
        material: "Photo fragment · Caption",
        materialWorld: "photo_keepsake",
        kickerKey: "proofCase2DirAKicker",
        headlineKey: "proofCase2DirAHeadline",
        bodyKey: "proofCase2DirABody"
      },
      {
        directionId: "orbit",
        templateSlug: "monogram-orbit",
        templateId: "10000000-0000-4000-8000-000000000103",
        familyId: "20000000-0000-4000-8000-000000000103",
        versionId: "30000000-0000-4000-8000-000000000103",
        version: 1,
        name: "Monogram Orbit",
        material: "Parametric · Personal mark",
        materialWorld: "personal_mark",
        kickerKey: "proofCase2DirBKicker",
        headlineKey: "proofCase2DirBHeadline",
        bodyKey: "proofCase2DirBBody"
      },
      {
        directionId: "photo",
        templateSlug: "photo-story",
        templateId: "10000000-0000-4000-8000-000000000007",
        familyId: "20000000-0000-4000-8000-000000000007",
        versionId: "30000000-0000-4000-8000-000000000007",
        version: 1,
        name: "Photo Story",
        material: "Photo · Editorial",
        materialWorld: "photo_keepsake",
        kickerKey: "proofCase2DirCKicker",
        headlineKey: "proofCase2DirCHeadline",
        bodyKey: "proofCase2DirCBody"
      }
    ],
    chosenIndex: 0,
    chosenRationaleKey: "proofCase2ChosenRationale",
    provenance: {
      goldenBriefId: "golden-v1-en-02",
      templateId: "10000000-0000-4000-8000-000000000105",
      familyId: "20000000-0000-4000-8000-000000000105",
      versionId: "30000000-0000-4000-8000-000000000105",
      version: 1,
      launchStatus: "experiment",
      health: "healthy",
      schemaVersion: "cardelume.card.v1"
    }
  },
  {
    id: "case-nora-gratitude",
    goldenRef: "golden-v1-en-03",
    titleKey: "proofCase3Title",
    occasionKey: "proofCase3BriefOccasion",
    recipientKey: "proofCase3BriefRecipient",
    feelingKey: "proofCase3BriefFeeling",
    detailKey: "proofCase3BriefDetail",
    formatKey: "folded-5x7",
    formatLabelKey: "proofFormatFolded5x7",
    hasPhoto: false,
    directions: [
      {
        directionId: "botanical",
        templateSlug: "botanical-poise",
        templateId: "10000000-0000-4000-8000-000000000003",
        familyId: "20000000-0000-4000-8000-000000000003",
        versionId: "30000000-0000-4000-8000-000000000003",
        version: 1,
        name: "Botanical Poise",
        material: "Letterpress · Botanical",
        materialWorld: "letterpress_tactile",
        kickerKey: "proofCase3DirAKicker",
        headlineKey: "proofCase3DirAHeadline",
        bodyKey: "proofCase3DirABody"
      },
      {
        directionId: "letterpress",
        templateSlug: "classic-letterpress",
        templateId: "10000000-0000-4000-8000-000000000014",
        familyId: "20000000-0000-4000-8000-000000000014",
        versionId: "30000000-0000-4000-8000-000000000014",
        version: 1,
        name: "Classic Letterpress",
        material: "Cotton rag · Letterpress",
        materialWorld: "letterpress_tactile",
        kickerKey: "proofCase3DirBKicker",
        headlineKey: "proofCase3DirBHeadline",
        bodyKey: "proofCase3DirBBody"
      },
      {
        directionId: "minimal",
        templateSlug: "quiet-minimal",
        templateId: "10000000-0000-4000-8000-000000000008",
        familyId: "20000000-0000-4000-8000-000000000008",
        versionId: "30000000-0000-4000-8000-000000000008",
        version: 1,
        name: "Quiet Minimal",
        material: "Uncoated · Minimal",
        materialWorld: "quiet_modern",
        kickerKey: "proofCase3DirCKicker",
        headlineKey: "proofCase3DirCHeadline",
        bodyKey: "proofCase3DirCBody"
      }
    ],
    chosenIndex: 0,
    chosenRationaleKey: "proofCase3ChosenRationale",
    provenance: {
      goldenBriefId: "golden-v1-en-03",
      templateId: "10000000-0000-4000-8000-000000000003",
      familyId: "20000000-0000-4000-8000-000000000003",
      versionId: "30000000-0000-4000-8000-000000000003",
      version: 1,
      launchStatus: "candidate",
      health: "healthy",
      schemaVersion: "cardelume.card.v1"
    }
  }
];

export function getProductProofCases(): ProofCase[] {
  return proofCases;
}

export function getValidProductProofCases(templates: TemplateMeta[], isProduction = false): ProofCase[] {
  return proofCases.filter((c) => {
    // 1. All three directions must match exact entries in the supplied templates list (matching id, versionId and slug)
    const allDirectionsMatch = c.directions.every((dir) => {
      const matched = templates.find(
        (t) =>
          t.id === dir.templateId &&
          t.versionId === dir.versionId &&
          t.slug === dir.templateSlug
      );
      if (!matched) return false;
      if (isProduction && matched.launchStatus !== "approved") return false;
      return true;
    });

    if (!allDirectionsMatch) return false;

    // 2. The chosen provenance must match an exact entry in the supplied templates list
    const chosenDir = c.directions[c.chosenIndex];
    if (!chosenDir) return false;

    const matchedProvenance = templates.find(
      (t) =>
        t.id === c.provenance.templateId &&
        t.versionId === c.provenance.versionId &&
        t.slug === chosenDir.templateSlug
    );
    if (!matchedProvenance) return false;
    if (isProduction && matchedProvenance.launchStatus !== "approved") return false;

    return true;
  });
}

export function getRetainedMvpTemplates(templates: TemplateMeta[]): TemplateMeta[] {
  const map = new Map<string, TemplateMeta>();
  for (const t of templates) {
    map.set(t.slug, t);
  }
  const result: TemplateMeta[] = [];
  for (const slug of RETAINED_MVP_FAMILY_SLUGS) {
    const t = map.get(slug);
    if (t) result.push(t);
  }
  return result;
}

const localizedNames: Record<LocaleCode, Record<string, string>> = {
  en: {},
  ja: {
    "Classic Letterpress": "クラシック・レタープレス",
    "Midnight Lume": "ミッドナイト・リューム",
    "Monogram Orbit": "モノグラム・オービット",
    "Memory Window": "メモリー・ウィンドウ",
    "Photo Story": "フォトストーリー",
    "Museum Note": "ミュージアム・ノート",
    "Petal Geometry": "ペタル・ジオメトリー",
    "Soft Fold": "ソフト・フォールド",
    "Luxury Editorial": "上質なエディトリアル",
    "Botanical Poise": "ボタニカル・ポイズ",
    "Quiet Minimal": "クワイエット・ミニマル"
  },
  ko: {
    "Classic Letterpress": "클래식 레터프레스",
    "Midnight Lume": "미드나이트 룸",
    "Monogram Orbit": "모노그램 오르빗",
    "Memory Window": "메모리 윈도우",
    "Photo Story": "포토 스토리",
    "Museum Note": "뮤지엄 노트",
    "Petal Geometry": "페탈 지오메트리",
    "Soft Fold": "소프트 폴드",
    "Luxury Editorial": "럭셔리 에디토리얼",
    "Botanical Poise": "보태니컬 포이즈",
    "Quiet Minimal": "콰이어트 미니멀"
  },
  es: {
    "Classic Letterpress": "Letterpress clásico",
    "Midnight Lume": "Lume de medianoche",
    "Monogram Orbit": "Órbita monograma",
    "Memory Window": "Ventana de recuerdos",
    "Photo Story": "Historia fotográfica",
    "Museum Note": "Nota de museo",
    "Petal Geometry": "Geometría de pétalos",
    "Soft Fold": "Pliegue suave",
    "Luxury Editorial": "Editorial de lujo",
    "Botanical Poise": "Equilibrio botánico",
    "Quiet Minimal": "Minimal sereno"
  },
  fr: {
    "Classic Letterpress": "Letterpress classique",
    "Midnight Lume": "Lume de minuit",
    "Monogram Orbit": "Orbite monogramme",
    "Memory Window": "Fenêtre souvenir",
    "Photo Story": "Histoire photo",
    "Museum Note": "Note de musée",
    "Petal Geometry": "Géométrie pétale",
    "Soft Fold": "Pli délicat",
    "Luxury Editorial": "Éditorial de luxe",
    "Botanical Poise": "Équilibre botanique",
    "Quiet Minimal": "Minimal silencieux"
  },
  de: {
    "Classic Letterpress": "Klassischer Letterpress",
    "Midnight Lume": "Midnight Lume",
    "Monogram Orbit": "Monogramm-Orbit",
    "Memory Window": "Erinnerungsfenster",
    "Photo Story": "Foto-Story",
    "Museum Note": "Museumsnotiz",
    "Petal Geometry": "Blütenblatt-Geometrie",
    "Soft Fold": "Sanfte Faltung",
    "Luxury Editorial": "Luxus-Editorial",
    "Botanical Poise": "Botanische Balance",
    "Quiet Minimal": "Ruhiger Minimalismus"
  },
  pt: {
    "Classic Letterpress": "Letterpress clássico",
    "Midnight Lume": "Lume da meia-noite",
    "Monogram Orbit": "Órbita monograma",
    "Memory Window": "Janela de memórias",
    "Photo Story": "História em foto",
    "Museum Note": "Nota de museu",
    "Petal Geometry": "Geometria de pétalas",
    "Soft Fold": "Dobra suave",
    "Luxury Editorial": "Editorial de luxo",
    "Botanical Poise": "Equilíbrio botânico",
    "Quiet Minimal": "Minimal sereno"
  },
  it: {
    "Classic Letterpress": "Letterpress classico",
    "Midnight Lume": "Lume di mezzanotte",
    "Monogram Orbit": "Orbita monogramma",
    "Memory Window": "Finestra dei ricordi",
    "Photo Story": "Storia fotografica",
    "Museum Note": "Nota museale",
    "Petal Geometry": "Geometria di petali",
    "Soft Fold": "Piega morbida",
    "Luxury Editorial": "Editoriale di lusso",
    "Botanical Poise": "Equilibrio botanico",
    "Quiet Minimal": "Minimal quieto"
  },
  zh: {
    "Classic Letterpress": "经典凸版",
    "Midnight Lume": "午夜微光",
    "Monogram Orbit": "轨迹印记",
    "Memory Window": "记忆视窗",
    "Photo Story": "照片故事",
    "Museum Note": "博物馆笺",
    "Petal Geometry": "花瓣几何",
    "Soft Fold": "柔和折影",
    "Luxury Editorial": "奢华编辑风",
    "Botanical Poise": "植物平衡",
    "Quiet Minimal": "静谧极简"
  },
  vi: {
    "Classic Letterpress": "Letterpress cổ điển",
    "Midnight Lume": "Midnight Lume",
    "Monogram Orbit": "Quỹ đạo Monogram",
    "Memory Window": "Cửa sổ kỷ niệm",
    "Photo Story": "Câu chuyện ảnh",
    "Museum Note": "Ghi chép bảo tàng",
    "Petal Geometry": "Hình học cánh hoa",
    "Soft Fold": "Nếp gấp dịu êm",
    "Luxury Editorial": "Editorial cao cấp",
    "Botanical Poise": "Cân bằng thực vật",
    "Quiet Minimal": "Tối giản tĩnh lặng"
  }
};

const localizedMaterials: Record<LocaleCode, Record<string, string>> = {
  en: {},
  ja: {
    "Cotton rag · Letterpress": "コットン紙 · 活版印刷",
    "Navy · Foil": "ネイビー · 箔",
    "Parametric · Personal mark": "幾何学軌道 · パーソナルマーク",
    "Photo fragment · Caption": "写真の断片 · キャプション",
    "Photo · Editorial": "写真 · エディトリアル",
    "Editorial · Rule grid": "エディトリアル · 罫線グリッド",
    "Parametric ellipse · Botanical abstraction": "花弁の楕円 · 抽象ボタニカル",
    "Fold geometry · Quiet plane": "折り目幾何 · 静かな余白",
    "Cotton · Foil": "コットン · 箔",
    "Letterpress · Botanical": "活版 · ボタニカル",
    "Uncoated · Minimal": "非塗工紙 · ミニマル"
  },
  ko: {
    "Cotton rag · Letterpress": "코튼지 · 레터프레스",
    "Navy · Foil": "네이비 · 포일",
    "Parametric · Personal mark": "파라메트릭 · 퍼스널 마크",
    "Photo fragment · Caption": "사진 프레임 · 캡션",
    "Photo · Editorial": "사진 · 에디토리얼",
    "Editorial · Rule grid": "에디토리얼 · 그리드 라인",
    "Parametric ellipse · Botanical abstraction": "타원형 곡선 · 보태니컬 추상",
    "Fold geometry · Quiet plane": "접힘 구조 · 차분한 평면",
    "Cotton · Foil": "코튼 · 포일",
    "Letterpress · Botanical": "레터프레스 · 보태니컬",
    "Uncoated · Minimal": "무코팅 · 미니멀"
  },
  es: {
    "Cotton rag · Letterpress": "Papel de algodón · Letterpress",
    "Navy · Foil": "Azul noche · Detalle metalizado",
    "Parametric · Personal mark": "Geometría · Sello personal",
    "Photo fragment · Caption": "Recorte fotográfico · Pie de foto",
    "Photo · Editorial": "Foto · Editorial",
    "Editorial · Rule grid": "Editorial · Cuadrícula de líneas",
    "Parametric ellipse · Botanical abstraction": "Elipses · Botánica abstracta",
    "Fold geometry · Quiet plane": "Geometría de pliegue · Plano sereno",
    "Cotton · Foil": "Algodón · Dorado discreto",
    "Letterpress · Botanical": "Letterpress · Botánico",
    "Uncoated · Minimal": "Sin estucar · minimal"
  },
  fr: {
    "Cotton rag · Letterpress": "Papier coton · Letterpress",
    "Navy · Foil": "Bleu nuit · Dorure",
    "Parametric · Personal mark": "Géométrie · Marque personnelle",
    "Photo fragment · Caption": "Fragment photo · Légende",
    "Photo · Editorial": "Photo · Éditorial",
    "Editorial · Rule grid": "Éditorial · Grille lignée",
    "Parametric ellipse · Botanical abstraction": "Ellipses · Botanique abstraite",
    "Fold geometry · Quiet plane": "Géométrie de pli · Plan épuré",
    "Cotton · Foil": "Coton · Dorure discrète",
    "Letterpress · Botanical": "Letterpress · Botanique",
    "Uncoated · Minimal": "Non couché · minimal"
  },
  de: {
    "Cotton rag · Letterpress": "Baumwollpapier · Letterpress",
    "Navy · Foil": "Nachtblau · Folie",
    "Parametric · Personal mark": "Geometrie · Persönliches Siegel",
    "Photo fragment · Caption": "Foto-Ausschnitt · Bildunterschrift",
    "Photo · Editorial": "Foto · Editorial",
    "Editorial · Rule grid": "Editorial · Linienraster",
    "Parametric ellipse · Botanical abstraction": "Ellipsen · Botanische Abstraktion",
    "Fold geometry · Quiet plane": "Faltgeometrie · Ruhige Fläche",
    "Cotton · Foil": "Baumwolle · Dezente Folie",
    "Letterpress · Botanical": "Letterpress · Botanisch",
    "Uncoated · Minimal": "Ungestrichen · minimal"
  },
  pt: {
    "Cotton rag · Letterpress": "Papel de algodão · Letterpress",
    "Navy · Foil": "Azul profundo · Detalhe metalizado",
    "Parametric · Personal mark": "Geometria · Marca pessoal",
    "Photo fragment · Caption": "Fragmento de foto · Legenda",
    "Photo · Editorial": "Foto · Editorial",
    "Editorial · Rule grid": "Editorial · Grade de linhas",
    "Parametric ellipse · Botanical abstraction": "Elipses · Botânica abstrata",
    "Fold geometry · Quiet plane": "Geometria de dobra · Plano sereno",
    "Cotton · Foil": "Algodão · Dourado discreto",
    "Letterpress · Botanical": "Letterpress · Botânico",
    "Uncoated · Minimal": "Sem revestimento · minimal"
  },
  it: {
    "Cotton rag · Letterpress": "Carta cotone · Letterpress",
    "Navy · Foil": "Blu profondo · Dettaglio metallico",
    "Parametric · Personal mark": "Geometria · Tocco personale",
    "Photo fragment · Caption": "Frammento fotografico · Didascalia",
    "Photo · Editorial": "Foto · Editoriale",
    "Editorial · Rule grid": "Editoriale · Griglia a linee",
    "Parametric ellipse · Botanical abstraction": "Ellissi · Botanica astratta",
    "Fold geometry · Quiet plane": "Geometria di piega · Piano quieto",
    "Cotton · Foil": "Cotone · Doratura discreta",
    "Letterpress · Botanical": "Letterpress · Botanico",
    "Uncoated · Minimal": "Naturale · minimal"
  },
  zh: {
    "Cotton rag · Letterpress": "棉纸 · 凸版印刷",
    "Navy · Foil": "海军蓝 · 烫金",
    "Parametric · Personal mark": "参数化轨迹 · 专属印记",
    "Photo fragment · Caption": "照片片段 · 留白旁白",
    "Photo · Editorial": "照片 · 编辑风",
    "Editorial · Rule grid": "编辑排版 · 细线网格",
    "Parametric ellipse · Botanical abstraction": "参数化椭圆 · 植物抽象",
    "Fold geometry · Quiet plane": "折痕几何 · 静谧留白",
    "Cotton · Foil": "棉纸 · 克制烫金",
    "Letterpress · Botanical": "凸版 · 植物",
    "Uncoated · Minimal": "无涂层 · 极简"
  },
  vi: {
    "Cotton rag · Letterpress": "Giấy cotton · Letterpress",
    "Navy · Foil": "Navy · Nhũ kim loại",
    "Parametric · Personal mark": "Hình học quỹ đạo · Dấu ấn cá nhân",
    "Photo fragment · Caption": "Khung ảnh kỷ niệm · Chú thích tinh tế",
    "Photo · Editorial": "Ảnh · Editorial",
    "Editorial · Rule grid": "Editorial · Lưới kẻ mảnh",
    "Parametric ellipse · Botanical abstraction": "Hình elip · Thực vật cách điệu",
    "Fold geometry · Quiet plane": "Hình học nếp gấp · Mặt phẳng tĩnh lặng",
    "Cotton · Foil": "Cotton · Nhũ vàng tiết chế",
    "Letterpress · Botanical": "Letterpress · Thực vật",
    "Uncoated · Minimal": "Không tráng phủ · tối giản"
  }
};

export function getLocalizedStyleDisplay(locale: LocaleCode, name: string, material: string): { name: string; material: string } {
  const locName = localizedNames[locale]?.[name] ?? name;
  const locMat = localizedMaterials[locale]?.[material] ?? material;
  return { name: locName, material: locMat };
}
