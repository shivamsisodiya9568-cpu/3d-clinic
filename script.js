/* ==========================================================================
   RS Clinic – Physiotherapy & Pain Rehabilitation, Agra
   script.js
   CDN build – React 18 UMD + Framer Motion + Babel
   Fully responsive – Phone / Tablet / Desktop

   This is the extracted application JavaScript. In the 10,000-line
   standalone HTML file (rs-clinic-full.html) this entire script is
   inlined inside <script type="text/babel"> … </script>

   Features preserved from the cinematic space-travel prompt:
   - FadingVideo component – custom JS rAF crossfade, no CSS transitions
     FADE_MS = 500, FADE_OUT_LEAD = 0.55
   - BlurText – word-by-word blur-in, IntersectionObserver
   - Liquid-glass design system
   - Framer Motion entrance animations
   - Instrument Serif (italic) + Barlow
   ========================================================================== */

const { useState, useEffect, useRef, useCallback } = React;
const { motion, AnimatePresence } = Motion;

/* Suppress Framer list-key dev warnings – benign in Babel builds */
if (typeof window !== 'undefined') {
  const oe = console.error;
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('Each child in a list should have a unique "key"')) return;
    oe(...args);
  };
}

/* ---------- Icons ---------- */
const ArrowUpRightIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M7 17L17 7" /><path d="M7 7h10v10" />
  </svg>
);
const PlayIcon = ({ className="w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4" /></svg>
);
const ClockIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>
);
const UsersIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const CheckIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>);
const StarIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>);
const MenuIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>);
const CloseIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>);

/* ---------- FadingVideo – exact spec ---------- */
const FADE_MS = 500;
const FADE_OUT_LEAD = 0.55;

function FadingVideo({ src, className = "", style = {}, ...rest }) {
  const videoRef = useRef(null);
  const rafIdRef = useRef(null);
  const fadingOutRef = useRef(false);

  const fadeTo = useCallback((target, duration = FADE_MS) => {
    const v = videoRef.current; if (!v) return;
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    const startOpacity = parseFloat(v.style.opacity || "0") || 0;
    const delta = target - startOpacity;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      v.style.opacity = String(startOpacity + delta * t);
      if (t < 1) { rafIdRef.current = requestAnimationFrame(tick); } else { rafIdRef.current = null; }
    };
    rafIdRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    const v = videoRef.current; if (!v) return;
    const onLoaded = () => { v.style.opacity = "0"; v.play().catch(()=>{}); fadeTo(1); };
    const onTimeUpdate = () => {
      if (!v.duration || fadingOutRef.current) return;
      const remaining = v.duration - v.currentTime;
      if (remaining <= FADE_OUT_LEAD && remaining > 0) { fadingOutRef.current = true; fadeTo(0); }
    };
    const onEnded = () => {
      if (v) v.style.opacity = "0";
      setTimeout(() => { if (!v) return; v.currentTime = 0; v.play().catch(()=>{}); fadingOutRef.current = false; fadeTo(1); }, 100);
    };
    v.addEventListener("loadeddata", onLoaded);
    v.addEventListener("timeupdate", onTimeUpdate);
    v.addEventListener("ended", onEnded);
    if (v.readyState >= 2) onLoaded();
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      v.removeEventListener("loadeddata", onLoaded);
      v.removeEventListener("timeupdate", onTimeUpdate);
      v.removeEventListener("ended", onEnded);
    };
  }, [fadeTo]);

  return (
    <video
      ref={videoRef}
      src={src}
      autoPlay muted playsInline preload="auto"
      style={{ opacity: 0, ...style }}
      className={className}
      {...rest}
    />
  );
}

/* ---------- BlurText ---------- */
function BlurText({ text, className = "" }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting){ setInView(true); obs.disconnect(); }}, { threshold: 0.1 });
    obs.observe(el); return () => obs.disconnect();
  }, []);
  const words = text.split(" ");
  return (
    <p ref={ref} className={className + " blur-text-wrap"}>
      {words.map((w,i)=>(
        <motion.span
          key={i}
          initial={{ filter:"blur(10px)", opacity:0, y:50 }}
          animate={inView ? { filter:["blur(5px)","blur(0px)"], opacity:[0.5,1], y:[-5,0] } : {}}
          transition={{ duration:.7, times:[0,.5,1], ease:"easeOut", delay: i * 0.1 }}
          className="blur-text-word"
        >{w}</motion.span>
      ))}
    </p>
  );
}

const fadeIn = (delay=0)=>({ initial:{ filter:"blur(10px)", opacity:0, y:20 }, animate:{ filter:"blur(0px)", opacity:1, y:0 }, transition:{ duration:.78, ease:"easeOut", delay }});

/* Clinical video sources */
const HERO_VIDEO = "https://videos.pexels.com/video-files/6111034/6111034-uhd_3840_2160_25fps.mp4";
const CAPABILITIES_VIDEO = "https://videos.pexels.com/video-files/6111017/6111017-uhd_3840_2160_25fps.mp4";

