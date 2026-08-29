const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const state={expr:'',ans:0,answer:'0',memory:0,angle:'DEG',history:JSON.parse(localStorage.getItem('calcx-history')||'[]')};
const fmt=n=>{n=Number(n);if(!Number.isFinite(n))throw Error('Math error');if(Math.abs(n)<1e-12)n=0;return Number(n.toPrecision(12)).toString()};
function factorial(n){if(!Number.isInteger(n)||n<0||n>170)throw Error('Factorial needs a whole number ≤ 170');let r=1;for(let i=2;i<=n;i++)r*=i;return r}
function nCr(n,r){if(!Number.isInteger(n)||!Number.isInteger(r)||r<0||n<0||r>n)throw Error('Use whole numbers with 0 ≤ r ≤ n');return factorial(n)/(factorial(r)*factorial(n-r))}
function nPr(n,r){if(!Number.isInteger(n)||!Number.isInteger(r)||r<0||n<0||r>n)throw Error('Use whole numbers with 0 ≤ r ≤ n');return factorial(n)/factorial(n-r)}
function toRad(x){return state.angle==='DEG'?x*Math.PI/180:state.angle==='GRAD'?x*Math.PI/200:x}
function fromRad(x){return state.angle==='DEG'?x*180/Math.PI:state.angle==='GRAD'?x*200/Math.PI:x}
const fn={sin:x=>Math.sin(toRad(x)),cos:x=>Math.cos(toRad(x)),tan:x=>Math.tan(toRad(x)),asin:x=>fromRad(Math.asin(x)),acos:x=>fromRad(Math.acos(x)),atan:x=>fromRad(Math.atan(x)),sqrt:x=>{if(x<0)throw Error('Invalid square root');return Math.sqrt(x)},log:x=>{if(x<=0)throw Error('log needs a positive value');return Math.log10(x)},ln:x=>{if(x<=0)throw Error('ln needs a positive value');return Math.log(x)},abs:Math.abs,exp:Math.exp};

