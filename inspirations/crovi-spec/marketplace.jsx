/* ============================================================
   Crovi Spec Flow — Marketplace
   Browse biospecimen opportunities across all institutions the
   agent found. Two modes: TILES (per-site cards) and TABLE (full
   list with features). Clicking either jumps to the dossier (S14).
   ============================================================ */

/* ---------------- Opportunity dataset ----------------
   Each institution can expose multiple concrete "opportunities"
   (cohorts / sample sets). The agent flattens them so the user
   can shop across sites rather than only browse by org. */
const OPPORTUNITIES = [
  { id:'op-uwa-1', inst:'uwa', org:'University of Washington', short:'U-Wash · Seattle',
    cohort:'UW-AD-CSF-2025', specimen:'CSF', n:150, volume:'≥500 μL',
    preservation:'Frozen · -80°C', stage:'Mild–Moderate AD',
    availability:'available', leadtime:'2–3 weeks', consent:'Broad',
    commercial:'confirmed', readiness:3.8, ready:true,
    anchor:'Smith et al. 2025 · PMC12345',
    SI:4, CR:3, CF:4, MD:4,
    highlights:['PI email confirmed','Full methods in paper','Commission capacity'],
    gaps:['Consent scope for WGBS unconfirmed'] },

  { id:'op-mayo-1', inst:'umn', org:'Mayo Clinic', short:'Mayo · Rochester',
    cohort:'MAYO-ADRC-BB', specimen:'CSF', n:92, volume:'~500 μL',
    preservation:'Frozen · -80°C', stage:'Mild AD + MCI',
    availability:'available', leadtime:'3–4 weeks', consent:'Broad',
    commercial:'confirmed', readiness:3.6, ready:true,
    anchor:'Mayo 2024 · PMC22891',
    SI:4, CR:4, CF:3, MD:3,
    highlights:['Biobank director reachable','Published sharing policy'],
    gaps:['Centrifuge protocol inferred'] },

  { id:'op-jhu-1', inst:'jhu', org:'Johns Hopkins · BIOCARD', short:'JHU · Baltimore',
    cohort:'BIOCARD-LONG', specimen:'CSF', n:200, volume:'≥500 μL',
    preservation:'Frozen · -80°C', stage:'Preclinical–MCI',
    availability:'portal', leadtime:'4–6 weeks', consent:'Broad',
    commercial:'portal-gated', readiness:3.2, ready:true,
    anchor:'BIOCARD · PMC41122',
    SI:3, CR:2, CF:4, MD:4,
    highlights:['Longitudinal design','Excellent protocol'],
    gaps:['Portal only — no direct PI','Lead-time 4–6 weeks'] },

  { id:'op-ucsf-1', inst:'ucsf', org:'UCSF Memory & Aging', short:'UCSF · SF',
    cohort:'UCSF-MAC-CSF', specimen:'CSF', n:80, volume:'400–500 μL',
    preservation:'Frozen · -80°C', stage:'Mild AD',
    availability:'on-IRB', leadtime:'6–8 weeks', consent:'Study-specific',
    commercial:'unclear', readiness:3.0, ready:true,
    anchor:'UCSF WGBS · PMC89012',
    SI:3, CR:3, CF:3, MD:3,
    highlights:['WGBS precedent on cohort','PI reachable'],
    gaps:['Sharing policy not stated'] },

  { id:'op-wu-1', inst:'wu', org:'Wash U · Knight ADRC', short:'Knight · St Louis',
    cohort:'KNIGHT-ADRC-CSF', specimen:'CSF', n:300, volume:'≥500 μL',
    preservation:'Frozen · -80°C', stage:'Preclinical–AD',
    availability:'governance', leadtime:'6–10 weeks', consent:'Tiered',
    commercial:'governance-gated', readiness:3.4, ready:true,
    anchor:'Knight ADRC · PMC77231',
    SI:4, CR:2, CF:4, MD:5,
    highlights:['300+ samples','Consortium depth'],
    gaps:['Contact via institutional only','Tiered consent tiers unclear'] },

  { id:'op-penn-1', inst:'penn', org:'Penn ADRC', short:'Penn · Philadelphia',
    cohort:'PENN-ADRC-CSF', specimen:'CSF', n:120, volume:'~500 μL',
    preservation:'Frozen · -80°C', stage:'Mild AD',
    availability:'available', leadtime:'3–5 weeks', consent:'Broad',
    commercial:'likely', readiness:3.3, ready:true,
    anchor:'Penn 2023 · PMC33441',
    SI:3, CR:3, CF:3, MD:4,
    highlights:['PI reachable','Consistent output'],
    gaps:['Commercial consent language needs review'] },

  { id:'op-duke-1', inst:'duke', org:'Duke ADRC', short:'Duke · Durham',
    cohort:'DUKE-AGING-CSF', specimen:'CSF', n:null, volume:'unknown',
    preservation:'Frozen · -80°C', stage:'AD (unclear N)',
    availability:'unknown', leadtime:'unknown', consent:'unknown',
    commercial:'unknown', readiness:2.0, ready:false,
    anchor:'Duke aging · PMC99010',
    SI:2, CR:1, CF:2, MD:2,
    highlights:['Samples exist'],
    gaps:['All 4 pillars thin','No discoverable contact'] },
];

