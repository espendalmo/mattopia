// Optional developer contact sheet; no assets from this output are needed by the app.
import {writeFile} from 'node:fs/promises';
import {projectFaces} from '../project-view.js';
import {worldBuildingPreview,worldBuilding} from '../projects.js';
import {freshWorld} from '../worlds.js';
const map=freshWorld(()=>.45);
const choices=[45,46,47,29,11,25];
const size=380,height=365;
const color=c=>'rgb('+c.map(v=>Math.round(v*255)).join(',')+')';
const tiles=choices.map((index,tile)=>{
 const scene=worldBuildingPreview('moon',index,map);scene.illustrated=true;scene.id='moon';
 const yaw=-Math.PI/4,pitch=.6155,scale=Math.min(29,290/Math.max(...scene.parts.map(p=>p.y+p.h)));
 const c=Math.cos(yaw),s=Math.sin(yaw),rise=Math.sin(pitch),slope=Math.cos(pitch);
 const objects=projectFaces(scene).flatMap(face=>{
  if(face.normal[0]*s*slope+face.normal[1]*rise+face.normal[2]*c*slope<=0)return [];
  let depth=0;
  const points=face.points.map(([x,y,z])=>{const f=x*s+z*c,top=y-3.5;depth+=top*rise+f*slope;return [190+(x*c-z*s)*scale,200-(top*slope-f*rise)*scale];});
  return [{points,depth:depth/points.length,color:color(face.color)}];
 }).sort((a,b)=>a.depth-b.depth);
 const polygons=objects.map(p=>`<polygon points="${p.points.map(v=>v.join(',')).join(' ')}" fill="${p.color}" stroke="${p.color}" stroke-width=".25"/>`).join('');
 return `<g transform="translate(${tile%3*size},${Math.floor(tile/3)*height})"><rect x="8" y="8" width="364" height="349" rx="22" fill="#141624"/><ellipse cx="190" cy="288" rx="121" ry="34" fill="#0c0f18"/>${polygons}<text x="190" y="338" text-anchor="middle" fill="#e8e0d9" font-family="sans-serif" font-size="17">${worldBuilding('moon',index,map).name}</text></g>`;
});
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1140" height="730"><rect width="1140" height="730" fill="#090b13"/>${tiles.join('')}</svg>`;
await writeFile(process.argv[2]??'/tmp/mattopia-moon.svg',svg);
