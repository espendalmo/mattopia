import {beam,box,dome,tube,tunnelLandform} from './scenery.js';
import {regionSurface,roadElevation,riverAt,riverWidth} from './regions.js';
import {STREET_TURN_RADIUS} from './street-grid.js';

const STREET_TONES={
  city:['#c3c4ad','#647686','#f4edda'],
  island:['#e3cfa6','#c3a478','#f6dfb8'],
  moon:['#b7b4c6','#767d9d','#e1e3f1'],
};
const BRIDGE_TONES=['#d6bea3','#9f8775'];
const key=({x,z})=>`${x}:${z}`;
const length=(a,b)=>Math.hypot(b.x-a.x,b.z-a.z);
const perpendicular=([ax,az],[bx,bz])=>ax*bx+az*bz===0;

// The two street legs meet a circular bend at its tangents.
function streetArc({x,z},[ax,az],[bx,bz],radius,offset=radius,segments=8) {
  return Array.from({length:segments+1},(_,i)=>{
    const angle=i*Math.PI/2/segments;
    const a=offset-radius*Math.sin(angle),b=offset-radius*Math.cos(angle);
    return {x:x+ax*a+bx*b,z:z+az*a+bz*b,
      tangent:[-ax*Math.cos(angle)+bx*Math.sin(angle),-az*Math.cos(angle)+bz*Math.sin(angle)]};
  });
}

export function roundedStreetPaths(plan) {
  const corners=new Map((plan.junctions??[]).filter(({arms,connector})=>
    !connector&&arms.length===2&&perpendicular(...arms)).map(node=>[key(node),node]));
  if (!corners.size) return plan.paths;

  const trimmed=plan.paths.map(path=>{
    if (path.length<2) return path;
    const first=path[0],last=path.at(-1);
    const trim=(point,other)=>{
      if (!corners.has(key(point))) return point;
      const scale=STREET_TURN_RADIUS/length(point,other);
      return {x:point.x+(other.x-point.x)*scale,z:point.z+(other.z-point.z)*scale};
    };
    const start=trim(first,last),end=trim(last,first);
    return [start,...path.slice(1,-1).filter(point=>
      (start===first||length(first,point)>STREET_TURN_RADIUS+.001)&&
      (end===last||length(last,point)>STREET_TURN_RADIUS+.001)),end];
  });
  return trimmed.concat([...corners.values()].map(node=>streetArc(node,...node.arms,STREET_TURN_RADIUS)));
}

function surface(outline,color,layer) {
  const [x,y,z]=outline[0];
  return {shape:'terrain',outline,color,layer,x,y,z,h:0};
}

function measureRoad(layout,path,elevation=(x,z)=>roadElevation(layout,x,z)) {
  const distinct=path.filter((point,i)=>!i||length(path[i-1],point)>.0001);
  let distance=0;
  return distinct.map((point,i)=>{
    const prev=distinct[Math.max(0,i-1)],next=distinct[Math.min(distinct.length-1,i+1)];
    const span=length(prev,next);
    if (i) distance+=length(prev,point);
    return {...point,y:point.y??elevation(point.x,point.z),distance,
      tangent:point.tangent??(span?[(next.x-prev.x)/span,(next.z-prev.z)/span]:[1,0])};
  });
}

function across({x,y,z,tangent:[dx,dz]},half,lift) {
  return [[x-dz*half,y+lift,z+dx*half],[x+dz*half,y+lift,z-dx*half]];
}

function rise(a,b,c) {
  return (b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2]);
}

function strip(a,b,half,lift,color,layer) {
  const [left,right]=across(a,half,lift),[nextLeft,nextRight]=across(b,half,lift);
  const outline=[nextLeft,nextRight,right,left];
  // Tight bends on older routes and pier approaches can cross their own offsets.
  if (rise(nextLeft,nextRight,right)<=0||rise(nextLeft,right,left)<=0) {
    const x=outline.reduce((sum,point)=>sum+point[0],0)/4,z=outline.reduce((sum,point)=>sum+point[2],0)/4;
    const angle=point=>Math.atan2(point[2]-z,point[0]-x);
    outline.sort((a,b)=>angle(b)-angle(a));
  }
  return surface(outline,color,layer);
}

function along(a,b,distance) {
  const t=(distance-a.distance)/(b.distance-a.distance);
  const mix=(start,end)=>start+(end-start)*t;
  const dx=mix(a.tangent[0],b.tangent[0]),dz=mix(a.tangent[1],b.tangent[1]);
  const span=Math.hypot(dx,dz);
  return {x:mix(a.x,b.x),y:mix(a.y,b.y),z:mix(a.z,b.z),
    tangent:span?[dx/span,dz/span]:a.tangent};
}

