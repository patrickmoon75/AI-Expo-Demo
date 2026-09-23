const createDummy = () => {
  const dummyFn = () => createDummy();
  return new Proxy(dummyFn, {
    get: (t, p) => {
      if (p === 'classList') return { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false };
      if (p === 'style') return {};
      if (p === 'addEventListener' || p === 'removeEventListener') return () => {};
      if (p === 'querySelector') return () => createDummy();
      if (p === 'querySelectorAll') return () => [];
      if (p === 'children') return [createDummy(), createDummy(), createDummy(), createDummy()];
      if (p === 'options') return [];
      if (p === 'dataset') return {};
      if (p === 'value') return '';
      if (p === 'textContent' || p === 'innerHTML' || p === 'innerText') return '';
      if (p === 'append' || p === 'appendChild' || p === 'setAttribute' || p === 'removeAttribute') return () => {};
      return createDummy();
    },
    set: () => true,
    apply: () => createDummy()
  });
};
const $ = id => {
  const el = document.getElementById(id);
  if (el) return el;
  return createDummy();
};
const TAU=Math.PI*2;
const V={add:(a,b)=>a.map((v,i)=>v+b[i]), sub:(a,b)=>a.map((v,i)=>v-b[i]), mul:(a,s)=>a.map(v=>v*s), dot:(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0), cross:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]], norm:a=>{let l=Math.hypot(...a)||1;return a.map(v=>v/l)}, lerp:(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t)};
const M={id:()=>new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]),mul:(a,b)=>{let o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o},ortho:(l,r,b,t,n,f)=>new Float32Array([2/(r-l),0,0,0,0,2/(t-b),0,0,0,0,-2/(f-n),0,-(r+l)/(r-l),-(t+b)/(t-b),-(f+n)/(f-n),1]),persp:(fov,a,n,f)=>{let s=1/Math.tan(fov/2);return new Float32Array([s/a,0,0,0,0,s,0,0,0,0,(f+n)/(n-f),-1,0,0,2*f*n/(n-f),0])},look:(eye,target)=>{let z=V.norm(V.sub(eye,target)),x=V.norm(V.cross([0,1,0],z)),y=V.cross(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-V.dot(x,eye),-V.dot(y,eye),-V.dot(z,eye),1])},point:(m,v)=>{let a=[...v,1],o=[0,0,0,0];for(let r=0;r<4;r++)for(let c=0;c<4;c++)o[r]+=m[c*4+r]*a[c];return o}};
function rotateVector(p,yaw=0){let c=Math.cos(yaw),s=Math.sin(yaw);return [c*p[0]+s*p[2],p[1],-s*p[0]+c*p[2]];}
const color=hex=>{let s=hex.replace('#','');return[parseInt(s.slice(0,2),16)/255,parseInt(s.slice(2,4),16)/255,parseInt(s.slice(4,6),16)/255]};
const C={blue:color('#2671ae'),blueDark:color('#194c7b'),steel:color('#b9c8d1'),steelDark:color('#667b8b'),light:color('#dee5e9'),orange:color('#e34f35'),yellow:color('#e2ae35'),yellowDark:color('#aa7a1d'),green:color('#69a84f'),teal:color('#39b29d'),black:color('#293945'),wood:color('#c6a579'),woodTop:color('#dfc39b'),hdx:color('#d69142'),seer:color('#5b8eaf'),red:color('#d85e51'),white:color('#f5f8fa')};
let canvas=$('view'),main=$('main'), gl=canvas.getContext('webgl',{antialias:true,alpha:true,preserveDrawingBuffer:true})||canvas.getContext('experimental-webgl');
const webglActive=!!gl;let ctx2d=null;
if(!webglActive){ctx2d=canvas.getContext('2d',{alpha:true});if(!ctx2d){$('error').style.display='flex';$('error').textContent='브라우저의 그래픽 컨텍스트를 초기화할 수 없습니다.';throw Error('No graphics context')}gl=new Proxy({},{get:(o,key)=>/^[A-Z_0-9]+$/.test(key)?0:(key==='getShaderParameter'||key==='getProgramParameter'?()=>true:()=>null)});} 
const vs=`attribute vec3 aP;attribute vec3 aN;attribute vec3 aC;uniform mat4 uVP;uniform vec3 uOffset;uniform vec2 uRot;varying vec3 vN;varying vec3 vC;varying float vY;void main(){vec3 p=vec3(uRot.x*aP.x+uRot.y*aP.z,aP.y,-uRot.y*aP.x+uRot.x*aP.z)+uOffset;vY=p.y;gl_Position=uVP*vec4(p,1.);vN=vec3(uRot.x*aN.x+uRot.y*aN.z,aN.y,-uRot.y*aN.x+uRot.x*aN.z);vC=aC;}`;
const fs=`precision mediump float;varying vec3 vN;varying vec3 vC;varying float vY;uniform float uAlpha;uniform float uLit;void main(){vec3 n=normalize(vN);float key=max(dot(n,normalize(vec3(-.5,1.,.8))),0.);float fill=max(dot(n,normalize(vec3(.75,.4,-.55))),0.);float shade=.53+.35*key+.18*fill;shade=mix(1.,shade,uLit);vec3 c=vC*shade;gl_FragColor=vec4(c,uAlpha);}`;
function shader(type,s){let x=gl.createShader(type);gl.shaderSource(x,s);gl.compileShader(x);if(!gl.getShaderParameter(x,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(x));return x}
let prog=gl.createProgram();gl.attachShader(prog,shader(gl.VERTEX_SHADER,vs));gl.attachShader(prog,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(prog);if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(prog));gl.useProgram(prog);
const loc={P:gl.getAttribLocation(prog,'aP'),N:gl.getAttribLocation(prog,'aN'),C:gl.getAttribLocation(prog,'aC'),VP:gl.getUniformLocation(prog,'uVP'),off:gl.getUniformLocation(prog,'uOffset'),rot:gl.getUniformLocation(prog,'uRot'),alpha:gl.getUniformLocation(prog,'uAlpha'),lit:gl.getUniformLocation(prog,'uLit')};
gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.disable(gl.CULL_FACE);gl.clearColor(0,0,0,0);
class Geo{constructor(name,opt={}){this.name=name;Object.assign(this,{vertices:[],lines:[],off:[0,0,0],floor:-1,kind:'structure',alpha:1,yaw:0,visible:true,anchor:[0,0,0]},opt)}v(p,n,c){this.vertices.push(...p,...n,...c)}tri(a,b,c,n,col){this.v(a,n,col);this.v(b,n,col);this.v(c,n,col)}quad(a,b,c,d,n,col){this.tri(a,b,c,n,col);this.tri(a,c,d,n,col)}line(a,b,col=C.steelDark){this.lines.push(...a,0,1,0,...col,...b,0,1,0,...col)}box(p,s,c,edge=false){let [x,y,z]=p,[w,h,d]=s.map(v=>v/2),a=[x-w,y-h,z-d],b=[x+w,y-h,z-d],cc=[x+w,y+h,z-d],dd=[x-w,y+h,z-d],e=[x-w,y-h,z+d],f=[x+w,y-h,z+d],g=[x+w,y+h,z+d],hh=[x-w,y+h,z+d];this.quad(e,f,g,hh,[0,0,1],c);this.quad(b,a,dd,cc,[0,0,-1],c);this.quad(a,e,hh,dd,[-1,0,0],c);this.quad(f,b,cc,g,[1,0,0],c);this.quad(dd,hh,g,cc,[0,1,0],c);this.quad(a,b,f,e,[0,-1,0],c);if(edge){let col=c.map(v=>v*.67);[[a,b],[b,cc],[cc,dd],[dd,a],[e,f],[f,g],[g,hh],[hh,e],[a,e],[b,f],[cc,g],[dd,hh]].forEach(q=>this.line(...q,col))}return this}cyl(a,b,r,c,seg=12,r2=r){let w=V.norm(V.sub(b,a)),u=V.norm(V.cross(w,Math.abs(w[1])>.9?[1,0,0]:[0,1,0])),v=V.cross(w,u);for(let i=0;i<seg;i++){let t=i/seg*TAU,t2=(i+1)/seg*TAU,na=V.add(V.mul(u,Math.cos(t)),V.mul(v,Math.sin(t))),nb=V.add(V.mul(u,Math.cos(t2)),V.mul(v,Math.sin(t2))),aa=V.add(a,V.mul(na,r)),ab=V.add(a,V.mul(nb,r)),ba=V.add(b,V.mul(na,r2)),bb=V.add(b,V.mul(nb,r2));this.tri(a,ab,aa,V.mul(w,-1),c);this.tri(b,ba,bb,w,c);this.quad(aa,ab,bb,ba,V.norm(V.add(na,nb)),c)}return this}beam(a,b,w,c){this.cyl(a,b,w/2,c,6);return this}arrow(a,b,c,size=.1){this.cyl(a,b,.016,c,7);let dir=V.norm(V.sub(b,a)),back=V.sub(b,V.mul(dir,size));this.cyl(back,b,size*.42,c,9,0)}upload(){this.data=new Float32Array(this.vertices);this.ld=new Float32Array(this.lines);this.vertices=null;this.lines=null;this.buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.buf);gl.bufferData(gl.ARRAY_BUFFER,this.data,gl.STATIC_DRAW);this.lbuf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.lbuf);gl.bufferData(gl.ARRAY_BUFFER,this.ld,gl.STATIC_DRAW)}dispose(){if(this.buf)gl.deleteBuffer(this.buf);if(this.lbuf)gl.deleteBuffer(this.lbuf)}}

function ringBox(g,p,s,c){let [x,y,z]=p,[w,h,d]=s.map(v=>v/2),pts=[[x-w,y-h,z-d],[x+w,y-h,z-d],[x+w,y-h,z+d],[x-w,y-h,z+d],[x-w,y+h,z-d],[x+w,y+h,z-d],[x+w,y+h,z+d],[x-w,y+h,z+d]];[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]].forEach(([a,b])=>g.line(pts[a],pts[b],c))}
function rail(g,a,b,y,w=.065){let x=(a[0]+b[0])/2,z=(a[1]+b[1])/2,dx=Math.abs(a[0]-b[0]),dz=Math.abs(a[1]-b[1]);g.box([x,y-.022,z],[dx||w,.045,dz||w],C.steel,true);g.box([x,y-.065,z],[dx||.012,.055,dz||.012],C.steelDark)}
function oldPallet(g){for(let x of[-.44,0,.44]){g.box([x,.0125,0],[.11,.025,1.1],C.wood,true);for(let z of[-.44,0,.44])g.box([x,.075,z],[.11,.1,.11],C.wood,true)}for(let z of[-.48,-.32,-.16,0,.16,.32,.48])g.box([0,.1375,z],[1.1,.025,.14],C.woodTop,true)}
function shuttle(g){g.box([0,.064,0],[1.115,.105,.835],C.blue,true);g.box([0,.12,0],[1.05,.012,.82],C.blueDark);for(let x of[-.5445,.5445])for(let z of[-.265,.265]){g.cyl([x-.021,.05,z],[x+.021,.05,z],.05,C.black,16);g.cyl([x-.023,.05,z],[x+.023,.05,z],.036,C.light,12)}for(let z of[-.417,.417])for(let x of[-.37,.37]){g.cyl([x,.05,z-.016],[x,.05,z+.016],.048,C.black,16);g.cyl([x,.05,z-.018],[x,.05,z+.018],.033,C.light,12)}g.box([0,.071,.427],[.20,.061,.006],C.black);for(let x of[-.07,.07])g.box([x,.076,.431],[.022,.026,.008],C.green);for(let x of[-.48,.48])g.box([x,.065,.430],[.026,.08,.008],C.teal);for(let x of[-.2,-.16,-.12,.12,.16,.2])g.box([x,.053,-.426],[.014,.036,.006],C.black)}

const unit=V.norm,cross=V.cross,sub=V.sub;
const actorSource="Pallet_Buffer_RevG1_Scenario_3D_Viewer.html / original specification-based concept geometry";
function makeActorParts(){
 const bucket=new Map();
 function geo(cat,group,color,name){const k=group+'|'+color;if(!bucket.has(k))bucket.set(k,{id:'actor_'+bucket.size,cat,group,color,name,v:[],f:[],n:[],edges:[],explode:[0,0,0],source:actorSource,detail:'',dynamic:true});return bucket.get(k);}
 function addMesh(p,vertices,faces,edgePairs){const offset=p.v.length/3;for(const v of vertices)p.v.push(...v);for(const ids of faces){p.f.push(...ids.map(i=>i+offset));p.n.push(...unit(cross(sub(vertices[ids[1]],vertices[ids[0]]),sub(vertices[ids[2]],vertices[ids[0]]))));}for(const [a,b]of edgePairs)p.edges.push(a+offset,b+offset);}
 function box(p,x,y,z,dx,dy,dz){const v=[[x,y,z],[x+dx,y,z],[x+dx,y+dy,z],[x,y+dy,z],[x,y,z+dz],[x+dx,y,z+dz],[x+dx,y+dy,z+dz],[x,y+dy,z+dz]];const faces=[[0,2,1],[0,3,2],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[1,2,6],[1,6,5],[2,3,7],[2,7,6],[3,0,4],[3,4,7]],edges=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];addMesh(p,v,faces,edges);}
 function prism(p,poly,z,h){const v=[...poly.map(q=>[q[0],q[1],z]),...poly.map(q=>[q[0],q[1],z+h])],n=poly.length,f=[],e=[];for(let i=1;i<n-1;i++){f.push([0,i+1,i],[n,n+i,n+i+1]);}for(let i=0;i<n;i++){const j=(i+1)%n;f.push([i,j,n+j],[i,n+j,n+i]);e.push([i,j],[n+i,n+j],[i,n+i]);}addMesh(p,v,f,e);}
 function roundBox(p,cx,cy,z,w,l,h,r){const poly=[[cx-w/2+r,cy-l/2],[cx+w/2-r,cy-l/2],[cx+w/2,cy-l/2+r],[cx+w/2,cy+l/2-r],[cx+w/2-r,cy+l/2],[cx-w/2+r,cy+l/2],[cx-w/2,cy+l/2-r],[cx-w/2,cy-l/2+r]];prism(p,poly,z,h);}
 function cylinder(p,cx,cy,cz,r,len,axis='z',N=16){const v=[];for(const b of [-.5,.5])for(let i=0;i<N;i++){const a=2*Math.PI*i/N,u=r*Math.cos(a),w=r*Math.sin(a);v.push(axis==='y'?[cx+u,cy+b*len,cz+w]:axis==='x'?[cx+b*len,cy+u,cz+w]:[cx+u,cy+w,cz+b*len]);}const f=[],e=[];for(let i=1;i<N-1;i++)f.push([0,i+1,i],[N,N+i,N+i+1]);for(let i=0;i<N;i++){const j=(i+1)%N;f.push([i,j,N+j],[i,N+j,N+i]);e.push([i,j],[N+i,N+j]);if(i%4===0)e.push([i,N+i]);}if(axis==='y')for(const face of f)[face[1],face[2]]=[face[2],face[1]];addMesh(p,v,f,e);}
 // AMR forward is local +Y. Platform lower-state top EL.250, independent lift group.
 const amr=geo('amr','amrBody','#596e79','SEER 리프팅 AMR · 차체'),amrDark=geo('amr','amrBody','#24323b','AMR 범퍼·바퀴'),amrLight=geo('amr','amrBody','#b9c8cd','AMR 상부 프레임'),amrLed=geo('amr','amrBody','#4ac3b0','AMR 상태등'),platform=geo('amr','amrLift','#dfb95c','850×600 리프트 플랫폼');
 roundBox(amr,0,0,45,650,950,174,75);roundBox(amrDark,0,0,25,650,950,35,65);roundBox(amrLight,0,0,218,635,935,16,68);roundBox(platform,0,0,-16,600,850,16,24);
 box(amrLed,-170,466,112,340,7,12);box(amrLed,-170,-473,112,340,7,12);box(amrDark,-54,435,177,108,39,35);box(amrDark,-54,-474,177,108,39,35);
 for(const x of [-307,307])for(const y of [-265,265])cylinder(amrDark,x,y,62,37,28,'x');
 // Forklift coordinate origin: vertical fork heel plane, forks point to local +X (east).
 function truck(cat,prefix,isHDX){
  const b=geo(cat,prefix+'Body',isHDX?'#687986':'#d6ad55',isHDX?'HDX ES15-A · 차체':'SEER 카운터밸런스 · 차체');
  const dark=geo(cat,prefix+'Body','#34414b','차체 하부·마스트'),rubber=geo(cat,prefix+'Body','#263039','차륜'),skin=geo(cat,prefix+'Body','#b4c1c8','마스트 내부'),fork=geo(cat,prefix+'Fork','#8b9da8','포크·승강 캐리지'),trim=geo(cat,prefix+'Body',isHDX?'#d9aa56':'#45a99c','차체 패널');
  const len=isHDX?590:1697,w=isHDX?985:1180,mh=isHDX?1990:2235;
  roundBox(dark,-len/2-30,0,80,len-90,w,140,70);
  roundBox(b,isHDX?-405:-1120,0,isHDX?200:250,isHDX?350:920,isHDX?930:1060,isHDX?820:630,80);
  if(!isHDX){roundBox(skin,-370,0,240,420,970,170,45);box(trim,-1480,-488,460,28,976,210);}else{box(trim,-570,-305,760,10,610,120);box(dark,-485,-80,1040,60,160,360);roundBox(dark,-454,0,1350,220,380,50,70);}
  for(const y of [-240,170]){box(dark,-100,y,70,80,70,mh-70);box(skin,-81,y+15,130,26,25,mh-180);}box(dark,-100,-240,mh-65,80,480,65);
  box(fork,-120,-325,-88,120,650,90);
  const length=isHDX?1150:1070,fw=isHDX?180:122,ft=isHDX?60:40,cy=(570-fw)/2;
  for(const y of [-cy,cy]){box(fork,0,y-fw/2,-ft,length-55,fw,ft);prism(fork,[[length-55,y-fw/2],[length-10,y-fw/2+12],[length,y],[length-10,y+fw/2-12],[length-55,y+fw/2]],-ft,ft);box(fork,-35,y-fw/2,-ft,35,fw,230);}
  if(!isHDX){for(const y of [-515,515]){cylinder(rubber,-300,y,205,180,120,'y');cylinder(skin,-300,y,205,88,126,'y');cylinder(rubber,-1410,y,170,145,115,'y');}box(dark,-1260,-105,882,210,210,66);cylinder(trim,-1155,0,952,80,40,'z');}
  else{
   // Lower legs deliberately schematic: no assertion that their outside envelope is known.
   const low=geo(cat,prefix+'Body','#80919a','HDX 하부 지지다리 · 개념형상');
   for(const y of [-195,195]){roundBox(low,500,y,44,1010,150,60,20);for(const x of [965,1070])cylinder(rubber,x,y,40,40,70,'y');}for(const y of [-350,350])cylinder(rubber,-410,y,115,115,70,'y');
  }
 }
 truck('seer','seer',false);truck('hdx','hdx',true);
 // One generic 4-way pallet, with bottom runners, 9 blocks and an open fork band.
 const pallet=geo('pallet','pallet','#77a9c4','팔레트 1100×1100×150'),palDark=geo('pallet','pallet','#558eaa','팔레트 하부 블록·러너');
 for(const y of [-450,0,450]){box(palDark,-550,y-75,0,1100,150,20);for(const x of [-450,0,450])box(palDark,x-75,y-75,20,150,150,105);}
 for(let i=0;i<7;i++)box(pallet,-550+i*160,-550,125,i===6?140:145,1100,25);
 const cargo=geo('cargo','cargo','#cab895','예시 화물'),tape=geo('cargo','cargo','#ac9876','포장 띠');box(cargo,-400,-400,150,800,800,480);box(tape,-12,-403,150,24,806,482);box(tape,-402,-12,150,804,24,482);
 return [...bucket.values()];
}


