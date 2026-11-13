import {mapStorySeed} from './map-stories.js';

const stories={
  city:[
    'Her står deigen opp før resten av byen.', 'I skolegården er det alltid noen som teller ned til friminuttet.',
    'Når det lyser i vinduene, er skiftet i gang.', 'Den som skyter ballen over gjerdet, må hente den.',
    'Spør etter boken som har et kart over byen i midten.', 'Rommet øverst har utsikt over elven.',
    'Klokken i tårnet høres helt bort til bakeriet.', 'Benken nærmest vannet er byens beste lesested.',
    'Her står eplene på første hylle.', 'Brannbilen står klar bak den store porten.',
    'Her bytter folk nyheter mens de venter på hverandre.', 'I den ytterste banen øver noen på sitt første stup.',
    'En skrue som er til overs, havner i den lille skuffen.', 'Bestill kakao ved vinduet med koppeskilt.',
    'Her kan du høre øving gjennom veggene.', 'Når noen spiller i paviljongen, stopper folk på stien.',
    'Her bestemmer de hvor neste gangfelt skal ligge.', 'Hvelvet har en dør som er tykkere enn en vanlig vegg.',
    'Filmen begynner når lyset over døren slukkes.', 'Vaktene har god utsikt fra de to tårnene.',
    'Noen sitter ytterst på bryggen og teller seilbåter.', 'På kaien kommer varene til byen fra elven.',
    'Hengekablene bærer veien høyt nok til at båtene kan passere.', 'Øverst i pariserhjulet ser du hele byen.',
    'Følg stien rundt dammen forbi eiketrærne.', 'Stokkene på plassen blir til planker inne i saga.',
    'Bussen tar en runde i gatene og kommer tilbake til holdeplassen.', 'Den som får fyr på bålet, velger første sang.',
    'Den store joysticken på taket peker mot inngangen.', 'Signallampen blinker så piloter kan se masten.',
    'Glassrutene skifter farge med himmelen.', 'Den grønne toppen er inspirert av kobber som har stått ute lenge.',
    'Leseplassen i glassatriet er varm også på en kjølig dag.', 'Spør i bodene hva som kom med elvebåten i morges.',
    'Filmspolen på taket er større enn kinodøren.', 'På solrike dager flytter gjestene ut under markisene.',
  ],
  moon:[
    'Vent litt ved utskytingsrampen. Raketten tar av og kommer tilbake.', 'Tunnelene mellom boligene gjør at folk kan gå på besøk i tøfler.',
    'Panelene samler lys til lamper og batterier.', 'Etter en tur børster mekanikerne månestøv av hjulene.',
    'Se etter de grønne plantene under den gjennomsiktige kuppelen.', 'Her lagres vann til både folk og planter.',
    'Prøvene merkes før noen begynner å lete etter spor i dem.', 'Skålen vender seg mot et nytt stykke av himmelen hver kveld.',
    'Et lite signal herfra kan bli til en melding hjemme på jorden.', 'Mekanikerne går over glassbroen med verktøy og reservedeler.',
    'Batteriene holder lysene på når solpanelene hviler.', 'Merkepinnene viser hvor forskerne fant månestein.',
    'Forsyninger går fra lasterampen opp i tårnene gjennom glassbroen.', 'Isen fra krateret kan smeltes til vann.',
    'Antennene fanger opp signaler fra romskip på vei inn.', 'Lysene rundt kanten viser piloten hvor skipet skal ned.',
    'Oksygenet i de lyse tankene hjelper basen med å puste.', 'Generatoren gir basen kraft når det trengs.',
    'Ballene spretter høyt når astronautene spiller på månen.', 'Gjestene spør alltid etter vinduet som vender mot jorden.',
    'Her studerer forskerne biter fra gamle nedslag.', 'Stein sorteres i tanker før den sendes videre.',
    'Her ligger reservedrakter klare til turer ut av basen.', 'Lytt etter motorene når raketten har fått grønt lys.',
    'Prøveturen går et lite stykke over veien. De flyvende bilene har rakettmotor bak.',
    'Du finner restauranten ved å se etter hamburgeren på taket.', 'Prøv en kule med stjernestøvstrø.',
    'Turkis er fargen på denne raketten. Følg flammen når den letter.',
    'Kuppelen i midten er felles stue for naboene.', 'Her konkurrerer astronauter og romvesener om rekordene.',
    'På stien rundt dammen kan du høre vannet sirkulere.', 'Takterrassen har utsikt over lysene på basen.',
    'De blå flatene fanger sollys før neste mørkeperiode.', 'Her sender de kveldsmusikken fra månen.',
    'Kakaoen serveres med lokk når noen skal gå ut med den.', 'Pakkene kommer i farger etter hvor de skal videre.',
  ],
  island:[
    'Balkongene vender mot bassengene og palmene.', 'Se etter iskremen over markisen.', 'Her begynner de minste med å øve på å flyte.',
    'Surfebrettene står klare til neste gruppe.', 'Folk sitter ute under parasollene og ser mot bukten.',
    'Palmeskyggen flytter seg over stien i løpet av dagen.', 'Lysene i gulvet viser hvor festen foregår.',
    'Fra bryggen er det lett å se seilbåtene ute på vannet.', 'Bodene åpner når det blir litt kjøligere.',
    'Gjestene møtes ved bassengkanten før frokost.', 'Her kan du se båtene fra bordene ved vinduet.',
    'Vannet i bassenget er lunt hele kvelden.', 'Øverst ser du hvor stiene møter stranden.',
    'Når det blåser, vugger hengekøyene mellom palmene.', 'Spør etter frukt som er plukket samme morgen.',
    'På torget avtaler folk hvor de skal møtes etter middag.', 'Her kan du trene med dørene åpne mot sjøluften.',
    'Marinaen er et rolig sted for båter å legge til.', 'Du kan se havet fra vognene øverst i pariserhjulet.',
    'Følg vognene gjennom den bratte svingen på banen.', 'Bordene lengst ut har utsikt mot sjøen.',
    'Ta stien innom paviljongen før du går videre rundt vannet.', 'Her kan gjestene velge mellom basseng og skygge.',
    'Fløyene ligger rundt bassenget så gjestene kan gå rett ut.', 'Smoothien på taket viser hvor du kan bestille.',
    'Ser du den store H-en? Der kan helikopteret lande mens flyet bruker rullebanen.',
    'Se etter joysticken når du kommer fra stranden.', 'To basseng gir plass til både svømmere og gjester som bare vil plaske.',
    'Fasaden speiler fargene på havet.', 'Teltene ligger et lite stykke unna bålet.',
    'Parasollene gjør at frukten holder seg kjølig.', 'Kafeen har bord ute når været er fint.',
    'Her er det lett å få øye på de små vannscooterne i bukten.', 'Følg stien forbi lagunen og de høyeste palmene.',
    'Småflyet bruker hele stripen når det kan.', 'Her er det en rolig og en livlig side av bassengområdet.',
  ],
};

