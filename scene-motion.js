// Shared by the Canvas renderer, WebGL shader and hit testing. Resident visitors
// animate independently without using a moving-vehicle slot for every person.
export function residentPoint([x,y,z],life,stride,seconds=0) {
  if (!life || life[3]<=0) return [x,y,z];
  const [px,py,pz,phase]=life;
  const t=seconds*1.7+phase;
  const angle=Math.sin(t)*.032,c=Math.cos(angle),s=Math.sin(angle);
  const dx=x-px,dy=y-py;
  return [px+dx*c-dy*s,py+dx*s+dy*c+Math.sin(t*1.31)*.022,
    z+Math.sin(t*.79)*.018+stride*Math.sin(t*1.13)*.055];
}

export function residentNormal([x,y,z],life,seconds=0) {
  if (!life || life[3]<=0) return [x,y,z];
  const angle=Math.sin(seconds*1.7+life[3])*.032,c=Math.cos(angle),s=Math.sin(angle);
  return [x*c-y*s,x*s+y*c,z];
}

export function lightPulse(phase,seconds=0) {
  if (phase===-1) return .28+.16*Math.sin(seconds*23);
  if (phase<0) return .73*Math.max(0,Math.cos(seconds*2.6+phase))**12;
  return 0;
}

export function walkingClock(seconds,phase=0) {
  const period=25.6,pause=2.8,offset=phase*period;
  const rested=t=>Math.floor(t/period)*pause+Math.max(0,t%period-(period-pause));
  return {time:seconds-rested(seconds+offset)+rested(offset),thinking:(seconds+offset)%period>=period-pause};
}

export function lunarSkyCamera(camera,scale,seconds=0) {
  // Stars are much farther away than the town: pan and zoom only a little.
  return {x:camera.x*.075-camera.anchorX*scale*.022+Math.sin(seconds*.027)*2.2,
    y:camera.y*.075+camera.anchorZ*scale*.016+Math.cos(seconds*.023)*1.4,
    width:640*(1+Math.log(Math.max(.5,camera.zoom))*.075)};
}
