'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Line } from "recharts";
import * as XLSX from "xlsx";
import { fetchCategories, fetchOrcamento, fetchFaturas, fetchProvisoes, upsertCategory, deleteCategory as dbDeleteCategory, saveFatura as dbSaveFatura, deleteFatura as dbDeleteFatura, saveProvisao as dbSaveProvisao, deleteProvisao as dbDeleteProvisao, fetchAllProfiles, approveUser, revokeUser, toggleAdmin } from "../lib/data";

const mkCM=(cats)=>Object.fromEntries(cats.map(c=>[c.id,c]));
const fcv=(f,cid)=>(f.aloc||[]).filter(a=>a.cat===cid).reduce((s,a)=>s+a.valor,0);
const genYMs=(a,b)=>{if(!a||!b)return[];const r=[];let[y,m]=a.split("-").map(Number);const[ey,em]=b.split("-").map(Number);while(y<ey||(y===ey&&m<=em)){r.push(`${y}-${String(m).padStart(2,"0")}`);m++;if(m>12){m=1;y++;}}return r;};
const toYM=(d)=>{if(!d)return null;const t=new Date(d+"T12:00:00");return`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}`;};
const ymL=(k)=>{if(!k)return"";const[y,m]=k.split("-");return["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][+m-1]+"/"+y.slice(2);};
const uid=()=>"id_"+Math.random().toString(36).slice(2,10);
const TODAY=new Date().toISOString().slice(0,10);

const fmt=(v)=>v!=null?v.toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2}):"—";
const R$=(v)=>v!=null?"R$ "+fmt(v):"—";
const R$k=(v)=>{if(v==null)return"—";const a=Math.abs(v);const s=v<0?"-":"";if(a>=1e6)return s+"R$ "+fmt(a/1e6).replace(/,00$/,"")+"M";if(a>=1e3)return s+"R$ "+Math.round(a/1e3)+"k";return R$(v);};
const pc=(v)=>v!=null?`${(v*100).toFixed(1)}%`:"—";
const fd=(d)=>d?new Date(d+"T12:00:00").toLocaleDateString("pt-BR"):"—";