const moonStories={
  gravityPark:'Plantene her lyser selv. Gartnermesteren har likevel gitt alle soppene hver sin nattlampe.',
  moonGarden:'Romsoppene gløder langs stien. Den rosa soppen heter visst Agurk. Ingen vet hvorfor.',
  waterSpire:'Vannet går gjennom turkise tanker. Rørleggeren insisterer på at det bare smaker litt av månen.',
  iceVault:'Her fryser de ned is fra kratrene. Iskrem er i et helt annet fryserom. Forhåpentligvis.',
  quantumLab:'Forskerne prøver å finne ut hvor alle sokkene blir av. De har funnet fire nye planeter på veien.',
  signalSpire:'Sender beskjeder helt hjem til jorden. Noen har nettopp sendt «Husk melk!».',
  satelliteHub:'Her holder de kontakt med satellittene. En av dem har ringt for å spørre hva klokken er.',
  batteryVault:'Batteriene lades med sollys. Teknikeren må stadig forklare at man ikke kan lade en banan.',
  solarObservatory:'Speilene vender seg mot solen. Solbriller er en del av arbeidsantrekket.',
  lunarArcade:'Romvesenene holder rekorden i nesten alle spill. De har jo flere tomler å trykke med.',
  prismTower:'Fra krystallspiret kan du se neste krater. Vaktmesteren har verdens lengste støvkost.',
  novaTower:'Den store ringen er ikke en hulahoppring. Astronautene har prøvd. Det gikk ikke.',
  haloTower:'Tallerkentakene har utsikt i alle retninger. Kjøkkenet savner fortsatt de store lokkene sine.',
  lunarResort:'Gjester får med seg en liten kost fra bassenget. Hotellet har foreløpig måttet avlyse all vannsprut.',
  auroraHotel:'Toppetasjen har tallerkenrestaurant. Gjestene spør alltid om hele hotellet kan fly.',
  spaceField:'Laget Månespark trener her. En ball i hjelmen gir av og til en liten privat stjernehimmel.',
};

