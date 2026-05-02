/* ============================================================
   Crovi Spec Flow — Outcome (simplified list + detail, no footer)
   ============================================================ */

/* A hypothesis per institution (Pass 5a output) */
const HYPOTHESES = {
  uwa:  [{t:'150 CSF vials, -80°C, commercial-sharing permitted', conf:'high'},
         {t:'PI will negotiate commission rate for WGBS', conf:'medium'}],
  umn:  [{t:'~92 CSF vials, biobank-managed, fee-for-service', conf:'high'},
         {t:'Shippable on dry-ice within 14 days', conf:'medium'}],
  jhu:  [{t:'~200 CSF samples via BIOCARD portal', conf:'medium'},
         {t:'Portal adds 4-6 week lead time', conf:'high'}],
  ucsf: [{t:'~80 CSF samples available on IRB approval', conf:'medium'}],
  wu:   [{t:'300+ CSF samples via Knight ADRC governance', conf:'high'}],
  duke: [{t:'CSF samples exist but N, protocol, contact all unclear', conf:'low'}],
  penn: [{t:'~120 CSF samples, PI reachable, consent scope unclear', conf:'medium'}],
};

/* Verification results — what actually got checked in Pass 5b */
const VERIFICATION = {
  uwa: [
    {check:'PI email validated (crossref + institutional lookup)', status:'confirmed'},
    {check:'Paper reports n=150 CSF, -80°C, fasting draw', status:'confirmed'},
    {check:'Consent scope documents commercial use', status:'open'},
  ],
  umn: [
    {check:'Biobank director email validated', status:'confirmed'},
    {check:'Centrifuge protocol present in methods', status:'refuted', note:'inferred from sibling paper only'},
    {check:'Sharing policy published on institutional site', status:'confirmed'},
  ],
};

/* Outcome row — compact institution summary for the left list */
const OutcomeRow = ({inst, selected, onClick}) => {
  const readyC = inst.ready?'var(--brand-ink)':'var(--text-3)';
  return (
    <div onClick={onClick} style={{
      padding:'14px 16px', cursor:'pointer',
      background: selected?'var(--brand-fill)':'transparent',
      borderLeft: selected?'2px solid var(--brand-ink)':'2px solid transparent',
      borderBottom:'1px solid var(--bg-sunk)',
      display:'flex',flexDirection:'column',gap:6
    }}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
        <div className="serif" style={{fontSize:15,color:'var(--text)',fontWeight:400}}>{inst.name}</div>
        <div style={{display:'flex',alignItems:'baseline',gap:3}}>
          <span className="serif" style={{fontSize:18,color:readyC,lineHeight:1}}>{inst.readiness.toFixed(1)}</span>
          <span className="mono-sm" style={{color:'var(--text-3)'}}>/5</span>
        </div>
      </div>
      <div className="mono-sm" style={{color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'.08em',fontSize:9.5}}>
        {inst.short} · {inst.papers}p · {inst.trials}t
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <PillarBars {...inst} showLabels={false}/>
        {inst.ready
          ? <span className="tag brand" style={{fontSize:8.5,padding:'1px 6px'}}>READY</span>
          : <span className="tag" style={{fontSize:8.5,padding:'1px 6px',color:'var(--text-3)'}}>THIN</span>}
      </div>
    </div>
  );
};

