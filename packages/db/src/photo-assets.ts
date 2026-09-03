import postgres from "postgres";

function dbUrl(value?:string){const url=value??process.env.DATABASE_URL;if(!url)throw new Error("DATABASE_URL is required");return url;}
function client(connectionString?:string){return postgres(dbUrl(connectionString),{max:2,prepare:false});}

export type PhotoAssetRow={
  id:string;userId:string;status:string;sourceContentType:string;sourceSizeBytes:number;
  quarantineObjectKey:string;cleanObjectKey:string;cleanContentType:string|null;cleanSizeBytes:number|null;
  width:number|null;height:number|null;sha256:string|null;createdAt:Date;
};

export async function createPhotoAsset(input:{
  id:string;userId:string;originalName?:string|null;sourceContentType:string;sourceSizeBytes:number;
  quarantineObjectKey:string;cleanObjectKey:string;completionTokenHash:string;connectionString?:string;
}){
  const sql=client(input.connectionString);
  try{
    const rows=await sql<Array<{id:string}>>`
      insert into photo_assets(
        id,user_id,status,original_name,source_content_type,source_size_bytes,
        quarantine_object_key,clean_object_key,completion_token_hash
      ) values(
        ${input.id}::uuid,${input.userId}::uuid,'uploading',${input.originalName??null},
        ${input.sourceContentType},${input.sourceSizeBytes},${input.quarantineObjectKey},${input.cleanObjectKey},${input.completionTokenHash}
      ) returning id
    `;
    if(!rows[0])throw new Error("photo_asset_create_failed");
    return rows[0].id;
  }finally{await sql.end({timeout:2});}
}

export async function claimPhotoAssetForProcessing(input:{assetId:string;userId:string;completionTokenHash:string;connectionString?:string}){
  const sql=client(input.connectionString);
  try{
    return await sql.begin(async tx=>{
      const rows=await tx<Array<{
        id:string;status:string;source_content_type:string;source_size_bytes:number;
        quarantine_object_key:string;clean_object_key:string;clean_content_type:string|null;clean_size_bytes:number|null;
        width:number|null;height:number|null;sha256:string|null;created_at:Date;
      }>>`
        select id,status,source_content_type,source_size_bytes,quarantine_object_key,clean_object_key,
               clean_content_type,clean_size_bytes,width,height,sha256,created_at
        from photo_assets
        where id=${input.assetId}::uuid and user_id=${input.userId}::uuid and completion_token_hash=${input.completionTokenHash}
        limit 1 for update
      `;
      const row=rows[0];
      if(!row)throw new Error("photo_asset_capability_invalid");
      if(row.status==="ready")return{state:"ready" as const,row};
      if(row.status==="processing")throw new Error("photo_asset_processing");
      if(row.status!=="uploading")throw new Error("photo_asset_not_uploadable");
      await tx`update photo_assets set status='processing',updated_at=now() where id=${input.assetId}::uuid`;
      return{state:"claimed" as const,row};
    });
  }finally{await sql.end({timeout:2});}
}

export async function markPhotoAssetReady(input:{
  assetId:string;userId:string;cleanContentType:string;cleanSizeBytes:number;width:number;height:number;sha256:string;connectionString?:string;
}){
  const sql=client(input.connectionString);
  try{
    const rows=await sql<Array<{id:string}>>`
      update photo_assets set status='ready',clean_content_type=${input.cleanContentType},clean_size_bytes=${input.cleanSizeBytes},
        width=${input.width},height=${input.height},sha256=${input.sha256},ready_at=now(),updated_at=now(),failure_code=null
      where id=${input.assetId}::uuid and user_id=${input.userId}::uuid and status='processing'
      returning id
    `;
    if(!rows[0])throw new Error("photo_asset_ready_commit_failed");
    return rows[0].id;
  }finally{await sql.end({timeout:2});}
}

