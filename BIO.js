// BIO.js
// Einfaches, robustes Modul für BIO · Scientist Verification · U&ME
// Export: BIO.id(), BIO.sample(), BIO.analysis()

export const BIO = (function(){
  const meta = { id: "BIO-UNIT", label: "BIO · U&ME", version: "1.0" };
  const nowISO = () => (new Date()).toISOString();

  // Hol Kontext aus window.BIO_DATA falls vorhanden
  function getContext(){
    if(typeof window !== 'undefined' && window.BIO_DATA) return window.BIO_DATA;
    return { researcher: "unknown", sampleId: "unspecified" };
  }

  // STAGE: ID / metadata check
  function id(){
    const ctx = getContext();
    return {
      meta,
      researcher: ctx.researcher || "unknown",
      sampleId: ctx.sampleId || "unspecified",
      verified: true,
      note: "ID check simulated: format OK",
      timestamp: nowISO()
    };
  }

  // STAGE: sample quick check (quality / contamination)
  function sample(){
    const ctx = getContext();
    const metrics = ctx.metrics || {
      concentration_ng_per_uL: 25.0,
      purity_260_280: 1.85,
      contamination_pct: 0.02,
      integrity_RIN: 7.4
    };

    // Normierungen (tunable)
    const concNorm = clamp(metrics.concentration_ng_per_uL / 100, 0, 1);
    const purityNorm = clamp((metrics.purity_260_280 - 1.5) / (2.0 - 1.5), 0, 1);
    const contamScore = clamp(1 - metrics.contamination_pct*50, 0, 1); // small contamination quickly penalizes
    const rinNorm = clamp((metrics.integrity_RIN) / 10, 0, 1);

    const quality = Number(((concNorm*0.3) + (purityNorm*0.25) + (contamScore*0.25) + (rinNorm*0.2)).toFixed(3));
    const status = quality >= 0.75 ? "good" : (quality >= 0.5 ? "moderate" : "recheck");

    return {
      meta,
      metrics,
      normalized: { concentration: Number(concNorm.toFixed(3)), purity: Number(purityNorm.toFixed(3)), contamination: Number(contamScore.toFixed(3)), integrity: Number(rinNorm.toFixed(3)) },
      quality,
      status,
      timestamp: nowISO()
    };
  }

  // STAGE: analysis / effect: combines sample + experimental context to give recommendations + math
  function analysis(){
    const s = sample();
    // simple severity rule
    let severity = "low";
    if(s.quality < 0.5) severity = "high";
    else if(s.quality < 0.75) severity = "medium";

    const recs = [];
    if(severity === "high"){
      recs.push("Sample quality low → re-extract or re-prepare sample.");
      recs.push("Run contamination removal protocols and re-measure.");
    } else if(severity === "medium"){
      recs.push("Proceed with caution; include technical replicates.");
    } else {
      recs.push("Sample acceptable; proceed with planned analysis.");
    }

    // arg/xarg/arg3te style math (as in your other modules)
    const arg = Number(s.quality.toFixed(3)); // main score
    const xarg = Number(Math.abs(s.normalized.concentration - 0.5).toFixed(3)); // distance from nominal conc=0.5
    const arg3te = Number((arg * (1 - xarg)).toFixed(3));

    return {
      meta,
      sample: s,
      severity,
      recommendations: recs,
      math: { arg, xarg, arg3te },
      timestamp: nowISO()
    };
  }

  // Utility
  function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }

  return { id, sample, analysis };
})();
