import { holidayBundleEnabled, holidayOfferWithQuote } from "./market-pricing.server";

export async function holidayBundleProps(
  finishedCardIds:string[],
  reviewMarket?:string|string[]|null
){
  const offer=await holidayOfferWithQuote(reviewMarket);
  return{
    enabled:holidayBundleEnabled(),
    price:offer.price,
    priceQuote:offer.quote,
    finishedCardIds
  };
}
