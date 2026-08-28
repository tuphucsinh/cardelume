import postgres from "postgres";

function dbUrl(value?:string){const url=value??process.env.DATABASE_URL;if(!url)throw new Error("DATABASE_URL is required");return url;}
function client(connectionString?:string){return postgres(dbUrl(connectionString),{max:2,prepare:false});}

export type PendingCheckoutOrder={
  orderId:string;
  userId:string;
  cardId:string;
  cardVersionId:string;
  orderItemId:string;
  status:string;
  amountMinor:number;
  currency:string;
  providerCheckoutId:string|null;
  providerCheckoutUrl:string|null;
  created:boolean;
};

export async function createPendingSingleCardOrder(input:{
  orderId:string;
  orderItemId:string;
  cardId:string;
  cardVersionId:string;
  userId:string;
  idempotencyKey:string;
  requestHash:string;
  amountMinor:number;
  currency:string;
  locale:string;
  pricingMarket:string;
  pricingDisplay:string;
  direction:string;
  occasion:string;
  cardDocument:unknown;
  trustedPhotoAssetIds?:string[];
  managedTemplateId?:string;
  managedTemplateVersionId?:string;
  managedTemplateSource?:string;
  connectionString?:string;
}):Promise<PendingCheckoutOrder>{
  const sql=client(input.connectionString);
  try{
    return await sql.begin(async tx=>{
      const lockKey=`cardelume:checkout:${input.userId}:${input.idempotencyKey}`;
      await tx`select pg_advisory_xact_lock(hashtextextended(${lockKey},0))`;
      const existing=await tx<Array<{
        order_id:string;user_id:string;card_id:string;card_version_id:string|null;order_item_id:string;
        status:string;amount_minor:number;currency:string;provider_checkout_id:string|null;provider_checkout_url:string|null;checkout_request_hash:string|null;
      }>>`
        select o.id as order_id,o.user_id,o.card_id,oi.resource_version_id as card_version_id,oi.id as order_item_id,
               o.status,o.amount_minor,o.currency,o.provider_checkout_id,o.provider_checkout_url,o.checkout_request_hash
        from orders o
        join order_items oi on oi.order_id=o.id and oi.product_key='cardelume' and oi.resource_id=o.card_id
        where o.user_id=${input.userId}::uuid
          and o.checkout_idempotency_key=${input.idempotencyKey}
        limit 1
        for update of o
      `;
      const prior=existing[0];
      if(prior){
        if(prior.amount_minor!==input.amountMinor||prior.currency.toUpperCase()!==input.currency.toUpperCase()||prior.checkout_request_hash!==input.requestHash){
          throw new Error("checkout_idempotency_conflict");
        }
        if(!prior.card_version_id)throw new Error("checkout_order_missing_card_version");
        return{
          orderId:prior.order_id,userId:prior.user_id,cardId:prior.card_id,cardVersionId:prior.card_version_id,
          orderItemId:prior.order_item_id,status:prior.status,amountMinor:prior.amount_minor,currency:prior.currency,
          providerCheckoutId:prior.provider_checkout_id,providerCheckoutUrl:prior.provider_checkout_url,created:false
        };
      }

      await tx`
        insert into cards(id,user_id,status,occasion,locale,selected_version_id)
        values(${input.cardId}::uuid,${input.userId}::uuid,'finished',${input.occasion},${input.locale},${input.cardVersionId}::uuid)
      `;
      await tx`
        insert into card_versions(id,card_id,direction,document,managed_template_id,managed_template_version_id,managed_template_source)
        values(${input.cardVersionId}::uuid,${input.cardId}::uuid,${input.direction},${tx.json(input.cardDocument as never)},${input.managedTemplateId??null}::uuid,${input.managedTemplateVersionId??null}::uuid,${input.managedTemplateSource??null})
      `;
      const trustedPhotoAssetIds=input.trustedPhotoAssetIds??[];
      if(trustedPhotoAssetIds.length){
        if(trustedPhotoAssetIds.length>1)throw new Error("photo_asset_count_invalid");
        const trusted=await tx<Array<{id:string}>>`
          select id from photo_assets
          where id = any(${trustedPhotoAssetIds}::uuid[]) and user_id=${input.userId}::uuid and status='ready'
            and clean_content_type='image/jpeg' and sha256 is not null and clean_size_bytes is not null
          for update
        `;
        if(trusted.length!==trustedPhotoAssetIds.length)throw new Error("photo_asset_not_ready_or_owned");
        for(const assetId of trustedPhotoAssetIds){
          await tx`
            insert into card_asset_bindings(resource_version_id,asset_id,role)
            values(${input.cardVersionId}::uuid,${assetId}::uuid,'photo')
            on conflict(resource_version_id,asset_id) do nothing
          `;
        }
      }
      await tx`
        insert into orders(
          id,user_id,card_id,product_key,locale,status,amount_minor,currency,payment_provider,
          checkout_idempotency_key,checkout_request_hash,pricing_market,pricing_display
        ) values(
          ${input.orderId}::uuid,${input.userId}::uuid,${input.cardId}::uuid,'cardelume',${input.locale},'pending',
          ${input.amountMinor},${input.currency.toUpperCase()},'dodo',${input.idempotencyKey},${input.requestHash},${input.pricingMarket},${input.pricingDisplay}
        )
      `;
      await tx`
        insert into order_items(id,order_id,product_key,resource_id,resource_version_id)
        values(${input.orderItemId}::uuid,${input.orderId}::uuid,'cardelume',${input.cardId}::uuid,${input.cardVersionId}::uuid)
      `;
      return{
        orderId:input.orderId,userId:input.userId,cardId:input.cardId,cardVersionId:input.cardVersionId,
        orderItemId:input.orderItemId,status:"pending",amountMinor:input.amountMinor,currency:input.currency.toUpperCase(),
        providerCheckoutId:null,providerCheckoutUrl:null,created:true
      };
    });
  }finally{await sql.end({timeout:2});}
}