/* ---------- Router ---------- */
const PAGES = [
  {id:"home", label:"Home"},
  {id:"services", label:"Services"},
  {id:"doctors", label:"Doctors"},
  {id:"results", label:"Results"},
  {id:"pricing", label:"Pricing"},
  {id:"contact", label:"Book Visit"},
];
function useHashPage(){
  const get = ()=>{ const h = (window.location.hash.replace("#","")||"home"); return PAGES.find(x=>x.id===h)?.id || "home"; };
  const [page, setPage] = useState(get());
  useEffect(()=>{ const onH = ()=>setPage(get()); window.addEventListener("hashchange", onH); if(!window.location.hash) window.location.hash="home"; return()=>window.removeEventListener("hashchange", onH); },[]);
  const navigate = (p)=>{ if(p===page){ window.scrollTo({top:0,behavior:"smooth"}); return; } window.location.hash=p; window.scrollTo({top:0,behavior:"smooth"}); };
  return [page, navigate];
}

/* ---------- Navbar ---------- */
function Navbar({ page, navigate }){
  const [open, setOpen] = useState(false);
  useEffect(()=>{ document.body.style.overflow = open ? "hidden" : ""; return ()=>{document.body.style.overflow=""}},[open]);
  return (
    <nav className="rs-nav-wrap">
      <div className="rs-nav-inner">
        <button onClick={()=>navigate("home")} className="rs-nav-logo liquid-glass"><span>rs</span></button>
        <div className="hidden lg:flex items-center liquid-glass rounded-full" style={{padding:"6px"}}>
          {PAGES.slice(0,5).map(l=>(
            <button key={l.id} onClick={()=>navigate(l.id)} style={{padding:"8px 14px", fontSize:"13.6px", borderRadius:9999, color: page===l.id ? "#fff" : "rgba(255,255,255,.80)"}}>{l.label}</button>
          ))}
          <button onClick={()=>navigate("contact")} className="rs-btn rs-btn-white" style={{marginLeft:"8px", minHeight:"auto", padding:"8px 16px", fontSize:"13.5px"}}>Book Appointment <ArrowUpRightIcon className="w-4 h-4"/></button>
        </div>
        <button aria-label="Menu" onClick={()=>setOpen(!open)} className="lg:hidden rs-nav-logo liquid-glass" style={{color:"#fff"}}>{open ? <CloseIcon/> : <MenuIcon/>}</button>
        <div className="hidden lg:block" style={{width:48, height:48, opacity:0}} />
      </div>
      <AnimatePresence>
        {open && (<>
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",backdropFilter:"blur(2px)", zIndex:55}} className="lg:hidden" />
          <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} className="lg:hidden liquid-glass-strong" style={{marginTop:"12px", borderRadius:"22px", padding:"12px", position:"relative", zIndex:65, maxWidth:"80rem", marginLeft:"auto", marginRight:"auto"}}>
            {PAGES.map(l=>(
              <button key={l.id} onClick={()=>{navigate(l.id); setOpen(false);}} style={{display:"block", width:"100%", textAlign:"left", padding:"13px 16px", borderRadius:12, color: page===l.id ? "#fff":"rgba(255,255,255,.88)", background: page===l.id ? "rgba(255,255,255,.055)":"transparent", fontSize:"16px"}}>{l.label}</button>
            ))}
            <button onClick={()=>{navigate("contact"); setOpen(false);}} className="rs-btn rs-btn-white" style={{width:"100%", marginTop:"8px"}}>Book Appointment</button>
            <div style={{padding:"12px 16px 4px", color:"rgba(255,255,255,.6)", fontSize:"12.5px"}}>+91 562 400 8814 • Sanjay Place, Agra</div>
          </motion.div>
        </>)}
      </AnimatePresence>
    </nav>
  );
}

/* ---------- Pages ----------
   Home, Services, Doctors, Results, Pricing, Contact
   All content is for RS Clinic – Physiotherapy & Pain Rehabilitation, Agra
   Fully responsive: phone / tablet / desktop
   ------------------------------------------------------------------ */

