/* ============================================================
   Crovi Spec Flow — Running (mid Pass 3: depth extraction)
   Three layout variants:
     A · Top stepper + left event feed + right institution board
     B · Vertical phase timeline + center event stream + right scoreboard
     C · Single calm log, phases as section headers
   ============================================================ */

/* Sample depth-extraction state — frozen at Pass 3 */
const DEPTH_PAPERS = [
  {pmid:'PMC12345', title:'CSF biomarker landscape in mild AD (Smith 2025)', inst:'U-Washington', status:'done', fit:'strong',
    pillars:{SI:{facts:5,gaps:0,h:'n=150, CSF, -80°C'}, CR:{facts:3,gaps:1,h:'PI email found'}, CF:{facts:4,gaps:1,h:'Centrifuge 2000g 10min'}, MD:{facts:4,gaps:0,h:'3 papers in 24mo'}}},
  {pmid:'PMC22891', title:'Methylation in Alzheimer progression (Mayo 2024)', inst:'Mayo Clinic', status:'done', fit:'strong',
    pillars:{SI:{facts:4,gaps:1,h:'n=92, CSF'}, CR:{facts:4,gaps:0,h:'Biobank email'}, CF:{facts:3,gaps:2,h:'storage -80°C'}, MD:{facts:3,gaps:1,h:'Consistent'}}},
  {pmid:'PMC41122', title:'Longitudinal CSF cohort analysis (BIOCARD)', inst:'Johns Hopkins', status:'done', fit:'strong',
    pillars:{SI:{facts:3,gaps:1,h:'n~200 inferred'}, CR:{facts:2,gaps:2,h:'portal only'}, CF:{facts:4,gaps:0,h:'full protocol'}, MD:{facts:4,gaps:0,h:'9 papers'}}},
  {pmid:'PMC89012', title:'WGBS in CSF-derived nucleic acids (UCSF)', inst:'UCSF M&A', status:'active', fit:'partial',
    pillars:{SI:{facts:2,gaps:1,h:'extracting…'}, CR:{facts:1,gaps:0,h:'…'}, CF:{facts:2,gaps:1,h:'…'}, MD:{facts:2,gaps:0,h:'…'}}},
  {pmid:'PMC77231', title:'ADRC cohort biomarker paper (Knight 2023)', inst:'Wash U Knight', status:'active', fit:'partial',
    pillars:{SI:{facts:3,gaps:0,h:'n~300'}, CR:{facts:1,gaps:1,h:'…'}, CF:{facts:2,gaps:0,h:'…'}, MD:{facts:3,gaps:0,h:'…'}}},
  {pmid:'PMC55001', title:'Knight ADRC cross-sectional (2024)', inst:'Wash U Knight', status:'queued', fit:null, pillars:null},
  {pmid:'PMC33441', title:'Penn ADRC methylation follow-up', inst:'Penn ADRC', status:'queued', fit:null, pillars:null},
  {pmid:'PMC99010', title:'Duke aging cohort CSF panel', inst:'Duke ADRC', status:'queued', fit:null, pillars:null},
];

/* Structured log events for Pass 3 */
const DEPTH_LOG = [
  {t:'00:03:42', phase:'discover',   type:'phase_complete', text:'DISCOVER · 47 papers found · 4 sources queried · 12s'},
  {t:'00:04:18', phase:'triage',     type:'phase_complete', text:'TRIAGE · 12 papers kept · 35 rejected · indication fit + power screen'},
  {t:'00:04:21', phase:'depth',      type:'phase_start',    text:'DEPTH · spawning 8 per-paper extraction agents in parallel'},
  {t:'00:05:04', phase:'depth',      type:'depth_complete', text:'PMC12345 · Smith 2025 · SI:5 CR:3 CF:4 MD:4 · FIT strong', ok:true},
  {t:'00:05:18', phase:'depth',      type:'depth_complete', text:'PMC22891 · Mayo 2024 · SI:4 CR:4 CF:3 MD:3 · FIT strong', ok:true},
  {t:'00:05:42', phase:'depth',      type:'depth_complete', text:'PMC41122 · BIOCARD · SI:3 CR:2 CF:4 MD:4 · FIT strong', ok:true},
  {t:'00:05:58', phase:'depth',      type:'depth_active',   text:'PMC89012 · UCSF · reading methods section …', active:true},
  {t:'00:06:12', phase:'depth',      type:'depth_active',   text:'PMC77231 · Knight · extracting specimen metadata …', active:true},
];