function buildRack(){
 const geoStart=geos.length,labelStart=labels.length;

 const bw=cfg.bayWidth,lw=cfg.liftWidth,F=cfg.frontDepth,R=cfg.rearDepth;
 const W=bw*3+lw+cfg.leftGap+cfg.rightGap, rackH=cfg.rackHeight, H=Math.max(rackH,cfg.liftHeight);
 const left=-W/2,leftRackEnd=left+bw,liftLeft=leftRackEnd+cfg.leftGap,liftRight=liftLeft+lw;
 const rightRackStart=liftRight+cfg.rightGap, right=W/2, LD=F+cfg.liftProtrusion;
 const xc=[left+bw/2,(liftLeft+liftRight)/2,rightRackStart+bw/2,right-bw/2];
 const edges=[left,leftRackEnd,rightRackStart,rightRackStart+bw,right];
 const rearEdges=Array.from({length:7},(_,i)=>left+W*i/6);
 const zf=F/2,zr=-R/2,zl=LD/2;
 dims={W,F,R,H,rackH,LD,liftLeft,liftRight,leftRackEnd,rightRackStart,edges,rearEdges,xc,zf,zr,zl};
 trackY=[0,1,2].map(i=>cfg.baseHeight+i*cfg.levelPitch);
 const defs=[['X1',0,2,'storage'],['X2',3,2,'storage'],['X3',0,1,'storage'],['X4',2,1,'storage'],['X5',3,1,'storage'],['X6',2,0,'storage'],['D',0,0,'inbound'],['A',3,0,'outbound'],['CHG',2,2,'storage'],['LIFT',1,-1,'lift']];
 for(let[id,col,floor,kind]of defs)slots[id]={id,col,floor,kind,x:xc[col],y:floor<0?trackY[0]:trackY[floor],z:id==='LIFT'?zl:zf,charging:id==='CHG',displayName:id==='CHG'?'XCharger':id};
 // Independent front rack groups, six bays at rear. No rack post in the lift transfer opening.
 const postPoints=[];for(let x of edges)for(let z of[F,0])postPoints.push([x,z]);
 for(let x of rearEdges){postPoints.push([x,-R]);if(x<liftLeft-.06||x>liftRight+.06)postPoints.push([x,0]);}
 const posts=[...new Map(postPoints.map(p=>[p.map(x=>x.toFixed(4)).join(','),p])).values()];
 let foot=geo('foundation-feet',{kind:'structure'});
 for(let[x,z]of posts){foot.box([x,.026,z],[.16,.05,.18],C.steelDark,true);for(let xx of[-.047,.047])foot.cyl([x+xx,.052,z-.06],[x+xx,.07,z-.06],.012,C.light,6);}
 for(let level=0;level<3;level++){
  let y=trackY[level],lo=level===0?.05:trackY[level-1]+.05,hi=level===2?rackH:y+.05;
  let frame=geo('rack-frame-L'+(level+1),{floor:level,kind:'structure'});
  for(let[x,z]of posts)frame.box([x,(lo+hi)/2,z],[.075,hi-lo,.075],C.blue,true);
  for(let col of[0,2,3]){let x=xc[col];for(let z of[.02,F-.02])frame.box([x,y-.11,z],[bw,.105,.06],C.steelDark,true);
   for(let xx of[-.42,.42])rail(frame,[x+xx,.04],[x+xx,F-.06],y);
   for(let xx of[-.535,.535]){frame.box([x+xx,y+.128,zf],[.065,.056,F-.07],C.steel,true);for(let z of[.15,F-.15])frame.box([x+xx,y+.084,z],[.10,.074,.08],C.orange,true);}
   for(let z of[.15,F-.15])for(let xx of[-.56,.56])frame.box([x+xx,y+.19,z],[.028,.07,.036],C.orange,true);
  }
  rail(frame,[left+.04,zr-.39],[right-.04,zr-.39],y);rail(frame,[left+.04,zr+.39],[right-.04,zr+.39],y);
  for(let x of rearEdges)frame.box([x,y-.12,zr],[.065,.085,R],C.steelDark,true);
  for(let i=0;i<6;i++){let x=(rearEdges[i]+rearEdges[i+1])/2;for(let z of[-R,0])frame.box([x,y-.15,z],[W/6,.08,.06],C.steelDark);}
  // Braces stay on the outside/side frames, never across the longitudinal rear aisle.
  for(let x of[left,right]){let yl=lo+.13,yh=hi-.12;frame.beam([x,yl,-R+.05],[x,yh,-.04],.03,C.steel);frame.beam([x,yh,-R+.05],[x,yl,-.04],.03,C.steel);}
  for(let x of edges){let yl=lo+.13,yh=hi-.12;frame.beam([x,yl,.04],[x,yh,F-.04],.026,C.steel);}
  let lane=geo('rear-travel-lane-L'+(level+1),{floor:level,kind:'lane',alpha:.095,anchor:[0,y,zr]});lane.box([0,y+.015,zr],[W-.12,.012,R-.13],C.teal);
  let arrows=geo('rear-lane-arrows-L'+(level+1),{floor:level,kind:'lane'});for(let xx=left+.4;xx<right-.65;xx+=1.35){arrows.arrow([xx,y+.026,zr-.08],[xx+.60,y+.026,zr-.08],C.teal,.09);arrows.arrow([xx+.60,y+.026,zr+.08],[xx,y+.026,zr+.08],C.teal,.09);}
  }
 for(let s of Object.values(slots)){
  if(s.kind==='lift')continue;
  const storage=s.kind==='storage',kind=s.charging?'charger':storage?'':'port';
  const name=s.charging?'XCharger':s.id==='D'?'D · HDX 투입':s.id==='A'?'A · SEER 출고':s.id;
  addLabel(s.id,name,[s.x,s.y+.52,F+.10],kind,s.floor);
  let volume=geo('space-'+s.id,{floor:s.floor,kind:'volume',alpha:.055,slot:s.id,anchor:[s.x,s.y+.7,zf]});volume.box([s.x,s.y+.88,zf],[bw-.15,1.4,F-.15],storage?C.blue:C.teal);
  let vb=geo('space-outline-'+s.id,{floor:s.floor,kind:'volume',slot:s.id});ringBox(vb,[s.x,s.y+.88,zf],[bw-.15,1.4,F-.15],storage?color('#87b1d4'):C.teal);

 }
 // Separate lift envelope: width, side clearances and depth are independent from rack bay dimensions.
 const lx=xc[1],hw=lw/2-.13,top=cfg.liftHeight;
 let tower=geo('lift-tower',{kind:'lift'});
 for(let x of[lx-hw,lx+hw])for(let z of[.13,LD-.13]){
  tower.box([x,.06,z],[.24,.12,.25],C.steelDark,true);
  tower.box([x,top/2,z],[.12,top,.12],C.steel,true);
  tower.box([x+(x<lx?.07:-.07),top/2,z],[.028,top-.25,.045],C.steelDark);
 }
 for(let z of[.13,LD-.13]){tower.box([lx,top-.065,z],[lw,.13,.17],C.steel,true);tower.box([lx,.13,z],[lw,.14,.16],C.steelDark,true);}
 for(let x of[lx-hw,lx+hw]){tower.box([x,top-.065,zl],[.14,.13,LD],C.steel,true);tower.box([x,.13,zl],[.14,.14,LD],C.steelDark,true);}
 // Interior guide masts and head drive, simplified from the lift reference.
 for(let x of[lx-.90,lx+.90]){tower.box([x,top/2,.34],[.10,top-.25,.16],C.steelDark,true);tower.box([x+.055,top/2,.34],[.025,top-.30,.065],C.light);}
 tower.box([lx,top-.23,.35],[1.95,.13,.23],C.steel,true);
 let fence=geo('lift-safety-mesh',{kind:'liftguard',alpha:.52});
 for(let x of[lx-hw,lx+hw]){for(let z=.19;z<LD-.15;z+=.14)fence.line([x,.20,z],[x,top-.18,z],C.yellowDark);for(let y=.25;y<top-.1;y+=.18)fence.line([x,y,.12],[x,y,LD-.12],C.yellowDark);}
 // Front safety screen: distributed open grid, not a filled box.
 for(let x=lx-hw+.12;x<lx+hw-.05;x+=.145)fence.line([x,.22,LD-.09],[x,top-.15,LD-.09],C.yellowDark);
 for(let y=.25;y<top-.15;y+=.18)fence.line([lx-hw,y,LD-.09],[lx+hw,y,LD-.09],C.yellowDark);
 for(let y of[.22,1.7,3.3,4.9,top-.17]){
  tower.box([lx,y,LD-.09],[lw-.12,.045,.045],C.yellow,true);
  for(let x of[lx-hw,lx+hw])tower.box([x,y,zl],[.045,.045,LD-.18],C.yellow,true);
 }
 const carW=Math.min(1.76,lw-.40),carD=Math.min(1.66,LD-.16),carBack=zl-carD/2,carFront=zl+carD/2;
 liftCar=geo('lift-carriage',{kind:'carriage'});
 for(let z of[carBack,carFront])liftCar.box([lx,-.10,z],[carW,.12,.13],C.steel,true);
 for(let x of[lx-carW/2,lx+carW/2])liftCar.box([x,-.10,zl],[.12,.12,carD],C.steel,true);
 for(let xx of[-.42,.42])rail(liftCar,[lx+xx,carBack],[lx+xx,carFront],0);
 for(let xx of[-.535,.535])liftCar.box([lx+xx,.128,zl],[.065,.056,1.25],C.steel);
 for(let x of[lx-carW/2,lx+carW/2])liftCar.box([x,.21,carBack],[.12,.58,.10],C.steelDark,true);
 liftCar.off=[0,trackY[manualLift],0];
 // Short entrance rails bridge from the rear lane to the carriage at each level.
 for(let i=0;i<3;i++){let g=geo('lift-transfer-entry-L'+(i+1),{kind:'structure',floor:i});for(let xx of[-.42,.42])rail(g,[lx+xx,zr],[lx+xx,Math.max(.05,carBack-.025)],trackY[i]);}
 let machine=geo('lift-machinery',{kind:'lift'});
 machine.box([lx+.86,top-.4,.38],[.26,.33,.4],C.steelDark,true);machine.cyl([lx+.72,top-.39,.38],[lx+1.10,top-.39,.38],.12,C.steel,14);
 const controlX=liftRight+.12,controlZ=LD+.08;
 machine.box([controlX,.64,controlZ],[.05,1.28,.05],C.steelDark);machine.box([controlX,1.24,controlZ],[.29,.38,.12],C.steel,true);
 machine.box([controlX,1.31,controlZ+.064],[.22,.16,.012],C.black);machine.box([controlX,1.31,controlZ+.073],[.18,.12,.012],C.blueDark);
 machine.box([controlX-.09,1.14,controlZ+.072],[.03,.03,.022],C.red);machine.box([controlX+.04,1.14,controlZ+.072],[.027,.027,.019],C.green);
 for(let i=0;i<3;i++)machine.cyl([controlX,1.48+i*.062,controlZ],[controlX,1.53+i*.062,controlZ],.029,[C.green,C.yellow,C.red][i],12);
 // XCharger is a full storage bay. The charger and its brackets sit OUTSIDE its front face.
 const cs=slots.CHG,cp=cfg.chargerProtrusion,cz=F+cp-.085;
 let chg=geo('external-charger-3F',{kind:'charger',floor:2});
 chg.box([cs.x,cs.y+.11,cz],[1.004,.3585,.14],C.light,true);
 chg.box([cs.x,cs.y+.10,cz+.076],[.84,.24,.014],C.steel,true);
 chg.box([cs.x,cs.y+.072,cz-.076],[.22,.12,.021],C.black,true);
 chg.box([cs.x+.39,cs.y+.12,cz+.085],[.027,.025,.018],C.green);
 for(let x of[-.44,.44]){chg.box([cs.x+x,cs.y-.10,F+cp/2],[.055,.07,cp],C.steelDark,true);chg.box([cs.x+x,cs.y+.03,cz],[.045,.36,.06],C.steelDark);}
 addLabel('CHARGER','외장 충전기',[cs.x,cs.y+.02,F+cp+.15],'charger',2);
 // Clearance annotations are overlays only; they are not solid walls or extra storage bays.
 const gcol=color('#daa552');let gaps=geo('lift-side-clearance-overlay',{kind:'clearance',alpha:.16});
 for(let[a,b]of[[leftRackEnd,liftLeft],[liftRight,rightRackStart]])gaps.box([(a+b)/2,.007,F/2],[b-a,.015,F],gcol);
 let outset=geo('lift-front-projection-overlay',{kind:'clearance',alpha:.10});outset.box([lx,.009,F+cfg.liftProtrusion/2],[lw,.017,cfg.liftProtrusion],gcol);
 let guides=geo('clearance-guides',{kind:'clearance'});
 for(let[a,b]of[[leftRackEnd,liftLeft],[liftRight,rightRackStart]]){guides.line([a,.035,F+.08],[b,.035,F+.08],gcol);for(let x of[a,b])guides.line([x,.035,F-.02],[x,.035,F+.18],gcol);}
 for(let x=left;x<right;x+=.36)guides.line([x,.021,F],[Math.min(x+.19,right),.021,F],gcol);
 addLabel('GAPL','좌 여유 '+Math.round(cfg.leftGap*1000)+'†',[(leftRackEnd+liftLeft)/2,.09,F+.16],'gap');
 addLabel('GAPR','우 여유 '+Math.round(cfg.rightGap*1000)+'†',[(liftRight+rightRackStart)/2,.09,F+.16],'gap');
 addLabel('PROJ','전면 돌출 '+Math.round(cfg.liftProtrusion*1000)+'†',[lx,.09,LD+.15],'gap');

 for(let g of geos.slice(geoStart)){bakeRack(g);g.rack=true;}
 for(let l of labels.slice(labelStart)){l.p=Rpoint(l.p);l.rack=true;}
 for(let s of Object.values(slots))s.world=Rpoint([s.x,s.y+.156,s.z]);
}


