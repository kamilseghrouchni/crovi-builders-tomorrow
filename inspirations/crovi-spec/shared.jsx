/* ============================================================
   Crovi Spec Flow — shared primitives
   ============================================================ */

/* The 11 phases from the spec */
const PHASES = [
  {id:'understand',  n:'0',  name:'UNDERSTAND',  sub:'parse request'},
  {id:'craft',       n:'0b', name:'CRAFT',       sub:'build query plan'},
  {id:'discover',    n:'1',  name:'DISCOVER',    sub:'breadth search'},
  {id:'triage',      n:'2',  name:'TRIAGE',      sub:'filter + select'},
  {id:'depth',       n:'3',  name:'DEPTH',       sub:'per-paper extraction'},
  {id:'aggregate',   n:'4',  name:'AGGREGATE',   sub:'group by institution'},
  {id:'enrich',      n:'4d', name:'ENRICH',      sub:'targeted data fill'},
  {id:'hypothesize', n:'5a', name:'HYPOTHESIZE', sub:'generate hypotheses'},
  {id:'verify',      n:'5b', name:'VERIFY',      sub:'execute verification'},
  {id:'evaluate',    n:'5c', name:'EVALUATE',    sub:'grade readiness'},
  {id:'deliver',     n:'7',  name:'DELIVER',     sub:'assemble output'},
];

/* Example request parsed from the spec (AD CSF case) */
const REQUEST = {
  title:'AD CSF specimens for WGBS methylation',
  indication:'Alzheimer\'s disease (AD)',
  specimen:'CSF · ≥500 μL per donor',
  modality:'WGBS (whole-genome bisulfite sequencing)',
  n_target:100,
  intent:'commission',
  budget:null,
  hard_negatives:['no PAXgene', 'no pooled samples'],
};

