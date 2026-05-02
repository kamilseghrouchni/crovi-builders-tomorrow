/* ============================================================
   Crovi Spec Flow — 11 phase-detail screens
   Each screen: what the agent sees inside one phase.
   Dimensions: 1400 x 820 unless noted.
   ============================================================ */

/* Header block used by every phase screen */
const PhaseHeader = ({phase, elapsed, subtitle, status='active'}) => {
  const p = PHASES.find(x=>x.id===phase);
  const statusC = status==='done'?'var(--text-2)': status==='active'?'var(--brand-ink)':'var(--text-3)';
  return (
    <div style={{padding:'20px 34px 16px',borderBottom:'1px solid var(--bg-sunk)'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:10}}>
        <div style={{display:'flex',alignItems:'baseline',gap:12}}>
          <span className="mono" style={{color:statusC}}>PHASE {p.n} · {p.name}</span>
          {status==='active' && <span className="mono-sm" style={{color:'var(--brand-ink)',display:'inline-flex',alignItems:'center',gap:5}}><span className="live-dot"/>LIVE</span>}
          {status==='done' && <span className="mono-sm" style={{color:'var(--text-2)'}}>COMPLETE</span>}
        </div>
        <span className="thread-id">{elapsed} · RUN-0438</span>
      </div>
      <div className="serif" style={{fontSize:26,color:'var(--text)',fontWeight:400,lineHeight:1.2,marginBottom:10}}>{subtitle}</div>
      <PhaseStepper current={phase} compact/>
    </div>
  );
};