function laneMarkings(road,color,crossings=[],from=0,to=road.at(-1).distance) {
  const parts=[];
  const total=road.at(-1).distance;
  const dash=1.45,period=3.8;
  const count=Math.max(0,1+Math.floor((total-dash-.68)/period));
  const first=(total-((count-1)*period+dash))/2;
  for (let i=0,segment=1;i<count;i++) {
    const start=first+i*period,end=start+dash;
    if (start<from||end>to||crossings.some(crossing=>start<crossing+.75&&end>crossing-.75)) continue;
    while (road[segment].distance<start) segment++;
    while (road[segment-1].distance<end) {
      const a=road[segment-1],b=road[segment];
      const left=along(a,b,Math.max(start,a.distance)),right=along(a,b,Math.min(end,b.distance));
      if (length(left,right)>.0001) parts.push(strip(left,right,.071,.014,color,5));
      if (b.distance>=end) break;
      segment++;
    }
  }
  return parts;
}

function roadPoint(road,distance) {
  const i=road.findIndex(point=>point.distance>=distance);
  if (i===0) return road[0];
  if (i===-1) return road.at(-1);
  return along(road[i-1],road[i],distance);
}

function offsetPoint(point,side) {
  const [dx,dz]=point.tangent;
  return {...point,x:point.x-dz*side,z:point.z+dx*side};
}

function zebra(road,distance,width,color) {
  const a=roadPoint(road,distance-.37),b=roadPoint(road,distance+.37);
  return Array.from({length:6},(_,i)=>{
    const offset=(i-2.5)*width*.295;
    return strip(offsetPoint(a,offset),offsetPoint(b,offset),width*.086,.024,color,5);
  });
}

function roadSeed(layout,road) {
  const a=road[0],b=road.at(-1);
  return (layout.seed^Math.imul(Math.round(a.x*13+b.z*71),0x45d9f3b)^Math.imul(Math.round(a.z*19+b.x*89),0x27d4eb2d))>>>0;
}

function streetFurniture(layout,plan,road,width,seed) {
  const total=road.at(-1).distance, parts=[];
  const theme=layout.theme;
  for (let distance=4.15+(seed%4)*.62,i=0;distance<total-2.9;distance+=7.7,i++) {
    const side=(seed+i)%2===0?1:-1;
    const center=roadPoint(road,distance);
    const {x,z}=offsetPoint(center,side*(width+.83));
    const ground=regionSurface(layout,x,z),y=ground.y;
    if (ground.water||ground.bank<.58||plan.inRoadTunnel?.(x,z)||plan.plots.some(site=>Math.hypot(x-site.x,z-site.z)<5.96)) continue;
    if (theme!=='moon'&&(seed+i*5)%4===1) {
      const tropical=theme==='island';
      parts.push(tube(x,z,.21,.23,1.54,'#977b61',y),
        dome(x,z,tropical?1.75:1.38,1.3,tropical?.44:1.22,tropical?'#72a676':'#789d6d',y+1.48),
        dome(x+.26,z-.16,1.04,.85,.56,'#8bb081',y+1.81));
    } else {
      const top=y+(theme==='moon'?1.45:2.43),[u,v]=center.tangent;
      const hx=x+v*side*.47,hz=z-u*side*.47;
      const metal=theme==='moon'?'#8995b0':'#72817e';
      parts.push(tube(x,z,.22,.22,.11,metal,y),tube(x,z,.106,.105,top-y,metal,y),
        beam([x,top-.22,z],[hx,top,hz],.083,metal),box(hx,hz,.34,.25,.10,'#f6e2a9',top-.035));
    }
  }
  return parts;
}

function overRiver(layout,a,b) {
  if (layout.theme!=='city') return false;
  const z=(a.z+b.z)*.5,x=(a.x+b.x)*.5;
  return Math.abs(x-riverAt(layout,z))<riverWidth(layout,z)+.78&&Math.abs(z-layout.berths.bridge.z)>5.6;
}

