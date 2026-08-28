import postgres from "postgres";

export type RecoveryAsset = {
  id:string;
  orderItemId:string;
  productKey:string;
  resourceId:string;
  assetKind:string;
  downloadName:string|null;
  contentType:string|null;
  objectKey:string;
};

export type RecoveryAccess = {
  recoveryId:string;
  orderId:string;
  userId:string;
  locale:string;
  recoveryExpiresAt:Date;
};

export type ReturnClaimResult =
  | {status:"ready"; access:RecoveryAccess}
  | {status:"pending"; locale:string}
  | {status:"invalid"};

function dbUrl(value?:string){
  const url=value ?? process.env.DATABASE_URL;
  if(!url)throw new Error("DATABASE_URL is required");
  return url;
}

function client(connectionString?:string){
  return postgres(dbUrl(connectionString),{max:2,prepare:false});
}

function asDate(value:unknown){
  return value instanceof Date?value:new Date(String(value));
}

export async function createPurchaseRecoveryRecord(input:{
  orderId:string;
  userId:string;
  tokenHash:string;
  expiresAt:Date;
  connectionString?:string;
}){
  const sql=client(input.connectionString);
  try{
    const inserted=await sql<[{id:string}]>`
      insert into purchase_recoveries(order_id,user_id,token_hash,expires_at)
      select ${input.orderId}::uuid,${input.userId}::uuid,${input.tokenHash},${input.expiresAt}
      where exists(
        select 1 from orders o
        where o.id=${input.orderId}::uuid
          and o.user_id=${input.userId}::uuid
          and o.status='paid'
      )
      on conflict(order_id) do nothing
      returning id
    `;
    const record=await sql<Array<{id:string;locale:string}>>`
      select pr.id,o.locale
      from purchase_recoveries pr
      join orders o on o.id=pr.order_id and o.status='paid'
      where pr.order_id=${input.orderId}::uuid
        and pr.user_id=${input.userId}::uuid
      limit 1
    `;
    if(record[0])return{created:Boolean(inserted[0]),recoveryId:record[0].id,locale:record[0].locale};
    throw new Error("paid_order_required_for_recovery");
  }finally{await sql.end({timeout:2});}
}

export async function upsertCheckoutReturnClaimRecord(input:{
  orderId:string;
  claimHash:string;
  expiresAt:Date;
  connectionString?:string;
}){
  const sql=client(input.connectionString);
  try{
    const rows=await sql<[{id:string}]>`
      insert into checkout_return_claims(order_id,claim_hash,expires_at,consumed_at)
      values(${input.orderId}::uuid,${input.claimHash},${input.expiresAt},null)
      on conflict(order_id) do update set
        claim_hash=excluded.claim_hash,
        expires_at=greatest(checkout_return_claims.expires_at,excluded.expires_at)
      where checkout_return_claims.consumed_at is null
      returning id
    `;
    return rows[0]?.id ?? null;
  }finally{await sql.end({timeout:2});}
}

export async function redeemPurchaseRecoveryToken(input:{
  recoveryId:string;
  tokenHash:string;
  sessionHash:string;
  sessionExpiresAt:Date;
  connectionString?:string;
}):Promise<RecoveryAccess|null>{
  const sql=client(input.connectionString);
  try{
    return await sql.begin(async tx=>{
      const rows=await tx<[{recovery_id:string;order_id:string;user_id:string;expires_at:Date;locale:string}]>`
        select pr.id as recovery_id,pr.order_id,pr.user_id,pr.expires_at,o.locale
        from purchase_recoveries pr
        join orders o on o.id=pr.order_id
        where pr.id=${input.recoveryId}::uuid
          and pr.token_hash=${input.tokenHash}
          and pr.revoked_at is null
          and pr.expires_at>now()
          and o.status='paid'
        limit 1
        for update of pr
      `;
      const row=rows[0];
      if(!row)return null;
      const recoveryExpires=asDate(row.expires_at);
      const sessionExpires=input.sessionExpiresAt<recoveryExpires?input.sessionExpiresAt:recoveryExpires;
      await tx`
        insert into recovery_sessions(recovery_id,session_hash,expires_at,last_used_at)
        values(${row.recovery_id}::uuid,${input.sessionHash},${sessionExpires},now())
      `;
      await tx`update purchase_recoveries set last_claimed_at=now() where id=${row.recovery_id}::uuid`;
      return{
        recoveryId:row.recovery_id,
        orderId:row.order_id,
        userId:row.user_id,
        locale:row.locale,
        recoveryExpiresAt:recoveryExpires
      };
    });
  }finally{await sql.end({timeout:2});}
}