// Rev.06: source-based meshes, one metre per model unit. No network calls.
// N = -Z, E = +X, Y = height. Rack-local +Z faces east in the booth.
let geos=[],labels=[],slots={},dims={},trackY=[],liftCar,selection=null;
let manualLift=0,selectedFloor=0,explode=0,autoRotate=false,cameraMode='iso',dirty=true;
let cfg={bayWidth:1.4,liftWidth:3.134,leftGap:.7,rightGap:.3,frontDepth:1.28,rearDepth:1.28,liftProtrusion:.92,chargerProtrusion:.38,baseHeight:.45,levelPitch:2.176,rackHeight:5.8,liftHeight:6.92549,bufferX:8,bZ:2,cZ:7,rackBack:.18,rackCenter:4.5,pallet:[1.1,1.1,.15],shuttle:[1.135,.87,.126]};
const initialCfg=JSON.parse(JSON.stringify(cfg));
let cam={yaw:.9,pitch:.54,span:13.7,target:[4.5,1.8,4.5]},eye=[0,0,0],vp=M.id(),viewWidth=1,viewHeight=1;
const AINFO={S1:{name:'셔틀 01',short:'S1',tint:'#2671ae'},S2:{name:'셔틀 02',short:'S2',tint:'#369889'},SEER:{name:'SEER 지게차',short:'SF',tint:'#c89839'},AMR:{name:'SEER 저상형 AMR',short:'AM',tint:'#4b9490'},HDX:{name:'HDX ES15-A',short:'HD',tint:'#738a9a'}};
const halfBody={SEER:.8485,HDX:.295},palletReach={SEER:1.3985,HDX:.845};
const assets={robots:{},pallets:{},cargo:{},envelopes:{}};
let sim={time:0,playing:false,speed:4,error:null,actors:{},inventory:{},reservations:{},pallets:{},counts:{out:0,in:0,relocate:0,seer:0,amr:0,hdx:0},logs:[],liftY:.45,liftOwner:null,rackOwner:null,lastShuttle:'S1',homes:{},config:{x1:'X1',x2:'X2',third:false,external:true},stopAt:null};
const copy=x=>JSON.parse(JSON.stringify(x)),clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const Rnormal=p=>rotateVector(p,Math.PI/2);
function Rpoint(p){return V.add(Rnormal(p),[cfg.rearDepth+cfg.rackBack,0,cfg.rackCenter]);}
function geo(name,opt={}){const g=new Geo(name,opt);geos.push(g);return g;}
function addLabel(id,text,p,kind='',floor=-1,opt={}){let e=document.createElement('div');e.className='label '+kind;e.textContent=text;e.onclick=ev=>{ev.stopPropagation();selectItem(id)};$('overlay').appendChild(e);const l={id,text,p,kind,floor,e,...opt};labels.push(l);return l;}
function bakeRack(g){for(const arr of [g.vertices,g.lines])for(let i=0;i<arr.length;i+=9){const p=Rpoint(arr.slice(i,i+3)),n=Rnormal(arr.slice(i+3,i+6));for(let j=0;j<3;j++){arr[i+j]=p[j];arr[i+3+j]=n[j];}}g.anchor=Rpoint(g.anchor);}
const bufferDataEl=document.getElementById('buffer-data'); const bufferData=JSON.parse(bufferDataEl?bufferDataEl.textContent:'{}'); const bufferColors=Object.fromEntries((bufferData.categories||[]).map(x=>[x.id,x.color]));
const originalActors=makeActorParts();
function importMesh(g,p,col,shift=0){
 const cv=(v,i)=>[v[i]/1000+shift,v[i+2]/1000,-v[i+1]/1000];
 for(let i=0;i<p.f.length;i+=3){const a=cv(p.v,p.f[i]*3),b=cv(p.v,p.f[i+1]*3),c=cv(p.v,p.f[i+2]*3),n=V.norm(V.cross(V.sub(b,a),V.sub(c,a)));g.tri(a,b,c,n,col);}
 // Edges for the small source fasteners are omitted only from wire overlay; all solid faces are retained.
 if(!['bolt','pad','bracket'].includes(p.cat))for(let i=0;i<p.edges.length;i+=2)g.line(cv(p.v,p.edges[i]*3),cv(p.v,p.edges[i+1]*3),col.map(x=>x*.73));
}
function makeSourceBuffer(id){
 const byCat=new Map();
 for(const p of bufferData.parts){let g=byCat.get(p.cat);if(!g){g=geo(id+' / '+p.cat,{kind:'buffer',station:id});byCat.set(p.cat,g);}importMesh(g,p,color(bufferColors[p.cat]));}
 for(let g of byCat.values()){g.off=[cfg.bufferX,0,id==='B'?cfg.bZ:cfg.cZ];g.yaw=id==='B'?0:Math.PI;}
 slots[id]={id,kind:'buffer',floor:0,world:[cfg.bufferX,.28,id==='B'?cfg.bZ:cfg.cZ],displayName:id};
 addLabel(id,id+' · 고정 버퍼',[cfg.bufferX,.60,id==='B'?cfg.bZ-.65:cfg.cZ+.68],'buffer');
 addLabel(id+'OPEN',id==='B'?'남측 AMR 진입':'북측 AMR 진입',[cfg.bufferX,.055,id==='B'?cfg.bZ+.80:cfg.cZ-.80],'dimension');
}
function makeSourceRobot(id,cat){
 assets.robots[id]=[];
 for(const p of originalActors.filter(p=>p.cat===cat)){
  const lift=p.group.endsWith('Fork')||p.group.endsWith('Lift');
  let g=geo(id+' / '+p.name,{kind:'robot',actor:id,part:lift?'lift':'body'});
  importMesh(g,p,color(p.color),halfBody[id]||0);assets.robots[id].push(g);
 }
 // Set the back plane to the encoded nominal fork-heel length without scaling any source components.
 if(id==='SEER'||id==='HDX'){
  let g=geo(id+' / nominal rear plate',{kind:'robot',actor:id,part:'body'});
  g.box([-halfBody[id]+.006,.17,0],[.012,.18,id==='SEER'?1.18:.985],color(id==='SEER'?'#34414b':'#687986'));
  assets.robots[id].push(g);
 }
 const env=geo(id+' / nominal envelope',{kind:'envelope',actor:id});
 if(id==='AMR')ringBox(env,[0,.125,0],[.65,.25,.95],C.teal);
 else{const len=id==='SEER'?2.767:1.74,H=id==='SEER'?2.235:1.990,W=id==='SEER'?1.18:.985;ringBox(env,[(len-2*halfBody[id])/2,H/2,0],[len,H,W],id==='SEER'?C.yellow:C.blue);}
 assets.envelopes[id]=env;
 addLabel(id,AINFO[id].name,[0,0,0],'robot',-1,{actor:id});
}
function makeShuttle(id){
 const g=geo(id+' / PTR-H-C89',{kind:'robot',actor:id,part:'body',rack:true});shuttle(g);
 if(id==='S2')for(let i=6;i<g.vertices.length;i+=9){if(Math.abs(g.vertices[i]-C.blue[0])<1e-6&&Math.abs(g.vertices[i+1]-C.blue[1])<1e-6){const c=color('#288f88');g.vertices[i]=c[0];g.vertices[i+1]=c[1];g.vertices[i+2]=c[2];}}
 const d=geo(id+' / 40mm lifting pads',{kind:'robot',actor:id,part:'lift',rack:true});for(const z of[-.285,.285])d.box([0,.122,z],[1.03,.008,.07],C.light,true);
 assets.robots[id]=[g,d];
 const env=geo(id+' / nominal envelope',{kind:'envelope',actor:id,rack:true});ringBox(env,[0,.063,0],[1.135,.126,.87],id==='S1'?C.blue:C.teal);assets.envelopes[id]=env;
 addLabel(id,AINFO[id].name,[0,0,0],'robot',-1,{actor:id});
}
function makeTrackedPallet(id,i){
 const g=geo(id+' / pallet 1100×1100×150',{kind:'pallet',palletId:id});
 for(const p of originalActors.filter(p=>p.cat==='pallet'))importMesh(g,p,color(p.color));
 assets.pallets[id]=g; // ID is a screen annotation, not extra physical pallet thickness.
 const cg=geo(id+' / optional display cargo',{kind:'cargo',palletId:id});for(const p of originalActors.filter(p=>p.cat==='cargo'))importMesh(cg,p,color(p.color));assets.cargo[id]=cg;
 addLabel('PAL-'+id,id,[0,0,0],'palletid',-1,{palletId:id});
}
function makeBooth(){
 const g=geo('9000×9000 booth plane',{kind:'ground'});g.box([4.5,-.055,4.5],[9,.10,9],color('#eef3f5'));
 const grid=geo('500mm grid',{kind:'grid'});for(let x=0;x<=9;x+=.5)grid.line([x,.001,0],[x,.001,9],color(Number.isInteger(x)?'#cbd8df':'#dfe7ec'));for(let z=0;z<=9;z+=.5)grid.line([0,.001,z],[9,.001,z],color(Number.isInteger(z)?'#cbd8df':'#dfe7ec'));
 const edge=geo('9000mm exhibition boundary',{kind:'boundary'});for(const [a,b]of [[[0,.008,0],[9,.008,0]],[[9,.008,0],[9,.008,9]],[[9,.008,9],[0,.008,9]],[[0,.008,9],[0,.008,0]]])edge.beam(a,b,.023,color('#607f90'));
 for(const[x,z]of [[0,0],[0,9],[9,0],[9,9]])edge.cyl([x,.012,z],[x,.036,z],.056,color('#557788'),12);
 const dd=geo('Booth dimensions',{kind:'dimension'});for(const[a,b]of [[[0,.015,9.18],[9,.015,9.18]],[[9.18,.015,0],[9.18,.015,9]]])dd.line(a,b,color('#597b8f'));for(const x of[0,9])dd.line([x,.015,9.06],[x,.015,9.3],C.steelDark);for(const z of[0,9])dd.line([9.06,.015,z],[9.3,.015,z],C.steelDark);
 addLabel('BOOTHX','9000 mm',[4.5,.04,9.23],'dimension');addLabel('BOOTHZ','9000 mm',[9.28,.04,4.5],'dimension');addLabel('NORTH','N ↑',[8.65,.03,.40],'dimension');
 const panel=geo('Buffer / AMR demonstration floor strip',{kind:'zone',alpha:.28});panel.box([8,.003,4.5],[1.63,.008,7.4],color('#d7e9e3'));
 const width=3*cfg.bayWidth+cfg.liftWidth+cfg.leftGap+cfg.rightGap;
 const rd=geo('Rack footprint dimensions',{kind:'dimension'});
 const z1=4.5-width/2,z2=4.5+width/2,x1=cfg.rackBack,x2=cfg.rackBack+cfg.rearDepth+cfg.frontDepth;
 rd.line([x1-.08,.035,z1],[x1-.08,.035,z2],C.steelDark);
 addLabel('RACKL',Math.round(width*1000)+' mm †',[x1+.15,.12,(z1+z2)/2],'dimension');
 rd.line([x1,.02,z2+.18],[x2,.02,z2+.18],C.steelDark);
 addLabel('RACKD','2560 mm',[.5*(x1+x2),.045,z2+.23],'dimension');
}
function makePaths(){
 const g=geo('Concept transfer routes',{kind:'path',alpha:.65});
 const route=(points,c)=>{for(let i=1;i<points.length;i++){const a=[points[i-1][0],.029,points[i-1][1]],b=[points[i][0],.029,points[i][1]];g.line(a,b,c);if(Math.hypot(...V.sub(b,a))>.9){const mid=V.lerp(a,b,.54),end=V.lerp(a,b,.68);g.arrow(mid,end,c,.10);}}};
 const A=slots.A.world,D=slots.D.world;
 route([[A[0]+.6,A[2]],[5.3,A[2]],[5.3,cfg.bZ],[cfg.bufferX-.58,cfg.bZ]],color('#c49a4b'));
 route([[cfg.bufferX,cfg.bZ+.62],[cfg.bufferX,(cfg.bZ+cfg.cZ)/2],[cfg.bufferX,cfg.cZ-.62]],C.teal);
 route([[cfg.bufferX-.65,cfg.cZ],[5.8,cfg.cZ],[5.8,D[2]],[D[0]+.62,D[2]]],color('#719ab2'));
 const mid=(cfg.bZ+cfg.cZ)/2,r=.84;for(let i=0;i<50;i++){const a=i/50*TAU,b=(i+1)/50*TAU;g.line([cfg.bufferX+r*Math.cos(a),.03,mid+r*Math.sin(a)],[cfg.bufferX+r*Math.cos(b),.03,mid+r*Math.sin(b)],color('#70a69b'));}
 addLabel('TURN','AMR · 터널 밖 180° 회전',[cfg.bufferX,.055,mid],'rear');
 addLabel('ROUTE','동선은 연출용 · 조향 궤적 아님',[5.5,.028,4.7],'dimension');
}
function buildAll(){
 for(const g of geos)g.dispose();geos=[];labels=[];slots={};$('overlay').innerHTML='';
 assets.robots={};assets.pallets={};assets.cargo={};assets.envelopes={};
 makeBooth();buildRack();makeSourceBuffer('B');makeSourceBuffer('C');
 makeShuttle('S1');makeShuttle('S2');makeSourceRobot('SEER','seer');makeSourceRobot('HDX','hdx');makeSourceRobot('AMR','amr');
 ['P01','P02','P03','P04','P05'].forEach(makeTrackedPallet);makePaths();
 for(const g of geos)g.upload();
 syncLayoutUI();resetSimulation();dirty=true;
}
function worldStatic(id){const s=slots[id];if(!s)throw Error('Unknown station '+id);return s.world.slice();}
function actorWorld(a){return a.id[0]==='S'&&a.id.length===2?Rpoint(a.pos):a.pos.slice();}
function actorYaw(a){return a.id==='S1'||a.id==='S2'?Math.PI/2:a.yaw;}
function carrierBottom(a){if(a.id==='S1'||a.id==='S2')return a.pos[1]+.126+a.deck;if(a.id==='AMR')return a.deck;return a.forkTop-.125;}
function palletPosition(id){const p=sim.pallets[id];if(!p)return[0,0,0];if(!p.location.startsWith('@'))return worldStatic(p.location);const a=sim.actors[p.location.slice(1)],pos=actorWorld(a);pos[1]=carrierBottom(a);if(palletReach[a.id]){const d=rotateVector([palletReach[a.id],0,0],a.yaw);pos[0]+=d[0];pos[2]+=d[2];}return pos;}
function palletYaw(id){const p=sim.pallets[id];if(!p)return 0;return p.location.startsWith('@')?actorYaw(sim.actors[p.location.slice(1)])+p.yawOffset:p.yaw;}
function syncGeometry(){
 for(const a of Object.values(sim.actors)){
  const p=actorWorld(a),yaw=actorYaw(a);
  for(const g of assets.robots[a.id]){g.off=p.slice();g.yaw=yaw;if(g.part==='lift')g.off[1]+=a.id==='S1'||a.id==='S2'?a.deck:a.id==='AMR'?a.deck:a.forkTop;g.floor=(a.id==='S1'||a.id==='S2')?trackY.findIndex(y=>Math.abs(y-a.pos[1])<.1):-1;}
  const e=assets.envelopes[a.id];if(e){e.off=p.slice();e.yaw=yaw;e.floor=(a.id==='S1'||a.id==='S2')?trackY.findIndex(y=>Math.abs(y-a.pos[1])<.1):-1;}
 }
 if(liftCar)liftCar.off=[0,sim.liftY,0];
 for(const[id,g]of Object.entries(assets.pallets)){g.off=palletPosition(id);g.yaw=palletYaw(id);const c=assets.cargo[id];c.off=g.off.slice();c.yaw=g.yaw;}
 updateVisibility();dirty=true;
}

