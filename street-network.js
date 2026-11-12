const EPSILON=.0001;
const gap=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const key=({x,z})=>`${Math.round(x*10000)}:${Math.round(z*10000)}`;

function crossing(a,b,c,d) {
  if (Math.max(a.x,b.x)+EPSILON<Math.min(c.x,d.x)||Math.max(c.x,d.x)+EPSILON<Math.min(a.x,b.x)
    ||Math.max(a.z,b.z)+EPSILON<Math.min(c.z,d.z)||Math.max(c.z,d.z)+EPSILON<Math.min(a.z,b.z)) return null;
  const u=b.x-a.x,v=b.z-a.z,s=d.x-c.x,t=d.z-c.z;
  const denominator=u*t-v*s;
  if (Math.abs(denominator)<EPSILON) return null;
  const x=c.x-a.x,z=c.z-a.z;
  const first=(x*t-z*s)/denominator,second=(x*v-z*u)/denominator;
  if (Math.min(first,second)<-EPSILON||Math.max(first,second)>1+EPSILON) return null;
  const point=first<EPSILON?a:first>1-EPSILON?b:second<EPSILON?c:second>1-EPSILON?d:{x:a.x+u*first,z:a.z+v*first};
  return {first,second,point};
}

function splitRoad({path,cuts}) {
  if (!cuts.length) return [path];
  const sections=[];
  let start=0,from=path[0];
  for (const {at,point} of cuts.sort((a,b)=>a.at-b.at)) {
    if (gap(from,point)<EPSILON) continue;
    const end=Math.ceil(at-EPSILON);
    const interior=path.slice(start+1,end);
    const section=[from,...interior,point];
    if (section.length>=2) sections.push(section);
    start=Math.floor(at+EPSILON);
    from=point;
  }
  if (gap(from,path.at(-1))>EPSILON) sections.push([from,...path.slice(start+1)]);
  return sections;
}

export function joinStreetPaths(roads,connectors,latest,gateways) {
  const sources=[...roads.map(path=>({path,connector:false,cuts:[]})),
    ...connectors.map(path=>({path,connector:true,cuts:[]}))];
  const add=(source,at,point)=>{
    if (at>EPSILON&&at<source.path.length-1-EPSILON) source.cuts.push({at,point});
  };
  for (let i=roads.length;i<sources.length;i++) {
    const a=sources[i],p=a.path;
    for (const b of sources.slice(0,i)) {
      const q=b.path;
      for (let u=1;u<p.length;u++) {
        for (let v=1;v<q.length;v++) {
          const hit=crossing(p[u-1],p[u],q[v-1],q[v]);
          if (!hit) continue;
          add(a,u-1+hit.first,hit.point);
          add(b,v-1+hit.second,hit.point);
        }
      }
    }
  }
  const paths=[],accessPaths=new Set(),gatewayPaths=new Set(),sections=new Map(),latestPaths=new Map();
  for (const source of sources) {
    const pieces=splitRoad(source);
    sections.set(source.path,pieces);
    paths.push(...pieces);
    for (const part of pieces) {
      if (source.connector) accessPaths.add(part);
      if (gateways.has(source.path)) gatewayPaths.add(part);
    }
  }
  for (const [path,reverse] of latest) {
    const pieces=sections.get(path)??[];
    for (const part of reverse?pieces.slice().reverse():pieces) latestPaths.set(part,reverse);
  }
  return {paths,accessPaths,gateways:gatewayPaths,latestPaths};
}

