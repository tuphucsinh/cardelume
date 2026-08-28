"use client";

import { useEffect } from "react";
import { Download, FileText } from "lucide-react";
import type { VisualDirection } from "@cardelume/templates";
import type { LocaleCode } from "../i18n/messages";
import type { PhotoPalette } from "./photo-palette";
import { CardVisual } from "./card-visual";
import { PhysicalCardSurface, usePhysicalEffects } from "./physical-effects";
import type { ResolvedPrice } from "../lib/pricing";
import { trackFunnelEvent } from "../lib/analytics-events";

const copy:Record<LocaleCode,{ready:string;body:string;jpg:string;pdf:string}>={
  en:{ready:"Your keepsake is ready.",body:"The preview mark is gone. These are your final files to save, print, and share.",jpg:"Download JPG",pdf:"Download PDF"},
  ja:{ready:"きれいな最終版ができました。",body:"プレビュー表示が外れました。この一枚を保存、印刷、シェアできます。",jpg:"JPGを保存",pdf:"PDFを保存"},
  ko:{ready:"깨끗한 최종 카드가 준비됐어요.",body:"미리보기 표시가 사라졌습니다. 같은 카드를 저장하거나 인쇄하고 공유하세요.",jpg:"JPG 다운로드",pdf:"PDF 다운로드"},
  es:{ready:"Tu versión final ya está lista.",body:"La marca de vista previa ha desaparecido. Guarda, imprime o comparte la misma tarjeta.",jpg:"Descargar JPG",pdf:"Descargar PDF"},
  fr:{ready:"Votre version finale est prête.",body:"Le marquage d’aperçu a disparu. Enregistrez, imprimez ou partagez la même carte.",jpg:"Télécharger le JPG",pdf:"Télécharger le PDF"},
  de:{ready:"Ihre saubere finale Karte ist bereit.",body:"Die Vorschau-Markierung ist verschwunden. Speichern, drucken oder teilen Sie dieselbe Karte.",jpg:"JPG herunterladen",pdf:"PDF herunterladen"},
  pt:{ready:"Seu cartão final está pronto.",body:"A marca de prévia desapareceu. Salve, imprima ou compartilhe o mesmo cartão.",jpg:"Baixar JPG",pdf:"Baixar PDF"},
  it:{ready:"La versione finale è pronta.",body:"Il segno di anteprima è scomparso. Salva, stampa o condividi lo stesso biglietto.",jpg:"Scarica JPG",pdf:"Scarica PDF"},
  zh:{ready:"无水印最终版已准备好。",body:"预览标记已经移除。现在可以保存、打印或分享同一张卡片。",jpg:"下载 JPG",pdf:"下载 PDF"},
  vi:{ready:"Tấm thiệp của bạn đã sẵn sàng.",body:"Watermark preview đã biến mất. Đây là bản cuối để bạn lưu, in và chia sẻ.",jpg:"Tải JPG",pdf:"Tải PDF"}
};

export function PaidUnlock({
  locale,direction,headline,body,kicker,photoUrl,photoPalette,jpgDownloadHref,pdfDownloadHref,holidayBundle
}:{
  locale:LocaleCode;
  direction:VisualDirection;
  headline:string;
  body:string;
  kicker?:string;
  photoUrl?:string|null;
  photoPalette?:PhotoPalette|null;
  // Production must pass same-origin recovery download routes such as
  // /d/<recoveryId>/download/<entitlementId>, never raw/private R2 object URLs.
  jpgDownloadHref:string;
  pdfDownloadHref:string;
  holidayBundle?:{
    enabled:boolean;
    price:ResolvedPrice;
    priceQuote:string;
    finishedCardIds:string[];
  };
}){
  const {haptic}=usePhysicalEffects();
  const t=copy[locale];
  const safeHref=(href:string)=>{
    if(process.env.NODE_ENV!=="production")return href;
    return href.startsWith("/d/")?href:"#";
  };
  useEffect(()=>{haptic("confirm");},[haptic]);

  return <section className="paid-unlock" aria-live="polite">
    <div className="paid-unlock-card">
      <PhysicalCardSurface className="paid-physical" intensity={.9}>
        <CardVisual direction={direction} headline={headline} body={body} kicker={kicker} photoUrl={photoUrl} photoPalette={photoPalette} locale={locale}/>
      </PhysicalCardSurface>
    </div>
    <div className="paid-unlock-copy">
      <span className="eyebrow">CARDELUME</span>
      <h1>{t.ready}</h1>
      <p>{t.body}</p>
      <div className="paid-actions">
        <a className="button button-primary" href={safeHref(jpgDownloadHref)} download onClick={()=>trackFunnelEvent("download_jpg",{locale,purchaseKind:"single",direction})}><Download size={16}/>{t.jpg}</a>
        <a className="button button-secondary" href={safeHref(pdfDownloadHref)} download onClick={()=>trackFunnelEvent("download_pdf",{locale,purchaseKind:"single",direction})}><FileText size={16}/>{t.pdf}</a>
      </div>
    </div>
    {/* Holiday bundle logic remains dormant and intentionally hidden in Step17J. */}
  </section>;
}