// Pallet transfers are transactions: reserve both endpoints, physically pick, physically put,
// leave the interface, then release the destination. Pallet IDs never respawn.
function log(event,detail,palletId=''){sim.logs.push({time:+sim.time.toFixed(2),event,detail,palletId});if(sim.logs.length>1600)sim.logs.shift();}
function ready(id){return !!sim.inventory[id]&&!sim.reservations[id];}
function empty(id){return !sim.inventory[id]&&!sim.reservations[id];}
function reserve(ids,owner){for(const id of ids)if(sim.reservations[id])throw Error(id+' 중복 예약');for(const id of ids)sim.reservations[id]=owner;}
function unlock(id,owner){if(sim.reservations[id]===owner)delete sim.reservations[id];}
function pick(id,a){
 if(!sim.inventory[id]||a.payload||sim.reservations[id]!==a.id)throw Error(id+' 픽업 상태 불일치');
 const pid=sim.inventory[id],p=sim.pallets[pid],before=worldStatic(id);
 const yaw=p.yaw;p.location='@'+a.id;p.yawOffset=yaw-actorYaw(a);a.payload=pid;sim.inventory[id]=null;
 const after=palletPosition(pid);if(Math.hypot(...V.sub(before,after))>.002)throw Error(a.id+' 픽업 인계 좌표 불연속');
 log('PICK',a.id+' · '+id+' 픽업',pid);
}
function put(id,a){
 if(!a.payload||sim.inventory[id]||sim.reservations[id]!==a.id)throw Error(id+' 하차 상태 불일치');
 const pid=a.payload,p=sim.pallets[pid],before=palletPosition(pid),after=worldStatic(id),yaw=palletYaw(pid);
 if(Math.hypot(...V.sub(before,after))>.002)throw Error(a.id+' 하차 인계 좌표 불연속 '+before+' / '+after);
 a.payload=null;p.location=id;p.yaw=yaw;p.yawOffset=0;sim.inventory[id]=pid;log('PUT',a.id+' · '+id+' 안착',pid);
}
function makeActor(id,pos,yaw=0){return{id,pos:pos.slice(),yaw,deck:id==='AMR'?.25:0,forkTop:id==='HDX'?.395:.50,payload:null,job:null,count:0};}
function step(duration,title,changes={},begin=null,end=null){return{duration:Math.max(.05,duration),title,changes,begin,end};}
function setJob(a,title,key,steps){a.job={title,key,steps,index:0,elapsed:0,done:0,total:steps.reduce((v,s)=>v+s.duration,0),started:false,from:null};log('START',a.id+' · '+title);}
function planMover(a){
 const steps=[];let pos=a.pos.slice(),yaw=a.yaw;
 return{steps,
  move(to,title,speed=.5){const dist=Math.hypot(...V.sub(to,pos));if(dist>.00001)steps.push(step(Math.max(.2,dist/speed),title,{pos:to.slice()}));pos=to.slice();},
  turn(to,title){if(Math.abs(to-yaw)>.0001)steps.push(step(Math.max(1.8,Math.abs(to-yaw)/(.55)),title,{yaw:to}));yaw=to;},
  act(sec,title,changes={},begin=null,end=null){steps.push(step(sec,title,changes,begin,end));},
  pos:()=>pos.slice()
 };
}
function dispatchSeerLegacy(){
 const a=sim.actors.SEER;if(a.job||!ready('A')||!empty('B'))return false;reserve(['A','B'],a.id);
 const A=worldStatic('A'),B=worldStatic('B'),stage=5.3,dockA=A[0]+palletReach.SEER,dockB=B[0]-palletReach.SEER;
 const m=planMover(a),travelBottom=A[1]+.06;
 m.act(.6,'A / B 예약 · 반출 포크 높이 정렬',{forkTop:A[1]+.110});
 m.turn(-Math.PI/2,'A 접근 · 남향 자세 전환 †');m.move([stage,0,A[2]],'A 진입 위치까지 북측으로 후진',.55);m.turn(-Math.PI,'A를 향해 서향 정렬 †');
 m.move([dockA,0,A[2]],'A 전면 포크 삽입',.34);
 m.act(1.2,'A 팔레트 데크 밑면 접촉',{forkTop:A[1]+.125},null,()=>pick('A',a));
 m.act(1.8,'A 팔레트 상승',{forkTop:travelBottom+.125});
 m.move([stage,0,A[2]],'A에서 팔레트 반출 · 동측 후진',.5);
 m.act(.15,'A 인계 구역 해제',{},null,()=>unlock('A',a.id));
 m.turn(-Math.PI/2,'B 이동 · 남향 정렬 †');m.move([stage,0,B[2]],'B 서측 인계 구역으로 이동',.55);m.turn(0,'B 서측에서 동향 정렬 †');
 m.act(1.6,'원본 인계 높이 · 팔레트 밑면 EL.410',{forkTop:.535});
 m.move([dockB,0,B[2]],'SEER 서측 접근 · B 중심 정렬',.34);
 m.act(3,'B에 팔레트 안착 · 밑면 EL.280',{forkTop:.405},null,()=>put('B',a));
 m.act(1.5,'SEER 포크 하강 · 지지 분리',{forkTop:.395});
 m.move([stage,0,B[2]],'SEER 서측 후진 · AMR 인계 구역 이탈',.4);
 m.act(.15,'B 인계 구역 해제',{},null,()=>unlock('B',a.id));
 setJob(a,'A → B · SEER 지게차','seer',m.steps);return true;
}
function dispatchAmr(){
 const a=sim.actors.AMR;if(a.job||!ready('B')||!empty('C'))return false;reserve(['B','C'],a.id);
 const B=worldStatic('B'),Cpos=worldStatic('C'),x=cfg.bufferX,by=cfg.bZ,cy=cfg.cZ,mid=(by+cy)/2,m=planMover(a);
 m.act(.6,'B / C 예약 · 플랫폼 EL.250',{deck:.25});
 m.move([x,0,by],'AMR B 남측 직진 진입',.32);
 m.act(1.5,'B 팔레트 하면 접촉 · EL.280',{deck:.28},null,()=>pick('B',a));
 m.act(1.5,'AMR 상승 · 팔레트 EL.310',{deck:.31});
 m.move([x,0,by+1.4],'B 남측 후진 · 터널 안에서는 회전 금지',.34);
 m.act(.15,'B 접근 구간 해제',{},null,()=>unlock('B',a.id));
 m.move([x,0,mid],'팔레트까지 버퍼 밖 · 회전 지점 이동',.5);
 m.turn(Math.PI,'터널 밖 180° 회전');
 m.move([x,0,cy-1.4],'C 북측 진입점 정렬',.5);
 m.move([x,0,cy],'AMR C 북측 직진 진입',.32);
 m.act(1.5,'C에 팔레트 안착 · EL.280',{deck:.28},null,()=>put('C',a));
 m.act(1.5,'AMR 플랫폼 하강 · EL.250',{deck:.25});
 m.move([x,0,cy-1.4],'AMR만 C 북측 후진 · HDX 접근 전 이탈',.34);
 m.act(.15,'C 인계 구역 해제',{},null,()=>unlock('C',a.id));
 m.move([x,0,mid],'AMR 빈 차 복귀 · 중앙 이동',.55);
 m.turn(0,'빈 차 180° 회전 · B 재진입 방향');
 m.move([x,0,by+1.4],'B 남측 대기 위치 복귀',.55);
 setJob(a,'B → C · 고정 버퍼 인계','amr',m.steps);return true;
}
function dispatchHdxLegacy(){
 const a=sim.actors.HDX;if(a.job||!ready('C')||!empty('D'))return false;reserve(['C','D'],a.id);
 const Cpos=worldStatic('C'),D=worldStatic('D'),stage=5.8,dockC=Cpos[0]-palletReach.HDX,dockD=D[0]+palletReach.HDX,m=planMover(a);
 m.act(.6,'C / D 예약 · 포크 EL.395',{forkTop:.395});
 m.move([dockC,0,Cpos[2]],'HDX C 서측 포크 삽입',.35);
 m.act(1.5,'HDX 포크 접촉 · 데크 밑면 EL.405',{forkTop:.405},null,()=>pick('C',a));
 m.act(3,'C 가이드 상부로 팔레트 상승 · EL.410',{forkTop:.535});
 m.move([stage,0,Cpos[2]],'HDX 서측 후진 · C에서 반출',.4);
 m.act(.15,'C 인계 구역 해제',{},null,()=>unlock('C',a.id));
 m.act(1.8,'D 안착면보다 높게 팔레트 상승',{forkTop:D[1]+.185});
 m.turn(Math.PI/2,'D 접근 · 북향 자세 전환 †');m.move([stage,0,D[2]],'D 진입점까지 남측으로 후진',.5);m.turn(Math.PI,'D를 향해 서향 정렬 †');
 m.move([dockD,0,D[2]],'HDX D 전면 직진 투입',.35);
 m.act(2.2,'D 팔레트 안착',{forkTop:D[1]+.125},null,()=>put('D',a));
 m.act(1.2,'HDX 포크 하강 · D 지지 분리',{forkTop:D[1]+.110});
 m.move([stage,0,D[2]],'D에서 동측 후진 · 셔틀 인계면 이탈',.45);
 m.act(.15,'D 인계 구역 해제',{},null,()=>unlock('D',a.id));
 m.turn(Math.PI/2,'C 복귀 · 북향 정렬 †');m.move([stage,0,Cpos[2]],'C 서측 대기 위치 복귀',.55);m.turn(0,'C 서측 포킹 방향 정렬 †');
 m.act(.8,'HDX 대기 포크 높이',{forkTop:.395});
 setJob(a,'C → D · HDX 지게차','hdx',m.steps);return true;
}
function dispatchShuttleLegacy(a,src,dst,key){
 if(sim.rackOwner||a.job||!ready(src)||!empty(dst))return false;
 reserve([src,dst],a.id);sim.rackOwner=a.id;sim.liftOwner=a.id;
 const steps=[],home=slots[sim.homes[a.id]],S=slots[src],D=slots[dst];let p=a.pos.slice(),liftY=sim.liftY,loaded=false;
 const add=(duration,title,changes={},begin=null,end=null)=>steps.push(step(duration,title,changes,begin,end));
 const move=(to,title,speed=null)=>{const distance=Math.hypot(...V.sub(to,p));if(distance>.00001)add(Math.max(.18,distance/(speed||(loaded?1:1.5))),title,{pos:to.slice()});p=to.slice();};
 const rear=()=>move([p[0],p[1],dims.zr],'후면 통로로 직진 이탈',.55);
 function level(targetY){
  if(Math.abs(p[1]-targetY)<.00001)return;
  rear();move([dims.xc[1],p[1],dims.zr],'리프트 후면 진입점 정렬');
  if(Math.abs(liftY-p[1])>.00001){add(Math.abs(liftY-p[1])/.6,'공용 리프트 호출 · 셔틀은 후면 대기',{liftY:p[1]});liftY=p[1];}
  move([dims.xc[1],p[1],dims.zl],'셔틀 리프트 탑승',.50);
  add(1,'리프트 탑승 확인 · 전용 예약 유지');
  add(Math.abs(targetY-p[1])/.6,'리프트 '+(targetY>p[1]?'상승':'하강'),{pos:[p[0],targetY,p[2]],liftY:targetY});
  p=[p[0],targetY,p[2]];liftY=targetY;add(.7,'층 정렬 확인');rear();
 }
 function approach(s){rear();level(s.y);move([s.x,s.y,dims.zr],s.id+' 후면 통로 이동');move([s.x,s.y,s.z],s.id+' 팔레트 하부 진입',.50);}
 approach(S);add(1.5,src+' 팔레트 접촉',{deck:.030},null,()=>pick(src,a));loaded=true;
 add(1.5,'셔틀 리프팅 40 mm',{deck:.040});rear();add(.1,src+' 인계면 해제',{},null,()=>unlock(src,a.id));
 approach(D);add(1.5,dst+' 지지면에 팔레트 안착',{deck:.030},null,()=>put(dst,a));loaded=false;
 add(1.5,'셔틀 리프팅 하강',{deck:0});rear();add(.1,dst+' 인계면 해제',{},null,()=>unlock(dst,a.id));
 approach(home);add(.4,sim.homes[a.id]+' 빈 대기 칸 정차 · 다음 셔틀에 통로 해제');
 const title=key==='out'?'X2 → A · 출고 보충':key==='in'?'D → X1 · 입고 보관':'X1 → X2 · 이적';
 setJob(a,title,key,steps);return true;
}
function completedLegacy(a){const j=a.job;if(!j)return;log('FINISH',a.id+' · '+j.title);a.count++;sim.counts[j.key]++;a.job=null;if(a.id==='S1'||a.id==='S2'){sim.rackOwner=null;sim.liftOwner=null;sim.lastShuttle=a.id;}
 for(const[id,owner]of Object.entries(sim.reservations))if(owner===a.id)delete sim.reservations[id];
 if(sim.stopAt!=null&&internalCount()>=sim.stopAt){sim.playing=false;sim.stopAt=null;}
}
function internalCount(){return sim.counts.out+sim.counts.in+sim.counts.relocate+(sim.counts.vertical||0);}
function scheduleLegacy(){
 if(!sim.rackOwner){const a=sim.actors[sim.lastShuttle==='S1'?'S2':'S1'],x1=sim.config.x1,x2=sim.config.x2;
  if(empty('A')&&ready(x2))dispatchShuttle(a,x2,'A','out');
  else if(ready('D')&&empty(x1))dispatchShuttle(a,'D',x1,'in');
  else if(ready(x1)&&empty(x2))dispatchShuttle(a,x1,x2,'relocate');
 }
 if(sim.config.external){dispatchHdx();dispatchAmr();dispatchSeer();}
}
function assertScenario(){
 const ids=Object.keys(sim.pallets),seen=[];
 for(const[id,p]of Object.entries(sim.inventory))if(p){if(sim.pallets[p]?.location!==id)throw Error('재고 위치 불일치: '+id);seen.push(p);}
 for(const a of Object.values(sim.actors)){if(a.payload){if(sim.pallets[a.payload]?.location!=='@'+a.id)throw Error('운반 재고 불일치');seen.push(a.payload);}if(!a.pos.every(Number.isFinite)||!Number.isFinite(a.yaw))throw Error('유효하지 않은 장비 위치');}
 if(seen.length!==ids.length||new Set(seen).size!==ids.length)throw Error('팔레트 수량 또는 중복 오류');
 for(const[id,owner]of Object.entries(sim.reservations))if(!sim.actors[owner]?.job)throw Error('소유 작업이 없는 예약: '+id);
 if(!continuous()&&sim.actors.S1.job&&sim.actors.S2.job)throw Error('공용 통로 순차 예약 위반');
 if(continuous()){if(Math.abs(sim.actors.S1.pos[1]-trackY[0])>.002)throw Error('S1 전용층 위반');if(sim.actors.S2.pos[1]<trackY[1]-.002)throw Error('S2 전용층 위반');if(sim.actors.S1.payload==='P05')throw Error('상층 팔레트 풀 위반');if(sim.actors.S2.payload&&sim.actors.S2.payload!=='P05')throw Error('운영 팔레트 풀 위반');}
 for(const id of ['S1','S2'])if(sim.actors[id].deck<-.0001||sim.actors[id].deck>.0401)throw Error('셔틀 리프팅 범위 오류');
 if(sim.actors.AMR.deck<.2499||sim.actors.AMR.deck>.3101)throw Error('AMR 리프팅 범위 오류');
 // Never rotate a pallet or AMR inside either buffer tunnel.
 const a=sim.actors.AMR;if(a.job&&'yaw' in a.job.steps[a.job.index].changes&&Math.min(Math.abs(a.pos[2]-cfg.bZ),Math.abs(a.pos[2]-cfg.cZ))<1.25)throw Error('AMR 버퍼 내부 회전 오류');
 return{ok:true,palletCount:ids.length,unique:new Set(seen).size,shuttleCount:2};
}
function advanceSimulation(dt,force=false){
 if((!sim.playing&&!force)||sim.error)return;let left=Math.max(0,dt);
 try{while(left>1e-9&&(sim.playing||force)){const step=Math.min(.05,left);schedule();sim.time+=step;for(const a of Object.values(sim.actors))tickActor(a,step);assertScenario();left-=step;}}
 catch(e){sim.error=e.message;sim.playing=false;log('ERROR',e.message);console.error(e);}
 syncGeometry();dirty=true;
}
function resetSimulationLegacy(){
 const x1=$('storageOne').value||'X1',x2=$('storageTwo').value||'X2';if(x1===x2){toast('서로 다른 보관 칸을 지정해 주세요.');return;}
 sim.config={x1,x2,third:$('thirdPallet').checked,external:$('autoExternal').checked};
 Object.assign(sim,{time:0,playing:false,error:null,actors:{},inventory:{},reservations:{},pallets:{},counts:{out:0,in:0,relocate:0,seer:0,amr:0,hdx:0},logs:[],liftY:trackY[0],liftOwner:null,rackOwner:null,lastShuttle:'S1',stopAt:null});
 const available=['X6','X4','X3','X5','CHG','X1','X2'].filter(s=>s!==x1&&s!==x2);sim.homes={S1:available[0],S2:available[1]};
 for(const[id,s]of Object.entries(slots))if(s.kind!=='lift')sim.inventory[id]=null;
 for(const id of ['S1','S2']){const h=slots[sim.homes[id]];sim.actors[id]=makeActor(id,[h.x,h.y,h.z]);}
 sim.actors.SEER=makeActor('SEER',[5.3,0,cfg.bZ],0);sim.actors.HDX=makeActor('HDX',[5.8,0,cfg.cZ],0);sim.actors.AMR=makeActor('AMR',[cfg.bufferX,0,cfg.bZ+1.4],0);
 const seed=[['P01',x2],['P02','D']];if(sim.config.third)seed.push(['P03','B']);for(const[id,loc]of seed){sim.inventory[loc]=id;sim.pallets[id]={id,location:loc,yaw:0,yawOffset:0};}
 for(const id of ['storageOne','storageTwo'])for(const o of $(id).options)o.disabled=o.value===(id==='storageOne'?x2:x1);
 log('RESET','초기 팔레트 '+seed.length+'개 / 셔틀 2대 / B·C 고정');syncGeometry();updateUI();dirty=true;
}
function playPause(){if(sim.error){toast('초기화한 후 다시 재생해 주세요.');return;}sim.stopAt=null;sim.playing=!sim.playing;updateUI();dirty=true;}