export type ProviderCheckoutCreationClaim=
  | {status:"ready";providerCheckoutId:string;providerCheckoutUrl:string}
  | {status:"claimed";creationToken:string}
  | {status:"busy"};

export async function claimProviderCheckoutCreation(input:{
  orderId:string;
  userId:string;
  creationToken:string;
  leaseSeconds?:number;
  connectionString?:string;
}):Promise<ProviderCheckoutCreationClaim>{
  const sql=client(input.connectionString);
  const leaseSeconds=Math.max(15,Math.min(120,input.leaseSeconds??45));
  try{
    return await sql.begin(async tx=>{
      const rows=await tx<Array<{
        status:string;provider_checkout_id:string|null;provider_checkout_url:string|null;
        provider_checkout_creation_token:string|null;provider_checkout_creating_at:Date|null;
      }>>`
        select status,provider_checkout_id,provider_checkout_url,
               provider_checkout_creation_token,provider_checkout_creating_at
        from orders
        where id=${input.orderId}::uuid and user_id=${input.userId}::uuid
        limit 1
        for update
      `;
      const order=rows[0];
      if(!order)throw new Error("checkout_order_not_found");
      if(order.provider_checkout_id&&order.provider_checkout_url){
        return{status:"ready",providerCheckoutId:order.provider_checkout_id,providerCheckoutUrl:order.provider_checkout_url};
      }
      if(order.status!=="pending")throw new Error("checkout_order_not_pending");
      const creatingAt=order.provider_checkout_creating_at?new Date(order.provider_checkout_creating_at).getTime():0;
      const leaseFresh=Boolean(order.provider_checkout_creation_token)&&creatingAt>Date.now()-leaseSeconds*1000;
      if(leaseFresh)return{status:"busy"};
      await tx`
        update orders set
          provider_checkout_creation_token=${input.creationToken},
          provider_checkout_creating_at=now(),
          updated_at=now()
        where id=${input.orderId}::uuid
      `;
      return{status:"claimed",creationToken:input.creationToken};
    });
  }finally{await sql.end({timeout:2});}
}

