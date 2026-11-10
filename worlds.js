export const WORLD_IDS=Object.freeze(['city','moon','island']);
export const WORLD_BUILD_STEPS=3;
export const WORLD_PLACES=16;
export const REGION_PLACES=24;
export const REGION_CATALOG_PLACES=36;
export const RAIL_PLACE=REGION_CATALOG_PLACES;
export const GRAND_REGION_PLACES=30;
export const GRAND_REGION_CATALOG=44;
export const LUNAR_REGION_CATALOG=48;
export const grandCatalog=map=>map?.layout===3&&map.catalog===3;
export const LEGACY_WORLD_STEPS=120;
export const isWorld=id=>WORLD_IDS.includes(id);
export const isRegion=map=>map?.layout===2||map?.layout===3;
export const worldCapacity=map=>grandCatalog(map)?GRAND_REGION_PLACES:!map||isRegion(map)?REGION_PLACES:WORLD_PLACES;
export const hasExpandedCatalog=map=>map?.layout===3&&[2,3].includes(map.catalog);
export const worldPoolSize=(map,theme)=>grandCatalog(map)?(theme==='moon'?LUNAR_REGION_CATALOG:GRAND_REGION_CATALOG):hasExpandedCatalog(map)?REGION_CATALOG_PLACES:worldCapacity(map);
const hasRail=(theme,map)=>isRegion(map)&&(theme==='city'||theme==='moon'||theme==='island'&&grandCatalog(map));

export function randomGenerator(seed){
  let n=seed>>>0;
  return ()=>{
    n+=0x6D2B79F5;
    let t=n;
    t=Math.imul(t^t>>>15,t|1);
    t^=t+Math.imul(t^t>>>7,t|61);
    return ((t^t>>>14)>>>0)/4294967296;
  };
}

const legacyMap=legacy=>({seed:null,legacy,order:[],progress:0});
export function legacyPlacement(count) {
  let remaining=count;
  const finished=[];
  for (let id=0;id<WORLD_PLACES;id++) {
    if (remaining<6) return {finished,partial:remaining>0?{id,stages:remaining}:null};
    finished.push(id);
    remaining=Math.max(0,remaining-7-id%2);
  }
  return {finished,partial:null};
}

export function worldStatus(map) {
  const {finished,partial}=legacyPlacement(map?.legacy??0);
  const capacity=worldCapacity(map);
  const catchUp=Number(Boolean(partial));
  const total=(map?.legacy??0)+catchUp+(capacity-finished.length-catchUp)*WORLD_BUILD_STEPS;
  const steps=Math.max(0,(map?.progress??0)-catchUp);
  const count=Math.floor(steps/WORLD_BUILD_STEPS);
  const phase=steps%WORLD_BUILD_STEPS;
  const previous=finished.length+Number(catchUp>0&&(map?.progress??0)>0);
  const built=previous+count;
  const full=built===capacity;
  const building=full?null:catchUp&&!map.progress?partial.id:map?.order[count]??null;
  return {capacity,total,completed:(map?.legacy??0)+(map?.progress??0),built,phase,building,full};
}

export function worldCompletedPlaces(map) {
  const {finished,partial}=legacyPlacement(map?.legacy??0);
  if (partial && map.progress) finished.push(partial.id);
  return [...finished,...(map?.order.slice(0,worldStatus(map).built-finished.length)??[])];
}

export function currentWorld(state,id) {
  if (!isWorld(id)) return null;
  const maps=state.worlds?.[id];
  if (maps?.length) return maps.at(-1);
  return state.projects?.[id]>0 ? legacyMap(state.projects[id]) : null;
}

export function worldChoices(map,theme) {
  const status=worldStatus(map);
  if (!map||status.full||status.building!==null) return [];
  const {finished,partial}=legacyPlacement(map.legacy);
  const used=new Set([...finished,partial?.id,...map.order]);
  const pool=Array.from({length:worldPoolSize(map,theme)},(_,i)=>i).filter(id=>id!==RAIL_PLACE);
  if (hasRail(theme,map) && status.built>=2) pool.push(RAIL_PLACE);
  const options=pool.filter(id=>!used.has(id));
  const rng=randomGenerator((map.seed??0x4fd37d89)+map.order.length*0x47c82f31+(map.legacy||0)*17);
  for (let i=options.length-1;i>0;i--) {
    const swap=Math.floor(rng()*(i+1));
    [options[i],options[swap]]=[options[swap],options[i]];
  }
  return options;
}

export function worldSelect(map,id,theme) {
  return worldChoices(map,theme).includes(id) ? {...map,order:[...map.order,id]} : map;
}

export function worldAdvance(map,theme) {
  if (!map || worldStatus(map).full) return map;
  // A round begun in an older release can still award a build on completion.
  const options=worldChoices(map,theme);
  const selected=options.length ? {...map,order:[...map.order,options[0]]} : map;
  return {...selected,progress:selected.progress+1};
}