export async function redeemCheckoutReturnClaim(input:{
  orderId:string;
  claimHash:string;
  sessionHash:string;
  sessionExpiresAt:Date;
  replayGraceMinutes?:number;
  connectionString?:string;
}):Promise<ReturnClaimResult>{
  const sql=client(input.connectionString);
  const replayGrace=Math.max(1,input.replayGraceMinutes??10);
  try{
    return await sql.begin(async tx=>{
      const claims=await tx<[{expires_at:Date;consumed_at:Date|null}]>`
        select expires_at,consumed_at
        from checkout_return_claims
        where order_id=${input.orderId}::uuid
          and claim_hash=${input.claimHash}
        limit 1
        for update
      `;
      const claim=claims[0];
      if(!claim)return{status:"invalid" as const};
      const now=Date.now();
      if(asDate(claim.expires_at).getTime()<=now)return{status:"invalid" as const};
      if(claim.consumed_at && now-asDate(claim.consumed_at).getTime()>replayGrace*60_000){
        return{status:"invalid" as const};
      }

      const rows=await tx<[{recovery_id:string;order_id:string;user_id:string;expires_at:Date;locale:string;order_status:string}]>`
        select pr.id as recovery_id,pr.order_id,pr.user_id,pr.expires_at,o.locale,o.status as order_status
        from orders o
        left join purchase_recoveries pr on pr.order_id=o.id
          and pr.revoked_at is null and pr.expires_at>now()
        where o.id=${input.orderId}::uuid
        limit 1
      `;
      const row=rows[0];
      if(!row)return{status:"invalid" as const};
      if(row.order_status!=="paid"||!row.recovery_id)return{status:"pending" as const,locale:row.locale};

      const recoveryExpires=asDate(row.expires_at);
      const sessionExpires=input.sessionExpiresAt<recoveryExpires?input.sessionExpiresAt:recoveryExpires;
      await tx`
        insert into recovery_sessions(recovery_id,session_hash,expires_at,last_used_at)
        values(${row.recovery_id}::uuid,${input.sessionHash},${sessionExpires},now())
      `;
      await tx`
        update checkout_return_claims
        set consumed_at=coalesce(consumed_at,now())
        where order_id=${input.orderId}::uuid
      `;
      await tx`update purchase_recoveries set last_claimed_at=now() where id=${row.recovery_id}::uuid`;
      return{
        status:"ready" as const,
        access:{
          recoveryId:row.recovery_id,
          orderId:row.order_id,
          userId:row.user_id,
          locale:row.locale,
          recoveryExpiresAt:recoveryExpires
        }
      };
    });
  }finally{await sql.end({timeout:2});}
}

