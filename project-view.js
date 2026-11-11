import {createTraffic,MAX_ACTORS} from './scenery.js';
import {createFireworks,FIREWORKS_START,FIREWORKS_END,FINALE_FIREWORKS_END} from './project-fireworks.js';
import {entityAt,landmarkSilhouette} from './project-picking.js';
import {residentPoint,residentNormal,lunarSkyCamera,lightPulse} from './scene-motion.js';

const clamp = (value,min,max) => Math.max(min,Math.min(value,max));
const cross = ([ax,ay,az],[bx,by,bz]) => [ay*bz-az*by,az*bx-ax*bz,ax*by-ay*bx];
const difference = (a,b) => a.map((value,i)=>value-b[i]);
const dot = (a,b) => a.reduce((sum,value,i)=>sum+value*b[i],0);

function ringFaces(rings) {
  const first=rings[0], last=rings.at(-1);
  return [first,[...last].reverse(),...rings.slice(1).flatMap((upper,j)=>{
    const lower=rings[j];
    return lower.map((point,i)=>{
      const next=(i+1)%lower.length;
      return [point,upper[i],upper[next],lower[next]];
    });
  })];
}

function baseFaces({shape,x,y,z,w,d,h,outline,profile,axis='y',angle=0,from,to,width,phase=0,inverted=false}) {
  if (shape==='landscape'||shape==='terrain') return [outline];
  if (shape==='support') return ringFaces([outline,outline.map(([x,,z])=>[x,y+h,z])]);
  if (shape==='beam') {
    const delta=difference(to,from);
    const perpendicular=cross(delta,Math.abs(delta[1])>Math.hypot(delta[0],delta[2])?[1,0,0]:[0,1,0]);
    const normal=v=>v.map(value=>value/Math.hypot(...v)*width*.5);
    const a=normal(perpendicular),b=normal(cross(delta,perpendicular));
    return ringFaces([from,to].map(point=>[[-1,1],[1,1],[1,-1],[-1,-1]]
      .map(([u,v])=>point.map((value,i)=>value+a[i]*u+b[i]*v))));
  }
  if (shape==='plate') {
    const area=profile.reduce((sum,[a,b],i)=>{
      const [c,d]=profile[(i+1)%profile.length];
      return sum+a*d-b*c;
    },0);
    const front=(area>0?profile:[...profile].reverse()).map(([a,b])=>[x+a,y+b,z]);
    return [front,[...front].reverse()];
  }
  if (shape==='cone') return ringFaces([0,1].map(level=>Array.from({length:12},(_,i)=>{
    const a=i*Math.PI/6,r=Boolean(level)===inverted?.5:.035;return [x+Math.cos(a)*w*r,y+h*level,z+Math.sin(a)*d*r];
  })));
  if (shape==='dome') {
    const rings=[0,.44,.78,1.08,1.38,1.52].map(incline=>{
      const radius=Math.cos(incline)/2;
      return Array.from({length:12},(_,i)=>{
        const a=i*Math.PI/6;
        const px=w*Math.cos(a)*radius, pz=d*Math.sin(a)*radius;
        return [x+px*Math.cos(angle)-pz*Math.sin(angle),y+h*Math.sin(incline),z+px*Math.sin(angle)+pz*Math.cos(angle)];
      });
    });
    return ringFaces(rings);
  }
  if (shape==='boulder') {
    const rings=[[0,.84],[.39,1],[.81,.73],[1,.28]].map(([level,radius],j)=>
      Array.from({length:7},(_,i)=>{
        const theta=i*Math.PI*2/7;
        const r=radius*(.81+.21*Math.sin(i*4.2+phase)+.13*Math.cos(i*2.4+phase));
        return [x+Math.cos(theta)*w*r*.5+w*j*.032,y+h*(level+(j>0&&j<3?.105*Math.sin(i*1.9+phase):0)),
          z+Math.sin(theta)*d*r*.5-d*j*.035];
      }));
    return ringFaces(rings);
  }
  if (shape==='rounded' && Math.min(w,d,h)>.2) {
    const bevel=Math.min(.24,w*.13,d*.13,h*.22);
    const rings=[[0,bevel],[bevel,0],[h-bevel,0],[h,bevel]].map(([height,inset])=>
      [[1,1],[-1,1],[-1,-1],[1,-1]].flatMap(([sx,sz],j)=>
        [0,.25,.5].map(turn=>{
          const a=(j*.5+turn)*Math.PI;
          const r=bevel*1.7-inset;
          return [x+sx*(w/2-bevel*1.7)+r*Math.cos(a),y+height,z+sz*(d/2-bevel*1.7)+r*Math.sin(a)];
        })));
    return ringFaces(rings);
  }
  if (shape==='tube') {
    const lower=Array.from({length:12},(_,i)=>{
      const angle=i*Math.PI/6;
      if (axis==='x') return [x+w/2,y+(1+Math.cos(angle))*h/2,z+d*Math.sin(angle)/2];
      if (axis==='z') return [x+w*Math.cos(angle)/2,y+(1-Math.sin(angle))*h/2,z-d/2];
      return [x+w*Math.cos(angle)/2,y,z+d*Math.sin(angle)/2];
    });
    const upper=lower.map(([a,b,c])=>axis==='x'?[a-w,b,c]:axis==='z'?[a,b,c+d]:[a,b+h,c]);
    return ringFaces([lower,upper]);
  }

  const left=x-w/2,right=x+w/2,back=z-d/2,front=z+d/2;
  const a=[left,y,back],b=[right,y,back],c=[right,y,front],d0=[left,y,front];
  if (shape==='roof') {
    const e=[x,y+h,back],f=[x,y+h,front];
    return [[a,b,c,d0],[a,e,b],[d0,c,f],[a,d0,f,e],[b,e,f,c]];
  }
  const e=[left,y+h,back],f=[right,y+h,back],g=[right,y+h,front],u=[left,y+h,front];
  return [[a,b,c,d0],[e,u,g,f],[a,e,f,b],[b,f,g,c],[d0,c,g,u],[a,d0,u,e]];
}

function partFaces(part) {
  const faces=baseFaces(part);
  if (!part.angle||['dome','landscape','terrain','beam','support'].includes(part.shape)) return faces;
  const c=Math.cos(part.angle),s=Math.sin(part.angle);
  return faces.map(face=>face.map(([x,y,z])=>[
    part.x+(x-part.x)*c-(z-part.z)*s,y,part.z+(x-part.x)*s+(z-part.z)*c,
  ]));
}