export function freshWorld(rng=Math.random,previous=null) {
  const seed=Math.floor(rng()*2**32)>>>0;
  return {layout:3,catalog:3,seed:seed===previous?.seed?(seed+1)>>>0:seed,legacy:0,order:[],progress:0};
}

function restoreWorld(raw,budget,first,theme) {
  if (!raw || typeof raw!=='object') return null;
  const integer=value=>Number.isSafeInteger(value)&&value>=0;
  const legacy=first&&integer(raw.legacy)?Math.min(raw.legacy,budget,LEGACY_WORLD_STEPS):0;
  if (!legacy && (!integer(raw.seed)||raw.seed>=2**32)) return null;
  const {finished,partial}=legacyPlacement(legacy);
  const layout=isRegion(raw)&&!legacy?raw.layout:1;
  const catalog=layout===3&&hasExpandedCatalog(raw)?{catalog:raw.catalog}:{};
  const capacity=worldCapacity({layout,...catalog});
  const pool=worldPoolSize({layout,...catalog},theme);
  const remaining=capacity-finished.length-Number(Boolean(partial));
  const used=new Set([...finished,partial?.id]);
  const ids=Array.isArray(raw.order)?[...new Set(raw.order)].filter(id=>
    integer(id)&&(id===RAIL_PLACE?hasRail(theme,{layout,...catalog}):id<pool)&&!used.has(id)).slice(0,remaining):[];
  const catchUp=Number(Boolean(partial));
  const progress=integer(raw.progress)?Math.min(raw.progress,budget-legacy,ids.length*WORLD_BUILD_STEPS+catchUp):0;
  // There can be at most one selected building beyond completed and in-progress buildings.
  const limit=catchUp&&progress===0?0:Math.floor(Math.max(0,progress-catchUp)/WORLD_BUILD_STEPS)+1;
  return {...(layout>1?{layout,...catalog}:{}),seed:legacy?null:raw.seed,legacy,order:ids.slice(0,limit),progress};
}

export function restoreWorlds(raw, projects, total) {
  return Object.fromEntries(WORLD_IDS.map(id=>{
    const maps=[];
    let budget=total;
    if (Array.isArray(raw?.[id])) {
      for (const saved of raw[id]) {
        const map=restoreWorld(saved,budget,maps.length===0,id);
        if (!map) break;
        maps.push(map);
        const status=worldStatus(map);
        budget-=status.completed;
        if (!status.full) break;
      }
    }
    if (!maps.length && projects[id]>0) maps.push(legacyMap(projects[id]));
    return [id,maps];
  }));
}

export function replaceCurrentWorld(state,id,map) {
  const history=state.worlds?.[id]??[];
  return {...state,worlds:{...state.worlds,[id]:[...history.slice(0,-1),map]}};
}

export function ensureWorld(state,id,rng=Math.random) {
  if (state.worlds?.[id]?.length) return state;
  return replaceCurrentWorld(state,id,currentWorld(state,id)??freshWorld(rng));
}

export function startNewWorld(state,id,rng=Math.random) {
  const map=currentWorld(state,id);
  if (!map || !worldStatus(map).full) return state;
  return {...state,worlds:{...state.worlds,[id]:[...(state.worlds?.[id]?.length?state.worlds[id]:[map]),freshWorld(rng,map)]}};
}

export function worldLayout(theme,seed) {
  const rng=randomGenerator(seed);
  const width=14.8+rng()*2.7, depth=13.7+rng()*3.3;
  const gap=theme==='city'?5.7:0;
  const offset=(rng()-.5)*5, phase=rng()*Math.PI*2;
  const cells=Array.from({length:WORLD_PLACES},(_,index)=>{
    const col=index%4, row=Math.floor(index/4);
    const side=col<2?-gap:gap;
    const left=(col-2)*width+side, right=(col-1)*width+side;
    const back=(row-2)*depth+offset, front=(row-1)*depth+offset;
    return {col,row,left,right,back,front,
      x:(left+right)/2+(rng()-.5)*1.75,z:(back+front)/2+(rng()-.5)*1.55,
      seed:Math.floor(rng()*2**32)};
  });
  const center=[5,6,9,10];
  const lots=[cells[center[Math.floor(rng()*center.length)]]];
  while (lots.length<cells.length) {
    const frontier=cells.filter(cell=>!lots.includes(cell)&&lots.some(lot=>Math.abs(lot.col-cell.col)+Math.abs(lot.row-cell.row)===1));
    lots.push(frontier[Math.floor(rng()*frontier.length)]);
  }
  return {lots,phase,waterBend:.65+rng()*1.24,grassTint:rng(),shorePower:3+rng()*1.1};
}