function formatTime(t){const whole=Math.floor(Math.max(0,t)+1e-6);return String(Math.floor(whole/60)).padStart(2,'0')+':'+String(whole%60).padStart(2,'0');}
const displaySlot=s=>s==='CHG'?'XCharger':s;
function updateUILegacy(){
 if(!sim.actors.S1)return;
 const palN=Object.keys(sim.pallets).length;$('palCount').innerHTML=palN+'<small> 개</small>';$('conserve').textContent=sim.error?'오류 · 정지':palN+' / '+palN+' 보존';
 $('playBtn').textContent=sim.playing?'Ⅱ 일시정지':sim.time>0?'▶ 계속 재생':'▶ 통합 재생';$('timeLabel').textContent=formatTime(sim.time);
 $('liftState').textContent='Lift '+Math.round(sim.liftY*1000)+' mm'+(sim.liftOwner?' · '+sim.liftOwner+' 예약':' · 대기');
 for(const[id,a]of Object.entries(sim.actors)){const el=$('actor-'+id),j=a.job;el.classList.toggle('busy',!!j);el.querySelector('small').textContent=sim.error?sim.error:j?j.steps[j.index]?.title:'대기'+(id.startsWith('S')&&id.length===2?' · '+displaySlot(sim.homes[id]):'');el.querySelector('.jobs').textContent=a.count+'건';el.querySelector('.progress i').style.width=j?(j.done/j.total*100)+'%':'0%';}
 const pairs=[[sim.config.x2,'A','out'],['D',sim.config.x1,'in'],[sim.config.x1,sim.config.x2,'relocate']];
 for(let i=0;i<3;i++){const[s,d,key]=pairs[i],working=Object.values(sim.actors).find(a=>a.job?.key===key);$('rule'+i).classList.toggle('busy',!!working);$('count-'+key).textContent=sim.counts[key]+'회';$('ruleState'+i).textContent=working?working.id+' 실행 중':!sim.inventory[s]?displaySlot(s)+' 재고 대기':sim.inventory[d]?displaySlot(d)+' 비움 대기':sim.reservations[s]||sim.reservations[d]?'인계 구역 해제 대기':sim.rackOwner?'통로 · 리프트 해제 대기':'배차 가능';}
 const rows=[['A','A · 출고'],['B','B · 고정 버퍼'],['C','C · 고정 버퍼'],['D','D · 투입'],[sim.config.x1,'X1 역할 · '+displaySlot(sim.config.x1)],[sim.config.x2,'X2 역할 · '+displaySlot(sim.config.x2)]];
 $('inventoryRows').innerHTML=rows.map(([id,name])=>'<tr><th>'+name+'</th><td class="'+(sim.inventory[id]?'full':'wait')+'">'+(sim.inventory[id]||'—')+'</td><td>'+(sim.reservations[id]?sim.reservations[id]+' 예약':'')+'</td></tr>').join('');
 $('externalCounts').textContent='A→B '+sim.counts.seer+' / B→C '+sim.counts.amr+' / C→D '+sim.counts.hdx+'회';
 $('parkingInfo').textContent='셔틀 대기 칸: 01 '+displaySlot(sim.homes.S1)+' / 02 '+displaySlot(sim.homes.S2)+' · X1/X2 지정에 따라 자동 변경';
 $('logs').innerHTML=sim.logs.slice(-9).reverse().map(l=>'<div><time>'+formatTime(l.time)+'</time><span>'+l.detail+(l.palletId?' · '+l.palletId:'')+'</span></div>').join('');
 document.querySelectorAll('[data-flow]').forEach(e=>{const id=e.dataset.flow==='X1'?sim.config.x1:e.dataset.flow==='X2'?sim.config.x2:e.dataset.flow;e.classList.toggle('on',!!sim.inventory[id]);});
 const b=boundaryReport();$('boundaryBadge').className='statusBadge'+(b.outside.length?' warn':'');$('boundaryBadge').textContent=b.outside.length?'경계 이탈: '+b.outside.join(', '):'현재 공칭 외곽 · 9×9 경계 안';
 if(selection)updateDetail();
}
function nominalCorners(id){
 if(id==='AMR')return[[-.325,-.475],[-.325,.475],[.325,-.475],[.325,.475]];
 if(id==='S1'||id==='S2')return[[-.5675,-.435],[-.5675,.435],[.5675,-.435],[.5675,.435]];
 const rear=-halfBody[id],front=halfBody[id]+(id==='SEER'?1.07:1.15),w=id==='SEER'?.590:.4925;
 return[[rear,-w],[rear,w],[front,-w],[front,w]];
}
function boundaryReport(){let outside=[],bounds={};
 for(const[id,a]of Object.entries(sim.actors)){const p=actorWorld(a),pts=nominalCorners(id).map(q=>V.add(rotateVector([q[0],0,q[1]],actorYaw(a)),p));const bb={minX:Math.min(...pts.map(p=>p[0])),maxX:Math.max(...pts.map(p=>p[0])),minZ:Math.min(...pts.map(p=>p[2])),maxZ:Math.max(...pts.map(p=>p[2]))};bounds[id]=bb;if(bb.minX<-.001||bb.maxX>9.001||bb.minZ<-.001||bb.maxZ>9.001)outside.push(id);}
 for(const pid of Object.keys(sim.pallets)){const p=palletPosition(pid),pts=[[-.55,-.55],[-.55,.55],[.55,-.55],[.55,.55]].map(q=>V.add(rotateVector([q[0],0,q[1]],palletYaw(pid)),p));const bb={minX:Math.min(...pts.map(p=>p[0])),maxX:Math.max(...pts.map(p=>p[0])),minZ:Math.min(...pts.map(p=>p[2])),maxZ:Math.max(...pts.map(p=>p[2]))};bounds[pid]=bb;if(bb.minX<-.001||bb.maxX>9.001||bb.minZ<-.001||bb.maxZ>9.001)outside.push(pid);}
 return{outside,bounds,note:'Nominal moving-body plan envelopes only; NOT collision / turning-radius / safe-clearance validation.'};
}
function selectItem(id){
 if(id.startsWith('PAL-'))id=id.slice(4);if(!slots[id]&&!sim.actors[id]&&!sim.pallets[id])return;
 selection=id;$('detail').style.display='block';updateDetail();dirty=true;
}
function updateDetail(){
 const id=selection;if(!id)return;
 $('detailCode').textContent=sim.actors[id]?'MOBILE EQUIPMENT':sim.pallets[id]?'PALLET ID':'LOCATION';
 $('detailTitle').textContent=AINFO[id]?.name||(id==='CHG'?'XCharger':id==='LIFT'?'Lift':id);
 let text='',p;
 if(sim.actors[id]){const a=sim.actors[id];text=a.job?a.job.title+' / '+a.job.steps[a.job.index]?.title:'대기';p=actorWorld(a);}
 else if(sim.pallets[id]){text='현재 위치: '+sim.pallets[id].location+' / 외형 1100 × 1100 × 150 mm';p=palletPosition(id);}
 else{const s=slots[id];p=s.world;
  text=id==='B'?'고정 스탠드 B. SEER가 서측에서 적치하고 AMR은 남측으로 진입·후진합니다. 스탠드는 이동하지 않습니다.':id==='C'?'고정 스탠드 C. AMR이 북측으로 진입·하차하고 HDX는 서측에서 반출합니다.':id==='A'?'셔틀이 후면에서 채우는 1단 출고구. SEER 지게차가 동측 전면에서 반출합니다.':id==='D'?'HDX 지게차가 동측 전면에서 투입하는 1단 입고구. 셔틀이 후면으로 가져갑니다.':id==='CHG'?'3단의 팔레트 보관 가능 칸입니다. 충전기 본체는 랙 전면 바깥으로 돌출합니다.':id==='LIFT'?'리프트 일반 제원 3134 × 2200 mm 적용. 좌우 간격과 제작품 높이는 실측 미확인입니다.':(s.floor+1)+'단 보관 칸. 후면의 공용 셔틀 통로에서 진입합니다.';
  if(sim.homes.S1===id||sim.homes.S2===id)text+=' 현재 비작업 셔틀의 대기 칸으로 사용합니다.';
 }
 $('detailText').textContent=text;$('detailReadout').innerHTML='X(E) '+Math.round(p[0]*1000)+' / Z(S) '+Math.round(p[2]*1000)+' mm<br>높이 '+Math.round(p[1]*1000)+' mm'+(slots[id]&&id!=='LIFT'?'<br>재고: '+(sim.inventory[id]||'비어 있음')+' · '+(sim.reservations[id]||'예약 없음'):'');
}
function initUI(){
 const opts=[['X1','3단 X1'],['X2','3단 X2'],['CHG','3단 XCharger'],['X3','2단 X3'],['X4','2단 X4'],['X5','2단 X5'],['X6','1단 X6']];
 for(const[id,val]of [['storageOne','X1'],['storageTwo','X2']]){$(id).innerHTML=opts.map(([v,t])=>'<option value="'+v+'">'+t+'</option>').join('');$(id).value=val;}
 $('actorRows').innerHTML=Object.entries(AINFO).map(([id,i])=>'<div class="actor" id="actor-'+id+'"><span class="aicon">'+i.short+'</span><div><b>'+i.name+'</b><small>대기</small><div class="progress"><i></i></div></div><span class="jobs">0건</span></div>').join('');
 const dimsInputs=[['bayWidth','랙 1칸 피치 †',1200,1600],['liftWidth','리프트 폭 · 일반 제원',2200,3600],['leftGap','리프트 좌 여유 †',80,1200],['rightGap','리프트 우 여유 †',80,1200],['rackHeight','랙 기둥 높이 †',5000,6800],['liftHeight','리프트 높이 †',5400,8000],['baseHeight','1단 주행면 적용값 †',300,700],['levelPitch','단간 피치 · 도면 판독',1500,2600]];
 $('dimensionInputs').innerHTML=dimsInputs.map(([key,name,min,max])=>'<label class="field"><span>'+name+'</span><input data-config="'+key+'" type="number" min="'+min+'" max="'+max+'" step="1"></label>').join('');
 $('layoutInputs').innerHTML=[['bufferX','B/C 동측 좌표 †',7700,8300],['bZ','B 남북 좌표 †',1700,2500],['cZ','C 남북 좌표 †',6400,7600]].map(([key,name,min,max])=>'<label class="field"><span>'+name+'</span><input data-config="'+key+'" type="number" min="'+min+'" max="'+max+'" step="10"></label>').join('');
}
function syncLayoutUI(){
 document.querySelectorAll('[data-config]').forEach(e=>e.value=Math.round(cfg[e.dataset.config]*1000));
 const width=(3*cfg.bayWidth+cfg.leftGap+cfg.rightGap+cfg.liftWidth)*1000;
 $('layoutReadout').innerHTML='랙 길이 <b>'+Math.round(width)+' mm †</b><br>일반 랙 깊이 <b>'+Math.round((cfg.frontDepth+cfg.rearDepth)*1000)+' mm</b><br>리프트 포함 최대 깊이 <b>'+Math.round((cfg.rearDepth+cfg.frontDepth+cfg.liftProtrusion)*1000)+' mm</b><br>B/C 중심 간격 <b>'+Math.round((cfg.cZ-cfg.bZ)*1000)+' mm †</b>';
 const rows=[
 ['부스','9000 × 9000','입력 자료','사용자 지정 경계. 설비 배치만 모델링.'],
 ['팔레트','1100 × 1100 × 150','입력 자료','사용자 지정. 하면 블록·포크 개구는 원본 HTML의 설명용 형상.'],
 ['PTR-H-C89 × 2','1135 × 870 × 126<br>리프팅 스트로크 40','입력 자료','사용자 제공 셔틀 제원 이미지. 동일 크기 2대.'],
 ['SEER 지게차','2767 × 1180 × 2235<br>포크 1070 × 122 × 40','원본 뷰어','총 길이 = 원본 코드의 포크 앞면 전 차체 1697 + 포크 1070. 모델명과 전시 실물 옵션 미확인. 포크 외폭 570은 원본 가정.'],
 ['HDX ES15-A','1740 × 985 × 1990<br>포크 1150 × 180 × 60','원본 뷰어','총 길이 = 원본 차체 590 + 포크 1150. 하부 지지다리 세부 외곽은 설명용.'],
 ['SEER 저상형 AMR','950 × 650 × 250<br>플랫폼 850 × 600 / 스트로크 60','원본 뷰어','첨부 HTML에 기록된 제원. 실제 정확한 모델명은 자료에 없음.'],
 ['고정 버퍼 B / C','레일 내폭 800 / 길이 1200<br>안착면 EL.280 / 개방단 탭 EL.290','원본 뷰어','Rev.G1 B안 메시를 재사용. 4040 다리 6개, 북/남 폐쇄 방향 유지. 제작·고정 승인 아님.'],
 ['랙','3단 / 후면 전체 통로<br>깊이 1280 + 1280 = 2560<br>단간 피치 '+Math.round(cfg.levelPitch*1000),'도면 + †','평면·정면 이미지의 읽을 수 있는 치수 적용. 1단 주행면의 정확한 치수 기준점은 별도 확인.'],
 ['랙 길이 / 기둥 높이',Math.round(width)+' / '+Math.round(cfg.rackHeight*1000),'† 미확정','칸 피치·리프트 간격에 따른 계산 길이. 기둥 높이도 원본 임시 모델값.'],
 ['리프트',Math.round(cfg.liftWidth*1000)+' × '+Math.round((cfg.frontDepth+cfg.liftProtrusion)*1000)+'<br>높이 '+Math.round(cfg.liftHeight*1000)+' †','일반 제원 + †','기본값 3134 × 2200은 처음 제공된 일반 제원. 제작품 외곽 일치 여부 미확인. 높이는 도면 이미지 판독에 따른 근사값.'],
 ['좌우 여유 / 전면 돌출',Math.round(cfg.leftGap*1000)+' / '+Math.round(cfg.rightGap*1000)+' / '+Math.round(cfg.liftProtrusion*1000),'† 미확정','좌우 여유는 원본 Rev.03 배치값. 돌출은 리프트 깊이 2200 - 랙 전면 깊이 1280.'],
 ['외장 충전기','1004 × 358.5<br>케이스 두께 140 † / 돌출 380 †','입력 자료 + †','2방향 치수는 제공 제원. 두께와 브래킷·돌출량은 미확정. 셀의 팔레트 보관 가능.'],
 ['장비 좌표·경로','9 × 9 m 안의 배치안','† 연출','B/C 원본 예시 간격 3800을 그대로 강제하지 않음. 실제 조향·회전반경·허용 속도 검증 미포함.']
 ];
 $('sourceRows').innerHTML=rows.map(([a,b,c,d])=>'<tr><th>'+a+'</th><td><b>'+b+'</b></td><td><span class="pill '+(c.startsWith('†')?'assumed':c==='입력 자료'?'doc':'ref')+'">'+c+'</span><br>'+d+'</td></tr>').join('');
}
function applyLayout(){const next={...cfg};for(const e of document.querySelectorAll('[data-config]')){const v=Number(e.value);if(!Number.isFinite(v)||v<Number(e.min)||v>Number(e.max)){$('layoutError').textContent='입력 범위를 확인해 주세요.';return;}next[e.dataset.config]=v/1000;}
 if(3*next.bayWidth+next.liftWidth+next.leftGap+next.rightGap>8.65){$('layoutError').textContent='이 구성은 랙 발판을 포함하면 9m 경계 여유가 부족합니다. 치수를 축소해 맞추기 전에 원본 도면을 확인하세요.';return;}
 if(next.cZ-next.bZ<3.7){$('layoutError').textContent='AMR이 두 버퍼 밖에서 회전할 수 있도록 B/C 간격을 다시 확인하세요.';return;}
 if(next.rackHeight<next.baseHeight+2*next.levelPitch+.45||next.liftHeight<next.baseHeight+2*next.levelPitch+.8){$('layoutError').textContent='3단 주행면에 비해 랙 또는 리프트 높이가 낮습니다.';return;}
 cfg=next;$('layoutError').textContent='';buildAll();setCamera('iso');toast('배치안을 적용했습니다. 원본 제원과 제작품 실측을 별도로 확인하세요.');
}

