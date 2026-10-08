import {
  assertSemanticCopyContract,
  buildDeterministicCreativeFallback,
  creativeQualityRisks,
  repairSemanticCopyContract,
  semanticCopyContractViolations,
} from "../packages/ai/src/index.ts";
import {
  GenerationResultSchema,
  type GenerationBrief,
  type GenerationResult,
  type GeneratedDirection,
} from "../packages/card-schema/src/index.ts";
import {
  portfolioV2AllTemplates,
  type RankedTemplate,
  type TemplateMeta,
} from "../packages/templates/src/index.ts";

function need(value: unknown, message: string): asserts value {
  if (!value) {
    console.error(`FAILURE: ${message}`);
    throw new Error(message);
  }
}

function approved(template: TemplateMeta): TemplateMeta {
  return { ...template, status: "active", health: "healthy", launchStatus: "approved" };
}

function ranked(template: TemplateMeta, score = 0.9): RankedTemplate {
  return {
    template,
    score,
    baseScore: score,
    marketScore: 0.8,
    reasons: ["generation-quality-fixture"],
    components: { relevance: 0.9, market: 0.8, editorial: 0.9, performance: 0.8, textFit: 1, freshness: 0.7, photoFit: 1, noveltyPenalty: 0 },
  };
}

const sourceEditorial = portfolioV2AllTemplates.find(t => t.slug === "luxury-editorial");
const sourceMidnight = portfolioV2AllTemplates.find(t => t.slug === "midnight-lume");
const sourceQuiet = portfolioV2AllTemplates.find(t => t.slug === "classic-letterpress");
need(sourceEditorial && sourceMidnight && sourceQuiet, "quality_fixture_sources_missing");

const candidates: RankedTemplate[] = [
  ranked(approved(sourceEditorial)),
  ranked(approved(sourceMidnight)),
  ranked(approved(sourceQuiet)),
];

function copyText(result: GenerationResult): string {
  return result.directions.map(d => `${d.kicker} ${d.headline} ${d.body}`).join(" ");
}