export async function validateRecoverySession(input:{
  recoveryId:string;
  sessionHash:string;
  connectionString?:string;
}):Promise<RecoveryAccess|null>{
  const sql=client(input.connectionString);
  try{
    const rows=await sql<[{recovery_id:string;order_id:string;user_id:string;expires_at:Date;locale:string}]>`
      select pr.id as recovery_id,pr.order_id,pr.user_id,pr.expires_at,o.locale
      from recovery_sessions rs
      join purchase_recoveries pr on pr.id=rs.recovery_id
      join orders o on o.id=pr.order_id
      where pr.id=${input.recoveryId}::uuid
        and rs.session_hash=${input.sessionHash}
        and rs.revoked_at is null
        and rs.expires_at>now()
        and pr.revoked_at is null
        and pr.expires_at>now()
        and o.status='paid'
      limit 1
    `;
    const row=rows[0];
    if(!row)return null;
    await sql`
      update recovery_sessions set last_used_at=now()
      where recovery_id=${input.recoveryId}::uuid and session_hash=${input.sessionHash}
    `;
    return{
      recoveryId:row.recovery_id,
      orderId:row.order_id,
      userId:row.user_id,
      locale:row.locale,
      recoveryExpiresAt:asDate(row.expires_at)
    };
  }finally{await sql.end({timeout:2});}
}

export async function listRecoveryAssets(input:{
  recoveryId:string;
  connectionString?:string;
}):Promise<RecoveryAsset[]>{
  const sql=client(input.connectionString);
  try{
    const rows=await sql<Array<{
      id:string;order_item_id:string;product_key:string;resource_id:string;asset_kind:string;download_name:string|null;
      content_type:string|null;final_object_key:string;
    }>>`
      select de.id,de.order_item_id,oi.product_key,oi.resource_id,de.asset_kind,de.download_name,de.content_type,de.final_object_key
      from purchase_recoveries pr
      join orders o on o.id=pr.order_id and o.status='paid'
      join download_entitlements de on de.order_id=o.id
      join order_items oi on oi.id=de.order_item_id and oi.order_id=o.id
      where pr.id=${input.recoveryId}::uuid
        and pr.revoked_at is null
        and pr.expires_at>now()
      order by de.created_at asc,de.asset_kind asc
    `;
    return rows.map(r=>({
      id:r.id,
      orderItemId:r.order_item_id,
      productKey:r.product_key,
      resourceId:r.resource_id,
      assetKind:r.asset_kind,
      downloadName:r.download_name,
      contentType:r.content_type,
      objectKey:r.final_object_key
    }));
  }finally{await sql.end({timeout:2});}
}

export async function getRecoveryAsset(input:{
  recoveryId:string;
  entitlementId:string;
  connectionString?:string;
}):Promise<RecoveryAsset|null>{
  const sql=client(input.connectionString);
  try{
    const rows=await sql<Array<{
      id:string;order_item_id:string;product_key:string;resource_id:string;asset_kind:string;download_name:string|null;
      content_type:string|null;final_object_key:string;
    }>>`
      select de.id,de.order_item_id,oi.product_key,oi.resource_id,de.asset_kind,de.download_name,de.content_type,de.final_object_key
      from purchase_recoveries pr
      join orders o on o.id=pr.order_id and o.status='paid'
      join download_entitlements de on de.order_id=o.id
      join order_items oi on oi.id=de.order_item_id and oi.order_id=o.id
      where pr.id=${input.recoveryId}::uuid
        and de.id=${input.entitlementId}::uuid
        and pr.revoked_at is null
        and pr.expires_at>now()
      limit 1
    `;
    const r=rows[0];
    return r?{
      id:r.id,orderItemId:r.order_item_id,productKey:r.product_key,resourceId:r.resource_id,assetKind:r.asset_kind,
      downloadName:r.download_name,contentType:r.content_type,objectKey:r.final_object_key
    }:null;
  }finally{await sql.end({timeout:2});}
}

export async function revokePurchaseRecovery(input:{recoveryId:string;connectionString?:string}){
  const sql=client(input.connectionString);
  try{
    await sql.begin(async tx=>{
      await tx`update purchase_recoveries set revoked_at=now() where id=${input.recoveryId}::uuid`;
      await tx`update recovery_sessions set revoked_at=now() where recovery_id=${input.recoveryId}::uuid`;
    });
  }finally{await sql.end({timeout:2});}
}