/* Mini pillar chart for depth-extraction cards */
const DepthPillars = ({pillars}) => {
  if (!pillars) return <div style={{height:30}}/>;
  return (
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6,marginTop:8}}>
      {Object.entries(pillars).map(([k,v])=>(
        <div key={k}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:2}}>
            <span className="mono-sm" style={{color:'var(--text-3)',fontSize:8.5}}>{k}</span>
            <span className="mono-sm" style={{color:v.facts>v.gaps?'var(--brand-ink)':'var(--text-3)',fontSize:8.5}}>{v.facts}/{v.facts+v.gaps}</span>
          </div>
          <div style={{height:3,background:'var(--bg-sunk)',borderRadius:1.5,overflow:'hidden'}}>
            <div style={{height:'100%',width:`${(v.facts/(v.facts+v.gaps||1))*100}%`,background:'var(--brand-ink)'}}/>
          </div>
          <div className="mono-sm" style={{fontSize:8,color:'var(--text-2)',marginTop:2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{v.h}</div>
        </div>
      ))}
    </div>
  );
};

const DepthCard = ({paper}) => {
  const fitC = paper.fit==='strong'?'var(--brand-ink)': paper.fit==='partial'?'var(--text-2)':'var(--text-3)';
  return (
    <div className="card-cream" style={{padding:'12px 14px',display:'flex',flexDirection:'column',gap:4,opacity: paper.status==='queued'?0.5:1,position:'relative'}}>
      {paper.status==='active' && <span className="live-dot" style={{position:'absolute',top:12,right:12}}/>}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:8}}>
        <span className="mono-sm" style={{color:'var(--text-3)',textTransform:'uppercase'}}>{paper.pmid}</span>
        {paper.fit && <span className="mono-sm" style={{color:fitC,textTransform:'uppercase',letterSpacing:'.1em'}}>FIT {paper.fit}</span>}
        {paper.status==='queued' && <span className="mono-sm" style={{color:'var(--text-3)',textTransform:'uppercase'}}>QUEUED</span>}
      </div>
      <div style={{fontSize:12.5,lineHeight:1.35,color:'var(--text)'}}>{paper.title}</div>
      <div className="mono-sm" style={{color:'var(--text-2)',fontSize:9.5}}>{paper.inst}</div>
      <DepthPillars pillars={paper.pillars}/>
    </div>
  );
};

/* Parse-request card — shown at top of any Running screen */
const ParsedRequestCard = ({compact=false}) => (
  <div className="card-cream" style={{padding:compact?'12px 14px':'16px 18px'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:6}}>
      <span className="mono" style={{color:'var(--brand-ink)'}}>REQUEST</span>
      <span className="thread-id">RUN-0438 · {REQUEST.intent.toUpperCase()}</span>
    </div>
    <div className="serif" style={{fontSize:17,lineHeight:1.25,color:'var(--text)',marginBottom:8,fontWeight:400}}>{REQUEST.title}</div>
    <div style={{display:'flex',gap:5,flexWrap:'wrap',alignItems:'center'}}>
      <span className="tag">{REQUEST.indication}</span>
      <span className="tag">{REQUEST.specimen}</span>
      <span className="tag">{REQUEST.modality}</span>
      <span className="tag">n ≥ {REQUEST.n_target}</span>
      {REQUEST.hard_negatives.map(h=><span key={h} className="tag warn">NO {h}</span>)}
    </div>
  </div>
);

