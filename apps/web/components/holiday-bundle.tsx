"use client";

import { useState } from "react";
import { Check, Gift, Layers3 } from "lucide-react";
import type { LocaleCode } from "../i18n/messages";
import type { ResolvedPrice } from "../lib/pricing";

type Copy={
  eyebrow:string;title:string;body:string;count:(done:number)=>string;
  oneTime:string;cta:string;ready:string;disabled:string;secure:string;
};

const copy:Record<LocaleCode,Copy>={
  en:{eyebrow:"Holiday Collection",title:"Five finished cards. One thoughtful collection.",body:"Create five complete CardeLume cards, then purchase them together in one checkout. No credits, no balance, no subscription.",count:n=>`${n}/5 finished cards`,oneTime:"one-time purchase",cta:"Get the collection ✦",ready:"Your five cards are ready as a collection.",disabled:"Finish five cards to unlock the collection checkout.",secure:"One checkout · five clean final cards"},
  ja:{eyebrow:"Holiday Collection",title:"完成した5枚を、ひとつのコレクションに。",body:"5枚のCardeLumeを完成させてから、まとめて一度だけお支払い。ポイント制も残高もサブスクもありません。",count:n=>`完成 ${n}/5枚`,oneTime:"一回払い",cta:"コレクションを受け取る ✦",ready:"5枚すべてがコレクションとして揃いました。",disabled:"5枚完成すると、まとめて購入できます。",secure:"一度の決済 · 5枚のクリーンな最終版"},
  ko:{eyebrow:"Holiday Collection",title:"완성된 카드 다섯 장을 하나의 컬렉션으로.",body:"CardeLume 카드 다섯 장을 모두 완성한 뒤 한 번에 결제하세요. 크레딧, 잔액, 구독은 없습니다.",count:n=>`완성 ${n}/5장`,oneTime:"1회 결제",cta:"컬렉션 받기 ✦",ready:"다섯 장이 하나의 컬렉션으로 준비됐어요.",disabled:"카드 다섯 장을 완성하면 컬렉션 결제가 열립니다.",secure:"한 번의 결제 · 깨끗한 최종 카드 5장"},
  es:{eyebrow:"Holiday Collection",title:"Cinco tarjetas terminadas. Una colección especial.",body:"Termina cinco tarjetas CardeLume y cómpralas juntas en un solo pago. Sin créditos, saldo ni suscripción.",count:n=>`${n}/5 tarjetas terminadas`,oneTime:"pago único",cta:"Obtener la colección ✦",ready:"Tus cinco tarjetas ya forman una colección.",disabled:"Termina cinco tarjetas para activar la compra de la colección.",secure:"Un pago · cinco tarjetas finales limpias"},
  fr:{eyebrow:"Holiday Collection",title:"Cinq cartes finalisées. Une collection attentionnée.",body:"Finalisez cinq cartes CardeLume, puis achetez-les ensemble en un seul paiement. Sans crédits, solde ni abonnement.",count:n=>`${n}/5 cartes finalisées`,oneTime:"paiement unique",cta:"Obtenir la collection ✦",ready:"Vos cinq cartes sont prêtes en collection.",disabled:"Finalisez cinq cartes pour débloquer l’achat de la collection.",secure:"Un paiement · cinq cartes finales sans filigrane"},
  de:{eyebrow:"Holiday Collection",title:"Fünf fertige Karten. Eine besondere Kollektion.",body:"Fünf CardeLume-Karten fertigstellen und gemeinsam in einem Checkout kaufen. Keine Credits, kein Guthaben, kein Abo.",count:n=>`${n}/5 Karten fertig`,oneTime:"Einmalzahlung",cta:"Kollektion erhalten ✦",ready:"Alle fünf Karten sind als Kollektion bereit.",disabled:"Fünf Karten fertigstellen, um den Kollektion-Checkout freizuschalten.",secure:"Ein Checkout · fünf saubere Finalkarten"},
  pt:{eyebrow:"Holiday Collection",title:"Cinco cartões finalizados. Uma coleção especial.",body:"Finalize cinco cartões CardeLume e compre todos juntos em um único pagamento. Sem créditos, saldo ou assinatura.",count:n=>`${n}/5 cartões finalizados`,oneTime:"pagamento único",cta:"Obter a coleção ✦",ready:"Seus cinco cartões estão prontos como uma coleção.",disabled:"Finalize cinco cartões para liberar o checkout da coleção.",secure:"Um pagamento · cinco cartões finais sem marca d’água"},
  it:{eyebrow:"Holiday Collection",title:"Cinque biglietti finiti. Una collezione speciale.",body:"Completa cinque biglietti CardeLume e acquistali insieme con un solo pagamento. Nessun credito, saldo o abbonamento.",count:n=>`${n}/5 biglietti completati`,oneTime:"pagamento unico",cta:"Ottieni la collezione ✦",ready:"I cinque biglietti sono pronti come collezione.",disabled:"Completa cinque biglietti per sbloccare il checkout della collezione.",secure:"Un pagamento · cinque biglietti finali puliti"},
  zh:{eyebrow:"Holiday Collection",title:"五张完成的卡片，一套用心的节日作品。",body:"先完成五张CardeLume，再一次性一起购买。不使用点数、余额或订阅模式。",count:n=>`已完成 ${n}/5 张`,oneTime:"一次性付款",cta:"获取整套卡片 ✦",ready:"五张卡片已经组成完整收藏。",disabled:"完成五张卡片后即可一次性购买。",secure:"一次结账 · 五张无水印最终卡片"},
  vi:{eyebrow:"Holiday Collection",title:"Năm tấm thiệp hoàn chỉnh. Một bộ sưu tập thật trọn vẹn.",body:"Hoàn thiện đủ năm tấm CardeLume rồi thanh toán chung một lần. Không credits, không số dư, không đăng ký gói.",count:n=>`${n}/5 thiệp đã hoàn thiện`,oneTime:"thanh toán một lần",cta:"Nhận bộ sưu tập ✦",ready:"Năm tấm thiệp đã sẵn sàng thành một bộ.",disabled:"Hoàn thiện đủ năm tấm để mở thanh toán bộ sưu tập.",secure:"Một lần thanh toán · năm bản sạch hoàn chỉnh"}
};