export async function releaseProviderCheckoutCreation(input:{
  orderId:string;
  userId:string;
  creationToken:string;
  connectionString?:string;
}){
  const sql=client(input.connectionString);
  try{
    const result=await sql`
      update orders set provider_checkout_creation_token=null,provider_checkout_creating_at=null,updated_at=now()
      where id=${input.orderId}::uuid and user_id=${input.userId}::uuid
        and provider_checkout_creation_token=${input.creationToken}
        and provider_checkout_id is null
      returning id
    `;
    return result.length>0;
  }finally{await sql.end({timeout:2});}
}

export async function bindProviderCheckout(input:{
  orderId:string;
  userId:string;
  creationToken:string;
  providerCheckoutId:string;
  providerCheckoutUrl:string;
  connectionString?:string;
}){
  const sql=client(input.connectionString);
  try{
    return await sql.begin(async tx=>{
      const rows=await tx<Array<{
        status:string;provider_checkout_id:string|null;provider_checkout_url:string|null;provider_checkout_creation_token:string|null;
      }>>`
        select status,provider_checkout_id,provider_checkout_url,provider_checkout_creation_token
        from orders
        where id=${input.orderId}::uuid and user_id=${input.userId}::uuid
        limit 1
        for update
      `;
      const order=rows[0];
      if(!order)throw new Error("checkout_order_not_found");
      if(order.provider_checkout_id&&order.provider_checkout_url){
        if(order.provider_checkout_id!==input.providerCheckoutId)throw new Error("provider_checkout_already_bound");
        return{providerCheckoutId:order.provider_checkout_id,providerCheckoutUrl:order.provider_checkout_url};
      }
      if(order.status!=="pending")throw new Error("checkout_order_not_pending");
      if(order.provider_checkout_creation_token!==input.creationToken)throw new Error("provider_checkout_lease_lost");
      await tx`
        update orders set
          provider_checkout_id=${input.providerCheckoutId},
          provider_checkout_url=${input.providerCheckoutUrl},
          provider_checkout_creation_token=null,
          provider_checkout_creating_at=null,
          updated_at=now()
        where id=${input.orderId}::uuid
      `;
      return{providerCheckoutId:input.providerCheckoutId,providerCheckoutUrl:input.providerCheckoutUrl};
    });
  }finally{await sql.end({timeout:2});}
}

export type VerifiedPaymentApplyResult={
  outcome:string;
  orderId:string|null;
  userId:string|null;
  providerPaymentId:string|null;
  needsFulfillment:boolean;
};