function studs(part) {
  if (!part.studs) return [];
  const {x,y,z,w,d,h,color,studs:columns}=part;
  const rows=d>2.4?2:1;
  const diameter=Math.min(.78,w/columns*.52,d/rows*.55);
  return Array.from({length:columns*rows},(_,i)=>({
    shape:'tube',x:x+((i%columns+.5)/columns-.5)*w,y:y+h-.01,
    z:z+((Math.floor(i/columns)+.5)/rows-.5)*d,w:diameter,d:diameter,h:.18,color,
  }));
}

function domeNormal(part,[x,y,z]) {
  const cos=Math.cos(part.angle), sin=Math.sin(part.angle);
  const dx=x-part.x,dz=z-part.z;
  const localX=(dx*cos+dz*sin)/(part.w*.5)**2;
  const localZ=(-dx*sin+dz*cos)/(part.d*.5)**2;
  const normal=[localX*cos-localZ*sin,(y-part.y)/part.h**2,localX*sin+localZ*cos];
  const length=Math.hypot(...normal);
  return normal.map(value=>value/length);
}

export function projectFaces(scene) {
  const light=scene.illustrated?[-.47,.77,.43]:[.28,.84,.43];
  const latest=new Set(scene.latest);
  const haze=backgroundRGB(scene.background??'#e5f0e8');
  const layers=[scene.parts, ...(scene.ambient ?? []).map(actor=>actor.parts)];
  return layers.flatMap((parts,layerIndex)=>parts.flatMap(part=>[part,...studs(part)].flatMap(piece=>{
    const rgb=piece.color.slice(1).match(/../g).map(channel=>parseInt(channel,16)/255);
    const shaded=normal=>{
      const illumination=Math.max(0,dot(normal,light));
      const reflection=Math.max(0,illumination-.72)**2*.34;
      if (scene.illustrated) {
        const tint=scene.id==='moon'?[.023,.027,.054]:[.027,.042,.049];
        const sun=[.077,.055,.023];
        return rgb.map((value,i)=>clamp(value*(.63+.32*illumination)+tint[i]*(1-illumination)+sun[i]*illumination+reflection,0,1));
      }
      return rgb.map(value=>Math.min(1,value*(.62+.37*illumination)+reflection));
    };
    return partFaces(piece).map((points,faceIndex)=>{
      const landscape=piece.shape==='landscape';
      const sign=faceIndex===0?1:-1;
      const normal=landscape ? [0,1,0] : piece.shape==='plate' ? [-sign*Math.sin(piece.angle??0),0,sign*Math.cos(piece.angle??0)]
        : cross(difference(points[1],points[0]),difference(points[2],points[0]));
      const length=Math.hypot(...normal);
      const unit=normal.map(value=>value/length);
      const fade=color=>color.map((value,i)=>value+(haze[i]-value)*(piece.fog??0));
      const vertexColors=piece.colors??(piece.shape==='dome'&&faceIndex>0 ? points.map(point=>fade(shaded(domeNormal(piece,point)))) : null);
      const color=landscape ? fade(rgb) : vertexColors ? rgb.map((_,i)=>vertexColors.reduce((sum,vertex)=>sum+vertex[i],0)/points.length) : fade(shaded(unit));
      const actorKind=scene.ambient?.[layerIndex-1]?.kind;
      const actorEntity=layerIndex&&!Number.isInteger(part.landmark)&&piece.life?.[3]!==-1
        &&!['rocket-flame','football-stars','observation'].includes(actorKind);
      return {points,normal:unit,color,vertexColors,opacity:piece.opacity,smooth:Boolean(piece.colors),layer:part.layer??Infinity,hinge:piece.hinge,life:piece.life,entity:part.entity??(actorEntity?`actor:${layerIndex-1}`:null),landmark:part.landmark,foundation:Boolean(part.support||part.foundation),
        origin:landscape||piece.radial ? [piece.x,piece.y,piece.z] : null,
        group:layerIndex?layerIndex+1:part.roadBuild!==undefined?-Math.max(.001,part.roadBuild):latest.has(part)?1:0,stride:part.stride??0};
    });
  })));
}

function backgroundRGB(hex) {
  return hex.slice(1).match(/../g).map(channel=>parseInt(channel,16)/255);
}

function triangleGradient(context,points,colors,solid,paintColor) {
  const [[ax,ay],[bx,by],[cx,cy]]=points;
  const determinant=(bx-ax)*(cy-ay)-(cx-ax)*(by-ay);
  if (Math.abs(determinant)<.05) return solid;
  // Terrain tint and mist vary gradually over each triangle.
  const values=colors.map(([r,g,b])=>.29*r+.53*g+.18*b);
  const low=Math.min(...values),high=Math.max(...values);
  if (high-low<.005) return solid;
  const dx=((values[1]-values[0])*(cy-ay)-(values[2]-values[0])*(by-ay))/determinant;
  const dy=((bx-ax)*(values[2]-values[0])-(cx-ax)*(values[1]-values[0]))/determinant;
  const span=(high-low)/(dx*dx+dy*dy);
  const [x,y]=points[values.indexOf(low)];
  const gradient=context.createLinearGradient(x,y,x+dx*span,y+dy*span);
  colors.forEach((color,i)=>gradient.addColorStop((values[i]-low)/(high-low),paintColor(color)));
  return gradient;
}

