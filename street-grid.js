import {connectWaterfront,regionSurface,riverAt,riverWidth,specialEntrances} from './regions.js';
import {randomGenerator,REGION_PLACES} from './worlds.js';

const WIDTH=11;
export const STREET_TURN_RADIUS=2.35;
const streets=new WeakMap();
const gap=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const edgeKey=(a,b)=>a<b?`${a}:${b}`:`${b}:${a}`;

function interpolate(a,b,step=1.9) {
  const count=Math.max(1,Math.ceil(gap(a,b)/step));
  return Array.from({length:count+1},(_,i)=>({
    x:a.x+(b.x-a.x)*i/count,z:a.z+(b.z-a.z)*i/count,
  }));
}

function streetGraph(layout,spacing,shift) {
  const rng=randomGenerator(layout.seed^0x5c14a537^Math.imul(shift,0x47c82f31));
  const shiftX=(rng()-.5)*8,shiftZ=(rng()-.5)*8;
  const nodes=Array.from({length:WIDTH*WIDTH},(_,id)=>{
    const x=(id%WIDTH-5)*spacing+shiftX,z=(Math.floor(id/WIDTH)-5)*spacing+shiftZ;
    return {id,x,z,...regionSurface(layout,x,z)};
  });
  const links=nodes.map(()=>[]);
  const edges=new Map();
  const connect=(a,b)=>{
    const points=interpolate(nodes[a],nodes[b]);
    const crossRiver=layout.theme==='city'&&nodes[a].z===nodes[b].z
      &&Math.abs(nodes[a].z-layout.berths.bridge.z)>6.4;
    if (points.some(point=>{
      const surface=regionSurface(layout,point.x,point.z);
      if (surface.water) return !crossRiver||Math.abs(point.x-riverAt(layout,point.z))>riverWidth(layout,point.z)+.2;
      return layout.theme==='moon'&&surface.basin< -1.65;
    })) return;
    const key=edgeKey(a,b);
    edges.set(key,{a,b,points,key});
    links[a].push(b);links[b].push(a);
  };
  for (const node of nodes) {
    if (node.water) continue;
    const {id}=node, col=id%WIDTH,row=Math.floor(id/WIDTH);
    if (row<WIDTH-1&&!nodes[id+WIDTH].water) connect(id,id+WIDTH);
    if (col<WIDTH-1) {
      const next=nodes[id+1];
      if (!next.water) connect(id,id+1);
      else if (layout.theme==='city'&&col<WIDTH-2&&!nodes[id+2].water) connect(id,id+2);
    }
  }
  const lots=[];
  for (let row=0;row<WIDTH-1;row++) {
    for (let col=0;col<WIDTH-1;col++) {
      const nw=row*WIDTH+col, ring=[nw,nw+1,nw+WIDTH+1,nw+WIDTH];
      const x=nodes[nw].x+spacing/2,z=nodes[nw].z+spacing/2;
      if (Math.abs(x)>(layout.grand?73:67)||Math.abs(z)>(layout.grand?72:66)) continue;
      const perimeter=ring.map((id,i)=>edges.get(edgeKey(id,ring[(i+1)%ring.length])));
      const front=perimeter[2],west=perimeter[3];
      if (!front&&!west) continue;
      const corners=[[0,0],[5.4,0],[-5.4,0],[0,5.3],[0,-5.3],[4.1,4.1],[-4.1,4.1],[4.1,-4.1],[-4.1,-4.1]];
      const ground=corners.map(([a,b])=>regionSurface(layout,x+a,z+b));
      const low=Math.min(...ground.map(tile=>tile.y)), high=Math.max(...ground.map(tile=>tile.y));
      if (ground.some(tile=>tile.water||tile.bank<.26||layout.theme==='moon'&&tile.basin<-.65)||high-low>2.15) continue;
      if (Object.entries(layout.berths).some(([kind,site])=>kind!=='lighthouse'&&gap(site,{x,z})<(site.span?site.span*.66+3:8.7))) continue;
      lots.push({x,z,y:high+.045,ring,perimeter,front,west,weight:rng()*4.8,westFirst:rng()>.5});
    }
  }
  lots.sort((a,b)=>gap(a,layout.origin)+a.weight-gap(b,layout.origin)-b.weight);
  const origin=lots.find(lot=>lot.perimeter.every(Boolean));
  if (!origin) return null;
  const component=new Set(origin.ring);
  const queue=[...component];
  for (let i=0;i<queue.length;i++) {
    for (const neighbor of links[queue[i]]) {
      if (component.has(neighbor)) continue;
      component.add(neighbor);queue.push(neighbor);
    }
  }
  const available=[origin,...lots.filter(lot=>lot!==origin&&[lot.front,lot.west].some(edge=>edge&&component.has(edge.a)))];
  return {nodes,links,edges,origin,available};
}

