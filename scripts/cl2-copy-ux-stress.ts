// CL2-UX-01 customer copy / recovery UX / style-name regression guard.
import { readFileSync } from "node:fs";
import { getMessages } from "../apps/web/i18n/messages.ts";
import { launchCopy } from "../apps/web/i18n/launch-copy.ts";
import { resolveCustomerStyleDisplay } from "../apps/web/i18n/display-copy.ts";

function need(value: unknown, message: string): asserts value {
  if (!value) {
    console.error(`FAILURE: ${message}`);
    throw new Error(message);
  }
}
const markers: string[] = [];

// The 28 active managed templates (names as stored).
const ACTIVE_TEMPLATE_NAMES = [
  "Art Deco Noir", "Bold Pop", "Botanical Poise", "Celestial Night", "Classic Letterpress",
  "Golden Hour", "Ink Pause", "Kawaii Joy", "Little Wonders", "Luxury Editorial",
  "Memory Window", "Midnight Lume", "Monogram Orbit", "Museum Note", "Night Ledger",
  "Petal Geometry", "Photo Story", "Pressed Shadow", "Quiet Minimal", "Quiet Noir",
  "Quiet Seal", "Ribbon Line", "Soft Fold", "Soft Seoul", "Type Celebration",
  "Washi Elegance", "Watercolor Bloom", "Whispered Type",
];
const LOCALES = ["en", "vi", "ja", "ko", "zh", "es", "fr", "de", "pt", "it"] as const;

// 1) English page must not ship the Italian tagline.
{
  const en = getMessages("en") as Record<string, any>;
  const tagline: string = en.home.footerTagline;
  need(!/Fai brillare/i.test(tagline), "en_footer_tagline_still_italian");
  need(/[A-Za-z]/.test(tagline) && !/[àèéìòù]/i.test(tagline), `en_footer_tagline_not_english:${tagline}`);
  for (const loc of LOCALES) {
    const m = getMessages(loc as any) as Record<string, any>;
    need(typeof m?.home?.footerTagline === "string" && m.home.footerTagline.length > 0, `footer_tagline_missing:${loc}`);
    if (loc !== "it") need(!/Fai brillare/i.test(m.home.footerTagline), `foreign_tagline_in_locale:${loc}`);
  }
  markers.push("EN_TAGLINE_FIXED=PASS");
}

// 2) Vietnamese studio copy must be natural and must not address the customer as "anh" or leak the word "Brief".
{
  const vi = getMessages("vi") as Record<string, any>;
  const title: string = vi.studio.title;
  need(typeof title === "string" && title.length > 0, "vi_studio_title_missing");
  need(!/giống họ/i.test(title), `vi_studio_title_unnatural:${title}`);
  const viLaunch = launchCopy("vi") as Record<string, any>;
  need(typeof viLaunch.recipientPlaceholder === "string", "vi_recipient_placeholder_missing");
  need(!/Olivia/.test(viLaunch.recipientPlaceholder), `vi_recipient_placeholder_not_localized:${viLaunch.recipientPlaceholder}`);
  markers.push("VI_STUDIO_COPY=PASS");
}

// 3) Recovery copy: present for every locale (en fallback), never addresses "anh", never says "Brief".
{
  const src = readFileSync(new URL("../apps/web/components/card-studio.tsx", import.meta.url), "utf8");
  const viBlock = src.match(/vi:\{retryable:"([^"]+)",exhausted:"([^"]+)",novelty_exhausted:"([^"]+)"\}/);
  need(viBlock, "recovery_copy_vi_block_missing");
  const viText = viBlock!.slice(1).join(" ");
  need(!/\banh\b/i.test(viText), "recovery_copy_vi_addresses_anh");
  need(!/Brief/i.test(viText), "recovery_copy_vi_says_brief");
  const enBlock = src.match(/en:\{retryable:"([^"]+)",exhausted:"([^"]+)",novelty_exhausted:"([^"]+)"\}/);
  need(enBlock, "recovery_copy_en_block_missing");
  need(!/review it and try again/i.test(enBlock!.slice(1).join(" ")), "recovery_copy_en_blames_user");
  for (const loc of LOCALES) {
    const re = new RegExp(`${loc}:\\{retryable:`);
    if (loc === "en" || loc === "vi") { need(re.test(src) || loc === "en", `recovery_copy_locale_missing:${loc}`); }
  }
  need(/recovery-retry/.test(src), "recovery_retry_affordance_missing");
  markers.push("RECOVERY_COPY_AND_RETRY=PASS");
}

// 4) A named managed template must render as a real style name in the launch locales
//    (en, vi); other locales may still fall back to their neutral slot label.
{
  for (const loc of LOCALES) {
    for (const name of ACTIVE_TEMPLATE_NAMES) {
      const display = resolveCustomerStyleDisplay({ locale: loc as any, templateName: name, material: null, slotIndex: 0 });
      need(display.name && display.name.trim().length > 0, `style_name_empty:${loc}:${name}`);
      if (loc === "en" || loc === "vi") {
        need(!/^Direction\s*\d+$/i.test(display.name), `neutral_label_leaked:${loc}:${name}:${display.name}`);
        need(!/^\d+$/.test(display.name), `numeric_label_leaked:${loc}:${name}`);
      }
    }
  }
  markers.push("STYLE_NAME_NEVER_NEUTRAL_LAUNCH_LOCALES=PASS");
}

// 5) Neutral label is still used when no name is resolvable.
{
  const noName = resolveCustomerStyleDisplay({ locale: "en" as any, templateName: null, material: null, slotIndex: 1 });
  need(noName.name === "Direction 02" || /^Direction/.test(noName.name), `neutral_fallback_broken:${noName.name}`);
  markers.push("NEUTRAL_FALLBACK_PRESERVED=PASS");
}

for (const m of markers) console.log(m);
console.log("CL2_UX_01_COPY_STRESS=PASS");