/* ═══ MONEY INPUT — formats with . thousands and , decimals ═══ */
function MoneyInput({ value, onChange, placeholder, style, ...rest }) {
  const fmt2 = (v) => {
    if (v === "" || v == null) return "";
    const n = Number(v);
    if (isNaN(n)) return String(v);
    return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  const ref = React.useRef(null);
  const [display, setDisplay] = useState(fmt2(value));
  const [focused, setFocused] = useState(false);
  const handleChange = (e) => {
    let raw = e.target.value;
    raw = raw.replace(/[^0-9.,-]/g, "");
    setDisplay(raw);
    const cleaned = raw.replace(/\./g, "").replace(",", ".");
    const num = parseFloat(cleaned);
    onChange(isNaN(num) ? "" : num);
  };
  const handleBlur = () => {
    setFocused(false);
    if (value !== "" && value != null && !isNaN(Number(value))) {
      setDisplay(fmt2(value));
    }
  };
  const handleFocus = (e) => {
    setFocused(true);
    setTimeout(() => e.target.select(), 0);
  };
  // Only sync external value changes when NOT focused
  React.useEffect(() => {
    if (!focused && value !== "" && value != null && !isNaN(Number(value))) {
      setDisplay(fmt2(value));
    }
  }, [value, focused]);
  return <input ref={ref} className="inp" type="text" inputMode="decimal" value={display} onChange={handleChange} onBlur={handleBlur} onFocus={handleFocus} placeholder={placeholder || "0,00"} style={{ textAlign: "right", ...style }} {...rest} />;
}

/* ═══ CSS ═══ */
const CSS=`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-thumb{background:#cbd5e0;border-radius:3px}input,select,textarea{font-family:inherit}
.fi{animation:fi .25s ease-out}@keyframes fi{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}.hr:hover{background:#f7fafc!important}
.sc{transition:transform .12s,box-shadow .12s}.sc:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(0,0,0,.07)}
.bp{background:#1a365d;color:#fff;border:none;padding:7px 14px;border-radius:7px;cursor:pointer;font-weight:500;font-size:12.5px;display:inline-flex;align-items:center;gap:5px}.bp:hover{background:#2d4a7a}
.bs{background:#fff;color:#4a5568;border:1px solid #e2e8f0;padding:7px 14px;border-radius:7px;cursor:pointer;font-weight:500;font-size:12.5px;display:inline-flex;align-items:center;gap:5px}.bs:hover{background:#f7fafc}
.bi{background:none;border:none;cursor:pointer;padding:5px;border-radius:5px;color:#718096;display:flex;align-items:center}.bi:hover{background:#edf2f7;color:#2d3748}
.inp{width:100%;padding:8px 11px;border:1px solid #e2e8f0;border-radius:7px;font-size:12.5px;outline:none;background:#fff}.inp:focus{border-color:#4299e1;box-shadow:0 0 0 2px rgba(66,153,225,.12)}
.bdg{display:inline-flex;padding:2px 9px;border-radius:16px;font-size:10.5px;font-weight:600;letter-spacing:.2px}
.bdg-pago{background:#c6f6d5;color:#22543d}.bdg-programado{background:#fefcbf;color:#744210}.bdg-cancelado{background:#fed7d7;color:#9b2c2c}.bdg-ativo{background:#bee3f8;color:#2a4365}
table{width:100%;border-collapse:separate;border-spacing:0}th{text-align:left;padding:9px 11px;font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:.4px;color:#718096;border-bottom:2px solid #e2e8f0;background:#fff;position:sticky;top:0;z-index:1}
td{padding:9px 11px;font-size:12.5px;border-bottom:1px solid #f0f2f5}.mn{font-family:'JetBrains Mono',monospace;font-size:11.5px}
.sl{display:flex;align-items:center;gap:11px;padding:9px 14px;border-radius:9px;cursor:pointer;font-size:13.5px;font-weight:500;color:rgba(255,255,255,.65);border:none;background:none;width:100%;text-align:left;transition:all .12s}
.sl:hover{background:rgba(255,255,255,.08);color:#fff}.sl.ac{background:rgba(255,255,255,.13);color:#fff;font-weight:600}
.mo{position:fixed;inset:0;background:rgba(0,0,0,.35);backdrop-filter:blur(3px);display:flex;align-items:flex-start;justify-content:center;padding:24px 16px;z-index:1000;overflow-y:auto}
.mc{background:#fff;border-radius:14px;width:100%;max-width:700px;box-shadow:0 16px 48px rgba(0,0,0,.12);animation:fi .2s ease-out}
.pb{height:5px;background:#edf2f7;border-radius:3px;overflow:hidden}.pf{height:100%;border-radius:3px;transition:width .5s ease}
.lk{display:inline-flex;align-items:center;gap:3px;color:#3182ce;font-size:10px;text-decoration:none;padding:2px 5px;border-radius:4px;background:#ebf8ff}.lk:hover{background:#bee3f8}
.ar{display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid #f0f2f5}.ar:last-child{border-bottom:none}
@media(max-width:768px){.sd{display:none!important}.mcm{margin-left:0!important}}@media(min-width:769px){.mm{display:none!important}}`;

const I=({n,s=17})=>{const p={width:s,height:s,strokeWidth:1.7,fill:"none",stroke:"currentColor",strokeLinecap:"round",strokeLinejoin:"round",viewBox:"0 0 24 24"};const m={
dash:<svg {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
rec:<svg {...p}><path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2Z"/><path d="M8 10h8M8 14h4"/></svg>,
est:<svg {...p}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
cf:<svg {...p}><path d="M3 3v18h18"/><path d="m7 16 4-4 4 4 5-5"/></svg>,
set:<svg {...p}><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>,
pl:<svg {...p}><path d="M12 5v14M5 12h14"/></svg>,
ed:<svg {...p}><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>,
tr:<svg {...p}><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
x:<svg {...p}><path d="M18 6 6 18M6 6l12 12"/></svg>,
ck:<svg {...p}><path d="M20 6 9 17l-5-5"/></svg>,
al:<svg {...p}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></svg>,
sr:<svg {...p}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
mn:<svg {...p}><path d="M4 6h16M4 12h16M4 18h16"/></svg>,
bd:<svg {...p}><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/></svg>,
dl:<svg {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>,
lk:<svg {...p}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
};return m[n]||null;};

/* ═══ CORE ENGINE: provision saldo & cashflow dilution ═══ */
function useEngine(fat, prov) {
  // 1. For each provision, compute how much was consumed by linked faturas
  const provData = useMemo(() => {
    const map = {};
    prov.forEach(p => {
      // Total consumed by all linked faturas (regardless of category)
      let totalConsumed = 0;
      fat.forEach(f => {
        if (!(f.prov_ids || []).includes(p.id)) return;
        if (f.st === "Cancelado") return;
        totalConsumed += f.vf || 0;
      });
      const totalRemaining = Math.max(0, p.ve - totalConsumed);
      // Distribute remaining proportionally across provision's categories
      const provTotal = (p.aloc || []).reduce((s, a) => s + a.valor, 0);
      const remaining = {};
      (p.aloc || []).forEach(a => {
        remaining[a.cat] = provTotal > 0 ? totalRemaining * (a.valor / provTotal) : 0;
      });
      map[p.id] = { totalConsumed, remaining, totalRemaining };
    });
    return map;
  }, [fat, prov]);

  return { provData };
}

/* ═══ MAIN APP ═══ */

export default function ObraApp({ session, profile, onSignOut }) {
  const [pg, setPg] = useState("dash");
  const [fat, setFat] = useState([]);
  const [prov, setProv] = useState([]);
  const [orc, setOrc] = useState({});
  const [cats, setCats] = useState([]);
  const [sb, setSb] = useState(false);
  const [mod, setMod] = useState(null);
  const [ei, setEi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load all data from Supabase
  useEffect(() => {
    (async () => {
      try {
        const [c, o, f, p] = await Promise.all([
          fetchCategories(), fetchOrcamento(), fetchFaturas(), fetchProvisoes()
        ]);
        setCats(c);
        setOrc(o);
        setFat(f);
        setProv(p);
      } catch (e) {
        console.error("Load error:", e);
        alert("Erro ao carregar dados: " + e.message);
      }
      setLoading(false);
    })();
  }, []);

  const CM = useMemo(() => mkCM(cats), [cats]);
  const { provData } = useEngine(fat, prov);

  const res = useMemo(() => cats.map(c => {
    const o = orc[c.id] || 0;
    const pg = fat.filter(f => f.st === "Pago").reduce((s, f) => s + fcv(f, c.id), 0);
    const pr = fat.filter(f => f.st === "Programado").reduce((s, f) => s + fcv(f, c.id), 0);
    let pv = 0;
    prov.filter(p => p.st === "Ativo").forEach(p => {
      const pd = provData[p.id];
      if (pd) pv += (pd.remaining[c.id] || 0);
    });
    const cm = pg + pr + pv;
    return { ...c, o, pg, pr, pv, cm, sl: o - cm, pc: o > 0 ? cm / o : 0 };
  }), [fat, prov, orc, provData, cats]);

  const tot = useMemo(() => {
    const t = res.reduce((a, r) => ({ o: a.o + r.o, pg: a.pg + r.pg, pr: a.pr + r.pr, pv: a.pv + r.pv, cm: a.cm + r.cm, sl: a.sl + r.sl }), { o: 0, pg: 0, pr: 0, pv: 0, cm: 0, sl: 0 });
    t.pc = t.o > 0 ? t.cm / t.o : 0; return t;
  }, [res]);

  const alerts = useMemo(() => {
    const a = [];
    res.forEach(r => { if (r.o > 0 && r.cm > r.o) a.push({ t: "d", m: r.curto + ": estourado (" + pc(r.pc) + ")", catId: r.id }); });
    fat.filter(f => f.st === "Programado" && f.dp && f.dp < TODAY).forEach(f => a.push({ t: "w", m: f.forn + ": vencido " + fd(f.dp), fatId: f.id }));
    return a;
  }, [res, fat]);

  // === Mutation wrappers that persist to Supabase ===
  const saveFat = async (item) => {
    const finalItem = { ...item, id: item.id || uid() };
    setSaving(true);
    try {
      await dbSaveFatura(finalItem);
      if (fat.find(f => f.id === finalItem.id)) {
        setFat(p => p.map(f => f.id === finalItem.id ? finalItem : f));
      } else {
        setFat(p => [...p, finalItem]);
      }
    } catch (e) { alert("Erro ao salvar fatura: " + e.message); }
    setSaving(false);
    setMod(null); setEi(null);
  };

  const delFat = async (id) => {
    setSaving(true);
    try {
      await dbDeleteFatura(id);
      setFat(p => p.filter(f => f.id !== id));
    } catch (e) { alert("Erro ao excluir fatura: " + e.message); }
    setSaving(false);
  };

  const toggleRevFat = async (id) => {
    const f = fat.find(x => x.id === id);
    if (!f) return;
    const updated = { ...f, revisado: f.revisado ? null : new Date().toISOString().slice(0, 10) };
    setSaving(true);
    try {
      await dbSaveFatura(updated);
      setFat(p => p.map(x => x.id === id ? updated : x));
    } catch (e) { alert("Erro: " + e.message); }
    setSaving(false);
  };

  const saveProv = async (item) => {
    const finalItem = { ...item, id: item.id || uid() };
    setSaving(true);
    try {
      await dbSaveProvisao(finalItem);
      if (prov.find(p => p.id === finalItem.id)) {
        setProv(p => p.map(x => x.id === finalItem.id ? finalItem : x));
      } else {
        setProv(p => [...p, finalItem]);
      }
    } catch (e) { alert("Erro ao salvar provisão: " + e.message); }
    setSaving(false);
    setMod(null); setEi(null);
  };

  const delProv = async (id) => {
    setSaving(true);
    try {
      await dbDeleteProvisao(id);
      setProv(p => p.filter(x => x.id !== id));
    } catch (e) { alert("Erro ao excluir provisão: " + e.message); }
    setSaving(false);
  };

  const toggleRevProv = async (id) => {
    const p = prov.find(x => x.id === id);
    if (!p) return;
    const updated = { ...p, revisado: p.revisado ? null : new Date().toISOString().slice(0, 10) };
    setSaving(true);
    try {
      await dbSaveProvisao(updated);
      setProv(prev => prev.map(x => x.id === id ? updated : x));
    } catch (e) { alert("Erro: " + e.message); }
    setSaving(false);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f7fafc" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 36, height: 36, border: "3px solid #e2e8f0", borderTopColor: "#1a365d", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <p style={{ color: "#718096", fontSize: 14 }}>Carregando dados...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }


  const nav = [{ id: "dash", l: "Dashboard", i: "dash" }, { id: "fat", l: "Faturas", i: "rec" }, { id: "prov", l: "Provisões", i: "est" }, { id: "cf", l: "Cashflow", i: "cf" }, { id: "cfg", l: "Configurações", i: "set" }];

  const SB = ({ mobile }) => (<aside style={{ width: mobile ? 260 : 232, background: "linear-gradient(195deg,#1a365d 0%,#0f2440 100%)", position: mobile ? undefined : "fixed", top: 0, left: 0, bottom: 0, padding: "20px 10px", display: "flex", flexDirection: "column", zIndex: 100, height: mobile ? "100%" : undefined }}>
    <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "0 12px", marginBottom: 28 }}><div style={{ width: 34, height: 34, background: "linear-gradient(135deg,#4299e1,#38a169)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}><I n="bd" s={18} /></div><div><div style={{ color: "white", fontWeight: 700, fontSize: 14.5 }}>Obra JMA</div><div style={{ color: "rgba(255,255,255,.45)", fontSize: 10.5 }}>Portal Financeiro</div></div></div>
    <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>{nav.map(n => (<button key={n.id} className={`sl ${pg === n.id ? "ac" : ""}`} onClick={() => { setPg(n.id); if (mobile) setSb(false); }}><I n={n.i} s={17} />{n.l}{n.id === "dash" && alerts.length > 0 && <span style={{ marginLeft: "auto", background: "#e53e3e", color: "white", fontSize: 9.5, fontWeight: 700, borderRadius: 8, padding: "1px 6px" }}>{alerts.length}</span>}</button>))}</nav>
    <div style={{ borderTop: "1px solid rgba(255,255,255,.1)", paddingTop: 12, marginTop: 8 }}>
      <div style={{ padding: "4px 12px", fontSize: 11, color: "rgba(255,255,255,.5)" }}>{session?.user?.email}</div>
      <button className="sl" onClick={onSignOut} style={{ fontSize: 12.5 }}><I n="x" s={15} />Sair</button>
    </div>
  </aside>);

  return (<div style={{ display: "flex", minHeight: "100vh", fontFamily: "'DM Sans',sans-serif", background: "#f0f2f5", color: "#1a202c" }}>
    <style>{CSS}</style>
    <div className="sd"><SB /></div>
    {sb && <div onClick={() => setSb(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 200 }}><div onClick={e => e.stopPropagation()}><SB mobile /></div></div>}
    <main className="mcm" style={{ flex: 1, marginLeft: 232, minHeight: "100vh" }}>
      <header style={{ background: "white", borderBottom: "1px solid #e2e8f0", padding: "10px 20px", display: "flex", alignItems: "center", gap: 10, position: "sticky", top: 0, zIndex: 50 }}>
        <button className="mm bi" onClick={() => setSb(true)}><I n="mn" s={21} /></button>
        <h1 style={{ fontSize: 15, fontWeight: 600, flex: 1 }}>{nav.find(n => n.id === pg)?.l}</h1>
        {saving && <span style={{ fontSize: 11, color: "#718096" }}>Salvando...</span>}
        {alerts.length > 0 && <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#e53e3e", fontSize: 11.5, fontWeight: 600 }}><I n="al" s={15} />{alerts.length}</div>}
      </header>
      <div style={{ padding: 20, maxWidth: 1400 }} className="fi">
        {pg === "dash" && <Dash cats={cats} CM={CM} orc={orc} res={res} tot={tot} alerts={alerts} fat={fat} prov={prov} provData={provData} setPg={setPg} setMod={setMod} setEi={setEi} />}
        {pg === "fat" && <Fats cats={cats} CM={CM} fat={fat} prov={prov} provData={provData} onSave={saveFat} onDel={delFat} onToggleRev={toggleRevFat} setMod={setMod} setEi={setEi} />}
        {pg === "prov" && <Provs cats={cats} CM={CM} prov={prov} fat={fat} provData={provData} onSave={saveProv} onDel={delProv} onToggleRev={toggleRevProv} setMod={setMod} setEi={setEi} />}
        {pg === "cf" && <CF cats={cats} CM={CM} orc={orc} fat={fat} prov={prov} provData={provData} />}
        {pg === "cfg" && <CfgPage cats={cats} setCats={setCats} CM={CM} orc={orc} setOrc={setOrc} fat={fat} prov={prov} provData={provData} res={res} profile={profile} />}
      </div>
    </main>
    {mod === "ff" && <div className="mo" onClick={() => { setMod(null); setEi(null); }}><div className="mc" onClick={e => e.stopPropagation()}><FForm cats={cats} CM={CM} item={ei} prov={prov} provData={provData} fat={fat} onSave={saveFat} onClose={() => { setMod(null); setEi(null); }} /></div></div>}
    {mod === "pf" && <div className="mo" onClick={() => { setMod(null); setEi(null); }}><div className="mc" onClick={e => e.stopPropagation()}><PForm cats={cats} CM={CM} item={ei} onSave={saveProv} onClose={() => { setMod(null); setEi(null); }} /></div></div>}
  </div>);
}

function Dash({ cats, CM, orc, res, tot, alerts, fat, prov, provData, setPg, setMod, setEi }) {
  const CL = ["#3182ce", "#38a169", "#d69e2e", "#e53e3e", "#805ad5", "#dd6b20", "#319795", "#d53f8c", "#2b6cb0", "#48bb78", "#ecc94b", "#fc8181", "#9f7aea", "#ed8936", "#4fd1c5", "#f687b3"];
  const [fCats, setFCats] = useState([]);
  const [drillCat, setDrillCat] = useState(null);
  const toggleCat = (cid) => setFCats(p => p.includes(cid) ? p.filter(x => x !== cid) : [...p, cid]);
  const barRes = fCats.length > 0 ? res.filter(r => fCats.includes(r.id)) : res;
  const bar = barRes.filter(r => r.o > 0).map(r => ({ name: r.curto, "\u004frçado": r.o, "Comprometido": r.cm }));

  const allDonut = res.filter(r => r.cm > 0).sort((a, b) => b.cm - a.cm);
  const totalCm = allDonut.reduce((s, r) => s + r.cm, 0);
  const mainDonut = allDonut.filter(r => totalCm > 0 && r.cm / totalCm >= 0.04);
  const otherDonut = allDonut.filter(r => totalCm <= 0 || r.cm / totalCm < 0.04);
  const othersSum = otherDonut.reduce((s, r) => s + r.cm, 0);
  const donut = mainDonut.map((r, i) => ({ name: r.curto, value: r.cm, color: CL[i % 16] }));
  if (othersSum > 0) donut.push({ name: "Outros", value: othersSum, color: "#a0aec0" });
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload[0]) return null;
    const d = payload[0];
    if (d.name === "Outros" && otherDonut.length > 0) {
      return (<div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", boxShadow: "0 4px 12px rgba(0,0,0,.1)" }}>
        <div style={{ fontWeight: 600, fontSize: 11, marginBottom: 4 }}>Outros — {R$(othersSum)}</div>
        {otherDonut.map((r, i) => <div key={i} style={{ fontSize: 10, display: "flex", justifyContent: "space-between", gap: 12 }}><span>{r.curto}</span><span className="mn">{R$(r.cm)}</span></div>)}
      </div>);
    }
    return (<div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", boxShadow: "0 4px 12px rgba(0,0,0,.1)" }}>
      <div style={{ fontWeight: 600, fontSize: 11 }}>{d.name}: {R$(d.value)}</div>
    </div>);
  };

  const drillData = useMemo(() => {
    if (!drillCat) return null;
    const c = cats.find(x => x.id === drillCat);
    if (!c) return null;
    const catFat = fat.filter(f => f.st !== "Cancelado" && (f.aloc || []).some(a => a.cat === drillCat));
    const byForn = {};
    catFat.forEach(f => {
      const val = fcv(f, drillCat);
      if (!byForn[f.forn]) byForn[f.forn] = { forn: f.forn, pago: 0, prog: 0, prov: 0 };
      if (f.st === "Pago") byForn[f.forn].pago += val;
      else if (f.st === "Programado") byForn[f.forn].prog += val;
    });
    prov.filter(p => p.st === "Ativo").forEach(p => {
      const pd = provData[p.id]; if (!pd) return;
      const rem = pd.remaining[drillCat] || 0; if (rem <= 0) return;
      if (!byForn[p.forn]) byForn[p.forn] = { forn: p.forn, pago: 0, prog: 0, prov: 0 };
      byForn[p.forn].prov += rem;
    });
    return { cat: c, rows: Object.values(byForn).sort((a, b) => (b.pago + b.prog + b.prov) - (a.pago + a.prog + a.prov)) };
  }, [drillCat, fat, prov, provData]);

  return (<div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14, marginBottom: 20 }}>
      {[{ l: "Total Orçado", v: R$k(tot.o), c: "#3182ce" }, { l: "Total Comprometido", v: R$k(tot.cm), c: "#805ad5", s: pc(tot.pc) }, { l: "Total Pago", v: R$k(tot.pg), c: "#38a169" }, { l: "Saldo Livre", v: R$k(tot.sl), c: tot.sl >= 0 ? "#38a169" : "#e53e3e" }].map((c, i) => (
        <div key={i} className="sc" style={{ background: "white", borderRadius: 11, padding: 18, border: "1px solid #e2e8f0" }}><div style={{ fontSize: 11.5, color: "#718096", fontWeight: 500, marginBottom: 3 }}>{c.l}</div><div style={{ fontSize: 20, fontWeight: 700, color: c.c, fontFamily: "'JetBrains Mono',monospace" }}>{c.v}</div>{c.s && <div style={{ fontSize: 10.5, color: "#a0aec0", marginTop: 3 }}>{c.s}</div>}</div>))}
    </div>
    {alerts.length > 0 && <div style={{ background: "white", borderRadius: 11, padding: 14, border: "1px solid #e2e8f0", marginBottom: 20 }}><h3 style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>Alertas ({alerts.length})</h3>{alerts.slice(0, 10).map((a, i) => <div key={i} style={{ padding: "5px 10px", borderRadius: 6, background: a.t === "d" ? "#fff5f5" : "#fffff0", fontSize: 12, marginBottom: 3, display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ flex: 1 }}>{a.t === "d" ? "\uD83D\uDD34" : "\uD83D\uDFE1"} {a.m}</span>
      {a.catId && <button className="bs" style={{ padding: "2px 8px", fontSize: 10 }} onClick={() => setDrillCat(a.catId)}>Ver detalhe</button>}
      {a.fatId && <button className="bs" style={{ padding: "2px 8px", fontSize: 10 }} onClick={() => setPg("fat")}>Ir p/ Faturas</button>}
    </div>)}</div>}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
      <div style={{ background: "white", borderRadius: 11, padding: 18, border: "1px solid #e2e8f0" }}>
        <h3 style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>Orçado vs Comprometido</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 10 }}>
          <button className={fCats.length === 0 ? "bp" : "bs"} style={{ padding: "2px 8px", fontSize: 9.5 }} onClick={() => setFCats([])}>Todas</button>
          {cats.filter(c => (res.find(r => r.id === c.id)?.o || 0) > 0).map(c => { const active = fCats.includes(c.id); return <button key={c.id} className={active ? "bp" : "bs"} style={{ padding: "2px 8px", fontSize: 9.5 }} onClick={() => toggleCat(c.id)}>{c.curto}</button>; })}
        </div>
        <ResponsiveContainer width="100%" height={260}><BarChart data={bar} layout="vertical" margin={{ left: 70 }}><CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" /><XAxis type="number" tickFormatter={v => R$k(v)} style={{ fontSize: 9 }} /><YAxis type="category" dataKey="name" width={70} style={{ fontSize: 9 }} /><Tooltip formatter={v => R$(v)} /><Legend wrapperStyle={{ fontSize: 10 }} /><Bar dataKey="Orçado" fill="#bee3f8" radius={[0, 3, 3, 0]} /><Bar dataKey="Comprometido" fill="#3182ce" radius={[0, 3, 3, 0]} /></BarChart></ResponsiveContainer>
      </div>
      <div style={{ background: "white", borderRadius: 11, padding: 18, border: "1px solid #e2e8f0" }}><h3 style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 14 }}>Comprometido por Categoria</h3><ResponsiveContainer width="100%" height={260}><PieChart><Pie data={donut} cx="50%" cy="50%" innerRadius={55} outerRadius={95} dataKey="value" paddingAngle={2}>{donut.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip content={<CustomTooltip />} /></PieChart></ResponsiveContainer><div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>{donut.map((d, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 9 }}><div style={{ width: 7, height: 7, borderRadius: 2, background: d.color }} />{d.name}</div>)}</div></div>
    </div>
    <div style={{ background: "white", borderRadius: 11, border: "1px solid #e2e8f0", overflow: "auto" }}><div style={{ padding: "14px 18px 0" }}><h3 style={{ fontSize: 12.5, fontWeight: 600 }}>Resumo por Categoria</h3></div><div style={{ overflow: "auto", maxHeight: 400 }}><table><thead><tr><th>Categoria</th><th style={{ textAlign: "right" }}>Orçado</th><th style={{ textAlign: "right" }}>Pago</th><th style={{ textAlign: "right" }}>Program.</th><th style={{ textAlign: "right" }}>Prov. (saldo)</th><th style={{ textAlign: "right" }}>Comprometido</th><th style={{ textAlign: "right" }}>Saldo Livre</th><th style={{ textAlign: "right" }}>%</th></tr></thead><tbody>
      {res.filter(r => r.o > 0 || r.cm > 0).map(r => <tr key={r.id} className="hr"><td style={{ fontWeight: 500, fontSize: 11.5 }}>{r.curto}</td><td className="mn" style={{ textAlign: "right" }}>{R$k(r.o)}</td><td className="mn" style={{ textAlign: "right", color: "#38a169" }}>{R$k(r.pg)}</td><td className="mn" style={{ textAlign: "right", color: "#d69e2e" }}>{R$k(r.pr)}</td><td className="mn" style={{ textAlign: "right", color: "#a0aec0" }}>{R$k(r.pv)}</td><td className="mn" style={{ textAlign: "right", fontWeight: 600 }}>{R$k(r.cm)}</td><td className="mn" style={{ textAlign: "right", color: r.sl < 0 ? "#e53e3e" : "#38a169", fontWeight: 600 }}>{R$k(r.sl)}</td><td style={{ textAlign: "right" }}><div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}><div className="pb" style={{ width: 40 }}><div className="pf" style={{ width: Math.min(r.pc * 100, 100) + "%", background: r.pc > 1 ? "#e53e3e" : "#3182ce" }} /></div><span className="mn" style={{ fontSize: 10, color: r.pc > 1 ? "#e53e3e" : undefined }}>{pc(r.pc)}</span></div></td></tr>)}
      <tr style={{ fontWeight: 700, background: "#f7fafc" }}><td>TOTAL</td><td className="mn" style={{ textAlign: "right" }}>{R$k(tot.o)}</td><td className="mn" style={{ textAlign: "right", color: "#38a169" }}>{R$k(tot.pg)}</td><td className="mn" style={{ textAlign: "right", color: "#d69e2e" }}>{R$k(tot.pr)}</td><td className="mn" style={{ textAlign: "right", color: "#a0aec0" }}>{R$k(tot.pv)}</td><td className="mn" style={{ textAlign: "right" }}>{R$k(tot.cm)}</td><td className="mn" style={{ textAlign: "right", color: tot.sl < 0 ? "#e53e3e" : "#38a169" }}>{R$k(tot.sl)}</td><td className="mn" style={{ textAlign: "right" }}>{pc(tot.pc)}</td></tr>
    </tbody></table></div></div>
    {drillData && <div className="mo" onClick={() => setDrillCat(null)}><div className="mc" style={{ maxWidth: 650 }} onClick={e => e.stopPropagation()}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}><h2 style={{ fontSize: 15, fontWeight: 600 }}>{drillData.cat.nome} — Detalhe por Fornecedor</h2><button className="bi" onClick={() => setDrillCat(null)}><I n="x" s={19} /></button></div>
      <div style={{ padding: "14px 20px", maxHeight: "60vh", overflowY: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
          <div style={{ background: "#f0fff4", borderRadius: 8, padding: 10, textAlign: "center" }}><div style={{ fontSize: 10, color: "#718096" }}>Orçado</div><div className="mn" style={{ fontSize: 16, fontWeight: 700, color: "#3182ce" }}>{R$(orc[drillData.cat.id] || 0)}</div></div>
          <div style={{ background: "#fff5f5", borderRadius: 8, padding: 10, textAlign: "center" }}><div style={{ fontSize: 10, color: "#718096" }}>Comprometido</div><div className="mn" style={{ fontSize: 16, fontWeight: 700, color: "#805ad5" }}>{R$(drillData.rows.reduce((s, r) => s + r.pago + r.prog + r.prov, 0))}</div></div>
          <div style={{ background: (res.find(r => r.id === drillCat) || {}).sl < 0 ? "#fff5f5" : "#f0fff4", borderRadius: 8, padding: 10, textAlign: "center" }}><div style={{ fontSize: 10, color: "#718096" }}>Saldo</div><div className="mn" style={{ fontSize: 16, fontWeight: 700, color: (res.find(r => r.id === drillCat) || {}).sl < 0 ? "#e53e3e" : "#38a169" }}>{R$((res.find(r => r.id === drillCat) || {}).sl || 0)}</div></div>
        </div>
        <table><thead><tr><th>Fornecedor</th><th style={{ textAlign: "right" }}>Pago</th><th style={{ textAlign: "right" }}>Programado</th><th style={{ textAlign: "right" }}>Provisionado</th><th style={{ textAlign: "right" }}>Total</th></tr></thead>
          <tbody>{drillData.rows.map((r, i) => <tr key={i} className="hr"><td style={{ fontWeight: 500, fontSize: 12 }}>{r.forn}</td><td className="mn" style={{ textAlign: "right", color: "#38a169" }}>{r.pago > 0 ? R$(r.pago) : "—"}</td><td className="mn" style={{ textAlign: "right", color: "#d69e2e" }}>{r.prog > 0 ? R$(r.prog) : "—"}</td><td className="mn" style={{ textAlign: "right", color: "#a0aec0" }}>{r.prov > 0 ? R$(r.prov) : "—"}</td><td className="mn" style={{ textAlign: "right", fontWeight: 600 }}>{R$(r.pago + r.prog + r.prov)}</td></tr>)}
            <tr style={{ fontWeight: 700, background: "#f7fafc" }}><td>TOTAL</td><td className="mn" style={{ textAlign: "right", color: "#38a169" }}>{R$(drillData.rows.reduce((s, r) => s + r.pago, 0))}</td><td className="mn" style={{ textAlign: "right", color: "#d69e2e" }}>{R$(drillData.rows.reduce((s, r) => s + r.prog, 0))}</td><td className="mn" style={{ textAlign: "right", color: "#a0aec0" }}>{R$(drillData.rows.reduce((s, r) => s + r.prov, 0))}</td><td className="mn" style={{ textAlign: "right" }}>{R$(drillData.rows.reduce((s, r) => s + r.pago + r.prog + r.prov, 0))}</td></tr>
          </tbody></table>
      </div>
    </div></div>}
  </div>);
}
function Fats({ cats, CM, fat, prov, provData, onSave, onDel, onToggleRev, setMod, setEi }) {
  const [fs, setFs] = useState("all"); const [fc, setFc] = useState("all"); const [q, setQ] = useState("");
  const [sortCol, setSortCol] = useState("dp"); const [sortDir, setSortDir] = useState(-1);
  const toggleSort = (col) => { if (sortCol === col) setSortDir(d => d * -1); else { setSortCol(col); setSortDir(col === "vf" ? -1 : 1); } };
  const SH = ({ col, children, style }) => <th style={{ cursor: "pointer", userSelect: "none", ...style }} onClick={() => toggleSort(col)}>{children}{sortCol === col ? (sortDir > 0 ? " ▲" : " ▼") : ""}</th>;
  const PM = Object.fromEntries(prov.map(p => [p.id, p]));
  const fl = fat.filter(f => (fs === "all" || f.st === fs) && (fc === "all" || (f.aloc || []).some(a => a.cat === fc)) && (!q || f.forn.toLowerCase().includes(q.toLowerCase()) || (f.desc || "").toLowerCase().includes(q.toLowerCase()))).sort((a, b) => {
    let va, vb;
    if (sortCol === "forn") { va = a.forn; vb = b.forn; }
    else if (sortCol === "vf") { va = a.vf; vb = b.vf; }
    else if (sortCol === "st") { va = a.st; vb = b.st; }
    else if (sortCol === "dp") { va = a.dp || ""; vb = b.dp || ""; }
    else if (sortCol === "desc") { va = a.desc || ""; vb = b.desc || ""; }
    else { va = a.dp || ""; vb = b.dp || ""; }
    if (va < vb) return -1 * sortDir; if (va > vb) return 1 * sortDir; return 0;
  });
  const fatTotals = useMemo(() => ({ n: fat.length, v: fat.reduce((s, f) => s + f.vf, 0) }), [fat]);
  const od = (f) => f.st === "Programado" && f.dp && f.dp < TODAY;
  return (<div>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
      <div style={{ position: "relative", flex: "1 1 180px", maxWidth: 260 }}><input className="inp" placeholder="Buscar..." value={q} onChange={e => setQ(e.target.value)} style={{ paddingLeft: 30 }} /><span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#a0aec0" }}><I n="sr" s={14} /></span></div>
      <select className="inp" style={{ width: "auto", minWidth: 120 }} value={fs} onChange={e => setFs(e.target.value)}><option value="all">Todos</option><option value="Pago">Pago</option><option value="Programado">Programado</option></select>
      <select className="inp" style={{ width: "auto", minWidth: 140 }} value={fc} onChange={e => setFc(e.target.value)}><option value="all">Todas Cat.</option>{cats.map(c => <option key={c.id} value={c.id}>{c.curto}</option>)}</select>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}><span className="mn" style={{ color: "#718096", fontSize: 11 }}>{fatTotals.n} · {R$(fatTotals.v)}</span><button className="bp" onClick={() => { setEi(null); setMod("ff"); }}><I n="pl" s={15} />Nova</button></div>
    </div>
    <div style={{ background: "white", borderRadius: 11, border: "1px solid #e2e8f0", overflow: "auto" }}>
      <table><thead><tr><th style={{ width: 20 }}></th><th style={{ width: 36 }}>Rev.</th><SH col="forn">Fornecedor</SH><SH col="desc">Descrição</SH><th>Alocações</th><SH col="vf" style={{ textAlign: "right" }}>Total</SH><SH col="st">Status</SH><SH col="dp">Data</SH><th>Provisão</th><th>Links</th><th style={{ width: 55 }}></th></tr></thead>
        <tbody>{fl.map(f => <tr key={f.id} className="hr" style={{ background: od(f) ? "#fffff0" : undefined }}>
          <td>{od(f) && "⚠️"}</td>
          <td style={{ textAlign: "center" }}><label style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title={f.revisado ? `Revisado em ${fd(f.revisado)}` : "Não revisado"}><input type="checkbox" checked={!!f.revisado} onChange={() => onToggleRev(f.id)} style={{ accentColor: "#38a169", width: 15, height: 15, cursor: "pointer" }} /></label>{f.revisado && <div style={{ fontSize: 8, color: "#38a169", textAlign: "center", marginTop: 1 }}>{fd(f.revisado)}</div>}</td>
          <td style={{ fontWeight: 500, maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.forn}</td>
          <td style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#4a5568", fontSize: 11.5 }}>{f.desc || "—"}</td>
          <td><div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>{(f.aloc || []).map((a, i) => <span key={i} style={{ fontSize: 9, background: "#edf2f7", padding: "1px 5px", borderRadius: 3, whiteSpace: "nowrap" }}>{CM[a.cat]?.curto} {R$(a.valor)}</span>)}</div></td>
          <td className="mn" style={{ textAlign: "right", fontWeight: 600 }}>{R$(f.vf)}</td>
          <td><span className={`bdg bdg-${f.st.toLowerCase()}`}>{f.st}</span></td>
          <td style={{ fontSize: 11 }}>{fd(f.st === "Pago" ? f.de : f.dp)}</td>
          <td>{(f.prov_ids || []).length > 0 ? <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>{(f.prov_ids || []).map(pid => { const p = PM[pid]; return p ? <span key={pid} style={{ fontSize: 9, background: "#e9d8fd", padding: "1px 5px", borderRadius: 3, color: "#553c9a" }}>{p.forn}</span> : null; })}</div> : <span style={{ color: "#cbd5e0", fontSize: 10 }}>—</span>}</td>
          <td><div style={{ display: "flex", gap: 2 }}>{f.link_nf && <a href={f.link_nf} target="_blank" className="lk">NF</a>}{f.link_comp && <a href={f.link_comp} target="_blank" className="lk">Cp</a>}{f.link_contrato && <a href={f.link_contrato} target="_blank" className="lk">Ct</a>}</div></td>
          <td><div style={{ display: "flex", gap: 1 }}><button className="bi" onClick={() => { setEi(f); setMod("ff"); }}><I n="ed" s={13} /></button><button className="bi" onClick={() => { if (confirm("Excluir?")) onDel(f.id); }}><I n="tr" s={13} /></button></div></td>
        </tr>)}</tbody></table>
    </div>
  </div>);
}

