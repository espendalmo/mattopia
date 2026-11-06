export function createUpdater({currentVersion,onStatus,beforeReload,serviceWorker=navigator.serviceWorker,reload=()=>location.reload()}){
  let registration,ready=false,checking=false,starting;
  function emit(status,message){onStatus({ready,checking,status,message});}
  function workerVersion(worker){
    if(!worker)return Promise.resolve(null);
    return new Promise(resolve=>{
      const channel=new MessageChannel();
      const timeout=setTimeout(()=>{channel.port1.close();resolve(null);},1800);
      channel.port1.onmessage=e=>{clearTimeout(timeout);channel.port1.close();resolve(e.data?.version||null);};
      try{worker.postMessage({type:'GET_VERSION'},[channel.port2]);}catch{clearTimeout(timeout);channel.port1.close();resolve(null);}
    });
  }
  async function inspect(){
    const version=await workerVersion(registration?.active||serviceWorker?.controller);
    ready=Boolean(version&&version!==currentVersion);
    if(ready)emit('ready','En ny versjon er klar. Framgangen din blir med.');
    else if(!registration?.installing)emit('current','Du har nyeste tilgjengelige versjon.');
  }
  function watch(worker){if(!worker)return;worker.addEventListener('statechange',()=>{if(worker.state==='activated')inspect();if(worker.state==='redundant'){checking=false;emit('error','Kunne ikke laste ned oppdateringen. Prøv igjen senere.');}});}
  function init(){
    if(starting)return starting;
    starting=(async()=>{
      if(!serviceWorker){emit('unavailable','Oppdatering kan ikke sjekkes på denne adressen. Åpne den publiserte appen på nett.');return;}
      try{
        registration=await serviceWorker.register('./sw.js',{updateViaCache:'none'});
        watch(registration.installing);
        registration.addEventListener('updatefound',()=>{watch(registration.installing);});
        serviceWorker.addEventListener('controllerchange',inspect);
        await inspect();
      }catch{starting=null;emit('error','Kunne ikke se etter oppdatering. Prøv igjen når du er på nett.');}
    })();return starting;
  }
  async function check(){
    await init();if(!registration||checking)return;
    checking=true;emit('checking','Ser etter oppdatering …');
    try{await registration.update();checking=false;if(registration.installing){emit('downloading','Laster ned ny versjon …');watch(registration.installing);}else await inspect();}
    catch{checking=false;emit('error','Kunne ikke se etter oppdatering. Framgangen din er beholdt.');}
  }
  async function apply(){
    if(!ready)return;
    if(beforeReload()===false){emit('error','Kunne ikke lagre framgangen. Oppdateringen venter, så økten ikke forsvinner.');return;}
    if(registration?.waiting){registration.waiting.postMessage({type:'SKIP_WAITING'});}
    reload();
  }
  return{init,check,apply};
}
