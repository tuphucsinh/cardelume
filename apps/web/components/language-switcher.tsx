"use client";

import { useEffect, useRef } from "react";
import { localeMeta, supportedLocales, type LocaleCode } from "../i18n/messages";

export function LanguageSwitcher({ locale, currentPath, label, reviewMarket }: {locale:LocaleCode; currentPath:string; label:string; reviewMarket?:string}) {
  const root=useRef<HTMLDetailsElement>(null);
  const trigger=useRef<HTMLElement>(null);
  const options=useRef<Array<HTMLAnchorElement | null>>([]);
  const meta=localeMeta[locale];

  useEffect(()=>{
    function onDoc(event:MouseEvent){ if(root.current && !root.current.contains(event.target as Node)) root.current.open=false; }
    function onKey(event:KeyboardEvent){
      if(event.key==="Escape" && root.current?.open){ root.current.open=false; requestAnimationFrame(()=>trigger.current?.focus()); return; }
      if(!root.current?.open || !["ArrowDown","ArrowUp"].includes(event.key)) return;
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
  },[]);

  function hrefFor(next:LocaleCode){
    return `${currentPath}?lang=${next}${reviewMarket?`&market=${encodeURIComponent(reviewMarket)}`:""}`;
  }

  return (
    <details className="language-switcher" ref={root}>
      <summary ref={trigger} className="language-pill language-button" aria-label={label} aria-haspopup="menu">
        <span className={`flag-icon ${meta.flagClass}`} aria-hidden="true"/>
        <span className="language-native">{meta.name}</span>
        <span className="language-code">{meta.code}</span>
        <span className="language-caret" aria-hidden="true">▾</span>
      </summary>
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
    </details>
  );
}
