#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import assert from 'node:assert/strict';

import {
  resolveCustomerStyleDisplay,
  styleDisplay,
  directionDisplay,
  getNeutralLabel
} from '../apps/web/i18n/display-copy.ts';

const root = path.resolve(import.meta.dirname, '..');
const supportedLocales = ['en', 'ja', 'ko', 'es', 'fr', 'de', 'pt', 'it', 'zh', 'vi'];

let checks = 0;
function pass(label) {
  checks++;
}

// ============================================================================
// 1. All 10 Supported Locales Coverage
// ============================================================================
assert.equal(supportedLocales.length, 10, 'must test exactly 10 supported locales');

const expectedNeutralPrefixes = {
  en: 'Direction',
  ja: 'デザイン',
  ko: '디자인',
  es: 'Dirección',
  fr: 'Direction',
  de: 'Richtung',
  pt: 'Direção',
  it: 'Direzione',
  zh: '方向',
  vi: 'Hướng'
};

for (const loc of supportedLocales) {
  assert.ok(expectedNeutralPrefixes[loc], `neutral prefix defined for locale ${loc}`);
  pass(`locale_prefix_registered:${loc}`);
}

// ============================================================================
// 2. Known Mappings for all 10 Locales
// ============================================================================
const sampleTemplates = [
  {
    enName: 'Luxury Editorial',
    material: 'Cotton · Foil',
    expectedNames: {
      en: 'Luxury Editorial',
      ja: '上質なエディトリアル',
      ko: '럭셔리 에디토리얼',
      es: 'Editorial de lujo',
      fr: 'Éditorial de luxe',
      de: 'Luxus-Editorial',
      pt: 'Editorial de luxo',
      it: 'Editoriale di lusso',
      zh: '奢华编辑风',
      vi: 'Editorial cao cấp'
    },
    expectedMaterials: {
      en: 'Cotton · Foil',
      ja: 'コットン · 箔',
      ko: '코튼 · 포일',
      es: 'Algodón · Dorado discreto',
      fr: 'Coton · Dorure discrète',
      de: 'Baumwolle · Dezente Folie',
      pt: 'Algodão · Dourado discreto',
      it: 'Cotone · Doratura discreta',
      zh: '棉纸 · 克制烫金',
      vi: 'Cotton · Nhũ vàng tiết chế'
    }
  },
  {
    enName: 'Midnight Lume',
    material: 'Navy · Foil',
    expectedNames: {
      en: 'Midnight Lume',
      ja: 'ミッドナイト・リューム',
      ko: '미드나이트 룸',
      es: 'Lume de medianoche',
      fr: 'Lume de minuit',
      de: 'Midnight Lume',
      pt: 'Lume da meia-noite',
      it: 'Lume di mezzanotte',
      zh: '午夜微光',
      vi: 'Midnight Lume'
    },
    expectedMaterials: {
      en: 'Navy · Foil',
      ja: 'ネイビー · 箔',
      ko: '네이비 · 포일',
      es: 'Azul noche · detalle metalizado',
      fr: 'Bleu nuit · dorure',
      de: 'Navy · Folie',
      pt: 'Azul profundo · detalhe metalizado',
      it: 'Blu profondo · dettaglio metallico',
      zh: '海军蓝 · 烫金',
      vi: 'Navy · nhũ kim loại'
    }
  },
  {
    enName: 'Museum Note',
    material: 'Editorial · Rule grid',
    expectedNames: {
      en: 'Museum Note',
      ja: 'ミュージアム・ノート',
      ko: '뮤지엄 노트',
      es: 'Nota de museo',
      fr: 'Note de musée',
      de: 'Museumsnotiz',
      pt: 'Nota de museu',
      it: 'Nota museale',
      zh: '博物馆笺',
      vi: 'Ghi chép bảo tàng'
    },
    expectedMaterials: {
      en: 'Editorial · Rule grid',
      ja: 'エディトリアル · 罫線グリッド',
      ko: '에디토리얼 · 그리드 라인',
      es: 'Editorial · Cuadrícula de líneas',
      fr: 'Éditorial · Grille lignée',
      de: 'Editorial · Linienraster',
      pt: 'Editorial · Grade de linhas',
      it: 'Editoriale · Griglia a linee',
      zh: '编辑排版 · 细线网格',
      vi: 'Editorial · Lưới kẻ mảnh'
    }
  },
  {
    enName: 'Classic Letterpress',
    material: 'Cotton rag · Letterpress',
    expectedNames: {
      en: 'Classic Letterpress',
      ja: 'クラシック・レタープレス',
      ko: '클래식 레터프레스',
      es: 'Letterpress clásico',
      fr: 'Letterpress classique',
      de: 'Klassischer Letterpress',
      pt: 'Letterpress clássico',
      it: 'Letterpress classico',
      zh: '经典凸版',
      vi: 'Letterpress cổ điển'
    },
    expectedMaterials: {
      en: 'Cotton rag · Letterpress',
      ja: 'コットン紙 · 活版印刷',
      ko: '코튼지 · 레터프레스',
      es: 'Papel de algodón · Letterpress',
      fr: 'Papier coton · Letterpress',
      de: 'Baumwollpapier · Letterpress',
      pt: 'Papel de algodão · Letterpress',
      it: 'Carta cotone · Letterpress',
      zh: '棉纸 · 凸版印刷',
      vi: 'Giấy cotton · Letterpress'
    }
  }
];

