import postgres from "postgres";

export type PaidCardRenderContext={
  orderId:string;
  orderItemId:string;
  userId:string;
  productKey:"cardelume";
  locale:string;
  resourceId:string;
  resourceVersionId:string;
  document:unknown;
};

export type FinalEntitlementInput={
  assetKind:"jpg"|"pdf";
  downloadName:string;
  contentType:"image/jpeg"|"application/pdf";
  finalObjectKey:string;
};

function dbUrl(value?:string){const url=value??process.env.DATABASE_URL;if(!url)throw new Error("DATABASE_URL is required");return url;}
function client(connectionString?:string){return postgres(dbUrl(connectionString),{max:2,prepare:false});}

export async function loadPaidCardRenderContext(input:{orderId:string;orderItemId:string;connectionString?:string}):Promise<PaidCardRenderContext|null>{
  const sql=client(input.connectionString);
  try{
    const rows=await sql<Array<{
      order_id:string;order_item_id:string;user_id:string;product_key:string;locale:string;
      resource_id:string;resource_version_id:string|null;document:unknown;
    }>>`
      select o.id as order_id,oi.id as order_item_id,o.user_id,oi.product_key,o.locale,
             oi.resource_id,oi.resource_version_id,cv.document
      from orders o
      join order_items oi on oi.order_id=o.id
      join cards c on oi.product_key='cardelume' and c.id=oi.resource_id
      join card_versions cv on cv.id=oi.resource_version_id and cv.card_id=c.id
      where o.id=${input.orderId}::uuid
        and oi.id=${input.orderItemId}::uuid
        and o.status='paid'
        and oi.product_key='cardelume'
      limit 1
    `;
    const r=rows[0];
    if(!r||!r.resource_version_id)return null;
    return{
      orderId:r.order_id,orderItemId:r.order_item_id,userId:r.user_id,productKey:"cardelume",locale:r.locale,
      resourceId:r.resource_id,resourceVersionId:r.resource_version_id,document:r.document
    };
  }finally{await sql.end({timeout:2});}
}

export async function hasCompleteFinalEntitlements(input:{orderId:string;orderItemId:string;connectionString?:string}){
  const sql=client(input.connectionString);
  try{
    const rows=await sql<Array<{asset_kind:string}>>`
      select de.asset_kind
      from orders o
      join download_entitlements de on de.order_id=o.id
      where o.id=${input.orderId}::uuid
        and de.order_item_id=${input.orderItemId}::uuid
        and o.status='paid'
        and de.asset_kind in ('jpg','pdf')
    `;
    const kinds=new Set(rows.map(r=>r.asset_kind));
    return kinds.has("jpg")&&kinds.has("pdf");
  }finally{await sql.end({timeout:2});}
}

export async function persistFinalEntitlements(input:{
  orderId:string;
  orderItemId:string;
  resourceId:string;
  assets:FinalEntitlementInput[];
  connectionString?:string;
}){
  const sql=client(input.connectionString);
  try{
    return await sql.begin(async tx=>{
      const rows=await tx<Array<{user_id:string;product_key:string;resource_id:string}>>`
        select o.user_id,oi.product_key,oi.resource_id
        from orders o
        join order_items oi on oi.order_id=o.id
        where o.id=${input.orderId}::uuid
          and oi.id=${input.orderItemId}::uuid
          and o.status='paid'
        limit 1
        for update of o
      `;
      const order=rows[0];
      if(!order||order.product_key!=="cardelume"||order.resource_id!==input.resourceId){
        throw new Error("paid_order_item_required_for_entitlement");
      }
      const ids:string[]=[];
      for(const asset of input.assets){
        const idem=`${input.orderItemId}:${asset.assetKind}`;
        const inserted=await tx<Array<{id:string}>>`
          insert into download_entitlements(
            user_id,order_id,order_item_id,card_id,asset_kind,download_name,content_type,final_object_key,idempotency_key
          ) values(
            ${order.user_id}::uuid,${input.orderId}::uuid,${input.orderItemId}::uuid,${input.resourceId}::uuid,
            ${asset.assetKind},${asset.downloadName},${asset.contentType},${asset.finalObjectKey},${idem}
          )
          on conflict(idempotency_key) where idempotency_key is not null do update set
            download_name=excluded.download_name,
            content_type=excluded.content_type,
            final_object_key=excluded.final_object_key
          returning id
        `;
        if(inserted[0])ids.push(inserted[0].id);
      }
      return ids;
    });
  }finally{await sql.end({timeout:2});}
}

export async function listPaidOrderItemsForFinalization(input:{orderId:string;connectionString?:string}){
  const sql=client(input.connectionString);
  try{
    const rows=await sql<Array<{order_item_id:string;product_key:string;resource_id:string;resource_version_id:string|null}>>`
      select oi.id as order_item_id,oi.product_key,oi.resource_id,oi.resource_version_id
      from orders o
      join order_items oi on oi.order_id=o.id
      where o.id=${input.orderId}::uuid and o.status='paid'
      order by oi.created_at asc,oi.id asc
    `;
    return rows;
  }finally{await sql.end({timeout:2});}
}
