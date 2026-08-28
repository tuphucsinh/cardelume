"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode, type PointerEvent as ReactPointerEvent } from "react";
import { Activity, Check, Gauge, Sparkles, Vibrate } from "lucide-react";
import type { LocaleCode } from "../i18n/messages";

type Prefs={
  master:boolean;
  haptics:boolean;
  gyro:boolean;
  lighting:boolean;
};

type Ctx={
  prefs:Prefs;
  reducedMotion:boolean;
  performancePaused:boolean;
  gyroPermission:"unknown"|"granted"|"denied"|"unsupported";
  setPref:(key:keyof Prefs,value:boolean)=>Promise<void>|void;
  haptic:(kind?:"reveal"|"select"|"confirm")=>void;
};

const defaults:Prefs={master:true,haptics:true,gyro:true,lighting:true};
const EffectsContext=createContext<Ctx|null>(null);
const STORAGE="cardelume.physical-effects.v2";

type Copy={
  button:string; title:string; subtitle:string;
  master:string; haptics:string; gyro:string; lighting:string;
  on:string; off:string; auto:string; permission:string; denied:string;
  reduced:string;
  paused:string;
};

const copy:Record<LocaleCode,Copy>={
  en:{button:"Physical effects",title:"Physical effects",subtitle:"Optional tactile details. Off by default — turn on only what you want.",master:"Effects",haptics:"Haptic tap",gyro:"Gyroscope tilt",lighting:"Dynamic lighting",on:"On",off:"Off",auto:"Auto",permission:"Tap to allow motion",denied:"Motion permission blocked",reduced:"Reduced Motion is active",paused:"Paused automatically for smoother scrolling"},
  ja:{button:"物理エフェクト",title:"物理エフェクト",subtitle:"控えめな触感表現。初期設定はオフ。必要なものだけオンにできます。",master:"エフェクト",haptics:"ハプティック",gyro:"ジャイロ傾き",lighting:"動的ライティング",on:"オン",off:"オフ",auto:"自動",permission:"タップしてモーションを許可",denied:"モーション権限が拒否されています",reduced:"視差を減らす設定が有効です",paused:"なめらかな操作のため自動的に一時停止しました"},
  ko:{button:"물리 효과",title:"물리 효과",subtitle:"은은한 촉감과 빛 표현. 기본은 꺼짐이며 원하는 효과만 켤 수 있어요.",master:"효과",haptics:"햅틱 탭",gyro:"자이로 기울기",lighting:"동적 조명",on:"켜짐",off:"꺼짐",auto:"자동",permission:"탭하여 모션 허용",denied:"모션 권한이 차단됨",reduced:"동작 줄이기가 활성화됨",paused:"더 부드러운 스크롤을 위해 자동으로 잠시 멈췄어요"},
  es:{button:"Efectos físicos",title:"Efectos físicos",subtitle:"Detalles táctiles opcionales. Están desactivados por defecto; activa solo lo que quieras.",master:"Efectos",haptics:"Toque háptico",gyro:"Inclinación giroscópica",lighting:"Iluminación dinámica",on:"Sí",off:"No",auto:"Auto",permission:"Toca para permitir movimiento",denied:"Permiso de movimiento bloqueado",reduced:"Reducir movimiento está activo",paused:"Pausados automáticamente para mantener un desplazamiento fluido"},
  fr:{button:"Effets physiques",title:"Effets physiques",subtitle:"Des détails tactiles facultatifs, désactivés par défaut. Activez seulement ceux que vous souhaitez.",master:"Effets",haptics:"Retour haptique",gyro:"Inclinaison gyroscopique",lighting:"Lumière dynamique",on:"Oui",off:"Non",auto:"Auto",permission:"Touchez pour autoriser le mouvement",denied:"Autorisation de mouvement bloquée",reduced:"Réduire les animations est actif",paused:"Effets mis en pause automatiquement pour préserver la fluidité"},
  de:{button:"Physische Effekte",title:"Physische Effekte",subtitle:"Optionale Haptik und Lichtwirkung. Standardmäßig aus — nur Gewünschtes einschalten.",master:"Effekte",haptics:"Haptischer Impuls",gyro:"Gyroskop-Neigung",lighting:"Dynamisches Licht",on:"An",off:"Aus",auto:"Auto",permission:"Tippen, um Bewegung zu erlauben",denied:"Bewegungsfreigabe blockiert",reduced:"Reduzierte Bewegung ist aktiv",paused:"Für flüssiges Scrollen automatisch pausiert"},
  pt:{button:"Efeitos físicos",title:"Efeitos físicos",subtitle:"Detalhes táteis opcionais. Desligados por padrão; ative só o que quiser.",master:"Efeitos",haptics:"Toque háptico",gyro:"Inclinação por giroscópio",lighting:"Luz dinâmica",on:"Ligado",off:"Desligado",auto:"Auto",permission:"Toque para permitir movimento",denied:"Permissão de movimento bloqueada",reduced:"Reduzir movimento está ativo",paused:"Pausados automaticamente para manter a rolagem fluida"},
  it:{button:"Effetti fisici",title:"Effetti fisici",subtitle:"Dettagli tattili opzionali. Disattivati per impostazione predefinita; attiva solo ciò che vuoi.",master:"Effetti",haptics:"Tocco aptico",gyro:"Inclinazione giroscopica",lighting:"Luce dinamica",on:"On",off:"Off",auto:"Auto",permission:"Tocca per consentire il movimento",denied:"Permesso di movimento bloccato",reduced:"Riduci movimento è attivo",paused:"Effetti sospesi automaticamente per mantenere lo scorrimento fluido"},
  zh:{button:"物理效果",title:"物理效果",subtitle:"克制的触感与光影，默认关闭，只开启你想要的效果。",master:"效果",haptics:"触感反馈",gyro:"陀螺仪倾斜",lighting:"动态光影",on:"开启",off:"关闭",auto:"自动",permission:"点击允许运动传感器",denied:"运动权限被阻止",reduced:"系统已开启减少动态效果",paused:"为保持流畅滚动，效果已自动暂停"},
  vi:{button:"Hiệu ứng vật lý",title:"Hiệu ứng vật lý",subtitle:"Hiệu ứng chạm và ánh sáng là tùy chọn, mặc định tắt; chỉ bật phần bạn muốn.",master:"Hiệu ứng",haptics:"Rung phản hồi",gyro:"Nghiêng theo con quay",lighting:"Ánh sáng động",on:"Bật",off:"Tắt",auto:"Tự động",permission:"Nhấn để cho phép cảm biến chuyển động",denied:"Quyền cảm biến chuyển động bị chặn",reduced:"Reduce Motion đang được bật",paused:"Đã tự tạm dừng để giữ cuộn trang mượt"}
};

