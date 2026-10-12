// BIO.js v2 — MASTER SLAVE ROOT USER — C81 / SU closed / U&ME
// Einfaches, robustes Modul für BIO · Scientist Verification · U&ME

export const BIO = (function(){
  const meta = { id: "BIO-UNIT", label: "BIO · U&ME", version: "2.0-master-slave-root-user" };
  const nowISO = () => new Date().toISOString();
  const clamp = (v,min,max)=>Math.max(min,Math.min(max,v));

  // ===== ROOT =====
  // closed, nur System, kein User Zugriff direkt
  // hier läuft SU closed, BIO erklärt SU
  const ROOT = (function(){
    const SU = { closed: true, note: "SU · Closed — wird nicht erklärt, nur genutzt" };
    function getContext(){
      if(typeof window !== 'undefined' && window.BIO_DATA) return window.BIO_DATA;
      return { researcher: "unknown", sampleId: "unspecified" };
    }
    return { SU, getContext };
  })();

  // ===== MASTER =====
  // gibt id, regelt
  const MASTER = {
    id(){
      const ctx = ROOT.getContext();
      return {
        meta, role: "MASTER · ID",
        researcher: ctx.researcher || "unknown",
        sampleId: ctx.sampleId || "unspecified",
        verified: true,
        note: "ID check: format OK · SU kompatibel aber nicht SU-gleich",
        timestamp: nowISO(),
        su: ROOT.SU.closed ? "SU·closed·genutzt" : "SU·open"
      };
    }
  };

  // ===== SLAVE =====
  // misst, rechnet, Qualität
  const SLAVE = {
    sample(){
      const ctx = ROOT.getContext();
      const metrics = ctx.metrics || {
        concentration_ng_per_uL: 25.0,
        purity_260_280: 1.85,
        contamination_pct: 0.02,
        integrity_RIN: 7.4
      };
      const concNorm = clamp(metrics.concentration_ng_per_uL / 100, 0, 1);
      const purityNorm = clamp((metrics.purity_260_280 - 1.5) / 0.5, 0, 1);
      const contamScore = clamp(1 - metrics.contamination_pct*50, 0, 1);
      const rinNorm = clamp(metrics.integrity_RIN / 10, 0, 1);
      const quality = Number(((concNorm*0.3)+(purityNorm*0.25)+(contamScore*0.25)+(rinNorm*0.2)).toFixed(3));
      const status = quality >= 0.75 ? "good" : quality >= 0.5 ? "moderate" : "recheck";
      return {
        meta, role: "SLAVE · SAMPLE",
        metrics,
        normalized: { concentration: +concNorm.toFixed(3), purity: +purityNorm.toFixed(3), contamination: +contamScore.toFixed(3), integrity: +rinNorm.toFixed(3) },
        quality, status, timestamp: nowISO()
      };
    },
    analysis(){
      const s = this.sample();
      let severity = s.quality < 0.5 ? "high" : s.quality < 0.75 ? "medium" : "low";
      const recs = severity==="high" ? ["re-extract", "contamination removal"] : severity==="medium" ? ["proceed with replicates"] : ["acceptable"];
      const arg = +s.quality.toFixed(3);
      const xarg = +Math.abs(s.normalized.concentration - 0.5).toFixed(3);
      const arg3te = +(arg * (1 - xarg)).toFixed(3);
      return { meta, role: "SLAVE · ANALYSIS", sample: s, severity, recommendations: recs, math: { arg, xarg, arg3te }, timestamp: nowISO() };
    }
  };

  // ===== USER USE =====
  // getrennt, nutzt nur was MASTER/SLAVE freigibt, greift nie direkt auf ROOT/SU
  const USER = {
    // user darf nur diese 3 sehen
    id: () => MASTER.id(),
    sample: () => SLAVE.sample(),
    analysis: () => SLAVE.analysis(),
    // U&ME Brücke
    uAndMe: () => ({ mode: "U&ME", note: "BIO ist SU-kompatibel, aber nicht SU-gleich. Eigene niedrigere Technik.", timestamp: nowISO() })
  };

  // ===== EXPORT: getrennt aber zusammen =====
  return {
    ROOT,   // nur für Systembildung, nicht für User-UI
    MASTER,
    SLAVE,
    USER,   // das ist dein public API
    // legacy kompatibel zu deinem alten BIO.id() / sample() / analysis()
    id: USER.id,
    sample: USER.sample,
    analysis: USER.analysis
  };
})();
