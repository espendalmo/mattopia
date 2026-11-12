import {box,dome,tube,beam,pointOnSite,placeParts,regionActors,parkingTours,driveThroughApproach,actor,visitor,MAX_ACTORS} from './scenery.js';
import {regionLayout,planRegion,regionVisibility,regionSurface,regionalFootprint,residenceDrive,RESIDENCE_PLOT} from './regions.js';
import {REGION_PLACES,WORLD_BUILD_STEPS,grandCatalog,hasExpandedCatalog,randomGenerator,worldStatus} from './worlds.js';
import {planStreetRegion} from './street-grid.js';
import {prepareRoadTunnels,regionRoads,streetHalfWidth} from './region-roads.js';
import {roadProjections} from './street-network.js';
import {constructionYard,landmarkVisitors,lunarEarth,rideModels,resortBeach} from './map-art.js';
import {plotAccess,terrainFoundation} from './landmark-ground.js';
import {districtRail,districtTram,helicopterModels} from './transport.js';
import {regionalHeadquarters} from './world-landmarks.js';
import {isSlidePark} from './slide-parks.js';
import {planRoadworks} from './roadworks.js';
import {terrainDiscoveries,discoveryGuides,mineTerrain} from './map-discoveries.js';

const SHADES={
  city:{ground:'#93ae77',shade:'#628c68',high:'#b2bd81',bank:'#c6c295',deep:'#5a93a8',shallow:'#85c5bf'},
  island:{ground:'#9ab980',shade:'#659570',high:'#bbc284',bank:'#ead1a1',deep:'#4d9eac',shallow:'#91d3c4'},
  moon:{ground:'#9f9eb8',shade:'#737492',high:'#c1b6c8',bank:'#b3abc5',deep:'#6d789e',shallow:'#9eabc9'},
};
const clamp=(v,min=0,max=1)=>Math.max(min,Math.min(max,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const colorCache=new Map();
function rgb(hex) {
  if (!colorCache.has(hex)) colorCache.set(hex,hex.slice(1).match(/../g).map(value=>parseInt(value,16)/255));
  return colorCache.get(hex);
}
function blend(a,b,t) { return a.map((value,i)=>lerp(value,b[i],t)); }

function face(outline,color,layer,colors) {
  const [x,y,z]=outline[0];
  return {shape:'terrain',outline,color,colors,x,y,z,h:0,layer};
}

function surfaceColor(tile,layout,season) {
  const palette=SHADES[layout.theme];
  const variation=clamp(.52+tile.detail*.27);
  if (tile.water) {
    if (layout.grand&&tile.pond&&layout.theme!=='moon') {
      const deep=rgb(layout.theme==='island'?'#397f88':'#427c89'), rim=rgb(layout.theme==='island'?'#80c4a3':'#7cb5a2');
      const shallow=clamp(1+tile.bank/3.35);
      return blend(deep,rim,shallow*.77+variation*.12);
    }
    const shallow=clamp(1+tile.bank/(layout.theme==='island'?11:4.7));
    const water=blend(rgb(palette.deep),rgb(palette.shallow),shallow*.88+variation*.10);
    return blend(water,rgb(palette.bank),clamp(1+tile.bank/.89)*.5);
  }
  let ground=blend(rgb(palette.shade),rgb(palette.ground),variation*.45+.4);
  ground=blend(ground,rgb(palette.high),clamp(tile.relief*.083+variation*.37));
  if (layout.theme==='city') {
    if (season==='winter'||season==='christmas') ground=blend(ground,rgb('#e4e8de'),.39+variation*.19);
    else if (season==='autumn'||season==='halloween') ground=blend(ground,rgb('#bcab78'),.2);
    else if (season==='spring'||season==='easter') ground=blend(ground,rgb('#adbf89'),.14);
  }
  if (layout.theme==='moon'&&tile.basin<0) {
    ground=blend(ground,rgb(palette.shade),clamp(-tile.basin*.095+.2));
  }
  const beach=clamp(1-tile.bank/(layout.theme==='island'?3.8:layout.grand&&tile.pond?2.18:1.22));
  return blend(ground,rgb(palette.bank),beach*.88);
}

function smooth(value) {
  const t=clamp(value);
  return t*t*(3-2*t);
}

function distantRelief(layout) {
  const rng=randomGenerator(layout.seed^0x18a32df7);
  const theme=layout.theme;
  const ranges=theme==='city'?[
    ...[-40,-25,-9,8,23,41,61,80].map(x=>[x,-87]),
    ...[-62,-43,-22,-4,19,43].map(z=>[86,z]),
  ]:theme==='island'?[[-40,-88],[-51,-89],[82,-28],[89,-20],[91,24]]
    :[[-50,-83],[-18,-88],[20,-88],[53,-84],[86,-42],[87,-6],[90,35]];
  const sites=ranges.map(([x,z])=>({
    x:x+(rng()-.5)*9,z:z+(rng()-.5)*9,
    radius:theme==='island'?6.5+rng()*7:12+rng()*9,
    height:theme==='city'?8+rng()*19:theme==='island'?1.9+rng()*3.1:2.1+rng()*2.9,
  }));
  return (x,z,tile)=>{
    const outer=smooth((Math.max(x,-z)-66)/16);
    if (!outer) return {height:0,tint:0,color:null};
    let height=0;
    for (const site of sites) {
      const distance=Math.hypot((x-site.x)/site.radius,(z-site.z)/site.radius);
      if (theme==='moon') {
        const rim=Math.exp(-(((distance-.82)/.25)**2));
        height+=site.height*(rim-.42*Math.max(0,1-distance/.67));
      } else height=Math.max(height,site.height*Math.max(0,1-distance)**.88);
    }
    if (theme==='city') {
      const peak=height*outer*(tile.water?0:1);
      const tint=smooth(peak/7)*.79;
      const color=blend(rgb('#859fa4'),rgb('#d8ded1'),smooth((peak-6+tile.detail*2)/12));
      return {height:peak,tint,color};
    }
    if (theme==='island') {
      const island=height*outer;
      const reef=blend(rgb('#6aacb1'),rgb('#a1c9b2'),smooth((island+tile.detail*.3)/3.2));
      return {height:island,tint:outer*.78,color:reef};
    }
    const rock=blend(rgb('#8085a6'),rgb('#b3b2c9'),clamp(.46+height*.13+tile.detail*.15));
    return {height:height*outer,tint:outer*.83,color:rock};
  };
}

function regionGround(layout,plan,sky,full,horizon,season,discoveries) {
  const background=rgb(sky);
  const inner=Math.sqrt(layout.grid.length);
  const extension=[3,7,12,18,25,33,42,51];
  const extra=extension.length,row=inner+2*extra;
  const edge=layout.grid[inner-1].x;
  const coords=[...extension.map(distance=>-edge-distance).reverse(),...layout.grid.slice(0,inner).map(tile=>tile.x),
    ...extension.map(distance=>edge+distance)];
  const relief=horizon?distantRelief(layout):null;
  const airfields=plan.plots.filter(plot=>plot.airfield);
  const resort=plan.plots.find(plot=>plot.beach);
  const estate=plan.plots.find(plot=>plot.residence&&plot.gradeCut>.012);
  const beachSand=rgb('#ebd1a2');
  const mines=discoveries.filter(site=>site.type.mine);
  const outerRoads=horizon?[...plan.paths.flat(),...(plan.transit??[])].filter(p=>Math.max(Math.abs(p.x),Math.abs(p.z))>59):[];
  const grid=Array.from({length:row*row},(_,i)=>{
    const col=i%row,line=Math.floor(i/row);
    const x=coords[col],z=coords[line];
    const tile=col>=extra&&col<row-extra&&line>=extra&&line<row-extra
      ?layout.grid[(line-extra)*inner+col-extra]:regionSurface(layout,x,z);
    const angle=Math.atan2(z,x);
    const radius=112+7*Math.sin(angle*3+layout.phase)+4.5*Math.cos(angle*5-layout.phase);
    const distance=Math.hypot(x,z);
    const rim=smooth((radius-distance)/38);
    const airfieldReach=airfields.reduce((reach,site)=>Math.max(reach,smooth((23-Math.hypot(x-site.x,z-site.z))/8)),0);
    const edgeFade=Math.max(smooth((radius+15-distance)/21),airfieldReach);
    const visibility=edgeFade*Math.max((.24+.57*horizon)*rim,regionVisibility(plan,x,z,full));
    let base=surfaceColor(tile,layout,season);
    if (resort&&!tile.water) {
      const a=x-resort.x,b=z-resort.z,c=Math.cos(resort.yaw),s=Math.sin(resort.yaw);
      const side=Math.abs(a*c-b*s),seaward=a*s+b*c;
      const sand=smooth((16.9-side)/4)*smooth((seaward-5.4)/3.5)*smooth((10-tile.bank)/6.5);
      base=blend(base,beachSand,sand);
    }
    const distant=relief?.(x,z,tile);
    const color=distant?.tint?blend(base,distant.color,distant.tint*horizon):base;
    let ground=plan.streetGround?.(x,z,tile.y)??tile.y;
    const reliefFactor=distant?.height&&outerRoads.length
      ?smooth((Math.sqrt(outerRoads.reduce((near,p)=>Math.min(near,(x-p.x)**2+(z-p.z)**2),100))-3.3)/5.4):1;
    ground+=(distant?.height??0)*horizon*reliefFactor;
    if (estate&&ground>estate.y+.012) {
      const dx=x-estate.x,dz=z-estate.z,turned=Math.abs(Math.sin(estate.yaw))>.5;
      const beyond=Math.max(Math.abs(turned?dz:dx)-estate.halfWidth,Math.abs(turned?dx:dz)-estate.halfDepth);
      ground-=(ground-estate.y-.012)*smooth(1-Math.max(0,beyond)/2.15);
    }
    for (const site of airfields) {
      const a=x-site.x,b=z-site.z,c=Math.cos(site.yaw),s=Math.sin(site.yaw);
      const beyond=Math.max(Math.abs(a*c-b*s)-12.4,Math.abs(a*s+b*c)-8.4);
      ground-=Math.max(0,ground-(site.y-.14))*smooth((4-beyond)/4);
    }
    return {point:[x,ground,z],color:blend(background,color,visibility),visibility};
  });
  const ground=[];
  const addTriangle=triangle=>{
    const part=face(triangle.map(v=>v.point),sky,0,triangle.map(v=>v.color));
    if (layout.theme==='moon') part.opacity=triangle.map(v=>v.visibility);
    ground.push(part);
  };
  for (let i=0;i<grid.length-row;i++) {
    if (i%row===row-1) continue;
    const [a,b,c,d]=[grid[i],grid[i+1],grid[i+row],grid[i+row+1]];
    if (Math.max(a.visibility,b.visibility,c.visibility,d.visibility)<.008) continue;
    const nearby=mines.filter(site=>site.x>a.point[0]-6&&site.x<b.point[0]+6&&site.z>a.point[2]-6&&site.z<c.point[2]+6);
    if (!nearby.length) {
      addTriangle([a,c,b]); addTriangle([b,c,d]);
      continue;
    }
    const refined=Array.from({length:25},(_,j)=>{
      const u=(j%5)/4,v=Math.floor(j/5)/4;
      const x=lerp(a.point[0],b.point[0],u),z=lerp(a.point[2],c.point[2],v);
      const base=lerp(lerp(a.point[1],b.point[1],u),lerp(c.point[1],d.point[1],u),v);
      const offset=nearby.reduce((height,site)=>height+mineTerrain(site,x,z),0);
      const color=blend(blend(a.color,b.color,u),blend(c.color,d.color,u),v);
      return {point:[x,base+offset,z],color:blend(color,rgb(layout.theme==='moon'?'#82788d':'#8e826d'),clamp(Math.abs(offset)*.12)),
        visibility:lerp(lerp(a.visibility,b.visibility,u),lerp(c.visibility,d.visibility,u),v)};
    });
    for (let j=0;j<20;j++) {
      if (j%5===4) continue;
      addTriangle([refined[j],refined[j+5],refined[j+1]]);
      addTriangle([refined[j+1],refined[j+5],refined[j+6]]);
    }
  }
  return ground;
}

function groundShadow(layout,x,z,rx,rz,amount=.23,corners=8,season) {
  const tint=layout.theme==='moon'?[.37,.39,.53]:[.33,.42,.39];
  const make=(dx,dz,strength)=>{
    const a=x+dx,b=z+dz;
    const tile=regionSurface(layout,a,b);
    return {point:[a,tile.y+.035,b],color:blend(surfaceColor(tile,layout,season),tint,strength)};
  };
  const points=Array.from({length:corners},(_,i)=>{
    const a=-i*Math.PI*2/corners,c=Math.cos(a),s=Math.sin(a);
    return [make(rx*c,rz*s,0),make(rx*c*.67,rz*s*.67,amount*.79)];
  });
  const center=make(0,0,amount);
  const triangles=points.flatMap(([edge,inside],i)=>{
    const [next,inner]=points[(i+1)%points.length];
    return [[center,inside,inner],[inside,edge,next],[inside,next,inner]];
  });
  return triangles.map(triangle=>face(triangle.map(v=>v.point),'#81927f',2,triangle.map(v=>v.color)));
}

function naturePlant(theme,x,y,z,rng,season) {
  const height=1.65+rng()*1.72;
  const kind=rng(),lean=.12+rng()*.43;
  const stem=beam([x,y,z],[x+lean,y+height,z+.05],kind>.72?.17:.24,'#9c7857');
  if (theme==='island'&&kind<.72) {
    const fan=kind<.26,count=fan?7:5;
    return [stem,...Array.from({length:count},(_,i)=>{
      const a=i*2*Math.PI/count+.2;
      return dome(x+lean+.67*Math.cos(a),z+.06+.67*Math.sin(a),fan?1.52:2.06,fan?.73:.43,.33,
        i%2?'#83b96c':'#4e996e',y+height-.15,a);
    }),...[-.18,.11,.31].map(dx=>dome(x+lean+dx,z+.13,.28,.28,.29,'#b88b5d',y+height-.22))];
  }
  if (theme==='city'&&kind<.24) {
    const cones=[0,1,2].map(i=>({
      ...dome(x+lean*.4,z,2.05-i*.44,1.96-i*.42,.93,'#528668',y+height-.92+i*.58),
    }));
    return [stem,...cones];
  }
  const autumn=season==='autumn'||season==='halloween';
  const winter=season==='winter'||season==='christmas';
  const tones=theme==='island'?['#5d9b6d','#7eab69','#9fb96d']
    :autumn&&kind>.36?['#a08553','#b99c59','#c4a96a']
    :winter?['#779581','#9eb29f','#dce4d6']
    :kind>.72?['#7a9b56','#9cb471','#b0bf7e']:['#4d8b60','#6da26a','#8db573'];
  return [stem,...[[-.5,0,0],[.49,-.31,.27],[.02,.38,.43]].map(([dx,dz,dy],i)=>
    dome(x+lean+dx,z+dz,1.78-i*.09,1.53,1.01+i*.22,tones[i],y+height-.59+dy))];
}

function roughRocks(theme,x,y,z,rng) {
  const tone=theme==='moon'?['#727e9d','#9b9fb8','#b0adc3']:['#849184','#b3ab91','#a5a795'];
  return Array.from({length:2+Math.floor(rng()*3)},(_,i)=>{
    const angle=rng()*6.28,rad=rng()*1.5,scale=.43+rng()*1.5;
    return {...dome(x+Math.cos(angle)*rad,z+Math.sin(angle)*rad,scale*1.53,scale,.24+scale*.56,tone[i%3],y-.065,angle),
      shape:'boulder',phase:rng()*6.28};
  });
}

function smallCrater(layout,tile,visibility,sky,rng) {
  const {x,z}=tile,radius=1.42+rng()*1.13,oval=.74+rng()*.26;
  const count=10,phase=rng()*Math.PI*2,background=rgb(sky);
  const vertex=(dx,dz,height,tint,shade)=>{
    const a=x+dx,b=z+dz,ground=regionSurface(layout,a,b);
    const color=blend(surfaceColor(ground,layout),rgb(tint),shade);
    return {point:[a,ground.y+height,b],color:blend(background,color,visibility)};
  };
  const rings=[[1,.038,'#a4a7bf',.19],[.76,.34,'#c9c5d5',.67],[.49,.09,'#656d8e',.57]].map(([size,height,tint,shade])=>
    Array.from({length:count},(_,i)=>{
      const angle=phase-i*Math.PI*2/count;
      const r=radius*size*(1+.076*Math.sin(i*5.27+phase));
      const dx=Math.cos(angle),dz=Math.sin(angle);
      return vertex(dx*r,dz*r*oval,height*(1+.24*Math.sin(i*1.73+phase)),tint,shade*(.86-.14*dx+.06*dz));
    }));
  const center=vertex(0,0,.075,'#777e9c',.68);
  const triangle=(...vertices)=>face(vertices.map(v=>v.point),sky,1.4,vertices.map(v=>v.color));
  return rings.flatMap((ring,j)=>ring.flatMap((point,i)=>{
    const next=(i+1)%count,inner=rings[j+1];
    return inner?[triangle(point,ring[next],inner[i]),triangle(ring[next],inner[next],inner[i])]
      :[triangle(center,point,ring[next])];
  }));
}

function landscapeDetails(layout,plan,full,sky,season,finds) {
  const {theme,seed}=layout;
  const rng=randomGenerator((seed^0x36a9bf)>>>0);
  const spread=Array.from({length:320},()=>({x:(rng()-.5)*144,z:(rng()-.5)*135,seed:Math.floor(rng()*2**32)}));
  const marks=[];
  const routes=plan.paths.flat();
  for (const {x,z,seed:spotSeed} of spread) {
    if (finds.some(site=>Math.hypot(x-site.x,z-site.z)<3.45)) continue;
    const visibility=regionVisibility(plan,x,z,full);
    if (visibility<.27) continue;
    const random=randomGenerator(spotSeed);
    const tile=regionSurface(layout,x,z);
    if (tile.water) {
      if (visibility<.62||tile.bank< -17) continue;
      marks.push({...box(x,z,.83+random()*1.36,.065,.008,theme==='island'?'#b9dfd8':'#a1cbca',tile.y+.014),layer:2,fog:1-visibility});
      continue;
    }
    if (plan.plots.some(plot=>plot.halfWidth&&regionalFootprint(plot,x,z,1.3))
      ||plan.footpaths?.some(path=>path.some(point=>Math.hypot(x-point.x,z-point.z)<1.1))) continue;
    if (plan.plots.some(plot=>plot.beach&&Math.hypot(x-plot.x,z-plot.z)<24&&tile.bank<9.8)) continue;
    if (tile.bank>1.35 && visibility>.38) {
      const ring=Array.from({length:7},(_,i)=>{
        const angle=-i*Math.PI*2/7, width=.58+random()*.61;
        const a=x+Math.cos(angle)*width,b=z+Math.sin(angle)*width*.68;
        return [a,regionSurface(layout,a,b).y+.019,b];
      });
      marks.push({shape:'landscape',outline:ring,x,z,y:tile.y+.019,h:0,
        color:theme==='moon'?'#a6a3bd':theme==='island'?'#99b983':'#98ae7c',layer:1,fog:1-visibility});
    }
    if ([plan.origin,...plan.plots].some(site=>Math.hypot(x-site.x,z-site.z)<6.55) ||
      Object.values(layout.berths).some(site=>Math.hypot(x-site.x,z-site.z)<(site.span??8.5)) ||
      routes.some(point=>Math.hypot(x-point.x,z-point.z)<2.18)) continue;
    if (theme==='moon'&&spotSeed%4===0&&tile.basin>.7&&
      plan.plots.every(site=>Math.hypot(x-site.x,z-site.z)>7.55)&&
      routes.every(point=>Math.hypot(x-point.x,z-point.z)>4.35)) {
      marks.push(...smallCrater(layout,{...tile,x,z},visibility,sky,random));
      continue;
    }
    const rocky=theme==='moon'||tile.relief>1.26&&random()<.56;
    const group=rocky?roughRocks(theme,x,tile.y,z,random):naturePlant(theme,x,tile.y,z,random,season);
    marks.push(...group.map(part=>({...part,fog:1-visibility})));
    if (visibility>.82&&spotSeed%3!==0) marks.push(...groundShadow(layout,x+.48,z-.36,rocky?1.25:1.67,1.05,.14,6,season));
    if (theme!=='moon'&&random()<.33) {
      marks.push(...[-.32,.15,.47].map((dx,i)=>({...dome(x+dx,z+.72,.21,.19,.16,['#e8bc7f','#d58c8a','#e8cf9d'][i],tile.y+.04),fog:1-visibility})));
    }
  }
  return marks;
}

function seasonalDetails(layout,plot,season) {
  if (!season||plot.waterfront||plot.index%3!==0) return [];
  const [x,,z]=pointOnSite([plot.index%2?4.76:-4.76,0,4.7],plot);
  const tile=regionSurface(layout,x,z),y=tile.y+.04;
  if (tile.water) return [];
  if (season==='halloween') return [
    dome(x,z,.74,.66,.49,'#d88e55',y),tube(x,z,.1,.1,.15,'#647454',y+.43),
    dome(x+.47,z-.2,.44,.38,.32,'#e9aa5d',y),tube(x+.47,z-.2,.071,.071,.092,'#647454',y+.27),
  ];
  if (season==='christmas') return [
    tube(x,z,.18,.18,.51,'#826e59',y),
    ...[0,1,2].map(i=>dome(x,z,1.02-i*.22,.92-i*.19,.61,'#668c7c',y+.32+i*.28)),
    ...[-.27,.17,.36].map((side,i)=>dome(x+side,z+.26,.17,.17,.16,['#e4ba67','#c77f80','#f2d79c'][i],y+.67+i*.18)),
    dome(x,z,.22,.22,.24,'#f0cd82',y+1.48),
  ];
  if (season==='winter') return layout.theme==='city'?[dome(x,z,.89,.68,.23,'#e7ece4',y),dome(x+.34,z-.18,.61,.45,.15,'#e2e9e1',y)]:[];
  if (season==='easter') return [-.26,.1,.39].map((side,i)=>dome(x+side,z,.28,.26,.41-i*.048,['#e9cc84','#bca9d4','#a4ccc2'][i],y));
  if (season==='autumn') return layout.theme==='city'?[dome(x,z,.67,.57,.22,'#b29565',y),dome(x+.35,z+.12,.39,.35,.16,'#d5ab78',y)]:[];
  return [-.24,.14,.41].flatMap((side,i)=>[
    tube(x+side,z,.045,.045,.28,'#6e9a79',y),
    dome(x+side,z,.29,.27,.13,(season==='spring'?['#deb5bf','#e9d28d','#f0e8bd']:['#e4b482','#a7c29b','#d6929f'])[i],y+.22),
  ]);
}

function viewBounds(plan,horizon) {
  const points=[plan.origin,...plan.plots,...plan.paths.flat(),...(plan.transit??[])];
  const xs=points.map(p=>p.x),zs=points.map(p=>p.z);
  const left=Math.min(...xs),right=Math.max(...xs),back=Math.min(...zs),front=Math.max(...zs);
  return {anchorX:(left+right)*.5*(1-horizon),anchorZ:(back+front)*.5*(1-horizon),
    size:lerp(Math.max(78,Math.hypot(right-left,front-back)*.91+39),238,horizon)};
}

function walkLine(a,b,step=.85) {
  const count=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/step));
  return Array.from({length:count+1},(_,i)=>({x:lerp(a.x,b.x,i/count),z:lerp(a.z,b.z,i/count)}));
}