for (const tmpl of sampleTemplates) {
  for (const loc of supportedLocales) {
    const res = resolveCustomerStyleDisplay({
      locale: loc,
      templateName: tmpl.enName,
      material: tmpl.material,
      slotIndex: 0
    });

    const expName = tmpl.expectedNames[loc];
    const expMat = tmpl.expectedMaterials[loc];

    assert.equal(res.name, expName, `locale ${loc} template ${tmpl.enName} name mapped properly`);
    assert.equal(res.material, expMat, `locale ${loc} template ${tmpl.enName} material mapped properly`);
    assert.equal(res.badge, expName, `locale ${loc} badge matches name`);
    assert.equal(res.sub, expMat, `locale ${loc} sub matches material`);

    if (loc === 'ja' && tmpl.enName !== 'Midnight Lume') {
      assert.notEqual(res.name, tmpl.enName, 'Japanese name must be localized');
      assert.notEqual(res.material, tmpl.material, 'Japanese material must be localized');
    }
    pass(`known_mapping_verified:${loc}:${tmpl.enName}`);
  }
}

// ============================================================================
// 3. Missing Metadata Fallback (All 10 Locales)
// ============================================================================
for (const loc of supportedLocales) {
  const prefix = expectedNeutralPrefixes[loc];

  // 3A. Missing templateName with slotIndex 0, 1, 2
  for (let idx = 0; idx < 3; idx++) {
    const expectedLabel = `${prefix} ${String(idx + 1).padStart(2, '0')}`;

    for (const emptyName of [undefined, null, '', '   ']) {
      const res = resolveCustomerStyleDisplay({
        locale: loc,
        templateName: emptyName,
        material: 'Cotton · Foil',
        slotIndex: idx
      });

      assert.equal(res.name, expectedLabel, `locale ${loc} missing name slot ${idx} produces neutral label`);
      assert.equal(res.material, '', `missing name must produce empty material, no raw leak`);
      assert.equal(res.sub, '', `missing name must produce empty sub`);
      assert.equal(res.badge, expectedLabel, `missing name badge matches neutral label`);

      // Non-English locales whose prefix is not Direction must not expose English "Direction"
      if (!['en', 'fr'].includes(loc)) {
        assert.ok(!res.name.includes('Direction'), `locale ${loc} neutral label must not contain English 'Direction'`);
      }
      pass(`missing_name_slot_${idx}:${loc}`);
    }
  }

  // 3B. Missing templateName without slotIndex -> brand fallback "CardeLume"
  const resNoSlot = resolveCustomerStyleDisplay({
    locale: loc,
    templateName: undefined,
    material: undefined,
    slotIndex: undefined
  });
  assert.equal(resNoSlot.name, 'CardeLume', `locale ${loc} without slotIndex falls back to CardeLume`);
  assert.equal(resNoSlot.material, '', 'material must be empty');
  assert.equal(resNoSlot.badge, 'CardeLume', 'badge must match CardeLume');
  assert.equal(resNoSlot.sub, '', 'sub must be empty');
  pass(`missing_name_no_slot:${loc}`);
}

// ============================================================================
// 4. Unknown Metadata Fallback (Never Expose Raw English)
// ============================================================================
for (const loc of supportedLocales) {
  const prefix = expectedNeutralPrefixes[loc];
  const expectedSlot0 = `${prefix} 01`;

  // 4A. Unknown template name + unknown material
  const unknownBoth = resolveCustomerStyleDisplay({
    locale: loc,
    templateName: 'Completely Unknown Design Concept 999',
    material: 'Raw Space-Age Polymer 404',
    slotIndex: 0
  });

  assert.equal(unknownBoth.name, expectedSlot0, `locale ${loc} unknown template name must use localized neutral label`);
  assert.notEqual(unknownBoth.name, 'Completely Unknown Design Concept 999', `locale ${loc} must never expose raw unknown name`);
  assert.notEqual(unknownBoth.material, 'Raw Space-Age Polymer 404', `locale ${loc} must never expose raw unknown material`);
  assert.equal(unknownBoth.material, '', `locale ${loc} unknown metadata material must be empty`);
  assert.equal(unknownBoth.sub, '', `locale ${loc} unknown metadata sub must be empty`);
  assert.equal(unknownBoth.badge, expectedSlot0, `badge matches neutral label`);
  pass(`unknown_name_and_material:${loc}`);

  // 4B. Known template name + unknown material
  const knownNameUnknownMat = resolveCustomerStyleDisplay({
    locale: loc,
    templateName: 'Luxury Editorial',
    material: 'Unmapped Exotic Fibre',
    slotIndex: 0
  });

  assert.notEqual(knownNameUnknownMat.name, expectedSlot0, `locale ${loc} known name must not be replaced by neutral slot`);
  assert.notEqual(knownNameUnknownMat.material, 'Unmapped Exotic Fibre', `locale ${loc} must never leak unmapped material`);
  assert.equal(knownNameUnknownMat.material, '', `locale ${loc} unmapped material must safely fall back to empty string`);
  assert.equal(knownNameUnknownMat.sub, '', `locale ${loc} sub must safely fall back to empty string`);
  pass(`known_name_unknown_material:${loc}`);
}