export function rasterizeLunarTerrain(image,triangles,sx,sy) {
  const {data,width,height}=image;
  for (const {points,colors,opacity} of triangles) {
    const [[ax,ay],[bx,by],[cx,cy]]=points.map(([x,y])=>[x*sx,y*sy]);
    const area=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);
    if (Math.abs(area)<1e-8) continue;
    const left=Math.max(0,Math.floor(Math.min(ax,bx,cx)));
    const right=Math.min(width-1,Math.ceil(Math.max(ax,bx,cx)));
    const top=Math.max(0,Math.floor(Math.min(ay,by,cy)));
    const bottom=Math.min(height-1,Math.ceil(Math.max(ay,by,cy)));
    const [a,b,c]=colors;
    for (let y=top;y<=bottom;y++) {
      const row=y+.5-cy;
      for (let x=left;x<=right;x++) {
        const column=x+.5-cx;
        const u=((by-cy)*column+(cx-bx)*row)/area;
        const v=((cy-ay)*column+(ax-cx)*row)/area;
        const w=1-u-v;
        if (u< -1e-8||v< -1e-8||w< -1e-8) continue;
        const alpha=u*opacity[0]+v*opacity[1]+w*opacity[2];
        const offset=(y*width+x)*4;
        data[offset+3]=alpha*255;
        // The mesh stores premultiplied colors. ImageData uses straight alpha.
        const gain=alpha>0?255/alpha:0;
        for (let channel=0;channel<3;channel++) data[offset+channel]=(u*a[channel]+v*b[channel]+w*c[channel])*gain;
      }
    }
  }
}

function splitWideFace(face) {
  const points=face.points;
  if (Number.isFinite(face.layer)||face.group>=2||face.vertexColors||points.length<3) return [face];
  const spans=[0,1,2].map(i=>Math.max(...points.map(p=>p[i]))-Math.min(...points.map(p=>p[i])));
  if (spans.filter(span=>span>2.8).length<2) return [face];
  const blend=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
  if (points.length===4) {
    const [a,b,c,d]=points;
    const along=Math.ceil(Math.hypot(...difference(b,a))/2.5);
    const across=Math.ceil(Math.hypot(...difference(d,a))/2.5);
    const point=(u,v)=>blend(blend(a,b,u),blend(d,c,u),v);
    return Array.from({length:along*across},(_,i)=>{
      const u=(i%along)/along,v=Math.floor(i/along)/across;
      const endU=u+1/along,endV=v+1/across;
      return {...face,points:[point(u,v),point(endU,v),point(endU,endV),point(u,endV)]};
    });
  }
  const center=[0,1,2].map(i=>points.reduce((sum,p)=>sum+p[i],0)/points.length);
  return points.map((point,i)=>({...face,points:[center,point,points[(i+1)%points.length]]}));
}

function canvasPainter(canvas, faces, background, stars) {
  const context=canvas.getContext('2d');
  if (!context) return null;
  const paintColor=color=>`rgb(${color.map(channel=>Math.round(channel*255)).join(',')})`;
  // Smaller surfaces keep thin signs, roofs and ride tracks sorted correctly in Canvas.
  const flat=faces.flatMap(splitWideFace).map(face=>({...face,paint:paintColor(face.color)}));
  const terrain=flat.filter(face=>Number.isFinite(face.layer));
  const objects=flat.filter(face=>!Number.isFinite(face.layer));
  const terrainChanges=terrain.some(face=>face.group===1||face.group<0);
  const backing=terrain.length?canvas.ownerDocument.createElement('canvas'):null;
  const groundContext=backing?.getContext('2d');
  let viewKey;

  return (width,height,camera,scale,center,effects)=>{
    const sx=canvas.width/width,sy=canvas.height/height;
    const cos=Math.cos(camera.yaw), sin=Math.sin(camera.yaw);
    const rise=Math.sin(camera.pitch), slope=Math.cos(camera.pitch);
    const facing=[sin*slope,rise,cos*slope];
    function drawFaces(surface,list) {
      const polygons=[];
      for (const face of list) {
        if (face.group<0&&-face.group>effects.road||face.group===1&&effects.growth===0) continue;
        const actor=face.group>=2?effects.actors[face.group-2]:null;
        const light=face.life?.[3];
        if (light===-1&&!actor?.thrust) continue;
        let [nx,ny,nz]=residentNormal(face.normal,face.life,effects.age);
        if (actor&&!face.hinge&&(actor.rollCos!==1||actor.rollSin)) {
          [nx,ny]=[nx*actor.rollCos-ny*actor.rollSin,nx*actor.rollSin+ny*actor.rollCos];
        }
        const tilt=actor?.pitch??0,up=Math.cos(tilt),along=Math.sin(tilt);
        if (tilt) [ny,nz]=[ny*up+nz*along,nz*up-ny*along];
        const facingLight=actor ? (nx*actor.cos+nz*actor.sin)*facing[0]+ny*facing[1]+(nz*actor.cos-nx*actor.sin)*facing[2]
          : nx*facing[0]+ny*facing[1]+nz*facing[2];
        if (facingLight<=0) continue;
        let depth=0;
        let modelY=0;
        const points=face.points.map(point=>{
          let [x,y,z]=residentPoint(point,face.life,face.stride,effects.age);
          if (face.group===1) {
            modelY+=y;
            y=effects.ground+(y-effects.ground)*effects.growth+effects.lift;
          }
          if (actor) {
            if (actor.rollCos!==1||actor.rollSin) {
              const [px,py]=face.hinge??[x,y];
              x+=px*actor.rollCos-py*actor.rollSin-px;
              y+=px*actor.rollSin+py*actor.rollCos-py;
            }
            const step=actor.stride*face.stride;
            if (tilt) [y,z]=[y*up+z*along,z*up-y*along];
            const strideZ=z+step;
            z=actor.z+strideZ*actor.cos-x*actor.sin;
            x=actor.x+x*actor.cos+strideZ*actor.sin;
            y+=actor.y+Math.max(0,step)*.58;
          }
          const forward=x*sin+z*cos;
          const heightFromCenter=y-center;
          depth+=heightFromCenter*rise+forward*slope;
          return [width/2+camera.x+(x*cos-z*sin)*scale,
            height/2+camera.y-(heightFromCenter*slope-forward*rise)*scale];
        });
        if (points.every(([x])=>x<0) || points.every(([x])=>x>width) ||
            points.every(([,y])=>y<0) || points.every(([,y])=>y>height)) continue;
        const shimmer=Math.max(0,1-Math.abs(modelY/points.length-effects.sweep)/.7)*.36;
        const highlight=face.group===1?Math.min(.58,effects.highlight+shimmer):0;
        const emission=lightPulse(light,effects.age);
        const paint=highlight||emission ? paintColor(face.color.map((value,i)=>
          value+([1,.91,.69][i]-value)*Math.max(highlight,emission))) : face.paint;
        polygons.push({points,depth:depth/points.length,paint,layer:face.layer,colors:face.smooth?face.vertexColors:null,opacity:face.opacity});
      }
      polygons.sort((a,b)=>(a.layer-b.layer)||a.depth-b.depth);
      const lunarGround=stars?polygons.filter(face=>face.opacity):[];
      if (lunarGround.length) {
        // A shared pixel grid avoids antialiasing the internal triangle edges separately.
        const image=surface.createImageData(surface.canvas.width,surface.canvas.height);
        rasterizeLunarTerrain(image,lunarGround,sx,sy);
        surface.putImageData(image,0,0);
      }
      for (const {points,paint,colors,opacity,layer} of polygons) {
        if (opacity) continue;
        // The lunar horizon sits behind the already painted terrain.
        if (lunarGround.length) surface.globalCompositeOperation=layer<0?'destination-over':'source-over';
        surface.beginPath();
        points.forEach(([x,y],i)=>i?surface.lineTo(x,y):surface.moveTo(x,y));
        surface.closePath();
        surface.fillStyle=surface.strokeStyle=colors?triangleGradient(surface,points,colors,paint,paintColor):paint;
        surface.lineWidth=.65;
        surface.fill();
        surface.stroke();
      }
      if (lunarGround.length) surface.globalCompositeOperation='source-over';
    }
    context.setTransform(sx,0,0,sy,0,0);
    if (stars) context.clearRect(0,0,width,height);
    if (groundContext) {
      // Actors can move while the same projected landscape is reused.
      const key=[canvas.width,canvas.height,width,height,camera.yaw,camera.pitch,camera.x,camera.y,scale,center,
        ...(terrainChanges?[effects.growth,effects.lift,effects.highlight,effects.sweep,effects.road]:[])].join(',');
      if (key!==viewKey) {
        if (backing.width!==canvas.width||backing.height!==canvas.height) {
          backing.width=canvas.width; backing.height=canvas.height;
        }
        groundContext.setTransform(sx,0,0,sy,0,0);
        if (stars) groundContext.clearRect(0,0,width,height);
        else {
          groundContext.fillStyle=background;
          groundContext.fillRect(0,0,width,height);
        }
        drawFaces(groundContext,terrain);
        viewKey=key;
      }
      context.drawImage(backing,0,0,width,height);
      drawFaces(context,objects);
    } else {
      context.fillStyle=background;
      context.fillRect(0,0,width,height);
      drawFaces(context,flat);
    }
  };
}