export async function applyVerifiedDodoEvent(input:{
  providerEventId:string;
  eventType:string;
  auditPayload:unknown;
  payment?:{
    orderId:string;
    productKey:string;
    paymentId:string;
    checkoutSessionId:string;
    amountMinor:number;
    currency:string;
    status:string;
  }|null;
  connectionString?:string;
}):Promise<VerifiedPaymentApplyResult>{
  const sql=client(input.connectionString);
  try{
    return await sql.begin(async tx=>{
      await tx`
        insert into payment_events(provider_event_id,event_type,processed,payload)
        values(${input.providerEventId},${input.eventType},false,${tx.json(input.auditPayload as never)})
        on conflict(provider_event_id) do nothing
      `;
      const events=await tx<Array<{processed:boolean;outcome:string|null;order_id:string|null}>>`
        select processed,outcome,order_id
        from payment_events
        where provider_event_id=${input.providerEventId}
        limit 1
        for update
      `;
      const event=events[0];
      if(!event)throw new Error("payment_event_persistence_failed");
      if(event.processed){
        return{outcome:event.outcome??"duplicate_processed",orderId:event.order_id,userId:null,providerPaymentId:null,needsFulfillment:false};
      }

      const payment=input.payment;
      if(input.eventType!=="payment.succeeded"){
        await tx`
          update payment_events set processed=true,outcome='ignored_non_success',processed_at=now()
          where provider_event_id=${input.providerEventId}
        `;
        return{outcome:"ignored_non_success",orderId:null,userId:null,providerPaymentId:null,needsFulfillment:false};
      }
      if(!payment||payment.status!=="succeeded"||payment.productKey!=="cardelume"){
        await tx`
          update payment_events set processed=true,outcome='rejected_unbound_payment',processed_at=now()
          where provider_event_id=${input.providerEventId}
        `;
        return{outcome:"rejected_unbound_payment",orderId:null,userId:null,providerPaymentId:payment?.paymentId??null,needsFulfillment:false};
      }

      const orders=await tx<Array<{
        id:string;user_id:string;status:string;amount_minor:number;currency:string;provider_checkout_id:string|null;provider_payment_id:string|null;
      }>>`
        select id,user_id,status,amount_minor,currency,provider_checkout_id,provider_payment_id
        from orders
        where id=${payment.orderId}::uuid and product_key='cardelume' and payment_provider='dodo'
        limit 1
        for update
      `;
      const order=orders[0];
      if(!order){
        await tx`
          update payment_events set processed=true,outcome='rejected_unknown_order',processed_at=now()
          where provider_event_id=${input.providerEventId}
        `;
        return{outcome:"rejected_unknown_order",orderId:null,userId:null,providerPaymentId:payment.paymentId,needsFulfillment:false};
      }

      const exactAmount=order.amount_minor===payment.amountMinor;
      const exactCurrency=order.currency.toUpperCase()===payment.currency.toUpperCase();
      const exactCheckout=Boolean(order.provider_checkout_id)&&order.provider_checkout_id===payment.checkoutSessionId;
      if(!exactAmount||!exactCurrency||!exactCheckout){
        await tx`
          update payment_events set order_id=${order.id}::uuid,processed=true,outcome='rejected_payment_mismatch',processed_at=now()
          where provider_event_id=${input.providerEventId}
        `;
        return{outcome:"rejected_payment_mismatch",orderId:order.id,userId:order.user_id,providerPaymentId:payment.paymentId,needsFulfillment:false};
      }

      if(order.status==="paid"&&order.provider_payment_id&&order.provider_payment_id!==payment.paymentId){
        await tx`
          update payment_events set order_id=${order.id}::uuid,processed=true,outcome='duplicate_payment_for_paid_order',processed_at=now()
          where provider_event_id=${input.providerEventId}
        `;
        return{outcome:"duplicate_payment_for_paid_order",orderId:order.id,userId:order.user_id,providerPaymentId:payment.paymentId,needsFulfillment:false};
      }
      if(order.status!=="pending"&&order.status!=="paid"){
        await tx`
          update payment_events set order_id=${order.id}::uuid,processed=true,outcome='rejected_order_state',processed_at=now()
          where provider_event_id=${input.providerEventId}
        `;
        return{outcome:"rejected_order_state",orderId:order.id,userId:order.user_id,providerPaymentId:payment.paymentId,needsFulfillment:false};
      }

      if(order.status==="pending"){
        await tx`
          update orders set status='paid',provider_payment_id=${payment.paymentId},paid_at=now(),updated_at=now()
          where id=${order.id}::uuid
        `;
      }
      await tx`
        update payment_events set order_id=${order.id}::uuid,outcome='paid_pending_fulfillment'
        where provider_event_id=${input.providerEventId}
      `;
      return{
        outcome:"paid_pending_fulfillment",orderId:order.id,userId:order.user_id,providerPaymentId:payment.paymentId,needsFulfillment:true
      };
    });
  }finally{await sql.end({timeout:2});}
}

export async function markDodoPaymentFulfilled(input:{
  orderId:string;
  providerPaymentId:string;
  connectionString?:string;
}){
  const sql=client(input.connectionString);
  try{
    const result=await sql`
      update payment_events
      set processed=true,outcome='paid_fulfilled',processed_at=now()
      where order_id=${input.orderId}::uuid
        and processed=false
        and outcome='paid_pending_fulfillment'
        and exists(
          select 1 from orders o
          where o.id=payment_events.order_id
            and o.status='paid'
            and o.provider_payment_id=${input.providerPaymentId}
        )
      returning id
    `;
    return result.length;
  }finally{await sql.end({timeout:2});}
}
