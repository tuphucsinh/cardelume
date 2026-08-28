/**
 * CardeLume Step 17C — EXPERIMENT ONLY.
 * Original procedural template proof-of-concepts. No external template/art imports.
 * Not wired into production renderer/template catalog.
 */

export const experimentalTemplateIds = [
  "whispered-type",
  "museum-note",
  "monogram-orbit",
  "ribbon-line",
  "memory-window",
  "type-celebration",
  "quiet-seal",
  "pressed-shadow",
  "ink-pause",
  "petal-geometry",
  "night-ledger",
  "soft-fold",
];

const allowed = new Set(experimentalTemplateIds);
const esc = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&apos;");
const n = (value) => Math.round(value * 100) / 100;
const fit = (value, maxSize, maxWidth, factor = .56) => Math.max(18, Math.min(maxSize, maxWidth / Math.max(1, String(value).length * factor)));

function hashText(value) {
  let h = 2166136261;
  for (const ch of String(value)) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function initials(recipient) {
  const parts = String(recipient || "Lume").trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("") || "CL";
}

export function experimentalTemplateSvg(input) {
  const {
    templateId,
    width = 1000,
    height = 1400,
    background = "#f5f0e6",
    foreground = "#17212f",
    accent = "#a18255",
    headline = "A beautiful moment",
    body = "Made just for you.",
    recipient = "Mai",
    date = "28 · 08 · 2026",
  } = input ?? {};
  if (!allowed.has(templateId)) throw new Error(`unsupported_experimental_template:${templateId}`);

  const w = width, h = height, cx = w / 2;
  const serif = "Georgia, 'Times New Roman', serif";
  const sans = "Arial, Helvetica, sans-serif";
  const text = (x, y, value, size, opts = {}) => {
    const { family = serif, anchor = "start", weight = 400, opacity = 1, italic = false, rotate = 0, spacing = 0 } = opts;
    const transform = rotate ? ` transform="rotate(${n(rotate)} ${n(x)} ${n(y)})"` : "";
    return `<text x="${n(x)}" y="${n(y)}" fill="${foreground}" font-family="${esc(family)}" font-size="${n(size)}" font-weight="${weight}" font-style="${italic ? "italic" : "normal"}" letter-spacing="${n(spacing)}" text-anchor="${anchor}" opacity="${opacity}"${transform}>${esc(value)}</text>`;
  };
  const rule = (x1, y1, x2, y2, opacity = .55, sw = 2) => `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${accent}" stroke-width="${sw}" opacity="${opacity}"/>`;

  let art = "";
  switch (templateId) {
    case "whispered-type": {
      const hero = String(headline).split(/\s+/)[0] || "You";
      art += text(w * .08, h * .42, hero, Math.min(210, w * .22), { weight: 500, spacing: -5 });
      art += rule(w * .09, h * .50, w * .56, h * .50, .48, 2);
      art += text(w * .61, h * .505, date.toUpperCase(), 18, { family: sans, spacing: 3, opacity: .72 });
      art += text(w * .10, h * .61, body, 34, { italic: true, opacity: .92 });
      art += text(w * .10, h * .72, `FOR ${recipient.toUpperCase()}`, 16, { family: sans, spacing: 4, opacity: .64 });
      break;
    }
    case "museum-note": {
      art += `<rect x="${n(w*.08)}" y="${n(h*.08)}" width="${n(w*.84)}" height="${n(h*.84)}" fill="none" stroke="${foreground}" stroke-width="1" opacity=".18"/>`;
      art += rule(w*.08,h*.27,w*.92,h*.27,.34,1.5);
      art += rule(w*.69,h*.08,w*.69,h*.27,.34,1.5);
      art += text(w*.11,h*.17,"CARDELUME / PRIVATE NOTE",14,{family:sans,spacing:3,opacity:.55});
      art += text(w*.72,h*.17,date,15,{family:sans,opacity:.65});
      art += text(w*.12,h*.49,headline,fit(headline,64,w*.72),{weight:500});
      art += text(w*.12,h*.58,body,28,{italic:true,opacity:.82});
      art += text(w*.12,h*.80,recipient,22,{family:sans,spacing:2,opacity:.62});
      break;
    }
    case "monogram-orbit": {
      const seed = hashText(`${recipient}|${date}|${headline}`);
      const r1 = 150 + (seed % 55), r2 = r1 + 72;
      const ox = cx + ((seed >>> 6) % 70 - 35), oy = h*.34 + ((seed >>> 12) % 80 - 40);
      art += `<circle cx="${n(ox)}" cy="${n(oy)}" r="${n(r1)}" fill="none" stroke="${accent}" stroke-width="2" opacity=".48"/>`;
      art += `<circle cx="${n(ox)}" cy="${n(oy)}" r="${n(r2)}" fill="none" stroke="${foreground}" stroke-width="1" opacity=".15"/>`;
      for (let i=0;i<5;i++) {
        const angle = ((seed >>> (i*3)) % 360) * Math.PI/180;
        const rr = i%2 ? r2 : r1;
        art += `<circle cx="${n(ox+Math.cos(angle)*rr)}" cy="${n(oy+Math.sin(angle)*rr)}" r="${n(5+i*1.4)}" fill="${accent}" opacity="${n(.42+i*.08)}"/>`;
      }
      art += text(ox,oy+35,initials(recipient),112,{anchor:"middle",weight:500,spacing:3});
      art += text(cx,h*.66,headline,58,{anchor:"middle",weight:500});
      art += text(cx,h*.72,body,27,{anchor:"middle",italic:true,opacity:.8});
      art += text(cx,h*.82,date,15,{anchor:"middle",family:sans,spacing:4,opacity:.58});
      break;
    }
    case "ribbon-line": {
      const y = h*.38;
      art += `<path d="M ${n(-w*.08)} ${n(y)} C ${n(w*.15)} ${n(h*.17)}, ${n(w*.31)} ${n(h*.61)}, ${n(w*.52)} ${n(h*.37)} S ${n(w*.84)} ${n(h*.15)}, ${n(w*1.08)} ${n(h*.42)}" fill="none" stroke="${accent}" stroke-width="${n(w*.012)}" stroke-linecap="round" opacity=".34"/>`;
      art += `<path d="M ${n(-w*.08)} ${n(y+14)} C ${n(w*.15)} ${n(h*.19)}, ${n(w*.31)} ${n(h*.63)}, ${n(w*.52)} ${n(h*.39)} S ${n(w*.84)} ${n(h*.17)}, ${n(w*1.08)} ${n(h*.44)}" fill="none" stroke="${foreground}" stroke-width="1" opacity=".16"/>`;
      art += text(w*.10,h*.58,headline,fit(headline,62,w*.78),{weight:500});
      art += text(w*.10,h*.66,body,fit(body,30,w*.78,.52),{italic:true,opacity:.82});
      art += text(w*.10,h*.80,recipient.toUpperCase(),16,{family:sans,spacing:4,opacity:.6});
      break;
    }
    case "memory-window": {
      const x=w*.12,y=h*.16,pw=w*.62,ph=h*.48;
      art += `<rect x="${n(x)}" y="${n(y)}" width="${n(pw)}" height="${n(ph)}" rx="${n(w*.012)}" fill="${foreground}" opacity=".08"/>`;
      art += `<rect x="${n(x+18)}" y="${n(y+18)}" width="${n(pw-36)}" height="${n(ph-36)}" rx="${n(w*.008)}" fill="none" stroke="${accent}" stroke-width="2" stroke-dasharray="8 11" opacity=".38"/>`;
      art += text(x+pw/2,y+ph/2,"USER PHOTO",22,{anchor:"middle",family:sans,spacing:4,opacity:.38});
      art += text(w*.78,h*.28,date,15,{family:sans,spacing:2,opacity:.62,rotate:90});
      art += text(w*.12,h*.73,headline,58,{weight:500});
      art += text(w*.12,h*.79,body,25,{italic:true,opacity:.78});
      art += text(w*.12,h*.88,recipient,15,{family:sans,spacing:3,opacity:.58});
      break;
    }
    case "type-celebration": {
      const words=String(headline).split(/\s+/).filter(Boolean);
      const a1=words[0]||"Celebrate", a2=words.slice(1).join(" ")||recipient;
      art += text(w*.10,h*.30,a1,fit(a1,130,w*.75,.5),{weight:600,spacing:-4});
      art += text(w*.18,h*.48,a2,fit(a2,104,w*.72,.5),{weight:500,rotate:-3,spacing:-3});
      art += rule(w*.14,h*.58,w*.84,h*.58,.5,3);
      art += text(w*.84,h*.62,date,16,{anchor:"end",family:sans,spacing:3,opacity:.62});
      art += text(w*.14,h*.72,body,29,{italic:true,opacity:.82});
      break;
    }
    case "quiet-seal": {
      const mark=initials(recipient);
      art += `<circle cx="${n(cx)}" cy="${n(h*.28)}" r="${n(w*.065)}" fill="none" stroke="${accent}" stroke-width="3" opacity=".62"/>`;
      art += `<circle cx="${n(cx)}" cy="${n(h*.28)}" r="${n(w*.052)}" fill="none" stroke="${foreground}" stroke-width="1" opacity=".18"/>`;
      art += text(cx,h*.294,mark,35,{anchor:"middle",weight:500,spacing:2});
      art += text(cx,h*.52,headline,62,{anchor:"middle",weight:500});
      art += text(cx,h*.59,body,27,{anchor:"middle",italic:true,opacity:.82});
      art += text(cx,h*.75,date,15,{anchor:"middle",family:sans,spacing:4,opacity:.56});
      break;
    }
    case "pressed-shadow": {
      art += `<rect x="${n(w*.17)}" y="${n(h*.19)}" width="${n(w*.66)}" height="${n(h*.43)}" rx="${n(w*.014)}" fill="${accent}" opacity=".09" transform="rotate(-4 ${n(cx)} ${n(h*.40)})"/>`;
      art += `<rect x="${n(w*.22)}" y="${n(h*.22)}" width="${n(w*.60)}" height="${n(h*.42)}" rx="${n(w*.014)}" fill="${foreground}" opacity=".055" transform="rotate(3 ${n(cx)} ${n(h*.42)})"/>`;
      art += text(w*.12,h*.70,headline,fit(headline,68,w*.76),{weight:500});
      art += text(w*.12,h*.77,body,27,{italic:true,opacity:.82});
      art += text(w*.12,h*.88,recipient.toUpperCase(),15,{family:sans,spacing:4,opacity:.58});
      break;
    }
    case "ink-pause": {
      const seed=hashText(`${recipient}|${headline}`);
      const bend=(seed%90)-45;
      art += `<path d="M ${n(w*.10)} ${n(h*.34)} C ${n(w*.28)} ${n(h*.24+bend)}, ${n(w*.52)} ${n(h*.45-bend*.4)}, ${n(w*.89)} ${n(h*.29)}" fill="none" stroke="${accent}" stroke-width="${n(w*.045)}" stroke-linecap="round" opacity=".22"/>`;
      art += `<path d="M ${n(w*.12)} ${n(h*.35)} C ${n(w*.30)} ${n(h*.27+bend*.5)}, ${n(w*.57)} ${n(h*.43-bend*.25)}, ${n(w*.86)} ${n(h*.30)}" fill="none" stroke="${foreground}" stroke-width="${n(w*.006)}" stroke-linecap="round" opacity=".18"/>`;
      art += text(w*.10,h*.60,headline,fit(headline,64,w*.78),{weight:500});
      art += text(w*.10,h*.68,body,28,{italic:true,opacity:.82});
      art += text(w*.10,h*.82,date,15,{family:sans,spacing:4,opacity:.56});
      break;
    }
    case "petal-geometry": {
      const px=w*.77, py=h*.28;
      for(let i=0;i<7;i++){
        const angle=i*(180/7)-45;
        art += `<ellipse cx="${n(px)}" cy="${n(py)}" rx="${n(w*.055)}" ry="${n(h*.12)}" fill="none" stroke="${i%2?accent:foreground}" stroke-width="${i%2?2:1}" opacity="${i%2?.34:.16}" transform="rotate(${n(angle)} ${n(px)} ${n(py)})"/>`;
      }
      art += text(w*.10,h*.56,headline,fit(headline,68,w*.72),{weight:500});
      art += text(w*.10,h*.64,body,28,{italic:true,opacity:.82});
      art += text(w*.10,h*.80,recipient.toUpperCase(),15,{family:sans,spacing:4,opacity:.58});
      break;
    }
    case "night-ledger": {
      art += `<rect width="${w}" height="${h}" fill="#111a2b"/>`;
      const oldFg=foreground;
      for(let i=0;i<6;i++){const xx=w*(.14+i*.14), yy=h*(.20+((i*37)%5)*.045); art += `<circle cx="${n(xx)}" cy="${n(yy)}" r="${n(i%3===0?5:2.5)}" fill="${accent}" opacity="${n(.34+i*.05)}"/>`; }
      art += `<path d="M ${n(w*.10)} ${n(h*.40)} C ${n(w*.34)} ${n(h*.36)}, ${n(w*.59)} ${n(h*.45)}, ${n(w*.90)} ${n(h*.39)}" fill="none" stroke="${accent}" stroke-width="2" opacity=".46"/>`;
      art += `<text x="${n(w*.10)}" y="${n(h*.60)}" fill="#f5f0e6" font-family="${esc(serif)}" font-size="${n(fit(headline,64,w*.78))}" font-weight="500">${esc(headline)}</text>`;
      art += `<text x="${n(w*.10)}" y="${n(h*.68)}" fill="#f5f0e6" font-family="${esc(serif)}" font-size="28" font-style="italic" opacity=".76">${esc(body)}</text>`;
      art += `<text x="${n(w*.10)}" y="${n(h*.82)}" fill="#f5f0e6" font-family="${esc(sans)}" font-size="15" letter-spacing="4" opacity=".55">${esc(date)}</text>`;
      break;
    }
    case "soft-fold": {
      art += `<path d="M 0 ${n(h*.20)} L ${n(w*.74)} ${n(h*.12)} L ${w} ${n(h*.33)} L ${w} ${n(h*.66)} L ${n(w*.34)} ${n(h*.73)} L 0 ${n(h*.56)} Z" fill="${accent}" opacity=".075"/>`;
      art += `<path d="M ${n(w*.34)} ${n(h*.73)} L ${n(w*.58)} ${n(h*.34)} L ${w} ${n(h*.33)}" fill="none" stroke="${foreground}" stroke-width="1" opacity=".12"/>`;
      art += `<path d="M ${n(w*.58)} ${n(h*.34)} L ${n(w*.74)} ${n(h*.12)}" fill="none" stroke="${accent}" stroke-width="2" opacity=".34"/>`;
      art += text(w*.10,h*.48,headline,fit(headline,68,w*.72),{weight:500});
      art += text(w*.10,h*.56,body,28,{italic:true,opacity:.82});
      art += text(w*.10,h*.84,recipient.toUpperCase(),15,{family:sans,spacing:4,opacity:.58});
      break;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(templateId)} experiment preview"><rect width="100%" height="100%" fill="${background}"/>${art}</svg>`;
}