/* ---------------- Shared bits ---------------- */
const availabilityPill = (a) => {
  const map = {
    available:   {t:'AVAILABLE',     kind:'brand'},
    portal:      {t:'VIA PORTAL',    kind:''},
    'on-IRB':    {t:'ON IRB',        kind:''},
    governance:  {t:'GOVERNANCE',    kind:''},
    unknown:     {t:'UNKNOWN',       kind:'warn'},
  };
  const m = map[a] || {t:a.toUpperCase(),kind:''};
  return <span className={`tag ${m.kind}`}>{m.t}</span>;
};

const ReadinessDial = ({val, ready, size=52}) => {
  const pct = Math.min(100, (val/5)*100);
  const r = (size-6)/2;
  const c = 2*Math.PI*r;
  const color = ready?'var(--brand-ink)':'var(--text-3)';
  return (
    <div style={{position:'relative',width:size,height:size,flexShrink:0}}>
      <svg width={size} height={size} style={{transform:'rotate(-90deg)'}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-sunk)" strokeWidth="3"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${c*pct/100} ${c}`} strokeLinecap="round"/>
      </svg>
      <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
        <span className="serif" style={{fontSize:size*0.32,color,lineHeight:1,fontWeight:400}}>{val.toFixed(1)}</span>
        <span className="mono-sm" style={{fontSize:7,color:'var(--text-3)',letterSpacing:'.1em'}}>/5</span>
      </div>
    </div>
  );
};