function bridgeSpan(a,b,width,pier) {
  const rims=across(a,width+.18,-.09);
  const end=across(b,width+.18,-.09);
  const rails=across(a,width+.19,.39),railEnd=across(b,width+.19,.39);
  const parts=rims.flatMap((point,i)=>[
    beam(point,end[i],.26,'#96796e'),
    beam(rails[i],railEnd[i],.13,'#efdbc2'),
    beam([rails[i][0],rails[i][1]-.15,rails[i][2]],[railEnd[i][0],railEnd[i][1]-.15,railEnd[i][2]],.075,'#b79479'),
  ]);
  parts.push(...rims.map(([x,y,z])=>box(x,z,.2,.2,.49,'#d1b39b',y+.01)));
  if (pier) parts.push(...rims.map(([x,y,z])=>box(x,z,.46,.46,.37,'#997f78',Math.min(0,y-.29))));
  return parts;
}

function pavedRoute(layout,path,width,{junctions,plan,stage}={}) {
  const road=measureRoad(layout,path,plan?.streetElevation);
  if (road.length<2) return [];
  const [curb,asphalt,mark]=STREET_TONES[layout.theme];
  const parts=[],total=road.at(-1).distance;
  const junctionStart=junctions?.has(key(path[0])),junctionEnd=junctions?.has(key(path.at(-1)));
  const edgeStart=junctionStart?width+1.1:0,edgeEnd=junctionEnd?total-width-1.1:total;
  const seed=roadSeed(layout,road);
  const crossings=[];
  if (junctionStart&&total>7) crossings.push(width+1.56);
  if (junctionEnd&&total>9) crossings.push(total-width-1.56);
  if (!crossings.length&&total>10&&seed%5===2&&plan) crossings.push(total*(.39+(seed%9)*.018));
  const allowed=crossings.filter(distance=>{
    const a=roadPoint(road,distance-.45),b=roadPoint(road,distance+.45);
    return !overRiver(layout,a,b)&&!regionSurface(layout,a.x,a.z).water&&!regionSurface(layout,b.x,b.z).water;
  });
  const paint=(items,fraction)=>{
    const end=stage?.(fraction);
    parts.push(...(end===undefined?items:items.map(item=>({...item,roadBuild:end}))));
  };
  let span=0;
  for (let i=1;i<road.length;i++) {
    const a=road[i-1],b=road[i];
    const bridge=overRiver(layout,a,b);
    const [edge,color]=bridge?BRIDGE_TONES:[curb,asphalt];
    const work=[strip(a,b,width,0,color,4)];
    const curbStart=Math.max(a.distance,edgeStart),curbEnd=Math.min(b.distance,edgeEnd);
    if (bridge||curbEnd-curbStart>.002) {
      work.push(strip(bridge?a:along(a,b,curbStart),bridge?b:along(a,b,curbEnd),width+.28,-.042,edge,3));
    }
    if (bridge) {
      work.push(...bridgeSpan(a,b,width,span%3===1));
      if (i===road.length-1||!overRiver(layout,b,road[i+1])) {
        work.push(...across(b,width+.19,0).map(([x,y,z])=>box(x,z,.2,.2,.42,'#d1b39b',y)));
      }
    }
    paint(work,(a.distance+b.distance)*.5/total);
    span=bridge?span+1:0;
  }
  if (layout.theme!=='island') paint(laneMarkings(road,mark,allowed,edgeStart,edgeEnd),1);
  for (const crossing of allowed) paint(zebra(road,crossing,width,mark),1);
  if (plan&&total>6.8) paint(streetFurniture(layout,plan,road,width,seed),1);
  return parts;
}

function intersections(layout,junctions,width) {
  const [,road]=STREET_TONES[layout.theme];
  const fillet=.86;
  return junctions.flatMap(node=>{
    const {arms,connector}=node;
    if (arms.length<3&&!connector) return [];
    const cap=arms.flatMap((a,i)=>arms.slice(i+1).filter(b=>perpendicular(a,b)).flatMap(b=>{
      const [ax,az]=a,[bx,bz]=b;
      const center={x:node.x+(ax+bx)*width,z:node.z+(az+bz)*width};
      const point=({x,z})=>[x,roadElevation(layout,x,z)+.009,z];
      const rim=streetArc(node,a,b,fillet,width+fillet,5);
      return rim.slice(1).map((end,j)=>{
        const triangle=[point(center),point(rim[j]),point(end)];
        return surface(ax*bz-az*bx<0?triangle:triangle.reverse(),road,4);
      });
    }));
    return cap;
  });
}

