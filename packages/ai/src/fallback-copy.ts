import type { GenerationBrief } from "@cardelume/card-schema";
import type { TemplateMeta } from "@cardelume/templates";

export interface DeterministicFallbackCopyResult {
  kicker: string;
  headline: string;
  body: string;
  creativeThesis: string;
  customerRationale: string;
}

export type SupportedLanguage = "en" | "vi" | "es" | "fr" | "de" | "pt" | "it" | "ja" | "ko" | "zh";
export type OccasionFamily = "birthday" | "anniversary" | "thank_you" | "congratulations" | "new_baby" | "custom";
export type FeelingFamily = "elegant" | "warm" | "romantic" | "fun" | "surprise";

export function resolveLanguage(locale?: string): SupportedLanguage {
  const norm = (locale || "en").toLowerCase().trim();
  if (norm.startsWith("vi")) return "vi";
  if (norm.startsWith("es")) return "es";
  if (norm.startsWith("fr")) return "fr";
  if (norm.startsWith("de")) return "de";
  if (norm.startsWith("pt")) return "pt";
  if (norm.startsWith("it")) return "it";
  if (norm.startsWith("ja")) return "ja";
  if (norm.startsWith("ko")) return "ko";
  if (norm.startsWith("zh")) return "zh";
  return "en";
}

export function normalizeOccasionFamily(occasion?: string): { family: OccasionFamily; text: string; isGenericOther: boolean } {
  const raw = (occasion || "").trim();
  const norm = raw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").trim();
  if (!norm || norm === "other" || norm === "general" || norm === "custom") {
    return { family: "custom", text: raw || "other", isGenericOther: true };
  }
  if (norm === "birthday" || norm === "cumpleanos" || norm === "anniversaire" || norm === "geburtstag" || norm === "compleanno" || norm === "sinh nhat" || norm === "aniversario" || norm.includes("誕生") || norm.includes("생일") || norm.includes("생신") || norm.includes("生日")) {
    return { family: "birthday", text: raw, isGenericOther: false };
  }
  if (norm === "anniversary" || norm === "aniversario" || norm === "jahrestag" || norm === "ky niem" || norm.includes("記念") || norm.includes("기념") || norm.includes("周年") || norm.includes("週年")) {
    return { family: "anniversary", text: raw, isGenericOther: false };
  }
  if (norm.startsWith("thank") || norm === "gracias" || norm === "agradecimiento" || norm === "merci" || norm === "remerciement" || norm === "danke" || norm === "dank" || norm.startsWith("obrigad") || norm === "gratidao" || norm === "grazie" || norm === "ringraziamento" || norm === "cam on" || norm === "tri an" || norm.includes("ありがとう") || norm.includes("感謝") || norm.includes("감사") || norm.includes("고마") || norm.includes("谢谢")) {
    return { family: "thank_you", text: raw, isGenericOther: false };
  }
  if (norm.startsWith("congrat") || norm === "felicidades" || norm === "logro" || norm.startsWith("felicitat") || norm === "reussite" || norm.startsWith("gluckw") || norm === "erfolg" || norm.startsWith("paraben") || norm === "conquista" || norm.startsWith("congratulaz") || norm === "traguardo" || norm === "chuc mung" || norm === "thanh tuu" || norm.includes("おめでとう") || norm.includes("達成") || norm.includes("축하") || norm.includes("恭喜") || norm.includes("祝贺")) {
    return { family: "congratulations", text: raw, isGenericOther: false };
  }
  if (norm === "new baby" || norm === "bebe" || norm.startsWith("recien nacid") || norm.startsWith("nouveau ne") || norm.startsWith("neugeboren") || norm.startsWith("recem nascid") || norm === "neonato" || norm === "bambino" || norm === "em be" || norm === "chao be" || norm.includes("赤ちゃん") || norm.includes("出産") || norm.includes("아기") || norm.includes("宝宝") || norm.includes("新生")) {
    return { family: "new_baby", text: raw, isGenericOther: false };
  }
  return { family: "custom", text: raw, isGenericOther: false };
}

export function matchFeelingFamily(feeling?: string): FeelingFamily | null {
  const raw = (feeling || "Warm").trim();
  const norm = raw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  if (norm.startsWith("elegant") || norm.startsWith("refined") || norm === "thanh lich" || norm === "tinh te" || norm.startsWith("elegan") || norm.startsWith("raffin") || norm === "vornehm" || norm.includes("エレガント") || norm.includes("上品") || norm.includes("우아") || norm.includes("优雅") || norm.includes("高雅")) {
    return "elegant";
  }
  if (norm.startsWith("warm") || norm.startsWith("tender") || norm === "am ap" || norm === "diu dang" || norm.startsWith("calid") || norm.startsWith("chaleur") || norm.startsWith("herzlich") || norm.startsWith("calor") || norm.includes("あたたか") || norm.includes("温か") || norm.includes("따뜻") || norm.includes("温暖") || norm.includes("温馨")) {
    return "warm";
  }
  if (norm.startsWith("romantic") || norm.startsWith("intimat") || norm === "lang man" || norm.startsWith("romant") || norm.includes("ロマン") || norm.includes("愛") || norm.includes("로맨") || norm.includes("浪漫")) {
    return "romantic";
  }
  if (norm.startsWith("fun") || norm.startsWith("playful") || norm === "tuoi vui" || norm === "ron rang" || norm.startsWith("divert") || norm.startsWith("amus") || norm.startsWith("joyeu") || norm.startsWith("froh") || norm.startsWith("lust") || norm.includes("楽しい") || norm.includes("陽気") || norm.includes("즐거") || norm.includes("有趣") || norm.includes("欢乐")) {
    return "fun";
  }
  if (norm.startsWith("surprise") || norm.startsWith("unexpected") || norm === "bat ngo" || norm.startsWith("sorpres") || norm.startsWith("uberrasch") || norm.includes("サプライズ") || norm.includes("놀라") || norm.includes("惊喜")) {
    return "surprise";
  }
  return null;
}

export function normalizeFeelingFamily(feeling?: string): FeelingFamily {
  return matchFeelingFamily(feeling) ?? "warm";
}

