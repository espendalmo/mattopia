import test from 'node:test';
import assert from 'node:assert/strict';
import {mountProjectView} from '../project-view.js';
import {rounded,visitor} from '../scenery.js';

test('The renderer uploads and draws complete vertices including independent resident motion',()=>{
  const previous=Object.fromEntries(['window','document','requestAnimationFrame','cancelAnimationFrame'].map(key=>[key,globalThis[key]]));
  let uploaded,draws=0;
  const attributes=new Map(),pointers=[],uniforms=new Map();
  const noop=()=>{};
  const gl={VERTEX_SHADER:1,FRAGMENT_SHADER:2,ARRAY_BUFFER:3,STATIC_DRAW:4,FLOAT:5,TRIANGLES:6,
    createShader:()=>({}),shaderSource:noop,compileShader:noop,createProgram:()=>({}),attachShader:noop,
    linkProgram:noop,getProgramParameter:()=>true,useProgram:noop,deleteShader:noop,
    createBuffer:()=>({}),bindBuffer:noop,bufferData:(_target,data)=>{uploaded=data;},
    getAttribLocation:(_program,name)=>{attributes.set(name,attributes.size);return attributes.get(name);},
    enableVertexAttribArray:noop,vertexAttribPointer:(...args)=>pointers.push(args),
    getUniformLocation:(_program,name)=>name,enable:noop,depthFunc:noop,clearColor:noop,blendFunc:noop,
    viewport:noop,clear:noop,uniform1f:(name,value)=>uniforms.set(name,value),uniform2f:noop,uniform4f:noop,
    uniform4fv:noop,uniform3fv:noop,deleteBuffer:noop,deleteProgram:noop,getExtension:()=>null,
    drawArrays(_mode,first,count){
      assert.ok(Number.isInteger(count)&&count%3===0&&count>0);
      for (const [_location,size,_type,_normal,stride,offset] of pointers) {
        assert.ok((first+count-1)*stride+offset+size*4<=uploaded.byteLength,'draw must stay inside every vertex attribute');
      }
      draws++;
    },
  };
  const media={matches:false,addEventListener:noop};
  const canvas={clientWidth:390,clientHeight:480,width:1,height:1,style:{},classList:{add:noop},addEventListener:noop,
    getContext:kind=>{assert.equal(kind,'webgl');return gl;}};
  const container={querySelector:()=>canvas,addEventListener:noop};
  try {
    globalThis.window={devicePixelRatio:2,matchMedia:()=>media,addEventListener:noop};
    globalThis.document={hidden:false,addEventListener:noop};
    globalThis.requestAnimationFrame=()=>1;globalThis.cancelAnimationFrame=noop;
    const resident=visitor('astronaut','#b9b9cc',undefined,false,.83,2)
      .map(part=>({...part,life:[0,0,0,1],entity:'resident:1:0'}));
    const release=mountProjectView(container,{id:'moon',world:true,illustrated:true,parts:[rounded(0,0,4,4,2,'#a8b3cc'),...resident],
      ambient:[],size:20,center:1,background:'#000000',latest:[]},true,{still:true});
    assert.equal(draws,1);
    const [slot,size,,,_stride,offset]=pointers.find(([slot])=>slot===attributes.get('life'));
    assert.equal(size,4);
    const stride=pointers[slot][4]/4;
    assert.ok(uploaded.some((value,i)=>i%stride===offset/4+3&&value===1),'resident phase is uploaded');
    assert.equal(uniforms.get('age'),0,'still views freeze resident motion');
    release();
  } finally {
    for (const [key,value] of Object.entries(previous)) value===undefined?delete globalThis[key]:globalThis[key]=value;
  }
});
