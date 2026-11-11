import {residentPoint,residentNormal} from './scene-motion.js';

function triangleDepth(point,a,b,c) {
  const [x,y]=point;
  const dx=b[0]-a[0],dy=b[1]-a[1],ex=c[0]-a[0],ey=c[1]-a[1];
  const determinant=dx*ey-dy*ex;
  if (Math.abs(determinant)<.0001) return -Infinity;
  const u=((x-a[0])*ey-(y-a[1])*ex)/determinant;
  const v=(dx*(y-a[1])-dy*(x-a[0]))/determinant;
  if (u<0||v<0||u+v>1) return -Infinity;
  return a[2]+u*(b[2]-a[2])+v*(c[2]-a[2]);
}

function visibleFaces(faces,{camera,scale,width,height,effects}) {
  const c=Math.cos(camera.yaw),s=Math.sin(camera.yaw);
  const rise=Math.sin(camera.pitch),slope=Math.cos(camera.pitch);
  return faces.flatMap(face=>{
    if ((!face.entity&&!Number.isInteger(face.landmark))||face.group===1&&effects.growth===0) return [];
    const actor=face.group>=2?effects.actors?.[face.group-2]:null;
    if (actor?.y< -150) return [];
    let [nx,ny,nz]=residentNormal(face.normal,face.life,effects.age);
    const tilt=actor?.pitch??0,up=Math.cos(tilt),along=Math.sin(tilt);
    if (actor) {
      if (!face.hinge) [nx,ny]=[nx*actor.rollCos-ny*actor.rollSin,nx*actor.rollSin+ny*actor.rollCos];
      if (tilt) [ny,nz]=[ny*up+nz*along,nz*up-ny*along];
      [nx,nz]=[nx*actor.cos+nz*actor.sin,nz*actor.cos-nx*actor.sin];
    }
    if (nx*s*slope+ny*rise+nz*c*slope<=0) return [];
    const project=point=>{
      let [x,y,z]=residentPoint(point,face.life,face.stride??0,effects.age);
      if (actor) {
        const [px,py]=face.hinge??[x,y];
        x+=px*actor.rollCos-py*actor.rollSin-px;
        y+=px*actor.rollSin+py*actor.rollCos-py;
        if (tilt) [y,z]=[y*up+z*along,z*up-y*along];
        const step=(face.stride??0)*actor.stride;
        z+=step;
        [x,y,z]=[actor.x+x*actor.cos+z*actor.sin,actor.y+y+Math.max(0,step)*.58,actor.z+z*actor.cos-x*actor.sin];
      }
      if (face.group===1) y=effects.ground+(y-effects.ground)*effects.growth+effects.lift;
      const forward=x*s+z*c,top=y-camera.center;
      return [width*.5+camera.x+(x*c-z*s)*scale,height*.5+camera.y-(top*slope-forward*rise)*scale,top*rise+forward*slope];
    };
    return [{landmark:face.landmark,key:face.entity??face.landmark,points:face.points.map(project),origin:face.origin?project(face.origin):null}];
  });
}

export function landmarkAt(faces,view,x,y) {
  if (!view||!view.scale) return null;
  const point=[x,y];
  let nearest=null,depth=-Infinity;
  for (const {landmark,points,origin} of visibleFaces(faces.filter(face=>Number.isInteger(face.landmark)),view)) {
    if (point.some((value,i)=>points.every(p=>p[i]>value)||points.every(p=>p[i]<value))) continue;
    for (let i=origin?0:1;i<(origin?points.length:points.length-1);i++) {
      const distance=triangleDepth(point,origin??points[0],points[i],points[(i+1)%points.length]);
      if (distance>depth) {
        nearest=landmark;
        depth=distance;
      }
    }
  }
  return nearest;
}

function depthAt(face,x,y) {
  let nearest=-Infinity;
  const {points,origin}=face;
  if ([x,y].some((value,i)=>points.every(p=>p[i]>value)||points.every(p=>p[i]<value))) return nearest;
  for (let i=origin?0:1;i<(origin?points.length:points.length-1);i++) {
    nearest=Math.max(nearest,triangleDepth([x,y],origin??points[0],points[i],points[(i+1)%points.length]));
  }
  return nearest;
}

export function entityAt(faces,view,x,y,padding=0) {
  if (!view?.scale) return null;
  const projected=visibleFaces(faces,view).filter(({points})=>
    ![x,y].some((value,i)=>points.every(p=>p[i]>value+padding)||points.every(p=>p[i]<value-padding)));
  let key=null,depth=-Infinity;
  for (const face of projected) {
    const z=depthAt(face,x,y);
    if (z>depth) { key=face.key;depth=z; }
  }
  if (typeof key==='string'||!padding) return key;
  // Enlarge only visible moving/person targets; a foreground building still
  // occludes them. Drag gestures never reach this tap-only picking function.
  let closest=padding;
  for (const face of projected) {
    if (typeof face.key!=='string') continue;
    for (let i=0;i<face.points.length;i++) {
      const a=face.points[i],b=face.points[(i+1)%face.points.length];
      const dx=b[0]-a[0],dy=b[1]-a[1];
      const t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1)));
      const px=a[0]+dx*t,py=a[1]+dy*t,distance=Math.hypot(x-px,y-py);
      if (distance>=closest) continue;
      const z=a[2]+(b[2]-a[2])*t;
      if (projected.some(other=>other.key!==face.key&&depthAt(other,px,py)>z+.025)) continue;
      key=face.key;closest=distance;
    }
  }
  return key;
}

export function landmarkSilhouette(faces,view) {
  return visibleFaces(faces.filter(face=>!face.foundation),view).map(({points})=>{
    // A consistent winding turns overlapping polygons into one silhouette.
    const area=points.reduce((sum,[x,y],i)=>{
      const [a,b]=points[(i+1)%points.length];
      return sum+x*b-y*a;
    },0);
    if (area<0) points.reverse();
    return 'M'+points.map(p=>p.slice(0,2).map(value=>value.toFixed(2)).join(',')).join('L')+'Z';
  }).join('');
}