function webGLPainter(canvas, faces, background, illustrated, stars) {
  const vertexFloats=16;
  const gl=canvas.getContext('webgl',{alpha:stars,antialias:true});
  if (!gl) return null;
  const shader=(kind,source)=>{
    const result=gl.createShader(kind);
    gl.shaderSource(result,source);
    gl.compileShader(result);
    return result;
  };
  const vertex=shader(gl.VERTEX_SHADER,`
    attribute vec3 position;
    attribute vec4 color;
    attribute float group;
    attribute float stride;
    attribute vec3 hinge;
    attribute vec4 life;
    uniform float age;
    uniform vec2 yaw;
    uniform vec2 pitch;
    uniform vec2 zoom;
    uniform vec2 pan;
    uniform float center;
    uniform vec4 reveal;
    uniform vec4 actorPose[${MAX_ACTORS}];
    uniform vec3 actorTilt[${MAX_ACTORS}];
    uniform vec4 actorMotion[${MAX_ACTORS}];
    varying mediump vec4 shade;
    varying mediump float modelHeight;
    varying mediump float latest;
    void main() {
      vec3 pos = position;
      if (life.w > 0.0) {
        float t = age*1.7+life.w;
        float angle = sin(t)*.032;
        vec2 p = pos.xy-life.xy;
        pos.xy = life.xy+vec2(p.x*cos(angle)-p.y*sin(angle),p.x*sin(angle)+p.y*cos(angle));
        pos.y += sin(t*1.31)*.022;
        pos.z += sin(t*.79)*.018+stride*sin(t*1.13)*.055;
      }
      latest = group == 1.0 ? 1.0 : 0.0;
      modelHeight = pos.y;
      shade = color;
      if (life.w < 0.0) {
        float pulse = life.w == -1.0 ? .28+.16*sin(age*23.0) : .73*pow(max(0.0,cos(age*2.6+life.w)),12.0);
        shade.rgb = mix(shade.rgb,vec3(1.0,.91,.69),pulse);
      }
      if ((group < 0.0 && -group > reveal.w) || (latest == 1.0 && reveal.y == 0.0)) {
        gl_Position = vec4(2.0,2.0,2.0,1.0);
        return;
      }
      if (latest == 1.0) pos.y = reveal.z + (pos.y-reveal.z)*reveal.y + reveal.x;
      for (int i = 0; i < ${MAX_ACTORS}; i++) {
        if (group == 2.0+float(i)) {
          vec4 pose = actorPose[i];
          vec4 motion = actorMotion[i];
          vec2 pivot = hinge.z > .5 ? hinge.xy : pos.xy;
          pos.xy += vec2(pivot.x*motion.z-pivot.y*motion.w,pivot.x*motion.w+pivot.y*motion.z)-pivot;
          vec3 slope = actorTilt[i];
          if (life.w == -1.0 && slope.z < .5) {
            gl_Position = vec4(2.0,2.0,2.0,1.0);
            return;
          }
          pos.yz = vec2(pos.y*slope.x+pos.z*slope.y,pos.z*slope.x-pos.y*slope.y);
          float step = stride*motion.y;
          float z = pos.z+step;
          pos = vec3(pose.x+pos.x*pose.w+z*motion.x,pos.y+pose.y+max(0.0,step)*.58,
            pose.z+z*pose.w-pos.x*motion.x);
        }
      }
      float forward = pos.x*yaw.y + pos.z*yaw.x;
      float y = pos.y-center;
      vec2 point = vec2(pos.x*yaw.x-pos.z*yaw.y,y*pitch.x-forward*pitch.y);
      gl_Position = vec4(point*zoom+pan,-(y*pitch.y+forward*pitch.x)/160.0,1.0);
    }
  `);
  const fragment=shader(gl.FRAGMENT_SHADER,`
    precision mediump float;
    varying mediump vec4 shade;
    varying mediump float modelHeight;
    varying mediump float latest;
    uniform vec2 shine;
    void main() {
      float sweep = max(0.0,1.0-abs(modelHeight-shine.y)/.7)*.36;
      vec3 color = mix(shade.rgb,vec3(1.0,.86,.46),latest*min(.58,shine.x+sweep));
      ${illustrated?'color += (fract(52.9829 * fract(dot(gl_FragCoord.xy,vec2(.06711,.00583))))-.5)*.022*shade.a;':''}
      gl_FragColor = vec4(color,shade.a);
    }
  `);
  const program=gl.createProgram();
  gl.attachShader(program,vertex);
  gl.attachShader(program,fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error('Prosjektvisningen kunne ikke bruke WebGL');
  gl.useProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  const data=[];
  for (const {points,color,vertexColors,opacity,group,origin,stride,hinge,life} of faces) {
    const pivot=hinge?[...hinge,1]:[0,0,0];
    for (let i=origin?0:1;i<(origin?points.length:points.length-1);i++) {
      const next=(i+1)%points.length;
      data.push(...(origin??points[0]),...(vertexColors?.[0]??color),opacity?.[0]??1,group,stride,...pivot,...(life??[0,0,0,0]),
        ...points[i],...(vertexColors?.[i]??color),opacity?.[i]??1,group,stride,...pivot,...(life??[0,0,0,0]),
        ...points[next],...(vertexColors?.[next]??color),opacity?.[next]??1,group,stride,...pivot,...(life??[0,0,0,0]));
    }
  }
  const buffer=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);
  for (const [name,size,offset] of [['position',3,0],['color',4,12],['group',1,28],['stride',1,32],['hinge',3,36],['life',4,48]]) {
    const location=gl.getAttribLocation(program,name);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location,size,gl.FLOAT,false,vertexFloats*4,offset);
  }
  const uniforms=Object.fromEntries(['yaw','pitch','zoom','pan','center','reveal','shine','age','actorPose[0]','actorMotion[0]','actorTilt[0]']
    .map(name=>[name,gl.getUniformLocation(program,name)]));
  const actorPositions=new Float32Array(MAX_ACTORS*4),actorMovement=new Float32Array(MAX_ACTORS*4);
  const actorSlopes=new Float32Array(MAX_ACTORS*3);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.clearColor(...backgroundRGB(background),stars?0:1);
  if (stars) {
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
  }
  return {
    draw(width,height,camera,scale,center,effects) {
      gl.viewport(0,0,canvas.width,canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      gl.uniform2f(uniforms.yaw,Math.cos(camera.yaw),Math.sin(camera.yaw));
      gl.uniform2f(uniforms.pitch,Math.cos(camera.pitch),Math.sin(camera.pitch));
      gl.uniform1f(uniforms.age,effects.age??0);
      gl.uniform2f(uniforms.zoom,2*scale/width,2*scale/height);
      gl.uniform2f(uniforms.pan,2*camera.x/width,-2*camera.y/height);
      gl.uniform1f(uniforms.center,center);
      gl.uniform4f(uniforms.reveal,effects.lift,effects.growth,effects.ground,effects.road);
      gl.uniform2f(uniforms.shine,effects.highlight,effects.sweep);
      effects.actors.forEach(({x,y,z,cos,sin,stride,rollCos,rollSin,pitch=0,thrust=0},i)=>{
        actorPositions.set([x,y,z,cos],i*4);
        actorMovement.set([sin,stride,rollCos,rollSin],i*4);
        actorSlopes.set([Math.cos(pitch),Math.sin(pitch),thrust],i*3);
      });
      gl.uniform4fv(uniforms['actorPose[0]'],actorPositions);
      gl.uniform4fv(uniforms['actorMotion[0]'],actorMovement);
      gl.uniform3fv(uniforms['actorTilt[0]'],actorSlopes);
      gl.drawArrays(gl.TRIANGLES,0,data.length/vertexFloats);
    },
    dispose() {
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}

const MAX_ZOOM=4.5;
const turnToward=(from,to)=>from+Math.atan2(Math.sin(to-from),Math.cos(to-from));

const ROAD_BUILD_MS=540;

export function buildMotion(world, elapsed, ground, top, marked, roadBuild=false) {
  const road=roadBuild?Math.floor(clamp(elapsed/ROAD_BUILD_MS,0,1)*24)/24:1;
  if (roadBuild) elapsed-=ROAD_BUILD_MS;
  const t=clamp((elapsed-90)/725,0,1);
  const growing=t*t*(3-2*t);
  const settled=clamp((elapsed-700)/500,0,1);
  return {
    ground,
    road,
    growth:world ? road<1?0:Math.max(.012,growing) : 1,
    lift:world ? 0 : 3.8*(1-clamp((elapsed-230)/620,0,1))**3,
    highlight:marked ? .1+.22*(1-settled) : 0,
    sweep:world&&marked&&t>0&&t<1 ? ground+(top-ground)*growing : -999,
  };
}

export function projectCameras(scene,target=null,focusLatest=false,{compact=false}={}) {
  const initial={yaw:scene.world?-Math.PI/4:scene.yaw,pitch:scene.world?.6155:scene.pitch,zoom:1,
    x:0,y:0,anchorX:scene.anchorX??0,anchorZ:scene.anchorZ??0,center:scene.center};
  const maxZoom=Math.max(1.15,MAX_ZOOM*(compact?1.65:1)*scene.size/(scene.closeSize??scene.size));
  const latest=scene.latest??[];
  if (!scene.world||(!target&&!latest.length)) {
    return {initial,maxZoom,context:initial,detail:{...initial,zoom:scene.world?1:1.12}};
  }
  const average=key=>latest.reduce((sum,part)=>sum+part[key],0)/latest.length;
  const point=target??scene.latestTarget??{x:average('x'),y:Math.max(0,average('y')-.6),z:average('z'),height:4.2};
  const height=point.height??6;
  const station=point.kind==='railwayStation'||point.kind==='monorailStation'||point.kind==='tramStation';
  const framing=(station?23:height*1.13+3.2)*(compact?.91:1);
  const close={...initial,zoom:Math.min(maxZoom,scene.size/framing),anchorX:point.x,anchorZ:point.z,
    center:point.y+height*(height>10?.46:.37)};
  const neighbor=Object.values(scene.landmarks??{}).filter(other=>Math.hypot(other.x-point.x,other.z-point.z)>.7)
    .reduce((nearest,other)=>!nearest||Math.hypot(other.x-point.x,other.z-point.z)<Math.hypot(nearest.x-point.x,nearest.z-point.z)?other:nearest,null);
  const context={...initial,zoom:clamp(scene.size/41,1,maxZoom),center:point.y+1.35,
    anchorX:neighbor?point.x*.77+neighbor.x*.23:point.x,
    anchorZ:neighbor?point.z*.77+neighbor.z*.23:point.z};
  return {initial,maxZoom,context,detail:target||focusLatest||scene.finished?close:context};
}

export function finishTransition(elapsed) {
  const t=clamp((elapsed-190)/910,0,1);
  return {travel: t*t*(3-2*t),opacity:1-.31*Math.sin(Math.PI*t)};
}

const nearbySounds={shuttle:'rocket',road:'traffic',bus:'traffic',jetski:'traffic',hover:'rover','offroad-rover':'rover',
  wheel:'ride-cheer',coaster:'ride-cheer',tram:'train'};
const aircraft=new Set(['plane','helicopter','rocket']);

function projectPanorama(scene,initial,maxZoom) {
  const sites=Object.values(scene.sites??{});
  if (!sites.length) return initial;
  const bounds=axis=>{
    const values=sites.map(site=>site[axis]);
    return [Math.min(...values),Math.max(...values)];
  };
  const [left,right]=bounds('x'),[back,front]=bounds('z');
  return {
    ...initial,anchorX:(left+right)*.5,anchorZ:(back+front)*.5,
    zoom:clamp(scene.size/(Math.hypot(right-left,front-back)+28),1,maxZoom),
  };
}

export function mountProjectView(container, scene, interactive=false, {
  closeUp=false,reveal=false,demo=false,target=null,still=false,focusLatest=false,finale=false,onInspect,onActivity,
}={}) {
  let canvas=container.querySelector('canvas');
  const faces=projectFaces(scene);
  const stars=scene.id==='moon'&&scene.illustrated;
  if (stars) canvas.classList.add('lunar-starfield');
  let engine;
  if (interactive || scene.world && !still) {
    try { engine=webGLPainter(canvas,faces,scene.background,scene.illustrated,stars); }
    catch {
      const fallback=canvas.cloneNode();
      canvas.replaceWith(fallback);
      canvas=fallback;
    }
  }
  const paint=engine?.draw || canvasPainter(canvas,faces,scene.background,stars);
  if (!paint) return ()=>{};
  const compact=window.matchMedia('(pointer: coarse), (max-width: 900px)').matches;
  const {initial,maxZoom,context,detail}=projectCameras(scene,target,focusLatest,{compact});
  const latest=scene.latest ?? [];
  const heights=faces.filter(face=>face.group===1).flatMap(face=>face.points.map(point=>point[1]));
  const low=heights.length ? Math.min(...heights) : 0;
  const high=heights.length ? Math.max(...heights) : 0;
  const camera={...initial};
  const pointers=new Map();
  const selectable=onInspect?faces.filter(face=>face.entity||Number.isInteger(face.landmark)):[];
  let frame=0,width=0,height=0,fireworks,projectedView,tap,selectedFaces,glow,glowKey;
  let thoughts;
  const residents=faces.some(face=>face.life);
  let lastActivity=-Infinity,audibleActors=new Set(),focusTravel;
  const events=new AbortController();
  const listen=(node,name,handler,options={})=>node.addEventListener(name,handler,{...options,signal:events.signal});
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  let marked=reveal&&latest.length>0, started=null, from={...camera}, visible=true, lastFrame=-Infinity;
  const completedBuild=scene.world&&Boolean(scene.finished)&&!target;
  const canCelebrate=Boolean(scene.finished)&&!target;
  const fireworksEnd=finale?FINALE_FIREWORKS_END:FIREWORKS_END;
  const panorama=finale&&completedBuild?projectPanorama(scene,initial,maxZoom):null;
  const fireworkTarget=scene.latestTarget??(scene.world
    ? {x:detail.anchorX,y:high,z:detail.anchorZ}
    : {x:0,y:Math.max(...scene.parts.map(part=>part.y+part.h)),z:0});
  const fireworkY=fireworkTarget.y+(fireworkTarget.height??0)+1.4;
  const mounted=performance.now();
  const moveActors=createTraffic(scene.ambient??[],scene.junctions);
  if (target || closeUp && (!reveal || motion.matches || demo&&!scene.world || focusLatest&&!completedBuild&&!scene.roadBuild)) Object.assign(camera,detail);
  else if (reveal&&scene.world) Object.assign(camera,context);
  from={...camera};
  if (marked && !motion.matches) started=performance.now();

  function draw(now=performance.now()) {
    frame=0;
    if (!visible || document.hidden) return;
    width=canvas.clientWidth;
    height=canvas.clientHeight;
    if (!width || !height) return;
    const playing=!motion.matches && started!==null;
    const alive=!still && !motion.matches && (scene.ambient?.length||residents||stars);
    if ((playing||alive||focusTravel) && now-lastFrame<(engine||playing?32:48)) { schedule(); return; }
    lastFrame=now;
    const pixelRatio=Math.min(window.devicePixelRatio||1,2);
    const pixelsWide=Math.round(width*pixelRatio),pixelsHigh=Math.round(height*pixelRatio);
    if (canvas.width!==pixelsWide || canvas.height!==pixelsHigh) {
      canvas.width=pixelsWide;
      canvas.height=pixelsHigh;
    }
    const elapsed=playing ? Math.max(0,now-started) : Infinity;
    if (playing) {
      const finish=completedBuild?finishTransition(elapsed):null;
      const stageTime=elapsed-(scene.roadBuild?ROAD_BUILD_MS:0);
      const ease=finish?.travel??(1-(1-clamp(stageTime/680,0,1))**3);
      for (const key of Object.keys(detail)) {
        const target=key==='yaw'?turnToward(from.yaw,detail.yaw):detail[key];
        camera[key]=from[key]+(target-from[key])*ease;
      }
      if (panorama&&elapsed>2550) {
        const pullBack=clamp((elapsed-2550)/1930,0,1);
        const easeOut=pullBack*pullBack*(3-2*pullBack);
        for (const key of Object.keys(panorama)) camera[key]+=(panorama[key]-camera[key])*easeOut;
      }
      if (finish) canvas.style.opacity=finish.opacity.toFixed(3);
      if (stageTime>=(canCelebrate?fireworksEnd:1950)) stopTransition();
    }
    if (focusTravel) {
      const progress=clamp((now-focusTravel.start)/330,0,1);
      const eased=progress*progress*(3-2*progress);
      for (const key of Object.keys(camera)) {
        const from=focusTravel.from[key];
        camera[key]=from+(focusTravel.to[key]-from)*eased;
      }
      if (progress===1) focusTravel=null;
    }
    const effects=buildMotion(scene.world,elapsed,low,high,marked,scene.roadBuild);
    const age=still||motion.matches?0:Math.max(0,now-mounted)/1000;
    effects.age=age;
    effects.actors=moveActors(age);
    const scale=Math.min(width,height)*camera.zoom/scene.size;
    if (stars) {
      const sky=lunarSkyCamera(camera,scale,age);
      canvas.style.backgroundPosition=`calc(50% + ${sky.x.toFixed(2)}px) calc(50% + ${sky.y.toFixed(2)}px)`;
      canvas.style.backgroundSize=`${sky.width.toFixed(1)}px ${(sky.width*440/640).toFixed(1)}px`;
    }
    const forward=camera.anchorX*Math.sin(camera.yaw)+camera.anchorZ*Math.cos(camera.yaw);
    const position={...camera,
      x:camera.x-(camera.anchorX*Math.cos(camera.yaw)-camera.anchorZ*Math.sin(camera.yaw))*scale,
      y:camera.y-forward*Math.sin(camera.pitch)*scale,
    };
    paint(width,height,position,scale,camera.center,effects);
    if (onInspect) projectedView={camera:position,scale,width,height,effects};
    const projectPoint=(x,y,z)=>{
      const cos=Math.cos(camera.yaw),sin=Math.sin(camera.yaw),depth=x*sin+z*cos;
      return [width*.5+position.x+(x*cos-z*sin)*scale,
        height*.5+position.y-((y-camera.center)*Math.cos(camera.pitch)-depth*Math.sin(camera.pitch))*scale];
    };
    if (interactive&&effects.actors.some(pose=>pose.thought)) {
      thoughts??=canvas.ownerDocument.createElement('div');
      if (!thoughts.parentNode) { thoughts.className='project-thoughts';thoughts.setAttribute('aria-hidden','true');canvas.after(thoughts); }
      while (thoughts.children.length<effects.actors.length) {
        const bubble=canvas.ownerDocument.createElement('span');bubble.textContent='?';thoughts.append(bubble);
      }
    }
    if (thoughts) effects.actors.forEach((pose,i)=>{
      const bubble=thoughts.children[i], [x,y]=projectPoint(pose.x,pose.y+2.25,pose.z);
      bubble.hidden=!pose.thought||x<12||x>width-12||y<14||y>height-12;
      if (!bubble.hidden) bubble.style.transform=`translate(${x.toFixed(1)}px,${y.toFixed(1)}px) translate(-50%,-100%)`;
    });
    if (glow) {
      const key=[width,height,scale,position.x,position.y,position.center,effects.growth,effects.lift,selectedFaces.some(face=>face.group>=2||face.life)?age:0].join(':');
      if (key!==glowKey) {
        glowKey=key;
        glow.setAttribute('viewBox',`0 0 ${width} ${height}`);
        glow.querySelector('path').setAttribute('d',landmarkSilhouette(selectedFaces,projectedView));
      }
    }
    if (canCelebrate&&playing&&elapsed>=FIREWORKS_START&&elapsed<fireworksEnd) {
      fireworks??=createFireworks(canvas,finale);
      const [x,y]=projectPoint(fireworkTarget.x,fireworkY,fireworkTarget.z);
      fireworks?.draw(x,y,width,height,pixelRatio,elapsed);
    }
    if (alive&&onActivity&&now-lastActivity>=200) {
      lastActivity=now;
      const heard=new Set();
      effects.actors.forEach((pose,i)=>{
        if (!pose.sound||pose.y< -150) return;
        const actor=scene.ambient[i];
        const kind=pose.cue??actor.voice??(scene.id==='moon'&&actor.kind==='road'?'rover':nearbySounds[actor.kind]??actor.kind);
        const [x,y]=projectPoint(pose.x,pose.y,pose.z);
        const edge=Math.max(Math.abs(2*x/width-1),Math.abs(2*y/height-1));
        const reach=aircraft.has(kind)?2.1:1.3;
        if (edge>reach) return;
        const cue=`${i}:${kind}`;
        if (audibleActors.has(cue)||onActivity(kind,pose.sound*(1-edge/reach*.5))) heard.add(cue);
      });
      audibleActors=heard;
    }
    if (started!==null || focusTravel || alive) schedule();
  }
  function schedule() {
    if (!frame) frame=requestAnimationFrame(draw);
  }
  function limitPan() {
    camera.x=clamp(camera.x,-width*camera.zoom*.63,width*camera.zoom*.63);
    camera.y=clamp(camera.y,-height*camera.zoom*.63,height*camera.zoom*.63);
  }
  function zoom(factor,x=width/2,y=height/2) {
    const next=clamp(camera.zoom*factor,.75,maxZoom);
    const ratio=next/camera.zoom;
    const dx=scene.world?x-width/2:0,dy=scene.world?y-height/2:0;
    camera.x=dx+(camera.x-dx)*ratio;
    camera.y=dy+(camera.y-dy)*ratio;
    camera.zoom=next;
    limitPan();
  }
  function drag(dx,dy) {
    if (!scene.world) {
      camera.yaw-=dx*.009;
      camera.pitch=clamp(camera.pitch+dy*.006,.06,1.36);
    } else {
      camera.x+=dx;
      camera.y+=dy;
      limitPan();
    }
  }
  function stopTransition() {
    started=null;
    focusTravel=null;
    canvas.style.removeProperty('opacity');
    fireworks?.dispose();
    fireworks=undefined;
  }
  function overview() {
    stopTransition();
    marked=false;
    Object.assign(camera,initial);
  }
  listen(container,'click',event=>{
    if (!event.target.closest('[data-project-latest]')) return;
    stopTransition();
    if (!interactive) canvas.scrollIntoView({block:'nearest'});
    if (completedBuild||scene.roadBuild) Object.assign(camera,context);
    from={...camera};
    marked=true;
    if (motion.matches) Object.assign(camera,detail);
    else started=performance.now();
    schedule();
  });

  if (interactive) {
    let pendingTap=null;
    const position=event=>[event.clientX,event.clientY];
    const midpoint=([a,b],[c,d])=>[(a+c)/2,(b+d)/2];
    const distance=([a,b],[c,d])=>Math.hypot(a-c,b-d);
    listen(canvas,'pointerdown',event=>{
      if (event.button!==0 || pointers.size>=2) return;
      stopTransition();
      pendingTap=null;
      pointers.set(event.pointerId,position(event));
      tap=onInspect&&pointers.size===1?{id:event.pointerId,x:event.clientX,y:event.clientY}:null;
      canvas.setPointerCapture(event.pointerId);
    });
    listen(canvas,'pointermove',event=>{
      const old=pointers.get(event.pointerId);
      if (!old) return;
      const current=position(event);
      if (tap?.id===event.pointerId) {
        if (Math.hypot(event.clientX-tap.x,event.clientY-tap.y)<7) return;
        tap=null;
      }
      if (pointers.size===2) {
        const other=[...pointers].find(([id])=>id!==event.pointerId)[1];
        const [oldX,oldY]=midpoint(old,other),[newX,newY]=midpoint(current,other);
        const bounds=canvas.getBoundingClientRect();
        zoom(distance(current,other)/Math.max(1,distance(old,other)),oldX-bounds.left,oldY-bounds.top);
        if (scene.world) {
          camera.x+=newX-oldX;
          camera.y+=newY-oldY;
          limitPan();
        }
      } else {
        drag(current[0]-old[0],current[1]-old[1]);
      }
      pointers.set(event.pointerId,current);
      schedule();
    });
    const release=event=>{
      pointers.delete(event.pointerId);
      if (tap?.id!==event.pointerId) return;
      const isTap=event.type==='pointerup'&&Math.hypot(event.clientX-tap.x,event.clientY-tap.y)<7;
      tap=null;
      if (isTap) pendingTap=[event.clientX,event.clientY];
    };
    listen(canvas,'click',event=>{
      if (!pendingTap) return;
      const [x,y]=pendingTap;
      pendingTap=null;
      event.preventDefault();
      event.stopPropagation();
      const bounds=canvas.getBoundingClientRect();
      onInspect(entityAt(selectable,projectedView,x-bounds.left-canvas.clientLeft,y-bounds.top-canvas.clientTop,compact?12:6));
    });
    for (const name of ['pointerup','pointercancel','lostpointercapture']) listen(canvas,name,release);
    listen(canvas,'wheel',event=>{
      event.preventDefault();
      stopTransition();
      const bounds=canvas.getBoundingClientRect();
      zoom(Math.exp(-clamp(event.deltaY,-130,130)*.0035),event.clientX-bounds.left,event.clientY-bounds.top);
      schedule();
    },{passive:false});
    listen(canvas,'keydown',event=>{
      const directions={ArrowLeft:[-32,0],ArrowRight:[32,0],ArrowUp:[0,-32],ArrowDown:[0,32]};
      if (Object.hasOwn(directions,event.key)) drag(...directions[event.key]);
      else if (event.key==='+' || event.key==='=') zoom(1.25);
      else if (event.key==='-') zoom(1/1.25);
      else if (event.key==='0') overview();
      else return;
      stopTransition();
      event.preventDefault();
      schedule();
    });
    listen(container,'click',event=>{
      const control=event.target.closest('button');
      if (control?.dataset.projectZoom) { stopTransition(); zoom(Number(control.dataset.projectZoom)); }
      if (control?.hasAttribute('data-project-reset')) overview();
      schedule();
    });
  }
  const observer=typeof ResizeObserver==='function' ? new ResizeObserver(schedule) : null;
  if (observer) observer.observe(canvas);
  else listen(window,'resize',schedule);
  listen(document,'visibilitychange',schedule);
  listen(motion,'change',()=>{
    if (motion.matches && focusTravel) {
      Object.assign(camera,focusTravel.to);
      focusTravel=null;
    }
    if (motion.matches && started!==null) {
      Object.assign(camera,detail);
      stopTransition();
    }
    schedule();
  });
  const intersection=typeof IntersectionObserver==='function' ? new IntersectionObserver(([entry])=>{
    visible=entry.isIntersecting;
    if (visible) schedule();
  }) : null;
  intersection?.observe(canvas);
  draw();
  const dispose=()=>{
    events.abort();
    observer?.disconnect();
    intersection?.disconnect();
    if (frame) cancelAnimationFrame(frame);
    fireworks?.dispose();
    glow?.remove();
    thoughts?.remove();
    engine?.dispose();
  };
  dispose.inspect=(index,{focus=false}={})=>{
    const site=focus&&scene.sites?.[index];
    if (site) {
      stopTransition();
      marked=false;
      const to=projectCameras(scene,site,false,{compact}).detail;
      if (motion.matches) Object.assign(camera,to);
      else focusTravel={from:{...camera},to,start:performance.now()};
    } else if (focus) focusTravel=null;
    selectedFaces=selectable.filter(face=>typeof index==='string'?face.entity===index:face.landmark===index&&!face.entity);
    glow?.remove();
    glow=null;
    glowKey=null;
    if (selectedFaces.length) {
      const id='selection-'+Math.random().toString(36).slice(2);
      const ns='http://www.w3.org/2000/svg';
      glow=canvas.ownerDocument.createElementNS(ns,'svg');
      glow.setAttribute('class','project-inspect-glow');
      glow.setAttribute('aria-hidden','true');
      glow.innerHTML=`<defs><filter id="${id}" x="-50%" y="-50%" width="200%" height="200%">
        <feMorphology in="SourceAlpha" operator="dilate" radius="2" result="edge"/>
        <feComposite in="edge" in2="SourceAlpha" operator="out" result="outline"/>
        <feFlood flood-color="#fff0a8"/><feComposite in2="outline" operator="in"/>
      </filter></defs><path fill="white" filter="url(#${id})"/>`;
      canvas.after(glow);
    }
    schedule();
  };
  return dispose;
}