function parkStreetLink(layout,plan,start,clear) {
  const width=streetHalfWidth(layout.theme);
  const shoulders=roadProjections(plan.paths,start,13).filter(road=>road.gap>width+1)
    .sort((a,b)=>a.gap-b.gap);
  for (const road of shoulders.slice(0,28)) {
    const side=Math.sign((start.x-road.x)*-road.v+(start.z-road.z)*road.u)||1;
    const shoulder=(point,u=road.u,v=road.v)=>({x:point.x-v*side*(width+.55),z:point.z+u*side*(width+.55)});
    const landing=shoulder(road);
    const access=walkLine(start,landing);
    if (!access.every(clear)) continue;
    for (const direction of [1,-1]) {
      const nodes=direction>0?road.path.slice(road.i+1):road.path.slice(0,road.i+1).reverse();
      const pavement=[landing];
      let last=road,length=0;
      for (const next of nodes) {
        const span=Math.hypot(next.x-last.x,next.z-last.z);
        if (span<.08) continue;
        const u=(next.x-last.x)/span*direction,v=(next.z-last.z)/span*direction;
        if (u*road.u+v*road.v<.65) break;
        const amount=Math.min(8.4-length,span);
        const to=shoulder({x:last.x+(next.x-last.x)*amount/span,z:last.z+(next.z-last.z)*amount/span},u,v);
        const extension=walkLine(pavement.at(-1),to).slice(1);
        if (!extension.every(clear)) break;
        pavement.push(...extension);
        length+=amount;
        last=next;
        if (length>=8.3) break;
      }
      if (length>=3.9) return [...access,...pavement.slice(1)];
    }
  }
  return null;
}