/* ═══ FATURA FORM ═══ */
const Lb = ({ l, ch }) => <div><label style={{ fontSize: 11, fontWeight: 500, color: "#4a5568", marginBottom: 2, display: "block" }}>{l}</label>{ch}</div>;

function FForm({ cats, CM, item, prov, provData, fat, onSave, onClose }) {
  const blank = { forn: "", desc: "", ndoc: "", vc: "", vf: "", st: "Programado", dp: "", de: "", aloc: [{ cat: "c01", valor: "" }], obs: "", link_nf: "", link_comp: "", link_contrato: "", prov_ids: [] };
  const [f, sF] = useState(item || blank);
  const [er, sE] = useState({});
  const s = (k, v) => sF(p => ({ ...p, [k]: v }));
  const setA = (i, k, v) => sF(p => { const a = [...(p.aloc || [])]; a[i] = { ...a[i], [k]: v }; return { ...p, aloc: a }; });
  const addA = () => sF(p => ({ ...p, aloc: [...(p.aloc || []), { cat: "c01", valor: "" }] }));
  const rmA = (i) => sF(p => ({ ...p, aloc: (p.aloc || []).filter((_, j) => j !== i) }));
  const aT = (f.aloc || []).reduce((s, a) => s + (Number(a.valor) || 0), 0);
  const vf = Number(f.vf) || 0;
  const diff = vf - aT;
  const activeProv = prov.filter(p => p.st === "Ativo");
  const toggleProv = (pid) => sF(p => { const ids = [...(p.prov_ids || [])]; const idx = ids.indexOf(pid); if (idx >= 0) ids.splice(idx, 1); else ids.push(pid); return { ...p, prov_ids: ids }; });
  const validate = () => { const e = {}; if (!f.forn) e.forn = "!"; if (!f.vf || vf <= 0) e.vf = "!"; if (f.st === "Pago" && !f.de) e.de = "!"; if (Math.abs(diff) > 0.01 && vf > 0) e.aloc = "Soma ≠ valor"; sE(e); return !Object.keys(e).length; };
  const fns = [...new Set(fat.map(f => f.forn))].sort();
  return (<div>
    <div style={{ padding: "14px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}><h2 style={{ fontSize: 15, fontWeight: 600 }}>{item?.id ? "Editar" : "Nova"} Fatura</h2><button className="bi" onClick={onClose}><I n="x" s={19} /></button></div>
    <div style={{ padding: "14px 20px", display: "flex", flexDirection: "column", gap: 12, maxHeight: "70vh", overflowY: "auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Lb l="Fornecedor *" ch={<><input className="inp" list="fl" value={f.forn} onChange={e => s("forn", e.target.value)} /><datalist id="fl">{fns.map(x => <option key={x} value={x} />)}</datalist></>} />
        <Lb l="Status" ch={<select className="inp" value={f.st} onChange={e => s("st", e.target.value)}><option value="Programado">Programado</option><option value="Pago">Pago</option><option value="Cancelado">Cancelado</option></select>} />
      </div>
      <Lb l="Descrição" ch={<input className="inp" value={f.desc} onChange={e => s("desc", e.target.value)} />} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <Lb l="Nº Doc" ch={<input className="inp" value={f.ndoc} onChange={e => s("ndoc", e.target.value)} />} />
        <Lb l="Valor Contrato" ch={<MoneyInput value={f.vc || ""} onChange={v => s("vc", v)} />} />
        <Lb l="Valor Fatura *" ch={<MoneyInput value={f.vf} onChange={v => s("vf", v)} style={{ borderColor: er.vf ? "#e53e3e" : undefined }} />} />
      </div>
      {/* ALLOCATION */}
      <div style={{ background: "#f7fafc", borderRadius: 9, padding: 12, border: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}><label style={{ fontSize: 12, fontWeight: 600 }}>Alocação por Categoria</label><button className="bs" style={{ padding: "3px 8px", fontSize: 10.5 }} onClick={addA}><I n="pl" s={12} />Add</button></div>
        {(f.aloc || []).map((a, i) => (<div key={i} className="ar"><select className="inp" style={{ width: 170, flex: "none" }} value={a.cat} onChange={e => setA(i, "cat", e.target.value)}>{cats.map(c => <option key={c.id} value={c.id}>{c.curto}</option>)}</select><div style={{ position: "relative", flex: 1 }}><span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: "#a0aec0" }}>R$</span><MoneyInput value={a.valor} onChange={v => setA(i, "valor", v)} style={{ paddingLeft: 26 }} /></div>{(f.aloc || []).length > 1 && <button className="bi" onClick={() => rmA(i)} style={{ color: "#e53e3e" }}><I n="x" s={12} /></button>}</div>))}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: 11, fontWeight: 600 }}><span>Alocado: <span className="mn">{R$(aT)}</span></span>{vf > 0 && Math.abs(diff) > 0.01 ? <span style={{ color: "#e53e3e" }}>Diff: {R$(diff)}</span> : vf > 0 ? <span style={{ color: "#38a169" }}>✓ OK</span> : null}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Lb l="Data Prevista" ch={<input className="inp" type="date" value={f.dp || ""} onChange={e => s("dp", e.target.value)} />} />
        <Lb l={`Data Pgto ${f.st === "Pago" ? "*" : ""}`} ch={<input className="inp" type="date" value={f.de || ""} onChange={e => s("de", e.target.value)} style={{ borderColor: er.de ? "#e53e3e" : undefined }} />} />
      </div>
      <Lb l="Observação" ch={<textarea className="inp" rows={2} value={f.obs} onChange={e => s("obs", e.target.value)} />} />
      {/* PROVISION LINK — single select */}
      {activeProv.length > 0 && <div style={{ background: "#faf5ff", borderRadius: 9, padding: 12, border: "1px solid #e9d8fd" }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#553c9a", marginBottom: 6, display: "block" }}>🔗 Vincular a Provisão (única)</label>
        <select className="inp" value={(f.prov_ids || [])[0] || ""} onChange={e => s("prov_ids", e.target.value ? [e.target.value] : [])}>
          <option value="">Nenhuma</option>
          {activeProv.map(p => { const pd = provData[p.id]; const rem = pd ? pd.totalRemaining : p.ve; return (
            <option key={p.id} value={p.id}>{p.forn} — {p.desc} (Saldo: {R$(rem)})</option>
          ); })}
        </select>
      </div>}
      {/* LINKS */}
      <div style={{ background: "#f7fafc", borderRadius: 9, padding: 12, border: "1px solid #e2e8f0" }}>
        <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, display: "block" }}>Links Google Drive</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <div><label style={{ fontSize: 10, color: "#718096" }}>NF/Boleto/Doc</label><input className="inp" value={f.link_nf || ""} onChange={e => s("link_nf", e.target.value)} placeholder="URL" /></div>
          <div><label style={{ fontSize: 10, color: "#718096" }}>Comprovante</label><input className="inp" value={f.link_comp || ""} onChange={e => s("link_comp", e.target.value)} placeholder="URL" /></div>
          <div><label style={{ fontSize: 10, color: "#718096" }}>Contrato</label><input className="inp" value={f.link_contrato || ""} onChange={e => s("link_contrato", e.target.value)} placeholder="URL" /></div>
        </div>
      </div>
    </div>
    <div style={{ padding: "12px 20px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: 7 }}>
      <button className="bs" onClick={onClose}>Cancelar</button>
      <button className="bp" onClick={() => { if (validate()) onSave({ ...f, vf: Number(f.vf), vc: f.vc ? Number(f.vc) : null, aloc: (f.aloc || []).map(a => ({ ...a, valor: Number(a.valor) || 0 })).filter(a => a.valor > 0) }); }}><I n="ck" s={15} />Salvar</button>
    </div>
  </div>);
}

/* ═══ PROVISÕES LIST ═══ */
function Provs({ cats, CM, prov, fat, provData, onSave, onDel, onToggleRev, setMod, setEi }) {
  const [fs, setFs] = useState("all");
  const [fCat, setFCat] = useState("all");
  const [sortCol, setSortCol] = useState("forn"); const [sortDir, setSortDir] = useState(1);
  const toggleSort = (col) => { if (sortCol === col) setSortDir(d => d * -1); else { setSortCol(col); setSortDir(col === "ve" ? -1 : 1); } };
  const SH = ({ col, children, style }) => <th style={{ cursor: "pointer", userSelect: "none", ...style }} onClick={() => toggleSort(col)}>{children}{sortCol === col ? (sortDir > 0 ? " ▲" : " ▼") : ""}</th>;
  const fl = prov.filter(p => (fs === "all" || p.st === fs) && (fCat === "all" || (p.aloc || []).some(a => a.cat === fCat))).sort((a, b) => {
    let va, vb;
    if (sortCol === "forn") { va = a.forn; vb = b.forn; }
    else if (sortCol === "ve") { va = a.ve; vb = b.ve; }
    else if (sortCol === "saldo") { const pa = provData[a.id]; const pb = provData[b.id]; va = pa ? pa.totalRemaining : a.ve; vb = pb ? pb.totalRemaining : b.ve; }
    else if (sortCol === "faturado") { const pa = provData[a.id]; const pb = provData[b.id]; va = pa ? pa.totalConsumed : 0; vb = pb ? pb.totalConsumed : 0; }
    else { va = a.forn; vb = b.forn; }
    if (va < vb) return -1 * sortDir; if (va > vb) return 1 * sortDir; return 0;
  });
  const provFat = {};
  fat.forEach(f => (f.prov_ids || []).forEach(pid => { if (!provFat[pid]) provFat[pid] = []; provFat[pid].push(f); }));
  return (<div>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
      <select className="inp" style={{ width: "auto", minWidth: 120 }} value={fs} onChange={e => setFs(e.target.value)}><option value="all">Todos</option><option value="Ativo">Ativo</option><option value="Cancelado">Cancelado</option></select>
      <select className="inp" style={{ width: "auto", minWidth: 140 }} value={fCat} onChange={e => setFCat(e.target.value)}><option value="all">Todas Cat.</option>{cats.map(c => <option key={c.id} value={c.id}>{c.curto}</option>)}</select>
      <span className="mn" style={{ color: "#718096", fontSize: 11 }}>{fl.length} provisões · {R$(fl.reduce((s, p) => s + p.ve, 0))}</span>
      <button className="bp" style={{ marginLeft: "auto" }} onClick={() => { setEi(null); setMod("pf"); }}><I n="pl" s={15} />Nova</button>
    </div>
    <div style={{ background: "white", borderRadius: 11, border: "1px solid #e2e8f0", overflow: "auto" }}>
      <table><thead><tr><th style={{ width: 36 }}>Rev.</th><SH col="forn">Fornecedor</SH><th>Descrição</th><th>Alocações</th><SH col="ve" style={{ textAlign: "right" }}>Valor Total</SH><SH col="faturado" style={{ textAlign: "right" }}>Faturado</SH><SH col="saldo" style={{ textAlign: "right" }}>Saldo</SH><th>Diluição</th><th>Faturas Vinc.</th><th>Doc</th><th style={{ width: 55 }}></th></tr></thead>
        <tbody>{fl.map(p => { const pd = provData[p.id]; const cons = pd ? pd.totalConsumed : 0; const rem = pd ? pd.totalRemaining : p.ve; const lf = provFat[p.id] || [];
          return (<tr key={p.id} className="hr">
            <td style={{ textAlign: "center" }}><label style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title={p.revisado ? `Revisado em ${fd(p.revisado)}` : "Não revisado"}><input type="checkbox" checked={!!p.revisado} onChange={() => onToggleRev(p.id)} style={{ accentColor: "#38a169", width: 15, height: 15, cursor: "pointer" }} /></label>{p.revisado && <div style={{ fontSize: 8, color: "#38a169", textAlign: "center", marginTop: 1 }}>{fd(p.revisado)}</div>}</td>
            <td style={{ fontWeight: 500 }}>{p.forn}</td>
            <td style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12 }}>{p.desc}</td>
            <td><div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>{(p.aloc || []).map((a, i) => <span key={i} style={{ fontSize: 9, background: "#edf2f7", padding: "1px 5px", borderRadius: 3 }}>{CM[a.cat]?.curto} {R$(a.valor)}</span>)}</div></td>
            <td className="mn" style={{ textAlign: "right", fontWeight: 600 }}>{R$(p.ve)}</td>
            <td className="mn" style={{ textAlign: "right", color: cons > 0 ? "#805ad5" : "#cbd5e0" }}>{cons > 0 ? R$(cons) : "—"}</td>
            <td className="mn" style={{ textAlign: "right", color: "#38a169", fontWeight: 600 }}>{R$(rem)}</td>
            <td style={{ fontSize: 10.5 }}><span className="bdg bdg-ativo">{p.diluicao === "custom" ? "Custom %" : "Flat"}</span><div style={{ fontSize: 9.5, color: "#718096", marginTop: 2 }}>{ymL(p.flat_inicio)} → {ymL(p.flat_fim)}</div></td>
            <td>{lf.length > 0 ? <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>{lf.slice(0, 3).map(f => <span key={f.id} style={{ fontSize: 9, background: "#c6f6d5", padding: "1px 4px", borderRadius: 3, color: "#22543d" }}>{f.forn} {R$(f.vf)}</span>)}{lf.length > 3 && <span style={{ fontSize: 9, color: "#718096" }}>+{lf.length - 3}</span>}</div> : <span style={{ color: "#cbd5e0", fontSize: 10 }}>—</span>}</td>
            <td>{p.link_doc && <a href={p.link_doc} target="_blank" className="lk"><I n="lk" s={10} />Doc</a>}</td>
            <td><div style={{ display: "flex", gap: 1 }}><button className="bi" onClick={() => { setEi(p); setMod("pf"); }}><I n="ed" s={13} /></button><button className="bi" onClick={() => { if (confirm("Excluir?")) onDel(p.id); }}><I n="tr" s={13} /></button></div></td>
          </tr>);
        })}</tbody></table>
    </div>
  </div>);
}

