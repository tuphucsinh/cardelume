import Link from "next/link";
import { BrandMark } from "./brand-mark";
import { LanguageSwitcher } from "./language-switcher";
import type { LocaleCode, Messages } from "../i18n/messages";
import { launchCopy } from "../i18n/launch-copy";

export function SiteHeader({ compact=false, locale="en", messages, currentPath="/", reviewMarket }:{
  compact?:boolean; locale?:LocaleCode; messages:Messages; currentPath?:string; reviewMarket?:string
}) {
  const createHref=`/create${reviewMarket?`?market=${encodeURIComponent(reviewMarket)}`:""}`;
  const launch=launchCopy(locale);
  return (
    <header className={`topbar ${compact ? "topbar-compact" : ""}`}>
      <a className="skip-link" href="#main-content">{launch.skipContent}</a>
      <div className="shell nav">
        <Link className="brand" href={`/${reviewMarket?`?market=${encodeURIComponent(reviewMarket)}`:""}`} aria-label="CardeLume home">
          <BrandMark className="header-brand-mark"/>
          <span>CARDELUME</span>
        </Link>
        <div className="nav-actions">
          <LanguageSwitcher locale={locale} currentPath={currentPath} label={messages.header.chooseLanguage} reviewMarket={reviewMarket}/>
          <Link className="button nav-cta" href={createHref}>{messages.header.create}</Link>
        </div>
      </div>
    </header>
  );
}