/* Outcome — list on left, institution detail on right. No footer. */
const OutcomeSimplified = () => {
  const [sel, setSel] = React.useState('uwa');
  const ranked = [...INSTITUTIONS].sort((a,b)=>b.readiness-a.readiness);
  const inst = INSTITUTIONS.find(i=>i.id===sel);
  const hyps = HYPOTHESES[sel]||[];
  const verif = VERIFICATION[sel]||[];

  return (
    <div className="scr" style={{width:1400,height:900,display:'flex',flexDirection:'column',background:'var(--bg)'}}>
      {/* Header */}
      <div style={{padding:'22px 34px 18px',borderBottom:'1px solid var(--bg-sunk)',display:'flex',justifyContent:'space-between',alignItems:'flex-end'}}>
        <div>
          <span className="mono" style={{color:'var(--brand-ink)'}}>COMPLETE · RUN-0438</span>
          <div className="serif" style={{fontSize:26,color:'var(--text)',marginTop:4,fontWeight:400}}>{REQUEST.title}</div>
          <div className="mono-sm" style={{color:'var(--text-2)',marginTop:6,textTransform:'uppercase',letterSpacing:'.08em'}}>
            7 institutions · {ranked.filter(r=>r.ready).length} ready · 2 need enrichment · 00:08:14 total
          </div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <span className="btn-o">EXPORT</span>
          <span className="btn-p brand">OPEN RFQ →</span>
        </div>
      </div>

      {/* Body */}
      <div style={{flex:1,display:'grid',gridTemplateColumns:'360px 1fr',overflow:'hidden'}}>
        {/* Left — ranked institution list */}
        <div style={{borderRight:'1px solid var(--bg-sunk)',overflow:'auto',background:'var(--bg-card)'}}>
          <div style={{padding:'14px 16px',borderBottom:'1px solid var(--bg-sunk)',display:'flex',justifyContent:'space-between',alignItems:'baseline',position:'sticky',top:0,background:'var(--bg-card)',zIndex:1}}>
            <span className="mono" style={{color:'var(--brand-ink)'}}>RANKED BY READINESS</span>
            <span className="mono-sm" style={{color:'var(--text-3)',textTransform:'uppercase'}}>{ranked.length}</span>
          </div>
          {ranked.map(i=><OutcomeRow key={i.id} inst={i} selected={i.id===sel} onClick={()=>setSel(i.id)}/>)}
        </div>

        {/* Right — detail */}
        <div style={{overflow:'auto',padding:'26px 36px'}}>
          {/* Title block */}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:20,paddingBottom:18,borderBottom:'1px solid var(--bg-sunk)'}}>
            <div style={{flex:1}}>
              <div className="mono" style={{color:'var(--brand-ink)',marginBottom:4}}>INSTITUTION</div>
              <div className="serif" style={{fontSize:32,color:'var(--text)',lineHeight:1.15,fontWeight:400}}>{inst.name}</div>
              <div className="mono-sm" style={{color:'var(--text-2)',marginTop:6,textTransform:'uppercase',letterSpacing:'.08em'}}>{inst.short}</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{display:'flex',alignItems:'baseline',gap:4,justifyContent:'flex-end'}}>
                <span className="serif" style={{fontSize:56,color:inst.ready?'var(--brand-ink)':'var(--text-3)',lineHeight:1,fontWeight:400}}>{inst.readiness.toFixed(1)}</span>
                <span className="mono-sm" style={{color:'var(--text-3)'}}>/5</span>
              </div>
              <div className="mono-sm" style={{color:'var(--text-2)',marginTop:4,textTransform:'uppercase',letterSpacing:'.08em'}}>READINESS</div>
              {inst.ready && <span className="tag brand" style={{marginTop:8}}>READY TO PURSUE</span>}
            </div>
          </div>

          {/* 4-pillar detail */}
          <div style={{padding:'20px 0',borderBottom:'1px solid var(--bg-sunk)'}}>
            <div className="mono" style={{color:'var(--brand-ink)',marginBottom:12}}>FOUR PILLARS</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:18}}>
              {[['SI','Specimen Info'],['CR','Contact & Routing'],['CF','Collection & Format'],['MD','Momentum & Depth']].map(([k,full])=>(
                <div key={k}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:6}}>
                    <span className="mono-sm" style={{color:'var(--text-3)',letterSpacing:'.12em'}}>{k}</span>
                    <span className="serif" style={{fontSize:20,color:'var(--text)',lineHeight:1}}>{inst[k]}<span style={{fontSize:11,color:'var(--text-3)',fontFamily:'var(--mono)'}}>/5</span></span>
                  </div>
                  <div style={{height:5,background:'var(--bg-sunk)',borderRadius:2.5,overflow:'hidden',marginBottom:8}}>
                    <div style={{height:'100%',width:`${(inst[k]/5)*100}%`,background:'var(--brand-ink)'}}/>
                  </div>
                  <div className="serif" style={{fontSize:12,color:'var(--text)',marginBottom:3}}>{full}</div>
                  <div style={{fontFamily:'var(--body)',fontSize:11,color:'var(--text-2)',lineHeight:1.4}}>{inst.anchors[k]}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hypotheses */}
          <div style={{padding:'20px 0',borderBottom:'1px solid var(--bg-sunk)'}}>
            <div className="mono" style={{color:'var(--brand-ink)',marginBottom:10}}>HYPOTHESES · PASS 5a</div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {hyps.map((h,i)=>(
                <div key={i} style={{display:'flex',gap:12,alignItems:'flex-start',padding:'10px 14px',background:'#FBF9F4',border:'1px solid var(--bg-sunk)',borderRadius:8}}>
                  <span className="mono-sm" style={{color:'var(--text-3)',minWidth:30,paddingTop:2}}>H{i+1}</span>
                  <div style={{flex:1,fontSize:13,color:'var(--text)',lineHeight:1.45}}>{h.t}</div>
                  <span className="mono-sm" style={{textTransform:'uppercase',letterSpacing:'.1em',color: h.conf==='high'?'var(--brand-ink)': h.conf==='medium'?'var(--text-2)':'var(--text-3)'}}>{h.conf} CONF</span>
                </div>
              ))}
            </div>
          </div>

          {/* Verification results */}
          <div style={{padding:'20px 0',borderBottom:'1px solid var(--bg-sunk)'}}>
            <div className="mono" style={{color:'var(--brand-ink)',marginBottom:10}}>VERIFICATION · PASS 5b</div>
            {verif.length>0 ? (
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {verif.map((v,i)=>{
                  const kind = v.status==='confirmed'?'verified': v.status==='refuted'?'refuted':'open-q';
                  return (
                    <div key={i} style={{display:'flex',gap:14,alignItems:'center',padding:'8px 0',borderBottom: i<verif.length-1?'1px dashed var(--bg-sunk)':'none'}}>
                      <LabelBadge kind={kind} compact/>
                      <div style={{flex:1}}>
                        <div style={{fontSize:12.5,color:'var(--text)',lineHeight:1.4}}>{v.check}</div>
                        {v.note && <div className="mono-sm" style={{color:'var(--text-3)',fontSize:9.5,marginTop:2}}>{v.note}</div>}
                      </div>
                      <span className="mono-sm" style={{color:'var(--text-2)',textTransform:'uppercase',letterSpacing:'.1em'}}>{v.status}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text-3)',fontStyle:'italic'}}>no verification run — institution below enrichment threshold</div>
            )}
          </div>

          {/* Gap / what's known */}
          <div style={{padding:'20px 0'}}>
            <div className="mono" style={{color:'var(--brand-ink)',marginBottom:10}}>EVIDENCE SUMMARY</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
              <div style={{padding:14,background:'#FBF9F4',border:'1px solid var(--bg-sunk)',borderRadius:8}}>
                <div className="mono-sm" style={{color:'var(--brand-ink)',marginBottom:6}}>KNOWN</div>
                <div style={{fontSize:12.5,color:'var(--text)',lineHeight:1.45}}>{inst.fact}</div>
              </div>
              <div style={{padding:14,background:'#FBF9F4',border:'1px solid var(--bg-sunk)',borderRadius:8}}>
                <div className="mono-sm" style={{color:'var(--text-2)',marginBottom:6}}>GAP</div>
                <div style={{fontSize:12.5,color:'var(--text)',lineHeight:1.45}}>{inst.gap}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { OutcomeSimplified, HYPOTHESES, VERIFICATION });