/* ═══ PROVISÃO FORM (with multi-cat, dilution settings, doc link) ═══ */
function PForm({ cats, CM, item, onSave, onClose }) {
  const [f, sF] = useState(item || { forn: "", desc: "", ve: "", st: "Ativo", aloc: [{ cat: "c01", valor: "" }], link_doc: "", diluicao: "flat", flat_inicio: "2026-03", flat_fim: "2026-06", custom_meses: [] });
  const s = (k, v) => sF(p => ({ ...p, [k]: v }));
  const setA = (i, k, v) => sF(p => { const a = [...(p.aloc || [])]; a[i] = { ...a[i], [k]: v }; return { ...p, aloc: a }; });
  const addA = () => sF(p => ({ ...p, aloc: [...(p.aloc || []), { cat: "c01", valor: "" }] }));
  const rmA = (i) => sF(p => ({ ...p, aloc: (p.aloc || []).filter((_, j) => j !== i) }));
  const aT = (f.aloc || []).reduce((s, a) => s + (Number(a.valor) || 0), 0);
  const autoVe = () => sF(p => ({ ...p, ve: String(aT) }));
  // Custom months
  const meses = genYMs(f.flat_inicio, f.flat_fim);
  const setCM = (ym, pct) => sF(p => { let cm = [...(p.custom_meses || [])]; const idx = cm.findIndex(m => m.ym === ym); if (idx >= 0) cm[idx] = { ym, pct: Number(pct) }; else cm.push({ ym, pct: Number(pct) }); return { ...p, custom_meses: cm }; });
  const cmTotal = (f.custom_meses || []).reduce((s, m) => s + m.pct, 0);

  return (<div>
    <div style={{ padding: "14px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}><h2 style={{ fontSize: 15, fontWeight: 600 }}>{item?.id ? "Editar" : "Nova"} Provisão</h2><button className="bi" onClick={onClose}><I n="x" s={19} /></button></div>
    <div style={{ padding: "14px 20px", display: "flex", flexDirection: "column", gap: 12, maxHeight: "70vh", overflowY: "auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Lb l="Fornecedor" ch={<input className="inp" value={f.forn} onChange={e => s("forn", e.target.value)} />} />
        <Lb l="Status" ch={<select className="inp" value={f.st} onChange={e => s("st", e.target.value)}><option value="Ativo">Ativo</option><option value="Cancelado">Cancelado</option></select>} />
      </div>
      <Lb l="Descrição" ch={<input className="inp" value={f.desc} onChange={e => s("desc", e.target.value)} />} />
      {/* ALLOCATION */}
      <div style={{ background: "#f0f7ff", borderRadius: 9, padding: 12, border: "1px solid #bee3f8" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}><label style={{ fontSize: 12, fontWeight: 600, color: "#2a4365" }}>Alocação por Categoria</label><button className="bs" style={{ padding: "3px 8px", fontSize: 10.5 }} onClick={addA}><I n="pl" s={12} />Add</button></div>
        {(f.aloc || []).map((a, i) => (<div key={i} className="ar"><select className="inp" style={{ width: 170, flex: "none" }} value={a.cat} onChange={e => setA(i, "cat", e.target.value)}>{cats.map(c => <option key={c.id} value={c.id}>{c.curto}</option>)}</select><div style={{ position: "relative", flex: 1 }}><span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: "#a0aec0" }}>R$</span><MoneyInput value={a.valor} onChange={v => setA(i, "valor", v)} style={{ paddingLeft: 26 }} /></div>{(f.aloc || []).length > 1 && <button className="bi" onClick={() => rmA(i)} style={{ color: "#e53e3e" }}><I n="x" s={12} /></button>}</div>))}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 5, fontSize: 11, fontWeight: 600 }}><span>Total: <span className="mn">{R$(aT)}</span></span><button className="bs" style={{ padding: "2px 7px", fontSize: 10 }} onClick={autoVe}>→ Usar como Valor Total</button></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Lb l="Valor Total (R$)" ch={<MoneyInput value={f.ve} onChange={v => s("ve", v)} />} />
        <Lb l="Link documento suporte" ch={<input className="inp" value={f.link_doc || ""} onChange={e => s("link_doc", e.target.value)} placeholder="URL do Drive" />} />
      </div>
      {/* DILUTION */}
      <div style={{ background: "#fffbeb", borderRadius: 9, padding: 12, border: "1px solid #fefcbf" }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#744210", marginBottom: 8, display: "block" }}>📊 Diluição no Cashflow</label>
        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, cursor: "pointer" }}><input type="radio" checked={f.diluicao === "flat"} onChange={() => s("diluicao", "flat")} /> Flat (uniforme)</label>
          <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, cursor: "pointer" }}><input type="radio" checked={f.diluicao === "custom"} onChange={() => s("diluicao", "custom")} /> Custom (% por mês)</label>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 }}>
          <Lb l="Mês início" ch={<input className="inp" type="month" value={f.flat_inicio || ""} onChange={e => s("flat_inicio", e.target.value)} />} />
          <Lb l="Mês fim" ch={<input className="inp" type="month" value={f.flat_fim || ""} onChange={e => s("flat_fim", e.target.value)} />} />
        </div>
        {f.diluicao === "custom" && meses.length > 0 && <div>
          <div style={{ fontSize: 10.5, color: "#718096", marginBottom: 5 }}>Defina a % de cada mês (total deve = 100%)</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(100px,1fr))", gap: 5 }}>
            {meses.map(m => { const cm = (f.custom_meses || []).find(x => x.ym === m); return (<div key={m}><label style={{ fontSize: 10, color: "#718096" }}>{ymL(m)}</label><div style={{ display: "flex", alignItems: "center", gap: 3 }}><input className="inp" type="number" style={{ textAlign: "right" }} value={cm ? cm.pct : ""} onChange={e => setCM(m, e.target.value)} placeholder="0" /><span style={{ fontSize: 10.5 }}>%</span></div></div>); })}
          </div>
          <div style={{ marginTop: 5, fontSize: 11, fontWeight: 600, color: Math.abs(cmTotal - 100) > 0.1 ? "#e53e3e" : "#38a169" }}>Total: {cmTotal}% {Math.abs(cmTotal - 100) <= 0.1 ? "✓" : `(faltam ${(100 - cmTotal).toFixed(1)}%)`}</div>
        </div>}
        {f.diluicao === "flat" && meses.length > 0 && <div style={{ fontSize: 10.5, color: "#718096" }}>Saldo restante será dividido em {meses.length} meses iguais ({ymL(meses[0])} a {ymL(meses[meses.length - 1])})</div>}
      </div>
    </div>
    <div style={{ padding: "12px 20px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: 7 }}>
      <button className="bs" onClick={onClose}>Cancelar</button>
      <button className="bp" onClick={() => onSave({ ...f, ve: Number(f.ve) || aT, aloc: (f.aloc || []).map(a => ({ ...a, valor: Number(a.valor) || 0 })).filter(a => a.valor > 0) })}><I n="ck" s={15} />Salvar</button>
    </div>
  </div>);
}