// ============================================================================
// 5. CardStudio Source Audit (No Customer-Visible Hardcoded Original)
// ============================================================================
const studioPath = path.join(root, 'apps/web/components/card-studio.tsx');
const studioSource = fs.readFileSync(studioPath, 'utf8');

// 5A. Assert no customer-visible hardcoded Original
assert.ok(!studioSource.includes('aria-label="Original"'), 'card-studio.tsx must NOT contain customer-visible aria-label="Original"');
assert.ok(!studioSource.includes('title="Original"'), 'card-studio.tsx must NOT contain customer-visible title="Original"');
pass('no_hardcoded_original_label_in_card_studio');

// 5B. Assert experience.originalColor is wired to the button
assert.ok(studioSource.includes('aria-label={experience.originalColor}'), 'card-studio.tsx must wire aria-label={experience.originalColor}');
assert.ok(studioSource.includes('title={experience.originalColor}'), 'card-studio.tsx must wire title={experience.originalColor}');
pass('experience_original_color_wired');

// 5C. Assert internal accentMode "original" is preserved
assert.ok(studioSource.includes('accentMode==="original"'), 'card-studio.tsx must preserve internal accentMode==="original"');
assert.ok(studioSource.includes('setAccentMode("original")'), 'card-studio.tsx must preserve setAccentMode("original")');
assert.ok(studioSource.includes('mood-original'), 'card-studio.tsx must preserve mood-original css class');
pass('internal_accent_mode_original_preserved');

// 5D. Assert all 10 locales in experience define originalColor & original
const expectedOriginalTranslations = {
  en: 'Original',
  ja: 'オリジナル',
  ko: '오리지널',
  es: 'Original',
  fr: 'Original',
  de: 'Original',
  pt: 'Original',
  it: 'Originale',
  zh: '原版',
  vi: 'Nguyên bản'
};

for (const loc of supportedLocales) {
  const trans = expectedOriginalTranslations[loc];
  assert.ok(
    studioSource.includes(`originalColor:"${trans}"`),
    `card-studio.tsx experience[${loc}] must define originalColor:"${trans}"`
  );
  pass(`card_studio_experience_originalColor_${loc}`);
}

// ============================================================================
// 6. Function Compatibility & Regression Guards
// ============================================================================
// 6A. styleDisplay retains compatibility
const sd1 = styleDisplay('ja', 'Luxury Editorial', 'Cotton · Foil');
assert.equal(sd1.name, '上質なエディトリアル');
assert.equal(sd1.material, 'コットン · 箔');

const sd2 = styleDisplay('en', 'Custom Raw Name', 'Custom Raw Mat');
assert.equal(sd2.name, 'Custom Raw Name', 'styleDisplay maintains raw fallback for custom names');
assert.equal(sd2.material, 'Custom Raw Mat', 'styleDisplay maintains raw fallback for custom materials');

// 6B. directionDisplay retains compatibility
assert.equal(directionDisplay('ja', 'editorial').badge, 'エディトリアル');
assert.equal(directionDisplay('en', 'midnight').badge, 'Midnight');

// 6C. Existing template-label-identity-stress.ts assertions parity
const museumEn = resolveCustomerStyleDisplay({
  locale: 'en',
  templateName: 'Museum Note',
  material: 'Editorial · Rule grid',
  slotIndex: 1
});
assert.equal(museumEn.name, 'Museum Note');
assert.equal(museumEn.material, 'Editorial · Rule grid');

const luxuryJa = resolveCustomerStyleDisplay({
  locale: 'ja',
  templateName: 'Luxury Editorial',
  material: 'Cotton · Foil',
  slotIndex: 1
});
assert.equal(luxuryJa.name, '上質なエディトリアル');
assert.equal(luxuryJa.material, 'コットン · 箔');

const neutralEnSlot1 = resolveCustomerStyleDisplay({
  locale: 'en',
  slotIndex: 1
});
assert.equal(neutralEnSlot1.name, 'Direction 02');

pass('compatibility_and_parity_checks_pass');

console.log(JSON.stringify({
  status: 'PASS',
  suite: 'customer-copy-localization-stress',
  localesCovered: supportedLocales.length,
  totalChecks: checks
}, null, 2));