function clamp(n:number,min:number,max:number){return Math.max(min,Math.min(max,n));}

export function PhysicalEffectsProvider({children}:{children:ReactNode}){
  const [prefs,setPrefs]=useState<Prefs>(defaults);
  const [reducedMotion,setReducedMotion]=useState(false);
  const [performancePaused,setPerformancePaused]=useState(false);
  const [gyroPermission,setGyroPermission]=useState<Ctx["gyroPermission"]>("unknown");
  const raf=useRef<number|undefined>(undefined);

  useEffect(()=>{
    try{
      const stored=localStorage.getItem(STORAGE);
      if(stored)setPrefs({...defaults,...JSON.parse(stored)});
    }catch{}
    const mq=window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync=()=>setReducedMotion(mq.matches);
    sync();
    mq.addEventListener?.("change",sync);
    return()=>mq.removeEventListener?.("change",sync);
  },[]);

  useEffect(()=>{
    try{localStorage.setItem(STORAGE,JSON.stringify(prefs));}catch{}
    const root=document.documentElement;
    const active=prefs.master&&!performancePaused;
    root.dataset.physicalEffects=active?"on":"off";
    root.dataset.dynamicLighting=active&&prefs.lighting&&!reducedMotion?"on":"off";
    root.dataset.gyroEffects=active&&prefs.gyro&&!reducedMotion?"on":"off";
    root.dataset.haptics=active&&prefs.haptics?"on":"off";
    root.dataset.effectsPerformancePaused=performancePaused?"true":"false";
  },[prefs,reducedMotion,performancePaused]);

  useEffect(()=>{
    if(!prefs.master||(!prefs.gyro&&!prefs.lighting)||reducedMotion||performancePaused)return;
    let rafId=0;
    let frames=0;
    let started=performance.now();
    let badWindows=0;
    let cancelled=false;

    const sample=(now:number)=>{
      if(cancelled)return;
      frames++;
      const elapsed=now-started;
      if(elapsed>=1400){
        const fps=frames/(elapsed/1000);
        if(fps<32)badWindows++;
        else badWindows=0;
        if(badWindows>=2){
          setPerformancePaused(true);
          return;
        }
        frames=0;started=now;
      }
      rafId=requestAnimationFrame(sample);
    };
    const timer=window.setTimeout(()=>{rafId=requestAnimationFrame(sample);},500);
    return()=>{cancelled=true;window.clearTimeout(timer);if(rafId)cancelAnimationFrame(rafId);};
  },[prefs.master,prefs.gyro,prefs.lighting,reducedMotion,performancePaused]);

  const requestGyro=useCallback(async()=>{
    if(typeof window==="undefined")return false;
    const D=(window as typeof window & {DeviceOrientationEvent?:typeof DeviceOrientationEvent & {requestPermission?:()=>Promise<"granted"|"denied">}}).DeviceOrientationEvent;
    if(!D){setGyroPermission("unsupported");return false;}
    if(typeof D.requestPermission==="function"){
      try{
        const result=await D.requestPermission();
        setGyroPermission(result);
        return result==="granted";
      }catch{
        setGyroPermission("denied");
        return false;
      }
    }
    setGyroPermission("granted");
    return true;
  },[]);

  useEffect(()=>{
    if(!prefs.master||!prefs.gyro||reducedMotion||performancePaused)return;
    let mounted=true;
    let permission=gyroPermission;

    if(permission==="unknown"){
      const D=(window as typeof window & {DeviceOrientationEvent?:typeof DeviceOrientationEvent & {requestPermission?:()=>Promise<"granted"|"denied">}}).DeviceOrientationEvent;
      if(!D){setGyroPermission("unsupported");return;}
      if(typeof D.requestPermission!=="function"){setGyroPermission("granted");permission="granted";}
    }
    if(permission!=="granted")return;

    const onOrientation=(event:DeviceOrientationEvent)=>{
      if(!mounted)return;
      const gamma=clamp(event.gamma??0,-20,20);
      const beta=clamp((event.beta??0)-45,-20,20);
      if(raf.current)cancelAnimationFrame(raf.current);
      raf.current=requestAnimationFrame(()=>{
        const root=document.documentElement;
        root.style.setProperty("--gyro-ry",`${(gamma/20)*3.3}deg`);
        root.style.setProperty("--gyro-rx",`${(-beta/20)*2.6}deg`);
        root.style.setProperty("--gyro-light-x",`${50+(gamma/20)*25}%`);
        root.style.setProperty("--gyro-light-y",`${48+(beta/20)*20}%`);
      });
    };
    window.addEventListener("deviceorientation",onOrientation,{passive:true});
    return()=>{
      mounted=false;
      window.removeEventListener("deviceorientation",onOrientation);
      if(raf.current)cancelAnimationFrame(raf.current);
    };
  },[prefs.master,prefs.gyro,reducedMotion,performancePaused,gyroPermission]);

  const setPref=useCallback(async(key:keyof Prefs,value:boolean)=>{
    setPerformancePaused(false);
    if(key==="gyro"&&value){
      const ok=await requestGyro();
      setPrefs(p=>({...p,master:ok||gyroPermission==="granted"?true:p.master,gyro:ok||gyroPermission==="granted"}));
      return;
    }
    setPrefs(p=>key==="master"
      ? {...p,master:value}
      : {...p,master:value?true:p.master,[key]:value});
  },[requestGyro,gyroPermission]);

  const haptic=useCallback((kind:"reveal"|"select"|"confirm"="select")=>{
    if(!prefs.master||!prefs.haptics||performancePaused)return;
    if(typeof navigator==="undefined"||typeof navigator.vibrate!=="function")return;
    const pattern=kind==="reveal"?[9]:kind==="confirm"?[10]:[6];
    navigator.vibrate(pattern);
  },[prefs.master,prefs.haptics,performancePaused]);

  const value=useMemo(()=>({prefs,reducedMotion,performancePaused,gyroPermission,setPref,haptic}),[prefs,reducedMotion,performancePaused,gyroPermission,setPref,haptic]);
  return <EffectsContext.Provider value={value}>{children}</EffectsContext.Provider>;
}