/* ═══ CASHFLOW ═══
   Logic: Pago by de date, Programado by dp date, Provisionado = remaining saldo diluted */
function CF({ cats, CM, orc, fat, prov, provData }) {
  const months = useMemo(() => {
    const ms = new Set();
    fat.forEach(f => { if (f.st === "Pago" && f.de) ms.add(toYM(f.de)); if (f.st === "Programado" && f.dp) ms.add(toYM(f.dp)); });
    prov.filter(p => p.st === "Ativo").forEach(p => { genYMs(p.flat_inicio, p.flat_fim).forEach(m => ms.add(m)); });
    return [...ms].filter(Boolean).sort();
  }, [fat, prov]);

  /* detail maps: detailKey(section, catId, month) -> [{forn, valor}] */
  const details = React.useRef({});
  const dk = (sec, cat, m) => sec + "|" + cat + "|" + m;
  const addDetail = (sec, cat, m, forn, valor) => { const k = dk(sec, cat, m); if (!details.current[k]) details.current[k] = []; details.current[k].push({ forn, valor }); };

  const bldFat = (status, df, sec) => {
    const r = {}; cats.forEach(c => { r[c.id] = { cat: c.curto, catId: c.id, sec, t: 0 }; months.forEach(m => { r[c.id][m] = 0; }); });
    fat.filter(f => f.st === status).forEach(f => { const d = f[df]; if (!d) return; const m = toYM(d); if (!m || !months.includes(m)) return; (f.aloc || []).forEach(a => { if (r[a.cat]) { r[a.cat][m] += a.valor; r[a.cat].t += a.valor; addDetail(sec, a.cat, m, f.forn, a.valor); } }); });
    return Object.values(r).filter(x => x.t > 0);
  };

  // Provision dilution: remaining saldo per category, distributed by flat/custom
  const bldProv = () => {
    const r = {}; cats.forEach(c => { r[c.id] = { cat: c.curto, catId: c.id, t: 0 }; months.forEach(m => { r[c.id][m] = 0; }); });
    const curYM = toYM(TODAY);
    prov.filter(p => p.st === "Ativo").forEach(p => {
      const pd = provData[p.id]; if (!pd) return;
      const meses = genYMs(p.flat_inicio, p.flat_fim).filter(m => months.includes(m));
      if (meses.length === 0) return;
      const futureMeses = meses.filter(m => m >= curYM);
      if (futureMeses.length === 0) return;
      (p.aloc || []).forEach(a => {
        const rem = pd.remaining[a.cat] || 0; if (rem <= 0) return;
        if (p.diluicao === "custom" && (p.custom_meses || []).length > 0) {
          const futureCustom = (p.custom_meses || []).filter(cm => cm.ym >= curYM && months.includes(cm.ym));
          const totalPct = futureCustom.reduce((s, cm) => s + cm.pct, 0);
          futureCustom.forEach(cm => { if (r[a.cat]) { const v = totalPct > 0 ? rem * cm.pct / totalPct : 0; r[a.cat][cm.ym] += v; r[a.cat].t += v; addDetail("pv", a.cat, cm.ym, p.forn, v); } });
        } else {
          const perMonth = rem / futureMeses.length;
          futureMeses.forEach(m => { if (r[a.cat]) { r[a.cat][m] += perMonth; r[a.cat].t += perMonth; addDetail("pv", a.cat, m, p.forn, perMonth); } });
        }
      });
    });
    return Object.values(r).filter(x => x.t > 0);
  };

  const pR = useMemo(() => { details.current = {}; return bldFat("Pago", "de", "pg"); }, [fat, months]);
  const prR = useMemo(() => bldFat("Programado", "dp", "pr"), [fat, months]);
  const pvR = useMemo(() => bldProv(), [prov, provData, months]);
  const sub = (rows) => { const r = { cat: "Sub", t: 0 }; months.forEach(m => { r[m] = rows.reduce((s, x) => s + (x[m] || 0), 0); r.t += r[m]; }); return r; };
  const pS = sub(pR), prS = sub(prR), pvS = sub(pvR);
  const cd = months.map(m => ({ name: ymL(m), Pago: pS[m] || 0, Programado: prS[m] || 0, Provisionado: pvS[m] || 0 }));

  const [tip, setTip] = useState(null);
  const CellTip = ({ sec, catId, m, children, style: st }) => {
    const items = (details.current[dk(sec, catId, m)] || []);
    if (items.length === 0) return <td className="mn" style={st}>{children}</td>;
    const agg = {}; items.forEach(x => { agg[x.forn] = (agg[x.forn] || 0) + x.valor; });
    const list = Object.entries(agg).sort((a, b) => b[1] - a[1]);
    return (<td className="mn" style={{ ...st, cursor: "default", position: "relative" }}
      onMouseEnter={e => { const rect = e.currentTarget.getBoundingClientRect(); setTip({ x: rect.left + rect.width / 2, y: rect.top, list }); }}
      onMouseLeave={() => setTip(null)}>{children}</td>);
  };

  const BT = ({ title, rows, s: sb, color }) => (<div style={{ marginBottom: 18 }}>
    <h3 style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: color }} />{title}</h3>
    <div style={{ overflow: "auto" }}><table><thead><tr><th style={{ minWidth: 95 }}>Categoria</th>{months.map(m => <th key={m} style={{ textAlign: "right", minWidth: 85 }}>{ymL(m)}</th>)}<th style={{ textAlign: "right", minWidth: 90 }}>Total</th></tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i} className="hr"><td style={{ fontSize: 11, fontWeight: 500 }}>{r.cat}</td>{months.map(m => <CellTip key={m} sec={r.sec} catId={r.catId} m={m} style={{ textAlign: "right", color: r[m] > 0 ? undefined : "#cbd5e0" }}>{r[m] > 0 ? R$(r[m]) : "—"}</CellTip>)}<td className="mn" style={{ textAlign: "right", fontWeight: 600 }}>{R$(r.t)}</td></tr>)}
        <tr style={{ fontWeight: 700, background: "#f7fafc" }}><td>Subtotal</td>{months.map(m => <td key={m} className="mn" style={{ textAlign: "right", color }}>{R$(sb[m] || 0)}</td>)}<td className="mn" style={{ textAlign: "right", color }}>{R$(sb.t)}</td></tr>
      </tbody></table></div></div>);

  return (<div>
    {tip && <div style={{ position: "fixed", left: tip.x, top: tip.y - 8, transform: "translate(-50%,-100%)", zIndex: 9999, background: "white", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", boxShadow: "0 4px 16px rgba(0,0,0,.15)", pointerEvents: "none", minWidth: 160, maxWidth: 280 }}>
      {tip.list.map(([f, v], i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 14, fontSize: 10.5, padding: "1px 0" }}><span style={{ color: "#4a5568" }}>{f}</span><span className="mn" style={{ fontWeight: 600 }}>{R$(v)}</span></div>)}
    </div>}
    <div style={{ background: "white", borderRadius: 11, padding: 18, border: "1px solid #e2e8f0", marginBottom: 20 }}>
      <h3 style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 14 }}>Visão Mensal Consolidada</h3>
      <ResponsiveContainer width="100%" height={280}><BarChart data={cd}><CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" /><XAxis dataKey="name" style={{ fontSize: 10 }} /><YAxis tickFormatter={v => R$k(v)} style={{ fontSize: 9 }} /><Tooltip formatter={v => R$(v)} /><Legend wrapperStyle={{ fontSize: 10 }} /><Bar dataKey="Pago" stackId="a" fill="#38a169" /><Bar dataKey="Programado" stackId="a" fill="#d69e2e" /><Bar dataKey="Provisionado" stackId="a" fill="#a0aec0" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer>
    </div>
    <div style={{ background: "white", borderRadius: 11, padding: 18, border: "1px solid #e2e8f0" }}>
      <BT title="PAGO (Realizado)" rows={pR} s={pS} color="#38a169" />
      <BT title="PROGRAMADO (Agendado)" rows={prR} s={prS} color="#d69e2e" />
      <BT title="PROVISIONADO (Saldo restante diluído)" rows={pvR} s={pvS} color="#a0aec0" />
      <div style={{ borderTop: "2px solid #1a365d", paddingTop: 8 }}><table><tbody>
        <tr style={{ fontWeight: 700 }}><td style={{ minWidth: 95 }}>TOTAL</td>{months.map(m => <td key={m} className="mn" style={{ textAlign: "right", minWidth: 85, color: "#1a365d" }}>{R$((pS[m] || 0) + (prS[m] || 0) + (pvS[m] || 0))}</td>)}<td className="mn" style={{ textAlign: "right", minWidth: 90, color: "#1a365d" }}>{R$(pS.t + prS.t + pvS.t)}</td></tr>
        <tr style={{ fontWeight: 600, color: "#3182ce" }}><td>ACUMULADO</td>{(() => { let a = 0; return months.map(m => { a += (pS[m] || 0) + (prS[m] || 0) + (pvS[m] || 0); return <td key={m} className="mn" style={{ textAlign: "right" }}>{R$(a)}</td>; }); })()}<td></td></tr>
      </tbody></table></div>
    </div>
    {/* ═══ FOLGA TABLE — separate card below ═══ */}
    <div style={{ background: "white", borderRadius: 11, padding: 18, border: "1px solid #e2e8f0", marginTop: 20 }}>
      {(() => {
        const folgaRows = cats.filter(c => (orc[c.id] || 0) > 0).map(c => {
          const row = { cat: c.curto, t: 0 };
          const totalOrc = orc[c.id] || 0;
          let totalGasto = 0;
          months.forEach(m => {
            totalGasto += (pR.find(r => r.cat === c.curto)?.[m] || 0) + (prR.find(r => r.cat === c.curto)?.[m] || 0) + (pvR.find(r => r.cat === c.curto)?.[m] || 0);
          });
          row.orc = totalOrc;
          row.comp = totalGasto;
          row.folga = totalOrc - totalGasto;
          return row;
        });
        const totalFolga = folgaRows.reduce((s, r) => s + r.folga, 0);

        return (<div>
          <h3 style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: "#48bb78" }} />FOLGA — saldo disponível por categoria (orçado − comprometido total)</h3>
          <div style={{ overflow: "auto" }}><table><thead><tr><th>Categoria</th><th style={{ textAlign: "right" }}>Orçado</th><th style={{ textAlign: "right" }}>Comprometido</th><th style={{ textAlign: "right" }}>Folga</th></tr></thead>
            <tbody>
              {folgaRows.map((r, i) => <tr key={i} className="hr"><td style={{ fontSize: 11, fontWeight: 500 }}>{r.cat}</td><td className="mn" style={{ textAlign: "right" }}>{R$(r.orc)}</td><td className="mn" style={{ textAlign: "right", color: r.comp > r.orc ? "#e53e3e" : undefined }}>{R$(r.comp)}</td><td className="mn" style={{ textAlign: "right", fontWeight: 600, color: r.folga > 0 ? "#38a169" : r.folga < 0 ? "#e53e3e" : "#cbd5e0" }}>{r.folga < 0 ? <span>{"\u26A0\uFE0F"} {R$(r.folga)}</span> : r.folga > 0 ? R$(r.folga) : "—"}</td></tr>)}
              <tr style={{ fontWeight: 700, background: "#f0fff4" }}><td>TOTAL FOLGA</td><td></td><td></td><td className="mn" style={{ textAlign: "right", color: totalFolga >= 0 ? "#38a169" : "#e53e3e", fontWeight: 700 }}>{totalFolga < 0 ? "\u26A0\uFE0F " : ""}{R$(totalFolga)}</td></tr>
            </tbody></table></div>
        </div>);
      })()}
    </div>
  </div>);
}

