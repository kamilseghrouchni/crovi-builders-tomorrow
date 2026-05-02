/* ============================================================
   Crovi Wireframes · Landing + Expanded dossier (Fleet removed)
   ============================================================ */

/* ---- Landing · plain-prose composer + mode tease ---- */
const WF_Landing = () => {
  const [val, setVal] = React.useState(
    "We need ~100 CSF specimens from Alzheimer's patients for a WGBS methylation study — at least 500 μL per donor. Open to commissioning new collection if it's faster. No PAXgene tubes, no pooled samples. Looking for sites that can deliver in the next 8 weeks."
  );
  return (
    <div className="scr" style={{width:1200,height:780,position:'relative',overflow:'hidden',background:'var(--bg)'}}>
      {/* Top bar */}
      <div style={{position:'absolute',top:22,left:32,right:32,display:'flex',justifyContent:'space-between',alignItems:'center',zIndex:3}}>
        <div className="serif" style={{fontSize:22,fontStyle:'italic',color:'var(--text)'}}>crovi</div>
        <div style={{display:'flex',gap:24,alignItems:'center'}}>
          <span className="mono" style={{color:'var(--text-2)'}}>RUNS</span>
          <span className="mono" style={{color:'var(--text-2)'}}>DOCS</span>
          <span className="mono" style={{color:'var(--text-2)'}}>ACCOUNT</span>
        </div>
      </div>

      <div style={{position:'absolute',left:80,right:80,top:120,zIndex:2}}>
        <h1 className="serif" style={{fontSize:60,lineHeight:1.0,letterSpacing:'-.025em',margin:'0 0 14px',color:'var(--text)',maxWidth:900,fontWeight:400}}>
          What are you trying to source?
        </h1>
        <div style={{fontSize:16,color:'var(--text-2)',maxWidth:680,lineHeight:1.55,marginBottom:28}}>
          Describe the project in your own words. Crovi reads it, asks anything that's missing, then canvasses the field on your behalf.
        </div>

        {/* Composer — plain prose textarea */}
        <div className="card-warm" style={{padding:'4px 4px 0',background:'#FBF9F4',boxShadow:'0 14px 48px rgba(26,24,20,.07)'}}>
          <textarea
            value={val}
            onChange={(e)=>setVal(e.target.value)}
            style={{
              width:'100%', minHeight:120, padding:'18px 20px 14px',
              border:0, background:'transparent', resize:'none', outline:'none',
              fontFamily:'var(--body)', fontSize:16, lineHeight:1.55, color:'var(--text)',
            }}
          />
          <div style={{padding:'10px 18px 14px',borderTop:'1px dashed var(--cream-line)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <span className="tag">+ Attach protocol</span>
              <span className="tag">+ IRB / consent</span>
              <span className="mono-sm" style={{color:'var(--text-3)',marginLeft:6}}>or paste a link</span>
            </div>
            <button className="btn-p brand">Start sourcing →</button>
          </div>
        </div>

        {/* Mode tease — Biospecimen active, others locked */}
        <div style={{marginTop:22,display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
          {[
            {k:'Biospecimen sourcing', sub:'Find sites & cohorts that match', state:'active'},
            {k:'CRO sourcing',         sub:'Match labs, CROs, and capabilities', state:'locked'},
            {k:'Bounty mode',          sub:'Post a brief, let the network bid',   state:'locked'},
          ].map(m=>{
            const active = m.state==='active';
            return (
              <div key={m.k} style={{
                padding:'14px 16px',
                border:`1px solid ${active?'var(--brand-ink)':'var(--bg-sunk)'}`,
                borderRadius:10,
                background: active?'var(--brand-fill)':'var(--bg-card)',
                opacity: active?1:.72,
                position:'relative',
              }}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:4}}>
                  <span className="serif" style={{fontSize:15,color:'var(--text)'}}>{m.k}</span>
                  {active
                    ? <span className="mono-sm" style={{color:'var(--brand-ink)',display:'inline-flex',alignItems:'center',gap:5}}><span className="live-dot"/>ACTIVE</span>
                    : <span className="mono-sm" style={{color:'var(--text-3)'}}>◐ COMING SOON</span>}
                </div>
                <div className="mono-sm" style={{color:'var(--text-2)',lineHeight:1.5,fontSize:10.5}}>{m.sub}</div>
              </div>
            );
          })}
        </div>

        {/* Try-this examples */}
        <div style={{marginTop:18,display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
          <span className="mono-sm" style={{color:'var(--text-3)',textTransform:'uppercase',marginRight:4}}>Examples</span>
          <span className="tag">50 NSCLC FFPE, treatment-naïve</span>
          <span className="tag">200 CRC matched tumor/normal</span>
          <span className="tag">MS CSF longitudinal, ≥3 timepoints</span>
        </div>
      </div>
    </div>
  );
};

/* ---- Expanded dossier · evidence-rich, every fact cited ---- */
const WF_Expanded = () => {
  const inst = INSTITUTIONS[0]; // U-Washington
  /* Curated cited facts across every category a customer needs to build conviction */
  const sections = [
    {
      cat:'COHORT & SAMPLE',
      rows:[
        {k:'Cohort name',     v:'UW Memory & Brain Wellness CSF Repository', cite:{tag:'Smith et al. 2025', src:'PMC12345 · Methods §2.1'}},
        {k:'Specimen',        v:'CSF · cell-free supernatant, post-centrifugation', cite:{tag:'Smith 2025 §2.2', src:'PMC12345'}},
        {k:'Total banked',    v:'150 vials available for outbound', cite:{tag:'PI email · 2026-04-12', src:'inbox/uwa-pi-reply.eml'}},
        {k:'Volume per vial', v:'500 – 1,200 μL', cite:{tag:'Smith 2025 Table 1', src:'PMC12345'}},
        {k:'Collection window', v:'Jan 2020 → Sep 2024', cite:{tag:'Smith 2025 §2.1', src:'PMC12345'}},
      ]
    },
    {
      cat:'CLINICAL & DEMOGRAPHIC',
      rows:[
        {k:'Indication',      v:'Alzheimer\'s disease, NIA-AA criteria', cite:{tag:'Smith 2025 §2.1', src:'PMC12345'}},
        {k:'AD stage mix',    v:'Mild 62 · Moderate 58 · Severe 30', cite:{tag:'Smith 2025 Table 2', src:'PMC12345'}},
        {k:'Sex',             v:'F 82 · M 68 (54.7% F)', cite:{tag:'Smith 2025 Table 2', src:'PMC12345'}},
        {k:'Mean age',        v:'71.4 ± 8.2 years', cite:{tag:'Smith 2025 Table 2', src:'PMC12345'}},
        {k:'APOE ε4',         v:'Genotyped on 142 of 150', cite:{tag:'Jones 2024 supp.', src:'PMC18822'}},
      ]
    },
    {
      cat:'COLLECTION & FORMAT',
      rows:[
        {k:'Draw protocol',   v:'Fasting morning lumbar puncture, 22G atraumatic needle', cite:{tag:'Smith 2025 §2.2', src:'PMC12345'}},
        {k:'Centrifugation',  v:'2,000 g × 10 min, 4°C, within 1 h of draw', cite:{tag:'Smith 2025 §2.2', src:'PMC12345'}},
        {k:'Aliquoting',      v:'500 μL polypropylene cryovials, single-use', cite:{tag:'Smith 2025 §2.2', src:'PMC12345'}},
        {k:'Storage',         v:'-80 °C continuous, monitored', cite:{tag:'Biobank SOP-04', src:'uw.edu/biobank/sops'}},
        {k:'Freeze-thaw',     v:'≤ 1 cycle prior to shipment', cite:{tag:'PI email · 2026-04-12', src:'inbox/uwa-pi-reply.eml'}},
      ]
    },
    {
      cat:'CONTACT, CONSENT & ROUTING',
      rows:[
        {k:'PI',              v:'Dr A. Smith — corresponding author on 4 cohort papers', cite:{tag:'Smith 2025 corresponding', src:'PMC12345'}},
        {k:'Email validated', v:'a.smith@uw.edu — MX + institutional directory match', cite:{tag:'Crovi check 2026-04-22', src:'verify/uwa-email.json'}},
        {k:'Sharing policy',  v:'Material Transfer Agreement (MTA) on file, broad-use', cite:{tag:'UW MTA template', src:'uw.edu/research/mta'}},
        {k:'Consent scope',   v:'Broad consent for biomedical research', cite:{tag:'Consent v3 · 2021', src:'uw.edu/biobank/consent.pdf'}},
        {k:'Commercial use',  v:'Permitted per cohort consent', cite:{tag:'PI email · 2026-04-12', src:'inbox/uwa-pi-reply.eml', flag:'open'}},
        {k:'Lead time',       v:'2 – 3 weeks from MTA execution', cite:{tag:'PI email · 2026-04-12', src:'inbox/uwa-pi-reply.eml'}},
      ]
    },
    {
      cat:'MOMENTUM & DEPTH',
      rows:[
        {k:'Output',          v:'7 cohort papers · 2 active trials · last 24 mo', cite:{tag:'PubMed query', src:'pubmed/uwa-csf-2024'}},
        {k:'Active trials',   v:'NCT05541299 · NCT06012774', cite:{tag:'ClinicalTrials.gov', src:'ctgov/uwa-csf'}},
        {k:'Existing buyers', v:'2 industry partners cited in 2024 acknowledgements', cite:{tag:'Smith 2025 acks', src:'PMC12345'}},
      ]
    },
  ];

  /* Citation chip — clickable; opens an evidence drawer (mock) */
  const Cite = ({c}) => (
    <span style={{
      display:'inline-flex',alignItems:'center',gap:5,
      padding:'2px 8px',
      border:'1px solid var(--bg-sunk)',
      background:'var(--bg-card)',
      borderRadius:999,
      fontFamily:'var(--mono)',fontSize:10,color:'var(--text-2)',
      cursor:'pointer',
    }}>
      <span style={{
        width:6,height:6,borderRadius:'50%',
        background: c.flag==='open'?'var(--accent-2)':'var(--brand-ink)'
      }}/>
      {c.tag}
      <span style={{color:'var(--text-3)'}}>↗</span>
    </span>
  );

  return (
    <div className="scr" style={{width:1200,height:820,position:'relative',overflowY:'auto',background:'var(--bg)'}}>
      {/* Sticky header */}
      <div style={{padding:'14px 30px',borderBottom:'1px solid var(--bg-sunk)',display:'flex',justifyContent:'space-between',alignItems:'center',background:'rgba(251,249,244,.92)',position:'sticky',top:0,zIndex:5,backdropFilter:'blur(10px)'}}>
        <span className="mono" style={{color:'var(--text)'}}>← Back to marketplace · 7 sites</span>
        <span className="thread-id">RUN-0438 / U-Washington</span>
      </div>

      {/* Hero */}
      <div style={{padding:'34px 34px 22px',borderBottom:'1px solid var(--bg-sunk)'}}>
        <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap'}}>
          <span className="pill outline-brand"><span className="dot brand"/> Rank 1 · Ready</span>
          <span className="tag">150 / 100 matched</span>
          <span className="tag">Seattle · USA</span>
          <span className="tag">2 – 3 wk lead time</span>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',gap:24}}>
          <div>
            <h1 className="serif" style={{fontSize:38,lineHeight:1.05,margin:0,color:'var(--text)',fontWeight:400}}>University of Washington</h1>
            <div style={{fontSize:13,color:'var(--text-2)',marginTop:6}}>UW Memory & Brain Wellness Center · Seattle, WA · uw.edu</div>
          </div>
          <div style={{display:'flex',alignItems:'baseline',gap:4}}>
            <span className="serif" style={{fontSize:48,color:'var(--brand-ink)',lineHeight:1,fontWeight:400}}>3.8</span>
            <span className="mono-sm" style={{color:'var(--text-3)'}}>/5 readiness</span>
          </div>
        </div>

        {/* Pillar bar with anchor evidence */}
        <div style={{marginTop:18,display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14}}>
          {[['SI','Specimen Info'],['CR','Contact & Routing'],['CF','Collection & Format'],['MD','Momentum & Depth']].map(([k,name])=>(
            <div key={k} style={{padding:'10px 14px',background:'var(--bg-card)',border:'1px solid var(--bg-sunk)',borderRadius:10}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
                <span className="mono-sm" style={{color:'var(--text-3)',letterSpacing:'.12em'}}>{k}</span>
                <span className="serif" style={{fontSize:18,color:'var(--text)'}}>{inst[k]}<span style={{fontSize:10,color:'var(--text-3)',fontFamily:'var(--mono)'}}>/5</span></span>
              </div>
              <div style={{height:4,background:'var(--bg-sunk)',borderRadius:2,overflow:'hidden',margin:'7px 0 8px'}}>
                <div style={{height:'100%',width:`${(inst[k]/5)*100}%`,background:'var(--brand-ink)'}}/>
              </div>
              <div style={{fontSize:11,color:'var(--text-2)',lineHeight:1.4}}>{name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Categorical evidence — every row cites its source */}
      <div style={{padding:'26px 34px 24px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:14}}>
          <div className="mono" style={{color:'var(--brand-ink)'}}>EVIDENCE REPORT · 22 FACTS · 8 SOURCES</div>
          <span className="mono-sm" style={{color:'var(--text-3)'}}>Click any citation to open the source</span>
        </div>

        {sections.map((s,si)=>(
          <div key={si} style={{marginBottom:22}}>
            <div className="mono" style={{color:'var(--text-2)',marginBottom:10,paddingBottom:6,borderBottom:'1px solid var(--bg-sunk)'}}>{s.cat}</div>
            <div style={{display:'flex',flexDirection:'column'}}>
              {s.rows.map((r,ri)=>(
                <div key={ri} style={{
                  display:'grid',
                  gridTemplateColumns:'200px 1fr auto',
                  gap:18,
                  padding:'11px 0',
                  borderBottom: ri<s.rows.length-1?'1px dashed var(--bg-sunk)':'none',
                  alignItems:'center',
                }}>
                  <span className="mono-sm" style={{color:'var(--text-3)',letterSpacing:'.08em'}}>{r.k}</span>
                  <span style={{fontSize:13.5,color:'var(--text)',lineHeight:1.4}}>
                    {r.v}
                    {r.cite.flag==='open' && <span className="tag warn" style={{marginLeft:8,fontSize:8.5,padding:'2px 6px'}}>VERIFY BEFORE QUOTE</span>}
                  </span>
                  <Cite c={r.cite}/>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Action footer */}
      <div style={{padding:'18px 34px 30px',borderTop:'1px solid var(--bg-sunk)',display:'flex',justifyContent:'space-between',alignItems:'center',gap:14,background:'var(--bg-card)'}}>
        <div className="mono-sm" style={{color:'var(--text-2)'}}>
          <span style={{color:'var(--brand-ink)'}}>21 of 22 facts</span> sourced · 1 open question (commercial-use scope)
        </div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn-o">Save to shortlist</button>
          <button className="btn-o">Export evidence (PDF)</button>
          <button className="btn-p brand">Draft outreach →</button>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { WF_Landing, WF_Expanded });
