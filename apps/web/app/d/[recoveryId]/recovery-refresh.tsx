"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function RecoveryRefresh(){
  const router=useRouter();
  useEffect(()=>{
    let attempts=0;
    let timer:number|undefined;
    const tick=()=>{
      if(document.visibilityState!=="visible")return;
      attempts++;
      router.refresh();
      if(attempts>=12&&timer)window.clearInterval(timer);
    };
    timer=window.setInterval(tick,2500);
    const onVisible=()=>{if(document.visibilityState==="visible"&&attempts<12)tick();};
    document.addEventListener("visibilitychange",onVisible);
    return()=>{if(timer)window.clearInterval(timer);document.removeEventListener("visibilitychange",onVisible);};
  },[router]);
  return null;
}
