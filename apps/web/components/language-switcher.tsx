"use client";

import { useEffect, useRef, useState } from "react";
import { localeMeta, supportedLocales, type LocaleCode } from "../i18n/messages";

export function LanguageSwitcher({ locale, currentPath, label, reviewMarket }: {locale:LocaleCode; currentPath:string; label:string; reviewMarket?:string}) {
  const [open,setOpen]=useState(false);
  const root=useRef<HTMLDivElement>(null);
  const trigger=useRef<HTMLButtonElement>(null);
  const options=useRef<Array<HTMLAnchorElement | null>>([]);
  const meta=localeMeta[locale];

  useEffect(()=>{
    function onDoc(event:MouseEvent){ if(root.current && !root.current.contains(event.target as Node)) setOpen(false); }
    function onKey(event:KeyboardEvent){
      if(event.key==="Escape"){ setOpen(false); requestAnimationFrame(()=>trigger.current?.focus()); return; }
      if(!open || !["ArrowDown","ArrowUp"].includes(event.key)) return;
      event.preventDefault();
      const active=document.activeElement;
      const index=options.current.findIndex(x=>x===active);
      const delta=event.key==="ArrowDown"?1:-1;
      const next=index<0 ? 0 : (index+delta+supportedLocales.length)%supportedLocales.length;
      options.current[next]?.focus();
    }
    document.addEventListener("mousedown",onDoc);
    document.addEventListener("keydown",onKey);
    return()=>{document.removeEventListener("mousedown",onDoc);document.removeEventListener("keydown",onKey);};
  },[open]);

  function hrefFor(next:LocaleCode){
    return `${currentPath}?lang=${next}${reviewMarket?`&market=${encodeURIComponent(reviewMarket)}`:""}`;
  }

  return (
    <div className={`language-switcher ${open?"open":""}`} ref={root}>
      <button ref={trigger} className="language-pill language-button" type="button" aria-label={label} aria-haspopup="menu" aria-expanded={open} onClick={()=>setOpen(v=>!v)}>
        <span className={`flag-icon ${meta.flagClass}`} aria-hidden="true"/>
        <span className="language-native">{meta.name}</span>
        <span className="language-code">{meta.code}</span>
        <span className="language-caret" aria-hidden="true">▾</span>
      </button>
      {open ? (
        <div className="language-menu" role="menu" aria-label={label}>
          {supportedLocales.map((code,index)=>{
            const item=localeMeta[code];
            return (
              <a key={code} ref={el=>{options.current[index]=el;}} className={`language-option ${code===locale?"active":""}`} role="menuitem" aria-current={code===locale?"true":undefined} href={hrefFor(code)} lang={code}>
                <span className={`flag-icon ${item.flagClass}`} aria-hidden="true"/>
                <span className="language-option-copy"><strong>{item.name}</strong><small>{item.region}</small></span>
              </a>
            );
          })}
        </div>
      ):null}
    </div>
  );
}
