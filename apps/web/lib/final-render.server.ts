import "server-only";
import { listPaidOrderItemsForFinalization } from "@cardelume/db";
import { createBoss, QUEUES } from "@cardelume/queue";

let bossPromise:ReturnType<typeof startBoss>|undefined;
async function startBoss(){
  const boss=createBoss(process.env.QUEUE_DATABASE_URL||process.env.DATABASE_URL);
  await boss.start();
  return boss;
}
function webBoss(){return bossPromise??=startBoss();}

export async function enqueuePaidFinalRenders(orderId:string){
  const items=await listPaidOrderItemsForFinalization({orderId});
  if(items.length===0)throw new Error("paid_order_items_not_ready_for_finalization");
  const boss=await webBoss();
  const submitted:Array<{orderItemId:string;queueJobId:string|null}>=[];
  for(const item of items){
    if(item.product_key!=="cardelume")continue;
    if(!item.resource_version_id)throw new Error("paid_order_item_missing_resource_version");
    const jobId=item.resource_version_id;
    const queueJobId=await boss.send(QUEUES.final,{
      productKey:"cardelume",
      resourceId:item.resource_id,
      jobId,
      orderId,
      orderItemId:item.order_item_id
    },{
      singletonKey:`cardelume:${item.order_item_id}:${item.resource_version_id}`,
      retryLimit:3,
      retryDelay:3,
      retryBackoff:true,
      expireInSeconds:120
    });
    submitted.push({orderItemId:item.order_item_id,queueJobId});
  }
  if(submitted.length===0)throw new Error("no_cardelume_order_items_for_finalization");
  return submitted;
}