/* Home – Hero */
function ClinicHero({ navigate }){
  return (
    <section style={{position:"relative", minHeight:"100svh", background:"#000", overflow:"hidden", display:"flex", flexDirection:"column"}}>
      <FadingVideo src={HERO_VIDEO} className="absolute" style={{left:"50%", top:0, transform:"translateX(-50%)", width:"120%", height:"120%", objectFit:"cover", objectPosition:"center", zIndex:0}} />
      <div style={{position:"absolute", inset:0, background:"rgba(0,0,0,.42)", zIndex:1}} />
      <div style={{position:"absolute", inset:0, background:"linear-gradient(to top, rgba(0,0,0,.55), rgba(0,0,0,.08), rgba(0,0,0,.18))", zIndex:1}} />
      <div style={{position:"relative", zIndex:10, display:"flex", flexDirection:"column", minHeight:"100svh"}}>
        <div style={{flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", paddingTop:"6.5rem", paddingBottom:"2.5rem", paddingLeft:"1rem", paddingRight:"1rem", textAlign:"center"}}>
          <motion.div {...fadeIn(.35)} className="liquid-glass rounded-full" style={{display:"flex", alignItems:"center", gap:10, padding:"6px 14px 6px 6px", marginBottom:"1.25rem"}}>
            <span style={{background:"#fff", color:"#000", padding:"5px 12px", borderRadius:9999, fontSize:12, fontWeight:600}}>Open now</span>
            <span style={{fontSize:"13.5px", color:"rgba(255,255,255,.92)"}}>Robotic Gait Lab • Sanjay Place, Agra</span>
          </motion.div>
          <div style={{maxWidth:900}}>
            <BlurText text="Move without pain. Recover with confidence." className="hero-title" />
            <motion.div {...fadeIn(.72)} style={{fontFamily:"'Instrument Serif', serif", fontStyle:"italic", color:"rgba(255,255,255,.95)", fontSize:"clamp(26px, 3.2vw, 44px)", marginTop:8}}>RS Clinic, Agra</motion.div>
          </div>
          <motion.p {...fadeIn(.82)} style={{marginTop:"1.2rem", color:"rgba(255,255,255,.9)", maxWidth:640, fontWeight:300, lineHeight:1.6, fontSize:"clamp(14.8px,1.22vw,17px)"}}>
            NABH-aligned physiotherapy & pain rehabilitation. 1:1 hands-on care, robotic movement analysis, and a clear recovery plan — from first visit to full return.
          </motion.p>
          <motion.div {...fadeIn(1.05)} style={{display:"flex", flexWrap:"wrap", gap:16, justifyContent:"center", marginTop:"1.5rem"}}>
            <button onClick={()=>navigate("contact")} className="rs-btn liquid-glass-strong" style={{color:"#fff"}}>Book Your Assessment <ArrowUpRightIcon/></button>
            <button onClick={()=>navigate("services")} style={{color:"rgba(255,255,255,.95)", display:"inline-flex", alignItems:"center", gap:8, fontSize:14}}><PlayIcon/> Clinic Tour</button>
          </motion.div>
          <motion.div {...fadeIn(1.28)} style={{display:"flex", flexWrap:"wrap", gap:14, justifyContent:"center", marginTop:"2rem"}}>
            {[
              ["18 Min", "Avg. first assessment\nwith gait scan", <ClockIcon key="c"/>],
              ["14,320+", "Patients treated in Agra\nsince 2011", <UsersIcon key="u"/>],
            ].map(([num, label, icon])=>(
              <div key={num} className="liquid-glass" style={{borderRadius:"1.2rem", padding:"18px", width:"min(226px, 100%)", textAlign:"left"}}>
                {icon}
                <div style={{marginTop:34, fontFamily:"'Instrument Serif', serif", fontStyle:"italic", fontSize:32, color:"#fff"}}>{num}</div>
                <div style={{marginTop:6, fontSize:12.6, color:"rgba(255,255,255,.9)", whiteSpace:"pre-line"}}>{label}</div>
              </div>
            ))}
          </motion.div>
        </div>
        <motion.div {...fadeIn(1.42)} style={{paddingBottom:"2rem", display:"flex", flexDirection:"column", alignItems:"center", gap:12, paddingLeft:16, paddingRight:16, textAlign:"center"}}>
          <div className="liquid-glass rounded-full" style={{padding:"4px 14px", fontSize:12, color:"rgba(255,255,255,.9)"}}>CLINICAL PARTNERS & REFERRALS</div>
          <div style={{display:"flex", flexWrap:"wrap", justifyContent:"center", gap:"18px 36px", fontFamily:"'Instrument Serif', serif", fontStyle:"italic", fontSize:"clamp(20px,2.3vw,30px)", color:"#fff"}}>
            <span>Apollo</span><span>Fortis</span><span>AIIMS</span><span>Max</span><span>Medanta</span>
          </div>
          <div style={{fontSize:11.7, color:"rgba(255,255,255,.62)"}}>Ayushman Bharat • CGHS • Private Insurance TPA • Cashless billing available</div>
        </motion.div>
      </div>
    </section>
  );
}

/* Capabilities */
function CapabilitiesBlock({ navigate }){
  const cards = [
    { title:"Motion Lab", tags:["Gait Mapping","3D Capture","Force Plates","Video Report"], body:"Robotic gait & posture screening in 18 minutes. Pinpoints root cause, tracks symmetry session-to-session, and gives you a shareable video report." },
    { title:"Sports Rehab", tags:["ACL / Rotator","Return to Play","Isokinetic","Field Tested"], body:"ACL, ankle, shoulder – load-managed, isokinetic-tracked rehab. Return-to-play clearance with hop tests and strength symmetry ≥90%." },
    { title:"Pain Relief", tags:["Dry Needling","Manual Release","Shockwave","TENS / IFT"], body:"Chronic neck, low-back, knee OA and joint pain. Multimodal: hands-on release, needling, shockwave, and graded movement therapy." },
  ];
  return (
    <section style={{position:"relative", minHeight:"100vh", background:"#000", overflow:"hidden"}}>
      <FadingVideo src={CAPABILITIES_VIDEO} style={{position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover"}} />
      <div style={{position:"absolute", inset:0, background:"rgba(0,0,0,.5)", zIndex:1}}/>
      <div className="rs-container" style={{position:"relative", zIndex:10, paddingTop:"5rem", paddingBottom:"3.5rem", minHeight:"100vh", display:"flex", flexDirection:"column"}}>
        <div style={{marginBottom:"auto"}}>
          <p style={{fontSize:14, color:"rgba(255,255,255,.82)", marginBottom:16}}>// Specialties — Agra</p>
          <h2 className="capabilities-title">Care<br/>evolved</h2>
          <p style={{color:"rgba(255,255,255,.85)", marginTop:14, maxWidth:430, fontWeight:300}}>Evidence-led physiotherapy with real measurement. You see your numbers improve every week.</p>
        </div>
        <div className="rs-grid rs-grid-3" style={{marginTop:"2.5rem"}}>
          {cards.map(c=>(
            <div key={c.title} className="liquid-glass" style={{borderRadius:"1.3rem", padding:"1.35rem", minHeight:320, display:"flex", flexDirection:"column"}}>
              <div style={{display:"flex", justifyContent:"space-between", gap:12}}>
                <div className="liquid-glass" style={{width:42,height:42,borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>◉</div>
                <div style={{display:"flex", flexWrap:"wrap", justifyContent:"flex-end", gap:6, maxWidth:"68%"}}>
                  {c.tags.map(t=><span key={t} className="liquid-glass rounded-full" style={{padding:"4px 11px", fontSize:11, color:"rgba(255,255,255,.9)"}}>{t}</span>)}
                </div>
              </div>
              <div style={{flex:1}}/>
              <h3 style={{fontFamily:"'Instrument Serif', serif", fontStyle:"italic", fontSize:30, marginTop:18}}>{c.title}</h3>
              <p style={{marginTop:10, color:"rgba(255,255,255,.88)", fontSize:14.4, fontWeight:300}}>{c.body}</p>
              <button onClick={()=>navigate("services")} style={{marginTop:14, fontSize:13.2, color:"rgba(255,255,255,.85)"}}>Learn more →</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* Small helpers */
const GlassCard = ({children, style={}}) => <div className="liquid-glass rs-card" style={style}>{children}</div>;
const SectionKicker = ({children}) => <p className="rs-kicker">// {children}</p>;

/* --- HOME PAGE --- */
function HomePage({ navigate }){
  const conditions = [
    ["Back & Neck Pain","Disc, spondylosis, whiplash, sciatica."],
    ["Knee & Hip OA","Arthritis, post-TKR/THR rehab."],
    ["Sports Injuries","ACL, meniscus, ankle, tennis elbow, rotator cuff."],
    ["Post-Surgery","Fracture, ligament repair, spine surgery."],
    ["Neuro Rehab","Stroke, Bell's palsy, Parkinson's, balance."],
    ["Work Pain","Desk neck, carpal tunnel, RSI, ergonomics."],
  ];
  const testimonials = [
    {name:"Meena Gupta, 54 — Kamla Nagar", quote:"Knee pain for 8 years. After 12 sessions at RS Clinic I can walk Taj Nature Walk again, no cane. Very kind staff."},
    {name:"Arjun Yadav, 26 — Dayalbagh", quote:"ACL reconstruction rehab. Cleared for football in 6 months. Hop test 94% symmetry. Thank you Dr. Rohit!"},
    {name:"S. Khan, 41 — Tajganj", quote:"Frozen shoulder released in 9 visits. Dry needling + exercises worked when painkillers didn't. Clean clinic."},
  ];
  return (<>
    <ClinicHero navigate={navigate} />
    <CapabilitiesBlock navigate={navigate} />
    <section className="rs-section">
      <div className="rs-container">
        <div style={{display:"flex", flexWrap:"wrap", justifyContent:"space-between", alignItems:"flex-end", gap:20, marginBottom:28}}>
          <div><SectionKicker>Conditions</SectionKicker><h3 className="rs-h2">What we treat in Agra</h3></div>
          <p style={{color:"rgba(255,255,255,.80)", maxWidth:420, fontWeight:300, fontSize:14.8}}>Full musculoskeletal & neuro rehab. If you're unsure, book a 18-min screening — ₹650, first treatment included.</p>
        </div>
        <div className="rs-grid rs-grid-3">
          {conditions.map(([t,d])=> <GlassCard key={t}><div style={{fontFamily:"'Instrument Serif', serif", fontStyle:"italic", fontSize:21}}>{t}</div><div style={{color:"rgba(255,255,255,.8)", fontSize:13.6, marginTop:6, fontWeight:300}}>{d}</div></GlassCard>)}
        </div>
        <div style={{marginTop:16, color:"rgba(255,255,255,.7)", fontSize:13.2}}>Also: Geriatric fall prevention • Paediatric gait • Women's pelvic health • TMJ • Migraine / cervicogenic headache.</div>
      </div>
    </section>
    <section className="rs-section">
      <div className="rs-container">
        <div style={{display:"grid", gap:28, gridTemplateColumns:"repeat(auto-fit, minmax(300px,1fr))", alignItems:"start"}}>
          <div>
            <SectionKicker>Patient results</SectionKicker>
            <h3 className="rs-h2" style={{fontSize:"clamp(32px,3.4vw,46px)"}}>Real people.<br/>Measured recovery.</h3>
            <div style={{display:"flex", gap:32, marginTop:20}}>
              <div><div style={{fontFamily:"'Instrument Serif', serif", fontStyle:"italic", fontSize:32}}>4.9★</div><div style={{fontSize:12.4, color:"rgba(255,255,255,.8)"}}>Google, 412 reviews</div></div>
              <div><div style={{fontFamily:"'Instrument Serif', serif", fontStyle:"italic", fontSize:32}}>91%</div><div style={{fontSize:12.4, color:"rgba(255,255,255,.8)"}}>Pain ↓ ≥50% in 6 visits</div></div>
            </div>
            <button onClick={()=>navigate("results")} style={{marginTop:18, textDecoration:"underline", textUnderlineOffset:4, color:"rgba(255,255,255,.9)", fontSize:14}}>See patient stories →</button>
          </div>
          <div className="rs-grid" style={{gridTemplateColumns:"repeat(auto-fit, minmax(240px,1fr))"}}>
            {testimonials.map(t=>(
              <GlassCard key={t.name}>
                <div style={{color:"#fde68a", fontSize:13, marginBottom:8}}>★★★★★</div>
                <div style={{color:"rgba(255,255,255,.9)", fontSize:13.6, lineHeight:1.55}}>"{t.quote}"</div>
                <div style={{color:"rgba(255,255,255,.6)", fontSize:11.6, marginTop:10}}>{t.name}</div>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>
    </section>
    <section className="rs-section" style={{paddingTop:"3.8rem", paddingBottom:"3.8rem"}}>
      <div className="rs-container" style={{textAlign:"center", maxWidth:820}}>
        <h3 className="rs-h2" style={{fontSize:"clamp(28px,3.4vw,48px)"}}>Start with a full assessment. ₹650.</h3>
        <p style={{color:"rgba(255,255,255,.82)", marginTop:10}}>45 minutes • Gait scan • Diagnosis plan PDF • First treatment included • Same-day slots in Sanjay Place</p>
        <div style={{display:"flex", flexWrap:"wrap", gap:12, justifyContent:"center", marginTop:22}}>
          <button onClick={()=>navigate("contact")} className="rs-btn rs-btn-white">Book Assessment</button>
          <a href="https://wa.me/915624008814" target="_blank" className="rs-btn rs-btn-glass liquid-glass">WhatsApp</a>
          <a href="tel:+915624008814" style={{padding:"11px 10px", color:"rgba(255,255,255,.85)", fontSize:14}}>Call +91 562 400 8814</a>
        </div>
      </div>
    </section>
  </>);
}

/* --- SERVICES PAGE --- */
function ServicesPage({ navigate }){
  const services = [
    ["Advanced Physiotherapy","Manual therapy, IFT/TENS, ultrasound, therapeutic exercise. 1:1, 45 min.","₹850 / session"],
    ["Sports Injury Rehab","ACL, ankle, rotator cuff. Isokinetic testing, plyometrics, RTP clearance.","₹1,200 / session"],
    ["Post-Op Rehabilitation","TKR/THR, fracture, ligament repair. Swelling control, scar care, strength ladder.","From ₹850"],
    ["Spine & Disc Care","McKenzie MDT, traction, core stability. Neck/back, sciatica, spondylosis.","₹850"],
    ["Neuro Rehabilitation","Stroke, Bell's palsy, Parkinson's, balance retraining. Bobath / PNF.","₹950"],
    ["Dry Needling / Cupping","Myofascial trigger release. Add-on to physio. Per region.","₹950 add-on"],
    ["Shockwave Therapy","Plantar fasciitis, tennis elbow, calcific tendinitis. 2000 pulses.","₹1,400 / area"],
    ["Geriatric Mobility","Fall prevention, walking confidence, osteoporosis-safe strength.","₹850"],
    ["Women's / Pelvic Health","Postnatal recovery, incontinence, diastasis. Private suite.","₹950"],
  ];
  return (
    <div style={{paddingTop:"5.2rem", minHeight:"100vh", background:"#000"}}>
      <div className="rs-container" style={{paddingBottom:"4rem"}}>
        <SectionKicker>Services — RS Clinic Agra</SectionKicker>
        <div style={{display:"flex", flexWrap:"wrap", justifyContent:"space-between", alignItems:"flex-end", gap:18, marginBottom:28}}>
          <h1 className="rs-h1" style={{fontSize:"clamp(36px,4.6vw,64px)"}}>Complete physio<br/>under one roof.</h1>
          <p style={{color:"rgba(255,255,255,.8)", maxWidth:360}}>1:1 care, never assistants. Evidence protocols, measured outcomes. Sanjay Place, MG Road.</p>
        </div>
        <div className="rs-grid rs-grid-3">
          {services.map(([n,d,pr])=>(
            <GlassCard key={n} style={{minHeight:175, display:"flex", flexDirection:"column"}}>
              <div style={{fontFamily:"'Instrument Serif', serif", fontStyle:"italic", fontSize:24}}>{n}</div>
              <p style={{color:"rgba(255,255,255,.82)", fontSize:13.6, marginTop:8, fontWeight:300}}>{d}</p>
              <div style={{flex:1}}/>
              <div style={{color:"rgba(255,255,255,.9)", fontSize:13.2, marginTop:10}}>{pr}</div>
            </GlassCard>
          ))}
        </div>
        <div style={{textAlign:"center", marginTop:36}}><button onClick={()=>navigate("contact")} className="rs-btn liquid-glass-strong" style={{color:"#fff"}}>Book a service →</button></div>
      </div>
    </div>
  );
}

/* --- DOCTORS PAGE --- */
function DoctorsPage({ navigate }){
  const team = [
    {name:"Dr. Rohit Singh, PT", role:"Founder • MPT Ortho • 14 yrs", cred:"MIAP • COMT • Dry Needling Certified", blurb:"Leads sports & post-op rehab. Former Apollo Agra. ACL RTP specialist.", img:"https://images.pexels.com/photos/4270371/pexels-photo-4270371.jpeg?auto=compress&cs=tinysrgb&w=640"},
    {name:"Dr. Priya Sharma, PT", role:"Senior Physio • MPT Neuro • 9 yrs", cred:"Bobath NDT • Women's Health", blurb:"Neuro rehab, pelvic health, geriatric balance. Warm, meticulous care.", img:"https://images.pexels.com/photos/32115905/pexels-photo-32115905.jpeg?auto=compress&cs=tinysrgb&w=640"},
    {name:"Dr. Aman Verma, PT", role:"Sports Physio • BPT, Dip. Sports • 6 yrs", cred:"ISAK • K-Taping • S&C L1", blurb:"Field-side experience. Cricket / football RTP, isokinetic testing.", img:"https://images.pexels.com/photos/32115962/pexels-photo-32115962.jpeg?auto=compress&cs=tinysrgb&w=640"},
  ];
  return (
    <div style={{paddingTop:"5.2rem", background:"#000", minHeight:"100vh"}}>
      <div className="rs-container" style={{paddingBottom:"4rem"}}>
        <SectionKicker>Our Doctors — Agra</SectionKicker>
        <h1 className="rs-h1" style={{fontSize:"clamp(34px,4.3vw,60px)", marginBottom:28}}>Hands-on clinicians.<br/>Measured outcomes.</h1>
        <div className="rs-grid rs-grid-3">
          {team.map(d=>(
            <GlassCard key={d.name}>
              <div style={{borderRadius:14, overflow:"hidden", aspectRatio:"4 / 4.4", background:"rgba(255,255,255,.04)", marginBottom:14}}>
                <img src={d.img} alt={d.name} style={{width:"100%", height:"100%", objectFit:"cover"}} loading="lazy"/>
              </div>
              <div style={{fontFamily:"'Instrument Serif', serif", fontStyle:"italic", fontSize:23}}>{d.name}</div>
              <div style={{color:"rgba(255,255,255,.85)", fontSize:13, marginTop:4}}>{d.role}</div>
              <div style={{color:"rgba(255,255,255,.65)", fontSize:12.2, marginTop:4}}>{d.cred}</div>
              <div style={{color:"rgba(255,255,255,.8)", fontSize:13.2, marginTop:10, fontWeight:300}}>{d.blurb}</div>
            </GlassCard>
          ))}
        </div>
        <div style={{marginTop:32}}><button onClick={()=>navigate("contact")} className="rs-btn rs-btn-white">Book with our team</button></div>
      </div>
    </div>
  );
}

/* --- RESULTS PAGE --- */
function ResultsPage({ navigate }){
  const stories = [
    ["ACL – Arjun, 26, cricketer","Return to play 24 weeks • Quad symmetry 94% • Hop test passed","Clear loading plan every week. No guesswork."],
    ["Knee OA – Meena, 54","Pain 8/10 → 2/10 in 12 visits • Walk 2 km unassisted","I can do stairs at Jama Masjid again."],
    ["Frozen shoulder – S. Khan, 41","ROM full in 9 sessions • Needling + graded mobilization","Slept through the night by visit 3."],
    ["L4-L5 disc – Vikram, 37","Sciatica resolved 7 visits • Core program, no surgery","Back to desk in 2 weeks."],
    ["Post-TKR – Mrs. Lata, 68","0–120° in 5 weeks • Independent walking day 3","Home visits first week, then clinic."],
    ["Ankle sprain – Nisha, 19","Return to badminton 4 weeks • Balance Y-test 98%","Taping + strength, very confidence-building."],
  ];
  return (
    <div style={{paddingTop:"5.2rem", background:"#000", minHeight:"100vh"}}>
      <div className="rs-container" style={{paddingBottom:"4rem"}}>
        <SectionKicker>Results — RS Clinic Agra</SectionKicker>
        <div style={{display:"flex", flexWrap:"wrap", justifyContent:"space-between", alignItems:"flex-end", gap:14, marginBottom:26}}>
          <h1 className="rs-h1" style={{fontSize:"clamp(34px,4.2vw,58px)"}}>Patient stories<br/>from Agra.</h1>
          <div style={{color:"rgba(255,255,255,.85)", fontSize:14}}>★ 4.9 / 5 • 412 Google reviews • 91% achieve ≥50% pain reduction in 6 visits</div>
        </div>
        <div className="rs-grid rs-grid-3">
          {stories.map(([who,res,q])=>(
            <GlassCard key={who}>
              <div style={{fontFamily:"'Instrument Serif', serif", fontStyle:"italic", fontSize:20}}>{who}</div>
              <div style={{color:"#d1fae5", fontSize:13, marginTop:8}}>{res}</div>
              <div style={{color:"rgba(255,255,255,.8)", fontSize:13.4, marginTop:10}}>"{q}"</div>
            </GlassCard>
          ))}
        </div>
        <div className="liquid-glass" style={{borderRadius:20, padding:"22px 24px", marginTop:34, display:"flex", flexWrap:"wrap", alignItems:"center", justifyContent:"space-between", gap:14}}>
          <div><div style={{fontFamily:"'Instrument Serif', serif", fontStyle:"italic", fontSize:26}}>Your recovery, measured.</div>
          <div style={{color:"rgba(255,255,255,.8)", fontSize:13.8, marginTop:4}}>Pain scales, ROM, strength symmetry — tracked every visit.</div></div>
          <button onClick={()=>navigate("contact")} className="rs-btn liquid-glass-strong" style={{color:"#fff"}}>Start your recovery</button>
        </div>
      </div>
    </div>
  );
}

/* --- PRICING PAGE --- */
function PricingPage({ navigate }){
  const plans = [
    ["First Assessment","₹650","45 min • Most popular",["Gait / posture scan","Pain & ROM mapping","Diagnosis plan PDF","First treatment included"]],
    ["Physio Session","₹850","45 min • 1:1 hands-on",["Manual therapy","Electro + exercises","Home video program","Progress re-test"], true],
    ["Sports Rehab","₹1,200","60 min",["Isokinetic testing","Plyometric loading","RTP hop tests","Clear milestones"]],
    ["Neuro Rehab","₹950","50 min",["Bobath / PNF","Balance retraining","Caregiver training","Home plan"]],
  ];
  return (
    <div style={{paddingTop:"5.2rem", background:"#000", minHeight:"100vh"}}>
      <div className="rs-container" style={{paddingBottom:"4rem"}}>
        <SectionKicker>Pricing — Agra • GST inclusive</SectionKicker>
        <h1 className="rs-h1" style={{fontSize:"clamp(34px,4.3vw,58px)", marginBottom:28}}>Transparent fees.<br/>Real outcomes.</h1>
        <div className="rs-grid rs-grid-4">
          {plans.map(([name,price,note,features,popular])=>(
            <div key={name} className="liquid-glass rs-card" style={{position:"relative", display:"flex", flexDirection:"column"}}>
              {popular && <span style={{position:"absolute", top:-12, right:14, background:"#fff", color:"#111", fontSize:11, fontWeight:600, padding:"4px 10px", borderRadius:9999}}>Most booked</span>}
              <div style={{color:"rgba(255,255,255,.75)", fontSize:12.3}}>{note}</div>
              <div style={{fontFamily:"'Instrument Serif', serif", fontStyle:"italic", fontSize:25, marginTop:4}}>{name}</div>
              <div style={{fontFamily:"'Instrument Serif', serif", fontStyle:"italic", fontSize:32, marginTop:6}}>{price}</div>
              <ul style={{marginTop:14, color:"rgba(255,255,255,.85)", fontSize:13.2, lineHeight:1.85, paddingLeft:14, fontWeight:300}}>
                {features.map(f=><li key={f}>{f}</li>)}
              </ul>
              <button onClick={()=>navigate("contact")} className="rs-btn liquid-glass-strong" style={{marginTop:18, color:"#fff", width:"100%"}}>Book</button>
            </div>
          ))}
        </div>
        <p style={{color:"rgba(255,255,255,.62)", fontSize:12.8, marginTop:18}}>Ayushman Bharat • CGHS • Private TPA cashless • GST bills • UPI / Card / Cash • No advance needed.</p>
        <div style={{marginTop:24}}><button onClick={()=>navigate("contact")} className="rs-btn rs-btn-white">Book at these rates</button></div>
      </div>
    </div>
  );
}

/* --- CONTACT PAGE --- */
function ContactPage(){
  const onSubmit = (e)=>{ e.preventDefault(); alert("Thank you! RS Clinic Agra will call/WhatsApp you shortly to confirm your slot."); e.target.reset(); };
  return (
    <div style={{paddingTop:"5.2rem", background:"#000", minHeight:"100vh"}}>
      <div className="rs-container" style={{paddingBottom:"3rem", display:"grid", gap:32, gridTemplateColumns:"repeat(auto-fit, minmax(320px,1fr))", alignItems:"start"}}>
        <div>
          <SectionKicker>Visit RS Clinic</SectionKicker>
          <h1 className="rs-h1" style={{fontSize:"clamp(32px,4vw,54px)"}}>Come see us<br/>in Sanjay Place.</h1>
          <div className="rs-grid rs-grid-2" style={{marginTop:24}}>
            <GlassCard>
              <div style={{fontSize:11, textTransform:"uppercase", letterSpacing:".06em", color:"rgba(255,255,255,.6)"}}>Address</div>
              <div style={{marginTop:8, lineHeight:1.6}}>RS Clinic – Physiotherapy & Pain Rehab<br/>14-B, Sanjay Place, M.G. Road<br/>Agra, Uttar Pradesh 282002<br/>India</div>
              <a href="https://maps.google.com/?q=Sanjay Place, Agra" target="_blank" style={{display:"inline-block", marginTop:10, textDecoration:"underline", textUnderlineOffset:4, fontSize:13.5, color:"rgba(255,255,255,.9)"}}>Open in Maps →</a>
            </GlassCard>
            <GlassCard>
              <div style={{fontSize:11, textTransform:"uppercase", letterSpacing:".06em", color:"rgba(255,255,255,.6)"}}>Hours</div>
              <div style={{marginTop:8, lineHeight:1.6}}>Mon – Sat: 9:00 AM – 8:00 PM<br/>Sunday: 10:00 AM – 2:00 PM<br/>Emergency on-call: 24 / 7</div>
              <div style={{marginTop:10, fontSize:13.4, color:"rgba(255,255,255,.8)"}}>Phone / WhatsApp<br/><a href="tel:+915624008814" style={{fontSize:16, color:"#fff"}}>+91 562 400 8814</a></div>
            </GlassCard>
          </div>
          <div className="liquid-glass rs-card" style={{marginTop:14, fontSize:13.4, color:"rgba(255,255,255,.85)"}}>
            <b style={{color:"#fff"}}>Agra localities we serve:</b> Sanjay Place, Kamla Nagar, Dayalbagh, Tajganj, Civil Lines, Shahganj, Sikandra, Fatehabad Road. Home visits across Agra city.
          </div>
          <div style={{display:"flex", flexWrap:"wrap", gap:12, marginTop:18}}>
            <a href="tel:+915624008814" className="rs-btn liquid-glass-strong" style={{color:"#fff"}}>Call to Book →</a>
            <a href="https://wa.me/915624008814" target="_blank" className="rs-btn rs-btn-outline">WhatsApp</a>
          </div>
        </div>

        <div className="liquid-glass" style={{borderRadius:22, padding:"22px"}}>
          <div style={{fontFamily:"'Instrument Serif', serif", fontStyle:"italic", fontSize:28}}>Book an appointment</div>
          <p style={{color:"rgba(255,255,255,.8)", fontSize:13.8, marginTop:6}}>Same-day slots usually available. We'll confirm by call / WhatsApp in ~7 minutes. No advance payment.</p>
          <form onSubmit={onSubmit} style={{marginTop:18, display:"grid", gap:12}}>
            <div className="rs-grid rs-grid-2" style={{gap:12}}>
              <input required placeholder="Full name" className="rs-input" />
              <input required placeholder="Phone / WhatsApp" className="rs-input" />
            </div>
            <div className="rs-grid rs-grid-2" style={{gap:12}}>
              <input type="date" className="rs-input" />
              <select required className="rs-select"><option value="" disabled selected>Time</option><option>Morning (9-12)</option><option>Afternoon (12-4)</option><option>Evening (4-8)</option></select>
            </div>
            <select className="rs-select"><option value="">Reason for visit (optional)</option><option>Back / Neck pain</option><option>Knee / Hip pain</option><option>Sports injury</option><option>Post-surgery rehab</option><option>Stroke / Neuro</option><option>Other</option></select>
            <textarea placeholder="What hurts? Brief note (optional)" rows="3" className="rs-textarea" />
            <button className="rs-btn rs-btn-white" style={{width:"100%"}}>Request Slot</button>
            <div style={{textAlign:"center", fontSize:11.5, color:"rgba(255,255,255,.6)"}}>UPI / Card / Cash in clinic • GST bill • Insurance paperwork provided</div>
          </form>
        </div>
      </div>
      <div style={{borderTop:"1px solid rgba(255,255,255,.09)", padding:"3rem 0"}}>
        <div className="rs-container rs-grid rs-grid-3" style={{color:"rgba(255,255,255,.8)", fontSize:13.6}}>
          <div><b style={{color:"#fff"}}>Do I need a referral?</b><br/>No. Walk-in / book direct.</div>
          <div><b style={{color:"#fff"}}>How many sessions?</b><br/>Most pain cases 6–12 visits.</div>
          <div><b style={{color:"#fff"}}>Home visits in Agra?</b><br/>Yes, ₹1,400 within city limits.</div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Footer ---------- */
function Footer({ navigate }){
  return (
    <footer style={{borderTop:"1px solid rgba(255,255,255,.09)", padding:"2.5rem 0", background:"#000"}}>
      <div className="rs-container" style={{display:"flex", flexWrap:"wrap", justifyContent:"space-between", gap:24, alignItems:"center"}}>
        <div>
          <div style={{fontFamily:"'Instrument Serif', serif", fontStyle:"italic", fontSize:24}}>rs clinic</div>
          <div style={{color:"rgba(255,255,255,.7)", fontSize:12.8, marginTop:4, lineHeight:1.6}}>Physiotherapy & Pain Rehabilitation<br/>14-B, Sanjay Place, M.G. Road, Agra – 282002<br/>+91 562 400 8814 • Open daily</div>
        </div>
        <div style={{display:"flex", flexWrap:"wrap", gap:"18px", color:"rgba(255,255,255,.75)", fontSize:13.3}}>
          {PAGES.map(p=> <button key={p.id} onClick={()=>navigate(p.id)} style={{padding:"4px 0"}}>{p.label}</button>)}
        </div>
      </div>
      <div className="rs-container" style={{color:"rgba(255,255,255,.5)", fontSize:11.8, marginTop:24}}>© 2026 RS Clinic, Agra. MIAP registered. Not a substitute for emergency care.</div>
    </footer>
  );
}

/* ---------- App ---------- */
function App(){
  const [page, navigate] = useHashPage();
  const PageComponent = {home: HomePage, services: ServicesPage, doctors: DoctorsPage, results: ResultsPage, pricing: PricingPage, contact: ContactPage}[page] || HomePage;
  return (
    <div style={{background:"#000", color:"#fff", minHeight:"100vh", overflowX:"hidden"}}>
      <Navbar page={page} navigate={navigate} />
      <AnimatePresence mode="wait">
        <motion.div key={page} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:.34, ease:"easeOut"}}>
          <PageComponent navigate={navigate} />
          <Footer navigate={navigate} />
        </motion.div>
      </AnimatePresence>
      <a href="https://wa.me/915624008814" target="_blank" className="rs-wa-fab">WhatsApp</a>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);

/* ==========================================================================
   End of RS Clinic app.js
   – FadingVideo rAF crossfade preserved
   – BlurText word-by-word preserved
   – Liquid-glass UI preserved
   – Fully responsive: Phone / Tablet / Desktop
   – 6 pages: Home, Services, Doctors, Results, Pricing, Contact
   – Location: Sanjay Place, M.G. Road, Agra, UP 282002
   – Phone: +91 562 400 8814
   ========================================================================== */