export async function markPhotoAssetFailed(input:{assetId:string;userId:string;failureCode:string;connectionString?:string}){
  const sql=client(input.connectionString);
  try{
    await sql`update photo_assets set status='failed',failure_code=${input.failureCode.slice(0,120)},updated_at=now()
      where id=${input.assetId}::uuid and user_id=${input.userId}::uuid and status in ('uploading','processing')`;
  }finally{await sql.end({timeout:2});}
}

export type TrustedBoundAsset={assetId:string;cleanObjectKey:string;contentType:string;byteSize:number;sha256:string};
export async function loadReadyPhotoAssetForUser(input:{assetId:string;userId:string;connectionString?:string}):Promise<TrustedBoundAsset|null>{
  const sql=client(input.connectionString);
  try{
    const rows=await sql<Array<{asset_id:string;clean_object_key:string;clean_content_type:string;clean_size_bytes:number;sha256:string}>>`
      select id as asset_id,clean_object_key,clean_content_type,clean_size_bytes,sha256
      from photo_assets
      where id=${input.assetId}::uuid and user_id=${input.userId}::uuid
        and status='ready' and clean_content_type is not null and clean_size_bytes is not null and sha256 is not null
      limit 1
    `;
    const row=rows[0];
    return row?{assetId:row.asset_id,cleanObjectKey:row.clean_object_key,contentType:row.clean_content_type,byteSize:row.clean_size_bytes,sha256:row.sha256}:null;
  }finally{await sql.end({timeout:2});}
}

export async function loadTrustedAssetsForVersion(input:{resourceVersionId:string;connectionString?:string}):Promise<TrustedBoundAsset[]>{
  const sql=client(input.connectionString);
  try{
    const rows=await sql<Array<{asset_id:string;clean_object_key:string;clean_content_type:string;clean_size_bytes:number;sha256:string}>>`
      select pa.id as asset_id,pa.clean_object_key,pa.clean_content_type,pa.clean_size_bytes,pa.sha256
      from card_asset_bindings cab
      join photo_assets pa on pa.id=cab.asset_id
      where cab.resource_version_id=${input.resourceVersionId}::uuid and cab.role='photo'
        and pa.status='ready' and pa.clean_content_type is not null and pa.clean_size_bytes is not null and pa.sha256 is not null
      order by cab.created_at asc
    `;
    return rows.map(r=>({assetId:r.asset_id,cleanObjectKey:r.clean_object_key,contentType:r.clean_content_type,byteSize:r.clean_size_bytes,sha256:r.sha256}));
  }finally{await sql.end({timeout:2});}
}

export async function listPhotoAssetCleanupCandidates(input:{olderThanMinutes?:number;limit?:number;connectionString?:string}){
  const sql=client(input.connectionString);const minutes=Math.max(15,input.olderThanMinutes??120);const limit=Math.max(1,Math.min(100,input.limit??25));
  try{
    return await sql<Array<{id:string;quarantine_object_key:string;clean_object_key:string}>>`
      select pa.id,pa.quarantine_object_key,pa.clean_object_key
      from photo_assets pa
      where pa.status in ('uploading','failed')
        and pa.created_at < now()-(${minutes}::text||' minutes')::interval
        and not exists(select 1 from card_asset_bindings cab where cab.asset_id=pa.id)
      order by pa.created_at asc limit ${limit}
    `;
  }finally{await sql.end({timeout:2});}
}

export async function markPhotoAssetDeleted(input:{assetId:string;connectionString?:string}){
  const sql=client(input.connectionString);
  try{
    const rows=await sql<Array<{id:string}>>`
      update photo_assets set status='deleted',deleted_at=now(),updated_at=now()
      where id=${input.assetId}::uuid and status in ('uploading','failed')
        and not exists(select 1 from card_asset_bindings cab where cab.asset_id=photo_assets.id)
      returning id
    `;
    return Boolean(rows[0]);
  }finally{await sql.end({timeout:2});}
}