const districtStories={
  arcade:'En maskin heter «Utenomjordisk». Rekorden tilhører et romvesen som skrev «Helt normalt» i navnefeltet.',
  library:'Hvorfor frøs bibliotekaren? Alle bøkene hadde åpne omslag.',
  bookHall:'Bokhuset har glassatrium og en stille lesekrok. Den er så stille at noen hvisket «hysj» til sin egen skygge.',
  cultureHouse:'En trommeslager ble bedt om å slå seg ned. Nå lurer alle på om han også kan slå an tonen.',
  nightCinema:'Filmen om popkorn fikk en smell på premieren. Publikum mente den var litt for oppblåst.',
  broadcastHouse:'På radioen leser de værmeldingen. Den viktigste nyheten er at vinden blåste forbi uten å stoppe.',
  lagoonTower:'Toppen har 360 graders utsikt. Turistene får dessverre bare låne 180 grader om gangen.',
  lagoonPark:'En frosk satt på broen og sa den ventet på en prins. Den andre satt og ventet på bussen.',
  courthouse:'Dommeren ba alle reise seg. En gjest rakk å pakke kofferten før misforståelsen ble oppklart.',
  church:'Hvorfor kom klokkeren for sent? Han slo av klokken.',
  busStation:'Bussen stopper under taket. En passasjer sa «jeg har en skrue løs». Sjåføren satte ham av ved verkstedet.',
  fireStation:'Brannbilen står klar. Sist noen ropte «det brenner!», var det en toast som hadde tatt litt for mye sats.',
  policeStation:'Patruljen fikk melding om en mistenkelig bolle. Den satt i en deiglig situasjon.',
  stoneLighthouse:'Fyret er murt av stein. Fyrvokteren kaller den siste steinen for prikken over fyret.',
  casino:'Tårnet har lys i alle etasjer. Vaktmesteren regner med å vinne når han spiller stein, saks, lyspære.',
  riverSlides:'Den siste svingen er den våteste. Badevakten har begynt å ta med paraply.',
  breadWorks:'Den store bollen på taket er pynt. Byens duer har bedt om å få det skriftlig.',
  bookCastle:'Noen glemte et bokmerke i boken på taket. Det var visst en hel stige.',
  riverAquarium:'Fisken som heter Bjarne kan svømme baklengs. Den gjør det helst når ingen ser på.',
  clockSpire:'Hvis klokkene viser ulik tid, velger bakeren den som sier at det er bollepause.',
  glassWorks:'Glassblåseren kan lage en vase av nesten hva som helst. Han har foreløpig bare øvd på glass.',
  mangoSlides:'Mangofargen gjør ingenting med farten. Det har de undersøkt ganske grundig.',
  surfMuseum:'Det lengste surfebrettet var for langt for museet. Nå sitter det på utsiden og ser inn.',
  sunhatHotel:'Vaktmesteren får alltid spørsmålet om taket kan blåse av. Han sier det sitter godt på hodet.',
  coralAquarium:'Tre fisker her heter Nemo. Det ble litt kluss da de fikk post.',
  coconutTower:'Kokosnøtten er hul. Når det blåser, tror halve øyen at det er noen som snorker inni den.',
  icePalace:'Isen på taket smelter aldri. Det er upraktisk for dem som venter med skje.',
  dustSlides:'Ingen trenger badebukse her. De fleste trenger en støvsuger etterpå.',
  cometCafe:'Kakaokoppen har lokk. Sist var det selve kometen som ikke klarte å holde på marshmallowene.',
  roverWash:'En rover kom inn med så mye støv at de trodde den var et helt nytt krater.',
  carWash:'En bil kom inn full av sand. Da den kjørte ut, manglet vaskehallen bare en badevakt.',
  craterCinema:'Her svever popkornet mot taket. Bakerste rad har med seg hov.',
  moonPost:'Merk pakken med planet og krater. «Ved siden av en stor stein» har vist seg å være litt upresist.',
  sunMirror:'Solspeilet er stort nok til at alle i byen kan sjekke romhjelmen sin samtidig.',
};