/* Horizontal phase stepper — current = 'depth' per user pref (freeze at Pass 3) */
const PhaseStepper = ({current='depth', compact=false}) => {
  const idx = PHASES.findIndex(p=>p.id===current);
  return (
    <div className="stepper" style={{gap:compact?3:5}}>
      {PHASES.map((p,i)=>{
        const state = i<idx?'done': i===idx?'active':'pending';
        return (
          <div key={p.id} className={`step ${state}`} style={{flex:1,minWidth:0}}>
            {!compact && <div className="lbl-row">
              <span className="ph-n">{p.n}</span>
            </div>}
            <div className="line"/>
            {!compact && <div className="ph-name" style={{whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.name}</div>}
          </div>
        );
      })}
    </div>
  );
};

/* Vertical phase stepper */
const VPhaseStepper = ({current='depth'}) => {
  const idx = PHASES.findIndex(p=>p.id===current);
  return (
    <div className="v-stepper">
      {PHASES.map((p,i)=>{
        const state = i<idx?'done': i===idx?'active':'pending';
        return (
          <div key={p.id} className={`v-step ${state}`}>
            <div className="node">{p.n}</div>
            <div style={{flex:1,paddingTop:3}}>
              <div className="mono-sm" style={{color: state==='active'?'var(--brand-ink)':(state==='done'?'var(--text)':'var(--text-3)'),textTransform:'uppercase',letterSpacing:'.14em'}}>{p.name}</div>
              <div style={{fontSize:11.5,color:'var(--text-2)',marginTop:2,fontFamily:'var(--mono)'}}>{p.sub}</div>
              {state==='active' && <div className="mono-sm" style={{color:'var(--brand-ink)',marginTop:4,display:'flex',alignItems:'center',gap:6}}><span className="live-dot"/>LIVE</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* Six-label data-trust badge (spec part 4) */
const LabelBadge = ({kind, text, compact=false}) => {
  const labels = {
    documented:  'DOCUMENTED',
    verified:    'VERIFIED',
    inferred:    'INFERRED',
    refuted:     'REFUTED',
    'not-stated':'NOT STATED',
    'open-q':    'OPEN QUESTION',
  };
  return (
    <span className={`lbl ${kind}`}>
      <span className="sq"/>
      {!compact && <span>{text || labels[kind]}</span>}
    </span>
  );
};

const LabelLegend = () => (
  <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
    {['documented','verified','inferred','refuted','not-stated','open-q'].map(k=>
      <LabelBadge key={k} kind={k}/>
    )}
  </div>
);

/* Four pillar mini-bars — SI CR CF MD */
const PillarBars = ({SI=0, CR=0, CF=0, MD=0, max=5, showLabels=true, size='sm'}) => {
  const pillars = [['SI',SI],['CR',CR],['CF',CF],['MD',MD]];
  const w = size==='lg'?48:28;
  return (
    <div className="pillar-bars" style={{gap: size==='lg'?8:5}}>
      {pillars.map(([k,v])=>(
        <div key={k} className="pillar">
          <div className="bar" style={{width:w, height: size==='lg'?6:4}}>
            <span style={{width:`${Math.min(100,(v/max)*100)}%`}}/>
          </div>
          {showLabels && <div className="k">{k}</div>}
        </div>
      ))}
    </div>
  );
};

/* Institution — the mock dataset used throughout */
const INSTITUTIONS = [
  {id:'uwa', name:'University of Washington', short:'U-Wash · Seattle', size:'large',
    SI:4, CR:3, CF:4, MD:4, readiness:3.8, ready:true, papers:7, trials:2, contact:'email',
    headline:'CSF, n=150, -80°C',
    fact:'150 CSF vials documented in Smith 2025 · PI email found',
    gap:'Commercial-use consent scope not confirmed',
    anchors:{SI:'Types & N documented', CR:'Email found, consent unclear', CF:'Full protocol documented', MD:'3 papers in 24mo, active'}},
  {id:'umn', name:'Mayo Clinic', short:'Mayo · Rochester', size:'large',
    SI:4, CR:4, CF:3, MD:3, readiness:3.6, ready:true, papers:5, trials:4, contact:'email',
    headline:'CSF, n=92, -80°C',
    fact:'92 CSF vials · biobank director email on institutional site',
    gap:'Storage protocol partially documented',
    anchors:{SI:'N confirmed, types clear', CR:'Contact + sharing policy found', CF:'Missing centrifuge protocol', MD:'Consistent output'}},
  {id:'jhu', name:'Johns Hopkins · BIOCARD', short:'JHU · Baltimore', size:'large',
    SI:3, CR:2, CF:4, MD:4, readiness:3.2, ready:true, papers:9, trials:1, contact:'institution',
    headline:'CSF, n~200, -80°C (inferred)',
    fact:'Cited ~200 CSF samples in BIOCARD cohort',
    gap:'No direct PI contact; go through biobank portal',
    anchors:{SI:'N inferred from paper', CR:'Portal only', CF:'Excellent protocol', MD:'High output, long run'}},
  {id:'ucsf', name:'UCSF Memory & Aging', short:'UCSF · San Francisco', size:'mid',
    SI:3, CR:3, CF:3, MD:3, readiness:3.0, ready:true, papers:4, trials:2, contact:'email',
    headline:'CSF, n~80, -80°C',
    fact:'~80 CSF samples referenced · PI corresponding author',
    gap:'Sharing policy not stated',
    anchors:{SI:'Reasonable documentation', CR:'Email found', CF:'Adequate', MD:'Steady'}},
  {id:'wu', name:'Washington U · Knight ADRC', short:'Knight ADRC · St Louis', size:'large',
    SI:4, CR:2, CF:4, MD:5, readiness:3.4, ready:true, papers:12, trials:3, contact:'institution',
    headline:'CSF, n~300+, -80°C',
    fact:'Major ADRC cohort · 12 papers cited, 3 active trials',
    gap:'Direct contact buried; institutional only',
    anchors:{SI:'Excellent',CR:'No direct PI', CF:'Robust', MD:'Leader'}},
  {id:'duke', name:'Duke ADRC', short:'Duke · Durham', size:'mid',
    SI:2, CR:1, CF:2, MD:2, readiness:2.0, ready:false, papers:2, trials:0, contact:'none',
    headline:'CSF mentioned, N unclear',
    fact:'Limited paper output; no contact discoverable',
    gap:'All 4 pillars thin; needs enrichment',
    anchors:{SI:'Thin',CR:'None',CF:'Implied',MD:'Low'}},
  {id:'penn', name:'Penn ADRC', short:'Penn · Philadelphia', size:'mid',
    SI:3, CR:3, CF:3, MD:4, readiness:3.3, ready:true, papers:6, trials:1, contact:'email',
    headline:'CSF, n~120, -80°C',
    fact:'Consistent AD CSF work; PI reachable',
    gap:'Consent scope not confirmed',
    anchors:{SI:'Good',CR:'Email',CF:'Good',MD:'Strong'}},
];

/* Institution row — used in list/aggregate screens */
const InstitutionRow = ({inst, selected, dark=false}) => {
  const contactIcon = {email:'●', institution:'◐', none:'○'}[inst.contact];
  const contactColor = {email:'var(--brand-ink)', institution:'var(--text-2)', none:'var(--text-3)'}[inst.contact];
  const bg = selected ? (dark?'oklch(0.18 0.02 250)':'var(--brand-fill)') : (dark?'transparent':'#FBF9F4');
  const border = selected ? (dark?'var(--brand-hi)':'var(--brand-ink)') : (dark?'var(--ink-3)':'var(--bg-sunk)');
  const textC = dark?'var(--ink-text)':'var(--text)';
  const text2C = dark?'var(--ink-text-2)':'var(--text-2)';
  const text3C = dark?'var(--ink-text-3)':'var(--text-3)';
  return (
    <div style={{padding:'14px 16px',background:bg,border:`1px solid ${border}`,borderRadius:12,display:'flex',flexDirection:'column',gap:8}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:10}}>
        <div style={{flex:1,minWidth:0}}>
          <div className="serif" style={{fontSize:16,lineHeight:1.2,color:textC,fontWeight:400}}>{inst.name}</div>
          <div className="mono-sm" style={{color:text3C,marginTop:3,textTransform:'uppercase',letterSpacing:'.1em'}}>{inst.short} · {inst.papers}p · {inst.trials}t</div>
        </div>
        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
          <div style={{display:'flex',alignItems:'baseline',gap:4}}>
            <span className="serif" style={{fontSize:22,color:inst.ready?'var(--brand-ink)':text3C,lineHeight:1}}>{inst.readiness.toFixed(1)}</span>
            <span className="mono-sm" style={{color:text3C}}>/5</span>
          </div>
          {inst.ready && <span className="tag brand" style={{fontSize:8.5,padding:'2px 6px'}}>READY</span>}
        </div>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10}}>
        <PillarBars {...inst}/>
        <span style={{color:contactColor,fontSize:12,fontFamily:'var(--mono)'}}>{contactIcon}</span>
      </div>
      <div style={{fontFamily:'var(--mono)',fontSize:10.5,color:text2C,lineHeight:1.4}}>{inst.headline}</div>
    </div>
  );
};

/* Make primitives global so other scripts can read them */
Object.assign(window, { PHASES, REQUEST, INSTITUTIONS, PhaseStepper, VPhaseStepper, LabelBadge, LabelLegend, PillarBars, InstitutionRow });