function updateVisibility(){
 const level=Number($('floorFilter').value),pal=$('showPallets').checked;
 for(const g of geos){let v=true;
  if(g.rack&&g.floor>=0&&level&&g.floor!==level-1)v=false;
  if(g.kind==='grid'&&!$('showGrid').checked)v=false;
  if(g.kind==='dimension'&&!$('showDimensions').checked)v=false;
  if(g.kind==='clearance'&&!$('showDimensions').checked)v=false;
  if(g.kind==='volume'&&!$('showVolumes').checked)v=false;
  if(g.kind==='path'&&!$('showPaths').checked)v=false;
  if(g.kind==='lane'&&!$('showLane').checked)v=false;
  if(g.kind==='envelope'&&!$('showEnvelopes').checked)v=false;
  if(g.kind==='pallet'||g.kind==='cargo'){
   const p=sim.pallets[g.palletId];v=pal&&!!p&&(g.kind!=='cargo'||$('showCargo').checked);
   if(v&&level&&p.location[0]!=='@'&&slots[p.location]?.kind!=='buffer'&&slots[p.location]?.floor!==level-1)v=false;
   if(v&&level&&/^@S[12]$/.test(p.location)&&trackY.findIndex(y=>Math.abs(y-sim.actors[p.location.slice(1)].pos[1])<.2)!==level-1)v=false;
  }
  g.visible=v;
 }
 dirty=true;
}
function alphaOf(g){return g.alpha*($('ghostFrame').checked&&['structure','lift','liftguard'].includes(g.kind)?.18:1);}
function view(){
 viewWidth=(main&&main.clientWidth)?main.clientWidth:(canvas&&canvas.clientWidth)?canvas.clientWidth:800;
 viewHeight=(main&&main.clientHeight)?main.clientHeight:(canvas&&canvas.clientHeight)?canvas.clientHeight:600;
 if(viewWidth<=0) viewWidth=800;
 if(viewHeight<=0) viewHeight=600;
 const dpr=Math.min(devicePixelRatio||1,2),w=Math.round(viewWidth*dpr),h=Math.round(viewHeight*dpr);
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
 cam.pitch=clamp(cam.pitch,.008,Math.PI/2-.001);const co=Math.cos(cam.pitch);eye=V.add(cam.target,[Math.sin(cam.yaw)*co*30,Math.sin(cam.pitch)*30,Math.cos(cam.yaw)*co*30]);
 const hs=cam.span*viewWidth/viewHeight;vp=M.mul(M.ortho(-hs/2,hs/2,-cam.span/2,cam.span/2,.1,100),M.look(eye,cam.target));gl.uniformMatrix4fv(loc.VP,false,vp);
}
function drawGeo(g,alpha,lines=false){const data=lines?g.ld:g.data;if(!data.length)return;gl.bindBuffer(gl.ARRAY_BUFFER,lines?g.lbuf:g.buf);for(const[l,size,off]of [[loc.P,3,0],[loc.N,3,12],[loc.C,3,24]]){gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,size,gl.FLOAT,false,36,off);}gl.uniform3fv(loc.off,g.off);gl.uniform2f(loc.rot,Math.cos(g.yaw||0),Math.sin(g.yaw||0));gl.uniform1f(loc.alpha,alpha);gl.uniform1f(loc.lit,lines?0:1);gl.drawArrays(lines?gl.LINES:gl.TRIANGLES,0,data.length/9);}
function screenPoint(p){const q=M.point(vp,p);return[(q[0]/q[3]*.5+.5)*viewWidth,(-q[1]/q[3]*.5+.5)*viewHeight];}
function labelWorld(l){
 if(l.actor){const a=sim.actors[l.actor];if(!a)return[0,0,0];const p=actorWorld(a);p[1]+=a.id==='AMR'?.5:a.id==='S1'||a.id==='S2'?.38:a.id==='SEER'?2.46:2.22;return p;}
 if(l.palletId){const p=palletPosition(l.palletId);p[1]+=$('showCargo').checked?.80:.22;return p;}
 return l.p.slice();
}
function positionLabels(){const plan=cam.pitch>1.4,level=Number($('floorFilter').value);
 for(const l of labels){let show=true,p=labelWorld(l),text=l.text;
  if(!$('showLabels').checked&&!['dimension','gap'].includes(l.kind))show=false;
  if((l.kind==='dimension'||l.kind==='gap')&&!$('showDimensions').checked)show=false;
  if(l.kind==='rear'&&!$('showLane').checked&&l.id!=='TURN')show=false;
  if(l.id==='TURN'&&!$('showPaths').checked)show=false;
  if(l.rack&&l.floor>=0&&level&&l.floor!==level-1)show=false;
  if(l.actor&&(l.actor==='S1'||l.actor==='S2')&&level&&assets.robots[l.actor][0].floor!==level-1)show=false;
  if(l.palletId&&(!sim.pallets[l.palletId]||!assets.pallets[l.palletId].visible))show=false;
  if(plan&&!level&&l.rack){if(['X3','X4','X5','X6','A','D','REAR0','REAR1','CHARGER'].includes(l.id))show=false;
   if(l.id==='X1')text='D / X3 / X1';if(l.id==='X2')text='A / X5 / X2';if(l.id==='CHG')text='X6 / X4 / XCharger';if(l.id==='REAR2')text='각 단의 공통 후면 통로';}
  l.e.classList.toggle('role1',!continuous()&&l.id===sim.config.x1);l.e.classList.toggle('role2',!continuous()&&l.id===sim.config.x2);
  if(!continuous()&&!plan&&slots[l.id]?.kind==='storage'){if(l.id===sim.config.x1)text=displaySlot(l.id)+' · 역할 X1';else if(l.id===sim.config.x2)text=displaySlot(l.id)+' · 역할 X2';}
  const[x,y]=screenPoint(p);l.screen=[x,y];l.e.textContent=text;
  if(!show||x<-70||x>viewWidth+70||y<46||y>viewHeight-130){l.e.style.display='none';continue;}
  l.e.style.display='block';l.e.style.left=x+'px';l.e.style.top=(y+(plan&&l.actor==='S2'?-12:plan&&l.actor==='S1'?12:0))+'px';
 }
}
function renderSoftware(){
 view();const dpr=canvas.width/viewWidth;ctx2d.setTransform(dpr,0,0,dpr,0,0);ctx2d.clearRect(0,0,viewWidth,viewHeight);const ground=[],objects=[],dir=V.norm(V.sub(eye,cam.target));const key=V.norm([-.5,1,.8]),fill=V.norm([.75,.4,-.55]);
 for(const g of geos){if(!g.visible)continue;let a=g.data,alpha=alphaOf(g),events=['ground','grid','boundary','zone','path'].includes(g.kind)?ground:objects;
 for(let i=0;i<a.length;i+=27){const n=rotateVector([a[i+3],a[i+4],a[i+5]],g.yaw),pts=[i,i+9,i+18].map(j=>V.add(rotateVector([a[j],a[j+1],a[j+2]],g.yaw),g.off));if(V.dot(n,dir)<-.01&&alpha>.9)continue;const s=pts.map(screenPoint);if(s.every(p=>p[0]<0)||s.every(p=>p[0]>viewWidth)||s.every(p=>p[1]<0)||s.every(p=>p[1]>viewHeight))continue;const shade=.66+.24*Math.max(V.dot(n,key),0)+.12*Math.max(V.dot(n,fill),0);const col=[a[i+6],a[i+7],a[i+8]].map(v=>Math.round(clamp(v*shade,0,1)*255));events.push({s,d:V.dot(V.mul(pts.reduce((sum,p)=>V.add(sum,p),[0,0,0]),1/3),dir),c:'rgb('+col.join(',')+')',alpha,layer:g.kind==='ground'?0:g.kind==='zone'?1:2});}
 if(['boundary','dimension','grid','path','clearance','liftguard','envelope'].includes(g.kind)){a=g.ld;for(let i=0;i<a.length;i+=18){const p=V.add(rotateVector([a[i],a[i+1],a[i+2]],g.yaw),g.off),q=V.add(rotateVector([a[i+9],a[i+10],a[i+11]],g.yaw),g.off);events.push({s:[screenPoint(p),screenPoint(q)],d:V.dot(V.mul(V.add(p,q),.5),dir)+.001,c:'rgb('+[a[i+6],a[i+7],a[i+8]].map(v=>Math.round(v*255)).join(',')+')',alpha,line:true,layer:3});}}
 }
 function paint(events,isGround){events.sort(isGround?(a,b)=>a.layer-b.layer||a.d-b.d:(a,b)=>a.d-b.d);for(const f of events){ctx2d.globalAlpha=f.alpha;ctx2d.beginPath();ctx2d.moveTo(...f.s[0]);for(let i=1;i<f.s.length;i++)ctx2d.lineTo(...f.s[i]);if(f.line){ctx2d.strokeStyle=f.c;ctx2d.lineWidth=.65;ctx2d.stroke();}else{ctx2d.closePath();ctx2d.fillStyle=f.c;ctx2d.fill();}}}
 paint(ground,true);paint(objects,false);ctx2d.globalAlpha=1;positionLabels();dirty=false;
}
function render(){if(!webglActive){renderSoftware();return;}view();gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.depthMask(true);
 for(const g of geos)if(g.visible&&alphaOf(g)>=.995)drawGeo(g,1);
 gl.depthMask(false);const ts=geos.filter(g=>g.visible&&alphaOf(g)<.995);ts.sort((a,b)=>Math.hypot(...V.sub(b.off,eye))-Math.hypot(...V.sub(a.off,eye)));for(const g of ts)drawGeo(g,alphaOf(g));gl.depthMask(true);
 for(const g of geos)if(g.visible&&g.ld.length)drawGeo(g,Math.max(alphaOf(g),g.kind==='liftguard'?.35:.15),true);positionLabels();dirty=false;
}
function geoCorners(g){if(!g.localBounds){let mn=[Infinity,Infinity,Infinity],mx=[-Infinity,-Infinity,-Infinity];const a=g.data;for(let i=0;i<a.length;i+=9)for(let j=0;j<3;j++){mn[j]=Math.min(mn[j],a[i+j]);mx[j]=Math.max(mx[j],a[i+j]);}g.localBounds={mn,mx};}const {mn,mx}=g.localBounds,pts=[];if(!Number.isFinite(mn[0]))return pts;for(const x of [mn[0],mx[0]])for(const y of [mn[1],mx[1]])for(const z of [mn[2],mx[2]])pts.push(V.add(rotateVector([x,y,z],g.yaw),g.off));return pts;}
function fitScene(rackOnly=false){
 const dir=V.norm([Math.sin(cam.yaw)*Math.cos(cam.pitch),Math.sin(cam.pitch),Math.cos(cam.yaw)*Math.cos(cam.pitch)]),right=V.norm(V.cross([0,1,0],dir)),up=V.cross(dir,right);
 let mn=[Infinity,Infinity],mx=[-Infinity,-Infinity];
 for(const g of geos){if(!g.visible||!g.data.length||['path','lane','volume','dimension','clearance','envelope','zone'].includes(g.kind)||rackOnly&&!g.rack)continue;for(const p of geoCorners(g)){const vals=[V.dot(p,right),V.dot(p,up)];for(let i=0;i<2;i++){mn[i]=Math.min(mn[i],vals[i]);mx[i]=Math.max(mx[i],vals[i]);}}}
 const w=main.clientWidth,h=main.clientHeight,padX=w<600?30:65,padTop=105,padBottom=155,scale=Math.min((w-padX*2)/(mx[0]-mn[0]),(h-padTop-padBottom)/(mx[1]-mn[1]));
 cam.span=Math.max(1,h/scale);const ref=rackOnly?Rpoint([0,3,0]):[4.5,2,4.5];cam.target=V.add(ref,V.add(V.mul(right,(mx[0]+mn[0])/2-V.dot(ref,right)),V.mul(up,(mx[1]+mn[1])/2-V.dot(ref,up)+(padTop-padBottom)/2/scale)));dirty=true;
}
function setCamera(mode){cameraMode=mode;
 if(mode==='iso'){cam.yaw=.83;cam.pitch=.53;fitScene();}
 if(mode==='top'){cam.yaw=0;cam.pitch=Math.PI/2-.001;fitScene();}
 if(mode==='rack'){cam.yaw=1.10;cam.pitch=.40;fitScene(true);}
 if(mode==='front'){cam.yaw=Math.PI/2;cam.pitch=.008;fitScene(true);}
 if(mode==='rear'){cam.yaw=-Math.PI/2-.22;cam.pitch=.38;fitScene(true);}
 if(mode==='bufferB'||mode==='bufferC'){const z=mode==='bufferB'?cfg.bZ:cfg.cZ;cam.target=[cfg.bufferX-.65,.55,z];cam.yaw=mode==='bufferB'?-.78:-2.3;cam.pitch=.53;cam.span=Math.max(3.2,4.8*main.clientHeight/main.clientWidth);}
 document.querySelectorAll('[data-camera]').forEach(b=>b.classList.toggle('active',b.dataset.camera===mode));dirty=true;
}
function toast(text){$('toast').textContent=text;$('toast').classList.add('on');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>$('toast').classList.remove('on'),3500);}
let pointer=null,pinch=null;const pointers=new Map();
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);pointer={x:e.clientX,y:e.clientY,pan:e.button===2||e.shiftKey};autoRotate=false;canvas.classList.add('drag');});
canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,[e.clientX,e.clientY]);if(pointers.size===2){const[a,b]=[...pointers.values()],d=Math.hypot(a[0]-b[0],a[1]-b[1]);if(pinch)cam.span=clamp(cam.span*pinch/d,.6,40);pinch=d;dirty=true;return;}if(!pointer)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;if(pointer.pan){const dir=V.norm(V.sub(eye,cam.target)),right=V.norm(V.cross([0,1,0],dir)),up=V.cross(dir,right),scale=cam.span/main.clientHeight;cam.target=V.add(cam.target,V.add(V.mul(right,-dx*scale),V.mul(up,dy*scale)));}else{cam.yaw-=dx*.007;cam.pitch=clamp(cam.pitch+dy*.006,.008,Math.PI/2-.001);}pointer.x=e.clientX;pointer.y=e.clientY;dirty=true;});
const release=e=>{pointers.delete(e.pointerId);pointer=null;pinch=null;canvas.classList.remove('drag');};canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
canvas.addEventListener('wheel',e=>{e.preventDefault();cam.span=clamp(cam.span*Math.exp(e.deltaY*.001),.6,40);dirty=true;},{passive:false});
window.addEventListener('resize',()=>{dirty=true;});
let lastFrame=performance.now(),uiTime=0;
function loop(now){
  const dt=Math.min(.12,(now-lastFrame)/1000);
  lastFrame=now;
  if(sim.playing)advanceSimulation(dt*sim.speed);
  if(autoRotate){cam.yaw+=dt*.14;dirty=true;}
  uiTime+=dt;
  if(uiTime>.18){updateUI();uiTime=0;}
  const dpr=Math.min(devicePixelRatio||1,2);
  const targetW=Math.round((main.clientWidth||800)*dpr);
  const targetH=Math.round((main.clientHeight||600)*dpr);
  if(dirty || canvas.width!==targetW || canvas.height!==targetH){
    render();
  }
  requestAnimationFrame(loop);
}