// A real parser: never eval(), understands the calculator's × and ÷ symbols,
// normal precedence, unary signs, factorial/percent, constants and functions.
function tokenize(input){
  const s=String(input).replaceAll('×','*').replaceAll('÷','/').replaceAll('−','-').replaceAll('π','pi').replace(/\s+/g,'');
  const t=[]; let i=0;
  while(i<s.length){
    const c=s[i];
    if(/[0-9.]/.test(c)){
      const m=s.slice(i).match(/^(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:[eE][+-]?\d+)?/);
      if(!m)throw Error('Invalid number'); const v=Number(m[0]); if(!Number.isFinite(v))throw Error('Invalid number'); t.push({type:'num',value:v}); i+=m[0].length; continue;
    }
    if(/[A-Za-z]/.test(c)){
      const m=s.slice(i).match(/^[A-Za-z]+/)[0].toLowerCase(); i+=m.length;
      if(m==='pi')t.push({type:'num',value:Math.PI}); else if(m==='e')t.push({type:'num',value:Math.E}); else t.push({type:'fn',value:m}); continue;
    }
    if('+-*/^%!'.includes(c)){t.push({type:'op',value:c});i++;continue}
    if('()'.includes(c)){t.push({type:'paren',value:c});i++;continue}
    throw Error('Unknown character: '+c);
  }
  return t;
}
function evaluate(input){
  let t=tokenize(input),p=0;
  // Insert implicit multiplication: 2(3), 2sin(30), (2)(3), 2π.
  const canEnd=x=>x&&(x.type==='num'||(x.type==='paren'&&x.value===')')||(x.type==='op'&&['!','%'].includes(x.value)));
  const canStart=x=>x&&(x.type==='num'||x.type==='fn'||(x.type==='paren'&&x.value==='('));
  const u=[]; for(let i=0;i<t.length;i++){if(i&&canEnd(t[i-1])&&canStart(t[i]))u.push({type:'op',value:'*'});u.push(t[i])} t=u;
  const peek=()=>t[p]; const eat=()=>t[p++];
  function expression(){let v=term();while(peek()?.value==='+'||peek()?.value==='-'){const o=eat().value,r=term();v=o==='+'?v+r:v-r}return v}
  function term(){let v=power();while(peek()?.value==='*'||peek()?.value==='/'){const o=eat().value,r=power();if(o==='/'&&Math.abs(r)<1e-15)throw Error('Cannot divide by zero');v=o==='*'?v*r:v/r}return v}
  function power(){let v=unary();if(peek()?.value==='^'){eat();v=Math.pow(v,power())}return v}
  function unary(){if(peek()?.value==='+'){eat();return unary()}if(peek()?.value==='-'){eat();return -unary()}return post()}
  function post(){let v=primary();while(peek()?.value==='!'||peek()?.value==='%'){const o=eat().value;v=o==='!'?factorial(v):v/100}return v}
  function primary(){const q=peek();if(!q)throw Error('Incomplete expression');if(q.type==='num'){eat();return q.value}if(q.type==='paren'&&q.value==='('){eat();let v=expression();if(peek()?.value!==')')throw Error('Missing )');eat();return v}if(q.type==='fn'){const name=eat().value;if(peek()?.value!=='(')throw Error(name+' needs (');eat();let v=expression();if(peek()?.value!==')')throw Error('Missing )');eat();if(!(name in fn))throw Error('Unknown function: '+name);return fn[name](v)}throw Error('Unexpected input')}
  const r=expression();if(p!==t.length)throw Error('Invalid expression');return r;
}
function calculate(){if(!state.expr)return;try{const v=evaluate(state.expr);state.ans=v;state.answer=fmt(v);state.history.unshift({e:state.expr,a:state.answer});state.history=state.history.slice(0,50);render()}catch(e){state.answer='Error: '+e.message;render()}}
function render(){ $('#expression').textContent=state.expr||'0';$('#answer').textContent=state.answer;$('#angleLabel').textContent=state.angle;$('#memoryLabel').textContent=state.memory?'M '+fmt(state.memory):'';localStorage.setItem('calcx-history',JSON.stringify(state.history)) }
function add(v){state.expr+=v;render()}
const basic=[['MC','mem:mc'],['MR','mem:mr'],['M+','mem:plus'],['M−','mem:minus'],['AC','clear'],['(', '('],[')',')'],['%','%'],['x!','!'],['⌫','back'],['7','7'],['8','8'],['9','9'],['÷','/'],['√','sqrt('],['4','4'],['5','5'],['6','6'],['×','*'],['x²','^2'],['1','1'],['2','2'],['3','3'],['−','-'],['π','π'],['0','0'],['.','.'],['Ans','ans'],['+','+'],['=','calc']];
const sci=[['sin','sin('],['cos','cos('],['tan','tan('],['sin⁻¹','asin('],['cos⁻¹','acos('],['tan⁻¹','atan('],['log','log('],['ln','ln('],['√','sqrt('],['xʸ','^'],['abs','abs('],['eˣ','exp('],['e','e'],['π','π'],['(', '(']];
function buildPads(){ $('#keypad').innerHTML=basic.map(([l,v])=>`<button class="key ${/^\d|\.$/.test(l)?'num':''} ${['+','-','*','/'].includes(v)?'op':''} ${l==='='?'equal':''} ${['MC','MR','M+','M−'].includes(l)?'mem':''} ${l==='AC'?'clear':''} ${l==='0'?'zero':''}" data-v="${v}">${l}</button>`).join('');$('#sciencePad').innerHTML=sci.map(([l,v])=>`<button data-v="${v}"><b>${l}</b><small>${l}</small></button>`).join('');$$('[data-v]').forEach(b=>b.onclick=()=>key(b.dataset.v))}
function key(v){if(v==='clear'){state.expr='';state.answer='0'}else if(v==='back'){state.expr=state.expr.slice(0,-1)}else if(v==='calc'){calculate();return}else if(v==='ans'){state.expr+=fmt(state.ans)}else if(v.startsWith('mem:')){const x=Number(state.answer);if(v==='mem:mc')state.memory=0;else if(v==='mem:mr')state.expr+=fmt(state.memory);else if(Number.isFinite(x))state.memory+=v==='mem:plus'?x:-x}else add(v);render()}
function showView(view){$$('.tab').forEach(x=>x.classList.toggle('active',x.dataset.view===view));$('#calcView').classList.toggle('hidden',view!=='calc'&&view!=='scientific');$('#matrixView').classList.toggle('hidden',view!=='matrix');$('#toolsView').classList.toggle('hidden',view!=='tools');$('#sciencePad').classList.toggle('hidden',view!=='scientific');$('#angleRow').classList.toggle('hidden',view!=='scientific')}
$$('.tab').forEach(b=>b.onclick=()=>showView(b.dataset.view));$$('.angle').forEach(b=>b.onclick=()=>{$$('.angle').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.angle=b.dataset.angle;render()});
// matrices — supports square matrices and arbitrary rectangular dimensions.
const matrixState={mode:'square',dims:{A:[2,2],B:[2,2]}};
const mats={A:[],B:[]};
function dims(k){return matrixState.dims[k]}
function makeMatrixData(k,rows,cols,old=mats[k]){
  return Array.from({length:rows},(_,i)=>Array.from({length:cols},(_,j)=>old?.[i]?.[j]??0));
}
function renderMatrix(k){
  const [rows,cols]=dims(k), old=mats[k];
  mats[k]=makeMatrixData(k,rows,cols,old);
  const el=$('#matrix'+k); el.style.gridTemplateColumns=`repeat(${cols},minmax(48px,1fr))`;
  el.innerHTML=mats[k].flatMap((row,i)=>row.map((v,j)=>`<input class="cell" data-m="${k}" data-i="${i}" data-j="${j}" value="${v||''}" inputmode="decimal" aria-label="Matrix ${k} row ${i+1} column ${j+1}">`)).join('');
  $('#matrix'+k+'Dim').textContent=`(${rows} × ${cols})`;
}
function renderMatrices(){renderMatrix('A');renderMatrix('B')}
function readCurrentCellValues(){
  $$('.cell').forEach(x=>{mats[x.dataset.m][x.dataset.i][x.dataset.j]=Number(x.value)||0})
}
function getM(k){readCurrentCellValues();return mats[k].map(r=>r.slice())}
function makeMat(){
  const n=Number($('#matrixSize').value);
  matrixState.dims.A=[n,n]; matrixState.dims.B=[n,n]; renderMatrices();
}
function makeCustomMat(){
  const ar=Math.max(1,Math.min(8,Number($('#matrixARows').value)||1)), ac=Math.max(1,Math.min(8,Number($('#matrixACols').value)||1));
  const br=Math.max(1,Math.min(8,Number($('#matrixBRows').value)||1)), bc=Math.max(1,Math.min(8,Number($('#matrixBCols').value)||1));
  matrixState.dims.A=[ar,ac]; matrixState.dims.B=[br,bc]; renderMatrices();
}
function addM(a,b,sgn=1){
  if(a.length!==b.length||a[0].length!==b[0].length) throw Error('A and B must have the same dimensions for addition/subtraction.');
  return a.map((r,i)=>r.map((x,j)=>x+sgn*b[i][j]));
}
function mul(a,b){
  if(a[0].length!==b.length) throw Error(`Cannot multiply ${a.length}×${a[0].length} by ${b.length}×${b[0].length}. Columns of A must equal rows of B.`);
  return a.map(r=>b[0].map((_,j)=>r.reduce((s,x,k)=>s+x*b[k][j],0)));
}
function trans(a){return a[0].map((_,j)=>a.map(r=>r[j]))}
function det(a){
  if(a.length!==a[0].length) throw Error('Determinant requires a square matrix.');
  if(a.length===1)return a[0][0]; if(a.length===2)return a[0][0]*a[1][1]-a[0][1]*a[1][0];
  return a[0].reduce((s,x,j)=>s+(j%2?-1:1)*x*det(a.slice(1).map(r=>r.filter((_,k)=>k!==j))),0)
}
function inv(a){
  if(a.length!==a[0].length) throw Error('Inverse requires a square matrix.');
  const N=a.length,A=a.map(r=>r.slice()),I=A.map((r,i)=>r.map((_,j)=>i===j?1:0));
  for(let i=0;i<N;i++){let p=i;for(let k=i+1;k<N;k++)if(Math.abs(A[k][i])>Math.abs(A[p][i]))p=k;if(Math.abs(A[p][i])<1e-12)throw Error('Matrix is singular and has no inverse');[A[i],A[p]]=[A[p],A[i]];[I[i],I[p]]=[I[p],I[i]];const q=A[i][i];for(let j=0;j<N;j++){A[i][j]/=q;I[i][j]/=q}for(let k=0;k<N;k++)if(k!==i){const f=A[k][i];for(let j=0;j<N;j++){A[k][j]-=f*A[i][j];I[k][j]-=f*I[i][j]}}}return I
}
function showMat(m){return m.map(r=>r.map(x=>fmt(x).padStart(12)).join(' ')).join('\n')}
const ops=[['A + B','add'],['A − B','sub'],['A × B','mul'],['det(A)','deta'],['det(B)','detb'],['A⁻¹','inva'],['B⁻¹','invb'],['Aᵀ','ta'],['Bᵀ','tb']];
$('#matrixOps').innerHTML=ops.map(([l,v])=>`<button data-op="${v}">${l}</button>`).join('');
$('#matrixOps').onclick=e=>{const o=e.target.dataset.op;if(!o)return;try{let r,a=getM('A'),b=getM('B');if(o==='add')r=showMat(addM(a,b));if(o==='sub')r=showMat(addM(a,b,-1));if(o==='mul')r=showMat(mul(a,b));if(o==='deta')r=fmt(det(a));if(o==='detb')r=fmt(det(b));if(o==='inva')r=showMat(inv(a));if(o==='invb')r=showMat(inv(b));if(o==='ta')r=showMat(trans(a));if(o==='tb')r=showMat(trans(b));$('#matrixResult').textContent=r}catch(e){$('#matrixResult').textContent='Error: '+e.message}};
$('#matrixSize').onchange=makeMat;
$('#applyCustomMatrix').onclick=makeCustomMat;
$$('[data-matrix-mode]').forEach(b=>b.onclick=()=>{matrixState.mode=b.dataset.matrixMode;$$('[data-matrix-mode]').forEach(x=>x.classList.toggle('active',x===b));$('#squareMatrixControls').classList.toggle('hidden',matrixState.mode!=='square');$('#customMatrixControls').classList.toggle('hidden',matrixState.mode!=='custom');if(matrixState.mode==='square')makeMat();else makeCustomMat()});
$$('[data-clear-matrix]').forEach(b=>b.onclick=()=>{const [r,c]=dims(b.dataset.clearMatrix);mats[b.dataset.clearMatrix]=Array.from({length:r},()=>Array(c).fill(0));renderMatrix(b.dataset.clearMatrix)});
$('#matrixIdentity').onclick=()=>{const n=Number($('#matrixSize').value);for(const k of ['A','B'])mats[k]=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?1:0));renderMatrices()};
$('#matrixZeros').onclick=()=>{for(const k of ['A','B']){const [r,c]=dims(k);mats[k]=Array.from({length:r},()=>Array(c).fill(0))}renderMatrices()};
renderMatrices();
// tools + modals
const tools={equation:{title:'Equation Solver — up to 4th degree',html:`<div class="solver-tabs"><button class="degree active" data-degree="1">Linear</button><button class="degree" data-degree="2">Quadratic</button><button class="degree" data-degree="3">Cubic</button><button class="degree" data-degree="4">Quartic</button></div><div class="equation-preview" id="eqPreview">ax + b = 0</div><div class="coeff-grid" id="coeffGrid"></div><p class="hint">Enter coefficients from highest power to constant. You can also paste an equation such as <b>2x² − 3x + 1 = 0</b>.</p><label class="paste-label">Or enter equation directly<input id="eq" placeholder="e.g. x⁴ − 5x² + 4 = 0"></label><div class="actions"><button class="primary" onclick="solveEq()">Solve equation</button><button onclick="clearEq()">Clear</button></div><div id="toolOut" class="output">Choose a degree and enter your coefficients.</div>`},statistics:{title:'Statistics',html:`<div class="form"><label>Data<input id="data" placeholder="e.g. 4, 7, 8, 10, 12"></label></div><div class="actions"><button class="primary" onclick="stats()">Calculate</button></div><div id="toolOut" class="output">Mean, median, variance and SD.</div>`},calculus:{title:'Calculus',html:`<div class="form"><label>f(x)<input id="fx" value="x^2 + 3*x"></label><div class="row"><label>x₀<input id="x0" value="2"></label><label>h<input id="h" value="0.0001"></label></div><label>Integrate from a to b (optional)<div class="row"><input id="a" placeholder="a"><input id="b" placeholder="b"></div></label></div><div class="actions"><button class="primary" onclick="calcTool()">Calculate</button></div><div id="toolOut" class="output"></div>`},convert:{title:'Conversions',html:`<div class="form"><div class="row"><label>Value<input id="cv" value="1"></label><label>Type<select id="ct"><option>km → mi</option><option>mi → km</option><option>°C → °F</option><option>°F → °C</option><option>kg → lb</option><option>lb → kg</option><option>rad → deg</option><option>deg → rad</option></select></label></div></div><div class="actions"><button class="primary" onclick="convert()">Convert</button></div><div id="toolOut" class="output"></div>`},base:{title:'Base-N Converter',html:`<div class="form"><div class="row"><label>Number<input id="bn" value="255"></label><label>From<select id="bf"><option>10</option><option>2</option><option>8</option><option>16</option></select></div></div><div class="actions"><button class="primary" onclick="base()">Convert</button></div><div id="toolOut" class="output"></div>`},combinatorics:{title:'Combinatorics',html:`<div class="form"><div class="row"><label>n<input id="cn" value="10"></label><label>r<input id="cr" value="3"></label></div></div><div class="actions"><button class="primary" onclick="comb()">Calculate</button></div><div id="toolOut" class="output"></div>`}};
function openTool(k){$('#modal').innerHTML=`<button class="close-modal" onclick="closeModal()">×</button><h2>${tools[k].title}</h2><p class="sub">All calculations run locally in your browser.</p>${tools[k].html}`;$('#modal').classList.remove('hidden');$('#backdrop').classList.remove('hidden');if(k==='equation'){setSolverDegree(1);$$('.degree').forEach(b=>b.onclick=()=>setSolverDegree(Number(b.dataset.degree)))}}function closeModal(){$('#modal').classList.add('hidden');$('#backdrop').classList.add('hidden')}$$('[data-tool]').forEach(b=>b.onclick=()=>openTool(b.dataset.tool));window.closeModal=closeModal;$('#backdrop').onclick=closeModal;
let solverDegree=1;
const degreeNames={1:'ax + b = 0',2:'ax² + bx + c = 0',3:'ax³ + bx² + cx + d = 0',4:'ax⁴ + bx³ + cx² + dx + e = 0'};
function renderEquationInputs(){const labels=['a','b','c','d','e'].slice(0,solverDegree+1);$('#eqPreview').textContent=degreeNames[solverDegree];$('#coeffGrid').innerHTML=labels.map((x,i)=>`<label>${x}<input class="coef" id="coef${i}" type="number" step="any" placeholder="${i===0?'1':'0'}"></label>`).join('');}
function setSolverDegree(d){solverDegree=d;$$('.degree').forEach(b=>b.classList.toggle('active',Number(b.dataset.degree)===d));renderEquationInputs()}
function clearEq(){if($('#eq'))$('#eq').value='';renderEquationInputs();$('#toolOut').textContent='Choose a degree and enter your coefficients.'}
function complexAdd(a,b){return {r:a.r+b.r,i:a.i+b.i}} function complexSub(a,b){return {r:a.r-b.r,i:a.i-b.i}} function complexMul(a,b){return {r:a.r*b.r-a.i*b.i,i:a.r*b.i+a.i*b.r}} function complexDiv(a,b){const q=b.r*b.r+b.i*b.i;return {r:(a.r*b.r+a.i*b.i)/q,i:(a.i*b.r-a.r*b.i)/q}} function cpow(z,n){let r={r:1,i:0};for(let i=0;i<n;i++)r=complexMul(r,z);return r}
function poly(z,c){let r={r:c[0],i:0};for(let i=1;i<c.length;i++)r=complexAdd(complexMul(r,z),{r:c[i],i:0});return r}
function rootsDK(c){const n=c.length-1;if(Math.abs(c[0])<1e-15)throw Error('Leading coefficient cannot be zero.');const scale=Math.max(...c.map(x=>Math.abs(x)),1);c=c.map(x=>x/scale);let roots=Array.from({length:n},(_,k)=>{const a=2*Math.PI*k/n;return {r:0.4*Math.cos(a)+0.9,i:0.4*Math.sin(a)}});for(let it=0;it<300;it++){let max=0;roots=roots.map((z,k)=>{let den={r:1,i:0};for(let j=0;j<n;j++)if(j!==k)den=complexMul(den,complexSub(z,roots[j]));let delta=complexDiv(poly(z,c),den);const nz=complexSub(z,delta);max=Math.max(max,Math.hypot(delta.r,delta.i));return nz});if(max<1e-11)break}return roots}
function parseEquation(text){let s=text.replace(/−/g,'-').replace(/×/g,'*').replace(/\s/g,'').toLowerCase();if(!s)return null;if(s.includes('=')){const parts=s.split('=');if(parts.length!==2)throw Error('Use one = sign.');s=`(${parts[0]})-(${parts[1]})`;}
s=s.replace(/\^([234])/g,'**$1');let coeff=Array(solverDegree+1).fill(0);for(let k=solverDegree;k>=0;k--){const p=k===0?'':k===1?'x':`x\\^${k}`;const re=k===0?/([+-]?(?:\\d*\\.?\\d+))(?![\\d.])/g:new RegExp('([+-]?(?:\\d*\\.?\\d+)?)[*]?x(?:\\^'+k+')?','g');let m,found=0;while((m=re.exec(s))){let v=m[1];if(v===''||v==='+')v='1';if(v==='-')v='-1';coeff[solverDegree-k]=Number(v);found++;}if(k>0&&found===0)coeff[solverDegree-k]=0;}return coeff}
function solveEq(){try{let eq=$('#eq').value.trim(),c;if(eq){c=parseEquation(eq);if(c.every(x=>x===0))throw Error('Enter a valid equation.');}else c=Array.from({length:solverDegree+1},(_,i)=>Number($('#coef'+i).value||0));if(c.length===solverDegree+1&&Math.abs(c[0])<1e-15)throw Error('First coefficient must not be zero.');let rs=rootsDK(c);rs.sort((a,b)=>a.r-b.r||a.i-b.i);const clean=x=>Math.abs(x)<1e-8?0:x;const text=rs.map((z,i)=>{let r=clean(z.r),im=clean(z.i);if(Math.abs(im)<1e-7)return `x${i+1} = ${fmt(r)}`;return `x${i+1} = ${fmt(r)} ${im>=0?'+':'−'} ${fmt(Math.abs(im))}i`}).join('\n');$('#toolOut').textContent=`${degreeNames[solverDegree]}\n\n${text}\n\nVerified numerically.`}catch(e){$('#toolOut').textContent='Error: '+e.message}}
window.stats=()=>{try{let a=$('#data').value.split(',').map(Number).filter(Number.isFinite);if(!a.length)throw Error('Enter numbers separated by commas');let s=a.reduce((x,y)=>x+y,0),mean=s/a.length,b=[...a].sort((x,y)=>x-y),med=b.length%2?b[(b.length-1)/2]:(b[b.length/2-1]+b[b.length/2])/2,pop=a.reduce((x,y)=>x+(y-mean)**2,0)/a.length,samp=a.length>1?a.reduce((x,y)=>x+(y-mean)**2,0)/(a.length-1):0;$('#toolOut').textContent=`Count: ${a.length}\nMean: ${fmt(mean)}\nMedian: ${fmt(med)}\nPopulation variance: ${fmt(pop)}\nPopulation SD: ${fmt(Math.sqrt(pop))}\nSample variance: ${fmt(samp)}\nSample SD: ${fmt(Math.sqrt(samp))}`}catch(e){$('#toolOut').textContent='Error: '+e.message}};
window.calcTool=()=>{try{const f=x=>Function('x','return '+$('#fx').value)(x),x=Number($('#x0').value),h=Number($('#h').value),d=(f(x+h)-f(x-h))/(2*h);let out='f\'(x₀) ≈ '+fmt(d);const a=Number($('#a').value),b=Number($('#b').value);if(Number.isFinite(a)&&Number.isFinite(b)){let N=1000,step=(b-a)/N,sum=f(a)+f(b);for(let i=1;i<N;i++)sum+=(i%2?4:2)*f(a+i*step);out+='\n∫ₐᵇ f(x)dx ≈ '+fmt(sum*step/3)}$('#toolOut').textContent=out}catch(e){$('#toolOut').textContent='Error: '+e.message}};
window.convert=()=>{try{let x=Number($('#cv').value),t=$('#ct').value,r={'km → mi':x*.621371,'mi → km':x/.621371,'°C → °F':x*9/5+32,'°F → °C':(x-32)*5/9,'kg → lb':x*2.2046226218,'lb → kg':x/2.2046226218,'rad → deg':x*180/Math.PI,'deg → rad':x*Math.PI/180}[t];$('#toolOut').textContent=fmt(r)}catch(e){$('#toolOut').textContent='Error: '+e.message}};
window.base=()=>{try{let b=Number($('#bf').value),v=parseInt($('#bn').value,b);if(!Number.isFinite(v))throw Error('Invalid number for selected base');$('#toolOut').textContent=`BIN  ${v.toString(2)}\nOCT  ${v.toString(8)}\nDEC  ${v}\nHEX  ${v.toString(16).toUpperCase()}`}catch(e){$('#toolOut').textContent='Error: '+e.message}};
window.comb=()=>{try{let n=Number($('#cn').value),r=Number($('#cr').value);$('#toolOut').textContent=`nCr = ${fmt(nCr(n,r))}\nnPr = ${fmt(nPr(n,r))}\nn!  = ${fmt(factorial(n))}`}catch(e){$('#toolOut').textContent='Error: '+e.message}};
const guides=[['01 · Basic calculations','Enter numbers and operators, then press =. The parser respects normal mathematical precedence.','25 × 4 + 10 = 110'],['02 · Scientific mode','Switch to Scientific for trigonometry, logarithms, powers and constants. Choose DEG, RAD or GRAD before trig calculations.','sin(30) = 0.5 in DEG'],['03 · Matrix mode','Choose a size, fill A and B, then select an operation. Determinant and inverse work for square matrices.','A × B · det(A) · A⁻¹ · Aᵀ'],['04 · Memory','MC clears memory. MR recalls it. M+ adds the displayed answer and M− subtracts it.','25 = → M+ → AC → MR'],['05 · Keyboard','Use numbers and operators directly. Enter calculates, Esc clears and Backspace deletes.','2*(3+4) ↵ = 14'],['06 · Tools','Equation Solver handles linear/quadratic equations, Statistics handles common descriptive measures, and Calculus uses numerical methods.','nCr(10,3) = 120']];function renderHelp(q=''){let x=guides.filter(g=>(g.join(' ')).toLowerCase().includes(q.toLowerCase()));$('#helpContent').innerHTML=x.map(g=>`<article class="guide"><h3>${g[0]}</h3><p>${g[1]}</p><div class="example">${g[2]}</div></article>`).join('')||'<p class="guide">No guide topics found.</p>'}$('#helpBtn').onclick=()=>{$('#drawer').classList.add('open');$('#backdrop').classList.remove('hidden');renderHelp()};$$('[data-close]').forEach(b=>b.onclick=()=>{$('#drawer').classList.remove('open');$('#backdrop').classList.add('hidden')});$('#helpSearch').oninput=e=>renderHelp(e.target.value);$('#historyBtn').onclick=()=>{let text=state.history.length?state.history.map((x,i)=>`${i+1}. ${x.e} = ${x.a}`).join('\n'):'No calculations yet.';$('#modal').innerHTML=`<button class="close-modal" onclick="closeModal()">×</button><h2>Calculation History</h2><p class="sub">Saved locally on this device.</p><div class="output">${text}</div><div class="actions"><button onclick="state.history=[];render();closeModal()">Clear history</button></div>`;$('#modal').classList.remove('hidden');$('#backdrop').classList.remove('hidden')};
window.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();calculate()}else if(e.key==='Escape'){state.expr='';state.answer='0';render()}else if(e.key==='Backspace'&&!['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName)){state.expr=state.expr.slice(0,-1);render()}else if(/^[0-9+\-*/().^%!]$/.test(e.key)&&!['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName)){add(e.key)}};
buildPads();render();showView('calc');