export function HolidayBundleCheckout({
  locale,enabled,price,priceQuote,finishedCardIds
}:{
  locale:LocaleCode;
  enabled:boolean;
  price:ResolvedPrice;
  priceQuote:string;
  finishedCardIds:string[];
}){
  const [status,setStatus]=useState("");
  if(!enabled)return null;

  const t=copy[locale];
  const unique=[...new Set(finishedCardIds)].slice(0,5);
  const ready=unique.length===5;

  async function checkout(){
    if(!ready)return;
    setStatus("…");
    const reviewMarket=(process.env.NODE_ENV!=="production"&&price.requestedMarket!=="OTHER")?`?market=${price.requestedMarket}`:"";
    const res=await fetch(`/api/checkout${reviewMarket}`,{
      method:"POST",
      headers:{"content-type":"application/json","idempotency-key":crypto.randomUUID()},
      body:JSON.stringify({purchaseKind:"holiday_bundle",cardIds:unique,priceQuote})
    });
    const data=await res.json();
    if(data.url){window.location.href=data.url;return;}
    setStatus(data.mode==="mock"?`${t.ready} ${price.display}`:(data.error??"checkout_unavailable"));
  }

  return <section className="holiday-bundle">
    <div className="holiday-bundle-icon"><Gift size={21}/></div>
    <div className="holiday-bundle-copy">
      <span className="eyebrow">{t.eyebrow}</span>
      <h3>{t.title}</h3>
      <p>{t.body}</p>
      <div className="holiday-bundle-progress" aria-label={t.count(unique.length)}>
        {Array.from({length:5},(_,i)=><i key={i} className={i<unique.length?"done":""}/>)}
        <span>{t.count(unique.length)}</span>
      </div>
      <p className="holiday-bundle-state"><Layers3 size={14}/>{ready?t.ready:t.disabled}</p>
    </div>
    <div className="holiday-bundle-buy">
      <strong>{price.display}</strong>
      <small>{t.oneTime}</small>
      <button type="button" className="button button-primary" disabled={!ready} onClick={checkout}>{t.cta}</button>
      <span><Check size={12}/>{t.secure}</span>
      {status?<p aria-live="polite">{status}</p>:null}
    </div>
  </section>;
}
