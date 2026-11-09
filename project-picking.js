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
    if (!Number.isInteger(face.landmark)||face.group===1&&effects.growth===0) return [];
    const actor=face.group>=2?effects.actors?.[face.group-2]:null;
    if (actor?.y< -150) return [];
    let [nx,ny,nz]=face.normal;
    if (actor) {
      if (!face.hinge) [nx,ny]=[nx*actor.rollCos-ny*actor.rollSin,nx*actor.rollSin+ny*actor.rollCos];
      [nx,nz]=[nx*actor.cos+nz*actor.sin,nz*actor.cos-nx*actor.sin];
    }
    if (nx*s*slope+ny*rise+nz*c*slope<=0) return [];
    const project=([x,y,z])=>{
      if (actor) {
        const [px,py]=face.hinge??[x,y];
        x+=px*actor.rollCos-py*actor.rollSin-px;
        y+=px*actor.rollSin+py*actor.rollCos-py;
        const step=face.stride*actor.stride;
        z+=step;
        [x,y,z]=[actor.x+x*actor.cos+z*actor.sin,actor.y+y+Math.max(0,step)*.58,actor.z+z*actor.cos-x*actor.sin];
      }
      if (face.group===1) y=effects.ground+(y-effects.ground)*effects.growth+effects.lift;
      const forward=x*s+z*c,top=y-camera.center;
      return [width*.5+camera.x+(x*c-z*s)*scale,height*.5+camera.y-(top*slope-forward*rise)*scale,top*rise+forward*slope];
    };
    return [{landmark:face.landmark,points:face.points.map(project),origin:face.origin?project(face.origin):null}];
  });
}

export function landmarkAt(faces,view,x,y) {
  if (!view||!view.scale) return null;
  const point=[x,y];
  let nearest=null,depth=-Infinity;
  for (const {landmark,points,origin} of visibleFaces(faces,view)) {
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