export function streetNetwork(paths,accessPaths=new Set()) {
  const nodes=new Map(),edges=[];
  const node=point=>{
    const id=key(point);
    if (!nodes.has(id)) nodes.set(id,{x:point.x,z:point.z,id,links:[],access:false});
    return nodes.get(id);
  };
  for (const path of paths) {
    if (path.length<2) continue;
    const a=node(path[0]),b=node(path.at(-1));
    if (a===b||a.links.some(link=>link.other===b&&link.path.length===path.length
      &&gap(link.path[Math.floor(path.length/2)],path[Math.floor(path.length/2)])<.08)) continue;
    const length=path.slice(1).reduce((sum,p,i)=>sum+gap(p,path[i]),0);
    const access=accessPaths.has(path);
    a.links.push({other:b,path,length,access});
    b.links.push({other:a,path:path.slice().reverse(),length,access});
    a.access||=access;b.access||=access;
    edges.push({path,length,access,a,b});
  }
  const junctions=[...nodes.values()].filter(n=>n.links.length>=2).map(({x,z,links,access})=>{
    const arms=links.map(({path})=>{
      const next=path.find(p=>Math.hypot(x-p.x,z-p.z)>.012)??path.at(-1);
      const dx=next.x-x,dz=next.z-z,span=Math.hypot(dx,dz)||1;
      return [dx/span,dz/span];
    });
    return {x,z,arms,connector:access};
  });
  return {nodes,edges,junctions};
}

export function roadProjections(paths,point,radius=Infinity,closed=false) {
  const result=[];
  for (const path of paths) {
    for (let i=0;i<path.length-(closed?0:1);i++) {
      const a=path[i],b=path[(i+1)%path.length],dx=b.x-a.x,dz=b.z-a.z;
      const span=Math.hypot(dx,dz);
      if (span<EPSILON) continue;
      const u=dx/span,v=dz/span;
      const along=Math.max(0,Math.min(span,(point.x-a.x)*u+(point.z-a.z)*v));
      const x=a.x+along*u,z=a.z+along*v,distance=Math.hypot(x-point.x,z-point.z);
      if (distance<=radius) result.push({x,z,path,i,gap:distance,u,v});
    }
  }
  return result;
}

function distancesFrom(start) {
  const remaining=new Map([[start,0]]),distances=new Map(),previous=new Map();
  while (remaining.size) {
    let point=null,distance=Infinity;
    for (const [candidate,cost] of remaining) {
      if (cost<distance) { point=candidate; distance=cost; }
    }
    remaining.delete(point);
    distances.set(point,distance);
    for (const link of point.links) {
      if (distances.has(link.other)) continue;
      const next=distance+link.length;
      if (next>=(remaining.get(link.other)??Infinity)) continue;
      remaining.set(link.other,next);
      previous.set(link.other,{point,path:link.path});
    }
  }
  return {distances,previous};
}

// Keep the access road in the actual street network. The return lane follows
// the same continuous streets, including any junctions added later.
export function destinationRoutes(network,entries) {
  const covered=new Set(),tours=[];
  const hangars=new Set(entries.filter(point=>point.hangar).map(key));
  const ends=[...entries,...[...network.nodes.values()].filter(node=>node.links.length===1)];
  for (const point of ends) {
    const end=network.nodes.get(key(point));
    if (!end||covered.has(end)) continue;
    const {distances,previous}=distancesFrom(end);
    // Reserve the hangar entrance for airport trips and its parked vehicles.
    const origins=[...distances].filter(([node,length])=>length>=12&&(point.airportDistrict||!hangars.has(node.id)));
    const candidates=origins.filter(([from,length])=>from.links.length===1&&length>=14);
    const pool=candidates.length?candidates:origins;
    if (!pool.length) continue;
    const [start]=pool.reduce((a,b)=>{
      const score=([node,length])=>Math.abs(length-(point.landmark?52:38))+node.links.length*3+(node.access?3:0);
      return score(a)<=score(b)?a:b;
    });
    const legs=[];
    for (let node=start;node!==end;) {
      const {point,path}=previous.get(node);
      legs.push(path.slice().reverse());node=point;
    }
    const path=legs.flatMap((leg,i)=>i?leg.slice(1):leg);
    if (path.length>=3) {
      tours.push({path,terminal:end,landmark:point.landmark});
      covered.add(end);covered.add(start);
    }
    if (tours.length>=26) break;
  }
  return tours;
}