function originalLandmarkStory(theme,index,kind) {
  if (districtStories[kind]) return districtStories[kind];
  if (theme==='moon'&&moonStories[kind]) return moonStories[kind];
  if (kind==='railwayStation') return 'Toget stopper på perrongen. Se om du får øye på toget igjen på den andre siden av tunnelen.';
  if (kind==='monorailStation') return 'Månetoget trenger bare én skinne. Det glir over gatene, gjennom tunnelen og tilbake til stasjonen.';
  if (kind==='tramStation') return 'Du kan ta trikken hele veien rundt og ende på samme sted. Hvor mange stopp finner du?';
  if (kind==='needleTower') return 'Restauranten snurrer sakte, så alle bord får utsikt i alle retninger.';
  if (kind==='residence') return theme==='moon'?'Et hus verdig en mattemester. I oppkjørselen står en rover og en svevebil. Selv bilen kan løfte seg et hakk.':
    theme==='island'?'Et palass verdig en mattemester. Kabrioleten har taket nede, og endene i hagedammen krever bompenger i brødsmuler.':
    'Et hus verdig en mattemester. Sportsbilen tar svingene, og endene tar seg av regningen. De er gode med desimalkvakk.';
  if (kind==='lighthouse') return 'På mørke kvelder viser lykten båtene vei forbi grunnen.';
  if (kind==='telescopeArray') return 'De små teleskopene hjelper det store med å finne riktig del av stjernehimmelen.';
  if (kind==='airport'&&theme==='city') return 'Se etter lysene langs rullebanen når flyet lander. Helikopteret har sin egen plass.';
  if (kind==='hangar') return 'Mekanikerne bruker den store porten når kjøretøy skal ut på prøvetur.';
  if (kind==='mill') return 'Vingene tar tak i vinden og driver kvernsteinen som maler korn til mel.';
  if (kind==='dock') return 'Ved moloen kan småbåter ligge i le for bølgene.';
  return stories[theme]?.[index]??'';
}

const localStories={
  city:[
    'Ada Appelsin kom innom på vei til elven. Hun ble stående og telle alle vinduene.',
    'Noen har lagt igjen en liten lapp ved inngangen. «Dette er et fint sted å møtes.»',
    'Byens turkamerat Voffert kjenner veien hit. Spør ham om du vil ta den lengste snarveien.',
    'Her avtalte to venner å møtes klokken to. Den ene kom med to boller, for sikkerhets skyld.',
    'Folk stanser her for å skravle. Det finnes alltid tid til én vits til.',
    'Kalle Kringle har tegnet dette stedet på bykartet sitt. Tegningen fikk flest vinduer.',
  ],
  island:[
    'Noen har satt opp et lite skilt. «Skal du hit, har du kommet fram.»',
    'Frida Fart gikk forbi i full fart. Hun kom tilbake for å nyte utsikten.',
    'En solhatt blåste forbi i morges. Eieren er ennå ikke helt sikker på hvor den landet.',
    'Mio Makrell mener at dette stedet er øyas beste møtested. Han har sagt det om fire andre steder også.',
    'Herfra ser man palmene vinke. Det er stort sett vinden som hjelper til.',
    'Kokosnøttbudet tok en pause her. Den rundeste kokosnøtten trillet videre alene.',
  ],
  moon:[
    'En astronaut prøvde å finne veien hit ved å følge fotspor. Det var sine egne spor.',
    'Plupp har skrevet dette stedet inn i reiseguiden sin. Den heter «Her var det fint» på romspråk.',
    'Et romvesen tok et lite hopp for å få bedre utsikt. Det ble et ganske langt lite hopp.',
    'En månerover kom innom med dagens post. Den leverte også et helt uoppfordret bilde av hjulene sine.',
    'Kaptein Knekkebrød har tatt med matpakken hit. I dag husket kapteinen å lukke lokket.',
    'Noen fikk øye på en kjent figur her. Det var hjelmen deres i speilbildet.',
  ],
};

