import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { step17jShowcaseTemplatesForEnvironment } from "@cardelume/templates";
import { SiteHeader } from "../components/site-header";
import { CardVisual } from "../components/card-visual";
import { BrandMark } from "../components/brand-mark";
import { getMessages, withoutRecipient } from "../i18n/messages";
import { requestLocale } from "../i18n/locale.server";
import { launchCopy } from "../i18n/launch-copy";
import { betaCopy } from "../i18n/beta-copy";
import { singleOffer } from "../lib/market-pricing.server";
import { MobileStickyCta } from "../components/mobile-sticky-cta";
import { PhysicalCardSurface } from "../components/physical-effects";
import { ProductProofSection } from "../components/product-proof-section";
import { legalIdentity } from "../lib/legal-identity.server";

export default async function HomePage({searchParams}:{searchParams:Promise<{lang?:string|string[];market?:string|string[]}>}) {
  const params=await searchParams;
  const locale=await requestLocale(params.lang,params.market);
  const m=getMessages(locale);
  const launch=launchCopy(locale);
  const beta=betaCopy(locale);
  const paymentMode:"off"|"on"=(process.env.PAYMENT_MODE??"on").trim().toLowerCase()==="off"?"off":"on";
  const price=await singleOffer(params.market);
  const identity=legalIdentity();
  const marketQuery=(process.env.APP_MODE ?? "mock")==="mock" && params.market ? `&market=${Array.isArray(params.market)?params.market[0]:params.market}` : "";
  const createHref=`/create${marketQuery?`?${marketQuery.slice(1)}`:""}`;
  const marketingTemplates=step17jShowcaseTemplatesForEnvironment(process.env.APP_ENV);
  const trust=paymentMode === "off" ? beta.trust : m.home.trust;
  const samples=[
    {k:m.studio.copy.birthdayKicker,h:m.studio.copy.editorialHeadline,b:m.studio.copy.editorialBody},
    {k:m.studio.copy.birthdayKicker,h:m.studio.copy.midnightHeadline,b:m.studio.copy.midnightBody},
    {k:m.studio.copy.birthdayKicker,h:withoutRecipient(m.studio.copy.birthdayHeadline),b:m.studio.copy.birthdayBody},
    {k:m.studio.copy.thankKicker,h:withoutRecipient(m.studio.copy.thankHeadline),b:m.studio.copy.thankBody},
    {k:m.studio.copy.anniversaryKicker,h:withoutRecipient(m.studio.copy.anniversaryHeadline),b:m.studio.copy.anniversaryBody},
    {k:m.studio.copy.congratsKicker,h:m.studio.copy.editorialHeadline,b:m.studio.copy.congratsBody},
    {k:m.studio.copy.birthdayKicker,h:m.studio.copy.photoHeadline,b:m.studio.copy.photoBody},
    {k:m.studio.copy.formalBirthdayKicker,h:withoutRecipient(m.studio.copy.formalBirthdayHeadline),b:m.studio.copy.formalBirthdayBody}
  ];

  return (
    <div lang={locale}>
      <SiteHeader locale={locale} messages={m} currentPath="/" reviewMarket={(process.env.APP_MODE ?? "mock")==="mock" ? (Array.isArray(params.market)?params.market[0]:params.market) : undefined}/>
      <main id="main-content">
        <section className="shell hero" id="hero">
          <div className="hero-copy">
            <div className="eyebrow"><Sparkles size={14}/>{launch.heroEyebrow}</div>
            <h1><span className="display-line">{m.home.heroA}</span>{" "}<span className="display-line"><em>{m.home.heroB}</em></span></h1>
            <p>{m.home.sub}</p>
            <div className="hero-actions">
              <Link className="button button-primary" href={createHref}>{m.home.create}</Link>
              {marketingTemplates.length>0?<a className="text-link" href="#styles">{m.home.explore}<ArrowRight size={16}/></a>:null}
            </div>
            <div className="trust-row">
              {trust.map(x=><span key={x}><Check size={15}/>{x}</span>)}
            </div>
          </div>
          <div className="hero-material-stage" aria-label={marketingTemplates.length>0?"CardeLume premium card example":undefined} aria-hidden={marketingTemplates.length===0?"true":undefined}>
            <div className="hero-folio-back hero-folio-back-one"/>
            <div className="hero-folio-back hero-folio-back-two"/>
            <div className="hero-material-card">
              <PhysicalCardSurface className="hero-physical" intensity={1.08}>
                {marketingTemplates.length>0?(()=>{const t=marketingTemplates[0];const sample=samples[0];return <CardVisual direction={t.visualDirection} compact locale={locale} kicker={sample.k} headline={sample.h} body={sample.b}/>;})():<div className="hero-brand-paper hero-brand-object"><BrandMark className="hero-brand-mark"/><small>CARDELUME</small><strong>{m.home.footerTagline}</strong><span/></div>}
              </PhysicalCardSurface>
            </div>
            <div className="hero-material-caption"><i/><span>{m.home.footerTagline}</span></div>
          </div>
        </section>

        {marketingTemplates.length>0?(
          <ProductProofSection
            locale={locale}
            messages={{
              home: { galleryCta: m.home.galleryCta },
              studio: {
                occasion: m.studio.occasion,
                recipient: m.studio.recipient,
                feel: m.studio.feel,
                detail: m.studio.detail,
                copy: m.studio.copy
              }
            }}
            createHref={createHref}
            templates={marketingTemplates}
            paymentMode={paymentMode}
            isProduction={(process.env.APP_ENV ?? "") === "production"}
          />
        ):null}

        <section className="shell how-section deferred-section">
          <span className="eyebrow">{m.home.howEyebrow}</span>
          <h2><span className="display-line">{m.home.howA}</span>{" "}<span className="display-line">{m.home.howB}</span></h2>
          <div className="how-grid">
            {m.home.steps.map((s,i)=><article key={s.title}><b>0{i+1}</b><h3>{s.title}</h3><p>{s.body}</p></article>)}
          </div>
        </section>

        <section className="dark-section deferred-section">
          <div className="shell purchase-story">
            {paymentMode === "off" ? (
              <>
                <div>
                  <span className="eyebrow eyebrow-light">{beta.eyebrow}</span>
                  <h2>{m.home.priceTitle}</h2>
                  <p>{launch.noPhysical}</p>
                </div>
                <div className="price-card">
                  <p>{beta.description}</p>
                  <Link className="button button-gold" href={createHref}>{m.home.create}</Link>
                </div>
              </>
            ) : (
              <>
                <div>
                  <span className="eyebrow eyebrow-light">{m.home.priceEyebrow}</span>
                  <h2>{m.home.priceTitle}</h2>
                  <p>{launch.instantDigital} · {launch.noPhysical}</p>
                </div>
                <div className="price-card">
                  <span className="price">{price.display}</span>
                  <span>{m.home.oneTime}</span>
                  <small className="price-digital-note">{launch.filesReady}</small>
                  <Link className="button button-gold" href={createHref}>{m.home.priceCta}</Link>
                </div>
              </>
            )}
          </div>
        </section>
      </main>
      <MobileStickyCta href={createHref} label={m.home.create}/>

      <footer className="footer shell deferred-section">
        <div className="brand footer-brand">
          <BrandMark className="footer-brand-mark"/>
          <span>CARDELUME</span>
        </div>
        <p>{m.home.footerTagline}</p>
        <nav aria-label="Footer">
          <a href={`/privacy${marketQuery?`?${marketQuery.slice(1)}`:""}`}>{m.home.privacy}</a>
          <a href={`/terms${marketQuery?`?${marketQuery.slice(1)}`:""}`}>{m.home.terms}</a>
          <a href={identity.email?`mailto:${identity.email}`:"/privacy"}>{m.home.support}</a>
        </nav>
      </footer>
    </div>
  );
}
