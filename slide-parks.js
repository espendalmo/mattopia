import {box,rounded,tube,dome,beam,worldSign,pointOnSite,visitor} from './scenery.js';

const parks={
  riverSlides:{
    ground:'#d6cbb2',frame:'#8da6ad',shell:'#268eab',trim:'#f6d984',pool:'#62bfd6',
    course:[[2.95,6.2,-2.95],[1.65,5.8,-2.74],[-.75,5.0,-2.44],[-2.98,4.05,-1.76],
      [-3.5,3.17,-.23],[-2.52,2.52,1.17],[-.65,1.73,1.36],[1.22,1.17,1.53],[2.74,.65,2.66]],
  },
  mangoSlides:{
    ground:'#e2c18b',frame:'#b48868',shell:'#e5788b',trim:'#ffd078',pool:'#52c0bb',
    course:[[-2.79,7.12,-2.69],[-.34,6.44,-2.99],[2.11,5.5,-2.37],[3.04,4.72,-.96],
      [2.44,3.72,.61],[.6,2.99,.82],[-1.29,2.38,.08],[-1.66,1.58,1.48],[-.53,.64,3.06]],
  },
  dustSlides:{
    ground:'#ada7bd',frame:'#8f82ad',shell:'#7c8bcb',trim:'#9bf1da',pool:'#bd9cbb',
    course:[[.18,7.34,-2.81],[2.62,6.43,-2.16],[3.44,5.41,-.49],[2.84,4.54,1.36],
      [.86,3.79,1.91],[-1.28,3.1,1.04],[-2.73,2.36,-.28],[-3.11,1.74,1.15],[-1.94,.68,3.03]],
  },
};

const catmull=(a,b,c,d,t)=>.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);
function coursePoints(course) {
  return course.slice(0,-1).flatMap((start,i)=>Array.from({length:5},(_,j)=>
    start.map((value,axis)=>catmull(course[Math.max(0,i-1)][axis],value,course[i+1][axis],
      course[Math.min(i+2,course.length-1)][axis],j/5)))).concat([course.at(-1)]);
}

function trough(points,{shell,trim,pool}) {
  const edges=points.map(([x,y,z],i)=>{
    const [ax,,az]=points[Math.max(0,i-1)],[bx,,bz]=points[Math.min(points.length-1,i+1)];
    const n=Math.hypot(bx-ax,bz-az);
    const nx=(bz-az)/n,nz=(ax-bx)/n;
    return [[-.63,.43],[-.48,.16],[-.29,0],[.29,0],[.48,.16],[.63,.43]]
      .map(([w,h])=>[x+nx*w,y+h,z+nz*w]);
  });
  return edges.slice(1).flatMap((after,i)=>{
    const before=edges[i];
    const shellParts=before.slice(0,-1).flatMap((point,j)=>{
      const outline=[point,after[j],after[j+1],before[j+1]];
      const color=j===2?pool:shell;
      const surface={shape:'terrain',outline,x:point[0],y:point[1],z:point[2],h:.03,color};
      return [surface,{...surface,color:shell,outline:[...outline].reverse().map(([x,y,z])=>[x,y-.035,z])}];
    });
    return [...shellParts,...[0,5].map(j=>beam(before[j],after[j],.12,trim))];
  });
}

function poolTiles(x,z,color) {
  return [-1,1].flatMap(side=>Array.from({length:6},(_,i)=>
    box(x+(i-2.5)*.47,z+side*.91,.27,.14,.028,i%2?'#f9e8c3':color,.481)));
}

