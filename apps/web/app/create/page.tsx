import { SiteHeader } from "../../components/site-header";
import { CardStudio } from "../../components/card-studio";
import { getMessages } from "../../i18n/messages";
import { requestLocale } from "../../i18n/locale.server";
import { singleOfferWithQuote } from "../../lib/market-pricing.server";

export default async function CreatePage({searchParams}:{searchParams:Promise<{lang?:string|string[];market?:string|string[]}>}) {
  const params=await searchParams;
  const locale=await requestLocale(params.lang,params.market);
  const messages=getMessages(locale);
  const offer=await singleOfferWithQuote(params.market);
  return (
    <div lang={locale}>
      <SiteHeader compact locale={locale} messages={messages} currentPath="/create" reviewMarket={(process.env.APP_MODE ?? "mock")==="mock" ? (Array.isArray(params.market)?params.market[0]:params.market) : undefined}/>
      <main className="create-main" id="main-content">
        <CardStudio locale={locale} messages={messages} price={offer.price} priceQuote={offer.quote} generationMode={(process.env.APP_MODE ?? "mock")==="mock"?"mock":"live"}/>
      </main>
    </div>
  );
}
