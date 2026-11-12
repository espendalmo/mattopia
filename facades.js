import {box,placeParts} from './scenery.js';

const colors={
  city:['#e2cbb0','#678b9d','#b8d7d8'],
  island:['#fff0cc','#699e9d','#b4ded2'],
  moon:['#acaacb','#6596b4','#9dd8e4'],
};
const sides=[['front',0],['right',Math.PI/2],['back',Math.PI],['left',-Math.PI/2]];
const openSites=new Set(['bridge','garden','park','greatPark','moonGarden','palmGarden','gravityPark','bandstand',
  'field','spaceField','pool','solar','solarGarden','tropicalPools','wheel','coaster','riverSlides','mangoSlides','dustSlides']);

function bounds(part) {
  const c=Math.abs(Math.cos(part.angle??0)),s=Math.abs(Math.sin(part.angle??0));
  return {part,x:part.x,z:part.z,halfX:(part.w*c+part.d*s)*.5,halfZ:(part.w*s+part.d*c)*.5};
}

export function detailFacades(stages,theme,kind) {
  if (kind==='residence'||openSites.has(kind)) return stages;
  const geometry=stages.flat().filter(part=>part.w>0&&part.d>0&&part.h>.05&&!part.parking&&!part.flight);
  const surfaces=geometry.map(bounds);
  // Work from the largest occupied volumes. Base slabs, roofs, trim and
  // already detailed window banks should keep their original shapes.
  const walls=geometry.filter(part=>['box','rounded'].includes(part.shape)&&!part.angle&&!part.support
    &&part.y>=.24&&part.h>=1.48&&part.w>=1.65&&part.d>=1.65&&part.w*part.d>=6)
    .sort((a,b)=>b.w*b.d*b.h-a.w*a.d*a.h).slice(0,2);
  const [frame,glass,light]=colors[theme];
  const details=[];
  for (const [bodyIndex,wall] of walls.entries()) {
    for (const [side,yaw] of sides) {
      const lateral=side==='right'||side==='left',sign=side==='front'||side==='right'?1:-1;
      const span=lateral?wall.d:wall.w,depth=(lateral?wall.w:wall.d)*.5;
      const outer=(lateral?wall.x:wall.z)+sign*depth,across=lateral?wall.z:wall.x;
      const strips=surfaces.flatMap(surface=>{
        const {part}=surface;
        if (part===wall||part.y>=wall.y+wall.h-.14||part.y+part.h<=wall.y+.15) return [];
        const cross=lateral?surface.z:surface.x,crossHalf=lateral?surface.halfZ:surface.halfX;
        const face=lateral?surface.x:surface.z,faceHalf=lateral?surface.halfX:surface.halfZ;
        const near=(face-outer)*sign;
        if (Math.abs(cross-across)>span*.5+crossHalf||near+faceHalf<.034||near-faceHalf>.33) return [];
        return [{part,cross,crossHalf,panel:faceHalf<.18&&part.h>.33&&crossHalf>.14}];
      });
      if (strips.filter(item=>item.panel).length>=3) continue;
      const width=Math.min(.74,span*.22),height=Math.min(.92,wall.h*.38);
      const windows=[];
      const columns=span<3.4?[-.20,.20]:[-.29,0,.29];
      const floors=wall.h<3.2?[.57]:[.33,.72];
      for (const floor of floors) for (const col of columns) {
        const offset=col*span,y=wall.y+wall.h*floor-height*.5;
        const cross=across+offset*(lateral?-sign:sign);
        if (strips.some(({part,cross:at,crossHalf})=>Math.abs(cross-at)<crossHalf+width*.55
          &&y<part.y+part.h+.085&&y+height>part.y-.085)) continue;
        windows.push({offset,y});
      }
      const chosen=windows.slice(0,bodyIndex?2:5);
      const placement={x:wall.x,y:0,z:wall.z,yaw};
      for (const {offset,y} of chosen) {
        const trim=box(offset,depth+.049,width+.09,.092,height+.11,frame,y-.052);
        const pane=box(offset,depth+.107,width,.032,height,glass,y);
        const sill=box(offset,depth+.126,width+.19,.18,.082,light,y-.083);
        details.push(...placeParts([trim,pane,sill],placement).map(part=>({...part,facadeSide:side})));
      }
    }
  }
  return details.length?stages.map((parts,i)=>i===stages.length-1?[...parts,...details]:parts):stages;
}