function pocketParks(layout,plan,completed,finds) {
  const parts=[],walks=[],places=[],paths=[],moon=layout.theme==='moon';
  const roads=plan.paths.flat(),width=streetHalfWidth(layout.theme);
  const dry=({x,z})=>!regionSurface(layout,x,z).water&&!plan.inRoadTunnel?.(x,z)
    && roads.every(p=>Math.hypot(x-p.x,z-p.z)>width+.23)
    && (plan.transit??[]).every(p=>Math.hypot(x-p.x,z-p.z)>1.42)
    && finds.every(p=>Math.hypot(x-p.x,z-p.z)>3.8);
  const clear=point=>dry(point)&&plan.plots.every(plot=>
    !regionalFootprint({...plot,halfWidth:plot.halfWidth??5.07,halfDepth:plot.halfDepth??4.5},point.x,point.z,.34));
  const height=({x,z})=>regionSurface(layout,x,z).y+.061;
  const paint=(path,wide)=>{
    const half=wide?.57:.43;
    const edges=path.map((point,i)=>{
      const a=path[Math.max(0,i-1)],b=path[Math.min(path.length-1,i+1)];
      const span=Math.hypot(b.x-a.x,b.z-a.z)||1;
      const dx=(b.z-a.z)*half/span,dz=(a.x-b.x)*half/span;
      return [-1,1].map(side=>{
        const x=point.x+dx*side,z=point.z+dz*side;
        return [x,height({x,z}),z];
      });
    });
    for (let i=1;i<edges.length;i++) {
      const [a,b]=edges[i-1],[c,d]=edges[i];
      parts.push({...face([a,c,d,b],moon?'#c3b8cc':'#c9bd9b',2.2),footpath:true});
    }
  };
  for (const [i,a] of completed.entries()) {
    if (a.waterfront||a.halfWidth||places.length>=8) continue;
    for (const b of completed.slice(i+1)) {
      if (b.waterfront||b.halfWidth) continue;
      const gap=Math.hypot(a.x-b.x,a.z-b.z);
      if (gap<11.8||gap>17) continue;
      const x=(a.x+b.x)*.5,z=(a.z+b.z)*.5;
      if (!clear({x,z})||places.some(p=>Math.hypot(x-p.x,z-p.z)<9)) continue;
      const dx=(a.z-b.z)/gap,dz=(b.x-a.x)/gap;
      const park=[-2.5,-1.25,0,1.25,2.5].map(t=>({x:x+t*dx,z:z+t*dz}));
      if (!park.every(clear)) continue;
      const before=parkStreetLink(layout,plan,park[0],clear);
      const after=parkStreetLink(layout,plan,park.at(-1),clear);
      if (!before&&!after) continue;
      places.push({x,z});
      paint(park,true);
      if (before) paint(before,false);
      if (after) paint(after,false);
      const path=[...(before?.slice(1).reverse()??[]),...park,...(after?.slice(1)??[])];
      paths.push(path);
      const seed=randomGenerator(layout.seed^Math.imul(a.index+1,b.index+59));
      for (const [j,point] of [park[1],park[3]].entries()) {
        const side=j===0?1:-1,u=point.x+side*dz*1.21,v=point.z-side*dx*1.21;
        if (!clear({x:u,z:v})||path.some(point=>Math.hypot(point.x-u,point.z-v)<1.05)) continue;
        const h=regionSurface(layout,u,v).y;
        if (moon) {
          parts.push(tube(u,v,.82,.82,.15,'#888ea6',h),...[-1,0,1].map((n,i)=>({
            shape:'boulder',x:u+n*.33,z:v+i*.13,y:h+.13,w:.41,d:.38,h:.67+i*.24,color:i%2?'#8ed1d5':'#b798d5',phase:i,
          })));
        } else parts.push(...naturePlant(layout.theme,u,h,v,seed,'summer'));
      }
      const route=path.concat(path.slice(1,-1).reverse()).map(({x,z})=>[x,z]);
      if (walks.length<3) walks.push({...actor(visitor(moon?'astronaut':'human','#b087a7',undefined,false,.83,i%8),route,
        {kind:'walk',speed:.81,phase:.32,corner:.23,elevation:(u,v)=>height({x:u,z:v}),voice:moon?'astronaut':'people'}),
        characterSlot:904+walks.length,parkWalk:true});
      break;
    }
  }
  return {parts,walks,paths};
}

