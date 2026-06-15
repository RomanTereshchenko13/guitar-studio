/* ===================== SHARED ===================== */
function renderNums(el){
  const lo=FRET_LO(), hi=FRET_HI(), showOpen=lo<=1;
  let html='';
  for(let f=lo; f<=hi; f++){ html+=`<div class="fretnum ${DOTS.includes(f)?'mark':''}">${f}</div>`; }
  el.innerHTML=html;
  el.style.marginLeft = (showOpen?67:30)+'px';
  el.style.paddingLeft = (showOpen?7:0)+'px';
  el.style.minWidth = boardWidth()+'px';
  el.classList.toggle('lefty', lefty);
}
/* Responsive fret sizing (Phase C+): derive the fret-cell width from the width
   actually available to the board, with a readable floor. A windowed range
   (≤5 frets) then fits the viewport with no horizontal scroll; only the wide
   "All frets" view falls below the floor and keeps the .scroll fallback.
   Both .board and .fretnums are sized from boardWidth(), so dot/number
   alignment is preserved exactly — only the per-cell pixel width adapts. */
const CELL_MIN = 34, CELL_MAX = 200;
function availW(){
  if(typeof document==='undefined') return 976;
  const m=document.querySelector('.main');
  const w = m && m.clientWidth ? m.clientWidth : ((typeof window!=='undefined'?window.innerWidth:1024) - 48);
  return Math.max(280, w);
}
function leftFixed(){ return FRET_LO()<=1 ? 67 : 30; }
function cellW(){
  const n = FRET_HI() - FRET_LO() + 1;
  const fit = Math.floor((availW() - leftFixed()) / Math.max(1,n));
  return Math.max(CELL_MIN, Math.min(CELL_MAX, fit));
}
function boardWidth(){ return leftFixed() + (FRET_HI()-FRET_LO()+1)*cellW(); }
function renderBoard(boardEl, cellFn){
  clearPlayHighlights();
  boardEl.innerHTML='';
  const lo=FRET_LO(), hi=FRET_HI(), showOpen=lo<=1;
  SNAMES.forEach((sn,si)=>{
    const row=document.createElement('div'); row.className='srow';
    const lab=document.createElement('div'); lab.className='slabel'; lab.textContent=sn; row.appendChild(lab);
    if(showOpen){
      const open=document.createElement('div'); open.className='ocell';
      const odot=cellFn(OPEN[si]%12, si, 0);
      if(odot) open.appendChild(odot);
      row.appendChild(open);
      const nut=document.createElement('div'); nut.className='nut'; row.appendChild(nut);
    }
    for(let f=lo; f<=hi; f++){
      const pc=(OPEN[si]+f)%12;
      const cell=document.createElement('div'); cell.className='cell';
      // position-marker inlays on the neck face: single dot between the centre
      // strings (G/D, si 3), double dot straddling the centre at fret 12/24
      if(INLAY_DOUBLE.has(f)){ if(si===2||si===4) cell.classList.add('inlay'); }
      else if(INLAY_SINGLE.has(f)){ if(si===3) cell.classList.add('inlay'); }
      const dot=cellFn(pc,si,f);
      if(dot) cell.appendChild(dot);
      row.appendChild(cell);
    }
    boardEl.appendChild(row);
  });
  const panel=boardEl.closest('.board'); if(panel){ panel.style.minWidth=boardWidth()+'px'; panel.classList.toggle('lefty', lefty); }
  // hint that the neck scrolls (only the wide "All frets" view overflows)
  const sc=boardEl.closest('.scroll'); if(sc){ sc.classList.toggle('scrollable', sc.scrollWidth > sc.clientWidth + 1); }
}
const INLAY_SINGLE = new Set(DOTS.filter(f=>f!==12&&f!==24));
const INLAY_DOUBLE = new Set([12,24]);
/* Heuristic fingering for a fretted shape. `frets` is indexed by display column
   (null = muted, 0 = open → no finger). Returns {colIndex: 1..4}. A genuine
   index-barre is detected when the lowest fret is played on 2+ strings AND a
   higher fret sits above it; otherwise fingers ascend by fret then string. This
   lands the standard fingerings for the open / E-shape / A-shape voicings the
   app generates, and a sensible ascending guess for computed jazz voicings. */
function chordFingers(frets){
  const fretted=frets.map((fr,i)=>({i,fr})).filter(o=>o.fr!=null&&o.fr>0)
                     .sort((a,b)=> a.fr-b.fr || a.i-b.i);
  const map={};
  if(!fretted.length) return map;
  const minF=fretted[0].fr;
  const atMin=fretted.filter(o=>o.fr===minF);
  const higher=fretted.filter(o=>o.fr>minF);
  let next=1;
  if(atMin.length>=2 && higher.length>=1){          // index bars the lowest fret
    atMin.forEach(o=>{ map[o.i]=1; }); next=2;
    higher.forEach(o=>{ map[o.i]=Math.min(next++,4); });
  } else {
    fretted.forEach(o=>{ map[o.i]=Math.min(next++,4); });
  }
  return map;
}
function makeDot(cls,text,midi){
  const d=document.createElement('div'); d.className='dot '+cls; d.textContent=text;
  if(midi!=null){ d.dataset.midi=midi; d.tabIndex=0; d.setAttribute('role','button'); }
  else { d.setAttribute('role','img'); }
  d.setAttribute('aria-label',text);
  return d;
}
function wirePlay(boardEl){
  const trigger=d=>{ if(d==null||d.dataset.midi==null) return; pluck(parseInt(d.dataset.midi)); d.classList.add('playing'); setTimeout(()=>d.classList.remove('playing'), 420); };
  boardEl.addEventListener('click',e=>{ trigger(e.target.closest('.dot')); });
  boardEl.addEventListener('keydown',e=>{ if(e.key!=='Enter'&&e.key!==' ') return; const d=e.target.closest('.dot'); if(d&&d.dataset.midi!=null){ e.preventDefault(); trigger(d); } });
}
function buildRootBtns(container, current, onPick){
  container.innerHTML='';
  ROOTS.forEach(r=>{
    const pc = FLAT_ROOTS[r]!==undefined ? FLAT_ROOTS[r] : NOTES.indexOf(r);
    const b=document.createElement('button'); b.className='btn'+(pc===current?' active':''); b.textContent=r; b.setAttribute('aria-pressed', pc===current);
    b.onclick=()=>{ [...container.children].forEach(x=>{x.classList.remove('active');x.setAttribute('aria-pressed','false');}); b.classList.add('active'); b.setAttribute('aria-pressed','true'); onPick(pc,r); };
    container.appendChild(b);
  });
}