export function prepareRoadTunnels(layout,plan) {
  if (layout.theme==='island'||plan.plots.length<4) return [];
  const mouth=3.55,approach=5.8;
  const candidates=plan.paths.flatMap(path=>{
    const first=path[0],last=path.at(-1);
    const span=length(first,last);
    if (span<13||Math.min(Math.abs(first.x-last.x),Math.abs(first.z-last.z))>.001
      ||path.some(point=>regionSurface(layout,point.x,point.z).water)) return [];
    const dx=(last.x-first.x)/span,dz=(last.z-first.z)/span;
    const x=(first.x+last.x)/2,z=(first.z+last.z)/2;
    const heights=[-approach,-mouth,mouth,approach].map(d=>roadElevation(layout,x+dx*d,z+dz*d));
    if (Math.max(...heights)-Math.min(...heights)>.39
      ||plan.plots.some(plot=>Math.hypot(x-plot.x,z-plot.z)<6.3)
      ||plan.transitPortals?.some(portal=>Math.hypot(x-portal.x,z-portal.z)<12)) return [];
    const seed=(Math.imul(Math.round(x*100),19)^Math.imul(Math.round(z*100),37)^layout.seed)>>>0;
    const relief=regionSurface(layout,x,z).relief;
    const level=(heights[0]+heights[3])*.5;
    return relief>.54&&seed%7<4?[{x,z,dx,dz,level,path}]:[];
  });
  const selected=candidates.slice(0,plan.plots.length>=14?2:1);
  if (!selected.length) return [];
  const profile=(x,z,halfWidth)=>{
    for (const {x:cx,z:cz,dx,dz,level} of selected) {
      const along=Math.abs((x-cx)*dx+(z-cz)*dz);
      const across=Math.abs((x-cx)*dz-(z-cz)*dx);
      if (along<approach&&across<halfWidth) {
        const t=Math.min(1,(approach-along)/(approach-mouth-.55));
        return {level,mix:t*t*(3-2*t)};
      }
    }
    return null;
  };
  plan.tunnelPaths=new Set(selected.map(tunnel=>tunnel.path));
  plan.inRoadTunnel=(x,z)=>Boolean(profile(x,z,3.4));
  plan.streetElevation=(x,z)=>{
    const natural=roadElevation(layout,x,z);
    const grade=profile(x,z,1.58);
    return grade?natural+(grade.level-natural)*grade.mix:natural;
  };
  plan.streetGround=(x,z,natural)=>{
    const grade=profile(x,z,3.4);
    return grade?natural-Math.max(0,natural-(grade.level-.14))*grade.mix:natural;
  };
  return selected.flatMap(({x,z,dx,dz,level})=>{
    const path=Array.from({length:9},(_,i)=>{
      const offset=(i/4-1)*mouth;
      return [x+dx*offset,level,z+dz*offset];
    });
    return tunnelLandform(path,layout,{width:1.6,height:1.64}).map(part=>({...part,tunnel:'road'}));
  });
}

export function regionRoads(layout,plan,animate=false) {
  const width=layout.theme==='island'?1.02:1.22;
  const nodes=plan.junctions??[];
  const junctions=new Set(nodes.filter(node=>node.arms.length>=3||node.connector).map(key));
  const additions=new Map(animate?[...(plan.latestPaths??[])]:[]);
  const finalAccess=animate&&plan.approaches?.find(access=>access.latest);
  const count=additions.size+Number(Boolean(finalAccess));
  let order=0;
  for (const [path,reverse] of additions) additions.set(path,{index:order++,reverse});
  const paths=roundedStreetPaths(plan).flatMap((path,i)=>{
    const work=additions.get(plan.paths[i]);
    const stage=work&&((t)=>(work.index+(work.reverse&&t!==1?1-t:t))/count);
    const fine=plan.tunnelPaths?.has(plan.paths[i])?path.flatMap((point,j)=>{
      if (!j) return [point];
      const before=path[j-1],count=Math.ceil(length(before,point)/.5);
      return Array.from({length:count},(_,k)=>{
        const t=(k+1)/count;
        return t===1?point:{x:before.x+(point.x-before.x)*t,z:before.z+(point.z-before.z)*t};
      });
    }):path;
    return pavedRoute(layout,fine,width,{junctions,plan:plan.plots?plan:null,stage});
  });
  for (const {path,drive,latest} of plan.approaches??[]) {
    const road=measureRoad(layout,path),half=drive?.61:.38,color=drive?'#a7a699':'#d3c09e';
    for (let i=1;i<road.length;i++) {
      const part=strip(road[i-1],road[i],half,.014,color,4.3);
      if (animate&&latest) part.roadBuild=(count-1+i/(road.length-1))/count;
      paths.push(part);
    }
  }
  return [...paths,...intersections(layout,nodes,width)];
}