export function usePhysicalEffects(){
  const ctx=useContext(EffectsContext);
  if(!ctx)throw new Error("usePhysicalEffects must be used inside PhysicalEffectsProvider");
  return ctx;
}

export function PhysicalEffectsControl({locale}:{locale:LocaleCode}){
  const {prefs,reducedMotion,performancePaused,gyroPermission,setPref}=usePhysicalEffects();
  const [open,setOpen]=useState(false);
  const root=useRef<HTMLDivElement>(null);
  const trigger=useRef<HTMLButtonElement>(null);
  const t=copy[locale];

  useEffect(()=>{
    function outside(e:MouseEvent){if(root.current&&!root.current.contains(e.target as Node))setOpen(false);}
    function key(e:KeyboardEvent){
      if(e.key==="Escape"&&open){setOpen(false);requestAnimationFrame(()=>trigger.current?.focus());}
    }
    document.addEventListener("mousedown",outside);
    document.addEventListener("keydown",key);
    return()=>{document.removeEventListener("mousedown",outside);document.removeEventListener("keydown",key);};
  },[open]);

  const row=(key:keyof Prefs,label:string,icon:ReactNode,extra?:string)=>{
    const effective=key==="gyro"
      ? prefs.master&&prefs.gyro&&gyroPermission==="granted"
      : prefs.master&&prefs[key];
    const pendingGyro=key==="gyro"&&prefs.master&&prefs.gyro&&gyroPermission==="unknown";
    const click=()=>{
      if(key==="gyro"&&prefs.gyro&&gyroPermission==="unknown"){ void setPref("gyro",true); return; }
      void setPref(key,!prefs[key]);
    };
    return(
      <button type="button" className="effects-row" role="menuitemcheckbox" aria-checked={effective} onClick={click}>
        <span className="effects-row-icon">{icon}</span>
        <span className="effects-row-copy"><strong>{label}</strong>{extra?<small>{extra}</small>:null}</span>
        <span className={`effects-state ${effective?"on":""}`}>{pendingGyro?t.auto:effective?t.on:t.off}</span>
      </button>
    );
  };

  let gyroExtra:string|undefined;
  if(prefs.gyro&&gyroPermission==="unknown")gyroExtra=t.permission;
  else if(prefs.gyro&&gyroPermission==="denied")gyroExtra=t.denied;
  else if(prefs.gyro&&gyroPermission==="granted")gyroExtra=t.auto;

  return(
    <div className={`effects-control ${open?"open":""}`} ref={root}>
      <button ref={trigger} className="effects-trigger" type="button" aria-label={t.button} aria-haspopup="menu" aria-expanded={open} onClick={()=>setOpen(v=>!v)}>
        <Sparkles size={16}/><span className="effects-trigger-label">{prefs.master?t.on:t.off}</span>
      </button>
      {open?<div className="effects-menu" role="menu" aria-label={t.title}>
        <div className="effects-menu-head"><div><strong>{t.title}</strong><p>{t.subtitle}</p></div><span className={`effects-master-dot ${prefs.master?"on":""}`}/></div>
        <button type="button" className="effects-row master" role="menuitemcheckbox" aria-checked={prefs.master} onClick={()=>setPref("master",!prefs.master)}>
          <span className="effects-row-icon"><Activity size={16}/></span>
          <span className="effects-row-copy"><strong>{t.master}</strong>{reducedMotion?<small>{t.reduced}</small>:null}</span>
          <span className={`effects-state ${prefs.master?"on":""}`}>{prefs.master?t.on:t.off}</span>
        </button>
        {row("haptics",t.haptics,<Vibrate size={16}/>)}
        {row("gyro",t.gyro,<Gauge size={16}/>,gyroExtra)}
        {row("lighting",t.lighting,<Sparkles size={16}/>)}
        <div className="effects-foot"><Check size={12}/><span>{performancePaused?t.paused:reducedMotion?t.reduced:t.subtitle}</span></div>
      </div>:null}
    </div>
  );
}