function downloadBlob(blob,name){const a=document.createElement('a'),u=URL.createObjectURL(blob);a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),2000);}
function scenarioSnapshot(){return{time:sim.time,playing:sim.playing,error:sim.error,activity:activityReport(),config:copy(sim.config),counts:copy(sim.counts),homes:copy(sim.homes),inventory:copy(sim.inventory),reservations:copy(sim.reservations),rackOwner:sim.rackOwner,liftOwner:sim.liftOwner,liftY:sim.liftY,pallets:Object.fromEntries(Object.entries(sim.pallets).map(([id,p])=>[id,{...p,world:palletPosition(id),yaw:palletYaw(id)}])),actors:Object.fromEntries(Object.entries(sim.actors).map(([id,a])=>[id,{pos:actorWorld(a),rackLocal:(id==='S1'||id==='S2')?a.pos:null,yaw:actorYaw(a),payload:a.payload,deck:a.deck,forkTop:a.forkTop,count:a.count,job:a.job?{title:a.job.title,key:a.job.key,step:a.job.index,stepTitle:a.job.steps[a.job.index]?.title,done:a.job.done,total:a.job.total,blocked:!!a.job.blocked,waited:a.job.waited||0}:null}]))};}
function configExport(){return{revision:'06',units:'metres',booth:[9,9],axes:'X east, Y up, Z south. Model unit = 1 metre.',source_files:['Industrial_AI_EXPO_Integrated_3D_Viewer_Rev05.html','Pallet_Buffer_RevG1_Scenario_3D_Viewer.html','4Way_Shuttle_Demo_3D_Viewer_Rev04.html','User supplied rack plan/elevation and equipment specification images'],equipment_counts:{shuttle:2,seer_forklift:1,hdx_forklift:1,seer_low_floor_amr:1,lift:1,fixed_buffer:2},nominal_envelopes_mm:{pallet:[1100,1100,150],shuttle:[1135,870,126],seer_forklift:[2767,1180,2235],hdx_ES15_A:[1740,985,1990],seer_amr:[950,650,250],amr_platform:[850,600],amr_stroke:60,shuttle_stroke:40,lift_generic_reference:[3134,2200],buffer_inner:800,buffer_rail_length:1200,buffer_support_EL:280},dimensions:copy(cfg),scenario:copy(sim.config),external_sequence:'A -> SEER -> B -> SEER lifting AMR -> C -> HDX -> D',internal_priority:continuous()?['X6 -> A if available, otherwise D -> A','D -> X6 if A unavailable','Parallel S2 upper demo: X3 -> X1 -> X2 -> X5 -> X3']:['X2 -> A if A empty','D -> X1 if X1 empty','X1 -> X2 if X2 empty'],shuttle_policy:continuous()?'S1 dedicated floor 1: D -> A, X6 overflow; S2 dedicated floors 2/3: X3 -> X1 -> X2 -> X5 -> X3 with a separate pallet. Only S2 uses the lift. Not an optimized concurrent multi-shuttle controller.':'Original: serial shared rear lanes/lift, alternating shuttles', internal_policy_active:continuous()?['X6 -> A or D -> A when A available','D -> X6 if A unavailable','S2 upper separate loop X3 -> X1 -> X2 -> X5 -> X3']:['X2 -> A','D -> X1','X1 -> X2'],initial_pallets:continuous()?[{id:'P01',location:'A'},{id:'P02',location:'C'},{id:'P03',location:'D'},...(sim.config.circulating===4?[{id:'P04',location:'B'}]:[]),{id:'P05',location:'X3',pool:'upper-demo'}]:[{id:'P01',location:sim.config.x2},{id:'P02',location:'D'},...(sim.config.third?[{id:'P03',location:'B'}]:[])],source_constraints:['B and C fixed; only the pallet is transferred','B AMR enters south, exits south reversing','C AMR enters north, exits north reversing','Both forklifts approach B/C from west','AMR 180-degree turn only after pallet fully clears buffer','No pallet teleportation at loop boundaries'],not_verified:['Rack bay pitch / left-right gaps / rack post height / datum of first running surface','Exhibition-built lift dimensions versus generic datasheet','Charger case thickness and bracket projection','Actual forklift steering and turning radius, speed and safe swept paths','Exact SEER models, fork spread and HDX lower-leg envelope','Actual pallet fork openings and AMR contact surface','Structural fixing, floor load, safe public access and exhibition-approved height'],notes:'All source-equipment geometry uses a common metric scale. Concept model, not fabrication approval CAD or real safety/clearance/throughput validation.'};}
function makeGLB(){
 const target=geos.filter(g=>g.visible&&g.data.length&&!['ground','grid','lane','path','dimension','volume','clearance','envelope','boundary','zone','liftguard'].includes(g.kind));let chunks=[],views=[],accessors=[],meshes=[],nodes=[],byteLen=0;
 function addArray(a){const bytes=new Uint8Array(a.buffer),vi=views.length;views.push({buffer:0,byteOffset:byteLen,byteLength:bytes.byteLength,target:34962});chunks.push(bytes);byteLen+=bytes.byteLength;return vi;}
 for(const g of target){const count=g.data.length/9,pos=new Float32Array(count*3),norm=new Float32Array(count*3),cols=new Float32Array(count*3),mn=[Infinity,Infinity,Infinity],mx=[-Infinity,-Infinity,-Infinity];for(let i=0;i<count;i++)for(let j=0;j<3;j++){pos[i*3+j]=g.data[i*9+j];norm[i*3+j]=g.data[i*9+3+j];cols[i*3+j]=g.data[i*9+6+j];mn[j]=Math.min(mn[j],pos[i*3+j]);mx[j]=Math.max(mx[j],pos[i*3+j]);}
 const pi=accessors.length;accessors.push({bufferView:addArray(pos),componentType:5126,count,type:'VEC3',min:mn,max:mx});const ni=accessors.length;accessors.push({bufferView:addArray(norm),componentType:5126,count,type:'VEC3'});const ci=accessors.length;accessors.push({bufferView:addArray(cols),componentType:5126,count,type:'VEC3'});meshes.push({name:g.name,primitives:[{attributes:{POSITION:pi,NORMAL:ni,COLOR_0:ci},mode:4,material:0}]});nodes.push({name:g.name,mesh:meshes.length-1,translation:g.off.slice(),rotation:[0,Math.sin(g.yaw/2),0,Math.cos(g.yaw/2)],extras:{category:g.kind,source_based_simplified_geometry:true}});}
 const json={asset:{version:'2.0',generator:'NOVATEK Rev06 integrated source-based concept viewer'},scene:0,scenes:[{name:'Industrial AI EXPO 9x9 demo',nodes:nodes.map((_,i)=>i)}],nodes,meshes,materials:[{name:'Source-based vertex colours',doubleSided:true,pbrMetallicRoughness:{baseColorFactor:[1,1,1,1],metallicFactor:.12,roughnessFactor:.65}}],buffers:[{byteLength:byteLen}],bufferViews:views,accessors,extras:configExport()};const enc=new TextEncoder().encode(JSON.stringify(json)),jl=Math.ceil(enc.length/4)*4,bl=Math.ceil(byteLen/4)*4,total=12+8+jl+8+bl,out=new Uint8Array(total),dv=new DataView(out.buffer);dv.setUint32(0,0x46546c67,true);dv.setUint32(4,2,true);dv.setUint32(8,total,true);dv.setUint32(12,jl,true);dv.setUint32(16,0x4e4f534a,true);out.fill(32,20,20+jl);out.set(enc,20);let off=20+jl;dv.setUint32(off,bl,true);dv.setUint32(off+4,0x004e4942,true);off+=8;for(const a of chunks){out.set(a,off);off+=a.length;}return out;
}
function savePNG(){render();const c=document.createElement('canvas'),dpr=canvas.width/viewWidth;c.width=canvas.width;c.height=canvas.height;const ctx=c.getContext('2d');ctx.fillStyle='#eef3f5';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(canvas,0,0);ctx.scale(dpr,dpr);ctx.font='10px -apple-system, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
 for(const l of labels){if(l.e.style.display==='none'||!l.screen)continue;const[x,y]=l.screen,txt=l.e.textContent,w=ctx.measureText(txt).width+12;ctx.fillStyle=l.kind==='robot'||l.kind==='palletid'?'#234b59':'#ffffff';ctx.fillRect(x-w/2,y-10,w,20);ctx.fillStyle=l.kind==='robot'||l.kind==='palletid'?'#ffffff':'#325565';ctx.fillText(txt,x,y);}
 ctx.font='bold 15px -apple-system,sans-serif';ctx.fillStyle='#294b58';ctx.textAlign='left';ctx.fillText('NOVATEK · INTEGRATED DEMO Rev.06 · 9000 × 9000 mm',20,24);ctx.font='10px -apple-system,sans-serif';ctx.fillText('Source-based concept geometry / provisional layout / not a safety or fabrication approval model',20,viewHeight-18);c.toBlob(b=>downloadBlob(b,'Industrial_AI_EXPO_Rev06_View.png'),'image/png');
}
function bindUI(){
 document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('.pane').forEach(p=>p.classList.toggle('active',p.id==='pane-'+b.dataset.tab));});
 document.querySelectorAll('[data-camera]').forEach(b=>b.onclick=()=>setCamera(b.dataset.camera));
 for(const id of ['showPallets','showCargo','showLabels','showPaths','showLane','ghostFrame','showVolumes','showDimensions','showEnvelopes','showGrid','floorFilter'])$(id).onchange=()=>{updateVisibility();dirty=true;};
 for(const id of ['storageOne','storageTwo','thirdPallet','scenarioMode','circulatingCount'])$(id).onchange=resetSimulation;
 $('autoExternal').onchange=e=>{sim.config.external=e.target.checked;log('SETTING','외부 자동 순환 '+(e.target.checked?'ON':'OFF')+' · 진행 중 작업은 완료');};
 $('skip90').onclick=()=>{sim.playing=false;sim.stopAt=null;advanceSimulation(90,true);updateUI();render();};$('speed').onchange=e=>sim.speed=Number(e.target.value);$('playBtn').onclick=playPause;$('resetBtn').onclick=resetSimulation;
 $('nextJobBtn').onclick=()=>{if(sim.error)return;sim.stopAt=internalCount()+1;sim.playing=true;updateUI();};
 $('resetViewBtn').onclick=()=>setCamera('iso');$('rotateBtn').onclick=()=>{autoRotate=!autoRotate;$('rotateBtn').classList.toggle('active',autoRotate);};$('zoomIn').onclick=()=>{cam.span*=.82;dirty=true;};$('zoomOut').onclick=()=>{cam.span*=1.22;dirty=true;};$('fullBtn').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen();else main.requestFullscreen?.();};
 $('sourceBtn').onclick=$('sourceBtn2').onclick=()=>$('sourceModal').classList.add('open');$('helpBtn').onclick=()=>$('helpModal').classList.add('open');document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).classList.remove('open'));document.querySelectorAll('.modal').forEach(m=>m.onclick=e=>{if(e.target===m)m.classList.remove('open');});
 $('closeDetail').onclick=()=>{selection=null;$('detail').style.display='none';};$('focusSelected').onclick=()=>{if(!selection)return;let p=sim.actors[selection]?actorWorld(sim.actors[selection]):sim.pallets[selection]?palletPosition(selection):slots[selection].world;cam.target=[p[0],p[1]+.35,p[2]];cam.span=selection==='LIFT'?8:3.8;cam.yaw=.9;cam.pitch=.47;dirty=true;};
 $('menuBtn').onclick=()=>$('sidebar').classList.toggle('open');$('applyLayout').onclick=applyLayout;$('saveSettings').onclick=()=>downloadBlob(new Blob([JSON.stringify(configExport(),null,2)],{type:'application/json'}),'Industrial_AI_EXPO_Rev06_Config.json');$('savePng').onclick=savePNG;
 $('exportGLB').onclick=()=>{try{downloadBlob(new Blob([makeGLB()],{type:'model/gltf-binary'}),'Industrial_AI_EXPO_Integrated_Rev06.glb');}catch(e){toast(e.message);}};
 $('saveLog').onclick=()=>{const q=x=>'"'+String(x??'').replaceAll('"','""')+'"',rows=[['연출 시간(s)','이벤트','내용','팔레트 ID'],...sim.logs.map(l=>[l.time,l.event,l.detail,l.palletId])];downloadBlob(new Blob(['\ufeff'+rows.map(r=>r.map(q).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}),'Industrial_AI_EXPO_Rev06_Events.csv');};
 window.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;if(e.code==='Space'){e.preventDefault();playPause();}if(e.key.toLowerCase()==='r')setCamera('iso');if(e.key==='1')setCamera('iso');if(e.key==='2')setCamera('top');if(e.key==='Escape'){document.querySelectorAll('.modal').forEach(m=>m.classList.remove('open'));$('detail').style.display='none';selection=null;}});
}
// Rev.06: operational loop and upper-store demonstration use distinct pallet pools.
// All durations and geometry are inherited conceptual values, not measured cycle times.
const continuous=()=>sim.config.mode==='continuous';
function gate(title,test,onReady){const s=step(.05,title,{},onReady);s.test=test;return s;}
function metricsBlank(){return {loaded:0,empty:0,handling:0,waiting:0};}
function account(a,kind,seconds){if(!a.metrics)a.metrics=metricsBlank();a.metrics[kind]+=seconds;a.activity=kind;}
function activityReport(){
 const result={};for(const[id,a]of Object.entries(sim.actors)){
  const m=a.metrics||metricsBlank(),total=Object.values(m).reduce((s,n)=>s+n,0),work=m.loaded+m.empty+m.handling;
  result[id]={...m,total,working:work,workingPercent:total?100*work/total:0,activity:a.activity||'waiting',waitReason:a.waitReason||'',count:a.count};
 }return result;
}
function dispatchSeer(){
 if(!continuous())return dispatchSeerLegacy();
 const a=sim.actors.SEER;if(a.job||!ready('A'))return false;
 reserve(['A'],a.id);
 const A=worldStatic('A'),B=worldStatic('B'),stage=5.3,dockA=A[0]+palletReach.SEER,dockB=B[0]-palletReach.SEER,m=planMover(a);
 m.act(.6,'A 예약 · 포크 높이 정렬',{forkTop:A[1]+.110});
 if(Math.abs(a.pos[2]-A[2])>.001){m.turn(-Math.PI/2,'A 접근 · 남향 자세 정렬 †');m.move([stage,0,A[2]],'A 반출점으로 빈 차 복귀',.55);}
 m.turn(-Math.PI,'A 반출 방향 정렬 †');
 m.move([dockA,0,A[2]],'A 팔레트 포크 삽입',.34);
 m.act(1.2,'A 팔레트 접촉',{forkTop:A[1]+.125},null,()=>pick('A',a));
 m.act(1.8,'A 팔레트 상승',{forkTop:A[1]+.185});
 m.move([stage,0,A[2]],'A에서 동측 후진 · 다음 팔레트 공간 확보',.5);
 m.act(.15,'A 인계 구역 해제',{},null,()=>unlock('A',a.id));
 m.turn(-Math.PI/2,'B 이송 방향 정렬 †');m.move([stage,0,B[2]],'B 외측 인계 대기점까지 적재 이송',.55);m.turn(0,'B 서측 포킹 방향 정렬 †');
 // It is permissible to fetch from A before B is empty. Hold OUTSIDE the interface.
 m.steps.push(gate('B 비움·AMR 이탈 대기 (작업률 제외)',()=>empty('B'),()=>reserve(['B'],a.id)));
 m.act(1.6,'B 가이드 상부 · 팔레트 밑면 EL.410',{forkTop:.535});
 m.move([dockB,0,B[2]],'B 서측 접근 · 팔레트 중심 정렬',.34);
 m.act(3,'B 팔레트 안착 · EL.280',{forkTop:.405},null,()=>put('B',a));
 m.act(1.5,'SEER 포크 하강·지지 분리',{forkTop:.395});
 m.move([stage,0,B[2]],'B에서 서측 후진 · AMR 인계 허용',.4);
 m.act(.15,'B 인계 구역 해제',{},null,()=>unlock('B',a.id));
 // Return is a necessary next-job move, not a decorative idle patrol.
 m.turn(-Math.PI/2,'다음 A 반출 준비 · 자세 정렬 †');m.move([stage,0,A[2]],'다음 A 픽업점으로 빈 차 복귀',.55);m.turn(-Math.PI,'다음 A 포킹 방향 선행 정렬 †');
 setJob(a,'A → B · 다음 반출 선행 준비','seer',m.steps);return true;
}
function dispatchHdx(){
 if(!continuous())return dispatchHdxLegacy();
 const a=sim.actors.HDX;if(a.job||!ready('C'))return false;reserve(['C'],a.id);
 const Cp=worldStatic('C'),D=worldStatic('D'),stage=5.8,dockC=Cp[0]-palletReach.HDX,dockD=D[0]+palletReach.HDX,m=planMover(a);
 m.act(.6,'C 예약 · 포크 EL.395',{forkTop:.395});
 m.move([dockC,0,Cp[2]],'C 서측 포크 삽입',.35);
 m.act(1.5,'C 팔레트 데크 밑면 접촉',{forkTop:.405},null,()=>pick('C',a));
 m.act(3,'C 가이드 상부로 팔레트 상승 · EL.410',{forkTop:.535});
 m.move([stage,0,Cp[2]],'C에서 서측 후진 · 다음 AMR 하차 공간 확보',.4);
 m.act(.15,'C 인계 구역 해제',{},null,()=>unlock('C',a.id));
 // Releasing C early lets the AMR work even if the rack inlet has not cleared yet.
 m.steps.push(gate('D 비움·셔틀 이탈 대기 (작업률 제외)',()=>empty('D'),()=>reserve(['D'],a.id)));
 m.act(1.8,'D 안착면 위로 팔레트 상승',{forkTop:D[1]+.185});
 m.turn(Math.PI/2,'D 이송 · 북향 자세 정렬 †');m.move([stage,0,D[2]],'D 진입점까지 적재 이송',.5);m.turn(Math.PI,'D 전면 포킹 방향 정렬 †');
 m.move([dockD,0,D[2]],'D 전면 팔레트 투입',.35);
 m.act(2.2,'D 팔레트 안착',{forkTop:D[1]+.125},null,()=>put('D',a));
 m.act(1.2,'HDX 포크 하강·지지 분리',{forkTop:D[1]+.110});
 m.move([stage,0,D[2]],'D에서 동측 후진 · 셔틀 인계 허용',.45);
 m.act(.15,'D 인계 구역 해제',{},null,()=>unlock('D',a.id));
 m.turn(Math.PI/2,'다음 C 픽업 준비 · 자세 정렬 †');m.move([stage,0,Cp[2]],'다음 C 픽업점으로 빈 차 복귀',.55);m.turn(0,'C 서측 포킹 방향 선행 정렬 †');
 m.act(.8,'다음 C 픽업 높이 정렬',{forkTop:.395});
 setJob(a,'C → D · 다음 입고 선행 준비','hdx',m.steps);return true;
}
function dispatchShuttle(a,src,dst,key){
 if(!continuous())return dispatchShuttleLegacy(a,src,dst,key);
 if(a.job||!ready(src)||!empty(dst))return false;
 const S=slots[src],D=slots[dst];
 if(a.id==='S1'&&(S.floor!==0||D.floor!==0))throw Error('S1은 1단 운행 전용');
 if(a.id==='S2'&&(S.floor<1||D.floor<1))throw Error('S2는 2·3단 운행 전용');
 const needsLift=Math.abs(a.pos[1]-S.y)>.001||S.floor!==D.floor;
 if(needsLift&&sim.liftOwner&&sim.liftOwner!==a.id)return false;
 reserve([src,dst],a.id);if(needsLift)sim.liftOwner=a.id;
 const steps=[];let p=a.pos.slice(),liftY=sim.liftY,loaded=false;
 const add=(duration,title,changes={},begin=null,end=null)=>steps.push(step(duration,title,changes,begin,end));
 const move=(to,title,speed=null)=>{const distance=Math.hypot(...V.sub(to,p));if(distance>.00001)add(Math.max(.18,distance/(speed||(loaded?1:1.5))),title,{pos:to.slice()});p=to.slice();};
 const rear=()=>move([p[0],p[1],dims.zr],'동일 층 후면 통로로 직진 이탈',.55);
 function level(y){
  if(Math.abs(p[1]-y)<.00001)return;
  rear();move([dims.xc[1],p[1],dims.zr],'상층 리프트 후면 정렬');
  if(Math.abs(liftY-p[1])>.00001){add(Math.abs(liftY-p[1])/.6,'리프트 호출 · 상층 전용',{liftY:p[1]});liftY=p[1];}
  move([dims.xc[1],p[1],dims.zl],'S2 리프트 탑승',.5);add(1,'리프트 탑승 확인');
  add(Math.abs(y-p[1])/.6,'상층 리프트 '+(y>p[1]?'상승':'하강'),{pos:[p[0],y,p[2]],liftY:y});p=[p[0],y,p[2]];liftY=y;
  add(.7,'상층 레일 정렬 확인');rear();
 }
 const approach=s=>{rear();level(s.y);move([s.x,s.y,dims.zr],s.id+' 후면 접근');move([s.x,s.y,s.z],s.id+' 팔레트 하부 진입',.5);};
 approach(S);add(1.5,src+' 팔레트 접촉',{deck:.03},null,()=>pick(src,a));loaded=true;
 add(1.5,'셔틀 팔레트 리프팅 40 mm',{deck:.04});rear();add(.1,src+' 인계면 해제',{},null,()=>unlock(src,a.id));
 approach(D);add(1.5,dst+' 팔레트 안착',{deck:.03},null,()=>put(dst,a));loaded=false;
 add(1.5,'셔틀 리프팅 하강',{deck:0});rear();add(.1,dst+' 인계면 해제',{},null,()=>unlock(dst,a.id));
 // Stay on this vehicle's exclusive-floor rear lane. No gratuitous home/lift round trip.
 setJob(a,(a.id==='S1'?'1단 순환 · ':'상층 별도 시연 · ')+src+' → '+dst,key,steps);return true;
}
function schedule(){
 if(!continuous())return scheduleLegacy();
 const s1=sim.actors.S1,s2=sim.actors.S2;
 if(!s1.job){
  if(empty('A')&&ready('X6'))dispatchShuttle(s1,'X6','A','out');
  else if(empty('A')&&ready('D'))dispatchShuttle(s1,'D','A','out');
  else if(ready('D')&&empty('X6'))dispatchShuttle(s1,'D','X6','in');
 }
 if(!s2.job){const route=['X3','X1','X2','X5'];const p=sim.pallets.P05,idx=route.indexOf(p?.location);if(idx>=0)dispatchShuttle(s2,route[idx],route[(idx+1)%route.length],'vertical');}
 if(sim.config.external){dispatchHdx();dispatchAmr();dispatchSeer();}
}
function completed(a){
 if(!continuous())return completedLegacy(a);
 const j=a.job;if(!j)return;
 log('FINISH',a.id+' · '+j.title);a.count++;sim.counts[j.key]=(sim.counts[j.key]||0)+1;a.job=null;a.waitReason='';
 if(sim.liftOwner===a.id)sim.liftOwner=null;
 for(const[id,owner]of Object.entries(sim.reservations))if(owner===a.id)delete sim.reservations[id];
 if(sim.stopAt!=null&&internalCount()>=sim.stopAt){sim.playing=false;sim.stopAt=null;}
}
function tickActor(a,dt){
 let remain=dt,guard=0;
 while(remain>1e-9&&guard++<60){
  if(!a.job){account(a,'waiting',remain);a.waitReason=idleReason(a);break;}
  const j=a.job,s=j.steps[j.index];
  if(!j.started&&s.test&&!s.test()){
   j.blocked=true;a.waitReason=s.title;account(a,'waiting',remain);j.waited=(j.waited||0)+remain;break;
  }
  j.blocked=false;a.waitReason='';
  if(!j.started){j.from={pos:a.pos.slice(),yaw:a.yaw,deck:a.deck,forkTop:a.forkTop,liftY:sim.liftY};if(s.begin)s.begin();j.started=true;}
  const used=Math.min(remain,s.duration-j.elapsed),kind=s.changes.pos||s.changes.yaw!==undefined?(a.payload?'loaded':'empty'):'handling';account(a,kind,used);
  j.elapsed+=used;j.done+=used;remain-=used;const u=clamp(j.elapsed/s.duration,0,1),t=u*u*(3-2*u);
  for(const[k,v]of Object.entries(s.changes)){const value=Array.isArray(v)?V.lerp(j.from[k],v,t):j.from[k]+(v-j.from[k])*t;if(k==='liftY')sim.liftY=value;else a[k]=value;}
  if(j.elapsed>=s.duration-1e-8){for(const[k,v]of Object.entries(s.changes)){if(k==='liftY')sim.liftY=v;else a[k]=Array.isArray(v)?v.slice():v;}if(s.end)s.end();j.index++;j.elapsed=0;j.started=false;if(j.index>=j.steps.length)completed(a);}
 }
}
function idleReason(a){
 if(a.id==='SEER')return !sim.config.external?'자동 순환 OFF':!sim.inventory.A?'A 팔레트 공급 대기':sim.reservations.A?'A 셔틀 이탈 대기':!continuous()&&!empty('B')?'B 비움 대기':'다음 작업 배차';
 if(a.id==='HDX')return !sim.config.external?'자동 순환 OFF':!sim.inventory.C?'C 팔레트 공급 대기':sim.reservations.C?'C AMR 이탈 대기':!continuous()&&!empty('D')?'D 비움 대기':'다음 작업 배차';
 if(a.id==='AMR')return !sim.config.external?'자동 순환 OFF':!sim.inventory.B?'B 팔레트 공급 대기':sim.reservations.B?'B SEER 이탈 대기':!empty('C')?'C 비움·HDX 이탈 대기':'다음 작업 배차';
 return continuous()?(a.id==='S1'?'D 재고 / A·X6 인계 가능 상태 대기':'상층 시연 배차'):'후면 통로·리프트 배차 대기';
}
function resetSimulation(){
 resetSimulationLegacy();
 sim.config.mode=$('scenarioMode').value;sim.config.circulating=Number($('circulatingCount').value);sim.counts.vertical=0;
 for(const a of Object.values(sim.actors)){a.metrics=metricsBlank();a.activity='waiting';a.waitReason='';}
 if(continuous()){
  sim.config.x1='X1';sim.config.x2='X2';sim.config.third=false;
  sim.logs=[];sim.inventory={};for(const id of Object.keys(slots))if(id!=='LIFT')sim.inventory[id]=null;
  sim.pallets={};const seed=[['P01','A'],['P02','C'],['P03','D']];if(sim.config.circulating===4)seed.push(['P04','B']);seed.push(['P05','X3']);
  for(const[id,loc]of seed){sim.pallets[id]={id,location:loc,yaw:0,yawOffset:0};sim.inventory[loc]=id;}
  sim.homes={S1:'X6',S2:'X3'};sim.actors.S1.pos=[slots.X6.x,slots.X6.y,slots.X6.z];sim.actors.S2.pos=[slots.X3.x,slots.X3.y,slots.X3.z];
  sim.liftY=trackY[1];sim.liftOwner=null;sim.rackOwner=null;
  log('RESET','연속 운전 · 순환 '+sim.config.circulating+'개 + 상층 별도 P05 1개 · A/C/D'+(sim.config.circulating===4?'/B':'')+' 선배치');
  log('POLICY','S1 1단 D→A 우선, A 점유 시 X6 대기 적치 / S2 2·3단 별도 시연');
 }
 syncModeUI();syncGeometry();updateUI();dirty=true;
}
function syncModeUI(){
 const fast=continuous();$('legacyControls').style.display=fast?'none':'';$('fastControls').style.display=fast?'':'none';
 $('initialNote').innerHTML=fast?'운영 팔레트 <b>'+sim.config.circulating+'개</b>: A · C · D'+(sim.config.circulating===4?' · B':'')+'<br>상층 시연 팔레트 <b>P05 1개</b>: X3<br>상층 팔레트는 운영 순환과 분리됩니다.':'기존 조건 그대로: X2 · D 각 1개'+(sim.config.third?' + B 1개':'')+'. 보관·이적을 모든 팔레트가 경유합니다.';
 $('modeNote').textContent=fast?'추가 설비 없이 X6를 대기 적치 칸으로 사용합니다. 1단 운행과 상층 승강이 서로 기다리지 않습니다.':'기존 방식: X2→A / D→X1 / X1→X2. 두 셔틀이 모든 층의 후면 통로·리프트를 교대로 점유합니다.';
 document.querySelector('.flow').innerHTML=fast?'<span class="node" data-flow="A">A</span><span>→ SEER →</span><span class="node" data-flow="B">B</span><span>→ AMR →</span><span class="node" data-flow="C">C</span><span>→ HDX →</span><span class="node" data-flow="D">D</span><span>→ S1 → A</span><span class="caption">A 점유 시 X6 대기 적치 · S2 상층 별도 시연</span>':'<span class="node">A</span><span>→ SEER → B → AMR → C → HDX → D → X1 → X2 → A</span><span class="caption">기존 전체 보관 경유</span>';
}
function updateUI(){
 updateUILegacy();if(!sim.actors.S1)return;
 const pBtn=$('playBtn'); if(pBtn){ const pTxt=$('txtBtnStart')||pBtn; pTxt.textContent=sim.playing?'중지':'시작'; pBtn.classList.toggle('btn-danger', sim.playing); pBtn.classList.toggle('btn-primary', !sim.playing); }
 const m=activityReport(),names={loaded:'적재 이송',empty:'빈 차 복귀·정렬',handling:'포크·인계 동작',waiting:'대기'};
 const pc=id=>Math.round(m[id].workingPercent);
 $('seerUtil').textContent=sim.time?pc('SEER')+'%':'—';$('hdxUtil').textContent=sim.time?pc('HDX')+'%':'—';
 $('throughputCount').textContent=sim.counts.hdx+' 회';
 $('liveActors').innerHTML=Object.entries(AINFO).map(([id,inf])=>'<div class="liveitem '+(m[id].activity==='waiting'?'wait':'run')+'"><i></i><b>'+inf.name+'</b><span>'+names[m[id].activity]+'</span></div>').join('');
 for(const[id,a]of Object.entries(sim.actors)){
  const el=$('actor-'+id),r=m[id];el.classList.toggle('busy',r.activity!=='waiting');
  if(r.activity==='waiting')el.querySelector('small').textContent=a.waitReason||idleReason(a);
  let bar=el.querySelector('.utilbar'),txt=el.querySelector('.utiltext');if(!bar){bar=document.createElement('div');bar.className='utilbar';txt=document.createElement('div');txt.className='utiltext';el.children[1].append(bar,txt);}
  bar.innerHTML=['loaded','handling','empty','waiting'].map(k=>'<i class="'+k+'" style="width:'+(r.total?100*r[k]/r.total:0)+'%"></i>').join('');
  txt.textContent=(sim.time?Math.round(r.workingPercent)+'%':'—')+' 연출 작업률 · 대기 '+formatTime(r.waiting);
 }
 if(continuous()){
  const rules=[['A 우선 보충 · D / X6 → A','out'],['A 점유 시 D → X6','in'],['S2 상층 순환 · X3 → X1 → X2 → X5','vertical']];
  rules.forEach(([title,key],i)=>{const job=Object.values(sim.actors).find(a=>a.job?.key===key);$('rule'+i).querySelector('b').textContent=title;$('rule'+i).classList.toggle('busy',!!job);$('rule'+i).querySelector('.count').textContent=sim.counts[key]+'회';$('ruleState'+i).textContent=job?job.id+' · '+job.job.title:i===0?(empty('A')?'D / X6 공급 대기':'A 비움·SEER 이탈 대기'):i===1?'A 반출과 D 비움 상태에 따라 실행':'상층 별도 팔레트 P05';});
  $('parkingInfo').textContent='S1: 1단 전용 / S2: 2·3단 및 리프트. 전용층의 후면 통로에서 다음 작업을 이어갑니다.';
  const rows=[['A','출고 A'],['B','버퍼 B'],['C','버퍼 C'],['D','입고 D'],['X6','대기 적치 X6']];
  $('inventoryRows').innerHTML=rows.map(([id,name])=>'<tr><th>'+name+'</th><td class="'+(sim.inventory[id]?'full':'wait')+'">'+(sim.inventory[id]||'—')+'</td><td>'+(sim.reservations[id]?sim.reservations[id]+' 예약':'')+'</td></tr>').join('')+'<tr><th>상층 전용 P05</th><td colspan="2">'+sim.pallets.P05.location.replace('@','')+'</td></tr>';
 }else{
  ['X2 → A','D → X1','X1 → X2'].forEach((t,i)=>$('rule'+i).querySelector('b').textContent=t);
 }
}