/* ---------------- Tile card ---------------- */
const OppTile = ({op, accent=false}) => (
  <div className="card-cream" style={{
    padding:'18px 20px', display:'flex', flexDirection:'column', gap:12,
    position:'relative', cursor:'pointer',
    borderColor: accent?'var(--brand-ink)':'var(--bg-sunk)',
    background: accent?'linear-gradient(180deg, var(--brand-fill) 0%, var(--bg-card) 100%)':'var(--bg-card)',
  }}>
    {/* Top row: institution + readiness */}
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
      <div style={{flex:1,minWidth:0}}>
        <div className="mono-sm" style={{color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:3}}>{op.short}</div>
        <div className="serif" style={{fontSize:19,color:'var(--text)',lineHeight:1.2,fontWeight:400}}>{op.org}</div>
      </div>
      <ReadinessDial val={op.readiness} ready={op.ready}/>
    </div>

    {/* Headline specimen stats */}
    <div style={{display:'flex',gap:16,alignItems:'baseline',paddingTop:4,paddingBottom:4,borderTop:'1px dashed var(--bg-sunk)',borderBottom:'1px dashed var(--bg-sunk)'}}>
      <div style={{display:'flex',flexDirection:'column'}}>
        <span className="mono-sm" style={{color:'var(--text-3)',fontSize:9,letterSpacing:'.1em'}}>SPECIMEN</span>
        <span className="serif" style={{fontSize:15,color:'var(--text)'}}>{op.specimen}</span>
      </div>
      <div style={{display:'flex',flexDirection:'column'}}>
        <span className="mono-sm" style={{color:'var(--text-3)',fontSize:9,letterSpacing:'.1em'}}>N</span>
        <span className="serif" style={{fontSize:15,color:'var(--text)'}}>{op.n ?? '—'}</span>
      </div>
      <div style={{display:'flex',flexDirection:'column',marginLeft:'auto',textAlign:'right'}}>
        <span className="mono-sm" style={{color:'var(--text-3)',fontSize:9,letterSpacing:'.1em'}}>LEAD TIME</span>
        <span style={{fontFamily:'var(--mono)',fontSize:12,color:'var(--text)'}}>{op.leadtime}</span>
      </div>
    </div>

    {/* Meta row */}
    <div style={{display:'flex',flexDirection:'column',gap:6}}>
      {[
        ['Volume', op.volume],
        ['Preservation', op.preservation],
        ['Stage', op.stage],
        ['Consent', op.consent],
      ].map(([k,v])=>(
        <div key={k} style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:10}}>
          <span className="mono-sm" style={{color:'var(--text-3)'}}>{k.toUpperCase()}</span>
          <span style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text-2)',textAlign:'right'}}>{v}</span>
        </div>
      ))}
    </div>

    {/* Bottom — pillar bars + availability pill */}
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'auto',paddingTop:10,borderTop:'1px dashed var(--bg-sunk)'}}>
      <PillarBars {...op} showLabels={false}/>
      {availabilityPill(op.availability)}
    </div>

    <button className="btn-o" style={{width:'100%',justifyContent:'center',marginTop:4,fontSize:11.5,letterSpacing:'.12em',textTransform:'uppercase',fontFamily:'var(--mono)',padding:'9px 14px'}}>
      View dossier →
    </button>
  </div>
);

