import { requestLocale } from "../../i18n/locale.server";
import { legalCopy } from "../../i18n/legal-copy";
import { legalIdentity } from "../../lib/legal-identity.server";

export default async function RefundPage({searchParams}:{searchParams:Promise<{lang?:string|string[];market?:string|string[]}>}){
  const params=await searchParams;const locale=await requestLocale(params.lang,params.market);const c=legalCopy[locale];const identity=legalIdentity();
  return <main className="legal shell" lang={locale}><h1>{c.refundTitle}</h1><p>{c.refundIntro}</p>{c.refundSections.map(x=><section className="legal-section" key={x.title}><h2>{x.title}</h2><p>{x.body}</p></section>)}<section className="legal-section"><h2>{c.contactTitle}</h2><p>{identity.name}{identity.address?<> · {identity.address}</>:null}{identity.email?<> · <a href={`mailto:${identity.email}`}>{identity.email}</a></>:null}</p><p>{c.effectiveLabel}: {identity.effectiveDate}</p></section></main>;
}