export function slidePark(kind) {
  const park=parks[kind];
  if (!park) return null;
  const lunar=kind==='dustSlides',island=kind==='mangoSlides';
  const [x,h,z]=park.course[0],[endX,,endZ]=park.course.at(-1);
  const frame=park.frame,trim=park.trim;
  const podium=rounded(0,0,10.55,9.7,.29,park.ground,.04);
  const ground=[
    {...box(0,0,10.31,9.46,1.32,park.ground,-1.25),support:true},podium,
    rounded(endX,endZ,3.82,2.35,.19,lunar?'#786b91':'#f1dfb7',.32),
    rounded(endX,endZ,3.41,1.97,.075,park.pool,.513),
  ];
  const structure=[
    ...[-1,1].flatMap(side=>[-1,1].flatMap(depth=>[
      tube(x+.83*side,z+.73*depth,.25,.25,h-.47,frame,.33),
      beam([x+.83*side,.54,z+.73*depth],[x+.83*side,h-.68,z-.73*depth],.10,frame),
    ])),
    ...Array.from({length:19},(_,i)=>box(x,z+.84,.84,.15,.085,trim,.58+i*(h-.83)/19)),
    rounded(x,z,2.13,1.86,.24,trim,h-.25),
    ...park.course.slice(1,-2).filter((_,i)=>i%2===0).map(([a,b,c])=>tube(a,c,.23,.23,b-.4,frame,.34)),
    ...trough(coursePoints(park.course),park),
  ];
  const roof=lunar?[
    tube(x,z,2.83,2.66,.16,trim,h+.82),dome(x,z,2.73,2.57,.9,'#a1afd4',h+.96),
    tube(x,z,.12,.12,.79,frame,h+1.49),dome(x,z,.36,.36,.28,trim,h+2.19),
  ]:island?[
    dome(x,z,3.2,2.91,.85,'#d39350',h+.87),
    dome(x,z,1.14,1.26,.43,'#e8b364',h+1.62),
    ...[-.85,0,.85].map(dx=>tube(x+dx,z+.75,.11,.11,1.17,frame,h-.15)),
  ]:[
    rounded(x,z,2.82,2.29,.21,'#367787',h+1.24),
    ...[-.87,.87].map(dx=>tube(x+dx,z-.56,.14,.14,1.38,frame,h-.12)),
    ...[-.75,-.25,.25,.75].map(dx=>box(x+dx,z+.99,.23,.2,.25,trim,h+1.24)),
  ];
  const details=[
    ...roof,...poolTiles(endX,endZ,park.shell),...worldSign(lunar?'sun':'wave',x,h+.65,z+1,park.shell),
    ...[-1,1].map(side=>beam([x+side*.65,.63,z+.99],[x+side*.65,h+.57,z+.99],.075,frame)),
    ...(lunar?[-.86,.43,1.01].map((dx,i)=>dome(endX+dx,endZ+.43,.6,.38,.23,['#d8abc9','#b091c8','#cfadd2'][i],.54))
      :[-1.28,1.26].flatMap(dx=>[tube(endX+dx,endZ+.69,.052,.052,.24,'#9fdedd',.58),
        dome(endX+dx,endZ+.69,.19,.19,.12,'#b7e7e3',.79)])),
    ...[-3.62,3.57].flatMap((a,i)=>[
      rounded(a,3.59,1.24,.51,.18,trim,.36),box(a,3.39,1.21,.075,.37,frame,.52),
      tube(a+(i===0?-.64:.64),3.58,.11,.11,1.56,frame,.33),
      dome(a+(i===0?-.64:.64),3.58,.43,.43,.23,trim,1.84),
    ]),
  ];
  return [ground,structure,details];
}

export function slideRiders(plot) {
  const park=parks[plot.kind];
  if (!park) return [];
  const lunar=plot.kind==='dustSlides';
  const points=coursePoints(park.course);
  return ['#ecc279','#a189cf'].map((color,i)=>({
    kind:'slide',
    parts:[tube(0,0,.82,.92,.17,color,.027),
      ...(lunar?[-.28,.21,-.16].map((x,j)=>dome(x,-.64-j*.23,.36-j*.055,.41-j*.065,.18,'#bdabc8',.07+j*.042)):[]),
      ...visitor(lunar?(i?'alien':'astronaut'):'human',i?'#70a9be':'#d88782',undefined,true,.57,i+3)
        .map(part=>({...part,y:part.y+.14,stride:0}))],
    pose(seconds) {
      const cycle=(seconds+plot.index*.31+i*3.8)%10.2,t=Math.min(1,cycle/6.45);
      const position=(.68*t+.32*t*t)*(points.length-1);
      const j=Math.min(points.length-2,Math.floor(position)),a=points[j],b=points[j+1];
      const local=a.map((value,axis)=>value+(b[axis]-value)*(position-j));
      const [x,y,z]=pointOnSite(local,plot),yaw=Math.atan2(b[0]-a[0],b[2]-a[2])+plot.yaw;
      return {x,y:cycle<6.65?y+.04:-540,z,cos:Math.cos(yaw),sin:Math.sin(yaw),stride:0,rollCos:1,rollSin:0,
        sound:Number(cycle>4.4&&cycle<5.6)*.57};
    },
  }));
}

export const isSlidePark=kind=>Object.hasOwn(parks,kind);
