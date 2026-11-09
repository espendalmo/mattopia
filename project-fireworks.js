export const FIREWORKS_START=910;
export const FIREWORKS_END=4910;
export const FINALE_FIREWORKS_END=6230;

const bursts=[
  {at:FIREWORKS_START,dx:-.17,dy:0,colors:['#eeb13f','#ffdf79','#fff3bf']},
  {at:1230,dx:.15,dy:-.08,colors:['#e5748e','#eea6a6','#ffe8bd']},
  {at:1660,dx:-.01,dy:-.12,colors:['#8a72cf','#a0bbec','#f0dcff']},
  {at:2210,dx:-.21,dy:-.05,colors:['#6ab9a9','#a5d6bd','#e8efd0']},
  {at:2690,dx:.21,dy:-.1,colors:['#ecaa65','#f8c781','#fff0b7']},
];
const finaleBursts=[
  ...bursts,
  {at:3220,dx:-.26,dy:-.07,colors:['#b08dd8','#e5aada','#fae5f6']},
  {at:3610,dx:.23,dy:-.09,colors:['#79b8df','#9fe0d8','#edf8f7']},
  {at:4000,dx:0,dy:-.12,colors:['#f6b43e','#ffe295','#fff8d6']},
  {at:5010,dx:.07,dy:-.15,colors:['#f2ae57','#fff1b2','#d3b0e9']},
];
const buildingBursts=[
  ...bursts,
  {at:3690,dx:.04,dy:-.16,colors:['#efb255','#ffe78d','#f6eac6']},
];

export const fireworkBursts=finale=>finale?finaleBursts:buildingBursts;

export function createFireworks(view,finale=false) {
  const overlay=view.ownerDocument.createElement('canvas');
  overlay.className='project-fireworks';
  overlay.setAttribute('aria-hidden','true');
  const paint=overlay.getContext('2d');
  if (!paint) return null;
  view.after(overlay);
  return {
    draw(x,y,width,height,ratio,elapsed) {
      if (overlay.width!==view.width||overlay.height!==view.height) {
        overlay.width=view.width;
        overlay.height=view.height;
      }
      overlay.style.left=`${view.offsetLeft}px`;
      overlay.style.top=`${view.offsetTop}px`;
      overlay.style.width=`${width}px`;
      overlay.style.height=`${height}px`;
      paint.setTransform(ratio,0,0,ratio,0,0);
      paint.clearRect(0,0,width,height);
      const radius=Math.min(57,width*.19,height*.24);
      for (const {at,dx,dy,colors} of fireworkBursts(finale)) {
        const t=(elapsed-at)/1190;
        if (t<0||t>1) continue;
        const cx=Math.max(radius,Math.min(width-radius,x+dx*width));
        const cy=Math.max(radius*.84,Math.min(height*.64,y+dy*height));
        const fade=(1-t)**.9;
        for (let i=0;i<20;i++) {
          const angle=i*Math.PI*.1+dx*2;
          const speed=.51+(i*7%11)*.051;
          const spread=radius*speed*(1-(1-t)**2.2);
          const sx=Math.cos(angle),sy=Math.sin(angle),fall=t*t*radius*.31;
          const px=cx+sx*spread,py=cy+sy*spread+fall;
          const trail=radius*.145*(1-t)*Math.min(1,t*8);
          const color=colors[i%colors.length];
          paint.globalAlpha=fade*.79;
          paint.strokeStyle=color;
          paint.lineWidth=1.35+speed*.6;
          paint.lineCap='round';
          paint.beginPath();
          paint.moveTo(px-sx*trail,py-sy*trail);
          paint.lineTo(px,py);
          paint.stroke();
          paint.globalAlpha=fade;
          paint.fillStyle=i%3===0?'#fff8dc':color;
          paint.beginPath();
          paint.arc(px,py,(1.3+speed*.8)*(1-.55*t),0,2*Math.PI);
          paint.fill();
        }
      }
      paint.globalAlpha=1;
    },
    dispose:()=>overlay.remove(),
  };
}
