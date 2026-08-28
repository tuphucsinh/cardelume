import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Download, FileImage, FileText, LockKeyhole, ShieldCheck } from "lucide-react";
import { listRecoveryAssets } from "@cardelume/db";
import { BrandMark } from "../../../components/brand-mark";
import { normalizeLocale } from "../../../i18n/messages";
import { recoveryCopy } from "../../../i18n/recovery-copy";
import { verifyRecoveryBrowserSession } from "../../../lib/recovery.server";
import { recoveryCookieName } from "../../../lib/recovery-secrets.server";
import { RecoveryRefresh } from "./recovery-refresh";

export const dynamic="force-dynamic";
export const metadata:Metadata={robots:{index:false,follow:false,nocache:true}};

function formatExpiry(date:Date,locale:string){
  try{return new Intl.DateTimeFormat(locale,{year:"numeric",month:"short",day:"numeric"}).format(date);}catch{return date.toISOString().slice(0,10);}
}

function assetLabel(kind:string,t:ReturnType<typeof getCopy>){
  if(kind.toLowerCase()==="jpg"||kind.toLowerCase()==="jpeg")return t.jpg;
  if(kind.toLowerCase()==="pdf")return t.pdf;
  return t.finalFile;
}
function getCopy(locale:string){return recoveryCopy[normalizeLocale(locale)];}

export default async function RecoveryPage({params}:{params:Promise<{recoveryId:string}>}){
  const {recoveryId}=await params;
  const jar=await cookies();
  const secret=jar.get(recoveryCookieName(recoveryId))?.value;
  const access=await verifyRecoveryBrowserSession({recoveryId,sessionSecret:secret}).catch(()=>null);
  const locale=normalizeLocale(access?.locale||"en");
  const t=recoveryCopy[locale];

  if(!access){
    return <main className="recovery-page" lang={locale}>
      <section className="recovery-card recovery-locked">
        <BrandMark/><LockKeyhole size={28}/>
        <h1>{t.accessNeeded}</h1><p>{t.accessNeededBody}</p>
      </section>
    </main>;
  }

  const assets=await listRecoveryAssets({recoveryId}).catch(()=>[]);
  return <main className="recovery-page" lang={locale}>
    <section className="recovery-card">
      <div className="recovery-brand"><BrandMark/><span>CARDELUME</span></div>
      {assets.length===0?<>
        <RecoveryRefresh/>
        <div className="recovery-seal"><ShieldCheck size={24}/></div>
        <span className="eyebrow">{t.eyebrow}</span>
        <h1>{t.preparing}</h1><p className="recovery-intro">{t.preparingBody}</p>
        <div className="recovery-progress" aria-hidden="true"><i/><i/><i/></div>
      </>:<>
        <div className="recovery-seal"><ShieldCheck size={24}/></div>
        <span className="eyebrow">{t.eyebrow}</span>
        <h1>{t.ready}</h1><p className="recovery-intro">{t.intro}</p><p className="recovery-keepsake">{t.keepsakeNote}</p>
        <div className="recovery-assets">
          {assets.map(asset=>{
            const kind=asset.assetKind.toLowerCase();
            const Icon=kind==="pdf"?FileText:kind==="jpg"||kind==="jpeg"?FileImage:Download;
            return <a className="recovery-asset" href={`/d/${recoveryId}/download/${asset.id}`} key={asset.id}>
              <span className="recovery-asset-icon"><Icon size={19}/></span>
              <span><strong>{assetLabel(asset.assetKind,t)}</strong><small>{asset.downloadName||asset.assetKind.toUpperCase()}</small></span>
              <Download size={16}/>
            </a>;
          })}
        </div>
      </>}
      <div className="recovery-foot">
        <p><LockKeyhole size={13}/>{t.privateNote}</p>
        <p>{t.expires}: <strong>{formatExpiry(access.recoveryExpiresAt,locale)}</strong></p>
      </div>
    </section>
  </main>;
}
