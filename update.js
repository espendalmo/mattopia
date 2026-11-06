function newerThan(a,b){
  const parts=v=>/^\d+\.\d+\.\d+$/.test(v)?v.split('.').map(Number):null;
  const x=parts(a),y=parts(b);if(!x||!y)return false;
  for(let i=0;i<3;i++){if(x[i]!==y[i])return x[i]>y[i];}return false;
}

export function createUpdater({currentVersion,onStatus,beforeReload,serviceWorker=globalThis.navigator?.serviceWorker,reload=version=>{
  const url=new URL(location.href);url.searchParams.set('__tallvenn_update',version);location.replace(url.href);
},activationTimeout=10000,messageTimeout=1800,pollInterval=250}){
  let registration,ready=false,checking=false,applying=false,starting,candidate;
  const watched=new WeakSet();
  function emit(status,message){onStatus({ready,checking,applying,status,message});}
  function workerVersion(worker){
    if(!worker)return Promise.resolve(null);
    return new Promise(resolve=>{
      let channel,timer;
      const done=value=>{clearTimeout(timer);channel?.port1.close();resolve(typeof value==='string'?value:null);};
      try{
        channel=new MessageChannel();timer=setTimeout(()=>done(null),messageTimeout);
        channel.port1.onmessage=e=>done(e.data?.version);
        channel.port1.onmessageerror=()=>done(null);
        worker.postMessage({type:'GET_VERSION'},[channel.port2]);
      }catch{done(null);}
    });
  }
  async function inspect(){
    if(applying)return;
    const workers=[...new Set([registration?.waiting,registration?.active,serviceWorker?.controller].filter(Boolean))];
    const versions=await Promise.all(workers.map(async worker=>({worker,version:await workerVersion(worker)})));
    if(applying)return;
    candidate=versions.filter(x=>x.worker.state!=='redundant'&&newerThan(x.version,currentVersion)).sort((a,b)=>newerThan(a.version,b.version)?-1:1)[0];
    ready=Boolean(candidate);
    if(ready)emit('ready','En ny versjon er klar. Framgangen din blir med.');
    else if(registration?.installing)emit('downloading','Laster ned ny versjon …');
    else if(versions.some(x=>x.version))emit('current','Du har nyeste tilgjengelige versjon.');
    else emit('error','Fikk ikke kontakt med den lagrede appversjonen. Prøv igjen når du er på nett.');
  }
  function watch(worker){
    if(!worker||watched.has(worker))return;watched.add(worker);
    worker.addEventListener('statechange',()=>{
      if(['installed','activated'].includes(worker.state))inspect();
      if(worker.state==='redundant'&&!applying){checking=false;ready=false;emit('error','Kunne ikke laste ned oppdateringen. Prøv igjen senere.');}
    });
  }
  function init(){
    if(starting)return starting;
    starting=(async()=>{
      if(!serviceWorker){emit('unavailable','Oppdatering kan ikke sjekkes på denne adressen. Åpne den publiserte appen på nett.');return;}
      try{
        registration=await serviceWorker.register('./sw.js',{updateViaCache:'none'});
        watch(registration.installing);watch(registration.waiting);
        registration.addEventListener('updatefound',()=>watch(registration.installing));
        serviceWorker.addEventListener('controllerchange',inspect);
        await inspect();
      }catch{starting=null;emit('error','Kunne ikke se etter oppdatering. Prøv igjen når du er på nett.');}
    })();return starting;
  }
  async function check(){
    if(checking||applying)return;
    checking=true;emit('checking','Ser etter oppdatering …');
    try{
      await init();if(!registration){checking=false;emit(serviceWorker?'error':'unavailable','Kunne ikke starte oppdateringssjekken. Prøv igjen på den publiserte adressen når du er på nett.');return;}
      await registration.update();checking=false;watch(registration.installing);await inspect();
    }catch{checking=false;emit('error','Kunne ikke se etter oppdatering. Framgangen din er beholdt.');}
  }
  function waitForController(target){
    return new Promise((resolve,reject)=>{
      let settled=false,probing=false,poll;
      const finish=error=>{
        if(settled)return;settled=true;clearTimeout(timer);clearTimeout(poll);
        serviceWorker.removeEventListener?.('controllerchange',probe);
        target.worker.removeEventListener?.('statechange',probe);
        error?reject(error):resolve();
      };
      const probe=async()=>{
        if(settled||probing)return;probing=true;clearTimeout(poll);
        const controller=serviceWorker.controller;
        const version=await workerVersion(controller);probing=false;
        if(settled)return;
        if(controller===serviceWorker.controller&&controller?.state==='activated'&&version===target.version){finish();return;}
        if(target.worker.state==='redundant'){finish(new Error('Update replaced'));return;}
        poll=setTimeout(probe,pollInterval);
      };
      const timer=setTimeout(()=>finish(new Error('Activation timed out')),activationTimeout);
      serviceWorker.addEventListener('controllerchange',probe);target.worker.addEventListener('statechange',probe);
      try{
        if(target.worker.state==='installed')target.worker.postMessage({type:'SKIP_WAITING'});
        else if(target.worker.state==='activated')target.worker.postMessage({type:'CLAIM_CLIENTS'});
        probe();
      }catch(error){finish(error);}
    });
  }
  async function apply(){
    if(!ready||applying||!candidate)return;
    applying=true;emit('applying','Gjør den nye versjonen klar …');
    try{
      await waitForController(candidate);
      if(beforeReload()===false){applying=false;emit('error','Kunne ikke lagre framgangen. Oppdateringen venter, så økten ikke forsvinner.');return;}
      emit('applying','Åpner den nye versjonen …');reload(candidate.version);
    }catch{applying=false;emit('error','Oppdateringen ble ikke klar. Framgangen er beholdt. Lukk appen helt og åpne den igjen på nett, eller prøv på nytt.');}
  }
  return{init,check,apply};
}