function capitalizeFirst(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const FEELING_WORDS: Record<SupportedLanguage, Record<FeelingFamily, string>> = {
  en: { elegant: "refined", warm: "warm", romantic: "intimate", fun: "playful", surprise: "unexpected" },
  vi: { elegant: "thanh lịch", warm: "ấm áp", romantic: "lãng mạn", fun: "tươi vui", surprise: "bất ngờ" },
  es: { elegant: "elegante", warm: "cálido", romantic: "romántico", fun: "divertido", surprise: "sorpresa" },
  fr: { elegant: "élégant", warm: "chaleureux", romantic: "romantique", fun: "joyeux", surprise: "surprise" },
  de: { elegant: "elegant", warm: "herzlich", romantic: "romantisch", fun: "fröhlich", surprise: "überraschung" },
  pt: { elegant: "elegante", warm: "caloroso", romantic: "romântico", fun: "divertido", surprise: "surpresa" },
  it: { elegant: "elegante", warm: "caloroso", romantic: "romantico", fun: "divertente", surprise: "sorpresa" },
  ja: { elegant: "上品な", warm: "温かい", romantic: "ロマンチックな", fun: "楽しい", surprise: "サプライズ" },
  ko: { elegant: "우아한", warm: "따뜻한", romantic: "로맨틱한", fun: "즐거운", surprise: "놀라운" },
  zh: { elegant: "优雅的", warm: "温暖的", romantic: "浪漫的", fun: "欢乐的", surprise: "惊喜的" },
};

const OCCASION_NAMES: Record<SupportedLanguage, Record<OccasionFamily, string>> = {
  en: { birthday: "birthday", anniversary: "anniversary", thank_you: "thank you", congratulations: "achievement", new_baby: "new baby", custom: "your own occasion" },
  vi: { birthday: "sinh nhật", anniversary: "kỷ niệm", thank_you: "lời cảm ơn", congratulations: "thành tựu", new_baby: "em bé", custom: "dịp riêng" },
  es: { birthday: "cumpleaños", anniversary: "aniversario", thank_you: "agradecimiento", congratulations: "felicidades", new_baby: "bebé", custom: "tu ocasión" },
  fr: { birthday: "anniversaire", anniversary: "anniversaire", thank_you: "remerciement", congratulations: "félicitations", new_baby: "bébé", custom: "votre occasion" },
  de: { birthday: "geburtstag", anniversary: "jahrestag", thank_you: "danke", congratulations: "glückwünsche", new_baby: "baby", custom: "dein anlass" },
  pt: { birthday: "aniversário", anniversary: "aniversário", thank_you: "gratidão", congratulations: "parabéns", new_baby: "bebê", custom: "sua ocasião" },
  it: { birthday: "compleanno", anniversary: "anniversario", thank_you: "ringraziamento", congratulations: "congratulazioni", new_baby: "neonato", custom: "tua occasione" },
  ja: { birthday: "お誕生日", anniversary: "記念日", thank_you: "感謝", congratulations: "おめでとう", new_baby: "赤ちゃん", custom: "特別な日" },
  ko: { birthday: "생일", anniversary: "기념일", thank_you: "감사", congratulations: "축하", new_baby: "아기", custom: "특별한 날" },
  zh: { birthday: "生日", anniversary: "纪念日", thank_you: "感谢", congratulations: "祝贺", new_baby: "宝宝", custom: "专属节日" },
};

function buildThesis(
  slot: string,
  slotIndex: number,
  occasion: string,
  template?: Pick<TemplateMeta, "name" | "materialWorld" | "energy" | "visualDirection"> & { archetype?: string }
): string {
  const tName = template?.name || "Curated Template";
  const visual = template?.visualDirection || slot;
  const archetype = template?.archetype || (slot === "photo" ? "photo" : slot === "midnight" ? "midnight" : slot === "quiet" ? "quiet" : "editorial");
  const energy = template?.energy || "quiet";
  const occasionPhrase = occasion.toLowerCase().trim() || "milestone";

  if (slot === "photo" || slotIndex === 3) {
    return `Visual keepsake curation defines ${tName}, framing personal memories alongside ${energy} resonance for this ${occasionPhrase} direction.`;
  }
  if (slot === "midnight" || slotIndex === 1) {
    return `Nocturne ambiance in ${tName} pairs ${energy} cadence against muted depth, presenting this ${occasionPhrase} direction through luminous poise.`;
  }
  if (slot === "quiet" || (slotIndex === 2 && slot !== "photo")) {
    return `Understated intimacy guides ${tName}, drawing upon ${visual} stillness and soft tactile boundaries for this ${occasionPhrase} direction.`;
  }
  return `Editorial perspective in ${tName}: centering ${visual} structure with ${archetype} discipline to honor this ${occasionPhrase} direction.`;
}

function buildCustomerRationale(
  lang: SupportedLanguage,
  slot: string,
  slotIndex: number,
  occasionFamily: OccasionFamily,
  feelingFamily: FeelingFamily,
  customOccasion?: string,
  feelingOverride?: string
): string {
  const occ = customOccasion || OCCASION_NAMES[lang][occasionFamily];
  const feel = feelingOverride || FEELING_WORDS[lang][feelingFamily];

  switch (lang) {
    case "vi":
      if (slot === "midnight" || slotIndex === 1) return `Ánh sáng ${feel} soi rạng ngày ${occ}.`;
      if (slot === "quiet" || slotIndex === 2) return `Khoảnh khắc ${feel} lắng đọng cho ngày ${occ}.`;
      if (slot === "photo") return `Khung hình lưu giữ nét ${feel} của ngày ${occ}.`;
      return `Một hướng đi ${feel} phù hợp với dịp ${occ}.`;
    case "es":
      if (slot === "midnight" || slotIndex === 1) return `Una visión luminosa y ${feel} para celebrar ${occ}.`;
      if (slot === "quiet" || slotIndex === 2) return `Un recuerdo íntimo y ${feel} para ${occ}.`;
      if (slot === "photo") return `Una imagen guardada con tono ${feel} para ${occ}.`;
      return `Una propuesta ${feel} para acompañar ${occ}.`;
    case "fr":
      if (slot === "midnight" || slotIndex === 1) return `Un éclat lumineux et ${feel} pour ce bel ${occ}.`;
      if (slot === "quiet" || slotIndex === 2) return `Une note délicate et ${feel} pour célébrer cet ${occ}.`;
      if (slot === "photo") return `Un souvenir capturé avec un ton ${feel} pour cet ${occ}.`;
      return `Une création ${feel} pour honorer cet ${occ}.`;
    case "de":
      if (slot === "midnight" || slotIndex === 1) return `Ein stimmungsvoller ${feel}er Entwurf für diesen ${occ}.`;
      if (slot === "quiet" || slotIndex === 2) return `Ein dezenter und ${feel}er Meilenstein für ${occ}.`;
      if (slot === "photo") return `Ein festgehaltener Bildmoment mit ${feel}er Note für ${occ}.`;
      return `Ein ${feel}er Akzent für diesen ${occ}.`;
    case "pt":
      if (slot === "midnight" || slotIndex === 1) return `Uma harmonia luminosa e ${feel} para ${occ}.`;
      if (slot === "quiet" || slotIndex === 2) return `Uma lembrança serena e ${feel} para este ${occ}.`;
      if (slot === "photo") return `Um retrato afetivo e ${feel} para este ${occ}.`;
      return `Uma proposta ${feel} para acompanhar ${occ}.`;
    case "it":
      if (slot === "midnight" || slotIndex === 1) return `Un respiro luminoso e ${feel} per questo ${occ}.`;
      if (slot === "quiet" || slotIndex === 2) return `Un ricordo delicato e ${feel} per questo ${occ}.`;
      if (slot === "photo") return `Un'immagine custodita con tocco ${feel} per questo ${occ}.`;
      return `Una proposta ${feel} per accompagnare ${occ}.`;
    case "ja":
      if (slot === "midnight" || slotIndex === 1) return `夜空の光を纏う${feel}${occ}の表現です。`;
      if (slot === "quiet" || slotIndex === 2) return `静けさを大切にした${feel}${occ}の記念です。`;
      if (slot === "photo") return `大切な記憶を留める${feel}写真の記念です。`;
      return `${occ}にふさわしい${feel}デザインです。`;
    case "ko":
      if (slot === "midnight" || slotIndex === 1) return `은은한 빛과 함께하는 ${feel} ${occ}입니다.`;
      if (slot === "quiet" || slotIndex === 2) return `여백의 아름다움을 살린 ${feel} ${occ} 기념입니다.`;
      if (slot === "photo") return `소중한 순간을 담아낸 ${feel} 사진 기념입니다.`;
      return `${occ}에 어울리는 ${feel} 감성의 디자인입니다.`;
    case "zh":
      if (slot === "midnight" || slotIndex === 1) return `在柔和光芒中呈现${feel}${occ}。`;
      if (slot === "quiet" || slotIndex === 2) return `注重留白与真诚的${feel}${occ}典藏。`;
      if (slot === "photo") return `定格美好瞬间的${feel}影像记录。`;
      return `适合${occ}的${feel}格调设计。`;
    default:
      if (slot === "midnight" || slotIndex === 1) return `A luminous and ${feel} direction for ${occ}.`;
      if (slot === "quiet" || slotIndex === 2) return `An understated and ${feel} keepsake for ${occ}.`;
      if (slot === "photo") return `A captured memory and ${feel} tribute for ${occ}.`;
      return `A ${feel} perspective for this ${occ}.`;
  }
}

interface LocalizedCopySlotData {
  kicker: string;
  headline: string;
  body: string;
}

function getEnglishCopy(
  slot: string,
  slotIndex: number,
  occ: OccasionFamily,
  feelingWord: string,
  name?: string,
  detail?: string,
  customOccasion?: string
): LocalizedCopySlotData {
  const occLabel = customOccasion || OCCASION_NAMES.en[occ];
  if (slotIndex === 0 || slot === "editorial") {
    let kicker = `FOR YOUR ${occLabel.toUpperCase()}`;
    let headline = `${name ? `${name}, celebrating` : "Celebrating"} your special ${occLabel}.`;
    let body = `${name ? `For ${name}: here` : "Here"} is to a ${feelingWord} milestone${detail ? `, inspired by ${detail}` : ""}, honoring every shared memory.`;
    if (occ === "anniversary") {
      kicker = "ANNIVERSARY KEEPSAKE";
      headline = `${name ? `${name}, celebrating` : "Celebrating"} another milestone of love on your anniversary.`;
      body = `${name ? `For ${name}: here` : "Here"} is to an enduring ${feelingWord} bond${detail ? `, inspired by ${detail}` : ""}, cherishing our story together.`;
    } else if (occ === "thank_you") {
      kicker = "WITH GRATITUDE";
      headline = `${name ? `${name}, with` : "With"} deepest gratitude and heartfelt appreciation.`;
      body = `${name ? `For ${name}: sending` : "Sending"} my most ${feelingWord} thank you${detail ? `, inspired by ${detail}` : ""}, grateful for your kindness and support.`;
    } else if (occ === "congratulations") {
      kicker = "HEARTFELT CONGRATULATIONS";
      headline = `${name ? `${name}, celebrating` : "Celebrating"} a proud congratulations achievement.`;
      body = `${name ? `For ${name}: warm` : "Warm"} praise for this ${feelingWord} milestone${detail ? `, inspired by ${detail}` : ""}, honoring all your dedication.`;
    } else if (occ === "new_baby") {
      kicker = "WELCOME LITTLE ONE";
      headline = `${name ? `${name}, welcoming` : "Welcoming"} a precious new baby into the world.`;
      body = `${name ? `For ${name}: sending` : "Sending"} my most ${feelingWord} wishes${detail ? `, inspired by ${detail}` : ""} as you celebrate this beautiful baby.`;
    }
    return { kicker, headline: capitalizeFirst(headline), body };
  }

  if (slotIndex === 1 || slot === "midnight") {
    let kicker = "MIDNIGHT CELEBRATION";
    let headline = `${name ? `${name}, let` : "Let"} the evening shine on your ${occLabel}.`;
    let body = `${name ? `Thinking of ${name} and wishing` : "Wishing"} quiet wonder under the stars as a beautiful new chapter unfolds.`;
    if (occ === "anniversary") {
      kicker = "LUMINOUS ANNIVERSARY";
      headline = `${name ? `${name}, shining` : "Shining"} bright on this cherished anniversary evening.`;
      body = `${name ? `Thinking of ${name} and honoring` : "Honoring"} the golden radiance of a love that grows deeper with time.`;
    } else if (occ === "thank_you") {
      kicker = "NOCTURNE GRATITUDE";
      headline = `${name ? `${name}, a` : "A"} warm thank you note under the evening light.`;
      body = `${name ? `Grateful to ${name} for` : "Deeply grateful for"} being a steady light and true source of support.`;
    } else if (occ === "congratulations") {
      kicker = "RADIANT SUCCESS";
      headline = `${name ? `${name}, radiant` : "Radiant"} congratulations on your milestone achievement.`;
      body = `${name ? `Celebrating ${name} and honor` : "Honoring"} this shining victory with genuine pride and admiration.`;
    } else if (occ === "new_baby") {
      kicker = "STARRY WONDER";
      headline = `${name ? `${name}, quiet` : "Quiet"} starlight for your newborn baby.`;
      body = `${name ? `Blessings to ${name} and family` : "Blessings to the family"} as gentle peace and moonlight watch over your sweet child.`;
    }
    return { kicker, headline: capitalizeFirst(headline), body };
  }

  if (slot === "photo") {
    let kicker = "CAPTURED MEMORY";
    let headline = `A timeless picture to celebrate this ${occLabel}.`;
    let body = "Cherishing every captured memory and the enduring beauty of moments shared across the years.";
    if (occ === "anniversary") {
      kicker = "TIMELESS KEEPSAKE";
      headline = "A captured portrait of love on this anniversary.";
      body = "Preserving the laughter and devotion that make each milestone together so deeply meaningful.";
    } else if (occ === "thank_you") {
      kicker = "CHERISHED MEMORY";
      headline = "Framing our heartfelt gratitude in a lasting keepsake.";
      body = "A lasting image of gratitude to thank those whose kindness has guided us along the way.";
    }
    return { kicker, headline: capitalizeFirst(headline), body };
  }

  // quiet slot
  let kicker = "TIMELESS KEEPSAKE";
  let headline = `A gentle pause for this special ${occLabel}.`;
  let body = "May quiet peace, enduring warmth, and joyful reflection accompany you in the seasons ahead.";
  if (occ === "anniversary") {
    kicker = "QUIET DEVOTION";
    headline = "A quiet anniversary tribute to enduring devotion.";
    body = "True love speaks softly through mutual trust, gentle patience, and unwavering companionship.";
  } else if (occ === "thank_you") {
    kicker = "GENTLE REFLECTION";
    headline = "A quiet message of gratitude and heartfelt thank you.";
    body = "Real gratitude needs no loud celebration; it rests securely in lasting respect and affection.";
  }
  return { kicker, headline: capitalizeFirst(headline), body };
}

function getVietnameseCopy(
  slot: string,
  slotIndex: number,
  occ: OccasionFamily,
  feelingWord: string,
  name?: string,
  detail?: string,
  customOccasion?: string
): LocalizedCopySlotData {
  const occLabel = customOccasion || OCCASION_NAMES.vi[occ];
  if (slotIndex === 0 || slot === "editorial") {
    let kicker = `DỊP ${occLabel.toUpperCase()}`;
    let headline = `${name ? `${name}, chúc mừng ngày ${occLabel}` : `Chúc mừng ngày ${occLabel}`} trọn vẹn yêu thương.`;
    let body = `${name ? `Gửi ${name}: một` : "Một"} lời chúc ${feelingWord} nhân ngày ${occLabel}${detail ? `, nâng niu ${detail}` : ""} cùng bao kỷ niệm quý giá.`;
    if (occ === "birthday") {
      kicker = "MỪNG SINH NHẬT";
      headline = `${name ? `${name}, chúc mừng sinh nhật` : "Chúc mừng sinh nhật"} ấm áp và an lành.`;
      body = `${name ? `Gửi ${name}: chúc` : "Chúc"} bạn tuổi mới ${feelingWord}${detail ? `, nâng niu ${detail}` : ""}, luôn vững bước và ngập tràn niềm vui.`;
    } else if (occ === "anniversary") {
      kicker = "NGÀY KỶ NIỆM";
      headline = `${name ? `${name}, chúc mừng ngày kỷ niệm` : "Chúc mừng ngày kỷ niệm"} đong đầy hạnh phúc.`;
      body = `${name ? `Gửi ${name}: kỷ` : "Kỷ"} niệm này thêm ${feelingWord}${detail ? `, nâng niu ${detail}` : ""}, ghi dấu hành trình gắn bó ngọt ngào và bền chặt.`;
    } else if (occ === "thank_you") {
      kicker = "LỜI TRI ÂN";
      headline = `${name ? `${name}, xin gửi lời cảm ơn` : "Xin gửi lời cảm ơn"} chân thành và sâu sắc nhất.`;
      body = `${name ? `Gửi ${name}: cảm` : "Cảm"} ơn bạn với tất cả sự ${feelingWord}${detail ? `, nâng niu ${detail}` : ""}, vì đã luôn đồng hành và sẻ chia cùng tôi.`;
    } else if (occ === "congratulations") {
      kicker = "CHÚC MỪNG THÀNH TỰU";
      headline = `${name ? `${name}, chúc mừng thành tựu` : "Chúc mừng thành tựu"} đáng tự hào của bạn.`;
      body = `${name ? `Gửi ${name}: xin` : "Xin"} chúc mừng kết quả ${feelingWord}${detail ? `, nâng niu ${detail}` : ""}, mở ra những chặng đường thênh thang phía trước.`;
    } else if (occ === "new_baby") {
      kicker = "CHÀO ĐÓN THIÊN THẦN NHỎ";
      headline = `${name ? `${name}, chào đón em bé` : "Chào đón em bé"} đến với thế giới yêu thương.`;
      body = `${name ? `Gửi ${name}: chúc` : "Chúc"} em bé lớn lên trong vòng tay ${feelingWord}${detail ? `, nâng niu ${detail}` : ""}, luôn khỏe mạnh và bình an mỗi ngày.`;
    }
    return { kicker, headline: capitalizeFirst(headline), body };
  }

  if (slotIndex === 1 || slot === "midnight") {
    let kicker = "ÁNH SÁNG KỶ NIỆM";
    let headline = `${name ? `${name}, thắp sáng` : "Thắp sáng"} ngày ${occLabel} với những niềm vui rực rỡ.`;
    let body = `${name ? `Mong ${name}` : "Mong bạn"} luôn giữ trọn niềm tin và sự thanh thản, tựa như ánh sao đêm soi tỏ muôn nẻo đường.`;
    if (occ === "birthday") {
      kicker = "ĐÊM LUNG LINH";
      headline = `${name ? `${name}, thắp sáng` : "Thắp sáng"} ngày sinh nhật với muôn vàn hy vọng.`;
      body = `${name ? `Chúc ${name}` : "Chúc bạn"} đón tuổi mới cùng những ước mơ lấp lánh như bầu trời đêm tĩnh lặng và kỳ diệu.`;
    } else if (occ === "anniversary") {
      kicker = "ÁNH SÁNG GẮN KẾT";
      headline = `${name ? `${name}, tình yêu` : "Tình yêu"} soi sáng chặng đường kỷ niệm đầy thiêng liêng.`;
      body = `${name ? `Bên ${name}, m` : "M"}ỗi chặng đường đã qua đều trở thành ký ức lung linh, bền bỉ qua năm tháng.`;
    } else if (occ === "thank_you") {
      kicker = "TRI ÂN SÂU SẮC";
      headline = `${name ? `${name}, tấm lòng` : "Tấm lòng"} cảm ơn tỏa rạng như vì sao đêm dịu dàng.`;
      body = `${name ? `Biết ơn ${name}` : "Biết ơn bạn"} vì sự chở che chân tình, làm bừng sáng những thời khắc gian khó nhất.`;
    } else if (occ === "congratulations") {
      kicker = "KHOẢNH KHẮC TỎA SÁNG";
      headline = `${name ? `${name}, vinh quang` : "Vinh quang"} này xứng đáng với bao nỗ lực không ngừng.`;
      body = `${name ? `Mừng cho ${name}` : "Mừng cho bạn"}, chúc ngọn lửa nhiệt huyết luôn dẫn lối tới những thành công rực rỡ mai sau.`;
    } else if (occ === "new_baby") {
      kicker = "ÁNH SAO BÌNH YÊN";
      headline = `${name ? `${name}, chúc em bé` : "Chúc em bé"} tựa như ánh trăng thanh bình soi bóng.`;
      body = `${name ? `Cầu chúc gia đình ${name}` : "Cầu chúc cả gia đình"} luôn ấm êm tiếng cười trẻ thơ, êm đềm tựa khúc ru đêm.`;
    }
    return { kicker, headline: capitalizeFirst(headline), body };
  }

  if (slot === "photo") {
    let kicker = "KHOẢNH KHẮC ĐÁNG NHỚ";
    let headline = `Lưu giữ khoảnh khắc ${occLabel} tươi đẹp nhất.`;
    let body = "Mỗi bức hình là một mảnh ghép ký ức, nhắc ta nhớ về những nụ cười rạng rỡ và sự gắn kết chân thành.";
    if (occ === "anniversary") {
      kicker = "BỨC HÌNH KỶ NIỆM";
      headline = "Gói trọn bức hình kỷ niệm cùng năm tháng êm đềm.";
      body = "Những khoảnh khắc được lưu lại sẽ cùng ta đi qua năm tháng, bền bỉ và trọn vẹn nghĩa tình.";
    } else if (occ === "thank_you") {
      kicker = "HÌNH ẢNH TRI ÂN";
      headline = "Lưu lại hình ảnh chân tình thay muôn lời cảm ơn.";
      body = "Tấm hình nhỏ ghi dấu tấm lòng lớn, nhắc nhớ về sự đồng hành và sẻ chia vô giá.";
    }
    return { kicker, headline: capitalizeFirst(headline), body };
  }

  // quiet slot
  let kicker = "LỜI CHÚC AN YÊN";
  let headline = `Một khoảng lặng bình yên mừng ngày ${occLabel}.`;
  let body = "Cầu chúc tháng ngày phía trước luôn êm đềm, thanh thản và đón nhận những điều thiện lành sâu sắc.";
  if (occ === "anniversary") {
    kicker = "KỶ NIỆM BÌNH YÊN";
    headline = "Khoảnh khắc tĩnh lặng nâng niu chặng đường kỷ niệm bên nhau.";
    body = "Thời gian có thể trôi nhanh, nhưng sự trân quý và tình cảm chân thành sẽ mãi luôn bền chặt.";
  } else if (occ === "thank_you") {
    kicker = "CHÂN TÌNH GẮNG BÓ";
    headline = "Sự cảm ơn chân thành lắng đọng nơi trang giấy mộc.";
    body = "Tình cảm chân thành không cần phô trương, chỉ cần ghi dấu sâu sắc nơi đáy lòng để nhớ mãi.";
  }
  return { kicker, headline: capitalizeFirst(headline), body };
}

function getSpanishCopy(
  slot: string,
  slotIndex: number,
  occ: OccasionFamily,
  feelingWord: string,
  name?: string,
  detail?: string,
  customOccasion?: string
): LocalizedCopySlotData {
  const occLabel = customOccasion || OCCASION_NAMES.es[occ];
  if (slotIndex === 0 || slot === "editorial") {
    let kicker = "FELIZ CUMPLEAÑOS";
    let headline = `${name ? `${name}, celebrando` : "Celebrando"} un cumpleaños muy especial.`;
    let body = `${name ? `Para ${name}: un` : "Un"} deseo ${feelingWord}${detail ? `, recordando ${detail}` : ""} para comenzar un año colmado de dicha y serenidad.`;
    if (occ === "anniversary") {
      kicker = "FELIZ ANIVERSARIO";
      headline = `${name ? `${name}, celebrando` : "Celebrando"} otro aniversario de amor y complicidad.`;
      body = `${name ? `Para ${name}: un` : "Un"} homenaje ${feelingWord}${detail ? `, recordando ${detail}` : ""} a este camino compartido con honda ternura.`;
    } else if (occ === "thank_you") {
      kicker = "CON GRATITUD";
      headline = `${name ? `${name}, con` : "Con"} profundo agradecimiento y aprecio sincero.`;
      body = `${name ? `Para ${name}: mi` : "Mi"} agradecimiento ${feelingWord}${detail ? `, recordando ${detail}` : ""} por tu compañía generosa en cada paso.`;
    } else if (occ === "congratulations") {
      kicker = "FELICIDADES";
      headline = `${name ? `${name}, felicitaciones` : "Felicitaciones"} por este gran logro alcanzado.`;
      body = `${name ? `Para ${name}: una` : "Una"} felicitación ${feelingWord}${detail ? `, recordando ${detail}` : ""} por este éxito tan merecido y valioso.`;
    } else if (occ === "new_baby") {
      kicker = "BIENVENIDO BEBÉ";
      headline = `${name ? `${name}, dando` : "Dando"} la bienvenida a este hermoso bebé recién nacido.`;
      body = `${name ? `Para ${name}: todo` : "Todo"} el cariño ${feelingWord}${detail ? `, recordando ${detail}` : ""} en la llegada de esta tierna vida.`;
    } else if (occ === "custom") {
      kicker = `PARA ${occLabel.toUpperCase()}`;
      headline = `${name ? `${name}, celebrando` : "Celebrando"} con alegría ${occLabel}.`;
      body = `${name ? `Para ${name}: un` : "Un"} voto ${feelingWord}${detail ? `, recordando ${detail}` : ""} en este día tan significativo para todos.`;
    }
    return { kicker, headline: capitalizeFirst(headline), body };
  }

  if (slotIndex === 1 || slot === "midnight") {
    let kicker = "NOCHE DE FIESTA";
    let headline = `${name ? `${name}, que` : "Que"} la luz de este cumpleaños brille siempre en tu camino.`;
    let body = `${name ? `Deseando a ${name}` : "Deseando siempre"} paz, alegrías duraderas y nuevos horizontes llenos de serenidad compartida.`;
    if (occ === "anniversary") {
      kicker = "LUZ COMPARTIDA";
      headline = `${name ? `${name}, que` : "Que"} su amor ilumine este hermoso aniversario con esplendor.`;
      body = `${name ? `Junto a ${name}, c` : "C"}ada instante compartido se convierte en un hermoso destello para siempre.`;
    } else if (occ === "thank_you") {
      kicker = "GRACIAS DE CORAZÓN";
      headline = `${name ? `${name}, gracias` : "Gracias"} por ser una luz sincera y constante.`;
      body = `${name ? `Agradeciendo a ${name}` : "Agradeciendo de corazón"} cada gesto generoso que deja una huella imborrable.`;
    } else if (occ === "congratulations") {
      kicker = "LOGRO Y FELICIDADES";
      headline = `${name ? `${name}, que` : "Que"} este gran logro siga iluminando el porvenir con gloria.`;
      body = `${name ? `Celebrando con ${name}` : "Celebrando contigo"} estas merecidas felicidades fruto de constancia y pasión.`;
    } else if (occ === "new_baby") {
      kicker = "DULCE BEBÉ";
      headline = `${name ? `${name}, que` : "Que"} este tierno bebé llene de luz vuestro dulce hogar.`;
      body = `${name ? `Bendiciones a ${name}` : "Bendiciones sinceras"} y a toda la familia en la llegada de su bebé.`;
    } else if (occ === "custom") {
      kicker = "BRILLO EN LA NOCHE";
      headline = `${name ? `${name}, que` : "Que"} la luz acompañe siempre ${occLabel}.`;
      body = `${name ? `Celebrando con ${name}` : "Con alegría"}, que este momento perdure en la memoria compartida.`;
    }
    return { kicker, headline: capitalizeFirst(headline), body };
  }

  if (slot === "photo") {
    return {
      kicker: "RECUERDO ETERNO",
      headline: `Una imagen guardada para celebrar ${occLabel}.`,
      body: "El tiempo se detiene en este retrato que conservará intacta la belleza de nuestro cariño compartido."
    };
  }

  return {
    kicker: "UN RECUERDO SINCERO",
    headline: `Un instante de calma para festejar ${occLabel} con plenitud.`,
    body: "Las palabras más sinceras no necesitan prisa, solo la verdad de un corazón sereno y agradecido."
  };
}

function getFrenchCopy(
  slot: string,
  slotIndex: number,
  occ: OccasionFamily,
  feelingWord: string,
  name?: string,
  detail?: string,
  customOccasion?: string
): LocalizedCopySlotData {
  const occLabel = customOccasion || OCCASION_NAMES.fr[occ];
  if (slotIndex === 0 || slot === "editorial") {
    let kicker = "JOYEUX ANNIVERSAIRE";
    let headline = `${name ? `${name}, un bel anniversaire` : "Un bel anniversaire"} célébré avec grande élégance.`;
    let body = `${name ? `Pour ${name} : un` : "Un"} vœu ${feelingWord}${detail ? `, en souvenir de ${detail}` : ""} pour ouvrir une année magnifique et lumineuse.`;
    if (occ === "anniversary") {
      kicker = "FÊTE D'ANNIVERSAIRE";
      headline = `${name ? `${name}, un anniversaire` : "Un anniversaire"} précieux pour célébrer votre amour fidèle.`;
      body = `${name ? `Pour ${name} : un` : "Un"} hommage ${feelingWord}${detail ? `, en souvenir de ${detail}` : ""} à ce beau chemin parcouru tendrement à deux.`;
    } else if (occ === "thank_you") {
      kicker = "REMERCIEMENT SINCÈRE";
      headline = `${name ? `${name}, un remerciement` : "Un remerciement"} sincère venu du fond du cœur.`;
      body = `${name ? `Pour ${name} : un` : "Un"} message ${feelingWord}${detail ? `, en souvenir de ${detail}` : ""} pour exprimer toute ma profonde gratitude.`;
    } else if (occ === "congratulations") {
      kicker = "TOUTES NOS FÉLICITATIONS";
      headline = `${name ? `${name}, toutes nos félicitations` : "Toutes nos félicitations"} pour cette admirable réussite.`;
      body = `${name ? `Pour ${name} : un` : "Un"} éclat ${feelingWord}${detail ? `, en souvenir de ${detail}` : ""} pour saluer ce parcours exemplaire et inspirant.`;
    } else if (occ === "new_baby") {
      kicker = "BIENVENUE BÉBÉ";
      headline = `${name ? `${name}, bienvenue à ce merveilleux bébé` : "Bienvenue à ce merveilleux bébé"} parmi nous.`;
      body = `${name ? `Pour ${name} : toute` : "Toute"} la tendresse ${feelingWord}${detail ? `, en souvenir de ${detail}` : ""} pour entourer ce petit être si cher.`;
    } else if (occ === "custom") {
      kicker = `POUR ${occLabel.toUpperCase()}`;
      headline = `${name ? `${name}, célébrons` : "Célébrons"} avec émotion ${occLabel}.`;
      body = `${name ? `Pour ${name} : une` : "Une"} pensée ${feelingWord}${detail ? `, en souvenir de ${detail}` : ""} en ce jour mémorable pour tous.`;
    }
    return { kicker, headline: capitalizeFirst(headline), body };
  }

  if (slotIndex === 1 || slot === "midnight") {
    let kicker = "ÉCLAT DU SOIR";
    let headline = `${name ? `${name}, que` : "Que"} la magie de votre anniversaire illumine cette soirée.`;
    let body = `${name ? `En pensant à ${name}` : "En cette heure"}, que cette nouvelle étape apporte joie, sérénité et accomplissement durable.`;
    if (occ === "anniversary") {
      kicker = "LUMIÈRE D'OR";
      headline = `${name ? `${name}, que` : "Que"} la lumière de cet anniversaire guide les années à venir.`;
      body = `${name ? `Aux côtés de ${name}` : "À deux"}, chaque instant partagé devient un souvenir précieux et intemporel.`;
    } else if (occ === "thank_you") {
      kicker = "DOUCE RECONNAISSANCE";
      headline = `${name ? `${name}, merci` : "Merci"} pour votre présence lumineuse et bienveillante.`;
      body = `${name ? `Reconnaissance envers ${name}` : "Du fond du cœur"}, pour ce remerciement sincère et cette générosité rare.`;
    } else if (occ === "congratulations") {
      kicker = "VIVE RÉUSSITE";
      headline = `${name ? `${name}, félicitations` : "Félicitations"} pour cette éclatante réussite méritée.`;
      body = `${name ? `Bravo à ${name}` : "Chapeau bas"}, pour cette belle victoire méritée par tant d'efforts constants.`;
    } else if (occ === "new_baby") {
      kicker = "DOUX BÉBÉ";
      headline = `${name ? `${name}, que` : "Que"} ce doux bébé apporte une clarté nouvelle à votre foyer.`;
      body = `${name ? `Vœux pour ${name}` : "Tous nos vœux"}, pour des nuits douces et de beaux matins entourés de ce bébé chéri.`;
    } else if (occ === "custom") {
      kicker = "LUMIÈRE DU SOIR";
      headline = `${name ? `${name}, que` : "Que"} brille toujours ${occLabel}.`;
      body = `${name ? `Avec ${name}` : "Ensemble"}, avançons vers de nouveaux horizons prometteurs.`;
    }
    return { kicker, headline: capitalizeFirst(headline), body };
  }

  if (slot === "photo") {
    return {
      kicker: "IMAGE ÉTERNELLE",
      headline: `Une image intemporelle pour garder ce moment de ${occLabel}.`,
      body: "Le temps s'arrête sur cette photographie empreinte d'une émotion pure et durable."
    };
  }

  return {
    kicker: "INSTANT DE PAIX",
    headline: `Une pause délicate pour honorer ${occLabel}.`,
    body: "Les plus beaux sentiments s'écrivent avec simplicité, retenue et une infinie sincérité."
  };
}

function getGermanCopy(
  slot: string,
  slotIndex: number,
  occ: OccasionFamily,
  feelingWord: string,
  name?: string,
  detail?: string,
  customOccasion?: string
): LocalizedCopySlotData {
  const occLabel = customOccasion || OCCASION_NAMES.de[occ];
  if (slotIndex === 0 || slot === "editorial") {
    let kicker = "ZUM GEBURTSTAG";
    let headline = `${name ? `${name}, ein herzlicher Geburtstag` : "Ein herzlicher Geburtstag"} voller Freude.`;
    let body = `${name ? `Für ${name}: ein` : "Ein"} Gruß, ganz ${feelingWord}${detail ? `, verbunden mit ${detail}` : ""}, für ein erfülltes neues Lebensjahr voller Glück.`;
    if (occ === "anniversary") {
      kicker = "ZUM JAHRESTAG";
      headline = `${name ? `${name}, ein wunderbarer Jahrestag` : "Ein wunderbarer Jahrestag"} inniger Verbundenheit.`;
      body = `${name ? `Für ${name}: eine` : "Eine"} Erinnerung, ganz ${feelingWord}${detail ? `, verbunden mit ${detail}` : ""}, an viele gemeinsame schöne Zeiten.`;
    } else if (occ === "thank_you") {
      kicker = "HERZLICHER DANK";
      headline = `${name ? `${name}, ein aufrichtiges Danke` : "Ein aufrichtiges Danke"} von ganzem Herzen.`;
      body = `${name ? `Für ${name}: mein` : "Mein"} Dank, ganz ${feelingWord}${detail ? `, verbunden mit ${detail}` : ""}, für deine unschätzbare Unterstützung.`;
    } else if (occ === "congratulations") {
      kicker = "HERZLICHEN GLÜCKWUNSCH";
      headline = `${name ? `${name}, herzliche Glückwünsche` : "Herzliche Glückwünsche"} zu diesem großen Erfolg.`;
      body = `${name ? `Für ${name}: meine` : "Meine"} Anerkennung, ganz ${feelingWord}${detail ? `, verbunden mit ${detail}` : ""}, für diese beachtliche Leistung.`;
    } else if (occ === "new_baby") {
      kicker = "WILLKOMMEN BABY";
      headline = `${name ? `${name}, ein herzliches Willkommen dem Baby` : "Ein herzliches Willkommen dem Baby"} im Leben.`;
      body = `${name ? `Für ${name}: alle` : "Alle"} guten Wünsche, ganz ${feelingWord}${detail ? `, verbunden mit ${detail}` : ""}, zur Ankunft des kleinen Neugeborenen.`;
    } else if (occ === "custom") {
      kicker = `FÜR ${occLabel.toUpperCase()}`;
      headline = `${name ? `${name}, wir würdigen` : "Wir würdigen"} herzlich ${occLabel}.`;
      body = `${name ? `Für ${name}: eine` : "Eine"} Würdigung, ganz ${feelingWord}${detail ? `, verbunden mit ${detail}` : ""}, für diesen denkwürdigen Tag.`;
    }
    return { kicker, headline: capitalizeFirst(headline), body };
  }

  if (slotIndex === 1 || slot === "midnight") {
    let kicker = "GOLDENER ABEND";
    let headline = `${name ? `${name}, möge` : "Möge"} dein Geburtstag im festlichen Abendschein erstrahlen.`;
    let body = `${name ? `Gedanken an ${name}` : "Von Herzen"} begleiten diesen Übergang in ein neues Kapitel voll Zuversicht und Frieden.`;
    if (occ === "anniversary") {
      kicker = "LICHTERGLANZ";
      headline = `${name ? `${name}, euer` : "Euer"} Jahrestag leuchtet wie ein stilles Gestirn in der Nacht.`;
      body = `${name ? `Mit ${name}` : "Gemeinsam"} gewinnt dieser Jahrestag an bleibender Tiefe und verlässlicher Geborgenheit.`;
    } else if (occ === "thank_you") {
      kicker = "TIEFER DANK";
      headline = `${name ? `${name}, danke` : "Danke"} für deine Wärme, die jeden Weg erhellt.`;
      body = `${name ? `Dankbar für ${name}` : "Aufrichtig dankbar"} für deinen Dank und die selbstlose Hilfe, die unvergessen bleibt.`;
    } else if (occ === "congratulations") {
      kicker = "GLÜCKWUNSCH IM LICHT";
      headline = `${name ? `${name}, herzliche` : "Herzliche"} Glückwünsche zu diesem strahlenden Erfolg.`;
      body = `${name ? `Stolz auf ${name}` : "Mit großem Respekt"} blicken wir auf diesen meisterhaft erreichten Erfolg.`;
    } else if (occ === "new_baby") {
      kicker = "KLEINES BABY";
      headline = `${name ? `${name}, möge` : "Möge"} das neugeborene Baby stets behütet aufwachsen.`;
      body = `${name ? `Segen für ${name}` : "Segen"} und die ganze Familie für eine behütete, glückliche Zeit mit dem Baby.`;
    } else if (occ === "custom") {
      kicker = "LICHTSCHEIN";
      headline = `${name ? `${name}, möge` : "Möge"} ${occLabel} in hellem Glanz erstrahlen.`;
      body = `${name ? `Gemeinsam mit ${name}` : "Mit Zuversicht"} blicken wir auf künftige Aufgaben und Erfolge.`;
    }
    return { kicker, headline: capitalizeFirst(headline), body };
  }

  if (slot === "photo") {
    return {
      kicker: "FOTOMOMENT",
      headline: `Ein Bild für die Ewigkeit festgehalten zu ${occLabel}.`,
      body: "Dieser Augenblick bleibt im Bild lebendig und erzählt seine eigene stille Geschichte voller Wärme."
    };
  }

  return {
    kicker: "STILLE FREUDE",
    headline: `Ein leiser Moment der Dankbarkeit und Ruhe zu ${occLabel}.`,
    body: "Wahre Worte brauchen keinen Lärm, sie wirken leise und bleiben tief im Gedächtnis verankert."
  };
}

function getPortugueseCopy(
  slot: string,
  slotIndex: number,
  occ: OccasionFamily,
  feelingWord: string,
  name?: string,
  detail?: string,
  customOccasion?: string
): LocalizedCopySlotData {
  const occLabel = customOccasion || OCCASION_NAMES.pt[occ];
  if (slotIndex === 0 || slot === "editorial") {
    let kicker = "FELIZ ANIVERSÁRIO";
    let headline = `${name ? `${name}, celebrando` : "Celebrando"} um aniversário repleto de carinho.`;
    let body = `${name ? `Para ${name}: um` : "Um"} abraço ${feelingWord}${detail ? `, guardando ${detail}` : ""} para abrir um novo ciclo de alegrias e paz.`;
    if (occ === "anniversary") {
      kicker = "NOSSO ANIVERSÁRIO";
      headline = `${name ? `${name}, celebrando` : "Celebrando"} mais um aniversário de união e amor.`;
      body = `${name ? `Para ${name}: um` : "Um"} tributo ${feelingWord}${detail ? `, guardando ${detail}` : ""} a esta linda história construída a dois.`;
    } else if (occ === "thank_you") {
      kicker = "GRATIDÃO SINCERA";
      headline = `${name ? `${name}, uma` : "Uma"} mensagem de gratidão sincera vinda do coração.`;
      body = `${name ? `Para ${name}: meu` : "Meu"} reconhecimento ${feelingWord}${detail ? `, guardando ${detail}` : ""} por sua generosidade constante e amiga.`;
    } else if (occ === "congratulations") {
      kicker = "PARABÉNS PELA CONQUISTA";
      headline = `${name ? `${name}, parabéns` : "Parabéns"} por esta conquista extraordinária.`;
      body = `${name ? `Para ${name}: uma` : "Uma"} homenagem ${feelingWord}${detail ? `, guardando ${detail}` : ""} a este triunfo tão merecido por seu talento.`;
    } else if (occ === "new_baby") {
      kicker = "BEM-VINDO BEBÊ";
      headline = `${name ? `${name}, dando` : "Dando"} as boas-vindas a este lindo bebê recém-nascido.`;
      body = `${name ? `Para ${name}: todo` : "Todo"} o amor ${feelingWord}${detail ? `, guardando ${detail}` : ""} para acolher esta nova vida que floresce.`;
    } else if (occ === "custom") {
      kicker = `PARA ${occLabel.toUpperCase()}`;
      headline = `${name ? `${name}, celebrando` : "Celebrando"} com apreço ${occLabel}.`;
      body = `${name ? `Para ${name}: um` : "Um"} voto ${feelingWord}${detail ? `, guardando ${detail}` : ""} neste marco tão significativo para todos.`;
    }
    return { kicker, headline: capitalizeFirst(headline), body };
  }

  if (slotIndex === 1 || slot === "midnight") {
    let kicker = "BRILHO DA NOITE";
    let headline = `${name ? `${name}, que` : "Que"} a luz deste aniversário brilhe em seu caminho.`;
    let body = `${name ? `Desejando a ${name}` : "Desejando sempre"} serenidade, sorrisos sinceros e novos dias de esperança renovada.`;
    if (occ === "anniversary") {
      kicker = "LUZ DOURADA";
      headline = `${name ? `${name}, que` : "Que"} o amor ilumine este belo aniversário com ternura.`;
      body = `${name ? `Ao lado de ${name}` : "Juntos"}, cada passo ganha significado perene como uma constelação serena no céu.`;
    } else if (occ === "thank_you") {
      kicker = "OBRIGADO DE CORAÇÃO";
      headline = `${name ? `${name}, obrigado` : "Obrigado"} por ser presença acolhedora e constante.`;
      body = `${name ? `Grato a ${name}` : "Com gratidão sincera"} por cada atitude amiga que transforma os dias mais difíceis.`;
    } else if (occ === "congratulations") {
      kicker = "VIVA ESTA CONQUISTA";
      headline = `${name ? `${name}, parabéns` : "Parabéns"} por esta memorável conquista alcançada.`;
      body = `${name ? `Orgulho de ${name}` : "Com admiração"}, celebrando com parabéns uma vitória fruto de empenho e dedicação.`;
    } else if (occ === "new_baby") {
      kicker = "NOSSO BEBÊ";
      headline = `${name ? `${name}, que` : "Que"} este lindo bebê traga bênçãos infindáveis ao lar.`;
      body = `${name ? `Saúde para ${name}` : "Muita paz"} e serenidade para toda a família acolhendo este querido bebê.`;
    } else if (occ === "custom") {
      kicker = "NOITE RADIANTE";
      headline = `${name ? `${name}, que` : "Que"} resplandeça sempre ${occLabel}.`;
      body = `${name ? `Celebrando com ${name}` : "Em união"}, que o porvir traga realizações plenas e felizes.`;
    }
    return { kicker, headline: capitalizeFirst(headline), body };
  }

  if (slot === "photo") {
    return {
      kicker: "RETRATO ETERNO",
      headline: `Uma lembrança guardada para sempre de ${occLabel}.`,
      body: "O tempo silencia diante deste retrato que guarda o que há de mais puro e verdadeiro em nosso afeto."
    };
  }

  return {
    kicker: "PAZ E MEMÓRIA",
    headline: `Um instante de serenidade para honrar ${occLabel} com verdade.`,
    body: "As palavras mais sinceras repousam na quietude do afeto verdadeiro, sem necessidade de alardes."
  };
}

function getItalianCopy(
  slot: string,
  slotIndex: number,
  occ: OccasionFamily,
  feelingWord: string,
  name?: string,
  detail?: string,
  customOccasion?: string
): LocalizedCopySlotData {
  const occLabel = customOccasion || OCCASION_NAMES.it[occ];
  if (slotIndex === 0 || slot === "editorial") {
    let kicker = "BUON COMPLEANNO";
    let headline = `${name ? `${name}, un compleanno` : "Un compleanno"} ricco di affetto e serenità.`;
    let body = `${name ? `Per ${name}: un` : "Un"} pensiero ${feelingWord}${detail ? `, ricordando ${detail}` : ""} per inaugurare un anno colmo di soddisfazioni sincere.`;
    if (occ === "anniversary") {
      kicker = "BUON ANNIVERSARIO";
      headline = `${name ? `${name}, un anniversario` : "Un anniversario"} speciale per celebrare il vostro cammino.`;
      body = `${name ? `Per ${name}: una` : "Una"} memoria ${feelingWord}${detail ? `, ricordando ${detail}` : ""} a custodia di ogni momento trascorso insieme con amore.`;
    } else if (occ === "thank_you") {
      kicker = "SENTITO RINGRAZIAMENTO";
      headline = `${name ? `${name}, un sincero ringraziamento` : "Un sincero ringraziamento"} per la tua presenza.`;
      body = `${name ? `Per ${name}: la` : "La"} mia gratitudine ${feelingWord}${detail ? `, ricordando ${detail}` : ""} per il tuo generoso e prezioso sostegno costante.`;
    } else if (occ === "congratulations") {
      kicker = "VIVE CONGRATULAZIONI";
      headline = `${name ? `${name}, vive congratulazioni` : "Vive congratulazioni"} per questo splendido traguardo.`;
      body = `${name ? `Per ${name}: il` : "Il"} mio plauso ${feelingWord}${detail ? `, ricordando ${detail}` : ""} per una meta raggiunta con tanto valore e dedizione.`;
    } else if (occ === "new_baby") {
      kicker = "BENVENUTO NEONATO";
      headline = `${name ? `${name}, un dolce benvenuto al neonato` : "Un dolce benvenuto al neonato"} in famiglia.`;
      body = `${name ? `Per ${name}: una` : "Una"} carezza ${feelingWord}${detail ? `, ricordando ${detail}` : ""} per accogliere una nuova vita tra noi con tenerezza.`;
    } else if (occ === "custom") {
      kicker = `PER ${occLabel.toUpperCase()}`;
      headline = `${name ? `${name}, celebriamo` : "Celebriamo"} con gioia ${occLabel}.`;
      body = `${name ? `Per ${name}: un` : "Un"} augurio ${feelingWord}${detail ? `, ricordando ${detail}` : ""} in questo momento degno di memoria sincera.`;
    }
    return { kicker, headline: capitalizeFirst(headline), body };
  }

  if (slotIndex === 1 || slot === "midnight") {
    let kicker = "LUCE DELLA SERA";
    let headline = `${name ? `${name}, che` : "Che"} il tuo compleanno risplenda di gioia autentica.`;
    let body = `${name ? `Augurando a ${name}` : "Con affetto"} giornate liete, serenità d'animo e cammini luminosi verso il domani.`;
    if (occ === "anniversary") {
      kicker = "SPLENDORE D'ORO";
      headline = `${name ? `${name}, il` : "Il"} vostro anniversario splende come una stella nella sera.`;
      body = `${name ? `Accanto a ${name}` : "Insieme"}, ogni giorno vissuto diventa un dono che rischiara il cammino con dolcezza.`;
    } else if (occ === "thank_you") {
      kicker = "GRAZIE DI CUORE";
      headline = `${name ? `${name}, grazie` : "Grazie"} per aver donato calore sincero e guida fedele.`;
      body = `${name ? `Grato a ${name}` : "Con profonda riconoscenza"} per un sentito ringraziamento che lascia il segno nel cuore.`;
    } else if (occ === "congratulations") {
      kicker = "TRAGUARDO LUMINOSO";
      headline = `${name ? `${name}, vive` : "Vive"} congratulazioni per questo meritato successo.`;
      body = `${name ? `Fieri di ${name}` : "Con ammirazione"}, rinnoviamo vive congratulazioni per questa splendida vittoria conquistata.`;
    } else if (occ === "new_baby") {
      kicker = "DOLCE NEONATO";
      headline = `${name ? `${name}, che` : "Che"} questo dolce neonato porti pace infinita nella vostra casa.`;
      body = `${name ? `Pace per ${name}` : "Tanta serenità"} e infinito amore per accogliere il neonato nel suo cammino.`;
    } else if (occ === "custom") {
      kicker = "NOTTE SPECIALE";
      headline = `${name ? `${name}, che` : "Che"} risplenda indelebile ${occLabel}.`;
      body = `${name ? `Condividendo con ${name}` : "Con partecipazione"}, guardiamo avanti con rinnovata fiducia.`;
    }
    return { kicker, headline: capitalizeFirst(headline), body };
  }

  if (slot === "photo") {
    return {
      kicker: "IMMAGINE ETERNA",
      headline: `Un'immagine custodita per fermare il tempo di ${occLabel}.`,
      body: "Questo ricordo visivo conserva intatta l'emozione autentica e preziosa vissuta insieme oggi."
    };
  }

  return {
    kicker: "SERENITÀ E PACE",
    headline: `Un momento quieto per custodire il ricordo di ${occLabel}.`,
    body: "Le emozioni più profonde non fanno rumore, restano custodite nella discrezione del cuore per sempre."
  };
}

function getJapaneseCopy(
  slot: string,
  slotIndex: number,
  occ: OccasionFamily,
  feelingWord: string,
  name?: string,
  detail?: string,
  customOccasion?: string
): LocalizedCopySlotData {
  const occLabel = customOccasion || OCCASION_NAMES.ja[occ];
  if (slotIndex === 0 || slot === "editorial") {
    let kicker = "お誕生日の祝い";
    let headline = `${name ? `${name}さん、お誕生日` : "お誕生日"}を心よりお祝い申し上げます。`;
    let body = `${name ? `${name}さんへ、` : ""}${feelingWord}思いを込めて${detail ? `、${detail}の思い出とともに` : ""}、健やかで実り豊かな一年をお祈りいたします。`;
    if (occ === "anniversary") {
      kicker = "記念日の言葉";
      headline = `${name ? `${name}さん、記念日` : "記念日"}を迎えて深く感謝を申し上げます。`;
      body = `${name ? `${name}さんへ、` : ""}${feelingWord}絆に感謝し${detail ? `、${detail}の思い出とともに` : ""}、これからも共に歩む日々が輝きますように。`;
    } else if (occ === "thank_you") {
      kicker = "心からの感謝";
      headline = `${name ? `${name}さん、心より感謝` : "心より感謝"}の気持ちをお伝えします。`;
      body = `${name ? `${name}さんへ、` : ""}${feelingWord}ご厚意に深く御礼申し上げます${detail ? `。${detail}の記憶とともに` : ""}、変わらぬ敬意を捧げます。`;
    } else if (occ === "congratulations") {
      kicker = "心よりお祝い";
      headline = `${name ? `${name}さん、おめでとう` : "心よりおめでとう"}ございます、素晴らしい達成を称えます。`;
      body = `${name ? `${name}さんへ、` : ""}${feelingWord}努力の成果を讃え${detail ? `、${detail}の歩みとともに` : ""}、さらなる飛躍をお祈りいたします。`;
    } else if (occ === "new_baby") {
      kicker = "赤ちゃんの誕生";
      headline = `${name ? `${name}さん、可愛い赤ちゃんの誕生` : "可愛い赤ちゃんの誕生"}を心から祝福します。`;
      body = `${name ? `${name}さんへ、` : ""}${feelingWord}祝福をお贈りします${detail ? `。${detail}のぬくもりとともに` : ""}、健やかな赤ちゃんの成長を願っております。`;
    } else if (occ === "custom") {
      kicker = "特別な日の記念";
      headline = `${name ? `${name}さん、${occLabel}` : `${occLabel}`}を心よりお祝い申し上げます。`;
      body = `${name ? `${name}さんへ、` : ""}${feelingWord}敬意を込めて${detail ? `、${detail}を胸に` : ""}、輝かしい未来をお祈り申し上げます。`;
    }
    return { kicker, headline, body };
  }

  if (slotIndex === 1 || slot === "midnight") {
    let kicker = "夜空の星灯り";
    let headline = `${name ? `${name}さんの誕生日` : "誕生日"}に輝く星々の祝福を添えて。`;
    let body = `${name ? `${name}さんの新しい日々` : "これからの日々"}が、静かな星明かりのように穏やかで希望に満ちたものとなりますように。`;
    if (occ === "anniversary") {
      kicker = "月のしらべ";
      headline = `${name ? `${name}さんと歩む記念日` : "記念日"}の夜に静かな光が灯ります。`;
      body = `${name ? `${name}さんと紡いだ時間` : "積み重ねた時間"}は、夜空の星座のようにいつまでも色あせることなく輝き続けます。`;
    } else if (occ === "thank_you") {
      kicker = "静かな感謝";
      headline = `${name ? `${name}さんへ、ありがとう` : "ありがとう"}の思いが夜空に優しく響きます。`;
      body = `${name ? `${name}さんからいただいた感謝` : "いただいた感謝"}の温情は、いつも私の心の確かな道しるべとなっております。`;
    } else if (occ === "congratulations") {
      kicker = "おめでとうの灯り";
      headline = `${name ? `${name}さん、おめでとう` : "おめでとう"}ございます、この快挙を夜空の光が照らします。`
      body = `${name ? `${name}さんの不断の歩み` : "真摯な歩み"}が結実したこの瞬間を、心からおめでとうと讃えたいと思います。`;
    } else if (occ === "new_baby") {
      kicker = "赤ちゃんの光";
      headline = `${name ? `${name}さんの元に` : ""}可愛い赤ちゃんの新しい光がそっと舞い降りました。`;
      body = `${name ? `ご家族の皆様` : "皆様"}と赤ちゃんのこれからの日々に、優しく安らかな幸多からんことをお祈りいたします。`;
    } else if (occ === "custom") {
      kicker = "静寂の記念";
      headline = `${name ? `${name}さんの${occLabel}` : `${occLabel}`}に寄り添う穏やかな光をお届けします。`;
      body = `${name ? `${name}さんの前途` : "前途"}に、変わらぬ幸いと豊かな実りがあふれますように願っております。`;
    }
    return { kicker, headline, body };
  }

  if (slot === "photo") {
    return {
      kicker: "記憶の窓",
      headline: `かけがえのない${occLabel}を写真に留めて。`,
      body: "この一枚の風景とともに、大切な記憶がいつまでも優しく心に寄り添いますように。"
    };
  }

  return {
    kicker: "心静かな言葉",
    headline: `手漉き紙の温もりに託す${occLabel}の静かな祈り。`,
    body: "言葉を飾ることなく、心からの敬意と誠実な祈りを静かにここに留めます。"
  };
}

function getKoreanCopy(
  slot: string,
  slotIndex: number,
  occ: OccasionFamily,
  feelingWord: string,
  name?: string,
  detail?: string,
  customOccasion?: string
): LocalizedCopySlotData {
  const occLabel = customOccasion || OCCASION_NAMES.ko[occ];
  if (slotIndex === 0 || slot === "editorial") {
    let kicker = "생일 축하";
    let headline = `${name ? `${name}님의 생일` : "생일"}을 진심으로 축하드립니다.`;
    let body = `${name ? `${name}님에게 ` : ""}${feelingWord} 마음을 담아${detail ? `, ${detail}의 소중한 기억과 함께` : ""} 행복한 한 해가 되시기를 소망합니다.`;
    if (occ === "anniversary") {
      kicker = "기념일 축하";
      headline = `${name ? `${name}님과의 기념일` : "기념일"}을 맞아 깊은 사랑을 전합니다.`;
      body = `${name ? `${name}님에게 ` : ""}${feelingWord} 정성을 담아${detail ? `, ${detail}의 추억과 함께` : ""} 앞으로도 변함없이 함께 걷기를 바랍니다.`;
    } else if (occ === "thank_you") {
      kicker = "감사의 마음";
      headline = `${name ? `${name}님께 깊은 감사` : "깊은 감사"}의 마음을 정성껏 올립니다.`;
      body = `${name ? `${name}님에게 ` : ""}${feelingWord} 감사를 드리며${detail ? `, ${detail}의 배려를 마음에 새겨` : ""} 늘 평안하시기를 기원합니다.`;
    } else if (occ === "congratulations") {
      kicker = "축하의 말씀";
      headline = `${name ? `${name}님의 빛나는 성취` : "빛나는 성취"}를 진심으로 축하드립니다.`;
      body = `${name ? `${name}님에게 ` : ""}${feelingWord} 축하의 박수를 보내며${detail ? `, ${detail}의 결실과 함께` : ""} 더 큰 도약을 응원합니다.`;
    } else if (occ === "new_baby") {
      kicker = "아기의 탄생";
      headline = `${name ? `${name}님의 예쁜 아기` : "예쁜 아기"} 탄생을 온 마음으로 축복합니다.`;
      body = `${name ? `${name}님에게 ` : ""}${feelingWord} 축복을 전하며${detail ? `, ${detail}의 온기 속에서` : ""} 귀여운 아기가 건강하게 자라기를 기도합니다.`;
    } else if (occ === "custom") {
      kicker = "소중한 날";
      headline = `${name ? `${name}님의 ${occLabel}` : `${occLabel}`}을 함께 축하합니다.`;
      body = `${name ? `${name}님에게 ` : ""}${feelingWord} 축복을 보내며${detail ? `, ${detail}의 의미를 담아` : ""} 늘 평안하시기를 응원합니다.`;
    }
    return { kicker, headline, body };
  }

  if (slotIndex === 1 || slot === "midnight") {
    let kicker = "달빛의 축복";
    let headline = `${name ? `${name}님의 생일` : "생일"} 밤하늘에 아름다운 별빛을 띄웁니다.`;
    let body = `${name ? `${name}님의 새해` : "새로운 날들"}가 고요한 밤하늘처럼 평온하고 눈부신 기쁨으로 가득 차기를 기원합니다.`;
    if (occ === "anniversary") {
      kicker = "은하수의 울림";
      headline = `${name ? `${name}님과 함께한 기념일` : "기념일"} 밤하늘에 찬란한 빛이 깃듭니다.`;
      body = `${name ? `${name}님과 쌓아온 날들` : "함께한 시간들"}은 시간이 흘러도 변치 않는 별빛처럼 영원히 빛날 것입니다.`;
    } else if (occ === "thank_you") {
      kicker = "은은한 고마움";
      headline = `${name ? `${name}님, 고마운` : "고마운"} 그 마음에 밤하늘의 빛을 전합니다.`;
      body = `${name ? `${name}님이 보여주신 온기` : "베풀어주신 은혜"}에 깊이 감사드리며, 언제나 제 마음속에 큰 힘이 되어줍니다.`;
    } else if (occ === "congratulations") {
      kicker = "축하의 등불";
      headline = `${name ? `${name}님, 진심으로 축하` : "진심으로 축하"}하며 밤하늘의 빛을 띄웁니다.`;
      body = `${name ? `${name}님의 열정` : "열정과 노력"}에 거듭 축하를 보내며 앞으로 펼쳐질 길을 힘차게 응원합니다.`;
    } else if (occ === "new_baby") {
      kicker = "아기의 별빛";
      headline = `${name ? `${name}님의 품에` : ""} 별빛처럼 맑은 사랑스러운 아기가 찾아왔습니다.`;
      body = `${name ? `온 가족` : "가족 모두"}의 품에서 자라날 아기에게 늘 건강과 은혜가 가득하기를 바랍니다.`;
    } else if (occ === "custom") {
      kicker = "고요한 기념";
      headline = `${name ? `${name}님의 ${occLabel}` : `${occLabel}`} 앞길에 은은하고 고요한 등불을 밝힙니다.`;
      body = `${name ? `${name}님의 발걸음` : "발걸음"}마다 행복과 보람이 가득하기를 늘 응원하겠습니다.`;
    }
    return { kicker, headline, body };
  }

  if (slot === "photo") {
    return {
      kicker: "기억의 창",
      headline: `소중한 한 장의 사진에 담긴 ${occLabel}.`,
      body: "지나가는 계절 속에서도 이 순간의 미소는 언제나 따스하게 기억될 것입니다."
    };
  }

  return {
    kicker: "정갈한 마음",
    headline: `담백한 종이 위에 새기는 ${occLabel}의 안부.`,
    body: "소란스럽지 않은 진심으로, 언제나 당신의 평안과 안녕을 조용히 소망합니다."
  };
}

function getChineseCopy(
  slot: string,
  slotIndex: number,
  occ: OccasionFamily,
  feelingWord: string,
  name?: string,
  detail?: string,
  customOccasion?: string
): LocalizedCopySlotData {
  const occLabel = customOccasion || OCCASION_NAMES.zh[occ];
  if (slotIndex === 0 || slot === "editorial") {
    let kicker = "生日欢聚";
    let headline = `${name ? `${name}，衷心祝贺生日` : "衷心祝贺生日"}快乐安康。`;
    let body = `${name ? `送给${name}：一份` : "一份"}${feelingWord}祝福${detail ? `，带着${detail}的美好记忆` : ""}，愿新岁平安顺遂、万事如意。`;
    if (occ === "anniversary") {
      kicker = "纪念日致意";
      headline = `${name ? `${name}，喜迎纪念日` : "喜迎纪念日"}美满相伴。`;
      body = `${name ? `送给${name}：岁月` : "岁月"}${feelingWord}${detail ? `，带着${detail}的温馨相守` : ""}，愿相守相依、长乐永康。`;
    } else if (occ === "thank_you") {
      kicker = "深切感谢";
      headline = `${name ? `${name}，致以真诚的感谢` : "致以真诚的感谢"}与敬意。`;
      body = `${name ? `送给${name}：满怀` : "满怀"}${feelingWord}谢意${detail ? `，感念${detail}的一路相伴` : ""}，铭记于心、不胜感激。`;
    } else if (occ === "congratulations") {
      kicker = "热烈祝贺";
      headline = `${name ? `${name}，热烈祝贺` : "热烈祝贺"}取得辉煌成果。`;
      body = `${name ? `送给${name}：见证` : "见证"}${feelingWord}荣耀${detail ? `，伴着${detail}的奋进历程` : ""}，愿前程锦绣、再创佳绩。`;
    } else if (occ === "new_baby") {
      kicker = "喜迎宝宝";
      headline = `${name ? `${name}，热烈祝贺可爱宝宝` : "热烈祝贺可爱宝宝"}平安诞生。`;
      body = `${name ? `送给${name}：满载` : "满载"}${feelingWord}慈爱${detail ? `，凝结${detail}的关怀期盼` : ""}，祝愿宝宝健康快乐成长。`;
    } else if (occ === "custom") {
      kicker = "珍贵时刻";
      headline = `${name ? `${name}，共庆${occLabel}` : `共庆${occLabel}`}万事胜意。`;
      body = `${name ? `送给${name}：诚挚` : "诚挚"}${feelingWord}祝愿${detail ? `，珍藏${detail}的闪光片刻` : ""}，愿未来明朗可期。`;
    }
    return { kicker, headline, body };
  }

  if (slotIndex === 1 || slot === "midnight") {
    let kicker = "夜色微光";
    let headline = `${name ? `${name}，愿明灯照亮生日` : "愿明灯照亮生日"}的美好前程。`;
    let body = `${name ? `祝愿${name}` : "祝愿你"}在未来的每一天里，内心充盈、步履从容，收获无尽欢喜。`;
    if (occ === "anniversary") {
      kicker = "纪念日星光";
      headline = `${name ? `${name}，纪念日相伴` : "纪念日相伴"}的岁月如星河般璀璨永恒。`;
      body = `${name ? `与${name}携手` : "携手同行"}走过的风雨兼程，皆化作这纪念日夜空下最为坚实动人的守护。`;
    } else if (occ === "thank_you") {
      kicker = "至诚谢意";
      headline = `${name ? `${name}，谢谢` : "谢谢"}你如微光般给予的无私暖意。`;
      body = `${name ? `对${name}的感谢` : "心中的感谢"}历久弥新，你的悉心帮助是前行路上最珍贵的指引。`;
    } else if (occ === "congratulations") {
      kicker = "祝贺荣光";
      headline = `${name ? `${name}，祝贺` : "祝贺"}你凭借卓越成就光彩照人。`;
      body = `${name ? `为${name}祝贺` : "衷心祝贺"}喝彩，愿乘风破浪、在广阔天地中绽放更耀眼的光芒。`;
    } else if (occ === "new_baby") {
      kicker = "宝宝新星";
      headline = `${name ? `${name}，一颗` : "一颗"}纯真新星般的宝宝为家点亮无限希望。`;
      body = `${name ? `祈愿${name}阖家` : "祈愿全家"}幸福美满，守候宝宝每一天平安喜乐、茁壮成长。`;
    } else if (occ === "custom") {
      kicker = "璀璨之夜";
      headline = `${name ? `${name}，这一刻${occLabel}` : `这一刻${occLabel}`}将在时光长河中熠熠生辉。`;
      body = `${name ? `与${name}同庆` : "同庆此刻"}，愿往后岁月皆有良辰美景相伴相随。`;
    }
    return { kicker, headline, body };
  }

  if (slot === "photo") {
    return {
      kicker: "光影定格",
      headline: `定格${occLabel}珍贵画面的恒久留念。`,
      body: "定格的瞬间成为永恒，静静述说着生命中最动人的故事与温情。"
    };
  }

  return {
    kicker: "纸间心语",
    headline: `素纸留白处的一抹温润心声致${occLabel}。`,
    body: "无需过多言语喧哗，真挚的情谊早已深深刻在静默的岁月之中。"
  };
}

export function deterministicFallbackCopy(
  brief: GenerationBrief,
  slot: string,
  slotIndex: number,
  template?: Pick<TemplateMeta, "name" | "materialWorld" | "energy" | "visualDirection"> & { archetype?: string }
): DeterministicFallbackCopyResult {
  const lang = resolveLanguage(brief.locale);
  const occNorm = normalizeOccasionFamily(brief.occasion);
  const matchedFeeling = matchFeelingFamily(brief.feeling);
  const feelingFamily: FeelingFamily = matchedFeeling ?? "warm";
  const customFeeling = matchedFeeling ? undefined : (brief.feeling || "").trim() || undefined;
  const feelingWord = customFeeling || FEELING_WORDS[lang][feelingFamily];

  // Recipient only if supplied, and only in slotIndex 0 and 1 (at most two cards)
  const rawRecipient = (brief.recipient || "").trim();
  const name = slotIndex < 2 && rawRecipient.length > 0 ? rawRecipient : undefined;

  // Detail woven naturally into exactly one card (slotIndex 0)
  const rawDetail = (brief.detail || "").trim();
  const detail = slotIndex === 0 && rawDetail.length > 0 ? rawDetail : undefined;

  const customOccasion = !occNorm.isGenericOther && occNorm.family === "custom" && occNorm.text.length > 0 ? occNorm.text : undefined;

  let copyData: LocalizedCopySlotData;
  switch (lang) {
    case "vi":
      copyData = getVietnameseCopy(slot, slotIndex, occNorm.family, feelingWord, name, detail, customOccasion);
      break;
    case "es":
      copyData = getSpanishCopy(slot, slotIndex, occNorm.family, feelingWord, name, detail, customOccasion);
      break;
    case "fr":
      copyData = getFrenchCopy(slot, slotIndex, occNorm.family, feelingWord, name, detail, customOccasion);
      break;
    case "de":
      copyData = getGermanCopy(slot, slotIndex, occNorm.family, feelingWord, name, detail, customOccasion);
      break;
    case "pt":
      copyData = getPortugueseCopy(slot, slotIndex, occNorm.family, feelingWord, name, detail, customOccasion);
      break;
    case "it":
      copyData = getItalianCopy(slot, slotIndex, occNorm.family, feelingWord, name, detail, customOccasion);
      break;
    case "ja":
      copyData = getJapaneseCopy(slot, slotIndex, occNorm.family, feelingWord, name, detail, customOccasion);
      break;
    case "ko":
      copyData = getKoreanCopy(slot, slotIndex, occNorm.family, feelingWord, name, detail, customOccasion);
      break;
    case "zh":
      copyData = getChineseCopy(slot, slotIndex, occNorm.family, feelingWord, name, detail, customOccasion);
      break;
    default:
      copyData = getEnglishCopy(slot, slotIndex, occNorm.family, feelingWord, name, detail, customOccasion);
      break;
  }

  const creativeThesis = buildThesis(slot, slotIndex, brief.occasion, template);
  const customerRationale = buildCustomerRationale(lang, slot, slotIndex, occNorm.family, feelingFamily, customOccasion, customFeeling);

  return {
    kicker: copyData.kicker,
    headline: copyData.headline,
    body: copyData.body,
    creativeThesis,
    customerRationale,
  };
}
