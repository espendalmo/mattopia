import {box,dome,tube,beam,pointOnSite,placeParts,regionActors,MAX_ACTORS} from './scenery.js';
import {regionLayout,planRegion,regionVisibility,regionSurface} from './regions.js';
import {REGION_PLACES,WORLD_BUILD_STEPS,grandCatalog,hasExpandedCatalog,randomGenerator,worldStatus} from './worlds.js';
import {planStreetRegion} from './street-grid.js';
import {regionRoads} from './region-roads.js';
import {constructionYard,landmarkVisitors,lunarSky,rideModels} from './map-art.js';
import {plotAccess,terrainFoundation} from './landmark-ground.js';
import {districtRail,districtTram,helicopterModels} from './transport.js';

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

function regionGround(layout,plan,sky,full,horizon,season) {
  const background=rgb(sky);
  const inner=Math.sqrt(layout.grid.length);
  const extension=horizon?[3,7,12,18,25]:[];
  const extra=extension.length,row=inner+2*extra;
  const edge=layout.grid[inner-1].x;
  const coords=[...extension.map(distance=>-edge-distance).reverse(),...layout.grid.slice(0,inner).map(tile=>tile.x),
    ...extension.map(distance=>edge+distance)];
  const relief=horizon?distantRelief(layout):null;
  const grid=Array.from({length:row*row},(_,i)=>{
    const col=i%row,line=Math.floor(i/row);
    const x=coords[col],z=coords[line];
    const tile=col>=extra&&col<row-extra&&line>=extra&&line<row-extra
      ?layout.grid[(line-extra)*inner+col-extra]:regionSurface(layout,x,z);
    const distance=Math.max(Math.max(Math.abs(x),Math.abs(z))/103,Math.hypot(x,z)/127);
    const rim=horizon**2*smooth((1-distance)/.24);
    const visibility=Math.max(rim,regionVisibility(plan,x,z,full));
    const base=surfaceColor(tile,layout,season);
    const distant=relief?.(x,z,tile);
    const color=distant?.tint?blend(base,distant.color,distant.tint*horizon):base;
    return {point:[x,tile.y+(distant?.height??0)*horizon,z],color:blend(background,color,visibility),visibility};
  });
  const ground=[];
  for (let i=0;i<grid.length-row;i++) {
    if (i%row===row-1) continue;
    const [a,b,c,d]=[grid[i],grid[i+1],grid[i+row],grid[i+row+1]];
    if (Math.max(a.visibility,b.visibility,c.visibility,d.visibility)<.008) continue;
    for (const triangle of [[a,c,b],[b,c,d]]) {
      ground.push(face(triangle.map(v=>v.point),sky,0,triangle.map(v=>v.color)));
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

function landscapeDetails(layout,plan,full,sky,season) {
  const {theme,seed}=layout;
  const rng=randomGenerator((seed^0x36a9bf)>>>0);
  const spread=Array.from({length:320},()=>({x:(rng()-.5)*144,z:(rng()-.5)*135,seed:Math.floor(rng()*2**32)}));
  const marks=[];
  const routes=plan.paths.flat();
  for (const {x,z,seed:spotSeed} of spread) {
    const visibility=regionVisibility(plan,x,z,full);
    if (visibility<.27) continue;
    const random=randomGenerator(spotSeed);
    const tile=regionSurface(layout,x,z);
    if (tile.water) {
      if (visibility<.62||tile.bank< -17) continue;
      marks.push({...box(x,z,.83+random()*1.36,.065,.008,theme==='island'?'#b9dfd8':'#a1cbca',tile.y+.014),layer:2,fog:1-visibility});
      continue;
    }
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
    size:lerp(Math.max(52,Math.hypot(right-left,front-back)*.91+34),238,horizon)};
}

const PHASES=['grunnarbeid','form og fasade','siste detaljer'];

export function expandedWorldScene(id,map,palette,buildingInfo,buildingParts,season) {
  const status=worldStatus(map), layout=regionLayout(id,map.seed,grandCatalog(map));
  const opened=map.order.slice(0,Math.ceil(map.progress/WORLD_BUILD_STEPS));
  const buildings=opened.map(index=>({index,kind:buildingInfo(index).kind}));
  const plan=(map.layout===3?planStreetRegion(layout,buildings,grandCatalog(map)?status.capacity:hasExpandedCatalog(map)?REGION_PLACES:undefined):null)
    ??planRegion(layout,buildings);
  const isNewPlot=map.progress%WORLD_BUILD_STEPS===1;
  const developments=plan.plots.map(plot=>({plot,steps:buildingParts(plot.index,plot)}));
  const completedPlots=plan.plots.slice(0,status.built);
  const station=completedPlots.find(plot=>['railwayStation','monorailStation','tramStation'].includes(plot.kind));
  const rail=station&&(station.kind==='tramStation'?districtTram(layout,station,plan):districtRail(layout,station,plan));
  if (rail) plan.transit=rail.points.filter(point=>
    completedPlots.some(plot=>Math.hypot(point.x-plot.x,point.z-plot.z)<22));
  const airport=completedPlots.find(plot=>plot.kind==='airport');
  const helicopter=airport?helicopterModels(true,airport):id==='city'&&status.built>=2?helicopterModels(false,plan.origin):[];
  plan.approaches=developments.flatMap(({plot,steps},i)=>{
    const approach=plotAccess(layout,plot,steps[0].find(part=>part.support));
    return approach?[{...approach,latest:i===developments.length-1}]:[];
  });
  const horizon=clamp((status.built-status.capacity+6)/6);
  const roads=regionRoads(layout,plan,isNewPlot);
  const roadBuild=roads.some(part=>part.roadBuild!==undefined);
  const parts=[
    ...(id==='moon'&&horizon?lunarSky(map.seed,palette.sky,horizon):[]),
    ...regionGround(layout,plan,palette.sky,status.full,horizon,season),
    ...roads,
    ...landscapeDetails(layout,plan,status.full,palette.sky,season),
  ];
  let latest=[],last,finished=null,latestTarget=null;
  const landmarks={},sites={},rides=[],visitors=[];
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
      latest=placeParts(steps[j].filter(part=>!(done&&(part.wheel||part.flight||part.transitPreview||part.observation))),plot)
        .flatMap(part=>terrainFoundation(layout,part,map.seed^Math.imul(plot.index+1,0x6c8e9cf5)))
        .map(part=>({...part,landmark:plot.index}));
      parts.push(...latest);
    }
    last=`${name} · ${PHASES[amount-1]}`;
    finished=done?name:null;
    if (done) {
      landmarks[plot.index]=latestTarget;
      rides.push(...rideModels(plot,steps).map(ride=>ride.kind==='observation'||ride.kind==='wheel'?{...ride,parts:ride.parts.map(part=>({...part,landmark:plot.index}))}:ride));
      if (rail&&plot===station) {
        const tracks=rail.parts.flatMap(part=>{
          if (station.kind==='tramStation') return [part];
          const edge=clamp((84-Math.max(Math.abs(part.x),Math.abs(part.z)))/14);
          const discovered=regionVisibility(plan,part.x,part.z,status.full);
          const fog=1-Math.min(edge,clamp((discovered+.08)*1.32));
          return fog>.985?[]:[{...part,fog}];
        });
        parts.push(...tracks);
        latest=[...latest,...tracks];
      }
      const crowd=landmarkVisitors(id,plot);
      if (crowd.length&&visitors.length<3) {
        const nearby=crowd.map(part=>({...part,x:part.x-plot.x,z:part.z-plot.z,y:part.y-plot.y}));
        visitors.push({kind:'visitors',parts:nearby,pose(seconds) {
          const t=seconds*1.43+plot.index;
          return {x:plot.x+Math.sin(t)*.045,y:plot.y+.02+Math.sin(t*1.4)*.019,z:plot.z+Math.cos(t*.83)*.055,
            cos:1,sin:0,stride:Math.sin(t*1.2)*.035,rollCos:1,rollSin:0,sound:0};
        }});
      } else parts.push(...crowd);
      parts.push(...seasonalDetails(layout,plot,season));
    } else {
      const yard=constructionYard(layout,plot,amount,height);
      parts.push(...yard);
      if (amount===1) latest=[...shadow,...latest,...yard];
    }
  });
  const locals=regionActors(id,layout,plan,completedPlots);
  const craft=rides.filter(actor=>['plane','rocket','rocket-flame'].includes(actor.kind));
  const street=locals.find(actor=>actor.kind==='road');
  const speakers=locals.filter(actor=>actor.voice).slice(0,id==='moon'?2:1);
  const essential=[...(rail?.actors??[]),...helicopter,...craft.slice(0,5),...speakers,
    ...(street?[street]:[]),...locals.filter(actor=>['bus','offroad-rover'].includes(actor.kind))];
  const ambient=[...new Set([...essential,...visitors.slice(0,2),...rides,...locals,...visitors])].slice(0,MAX_ACTORS);
  for (const visitor of visitors) if (!ambient.includes(visitor)) {
    const origin=visitor.pose(0);
    parts.push(...visitor.parts.map(part=>({...part,x:part.x+origin.x,y:part.y+origin.y,z:part.z+origin.z})));
  }
  return {
    id,parts,latest,last,finished,landmarks,sites,roadBuild,latestTarget,world:true,illustrated:true,background:palette.sky,yaw:-Math.PI/4,pitch:.6155,center:1.1,closeSize:76,
    ...viewBounds({...plan,transit:plan.transit?.filter(point=>Math.hypot(point.x-plan.origin.x,point.z-plan.origin.z)<55)},horizon),
    soundscape:{buildings:completedPlots.length,fun:completedPlots.filter(plot=>['wheel','coaster','arcade','lunarArcade','islandArcade','tropicalPools'].includes(plot.kind)).length},
    ambient,
    next:status.building!==null?`${buildingInfo(status.building).name} · ${PHASES[status.phase]}`:null,
  };
}