/* =========== 0 · UNDERSTAND =========== */
const Phase_Understand = () => {
  /* Customer-facing recap — Crovi reads back what it heard, in plain language */
  const heard = [
    {k:'What you need',     v:'~100 CSF specimens from Alzheimer\'s patients'},
    {k:'Volume per donor',  v:'≥ 500 μL'},
    {k:'Intended use',      v:'WGBS methylation study'},
    {k:'Sourcing approach', v:'Existing banked samples — open to commissioning if faster'},
    {k:'Hard nos',          v:'No PAXgene tubes · No pooled samples'},
  ];
  /* Interactive clarifiers — each has a proposed answer, write-your-own, or skip */
  const clarifiers = [
    {q:'When do you need samples in hand?',
     why:'Helps us prioritize sites with shorter lead times.',
     proposed:'Within 8 weeks',
     state:'proposed'},
    {q:'Budget envelope per sample?',
     why:'Lets us filter sites whose fee schedule fits.',
     proposed:'$400 – $700 / vial (typical for AD CSF)',
     state:'proposed'},
    {q:'Is matched plasma or serum useful as a bonus?',
     why:'Some sites bank paired biofluids — we can flag them.',
     proposed:'Yes, if available at no extra effort',
     state:'answered',
     answer:'Yes, prefer paired plasma'},
  ];
  return (
    <div className="scr" style={{width:1400,height:820,display:'flex',flexDirection:'column'}}>
      <PhaseHeader phase="understand" elapsed="00:00:06" subtitle="Making sure we're on the right page before we start sourcing"/>
      <div style={{flex:1,display:'grid',gridTemplateColumns:'1fr 1fr',overflow:'hidden'}}>
        {/* LEFT — what we heard */}
        <div style={{padding:'24px 30px',borderRight:'1px solid var(--bg-sunk)',overflow:'auto'}}>
          <div className="mono" style={{color:'var(--brand-ink)',marginBottom:12}}>HERE'S WHAT WE HEARD</div>
          <div className="card-cream" style={{padding:'4px 4px'}}>
            {heard.map((h,i)=>(
              <div key={i} style={{
                display:'grid',gridTemplateColumns:'170px 1fr',gap:14,
                padding:'14px 18px',
                borderBottom: i<heard.length-1?'1px dashed var(--bg-sunk)':'none',
                alignItems:'baseline',
              }}>
                <span className="mono-sm" style={{color:'var(--text-3)',letterSpacing:'.08em'}}>{h.k}</span>
                <span style={{fontSize:14,color:'var(--text)',lineHeight:1.45}}>{h.v}</span>
              </div>
            ))}
          </div>
          <div style={{marginTop:18,padding:'14px 16px',background:'var(--brand-fill)',border:'1px solid var(--brand-ink)',borderRadius:10,display:'flex',justifyContent:'space-between',alignItems:'center',gap:14}}>
            <div style={{fontSize:13.5,color:'var(--text)',lineHeight:1.5}}>
              Does this match what you're trying to do?
            </div>
            <div style={{display:'flex',gap:8,flexShrink:0}}>
              <button className="btn-o" style={{padding:'7px 12px'}}>Edit</button>
              <button className="btn-p brand" style={{padding:'7px 14px'}}>Looks right →</button>
            </div>
          </div>
        </div>

        {/* RIGHT — interactive clarifiers */}
        <div style={{padding:'24px 30px',overflow:'auto'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:12}}>
            <div className="mono" style={{color:'var(--brand-ink)'}}>A FEW QUICK QUESTIONS</div>
            <span className="mono-sm" style={{color:'var(--text-3)'}}>1 ANSWERED · 2 PROPOSED · OPTIONAL</span>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {clarifiers.map((c,i)=>{
              const answered = c.state==='answered';
              return (
                <div key={i} className="card-cream" style={{
                  padding:'16px 18px',
                  borderColor: answered?'var(--brand-ink)':'var(--bg-sunk)',
                  background: answered?'var(--brand-fill)':'#FBF9F4',
                }}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:10}}>
                    <div className="serif" style={{fontSize:15,color:'var(--text)',lineHeight:1.35,fontWeight:400}}>{c.q}</div>
                    <span className="mono-sm" style={{color: answered?'var(--brand-ink)':'var(--text-3)',whiteSpace:'nowrap',marginLeft:10}}>
                      {answered?'✓ ANSWERED':'PROPOSED'}
                    </span>
                  </div>
                  <div style={{fontSize:11.5,color:'var(--text-2)',marginTop:4,fontStyle:'italic'}}>{c.why}</div>

                  {/* Crovi's proposed answer */}
                  <div style={{marginTop:12,padding:'10px 12px',background:'var(--bg)',border:'1px dashed var(--bg-sunk)',borderRadius:8,display:'flex',justifyContent:'space-between',alignItems:'center',gap:10}}>
                    <div style={{flex:1}}>
                      <div className="mono-sm" style={{color:'var(--text-3)',marginBottom:3}}>OUR BEST GUESS</div>
                      <div style={{fontSize:13,color:'var(--text)',lineHeight:1.4}}>{answered?c.answer:c.proposed}</div>
                    </div>
                  </div>

                  {/* Action callouts */}
                  {!answered && (
                    <div style={{marginTop:10,display:'flex',gap:6,flexWrap:'wrap'}}>
                      <button className="btn-p brand" style={{padding:'6px 12px',fontSize:11}}>Use this answer</button>
                      <button className="btn-o" style={{padding:'6px 12px',fontSize:11}}>Write my own</button>
                      <button className="btn-o" style={{padding:'6px 12px',fontSize:11,color:'var(--text-3)'}}>Skip</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{marginTop:16,fontFamily:'var(--mono)',fontSize:11,color:'var(--text-3)',lineHeight:1.5}}>
            You can answer now or let us proceed with our best guesses — we'll flag anything we had to assume.
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========== 0b · CRAFT — customer narrative, no query strings =========== */
const Phase_Craft = () => {
  /* Reframed: "here's the angles we're pursuing on your behalf" */
  const angles = [
    {title:'Sites publishing on AD CSF',          why:'Recent papers reveal which biobanks have active AD CSF collections.',                   reach:'~40 candidate sites'},
    {title:'WGBS methylation precedent',          why:'Find sites that have already run WGBS on CSF — your protocol won\'t be a first.',     reach:'~12 candidate labs'},
    {title:'Major ADRC cohorts',                  why:'NIH-funded Alzheimer\'s Disease Research Centers are the deepest, most-banked source.', reach:'33 ADRCs'},
    {title:'Active CSF-collection trials',        why:'Recruiting trials may have spare or future capacity.',                                  reach:'~25 trials'},
    {title:'Named institutional biobanks',        why:'Standalone biobanks at Mayo, UCSF, etc. with public CSF inventories.',                  reach:'~30 biobanks'},
    {title:'Snowball from anchor publications',   why:'Co-authors and cited cohorts often share specimens informally.',                        reach:'expanding'},
    {title:'Consortium repositories',             why:'ADNI, DIAN and similar consortia hold large pre-banked sets.',                          reach:'4 consortia'},
  ];
  return (
    <div className="scr" style={{width:1400,height:820,display:'flex',flexDirection:'column'}}>
      <PhaseHeader phase="craft" elapsed="00:00:12" subtitle="Mapping the field · 7 angles we'll pursue in parallel"/>
      <div style={{flex:1,padding:'22px 34px',overflow:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:14}}>
          <div className="mono" style={{color:'var(--brand-ink)'}}>OUR APPROACH</div>
          <span className="mono-sm" style={{color:'var(--text-3)'}}>EVERY ANGLE LOGGED · YOU CAN AUDIT THE TRAIL ANYTIME</span>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(2, 1fr)',gap:14}}>
          {angles.map((a,i)=>(
            <div key={i} className="card-cream" style={{padding:'16px 18px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:8}}>
                <span className="mono" style={{color:'var(--brand-ink)'}}>ANGLE 0{i+1}</span>
                <span className="tag">{a.reach}</span>
              </div>
              <div className="serif" style={{fontSize:17,color:'var(--text)',fontWeight:400,marginBottom:6,lineHeight:1.25}}>{a.title}</div>
              <div style={{fontSize:12.5,color:'var(--text-2)',lineHeight:1.5}}>{a.why}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* =========== 1 · DISCOVER — customer narrative =========== */
const Phase_Discover = () => {
  const sources = [
    {src:'Published literature',     scanned:'37 papers',   relevant:'12 cohorts',    note:'Recent AD CSF studies'},
    {src:'Active clinical trials',   scanned:'6 trials',    relevant:'2 recruiting',  note:'CSF collection in progress'},
    {src:'Institutional biobanks',   scanned:'8 biobanks',  relevant:'3 with capacity', note:'Public inventories'},
    {src:'Cited cohorts (snowball)', scanned:'4 references', relevant:'4 new sites',   note:'From anchor papers'},
  ];
  /* Customer-readable narrative beats — not query strings */
  const beats = [
    {t:'00:00:34', icon:'●', msg:'Aggregating AD CSF biomarker work across PubMed', detail:'23 papers found · 8 worth deeper read'},
    {t:'00:00:41', icon:'●', msg:'Cross-referencing WGBS methylation precedent on CSF', detail:'14 papers · 4 directly relevant'},
    {t:'00:01:12', icon:'●', msg:'Checking active recruiting trials for spare capacity', detail:'6 trials reviewed · 2 worth contacting'},
    {t:'00:01:58', icon:'●', msg:'Surfacing major ADRCs with established AD CSF banks', detail:'Mayo, Knight, BIOCARD, UCSF, Penn all confirmed'},
    {t:'00:02:08', icon:'◐', msg:'Snowballing references from anchor publications', detail:'4 additional cohorts surfaced via citations'},
    {t:'00:02:41', icon:'●', msg:'Reading Johns Hopkins · BIOCARD longitudinal cohort', detail:'7 papers · 3 quantify available volumes'},
    {t:'00:03:02', icon:'◐', msg:'Searching UCSF Memory & Aging Center inventory', detail:'No public count — flagged for follow-up enrichment'},
    {t:'00:03:22', icon:'●', msg:'Confirming Knight ADRC biospecimen catalog', detail:'300+ AD CSF vials · governance-gated'},
  ];
  return (
    <div className="scr" style={{width:1400,height:820,display:'flex',flexDirection:'column'}}>
      <PhaseHeader phase="discover" elapsed="00:03:42" subtitle="Aggregating across the field · 55 places looked, 21 worth pursuing" status="done"/>
      <div style={{flex:1,display:'grid',gridTemplateColumns:'360px 1fr',overflow:'hidden'}}>
        {/* LEFT — where we looked, plain English */}
        <div style={{padding:'24px 26px',borderRight:'1px solid var(--bg-sunk)',overflow:'auto'}}>
          <div className="mono" style={{color:'var(--brand-ink)',marginBottom:14}}>WHERE WE LOOKED</div>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {sources.map(s=>(
              <div key={s.src} style={{padding:'14px 16px',background:'#FBF9F4',border:'1px solid var(--bg-sunk)',borderRadius:10}}>
                <div className="serif" style={{fontSize:15,color:'var(--text)',marginBottom:4}}>{s.src}</div>
                <div style={{fontSize:11.5,color:'var(--text-2)',marginBottom:8,fontStyle:'italic'}}>{s.note}</div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:10,paddingTop:8,borderTop:'1px dashed var(--bg-sunk)'}}>
                  <div>
                    <div className="mono-sm" style={{color:'var(--text-3)'}}>SCANNED</div>
                    <div style={{fontSize:13,color:'var(--text)',marginTop:2}}>{s.scanned}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div className="mono-sm" style={{color:'var(--text-3)'}}>RELEVANT</div>
                    <div className="serif" style={{fontSize:15,color:'var(--brand-ink)',marginTop:2}}>{s.relevant}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — narrative beats */}
        <div style={{padding:'24px 30px',overflow:'auto'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:14}}>
            <div className="mono" style={{color:'var(--brand-ink)'}}>WHAT WE'RE DOING</div>
            <span className="mono-sm" style={{color:'var(--text-3)'}}>21 SITES SHORTLISTED · NEXT · TRIAGE</span>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:0}}>
            {beats.map((b,i)=>(
              <div key={i} style={{
                display:'grid',gridTemplateColumns:'70px 18px 1fr',gap:14,
                padding:'14px 0',
                borderBottom: i<beats.length-1?'1px dashed var(--bg-sunk)':'none',
                alignItems:'flex-start',
              }}>
                <span className="mono-sm" style={{color:'var(--text-3)',paddingTop:2}}>{b.t}</span>
                <span style={{color:'var(--brand-ink)',fontSize:12,paddingTop:1}}>{b.icon}</span>
                <div>
                  <div style={{fontSize:14,color:'var(--text)',lineHeight:1.4}}>{b.msg}</div>
                  <div style={{fontSize:11.5,color:'var(--text-2)',marginTop:3,fontFamily:'var(--mono)'}}>→ {b.detail}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{marginTop:18,padding:'12px 16px',background:'var(--brand-fill)',border:'1px solid var(--brand-ink)',borderRadius:10,fontSize:13,color:'var(--text)',lineHeight:1.5}}>
            We've covered the field broadly. Next we'll narrow to the sites most likely to actually have what you need.
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========== 2 · TRIAGE =========== */
const Phase_Triage = () => {
  const rejected = [
    {r:'wrong_indication', n:22, ex:'PD cohorts with no AD arm'},
    {r:'underpowered',     n:9,  ex:'case reports, n<5'},
    {r:'duplicate',        n:4,  ex:'same cohort reported 2x'},
  ];
  const kept = [
    {pmid:'PMC12345', t:'CSF biomarker landscape in mild AD', inst:'U-Washington', score:0.92},
    {pmid:'PMC22891', t:'Methylation in Alzheimer progression', inst:'Mayo Clinic', score:0.88},
    {pmid:'PMC41122', t:'Longitudinal CSF cohort (BIOCARD)', inst:'Johns Hopkins', score:0.87},
    {pmid:'PMC89012', t:'WGBS in CSF-derived nucleic acids', inst:'UCSF', score:0.84},
    {pmid:'PMC77231', t:'ADRC cohort biomarker paper (Knight)', inst:'Wash U Knight', score:0.83},
    {pmid:'PMC55001', t:'Knight ADRC cross-sectional 2024', inst:'Wash U Knight', score:0.81},
    {pmid:'PMC33441', t:'Penn ADRC methylation follow-up', inst:'Penn ADRC', score:0.77},
    {pmid:'PMC99010', t:'Duke aging cohort CSF panel', inst:'Duke ADRC', score:0.62},
  ];
  return (
    <div className="scr" style={{width:1400,height:820,display:'flex',flexDirection:'column'}}>
      <PhaseHeader phase="triage" elapsed="00:04:18" subtitle="Filtering 47 raw papers to 12 triaged candidates" status="done"/>
      <div style={{flex:1,display:'grid',gridTemplateColumns:'1fr 1fr',overflow:'hidden'}}>
        <div style={{padding:'24px 30px',borderRight:'1px solid var(--bg-sunk)',overflow:'auto'}}>
          <div className="mono" style={{color:'var(--brand-ink)',marginBottom:12}}>KEPT · 12</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {kept.map(k=>(
              <div key={k.pmid} style={{padding:'11px 14px',background:'#FBF9F4',border:'1px solid var(--bg-sunk)',borderRadius:8,display:'grid',gridTemplateColumns:'80px 1fr 50px',gap:12,alignItems:'center'}}>
                <span className="mono-sm" style={{color:'var(--text-3)'}}>{k.pmid}</span>
                <div>
                  <div style={{fontSize:12.5,color:'var(--text)',lineHeight:1.35}}>{k.t}</div>
                  <div className="mono-sm" style={{color:'var(--text-2)',fontSize:9.5,marginTop:2,textTransform:'uppercase'}}>{k.inst}</div>
                </div>
                <span className="serif" style={{fontSize:15,color:'var(--brand-ink)',textAlign:'right'}}>{k.score.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{padding:'24px 30px',overflow:'auto'}}>
          <div className="mono" style={{color:'var(--text-2)',marginBottom:12}}>REJECTED · 35</div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {rejected.map(r=>(
              <div key={r.r} style={{padding:'14px 16px',background:'var(--bg-card)',border:'1px solid var(--bg-sunk)',borderRadius:8}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:6}}>
                  <span className="mono" style={{color:'var(--text-2)',textTransform:'uppercase'}}>{r.r.replace('_',' ')}</span>
                  <span className="serif" style={{fontSize:22,color:'var(--text-2)'}}>{r.n}</span>
                </div>
                <div style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text-3)',lineHeight:1.45}}>e.g. {r.ex}</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:20,padding:'14px 16px',background:'var(--brand-fill)',borderRadius:8,border:'1px solid var(--brand-ink)'}}>
            <div className="mono" style={{color:'var(--brand-ink)',marginBottom:4}}>READY FOR DEPTH</div>
            <div style={{fontSize:13,color:'var(--text)',lineHeight:1.5}}>12 kept · spawning 8 parallel extraction agents (top-8 by score)</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========== 3 · DEPTH (reuse RunningA as primary depth screen) =========== */
/* RunningA is already the depth view. No new screen here. */

/* =========== 4 · AGGREGATE =========== */
const Phase_Aggregate = () => {
  return (
    <div className="scr" style={{width:1400,height:820,display:'flex',flexDirection:'column'}}>
      <PhaseHeader phase="aggregate" elapsed="00:06:48" subtitle="Grouping paper-level facts into 7 institutional dossiers"/>
      <div style={{flex:1,padding:'22px 34px',overflow:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:14}}>
          <div className="mono" style={{color:'var(--brand-ink)'}}>INSTITUTIONS · 7 FORMED</div>
          <LabelLegend/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14}}>
          {INSTITUTIONS.map(inst=>(
            <div key={inst.id} className="card-cream" style={{padding:'16px 18px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:8}}>
                <div>
                  <div className="serif" style={{fontSize:15,color:'var(--text)'}}>{inst.name}</div>
                  <div className="mono-sm" style={{color:'var(--text-3)',marginTop:2,textTransform:'uppercase'}}>{inst.papers} papers · {inst.trials} trials</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{display:'flex',alignItems:'baseline',gap:3}}>
                    <span className="serif" style={{fontSize:20,color:inst.ready?'var(--brand-ink)':'var(--text-3)'}}>{inst.readiness.toFixed(1)}</span>
                    <span className="mono-sm" style={{color:'var(--text-3)'}}>/5</span>
                  </div>
                </div>
              </div>
              <PillarBars {...inst}/>
              <div style={{marginTop:10,paddingTop:10,borderTop:'1px dashed var(--bg-sunk)',fontFamily:'var(--mono)',fontSize:10.5,color:'var(--text-2)',lineHeight:1.45}}>
                {inst.fact}
              </div>
              <div style={{marginTop:8,display:'flex',gap:6,flexWrap:'wrap'}}>
                <LabelBadge kind={inst.SI>=4?'documented':inst.SI>=3?'verified':'inferred'} text={`SI ${inst.SI>=4?'DOC':inst.SI>=3?'VER':'INF'}`} compact/>
                <LabelBadge kind={inst.CR>=3?'documented':inst.CR>=2?'verified':'not-stated'} text={`CR`} compact/>
                <LabelBadge kind={inst.CF>=3?'documented':'inferred'} text={`CF`} compact/>
                <LabelBadge kind={inst.MD>=3?'documented':'verified'} text={`MD`} compact/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* =========== 4d · ENRICH =========== */
const Phase_Enrich = () => {
  const targets = [
    {inst:'Duke ADRC', pillar:'SI', q:'Total CSF sample count in current biobank?', src:'biobank page + contact', status:'running'},
    {inst:'Duke ADRC', pillar:'CR', q:'Named biobank contact + email?', src:'institutional directory', status:'running'},
    {inst:'Johns Hopkins', pillar:'CR', q:'Direct PI email (BIOCARD PI)?', src:'recent pub corresponding author', status:'found', found:'confirmed via Nature 2024 corresponding author'},
    {inst:'Mayo Clinic', pillar:'CF', q:'Centrifugation protocol details?', src:'methods in 3 sibling papers', status:'found', found:'2000g × 10min, 4°C, within 2h'},
    {inst:'Penn ADRC', pillar:'CR', q:'Commercial-use consent language?', src:'cohort governance page', status:'running'},
    {inst:'UCSF', pillar:'CR', q:'Sharing policy publicly stated?', src:'institutional policy docs', status:'notfound', found:'No public policy found — open question'},
  ];
  return (
    <div className="scr" style={{width:1400,height:820,display:'flex',flexDirection:'column'}}>
      <PhaseHeader phase="enrich" elapsed="00:07:22" subtitle="Targeted fact-finding · closing specific gaps per institution"/>
      <div style={{flex:1,padding:'22px 34px',overflow:'auto'}}>
        <div className="mono" style={{color:'var(--brand-ink)',marginBottom:14}}>GAP-CLOSING QUERIES · 6</div>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {targets.map((t,i)=>{
            const statusC = t.status==='found'?'var(--brand-ink)': t.status==='notfound'?'var(--text-3)':'var(--text-2)';
            const statusL = t.status==='found'?'verified': t.status==='notfound'?'open-q':'inferred';
            return (
              <div key={i} className="card-cream" style={{padding:'14px 18px',display:'grid',gridTemplateColumns:'140px 60px 1fr 180px 120px',gap:16,alignItems:'center'}}>
                <span className="serif" style={{fontSize:14,color:'var(--text)'}}>{t.inst}</span>
                <span className="tag brand">{t.pillar}</span>
                <div>
                  <div style={{fontSize:12.5,color:'var(--text)',lineHeight:1.4}}>{t.q}</div>
                  {t.found && <div style={{fontSize:11,color:statusC,marginTop:4,fontFamily:'var(--mono)'}}>→ {t.found}</div>}
                </div>
                <span className="mono-sm" style={{color:'var(--text-3)',fontSize:10}}>via {t.src}</span>
                <div style={{display:'flex',justifyContent:'flex-end'}}>
                  {t.status==='running' ? <span className="mono-sm" style={{color:'var(--brand-ink)',display:'flex',alignItems:'center',gap:5}}><span className="live-dot"/>RUNNING</span> : <LabelBadge kind={statusL}/>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* =========== 5a · HYPOTHESIZE =========== */
const Phase_Hypothesize = () => {
  const all = Object.entries(HYPOTHESES).flatMap(([id,hs])=>{
    const inst = INSTITUTIONS.find(i=>i.id===id);
    return hs.map((h,i)=>({...h, inst:inst.name, short:inst.short, idx:i+1}));
  });
  return (
    <div className="scr" style={{width:1400,height:820,display:'flex',flexDirection:'column'}}>
      <PhaseHeader phase="hypothesize" elapsed="00:07:48" subtitle="Generating testable claims from aggregated evidence"/>
      <div style={{flex:1,padding:'22px 34px',overflow:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:14}}>
          <div className="mono" style={{color:'var(--brand-ink)'}}>HYPOTHESES · {all.length} GENERATED</div>
          <div className="mono-sm" style={{color:'var(--text-3)'}}>NEXT · PASS 5b VERIFY</div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          {all.map((h,i)=>{
            const c = h.conf==='high'?'var(--brand-ink)': h.conf==='medium'?'var(--text-2)':'var(--text-3)';
            return (
              <div key={i} className="card-cream" style={{padding:'14px 18px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:6}}>
                  <span className="mono-sm" style={{color:'var(--text-3)'}}>H{String(i+1).padStart(2,'0')} · {h.short}</span>
                  <span className="mono-sm" style={{color:c,textTransform:'uppercase',letterSpacing:'.1em'}}>{h.conf} CONF</span>
                </div>
                <div style={{fontSize:13.5,color:'var(--text)',lineHeight:1.45}}>{h.t}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* =========== 5b · VERIFY =========== */
const Phase_Verify = () => {
  const checks = [
    {h:'H01', c:'PI email validates (MX + institutional lookup)', inst:'U-Washington', status:'confirmed'},
    {h:'H01', c:'n=150 CSF, -80°C confirmed in Methods', inst:'U-Washington', status:'confirmed'},
    {h:'H02', c:'Commercial-use consent scope', inst:'U-Washington', status:'open'},
    {h:'H03', c:'Mayo biobank director email reachable', inst:'Mayo Clinic', status:'confirmed'},
    {h:'H04', c:'Centrifuge 2000g × 10min in original paper', inst:'Mayo Clinic', status:'refuted', note:'protocol cited from sibling paper only'},
    {h:'H05', c:'BIOCARD portal lead-time 4–6 weeks', inst:'JHU', status:'confirmed'},
    {h:'H06', c:'UCSF n≈80 figure reconciles across 2 papers', inst:'UCSF', status:'confirmed'},
    {h:'H07', c:'Penn commercial-use consent', inst:'Penn ADRC', status:'open'},
    {h:'H08', c:'Duke CSF sample count discoverable', inst:'Duke ADRC', status:'open'},
  ];
  const count = (s)=>checks.filter(c=>c.status===s).length;
  return (
    <div className="scr" style={{width:1400,height:820,display:'flex',flexDirection:'column'}}>
      <PhaseHeader phase="verify" elapsed="00:08:04" subtitle="Running verification checks against each hypothesis"/>
      <div style={{flex:1,display:'grid',gridTemplateColumns:'260px 1fr',overflow:'hidden'}}>
        <div style={{padding:'24px 24px',borderRight:'1px solid var(--bg-sunk)',background:'var(--bg-card)'}}>
          <div className="mono" style={{color:'var(--brand-ink)',marginBottom:16}}>RESULTS</div>
          {[['confirmed','verified','Confirmed'],['refuted','refuted','Refuted'],['open','open-q','Open']].map(([s,l,name])=>(
            <div key={s} style={{marginBottom:18,paddingBottom:18,borderBottom:'1px dashed var(--bg-sunk)'}}>
              <LabelBadge kind={l} text={name.toUpperCase()}/>
              <div className="serif" style={{fontSize:40,color:'var(--text)',marginTop:8,lineHeight:1,fontWeight:400}}>{count(s)}</div>
              <div className="mono-sm" style={{color:'var(--text-3)',marginTop:4,textTransform:'uppercase'}}>of {checks.length} CHECKS</div>
            </div>
          ))}
        </div>
        <div style={{padding:'24px 30px',overflow:'auto'}}>
          {checks.map((c,i)=>{
            const kind = c.status==='confirmed'?'verified': c.status==='refuted'?'refuted':'open-q';
            return (
              <div key={i} style={{display:'grid',gridTemplateColumns:'60px 130px 1fr 140px',gap:14,padding:'12px 0',borderBottom:'1px dashed var(--bg-sunk)',alignItems:'center'}}>
                <span className="mono-sm" style={{color:'var(--text-3)'}}>{c.h}</span>
                <span className="mono-sm" style={{color:'var(--text-2)'}}>{c.inst}</span>
                <div>
                  <div style={{fontSize:12.5,color:'var(--text)',lineHeight:1.4}}>{c.c}</div>
                  {c.note && <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text-3)',marginTop:3}}>{c.note}</div>}
                </div>
                <div style={{display:'flex',justifyContent:'flex-end'}}><LabelBadge kind={kind}/></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* =========== 5c · EVALUATE =========== */
const Phase_Evaluate = () => {
  const ranked = [...INSTITUTIONS].sort((a,b)=>b.readiness-a.readiness);
  return (
    <div className="scr" style={{width:1400,height:820,display:'flex',flexDirection:'column'}}>
      <PhaseHeader phase="evaluate" elapsed="00:08:11" subtitle="Grading each institution on final readiness"/>
      <div style={{flex:1,padding:'22px 34px',overflow:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:14}}>
          <div className="mono" style={{color:'var(--brand-ink)'}}>READINESS GRADES · 7 INSTITUTIONS</div>
          <div className="mono-sm" style={{color:'var(--text-3)'}}>≥ 3.0 → PURSUE · &lt; 3.0 → RE-ENRICH OR DROP</div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {ranked.map(inst=>(
            <div key={inst.id} className="card-cream" style={{padding:'16px 20px',display:'grid',gridTemplateColumns:'220px 100px 1fr 180px',gap:20,alignItems:'center'}}>
              <div>
                <div className="serif" style={{fontSize:16,color:'var(--text)'}}>{inst.name}</div>
                <div className="mono-sm" style={{color:'var(--text-3)',marginTop:2,textTransform:'uppercase'}}>{inst.short}</div>
              </div>
              <div style={{display:'flex',alignItems:'baseline',gap:3}}>
                <span className="serif" style={{fontSize:34,color:inst.ready?'var(--brand-ink)':'var(--text-3)',lineHeight:1,fontWeight:400}}>{inst.readiness.toFixed(1)}</span>
                <span className="mono-sm" style={{color:'var(--text-3)'}}>/5</span>
              </div>
              <PillarBars {...inst} size="lg"/>
              <div style={{display:'flex',justifyContent:'flex-end'}}>
                {inst.ready ? <span className="tag brand">PURSUE</span> : <span className="tag warn">RE-ENRICH</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* =========== 7 · DELIVER =========== */
const Phase_Deliver = () => {
  const pkg = [
    {k:'Ranked dossiers', d:'7 institutions, 4-pillar anchors, evidence summary', fmt:'JSON + PDF'},
    {k:'Hypothesis ledger', d:'16 hypotheses, verification status per claim', fmt:'JSON'},
    {k:'Open questions', d:'3 items requiring human follow-up', fmt:'Markdown'},
    {k:'RFQ draft · top 3', d:'Pre-filled outreach for UWA, Mayo, WU/Knight', fmt:'Email draft'},
    {k:'Audit log', d:'Full query trace, 47 sources, timestamp chain', fmt:'JSON'},
  ];
  return (
    <div className="scr" style={{width:1400,height:820,display:'flex',flexDirection:'column'}}>
      <PhaseHeader phase="deliver" elapsed="00:08:14" subtitle="Assembling the final deliverable package" status="done"/>
      <div style={{flex:1,display:'grid',gridTemplateColumns:'1fr 440px',overflow:'hidden'}}>
        <div style={{padding:'26px 34px',overflow:'auto'}}>
          <div className="mono" style={{color:'var(--brand-ink)',marginBottom:14}}>DELIVERABLE PACKAGE</div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {pkg.map((p,i)=>(
              <div key={i} className="card-cream" style={{padding:'16px 20px',display:'grid',gridTemplateColumns:'36px 1fr 120px',gap:14,alignItems:'center'}}>
                <span className="mono" style={{color:'var(--text-3)'}}>{String(i+1).padStart(2,'0')}</span>
                <div>
                  <div className="serif" style={{fontSize:15,color:'var(--text)'}}>{p.k}</div>
                  <div style={{fontSize:11.5,color:'var(--text-2)',marginTop:3,fontFamily:'var(--mono)'}}>{p.d}</div>
                </div>
                <span className="tag" style={{justifySelf:'end'}}>{p.fmt}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{padding:'26px 30px',borderLeft:'1px solid var(--bg-sunk)',background:'var(--bg-card)',display:'flex',flexDirection:'column',gap:18}}>
          <div>
            <div className="mono" style={{color:'var(--brand-ink)',marginBottom:6}}>RUN SUMMARY</div>
            <div className="serif" style={{fontSize:20,color:'var(--text)',lineHeight:1.3,fontWeight:400}}>5 institutions ready to pursue · 2 need enrichment · 3 open questions</div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            {[['47','sources scanned'],['8','papers read in depth'],['16','hypotheses formed'],['9','verification checks'],['7','dossiers delivered'],['00:08:14','total elapsed']].map(([v,k])=>(
              <div key={k} style={{padding:'12px 14px',background:'#FBF9F4',border:'1px solid var(--bg-sunk)',borderRadius:8}}>
                <div className="serif" style={{fontSize:22,color:'var(--text)',lineHeight:1,fontWeight:400}}>{v}</div>
                <div className="mono-sm" style={{color:'var(--text-3)',marginTop:4,textTransform:'uppercase'}}>{k}</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:'auto',display:'flex',flexDirection:'column',gap:8}}>
            <button className="btn-p brand" style={{width:'100%',justifyContent:'center'}}>OPEN OUTCOME →</button>
            <button className="btn-o" style={{width:'100%',justifyContent:'center'}}>DOWNLOAD PACKAGE</button>
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, {
  PhaseHeader,
  Phase_Understand, Phase_Craft, Phase_Discover, Phase_Triage,
  Phase_Aggregate, Phase_Enrich, Phase_Hypothesize, Phase_Verify,
  Phase_Evaluate, Phase_Deliver
});