function layoutStreets(layout,requiredLots) {
  const versions=streets.get(layout)??new Map();
  if (versions.has(requiredLots)) return versions.get(requiredLots);
  let graph;
  const attempts=[[15.2,0],[14.3,0],[14.3,1],[13.6,0],[13.6,1],[13.6,2],[13.1,0],[13.1,2],[13.1,3]];
  if (layout.grand) attempts.push([12.9,0],[12.9,1],[12.9,2],[12.9,3],[12.9,4]);
  for (const [spacing,shift] of attempts) {
    const candidate=streetGraph(layout,spacing,shift);
    if (candidate?.available.length>=requiredLots) { graph=candidate; break; }
  }
  if (graph) {
    const reserved=graph.available.slice(0,(layout.grand?requiredLots:REGION_PLACES)+4);
    graph.connectorLayout={...layout,grid:layout.grid.map(tile=>({...tile,blocked:reserved.some(site=>gap(site,tile)<5.5)}))};
  }
  versions.set(requiredLots,graph??null);
  streets.set(layout,versions);
  return graph;
}

function pathToStreet(links,starts,active,avoid) {
  const queue=[...starts], previous=new Map(queue.map(id=>[id,null]));
  for (let i=0;i<queue.length;i++) {
    const here=queue[i];
    if (active.has(here)) {
      const found=[];
      for (let id=here;id!==null;id=previous.get(id)) found.push(id);
      return found;
    }
    for (const neighbor of links[here]) {
      if (previous.has(neighbor)||edgeKey(here,neighbor)===avoid) continue;
      previous.set(neighbor,here);queue.push(neighbor);
    }
  }
  return null;
}

function streetCircuits(nodes,open,links,starter) {
  const result=[starter.map(id=>nodes[id])];
  const used=new Set([starter.slice().sort((a,b)=>a-b).join(',')]);
  for (const {a,b,key} of open.values()) {
    const cycle=pathToStreet(links,[a],new Set([b]),key);
    if (!cycle||cycle.length<4||cycle.length>13) continue;
    const signature=cycle.slice().sort((x,y)=>x-y).join(',');
    if (used.has(signature)) continue;
    used.add(signature);
    result.push(cycle.map(id=>nodes[id]));
  }
  // Join adjacent blocks across their shared edge to make routes through several streets.
  const local=result.slice();
  for (const first of local.slice(0,12)) {
    let circuit=first;
    for (let step=0;step<4;step++) {
      const ids=new Set(circuit.map(node=>node.id));
      let joined;
      for (let i=0;i<circuit.length&&!joined;i++) {
        const a=circuit[i].id,b=circuit[(i+1)%circuit.length].id;
        for (const next of local) {
          const start=next.findIndex(node=>node.id===a);
          if (start<0||next.filter(node=>ids.has(node.id)).length!==2) continue;
          const length=next.length;
          const direction=next[(start+1)%length].id===b?-1:next[(start+length-1)%length].id===b?1:0;
          if (!direction) continue;
          const detour=Array.from({length:length-2},(_,j)=>next[(start+direction*(j+1)+length)%length]);
          joined=circuit.slice(0,i+1).concat(detour,circuit.slice(i+1));
          break;
        }
      }
      if (!joined) break;
      circuit=joined;
    }
    const signature=circuit.map(node=>node.id).sort((a,b)=>a-b).join(',');
    if (!used.has(signature)) { used.add(signature); result.push(circuit); }
  }
  return result;
}