export function PhysicalCardSurface({children,className="",intensity=1}:{children:ReactNode;className?:string;intensity?:number}){
  const {prefs,reducedMotion,performancePaused}=usePhysicalEffects();
  const ref=useRef<HTMLDivElement>(null);
  const pointerRaf=useRef<number|undefined>(undefined);
  const onPointerMove=(e:ReactPointerEvent<HTMLDivElement>)=>{
    if(!prefs.master||reducedMotion||performancePaused)return;
    const node=e.currentTarget;
    const rect=node.getBoundingClientRect();
    const px=clamp((e.clientX-rect.left)/rect.width,0,1);
    const py=clamp((e.clientY-rect.top)/rect.height,0,1);
    if(pointerRaf.current)cancelAnimationFrame(pointerRaf.current);
    pointerRaf.current=requestAnimationFrame(()=>{
      const maxTilt=e.pointerType==="touch"?1.35:2.6;
      node.style.setProperty("--pointer-ry",`${((px-.5)*maxTilt*2*intensity).toFixed(2)}deg`);
      node.style.setProperty("--pointer-rx",`${((.5-py)*maxTilt*1.55*intensity).toFixed(2)}deg`);
      if(prefs.lighting){
        node.style.setProperty("--pointer-light-x",`${(px*100).toFixed(1)}%`);
        node.style.setProperty("--pointer-light-y",`${(py*100).toFixed(1)}%`);
        node.style.setProperty("--pointer-light-opacity",String((e.pointerType==="touch"?.07:.13)*intensity));
      }
      node.dataset.physicalActive="true";
    });
  };
  const resetPointer=(node:HTMLDivElement)=>{
    if(pointerRaf.current)cancelAnimationFrame(pointerRaf.current);
    pointerRaf.current=requestAnimationFrame(()=>{
      node.style.setProperty("--pointer-light-opacity","0");
      node.style.setProperty("--pointer-rx","0deg");
      node.style.setProperty("--pointer-ry","0deg");
      delete node.dataset.physicalActive;
    });
  };
  const onPointerLeave=(e:ReactPointerEvent<HTMLDivElement>)=>resetPointer(e.currentTarget);
  const onPointerCancel=(e:ReactPointerEvent<HTMLDivElement>)=>resetPointer(e.currentTarget);
  return <div ref={ref} className={`physical-card-surface ${className}`} onPointerMove={onPointerMove} onPointerLeave={onPointerLeave} onPointerCancel={onPointerCancel}>{children}</div>;
}
