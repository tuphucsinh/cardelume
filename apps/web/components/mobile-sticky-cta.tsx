"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function MobileStickyCta({href,label}:{href:string;label:string}){
  const [show,setShow]=useState(false);

  useEffect(()=>{
    const hero=document.getElementById("hero");
    if(!hero)return;
    const observer=new IntersectionObserver(([entry])=>{
      setShow(!entry.isIntersecting);
    },{threshold:.12});
    observer.observe(hero);
    return()=>observer.disconnect();
  },[]);

  return <div className={`mobile-sticky-cta ${show?"show":""}`} aria-hidden={!show}>
    <Link className="button button-primary" href={href} tabIndex={show?0:-1}>{label}</Link>
  </div>;
}