export function planStreetRegion(layout,buildings,requiredLots=REGION_PLACES-Object.keys(layout.berths).length) {
  const graph=layoutStreets(layout,requiredLots);
  if (!graph) return null;
  const {nodes,edges,origin,available,links,connectorLayout}=graph;
  const open=new Map(), active=new Set(), connectors=[],connectedNodes=new Set(),plots=[];
  const usedLots=new Set();
  let latestPaths=new Map();
  let track=false;
  const add=edge=>{
    if (!edge) return;
    if (track&&!open.has(edge.key)) latestPaths.set(edge.points,!active.has(edge.a)&&active.has(edge.b));
    open.set(edge.key,edge);
    active.add(edge.a);active.add(edge.b);
  };
  origin.perimeter.forEach(add);
  track=true;

  for (const {index,kind} of buildings) {
    latestPaths=new Map();
    const lighthouse=kind==='lighthouse'&&layout.berths.lighthouse;
    const special=lighthouse?null:layout.berths[kind];
    if (special) {
      const entries=specialEntrances(special,kind);
      for (const entry of entries) {
        let candidates=[...active].map(id=>nodes[id]);
        if (kind==='bridge') {
          const side=Math.sign(entry.x-special.x);
          const onBank=point=>(point.x-riverAt(layout,point.z))*side>riverWidth(layout,point.z)+.6;
          candidates=candidates.filter(onBank);
          if (!candidates.length) candidates=nodes.filter(point=>!point.water&&onBank(point)&&links[point.id].length);
        }
        if (!candidates.length) continue;
        const start=candidates.reduce((near,point)=>gap(point,entry)<gap(near,entry)?point:near);
        const path=connectWaterfront(connectorLayout,start,entry,kind==='bridge');
        connectors.push(path);
        latestPaths.set(path,false);
        connectedNodes.add(start.id);
        active.add(start.id);
      }
      plots.push({...special,index,kind,entries});
      continue;
    }

    // Prefer parcels close to a street which is already visible on the map.
    let choice=null;
    for (const lot of available) {
      if (usedLots.has(lot)) continue;
      for (const [edge,yaw] of [[lot.front,0],[lot.west,-Math.PI/2]]) {
        if (!edge) continue;
        const path=pathToStreet(links,[edge.a,edge.b],active);
        if (!path) continue;
        const starter=lot===origin&&usedLots.size===0?-5:0;
        const score=path.length*6+gap(lot,origin)*.18+lot.weight+starter+(lot.westFirst===(yaw!==0)?0:.65);
        if (!choice||score<choice.score) choice={lot,edge,yaw,path,score};
      }
    }
    if (!choice) return null;
    const {lot,edge,yaw,path}=choice;
    usedLots.add(lot);
    for (let i=1;i<path.length;i++) add(edges.get(edgeKey(path[i-1],path[i])));
    add(edge);
    lot.perimeter.forEach(add);
    const entry=yaw===0?{x:lot.x,z:nodes[lot.ring[2]].z}:{x:nodes[lot.ring[3]].x,z:lot.z};
    if (lighthouse) {
      // Keep its original lot reserved so later parcels in saved towns stay put.
      const entries=specialEntrances(lighthouse,kind);
      const candidates=[...active].map(id=>nodes[id]);
      const start=candidates.reduce((near,node)=>gap(node,entries[0])<gap(near,entries[0])?node:near);
      const shoreRoad=connectWaterfront(connectorLayout,start,entries[0],false);
      connectors.push(shoreRoad);
      latestPaths.set(shoreRoad,false);
      connectedNodes.add(start.id);
      plots.push({...lighthouse,index,kind,entries});
    } else {
      plots.push({x:lot.x,y:lot.y,z:lot.z,yaw,index,kind,entries:[entry],
        streetSpan:gap(nodes[lot.ring[0]],nodes[lot.ring[1]])});
    }
  }
  const openLinks=nodes.map(()=>[]);
  for (const {a,b} of open.values()) {
    openLinks[a].push(b);openLinks[b].push(a);
  }
  return {
    origin,plots,paths:[...open.values()].map(edge=>edge.points).concat(connectors),latestPaths,
    junctions:[...active].filter(id=>openLinks[id].length>=2).map(id=>{
      const {x,z}=nodes[id];
      const arms=openLinks[id].map(neighbor=>[Math.sign(nodes[neighbor].x-x),Math.sign(nodes[neighbor].z-z)]);
      return {x,z,arms,connector:connectedNodes.has(id)};
    }),
    circuits:streetCircuits(nodes,open,openLinks,origin.ring),
  };
}