/* Institution scoreboard (partial at Pass 3) */
const InstitutionScoreboard = ({partial=true}) => (
  <div style={{display:'flex',flexDirection:'column',gap:8}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
      <span className="mono" style={{color:'var(--brand-ink)'}}>INSTITUTIONS · FORMING</span>
      <span className="mono-sm" style={{color:'var(--text-3)',textTransform:'uppercase'}}>{INSTITUTIONS.filter(i=>i.readiness>0).length} identified · pending aggregate</span>
    </div>
    {INSTITUTIONS.slice(0,5).map(inst=>{
      const f = partial ? Math.min(1, inst.readiness/2) : 1;
      return (
        <div key={inst.id} className="card-cream" style={{padding:'11px 13px',opacity: partial?0.85:1}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:5}}>
            <span className="serif" style={{fontSize:14,color:'var(--text)'}}>{inst.name}</span>
            <span className="mono-sm" style={{color:'var(--text-3)',textTransform:'uppercase'}}>{inst.papers}p · {inst.trials}t</span>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <PillarBars SI={inst.SI*f} CR={inst.CR*f} CF={inst.CF*f} MD={inst.MD*f} showLabels={false}/>
            <span className="mono-sm" style={{color:'var(--text-3)',fontSize:9}}>{partial?'BUILDING…':'READY'}</span>
          </div>
        </div>
      );
    })}
  </div>
);