const PHASES=['grunnarbeid','form og fasade','siste detaljer'];

export function expandedWorldScene(id,map,palette,buildingInfo,buildingParts,season) {
  const status=worldStatus(map), layout=regionLayout(id,map.seed,grandCatalog(map),status.capacity);
  const opened=map.order.slice(0,Math.ceil(map.progress/WORLD_BUILD_STEPS));
  const buildings=opened.map(index=>({index,kind:buildingInfo(index).kind}));
  const plan=(map.layout===3?planStreetRegion(layout,buildings,grandCatalog(map)?status.capacity:hasExpandedCatalog(map)?REGION_PLACES:undefined,{starter:map.starter}):null)
    ??planRegion(layout,buildings);
  const isNewPlot=map.progress%WORLD_BUILD_STEPS===1;
  const developments=plan.plots.map(plot=>({plot,steps:buildingParts(plot.index,plot)}));
  const completedPlots=plan.plots.slice(0,status.built);
  if (plan.starter) plan.starter.kind='headquarters';
  const sceneryPlan=plan.starter?{...plan,plots:[...plan.plots,plan.starter]}:plan;
  const station=completedPlots.find(plot=>['railwayStation','monorailStation','tramStation'].includes(plot.kind));
  const rail=station&&(station.kind==='tramStation'?districtTram(layout,station,plan,developments):
    districtRail(layout,station,sceneryPlan,developments,completedPlots.length));
  if (rail) {
    plan.transit=rail.points;
    plan.transitPortals=[...(rail.portals??[]),...Object.values(rail.entries??{})];
  }
  const airport=completedPlots.find(plot=>plot.kind==='airport');
  const helicopter=airport?helicopterModels(true,airport):id==='city'&&status.built>=2?helicopterModels(false,plan.origin):[];
  const horizon=clamp((status.built-status.capacity+6)/6);
  const sky=id==='moon'?'#000000':palette.sky;
  const tunnels=prepareRoadTunnels(layout,plan);
  plan.approaches=developments.flatMap(({plot,steps},i)=>{
    const approach=plot.residence
      ?{path:residenceDrive(layout,plot,plan.streetElevation).path,drive:true,width:RESIDENCE_PLOT.gateHalf,color:RESIDENCE_PLOT.paving[id]}
      :plotAccess(layout,plot,steps[0].find(part=>part.support));
    return approach?[{...approach,latest:i===developments.length-1}]:[];
  });
  const parkedTours=developments.slice(0,status.built).flatMap(({plot,steps})=>parkingTours(layout,plan,plot,steps));
  plan.approaches.push(...parkedTours.flatMap(({parking})=>parking.access?[{path:parking.access,drive:true}]:[]));
  const discoveries=terrainDiscoveries(layout,{...plan,plots:sceneryPlan.plots},status.full);
  if (plan.starter) {
    discoveries.info.headquarters={...plan.starter,status:'Startbygg',sound:'discovery',
      name:id==='city'?'Elveby rådhus':id==='moon'?'Månekommandoen':'Palmeøyas hovedhus',
      story:id==='city'?'Her planlegges nye gater og bygg. Rådhusklokken går på bytid.':id==='moon'?'Herfra holder månebasen kontakt med jorden. Antennen fanger også opp fotballkamper.':'Her tegnes de første kartene over øyen, med plass til både palmer og isboder.'};
    discoveries.parts.push(...placeParts(regionalHeadquarters(id),plan.starter)
      .flatMap(part=>terrainFoundation(layout,part,map.seed)).map(part=>({...part,entity:'headquarters'})));
  }
  const parks=pocketParks(layout,{...plan,plots:sceneryPlan.plots},completedPlots,discoveries.sites);
  plan.footpaths=[...parks.paths,...(rail?.walkways??[])];
  const roads=regionRoads(layout,plan,isNewPlot);
  const roadBuild=roads.some(part=>part.roadBuild!==undefined);
  const parts=[
    ...(id==='moon'&&horizon?lunarEarth(sky,horizon):[]),
    ...regionGround(layout,plan,sky,status.full,horizon,season,discoveries.sites),
    ...roads,
    ...tunnels,
    ...landscapeDetails(layout,plan,status.full,sky,season,discoveries.sites),
    ...discoveries.parts,...parks.parts,
  ];
  let latest=[],last,finished=null,latestTarget=null;
  const landmarks={},sites={},rides=[],beachSwimmers=[];
  developments.forEach(({plot,steps},i)=>{
    const amount=Math.min(WORLD_BUILD_STEPS,map.progress-i*WORLD_BUILD_STEPS);
    const {name}=buildingInfo(plot.index);
    const height=Math.max(...steps.flatMap(step=>step.map(part=>part.y+part.h)));
    const done=amount===WORLD_BUILD_STEPS;
    latestTarget={...plot,height};
    sites[plot.index]={...latestTarget,built:done};
    const shadow=plot.waterfront?[]:groundShadow(layout,plot.x+1.92,plot.z-1.47,7.35,6.18,amount===1?.15:.27,12,season);
    parts.push(...shadow);
    for (let j=0;j<amount;j++) {
      latest=placeParts(steps[j].filter(part=>!(done&&(part.flight||part.transitPreview))),plot)
        .flatMap(part=>terrainFoundation(layout,part,map.seed^Math.imul(plot.index+1,0x6c8e9cf5)))
        .map(part=>({...part,landmark:plot.index}));
      parts.push(...latest);
    }
    last=`${name} · ${PHASES[amount-1]}`;
    finished=done?name:null;
    if (done) {
      landmarks[plot.index]=latestTarget;
      rides.push(...rideModels(plot,steps).map(ride=>ride.kind==='observation'||ride.kind==='wheel'
        ?{...ride,landmark:plot.index,parts:ride.parts.map(part=>({...part,landmark:plot.index}))}:ride));
      if (rail&&plot===station) {
        const tracks=rail.parts.flatMap(part=>{
          if (id==='city'||station.kind==='tramStation'||part.tunnel) return [part];
          const edge=clamp((86-Math.max(Math.abs(part.x),Math.abs(part.z)))/8);
          const discovered=regionVisibility(plan,part.x,part.z,status.full);
          const fog=1-Math.min(edge,clamp((discovered+.08)*1.32));
          return fog>.985?[]:[{...part,fog}];
        });
        parts.push(...tracks);
        latest=[...latest,...tracks];
      }
      if (plot.kind==='driveThrough') {
        const {reach,world}=driveThroughApproach(plot);
        for (const side of [-1,1]) {
          const laneColor=id==='moon'?'#64657f':'#666e70';
          const z0=5.02,z1=reach-.37;
          const corners=[-.88,.88].map(offset=>{
            const x=side*4.26+offset;
            const near=world(x,z0,.441),far=world(x,z1);
            far[1]=(plan.streetElevation?.(far[0],far[2])??regionSurface(layout,far[0],far[2]).y+.14)+.015;
            return [near,far];
          });
          const [[a,b],[c,d]]=corners;
          parts.push(face([a,b,d,c],laneColor,undefined));
          for (const [start,end] of corners) {
            const ground=[start,end].map(([x,,z])=>[x,regionSurface(layout,x,z).y-.05,z]);
            parts.push(face([start,end,ground[1],ground[0]],laneColor,undefined));
          }
        }
      }
      if (plot.beach) {
        const beach=resortBeach(layout,plot);
        parts.push(...beach.parts.map(part=>({...part,landmark:plot.index})));
        beachSwimmers.push(...beach.swimmers);
      }
      parts.push(...landmarkVisitors(id,plot));
      parts.push(...seasonalDetails(layout,plot,season));
    } else {
      const yard=constructionYard(layout,plot,amount,height);
      parts.push(...yard);
      if (amount===1) latest=[...shadow,...latest,...yard];
    }
  });
  const locals=discoveryGuides(regionActors(id,layout,{...plan,plots:sceneryPlan.plots},completedPlots,discoveries.sites),discoveries.sites,layout,plan);
  const craft=rides.filter(actor=>['plane','shuttle','rocket','rocket-flame'].includes(actor.kind));
  const street=locals.filter(actor=>actor.fleet);
  const roadworks=planRoadworks(layout,plan,[...street,...locals.filter(actor=>actor.kind==='bus'||actor.kind==='hover')],status.built);
  const speakers=[...locals.filter(actor=>actor.encounter),...locals.filter(actor=>actor.voice&&!actor.encounter)].slice(0,2);
  const primaryTours=[...new Map(parkedTours.slice().reverse().map(actor=>[actor.parking.plot,actor])).values()];
  const essential=[...rides.filter(actor=>actor.kind==='observation'||actor.kind==='wheel'),...(rail?.actors??[]),...(rail?.walkers??[]),...roadworks.crews,
    ...helicopter,...craft.slice(0,5),...beachSwimmers,...rides.filter(actor=>actor.dustBather),...primaryTours,
    ...parkedTours.filter(actor=>actor.parking.merge),...speakers,
    ...(discoveries.visitor?[discoveries.visitor]:[]),...discoveries.smoke,
    ...parks.walks,...locals.filter(actor=>actor.driveThrough||actor.offroadExplorer||['bus','offroad-rover','hover'].includes(actor.kind)),...street.slice(0,17)];
  const football=rides.filter(actor=>actor.footballPlayer||actor.kind.startsWith('football-'));
  const slide=rides.find(actor=>actor.kind==='slide');
  const ambient=[...new Set([...essential,...football,...(slide?[slide]:[]),...street,...parkedTours,...rides,...locals])].slice(0,MAX_ACTORS);
  const moving=new Set(ambient.flatMap(actor=>actor.parking?[actor.parking.model]:[]));
  const rotating=new Set(ambient.flatMap(actor=>Number.isInteger(actor.landmark)?[actor.landmark]:[]));
  const keep=part=>!moving.has(part.parking)&&!((part.observation||part.wheel)&&rotating.has(part.landmark));
  return {
    id,seed:map.seed,junctions:plan.junctions,discoveries:{...discoveries.info,...rail?.entries},parts:parts.filter(keep),latest:latest.filter(keep),last,finished,landmarks,sites,roadBuild,latestTarget,world:true,illustrated:true,background:sky,yaw:-Math.PI/4,pitch:.6155,center:1.1,closeSize:76,
    ...viewBounds({...plan,transit:id==='city'?plan.transit:plan.transit?.filter(point=>Math.hypot(point.x-plan.origin.x,point.z-plan.origin.z)<55)},horizon),
    soundscape:{buildings:completedPlots.length,wheel:completedPlots.some(plot=>plot.kind==='wheel'),
      hotel:id==='island'&&completedPlots.some(plot=>['hotel','resort','sunsetHotel','glassHotel','megaResort'].includes(plot.kind)),fun:completedPlots.filter(plot=>isSlidePark(plot.kind)||['wheel','coaster','arcade','lunarArcade','islandArcade','tropicalPools'].includes(plot.kind)).length},
    ambient,roadworks:roadworks.sites,
    trafficObstacles:discoveries.sites.map(({x,z,type})=>({x,z,radius:type.mine?4.8:3.9})),
    next:status.building!==null?`${buildingInfo(status.building).name} · ${PHASES[status.phase]}`:null,
  };
}