/* ═══ CONFIG ═══ */
function CfgPage({ cats, setCats, CM, orc, setOrc, fat, prov, provData, res, profile }) {
  const [eb, setEb] = useState(null); const [tv, setTv] = useState("");

  /* ═══ XLSX Export using SheetJS ═══ */
  const exportXlsx = (type) => {
    try {
    const wb = XLSX.utils.book_new();
    const curr = (v) => typeof v === "number" ? v : 0;

    if (type === "faturas" || type === "completo") {
      const rows = []; const merges = [];
      rows.push(["Fornecedor", "Descrição", "Nº Doc", "Vl. Contrato", "Vl. Fatura", "Status", "Data Prevista", "Data Pgto", "Categoria", "Valor Alocado", "Provisão", "Observação"]);
      fat.forEach(f => {
        const aloc = f.aloc || [];
        const provNames = (f.prov_ids || []).map(pid => { const p = prov.find(x => x.id === pid); return p ? p.forn + " — " + p.desc : pid; }).join("; ");
        if (aloc.length <= 1) {
          rows.push([f.forn, f.desc || "", f.ndoc || "", curr(f.vc), curr(f.vf), f.st, f.dp || "", f.de || "", aloc[0] ? (CM[aloc[0].cat]?.curto || "") : "", aloc[0] ? curr(aloc[0].valor) : 0, provNames, f.obs || ""]);
        } else {
          const startRow = rows.length;
          aloc.forEach((a, ai) => {
            rows.push([ai === 0 ? f.forn : "", ai === 0 ? (f.desc || "") : "", ai === 0 ? (f.ndoc || "") : "", ai === 0 ? curr(f.vc) : "", ai === 0 ? curr(f.vf) : "", ai === 0 ? f.st : "", ai === 0 ? (f.dp || "") : "", ai === 0 ? (f.de || "") : "", CM[a.cat]?.curto || "", curr(a.valor), ai === 0 ? provNames : "", ai === 0 ? (f.obs || "") : ""]);
          });
          [0,1,2,3,4,5,6,7,10,11].forEach(col => {
            if (aloc.length > 1) merges.push({ s: { r: startRow, c: col }, e: { r: startRow + aloc.length - 1, c: col } });
          });
        }
      });
      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws["!merges"] = merges;
      ws["!cols"] = [{wch:22},{wch:28},{wch:16},{wch:14},{wch:14},{wch:12},{wch:12},{wch:12},{wch:16},{wch:14},{wch:30},{wch:20}];
      XLSX.utils.book_append_sheet(wb, ws, "Faturas");
    }

    if (type === "provisoes" || type === "completo") {
      const rows = []; const merges = [];
      rows.push(["Fornecedor", "Descrição", "Vl. Total", "Status", "Categoria", "Valor Alocado", "Faturado", "Saldo", "Diluição", "Início", "Fim"]);
      prov.forEach(p => {
        const pd = provData[p.id] || {};
        const aloc = p.aloc || [];
        if (aloc.length <= 1) {
          const fatVal = aloc[0] ? (pd.faturado?.[aloc[0].cat] || 0) : 0;
          const saldo = aloc[0] ? (aloc[0].valor - fatVal) : 0;
          rows.push([p.forn, p.desc || "", curr(p.ve), p.st, aloc[0] ? (CM[aloc[0].cat]?.curto || "") : "", aloc[0] ? curr(aloc[0].valor) : 0, fatVal, saldo, p.diluicao, p.flat_inicio || "", p.flat_fim || ""]);
        } else {
          const startRow = rows.length;
          aloc.forEach((a, ai) => {
            const fatVal = pd.faturado?.[a.cat] || 0;
            rows.push([ai === 0 ? p.forn : "", ai === 0 ? (p.desc || "") : "", ai === 0 ? curr(p.ve) : "", ai === 0 ? p.st : "", CM[a.cat]?.curto || "", curr(a.valor), fatVal, a.valor - fatVal, ai === 0 ? p.diluicao : "", ai === 0 ? (p.flat_inicio || "") : "", ai === 0 ? (p.flat_fim || "") : ""]);
          });
          [0,1,2,3,8,9,10].forEach(col => {
            if (aloc.length > 1) merges.push({ s: { r: startRow, c: col }, e: { r: startRow + aloc.length - 1, c: col } });
          });
        }
      });
      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws["!merges"] = merges;
      ws["!cols"] = [{wch:22},{wch:28},{wch:14},{wch:10},{wch:16},{wch:14},{wch:14},{wch:14},{wch:10},{wch:10},{wch:10}];
      XLSX.utils.book_append_sheet(wb, ws, "Provisões");
    }

    if (type === "resumo" || type === "completo") {
      const rows = [];
      rows.push(["Categoria", "Orçado", "Pago", "Programado", "Provisionado", "Comprometido", "Saldo", "%"]);
      res.forEach(r => rows.push([r.nome, r.o, r.pg, r.pr, r.pv, r.cm, r.sl, r.pc]));
      const tot = res.reduce((a, r) => ({ o: a.o + r.o, pg: a.pg + r.pg, pr: a.pr + r.pr, pv: a.pv + r.pv, cm: a.cm + r.cm, sl: a.sl + r.sl }), { o: 0, pg: 0, pr: 0, pv: 0, cm: 0, sl: 0 });
      rows.push(["TOTAL", tot.o, tot.pg, tot.pr, tot.pv, tot.cm, tot.sl, tot.o > 0 ? tot.cm / tot.o : 0]);
      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws["!cols"] = [{wch:30},{wch:14},{wch:14},{wch:14},{wch:14},{wch:14},{wch:14},{wch:8}];
      XLSX.utils.book_append_sheet(wb, ws, "Resumo Orçamento");
    }

    XLSX.writeFile(wb, type === "completo" ? "relatorio_obra_jma.xlsx" : `${type}_obra_jma.xlsx`);
    } catch (e) { console.error(e); alert("Erro na exportação: " + e.message); }
  };

  const exp = (data, name) => {
    try {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Dados");
      XLSX.writeFile(wb, name.replace(".csv", ".xlsx"));
    } catch (e) { alert("Erro: " + e.message); }
  };

  const [en, setEn] = useState(null); const [nn, setNn] = useState(""); const [nc, setNc] = useState(""); const [nv, setNv] = useState(0);
  const [showAdd, setShowAdd] = useState(false); const [newNome, setNewNome] = useState(""); const [newCurto, setNewCurto] = useState("");

  const addCat = async () => {
    if (!newNome.trim() || !newCurto.trim()) return;
    const id = "c" + String(cats.length + 1).padStart(2, "0");
    const newCat = { id, nome: newNome.trim(), curto: newCurto.trim() };
    try {
      await upsertCategory(newCat, 0);
      setCats(p => [...p, newCat]);
      setOrc(p => ({ ...p, [id]: 0 }));
      setNewNome(""); setNewCurto(""); setShowAdd(false);
    } catch (e) { alert("Erro ao adicionar categoria: " + e.message); }
  };

  const saveCatEdit = async (cid) => {
    const updatedCat = { id: cid, nome: nn.trim() || cats.find(c => c.id === cid)?.nome, curto: nc.trim() || cats.find(c => c.id === cid)?.curto };
    const newOrc = Number(nv) || 0;
    try {
      await upsertCategory(updatedCat, newOrc);
      setCats(p => p.map(c => c.id === cid ? { ...c, nome: updatedCat.nome, curto: updatedCat.curto } : c));
      setOrc(p => ({ ...p, [cid]: newOrc }));
      setEn(null);
    } catch (e) { alert("Erro ao salvar categoria: " + e.message); }
  };

  const catInUse = (cid) => fat.some(f => (f.aloc || []).some(a => a.cat === cid)) || prov.some(p => (p.aloc || []).some(a => a.cat === cid));
  const delCat = async (cid) => {
    if (catInUse(cid)) { alert("Categoria com faturas ou provisões vinculadas. Remova os vínculos antes de excluir."); return; }
    if (!confirm("Excluir essa categoria?")) return;
    try {
      await dbDeleteCategory(cid);
      setCats(p => p.filter(c => c.id !== cid));
      setOrc(p => { const n = { ...p }; delete n[cid]; return n; });
    } catch (e) { alert("Erro ao excluir categoria: " + e.message); }
  };

  /* ═══ User Management (admin only) ═══ */
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const profiles = await fetchAllProfiles();
      setUsers(profiles);
    } catch (e) { console.error(e); }
    setUsersLoading(false);
  };

  useEffect(() => {
    if (profile?.is_admin) loadUsers();
  }, [profile?.is_admin]);

  const handleApprove = async (uid) => {
    try { await approveUser(uid); setUsers(p => p.map(u => u.id === uid ? { ...u, approved: true } : u)); } catch (e) { alert("Erro: " + e.message); }
  };
  const handleRevoke = async (uid) => {
    try { await revokeUser(uid); setUsers(p => p.map(u => u.id === uid ? { ...u, approved: false } : u)); } catch (e) { alert("Erro: " + e.message); }
  };
  const handleToggleAdmin = async (uid, current) => {
    try { await toggleAdmin(uid, !current); setUsers(p => p.map(u => u.id === uid ? { ...u, is_admin: !current } : u)); } catch (e) { alert("Erro: " + e.message); }
  };
  const handleResetPassword = async (email) => {
    try {
      const { error } = await (await import('../lib/db')).supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset' });
      if (error) throw error;
      alert("E-mail de recuperação enviado para " + email);
    } catch (e) { alert("Erro: " + e.message); }
  };

  return (<div>
    <div style={{ background: "white", borderRadius: 11, padding: 18, border: "1px solid #e2e8f0", marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ fontSize: 13, fontWeight: 600 }}>Orçamento por Categoria</h3>
        <button className="bp" style={{ padding: "5px 12px", fontSize: 11 }} onClick={() => setShowAdd(!showAdd)}><I n={showAdd ? "x" : "pl"} s={12} /> {showAdd ? "Cancelar" : "Nova Categoria"}</button>
      </div>
      {showAdd && <div style={{ background: "#f7fafc", borderRadius: 8, padding: 12, marginBottom: 12, display: "flex", gap: 8, alignItems: "flex-end" }}>
        <div style={{ flex: 2 }}><label style={{ fontSize: 10, color: "#718096" }}>Nome Completo</label><input className="inp" value={newNome} onChange={e => setNewNome(e.target.value)} placeholder="Ex: Instalações Elétricas" /></div>
        <div style={{ flex: 1 }}><label style={{ fontSize: 10, color: "#718096" }}>Nome Curto</label><input className="inp" value={newCurto} onChange={e => setNewCurto(e.target.value)} placeholder="Ex: Elétrica" /></div>
        <button className="bp" style={{ padding: "6px 14px", whiteSpace: "nowrap" }} onClick={addCat}>Adicionar</button>
      </div>}
      <table><thead><tr><th>Categoria</th><th>Nome Curto</th><th style={{ textAlign: "right" }}>Orçado</th><th style={{ width: 60 }}></th></tr></thead>
        <tbody>{cats.map(c => <tr key={c.id} className="hr">
          <td style={{ fontWeight: 500, fontSize: 12 }}>{en === c.id ? <input className="inp" value={nn} onChange={e => setNn(e.target.value)} style={{ width: "100%", fontSize: 12 }} /> : c.nome}</td>
          <td style={{ fontSize: 11.5, color: "#718096" }}>{en === c.id ? <input className="inp" value={nc} onChange={e => setNc(e.target.value)} style={{ width: "100%", fontSize: 11 }} /> : c.curto}</td>
          <td className="mn" style={{ textAlign: "right" }}>{en === c.id ? <MoneyInput value={nv} onChange={v => setNv(v)} style={{ width: 140 }} /> : R$(orc[c.id] || 0)}</td>
          <td>{en === c.id
            ? <div style={{ display: "flex", gap: 2 }}><button className="bp" style={{ padding: "3px 8px" }} onClick={() => saveCatEdit(c.id)}><I n="ck" s={12} /></button><button className="bi" onClick={() => setEn(null)}><I n="x" s={12} /></button></div>
            : <div style={{ display: "flex", gap: 2 }}><button className="bi" onClick={() => { setEn(c.id); setNn(c.nome); setNc(c.curto); setNv(orc[c.id] || 0); }}><I n="ed" s={13} /></button><button className="bi" style={{ color: catInUse(c.id) ? "#cbd5e0" : "#e53e3e" }} onClick={() => delCat(c.id)}><I n="tr" s={13} /></button></div>}
          </td></tr>)}
          <tr style={{ fontWeight: 700, background: "#f7fafc" }}><td>TOTAL</td><td></td><td className="mn" style={{ textAlign: "right" }}>{R$(Object.values(orc).reduce((s, v) => s + v, 0))}</td><td></td></tr>
        </tbody></table>
    </div>

    {/* User Management - Admin Only */}
    {profile?.is_admin && (
      <div style={{ background: "white", borderRadius: 11, padding: 18, border: "1px solid #e2e8f0", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600 }}>👥 Gestão de Usuários</h3>
          <button className="bs" style={{ padding: "5px 12px", fontSize: 11 }} onClick={loadUsers}><I n="sr" s={12} /> Atualizar</button>
        </div>
        {usersLoading ? <p style={{ fontSize: 12, color: "#718096" }}>Carregando...</p> : (
          <table><thead><tr><th>E-mail</th><th>Nome</th><th>Status</th><th>Admin</th><th style={{ width: 120 }}>Ações</th></tr></thead>
            <tbody>{users.map(u => <tr key={u.id} className="hr">
              <td style={{ fontSize: 12 }}>{u.email}</td>
              <td style={{ fontSize: 12, color: "#718096" }}>{u.nome || "—"}</td>
              <td>{u.approved ? <span className="bdg bdg-pago">Aprovado</span> : <span className="bdg bdg-cancelado">Pendente</span>}</td>
              <td>{u.is_admin ? <span className="bdg bdg-ativo">Admin</span> : <span style={{ fontSize: 11, color: "#a0aec0" }}>—</span>}</td>
              <td style={{ display: "flex", gap: 4 }}>
                {!u.approved ? <button className="bp" style={{ padding: "3px 10px", fontSize: 10 }} onClick={() => handleApprove(u.id)}>Aprovar</button>
                  : <button className="bs" style={{ padding: "3px 10px", fontSize: 10, color: "#e53e3e", borderColor: "#fed7d7" }} onClick={() => handleRevoke(u.id)}>Revogar</button>}
                <button className="bs" style={{ padding: "3px 10px", fontSize: 10 }} onClick={() => handleToggleAdmin(u.id, u.is_admin)}>{u.is_admin ? "Remover Admin" : "Tornar Admin"}</button>
                <button className="bs" style={{ padding: "3px 10px", fontSize: 10, color: "#3182ce", borderColor: "#bee3f8" }} onClick={() => handleResetPassword(u.email)} title="Enviar e-mail de reset">🔑 Reset</button>
              </td>
            </tr>)}</tbody>
          </table>
        )}
      </div>
    )}

    {/* Export section */}
    <div style={{ background: "white", borderRadius: 11, padding: 18, border: "1px solid #e2e8f0", marginBottom: 20 }}>
      <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Exportar Dados</h3>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="bp" style={{ padding: "6px 12px", fontSize: 11 }} onClick={() => exportXlsx("completo")}><I n="dl" s={12} /> Relatório Completo</button>
        <button className="bs" style={{ padding: "6px 12px", fontSize: 11 }} onClick={() => exportXlsx("faturas")}><I n="dl" s={12} /> Faturas (.xlsx)</button>
        <button className="bs" style={{ padding: "6px 12px", fontSize: 11 }} onClick={() => exportXlsx("provisoes")}><I n="dl" s={12} /> Provisões (.xlsx)</button>
        <button className="bs" style={{ padding: "6px 12px", fontSize: 11 }} onClick={() => exportXlsx("resumo")}><I n="dl" s={12} /> Resumo (.xlsx)</button>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
        <button className="bs" style={{ padding: "6px 12px", fontSize: 11 }} onClick={() => {
          const data = fat.map(f => {
            const al = (f.aloc || []).map(a => (CM[a.cat] ? CM[a.cat].curto : "") + ":" + a.valor).join(";");
            const pv = (f.prov_ids || []).join(";");
            return { Fornecedor: f.forn, Descricao: f.desc || "", NDoc: f.ndoc || "", VlContrato: f.vc, VlFatura: f.vf, Status: f.st, DataPrevista: f.dp || "", DataPgto: f.de || "", Alocacoes: al, Observacao: f.obs || "", LinkNF: f.link_nf || "", LinkComprovante: f.link_comp || "", LinkContrato: f.link_contrato || "", Provisoes: pv, Revisado: f.revisado || "" };
          });
          exp(data, "faturas.csv");
        }}><I n="dl" s={12} /> Faturas (simples)</button>
        <button className="bs" style={{ padding: "6px 12px", fontSize: 11 }} onClick={() => {
          const data = prov.map(p => {
            const al = (p.aloc || []).map(a => (CM[a.cat] ? CM[a.cat].curto : "") + ":" + a.valor).join(";");
            const cu = (p.custom_meses || []).map(m => m.ym + ":" + m.pct + "%").join(";");
            return { Fornecedor: p.forn, Descricao: p.desc || "", VlTotal: p.ve, Status: p.st, Alocacoes: al, LinkDoc: p.link_doc || "", Diluicao: p.diluicao, FlatInicio: p.flat_inicio || "", FlatFim: p.flat_fim || "", CustomMeses: cu, Revisado: p.revisado || "" };
          });
          exp(data, "provisoes.csv");
        }}><I n="dl" s={12} /> Provisões (simples)</button>
      </div>
    </div>
  </div>);
}