/* ---------- Variant A · Top stepper + feed + board ---------- */
const RunningA = () => (
  <div className="scr" style={{width:1400,height:820,display:'flex',flexDirection:'column',background:'var(--bg)'}}>
    {/* Top bar */}
    <div style={{padding:'18px 30px 16px',borderBottom:'1px solid var(--bg-sunk)'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:12}}>
        <div>
          <span className="mono" style={{color:'var(--brand-ink)'}}>RUN IN PROGRESS</span>
          <span className="thread-id" style={{marginLeft:12}}>00:06:22 ELAPSED · 5 OF 11 PHASES</span>
        </div>
        <div style={{display:'flex',gap:8}}>
          <span className="tag">PAUSE</span>
          <span className="tag">LOG ↗</span>
        </div>
      </div>
      <PhaseStepper current="depth"/>
    </div>

    {/* Body */}
    <div style={{flex:1,display:'grid',gridTemplateColumns:'340px 1fr 360px',gap:0,overflow:'hidden'}}>
      {/* Left — event feed */}
      <div style={{padding:'20px 20px',borderRight:'1px solid var(--bg-sunk)',overflow:'hidden',display:'flex',flexDirection:'column',gap:14}}>
        <ParsedRequestCard compact/>
        <div>
          <div className="mono" style={{color:'var(--brand-ink)',marginBottom:10}}>EVENT LOG</div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {DEPTH_LOG.map((e,i)=>(
              <div key={i} style={{display:'flex',gap:10,alignItems:'flex-start',paddingBottom:10,borderBottom:i<DEPTH_LOG.length-1?'1px dashed var(--bg-sunk)':'none'}}>
                <span className="mono-sm" style={{color:'var(--text-3)',fontSize:9,minWidth:48,flexShrink:0,paddingTop:2}}>{e.t}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div className="mono-sm" style={{color: e.active?'var(--brand-ink)':'var(--text-3)',textTransform:'uppercase',fontSize:8.5,letterSpacing:'.1em',marginBottom:2}}>
                    {e.active && <span className="live-dot" style={{marginRight:4}}/>}
                    {e.phase}
                  </div>
                  <div style={{fontSize:11.5,color: e.active?'var(--brand-ink)':(e.ok?'var(--text)':'var(--text-2)'),fontFamily:'var(--mono)',lineHeight:1.4}}>{e.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Center — depth grid */}
      <div style={{padding:'20px 22px',overflow:'hidden',display:'flex',flexDirection:'column'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:12}}>
          <div>
            <div className="mono" style={{color:'var(--brand-ink)',marginBottom:4}}>PASS 3 · DEPTH</div>
            <div className="serif" style={{fontSize:20,color:'var(--text)',fontWeight:400}}>Extracting per-paper evidence · 8 agents in parallel</div>
          </div>
          <div className="mono-sm" style={{color:'var(--text-3)',textTransform:'uppercase'}}>3 DONE · 2 LIVE · 3 QUEUED</div>
        </div>
        <div style={{flex:1,display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,alignContent:'start',overflow:'auto'}}>
          {DEPTH_PAPERS.map(p=><DepthCard key={p.pmid} paper={p}/>)}
        </div>
      </div>

      {/* Right — institution scoreboard */}
      <div style={{padding:'20px 22px',borderLeft:'1px solid var(--bg-sunk)',background:'var(--bg-card)',overflow:'hidden',display:'flex',flexDirection:'column',gap:10}}>
        <InstitutionScoreboard partial={true}/>
      </div>
    </div>
  </div>
);

/* ---------- Variant B · Vertical timeline + feed + board ---------- */
const RunningB = () => (
  <div className="scr" style={{width:1400,height:820,display:'grid',gridTemplateColumns:'220px 1fr 360px',background:'var(--bg)'}}>
    {/* Left vertical phase timeline */}
    <div style={{padding:'24px 16px 24px 20px',borderRight:'1px solid var(--bg-sunk)',overflow:'hidden'}}>
      <div className="mono" style={{color:'var(--brand-ink)',marginBottom:14}}>PHASES</div>
      <VPhaseStepper current="depth"/>
    </div>

    {/* Center — request + event stream + depth cards */}
    <div style={{padding:'22px 24px',overflow:'hidden',display:'flex',flexDirection:'column',gap:14}}>
      <ParsedRequestCard/>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
        <div className="serif" style={{fontSize:22,color:'var(--text)',fontWeight:400}}>Depth extraction · 3 of 8 complete</div>
        <span className="mono-sm" style={{color:'var(--text-3)',textTransform:'uppercase'}}>00:06:22 ELAPSED</span>
      </div>
      <div style={{flex:1,display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,alignContent:'start',overflow:'auto'}}>
        {DEPTH_PAPERS.slice(0,6).map(p=><DepthCard key={p.pmid} paper={p}/>)}
      </div>
    </div>

    {/* Right scoreboard + small log */}
    <div style={{borderLeft:'1px solid var(--bg-sunk)',background:'var(--bg-card)',padding:'22px 20px',display:'flex',flexDirection:'column',gap:14,overflow:'hidden'}}>
      <InstitutionScoreboard partial={true}/>
      <div style={{marginTop:'auto'}}>
        <div className="mono" style={{color:'var(--brand-ink)',marginBottom:8}}>RECENT EVENTS</div>
        <div style={{display:'flex',flexDirection:'column',gap:6}}>
          {DEPTH_LOG.slice(-4).map((e,i)=>(
            <div key={i} style={{display:'flex',gap:8,alignItems:'baseline'}}>
              <span className="mono-sm" style={{color:'var(--text-3)',fontSize:9,minWidth:48}}>{e.t}</span>
              <span style={{fontFamily:'var(--mono)',fontSize:10,color: e.active?'var(--brand-ink)':'var(--text-2)',lineHeight:1.35,flex:1}}>{e.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

/* ---------- Variant C · Single calm log with phase section headers ---------- */
const FULL_LOG = [
  {phase:'understand', events:[
    {t:'00:00:04', text:'parsed: AD · CSF · n≥100 · commission · 2 hard-negatives'},
    {t:'00:00:06', text:'3 fields inferred (budget, timeline, regulatory)'},
  ], state:'done'},
  {phase:'craft', events:[
    {t:'00:00:12', text:'query plan · 7 angles · pubmed · ctgov · web · snowball'},
  ], state:'done'},
  {phase:'discover', events:[
    {t:'00:00:34', text:'pubmed "AD CSF biomarker" → 23 hits, 8 kept'},
    {t:'00:00:41', text:'pubmed "AD CSF WGBS methylation" → 14 hits, 4 kept'},
    {t:'00:01:12', text:'ctgov "alzheimer CSF collection" → 6 trials, 2 kept'},
    {t:'00:02:08', text:'web snowball from Smith 2025 refs → 4 new PMIDs'},
    {t:'00:03:42', text:'complete · 47 found · 12 kept'},
  ], state:'done'},
  {phase:'triage', events:[
    {t:'00:04:18', text:'12 kept · 35 rejected (wrong_indication 22 · underpowered 9 · dup 4)'},
    {t:'00:04:19', text:'ready for depth'},
  ], state:'done'},
  {phase:'depth', events:[
    {t:'00:04:21', text:'spawning 8 agents in parallel'},
    {t:'00:05:04', text:'PMC12345 · Smith 2025 · SI:5 CR:3 CF:4 MD:4 · fit strong', ok:true},
    {t:'00:05:18', text:'PMC22891 · Mayo 2024 · SI:4 CR:4 CF:3 MD:3 · fit strong', ok:true},
    {t:'00:05:42', text:'PMC41122 · BIOCARD · SI:3 CR:2 CF:4 MD:4 · fit strong', ok:true},
    {t:'00:05:58', text:'PMC89012 · UCSF · reading methods …', active:true},
    {t:'00:06:12', text:'PMC77231 · Knight · extracting metadata …', active:true},
  ], state:'active'},
  {phase:'aggregate', events:[], state:'pending'},
  {phase:'enrich',    events:[], state:'pending'},
  {phase:'hypothesize', events:[], state:'pending'},
  {phase:'verify',    events:[], state:'pending'},
  {phase:'evaluate',  events:[], state:'pending'},
  {phase:'deliver',   events:[], state:'pending'},
];

const RunningC = () => {
  const phaseName = (id) => PHASES.find(p=>p.id===id);
  return (
    <div className="scr" style={{width:1200,height:820,display:'flex',flexDirection:'column',background:'var(--bg)'}}>
      <div style={{padding:'22px 34px 16px',borderBottom:'1px solid var(--bg-sunk)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:10}}>
          <div>
            <span className="mono" style={{color:'var(--brand-ink)'}}>RUN-0438</span>
            <span className="thread-id" style={{marginLeft:12}}>00:06:22 ELAPSED · PASS 3 OF 11</span>
          </div>
          <span className="tag">PAUSE</span>
        </div>
        <div className="serif" style={{fontSize:22,color:'var(--text)',fontWeight:400,marginBottom:10}}>{REQUEST.title}</div>
        <PhaseStepper current="depth" compact/>
      </div>
      <div style={{flex:1,overflow:'auto',padding:'22px 34px'}}>
        {FULL_LOG.map(section=>{
          const p = phaseName(section.phase);
          const stateC = section.state==='done'?'var(--text-2)': section.state==='active'?'var(--brand-ink)':'var(--text-3)';
          return (
            <div key={section.phase} style={{marginBottom:18,opacity: section.state==='pending'?0.4:1}}>
              <div style={{display:'flex',alignItems:'baseline',gap:10,marginBottom:6,paddingBottom:6,borderBottom:'1px dashed var(--bg-sunk)'}}>
                <span className="mono" style={{color:stateC}}>{p.n} · {p.name}</span>
                <span className="mono-sm" style={{color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'.1em'}}>{p.sub}</span>
                {section.state==='active' && <span className="mono-sm" style={{color:'var(--brand-ink)',marginLeft:'auto',display:'flex',alignItems:'center',gap:5}}><span className="live-dot"/>LIVE</span>}
                {section.state==='done' && <span className="mono-sm" style={{color:'var(--text-2)',marginLeft:'auto'}}>DONE</span>}
              </div>
              {section.events.length===0 && <div style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text-3)',paddingLeft:2,fontStyle:'italic'}}>waiting …</div>}
              {section.events.map((e,i)=>(
                <div key={i} style={{display:'flex',gap:14,padding:'4px 0',fontFamily:'var(--mono)',fontSize:11.5,lineHeight:1.5}}>
                  <span style={{color:'var(--text-3)',minWidth:62,fontSize:10}}>{e.t}</span>
                  <span style={{color: e.active?'var(--brand-ink)':(e.ok?'var(--text)':'var(--text-2)'),flex:1}}>
                    {e.active && <span className="live-dot" style={{marginRight:5}}/>}{e.text}
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

Object.assign(window, { DEPTH_PAPERS, DEPTH_LOG, DepthCard, ParsedRequestCard, InstitutionScoreboard, RunningA, RunningB, RunningC });