export function landmarkStory(theme,index,kind,seed) {
  const original=originalLandmarkStory(theme,index,kind);
  if (kind==='residence'||districtStories[kind]||!Number.isInteger(seed)) return original;
  const alternatives=localStories[theme]??[];
  const pick=mapStorySeed(seed,`${theme}:${index}:${kind}`);
  if (original&&pick%3===0) return original;
  return alternatives[(pick>>>5)%alternatives.length]??original;
}

const construction={
  city:[
    ['Gravemaskinen har funnet en rund stein. Den ser ut som en bolle uten rosiner.',
      'Her gjøres grunnen klar. Målebåndet måtte bli med på en ekstra runde.',
      'De første materialene er på plass. En due har meldt seg som byggeleder.'],
    ['Her snekres og hamres det. Snekkeren tar en bolle når neste del sitter fast.',
      'Bygget tar form. Byggegjengen er enig om at den siste skruen sikkert er i lommen.',
      'Nå går det unna. En nysgjerrig nabo har allerede prøvd å ta et bilde.'],
    ['Første besøkende har kommet. Voffert rakk å snuse ferdig før åpningen.',
      'Byggegjengen har ryddet opp. De fant tre blyanter og en gjenglemt bolle.',
      'Naboene kom for å se. En av dem hadde med en liten applaus og en stor matpakke.'],
  ],
  island:[
    ['Tomten gjøres klar. Én kokosnøtt måtte flyttes til en tryggere palme.',
      'Byggeplassen er målt opp. Solhatten har fått egen plass ved siden av verktøyet.',
      'De første delene kommer fram. Sanden har allerede kommet overalt.'],
    ['Her snekres det i solen. Byggegjengen holder takten med hammeren.',
      'Nå kommer formen fram. En gekko følger spent med fra skyggen.',
      'Byggegjengen jobber videre. Noen har laget en vits om den aller lengste planken.'],
    ['Nå står alt klart. En gekko kom først for å se på resultatet.',
      'Ferdig! Byggegjengen feirer med smoothie og en ekstra lang pause i skyggen.',
      'Alt er på plass. Solhatten ble med hele veien til åpningen.'],
  ],
  moon:[
    ['Byggeroveren jevner ut bakken. En stein som ligner på en potet får ligge til side.',
      'Grunnen er klar. Astronautene måtte fange målebåndet før det svevde av gårde.',
      'Første lass med deler har landet. Matpakken kom ned et lite øyeblikk senere.'],
    ['Her sveises og hamres det. Laseren synger en liten pipelåt mellom slagene.',
      'Nå tar bygget form. En rommekaniker holder fast i både verktøyet og nisten.',
      'Neste del sitter fast. Byggegjengen har bare én mystisk reservedel igjen.'],
    ['Byggegjengen feirer. Alle klapper så godt de kan med romhansker på.',
      'Alt er på plass. Første gjest har allerede spurt om det finnes månekakao.',
      'Siste del er montert. Et lite romvesen har kommet for å gi bygget tommel opp.'],
  ],
};

const openings={
  residence:'Her kan en mattemester som deg parkere, telle ender eller ta en velfortjent pause i hagen.',
  lunarResort:'Bassengvakten har satt fram støvkoster. De to første gjestene har allerede badet seg grå.',
  moonBurger:'Første burger er klar. Kokken har festet ekstra måneost så den holder seg på plass.',
  spaceField:'Laget Månespark er klart. Hjelmene er på og ballen har lovet å oppføre seg.',
  airport:'Rullebanen er klar. Piloten øver på å lande uten å søle kakao.',
  shuttlePort:'Rullebanen lyser. Romfergen har fått klarsignal og passasjerene har spent fast nisten.',
  monorailStation:'Første tog glir inn. Konduktøren teller både billetter og antenner.',
  railwayStation:'Første tog er på vei. En passasjer har pakket en egen matboks til tunnelen.',
  tramStation:'Ding ding! Første avgang er klar. Én kokosnøtt står allerede i billettkø.',
  wheel:'Første vogn er klar. En passasjer øver på å vinke fra toppen.',
};

export function constructionStory(theme,kind,phase,seed,step) {
  const lines=construction[theme]?.[phase-1];
  if (!lines) return '';
  if (phase===3&&openings[kind]) return openings[kind];
  const pick=mapStorySeed(seed,`${kind}:${step}:${phase}`);
  return lines[pick%lines.length];
}
