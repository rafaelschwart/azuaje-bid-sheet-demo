function makeSolver(cfg){
  const buyerFee=h=>{
    if(h<=0)return 0;
    if(cfg.membership==="licensed") return Math.max(cfg.pctMin,h*cfg.pct/100);
    for(const t of cfg.tiers) if(h<=t.upTo) return t.fee;
    return h*cfg.topPct/100;
  };
  const fixed=()=>cfg.gate+cfg.vbid+cfg.env+cfg.other;
  const tot=h=>h<=0?0:buyerFee(h)+fixed();

  function solve(B){
    if(B<=fixed()) return 0;
    const F=fixed();
    const ok=h=>h>0 && h+tot(h)<=B+1e-6;
    // local repair: fixes float error in both directions
    const fit=(c,lo,hi)=>{
      c=Math.min(Math.floor(c),hi);
      while(c+1<=hi && ok(c+1)) c++;
      while(c>=lo && !ok(c)) c--;
      return c>=lo?c:-1;
    };
    let best=0;
    if(cfg.membership==="licensed"){
      const brk=cfg.pct>0?cfg.pctMin*100/cfg.pct:Infinity;
      let c=fit(B-F-cfg.pctMin,1,Math.floor(brk)); if(c>best)best=c;
      c=fit((B-F)/(1+cfg.pct/100),Math.floor(brk)+1,Math.ceil(B)); if(c>best)best=c;
    }else{
      let prev=0;
      for(const t of cfg.tiers){
        const c=fit(B-F-t.fee,prev+1,t.upTo); if(c>best)best=c; prev=t.upTo;
      }
      const c=fit((B-F)/(1+cfg.topPct/100),prev+1,Math.ceil(B)); if(c>best)best=c;
    }
    return Math.max(0,best);
  }
  return {solve,tot,fixed};
}

const TIERS=[{upTo:399,fee:75},{upTo:899,fee:135},{upTo:1399,fee:185},{upTo:1999,fee:235},
{upTo:2499,fee:285},{upTo:2999,fee:335},{upTo:3499,fee:385},{upTo:3999,fee:435},
{upTo:4499,fee:485},{upTo:4999,fee:535}];

const cases=[
 ["publico default", {membership:"public",tiers:TIERS,topPct:10,gate:95,vbid:99,env:15,other:0}],
 ["publico sin fijos",{membership:"public",tiers:TIERS,topPct:10,gate:0,vbid:0,env:0,other:0}],
 ["licenciado 6%/150",{membership:"licensed",pct:6,pctMin:150,tiers:TIERS,topPct:10,gate:95,vbid:99,env:15,other:0}],
 ["licenciado 5%/300",{membership:"licensed",pct:5,pctMin:300,tiers:TIERS,topPct:10,gate:79,vbid:59,env:15,other:0}],
];

let allBad=0, allMiss=0;
for(const [name,cfg] of cases){
  const S=makeSolver(cfg);
  let bad=0,maxGap=0,missed=0;
  for(let B=100;B<=30000;B++){
    const h=S.solve(B);
    if(h>0){
      if(h+S.tot(h)>B+1e-6){bad++;}                       // excede presupuesto
      if(S.tot(h+1)!==undefined && (h+1)+S.tot(h+1)<=B){missed++;} // existia uno mejor
      const g=B-(h+S.tot(h)); if(g>maxGap)maxGap=g;
    }
  }
  // verificacion global independiente: fuerza bruta sobre muestra
  let brute=0;
  for(let B=500;B<=20000;B+=137){
    const h=S.solve(B); let bestB=0;
    for(let x=0;x<=B;x++) if(x+S.tot(x)<=B+1e-6) bestB=x;
    if(bestB!==h){brute++; if(brute<3)console.log(`   ${name} B=${B}: solver=${h} fuerzabruta=${bestB}`);}
  }
  console.log(`${name.padEnd(20)} excede:${bad}  perdidos:${missed}  holgura_max:$${maxGap.toFixed(0)}  vs_fuerzabruta:${brute} discrepancias`);
  allBad+=bad; allMiss+=missed+brute;
}
console.log(`\nRESULTADO: ${allBad} violaciones de presupuesto, ${allMiss} optimos perdidos`);