window.viewer={getConfig:configExport,getScenario:scenarioSnapshot,getActivity:activityReport,getLog:()=>copy(sim.logs),getCamera:()=>copy(cam),setCamera,render,makeGLB,resetSimulation,playPause,assertScenario,boundaryReport,selectItem,
 advance:sec=>{sim.stopAt=null;advanceSimulation(sec,true);updateUI();render();return scenarioSnapshot();},
 setScenario:conf=>{const s={...sim.config,...conf};if(!slots[s.x1]||!slots[s.x2]||slots[s.x1].kind!=='storage'||slots[s.x2].kind!=='storage'||s.x1===s.x2)throw Error('Two different storage locations required');$('storageOne').value=s.x1;$('storageTwo').value=s.x2;$('thirdPallet').checked=s.third;$('autoExternal').checked=s.external;if(s.mode)$('scenarioMode').value=s.mode;if(s.circulating)$('circulatingCount').value=s.circulating;resetSimulation();return scenarioSnapshot();},
 testRun:sec=>{let outCount=0,firstOutside=null,minPair=Infinity;for(let i=0;i<Math.ceil(sec/.2);i++){advanceSimulation(Math.min(.2,sec-i*.2),true);const b=boundaryReport();if(b.outside.length){outCount++;if(!firstOutside)firstOutside={time:sim.time,report:b};}if(sim.error)break;}updateUI();render();return{state:scenarioSnapshot(),boundarySamplesOutside:outCount,firstOutside,invariants:assertScenario()};},
 getGeometryStats:()=>({groups:geos.length,triangles:geos.reduce((n,g)=>n+g.data.length/27,0),renderer:webglActive?'WebGL':'Canvas fallback'}),
 getLayout:()=>({cfg:copy(cfg),slots:copy(slots),dims:copy(dims)})};
initUI();bindUI();buildAll();setCamera('iso');updateUI();requestAnimationFrame(loop);

window.addEventListener('resize', ()=>{ dirty=true; });
window.addEventListener('load', ()=>{ dirty=true; });


// Extra UI Handlers for Dark Theme UI
document.addEventListener('DOMContentLoaded', () => {
  // Collapsible 3D display panel toggle
  const toggleBtn = document.getElementById('toggleDisplayPaneBtn');
  const pane = document.getElementById('floatingDisplayPane');
  if (toggleBtn && pane) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isCollapsed = pane.classList.toggle('collapsed');
      toggleBtn.textContent = isCollapsed ? '펼치기' : '접기';
    });
  }

  // Play / Stop button handler
  const playBtn = document.getElementById('playBtn');
  if (playBtn) {
    playBtn.addEventListener('click', () => {
      if (window.viewer && window.viewer.playPause) {
        window.viewer.playPause();
      }
    });
  }

  // Reset button handler
  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (window.viewer && window.viewer.resetSimulation) {
        window.viewer.resetSimulation();
      }
    });
  }
});