function words(text: string) {
  return new Set(text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").split(/\s+/).filter(Boolean));
}

function jaccard(a: string, b: string) {
  const aa = words(a), bb = words(b);
  if (!aa.size && !bb.size) return 0;
  let common = 0;
  for (const w of aa) if (bb.has(w)) common++;
  return common / (aa.size + bb.size - common);
}

async function main() {
  const markers: string[] = [];

  // =========================================================================
  // 1. Natural copy passes for all 10 locales
  // =========================================================================
  const naturalFixtures: Record<
    string,
    { brief: GenerationBrief; directions: [Pick<GeneratedDirection, "kicker" | "headline" | "body">, Pick<GeneratedDirection, "kicker" | "headline" | "body">, Pick<GeneratedDirection, "kicker" | "headline" | "body">] }
  > = {
    en: {
      brief: {
        locale: "en-US", format: "portrait-5x7", hasPhoto: false, market: "GLOBAL",
        occasion: "Birthday", relationship: "Friend", feeling: "Warm", recipient: "Maya",
        detail: "blue notebooks from every trip",
      },
      directions: [
        { kicker: "FOR MAYA", headline: "Maya, a warm birthday wish", body: "Here is to Maya, inspired by the blue notebooks from every trip." },
        { kicker: "CELEBRATION", headline: "Celebrating your special birthday", body: "Thinking of Maya and sending so much love." },
        { kicker: "KEEPSAKE", headline: "A timeless milestone", body: "Honoring this year with joy and appreciation." },
      ],
    },
    vi: {
      brief: {
        locale: "vi-VN", format: "portrait-5x7", hasPhoto: false, market: "GLOBAL",
        occasion: "Birthday", relationship: "Friend", feeling: "Warm", recipient: "Linh",
        detail: "cuốn sổ tay bìa xanh",
      },
      directions: [
        { kicker: "DÀNH CHO LINH", headline: "Linh, chúc mừng sinh nhật ấm áp", body: "Gửi Linh cuốn sổ tay bìa xanh và muôn vàn thương mến." },
        { kicker: "KỶ NIỆM", headline: "Mừng sinh nhật tuổi mới của Linh", body: "Chúc bạn một ngày trọn vẹn niềm vui và an lành." },
        { kicker: "LỜI CHÚC", headline: "Một ngày thật bình yên", body: "Mong mọi điều an lành và tốt đẹp luôn đồng hành cùng bạn." },
      ],
    },
    es: {
      brief: {
        locale: "es-ES", format: "portrait-5x7", hasPhoto: false, market: "GLOBAL",
        occasion: "Birthday", relationship: "Friend", feeling: "Warm", recipient: "Sofía",
        detail: "los cuadernos azules",
      },
      directions: [
        { kicker: "PARA SOFÍA", headline: "Sofía, un cumpleaños cálido", body: "Pensando en Sofía y los cuadernos azules con cariño sincero." },
        { kicker: "CELEBRACIÓN", headline: "Feliz cumpleaños querida Sofía", body: "Un año más para celebrar juntas tantas historias." },
        { kicker: "RECUERDO", headline: "Un momento para atesorar", body: "Con todo mi afecto en este nuevo camino que comienza." },
      ],
    },
    fr: {
      brief: {
        locale: "fr-FR", format: "portrait-5x7", hasPhoto: false, market: "GLOBAL",
        occasion: "Birthday", relationship: "Friend", feeling: "Warm", recipient: "Camille",
        detail: "carnets bleus de voyage",
      },
      directions: [
        { kicker: "POUR CAMILLE", headline: "Camille, un anniversaire chaleureux", body: "Pour Camille et ses précieux carnets bleus de voyage." },
        { kicker: "FÊTE", headline: "Joyeux anniversaire chère Camille", body: "Une très belle journée entourée de ceux qui comptent." },
        { kicker: "SOUVENIR", headline: "Une pensée toute particulière", body: "Tous mes vœux les plus sincères pour cette nouvelle année." },
      ],
    },
    de: {
      brief: {
        locale: "de-DE", format: "portrait-5x7", hasPhoto: false, market: "GLOBAL",
        occasion: "Birthday", relationship: "Friend", feeling: "Warm", recipient: "Hannah",
        detail: "blaue notizbücher",
      },
      directions: [
        { kicker: "FÜR HANNAH", headline: "Hannah, ein herzlicher geburtstag", body: "Für Hannah und die blauen Notizbücher voller Erinnerungen." },
        { kicker: "FEIER", headline: "Alles Liebe zum geburtstag Hannah", body: "Ein wunderbares neues Lebensjahr voller Freude." },
        { kicker: "ERINNERUNG", headline: "Ein ganz besonderer Meilenstein", body: "Von Herzen die allerbesten Wünsche für deinen weiteren Weg." },
      ],
    },
    pt: {
      brief: {
        locale: "pt-BR", format: "portrait-5x7", hasPhoto: false, market: "GLOBAL",
        occasion: "Birthday", relationship: "Friend", feeling: "Warm", recipient: "Beatriz",
        detail: "cadernos azuis",
      },
      directions: [
        { kicker: "PARA BEATRIZ", headline: "Beatriz, um aniversário caloroso", body: "Para Beatriz e seus cadernos azuis cheios de lembranças." },
        { kicker: "CELEBRAÇÃO", headline: "Feliz aniversário querida Beatriz", body: "Um dia repleto de paz, sorrisos e realizações." },
        { kicker: "LEMBRANÇA", headline: "Um momento muito especial", body: "Com todo carinho e admiração nesta data marcante." },
      ],
    },
    it: {
      brief: {
        locale: "it-IT", format: "portrait-5x7", hasPhoto: false, market: "GLOBAL",
        occasion: "Birthday", relationship: "Friend", feeling: "Warm", recipient: "Giulia",
        detail: "quaderni blu",
      },
      directions: [
        { kicker: "PER GIULIA", headline: "Giulia, un compleanno caloroso", body: "Per Giulia e i suoi quaderni blu di viaggio con grande affetto." },
        { kicker: "FESTA", headline: "Buon compleanno cara Giulia", body: "Un giorno speciale da vivere con entusiasmo e serenità." },
        { kicker: "RICORDO", headline: "Un pensiero fatto con il cuore", body: "I migliori auguri per ogni tuo sogno futuro." },
      ],
    },
    ja: {
      brief: {
        locale: "ja-JP", format: "portrait-5x7", hasPhoto: false, market: "GLOBAL",
        occasion: "Birthday", relationship: "Friend", feeling: "Warm", recipient: "美咲",
        detail: "青いノート",
      },
      directions: [
        { kicker: "美咲へ", headline: "美咲さん、温かい誕生日のお祝い", body: "青いノートの思い出とともに美咲へ心を込めて。" },
        { kicker: "お祝いの日", headline: "美咲さんのお誕生日を祝して", body: "これからの日々に幸せがあふれますように願っています。" },
        { kicker: "記念の言葉", headline: "かけがえのない節目に", body: "心からの祝福と敬意を込めてこの言葉を贈ります。" },
      ],
    },
    ko: {
      brief: {
        locale: "ko-KR", format: "portrait-5x7", hasPhoto: false, market: "GLOBAL",
        occasion: "Birthday", relationship: "Friend", feeling: "Warm", recipient: "민지",
        detail: "파란 공책",
      },
      directions: [
        { kicker: "민지에게", headline: "민지, 따뜻한 생일 축하", body: "파란 공책의 소중한 기억을 담아 민지에게 전합니다." },
        { kicker: "축하의 날", headline: "민지의 행복한 생일을 축하하며", body: "새로운 한 해도 빛나는 순간이 가득하기를 응원합니다." },
        { kicker: "소중한 마음", headline: "특별한 날을 기억하며", body: "마음을 담아 언제나 변함없는 축복을 보냅니다." },
      ],
    },
    zh: {
      brief: {
        locale: "zh-CN", format: "portrait-5x7", hasPhoto: false, market: "GLOBAL",
        occasion: "Birthday", relationship: "Friend", feeling: "Warm", recipient: "小雨",
        detail: "蓝色笔记本",
      },
      directions: [
        { kicker: "给小雨", headline: "小雨，温暖的生日祝福", body: "带着蓝色笔记本的回忆送给小雨，满怀真挚祝福。" },
        { kicker: "庆祝时刻", headline: "祝小雨生日快乐", body: "愿新的一岁充满欢喜与收获，前程似锦。" },
        { kicker: "珍贵留念", headline: "特别的日子", body: "衷心祝愿岁岁常欢愉，万事皆胜意。" },
      ],
    },
  };

  const allLocales = ["en", "vi", "es", "fr", "de", "pt", "it", "ja", "ko", "zh"];
  for (const loc of allLocales) {
    const fixture = naturalFixtures[loc];
    need(fixture, `natural_fixture_missing:${loc}`);
    const result: GenerationResult = GenerationResultSchema.parse({
      directions: fixture.directions.map((d, index) => {
        const c = candidates[index] ?? candidates[0];
        return {
          id: ["editorial", "midnight", "quiet"][index],
          templateId: c.template.id,
          templateVersionId: c.template.versionId,
          templateName: c.template.name,
          visualDirection: c.template.visualDirection,
          creativeThesis: `Thesis ${index + 1} for ${loc} birthday direction with distinct typographic tone and layout discipline.`,
          customerRationale: `Rationale fit ${index + 1}`,
          signatureMove: "recipient_anchor",
          accentMode: "original",
          confidence: 0.85,
          noveltyScore: 0.8,
          wowScore: 0.8,
          riskCodes: [],
          ...d,
        };
      }),
    });
    const violations = semanticCopyContractViolations(result, fixture.brief);
    need(violations.length === 0, `natural_copy_violation:${loc}:${violations.join(",")}`);
  }
  markers.push("NATURAL_COPY_PASSES_ALL_10_LOCALES=PASS");

  // =========================================================================
  // 2. Repair preserves thesis + language (negative control)
  // =========================================================================
  const esBrief: GenerationBrief = {
    locale: "es-ES", format: "portrait-5x7", hasPhoto: false, market: "GLOBAL",
    occasion: "Birthday", relationship: "Friend", feeling: "Warm", recipient: "Sofía",
    detail: "los cuadernos azules",
  };

  const esOriginalResult: GenerationResult = GenerationResultSchema.parse({
    directions: [
      {
        id: "editorial",
        templateId: candidates[0].template.id,
        templateVersionId: candidates[0].template.versionId,
        templateName: candidates[0].template.name,
        visualDirection: candidates[0].template.visualDirection,
        creativeThesis: "Thesis alpha editorial framing with minimal serif typography and understated warmth.",
        customerRationale: "Una propuesta cálida para cumpleaños.",
        signatureMove: "recipient_anchor",
        accentMode: "original",
        confidence: 0.85,
        noveltyScore: 0.8,
        wowScore: 0.8,
        riskCodes: [],
        kicker: "EL RECUERDO",
        headline: "Sofía, un cumpleaños cálido",
        body: "Celebrando este día y los cuadernos azules con todo el amor.",
      },
      {
        id: "midnight",
        templateId: candidates[1].template.id,
        templateVersionId: candidates[1].template.versionId,
        templateName: candidates[1].template.name,
        visualDirection: candidates[1].template.visualDirection,
        creativeThesis: "Thesis beta nocturne atmosphere with deep contrasts and reflective rhythm.",
        customerRationale: "Ideal para celebrar con elegancia nocturna.",
        signatureMove: "isolated_closing_line",
        accentMode: "original",
        confidence: 0.85,
        noveltyScore: 0.8,
        wowScore: 0.8,
        riskCodes: [],
        kicker: "UN HOMENAJE",
        headline: "Para celebrar juntos",
        body: "Un año más compartiendo hermosas alegrías y nuevos horizontes.",
      },
      {
        id: "quiet",
        templateId: candidates[2].template.id,
        templateVersionId: candidates[2].template.versionId,
        templateName: candidates[2].template.name,
        visualDirection: candidates[2].template.visualDirection,
        creativeThesis: "Thesis gamma quiet tactile letterpress with generous whitespace and restraint.",
        customerRationale: "Mantiene la emoción sincera de forma íntima.",
        signatureMove: "quiet_opening",
        accentMode: "original",
        confidence: 0.85,
        noveltyScore: 0.8,
        wowScore: 0.8,
        riskCodes: [],
        kicker: "CON CARIÑO",
        headline: "Un día especial",
        body: "Con todo el amor del mundo en esta fecha tan querida por todos.",
      },
    ],
  });

  const beforeViolations = semanticCopyContractViolations(esOriginalResult, esBrief);
  need(beforeViolations.includes("occasion_missing"), "negative_control_occasion_missing_not_detected");
  need(beforeViolations.includes("recipient_missing"), "negative_control_recipient_missing_not_detected");

  const esRepaired = repairSemanticCopyContract(esOriginalResult, esBrief);

  // (a) Every creativeThesis byte-identical to before
  for (let i = 0; i < 3; i++) {
    need(
      esRepaired.directions[i].creativeThesis === esOriginalResult.directions[i].creativeThesis,
      `repair_overwrote_thesis_card_${i}`
    );
  }

  // (b) creativeQualityRisks does NOT include creative_range when repair could satisfy the contract
  const afterRisks = creativeQualityRisks(esRepaired, esBrief, [], candidates);
  need(!afterRisks.includes("creative_range"), "repair_triggered_creative_range");
  need(afterRisks.length === 0, `repair_unexpected_risks:${afterRisks.join(",")}`);

  // (c) No English was injected into a non-English brief
  const repairedText = copyText(esRepaired);
  need(
    !/\b(?:birthday|warm|someone special|a keepsake for|made for you|deserves words|note for|written around)\b/i.test(repairedText),
    "repair_injected_english_into_spanish_brief"
  );

  // (d) The thresholds are unchanged:
  // Assert a pair with jaccard <= .60 is not flagged
  const pairA = esRepaired.directions[0];
  const pairB = esRepaired.directions[1];
  const copySimilarity = jaccard(`${pairA.headline} ${pairA.body}`, `${pairB.headline} ${pairB.body}`);
  need(copySimilarity <= 0.60, `fixture_copy_similarity_too_high:${copySimilarity}`);
  need(!afterRisks.includes("creative_range"), "threshold_under_60_flagged");

  // Assert a synthetic identical pair IS flagged as direction_copy_duplicate
  const syntheticDupPair: GenerationResult = GenerationResultSchema.parse({
    directions: [
      esRepaired.directions[0],
      { ...esRepaired.directions[0], id: "midnight", templateId: candidates[1].template.id, templateVersionId: candidates[1].template.versionId },
      esRepaired.directions[2],
    ],
  });
  const dupViolations = semanticCopyContractViolations(syntheticDupPair, esBrief);
  need(dupViolations.includes("direction_copy_duplicate"), "synthetic_identical_pair_not_flagged");

  markers.push("REPAIR_PRESERVES_THESIS_AND_LANGUAGE=PASS");

  // =========================================================================
  // 3. Deterministic fallback passes for every matrix brief × 10 locales
  // =========================================================================
  const matrixOccasions = ["Birthday", "Anniversary", "Thank You", "Congratulations", "New Baby", "Other"];
  const matrixFeelings = ["Warm", "Romantic", "Elegant", "Fun", "Surprise me"];

  let matrixCount = 0;
  for (const locale of allLocales) {
    for (const occasion of matrixOccasions) {
      for (const feeling of matrixFeelings) {
        const matrixBrief: GenerationBrief = {
          locale,
          format: "portrait-5x7",
          hasPhoto: false,
          market: "GLOBAL",
          occasion,
          feeling,
          relationship: "Friend",
          recipient: "Alex",
          detail: "treasured moments together",
        };
        const fallback = buildDeterministicCreativeFallback(matrixBrief, candidates, {
          exhaustionState: "none",
          allowStagingCandidates: true,
        });
        const risks = creativeQualityRisks(fallback, matrixBrief, [], candidates);
        need(risks.length === 0, `deterministic_fallback_risk:${locale}:${occasion}:${feeling}:${risks.join(",")}`);
        matrixCount++;
      }
    }
  }
  need(matrixCount === allLocales.length * matrixOccasions.length * matrixFeelings.length, "matrix_runs_incomplete");
  markers.push("DETERMINISTIC_FALLBACK_MATRIX_PASSES=PASS");

  // =========================================================================
  // 4. Negative fixtures still flagged
  // =========================================================================
  // Identical copy trio -> direction_copy_duplicate
  const identicalTrio: GenerationResult = GenerationResultSchema.parse({
    directions: [
      {
        ...esRepaired.directions[0],
        id: "editorial",
        kicker: "SAME KICKER",
        headline: "Identical headline across cards",
        body: "Identical body text across cards.",
      },
      {
        ...esRepaired.directions[1],
        id: "midnight",
        kicker: "SAME KICKER",
        headline: "Identical headline across cards",
        body: "Identical body text across cards.",
      },
      {
        ...esRepaired.directions[2],
        id: "quiet",
        kicker: "SAME KICKER",
        headline: "Identical headline across cards",
        body: "Identical body text across cards.",
      },
    ],
  });
  const trioViolations = semanticCopyContractViolations(identicalTrio, esBrief);
  need(trioViolations.includes("direction_copy_duplicate"), "identical_trio_not_flagged_duplicate");

  // Duplicate templateId across two directions -> creative_range
  const duplicateTemplateResult: GenerationResult = GenerationResultSchema.parse({
    directions: [
      esRepaired.directions[0],
      {
        ...esRepaired.directions[1],
        templateId: esRepaired.directions[0].templateId,
        templateVersionId: esRepaired.directions[0].templateVersionId,
      },
      esRepaired.directions[2],
    ],
  });
  const dupTemplateRisks = creativeQualityRisks(duplicateTemplateResult, esBrief, [], candidates);
  need(dupTemplateRisks.includes("creative_range"), "duplicate_template_id_not_flagged_creative_range");

  markers.push("NEGATIVE_FIXTURES_FLAGGED=PASS");

  for (const marker of markers) console.log(marker);
  console.log("GENERATION_QUALITY_CONTRACT=PASS");
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