/* ---------------- Marketplace — TILES ---------------- */
const MarketplaceTiles = () => {
  const [filter, setFilter] = React.useState('all');
  const shown = filter==='ready'
    ? OPPORTUNITIES.filter(o=>o.ready)
    : filter==='available'
    ? OPPORTUNITIES.filter(o=>o.availability==='available')
    : OPPORTUNITIES;
  const ranked = [...shown].sort((a,b)=>b.readiness-a.readiness);

  return (
    <div className="scr" style={{width:1400,height:960,display:'flex',flexDirection:'column',background:'var(--bg)'}}>
      {/* Header */}
      <div style={{padding:'22px 34px 18px',borderBottom:'1px solid var(--bg-sunk)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:12}}>
          <div>
            <span className="mono" style={{color:'var(--brand-ink)'}}>MARKETPLACE · RUN-0438</span>
            <div className="serif" style={{fontSize:26,color:'var(--text)',marginTop:4,fontWeight:400}}>{REQUEST.title}</div>
            <div className="mono-sm" style={{color:'var(--text-2)',marginTop:6,textTransform:'uppercase',letterSpacing:'.08em'}}>
              {OPPORTUNITIES.length} opportunities · {OPPORTUNITIES.filter(o=>o.ready).length} ready · across 7 institutions
            </div>
          </div>
          <div style={{display:'flex',gap:6,alignItems:'center'}}>
            <div style={{display:'inline-flex',background:'var(--bg-card)',border:'1px solid var(--bg-sunk)',borderRadius:999,padding:3}}>
              <button className="mono-sm" onClick={()=>setFilter('all')}     style={viewTabStyle(filter==='all')}>ALL</button>
              <button className="mono-sm" onClick={()=>setFilter('ready')}   style={viewTabStyle(filter==='ready')}>READY</button>
              <button className="mono-sm" onClick={()=>setFilter('available')} style={viewTabStyle(filter==='available')}>AVAILABLE</button>
            </div>
            <div style={{width:1,height:24,background:'var(--bg-sunk)',margin:'0 6px'}}/>
            <div style={{display:'inline-flex',background:'var(--bg-card)',border:'1px solid var(--bg-sunk)',borderRadius:999,padding:3}}>
              <span className="mono-sm" style={{...viewTabStyle(true),cursor:'default'}}>◨ TILES</span>
              <span className="mono-sm" style={{...viewTabStyle(false),cursor:'default'}}>☰ TABLE</span>
            </div>
          </div>
        </div>

        {/* Filter row */}
        <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
          <span className="mono-sm" style={{color:'var(--text-3)',marginRight:4}}>FILTERS ·</span>
          <span className="tag">CSF</span>
          <span className="tag">n ≥ 50</span>
          <span className="tag">-80°C</span>
          <span className="tag brand">READY ONLY</span>
          <span className="tag warn">NO PAXgene</span>
          <span className="tag warn">NO POOLED</span>
          <span style={{marginLeft:'auto'}} className="mono-sm"><span style={{color:'var(--text-3)'}}>SORT ·</span> <span style={{color:'var(--brand-ink)'}}>READINESS ↓</span></span>
        </div>
      </div>

      {/* Grid */}
      <div style={{flex:1,overflow:'auto',padding:'26px 34px'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3, 1fr)',gap:18}}>
          {ranked.map((op,i)=>(
            <OppTile key={op.id} op={op} accent={i===0}/>
          ))}
        </div>
      </div>
    </div>
  );
};

const viewTabStyle = (active) => ({
  padding:'6px 12px', borderRadius:999, border:0,
  background: active?'var(--text)':'transparent',
  color: active?'var(--bg)':'var(--text-2)',
  cursor:'pointer', fontFamily:'var(--mono)', fontSize:10,
  letterSpacing:'.1em', textTransform:'uppercase',
});

/* ---------------- Marketplace — TABLE ---------------- */
const MarketplaceTable = () => {
  const ranked = [...OPPORTUNITIES].sort((a,b)=>b.readiness-a.readiness);
  return (
    <div className="scr" style={{width:1400,height:820,display:'flex',flexDirection:'column',background:'var(--bg)'}}>
      <div style={{padding:'22px 34px 18px',borderBottom:'1px solid var(--bg-sunk)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:12}}>
          <div>
            <span className="mono" style={{color:'var(--brand-ink)'}}>MARKETPLACE · TABLE</span>
            <div className="serif" style={{fontSize:26,color:'var(--text)',marginTop:4,fontWeight:400}}>{REQUEST.title}</div>
            <div className="mono-sm" style={{color:'var(--text-2)',marginTop:6,textTransform:'uppercase',letterSpacing:'.08em'}}>
              {OPPORTUNITIES.length} opportunities · features across 12 columns
            </div>
          </div>
          <div style={{display:'inline-flex',background:'var(--bg-card)',border:'1px solid var(--bg-sunk)',borderRadius:999,padding:3}}>
            <span className="mono-sm" style={{...viewTabStyle(false),cursor:'default'}}>◨ TILES</span>
            <span className="mono-sm" style={{...viewTabStyle(true),cursor:'default'}}>☰ TABLE</span>
          </div>
        </div>

        <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
          <span className="mono-sm" style={{color:'var(--text-3)',marginRight:4}}>FILTERS ·</span>
          <span className="tag">CSF</span>
          <span className="tag">n ≥ 50</span>
          <span className="tag">-80°C</span>
          <span className="tag brand">READY</span>
          <span className="tag warn">NO PAXgene</span>
        </div>
      </div>

      {/* Table */}
      <div style={{flex:1,overflow:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontFamily:'var(--body)'}}>
          <thead style={{position:'sticky',top:0,background:'var(--bg-card)',zIndex:1}}>
            <tr>
              {['Institution / Cohort','Specimen','N','Volume','Preservation','Stage','Consent','Commercial','Lead time','SI · CR · CF · MD','Ready','Availability',''].map((h,i)=>(
                <th key={i} className="mono-sm" style={{
                  textAlign: i===2||i===10?'center':'left',
                  padding:'12px 14px',
                  color:'var(--text-3)',
                  textTransform:'uppercase',
                  letterSpacing:'.1em',
                  fontWeight:400,
                  borderBottom:'1px solid var(--bg-sunk)',
                  fontSize:9.5,
                  whiteSpace:'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ranked.map((op,i)=>(
              <tr key={op.id} style={{
                background: i===0?'var(--brand-fill)':'transparent',
                borderBottom:'1px solid var(--bg-sunk)',
                cursor:'pointer',
              }}>
                <td style={{padding:'14px 14px'}}>
                  <div className="serif" style={{fontSize:14,color:'var(--text)',lineHeight:1.2}}>{op.org}</div>
                  <div className="mono-sm" style={{color:'var(--text-3)',marginTop:2,textTransform:'uppercase',letterSpacing:'.08em'}}>{op.cohort}</div>
                </td>
                <td style={{padding:'14px 14px',fontSize:12,color:'var(--text)'}}>{op.specimen}</td>
                <td style={{padding:'14px 14px',textAlign:'center'}}>
                  <span className="serif" style={{fontSize:16,color:op.ready?'var(--brand-ink)':'var(--text-3)'}}>{op.n ?? '—'}</span>
                </td>
                <td style={{padding:'14px 14px',fontFamily:'var(--mono)',fontSize:11,color:'var(--text-2)'}}>{op.volume}</td>
                <td style={{padding:'14px 14px',fontFamily:'var(--mono)',fontSize:11,color:'var(--text-2)'}}>{op.preservation}</td>
                <td style={{padding:'14px 14px',fontSize:12,color:'var(--text-2)'}}>{op.stage}</td>
                <td style={{padding:'14px 14px',fontSize:12,color:'var(--text-2)'}}>{op.consent}</td>
                <td style={{padding:'14px 14px'}}>
                  <LabelBadge
                    kind={op.commercial==='confirmed'?'verified': op.commercial==='unknown'||op.commercial==='unclear'?'open-q':'inferred'}
                    text={op.commercial.toUpperCase()}
                    compact={false}
                  />
                </td>
                <td style={{padding:'14px 14px',fontFamily:'var(--mono)',fontSize:11,color:'var(--text-2)'}}>{op.leadtime}</td>
                <td style={{padding:'14px 14px'}}><PillarBars {...op} showLabels={false}/></td>
                <td style={{padding:'14px 14px',textAlign:'center'}}>
                  <div style={{display:'flex',alignItems:'baseline',justifyContent:'center',gap:3}}>
                    <span className="serif" style={{fontSize:17,color:op.ready?'var(--brand-ink)':'var(--text-3)',lineHeight:1}}>{op.readiness.toFixed(1)}</span>
                    <span className="mono-sm" style={{color:'var(--text-3)',fontSize:9}}>/5</span>
                  </div>
                </td>
                <td style={{padding:'14px 14px'}}>{availabilityPill(op.availability)}</td>
                <td style={{padding:'14px 14px',textAlign:'right'}}>
                  <span className="mono-sm" style={{color:'var(--brand-ink)'}}>OPEN →</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

Object.assign(window, { OPPORTUNITIES, OppTile, MarketplaceTiles, MarketplaceTable });
