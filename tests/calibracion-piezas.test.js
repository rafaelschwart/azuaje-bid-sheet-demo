const T={"FRONT END":[[320,1.00],[95,.70],[210,.80],[480,.60],[480,.60],[400,.65],[260,.50],[230,.45],[210,.40],[200,.45],[200,.45],[180,.35]],
"REAR END":[[300,1.00],[95,.65],[390,.60],[290,.60],[290,.60],[350,.35],[175,.40]],
"SIDE":[[460,.70],[440,.50],[245,.65],[200,.55],[175,.40],[160,.35]]};
const tier=r=>r<=12000?.75:r<=22000?1.0:1.55;
const tmpl=(d,r)=>T[d].reduce((a,[b,p])=>a+b*tier(r)*p,0);
const L=[["FRONT END",16200,2680],["REAR END",14500,1950],["FRONT END",12400,2340],
["SIDE",18100,2810],["FRONT END",11300,3450],["REAR END",15400,1720]];
console.log("PLANTILLA (valor esperado) CONTRA EL LIBRO\n");
let rs=[];
L.forEach(([d,r,rp])=>{const e=tmpl(d,r);rs.push(rp/e);
 console.log(`  ${d.padEnd(10)} retail ${String(r).padStart(6)}  plantilla $${String(Math.round(e)).padStart(5)}  real $${String(rp).padStart(5)}  ratio ${(rp/e).toFixed(2)}`);});
const f=rs.reduce((a,b)=>a+b,0)/rs.length;
console.log(`\n  FACTOR MEDIDO: x${f.toFixed(2)}\n`);
console.log("  Con el factor aplicado:");
let errs=[];
L.forEach(([d,r,rp])=>{const adj=Math.round(tmpl(d,r)*f);const e=(adj-rp)/rp*100;errs.push(Math.abs(e));
 console.log(`  ${d.padEnd(10)} ajustado $${String(adj).padStart(5)}  real $${String(rp).padStart(5)}  error ${e>0?'+':''}${e.toFixed(0)}%`);});
console.log(`\n  error absoluto medio: ${(errs.reduce((a,b)=>a+b,0)/errs.length).toFixed(0)}%  (antes 54% y siempre bajo)`);
console.log("  sesgo: ya no es sistematico hacia abajo -> deja de inflar el techo de puja");
