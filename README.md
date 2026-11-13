# Mattopia 1.43.0

En liten norsk matteapp for mobil og iPad. Korte runder, tydelige mengder og en stjerne for innsatsen. Ingen konto eller eksterne avhengigheter.

## Prøv på egen enhet først

ZIP-filen har to mapper. **`mattopia-beta/`** er den ferdige prøvepakken. **`mattopia/`** er den vanlige appen og kildekoden.

1. Publiser innholdet i `mattopia-beta/` på `/mattopia-beta/`.
2. Åpne testadressen på din iPad. Legg den gjerne til på Hjem-skjermen. Den heter **Mattopia Beta**, viser et **BETA · Testversjon**-merke og bruker egen øvingshistorikk.
3. Når du har godkjent testen, publiserer du innholdet i `mattopia/` på `/mattopia/`. Først da kan vanlige installasjoner oppdage versjon 1.43.0.

Bruk HTTPS for å teste installasjon, offline og oppdateringer. Versjonssjekken i beta leser `/mattopia/core.js` på samme domene.

En vanlig offentlig Pages-adresse gir adskilte utrullinger, men er tilgjengelig for andre som kjenner adressen. Velg tilgangsbeskyttet hosting hvis selve testadressen skal være privat.

### Neste testpakke og tilbakeføring

Fra kildemappen `mattopia/` kan du bygge nye statiske pakker uten å installere avhengigheter:

```sh
node tools/release.mjs preview ../mattopia-beta-1.21.1 1.21.1
node tools/release.mjs stable ../mattopia-utgave-1.21.1 1.21.1
```

Publiser testpakken på den samme testadressen ved hver ny test. Bruk et høyere nummer enn det som allerede er publisert på den adressen. Da kan du prøve selve oppdateringsknappen. For produksjon skal nummeret også være høyere enn den sist publiserte produksjonsversjonen.

Hvis en feil først oppdages etter publisering, kan du bygge den siste fungerende koden med et **høyere** versjonsnummer og publisere den på produksjonsadressen. Eksemplet gjenbruker 1.20.0 etter at 1.21.0 er publisert.

```sh
node tools/release.mjs stable ../mattopia-tilbake-1.21.1 1.21.1 ../utpakket-1.20.0/mattopia
```

Behold et Git-merke eller en ZIP av hver godkjente kildeutgave. Erstatt hele den publiserte pakken samlet. Utgaver før 1.7.0 viser øvingen slik den var før profiler ble innført. Profilene blir tilgjengelige igjen i en utgave som støtter dem. Øving gjort i den eldre utgaven i mellomtiden legges ikke inn i eksisterende profiler.

Bruk egne Beta-profiler når du tester tilbakeføring. En tidligere utgave kan overskrive framgang på nyere kart.

## Legg på GitHub Pages

1. Pakk ut ZIP-filen.
2. Last opp innholdet i mappen `mattopia` til roten av et GitHub-repository. `index.html` skal ligge rett i roten, sammen med `app.js`, `core.js`, `style.css`, `sw.js`, `manifest.webmanifest`, `.nojekyll` og `assets/`.
3. Gå til **Settings → Pages → Build and deployment**.
4. Velg **Deploy from a branch**, deretter grenen **main** og mappen **/(root)**. Lagre.
5. Åpne adressen GitHub viser når publiseringen er ferdig.

Appen trenger ingen npm-installasjon eller bygging. Stiene til appfilene er relative, så den fungerer både på `brukernavn.github.io/repository/` og på et eget domene. Mappen `tests/`, `package.json` og denne veiledningen kan bli med i repositoryet, men er ikke nødvendige for selve appen.

[GitHubs veiledning om publisering](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## iPad og iPhone

Åpne den publiserte adressen i Safari. Bruk **Del → Legg til på Hjem-skjerm**. Åpne den installerte appen på nett én gang og la den laste ferdig. Deretter kan øvingen brukes uten nett. Nettleseren må støtte og tillate service workers og lokal lagring. Framgang kan være separat i Safari og i den installerte appen.

## Rediger norske tekster

Åpne `locale-nb.js` i en teksteditor og endre teksten til høyre for nøkkelen. Filen inneholder sentrale tekster i veiviseren, profilredigeringen, oppgavene, hjelpen og kartvisningen. Behold nøklene, anførselstegnene og eventuelle plassholdere som `{count}`. Noen faglige alternativer, stedsnavn, historier og hjelpetekster i innstillingene ligger fortsatt i modulene der de brukes.

Ta vare på filen eller legg ved den redigerte utgaven til neste versjon. Kopier den til kildemappen før du bygger samme versjon, slik at både beta og vanlig utgave får teksten. I senere versjoner fletter du inn de endrede verdiene i den nye språkfilen, så nye nøkler blir med. Last opp hele pakken med et nytt versjonsnummer for at installerte apper skal hente filen. Redigert oppgavetekst gjelder for nye øvingsrunder. Nye språk kan få egne katalogfiler med de samme nøklene og norsk som reserve.

## Nytt i 1.43.0

- Gangstien i Lagunehagen ligger litt over plenen og vises stabilt på kartet.
- Passasjerer går opp trappene til toget, monorailen og trikken, venter på perrongen og går ned igjen.
- Rover-vasken, Elveby bilvask og Kokosvasken har biler som kjører gjennom vaskehallen og stopper mens boblene stiger.
- Luna Grand Resort bygges ved Månestøvsjøen, en blågrå sjø av fint støv. Tomten beregnes på nytt også på lagrede månekart.

## Nytt i 1.42.0

- Veier og spor får jevnere stigning. Små søkk kan fylles igjen, og korte knauser kan senkes lokalt der traseen går.
- Biler og rovere står plant på parkeringsplassen. Brannbilen og patruljebilene parkerer inne i garasjer med åpen port.
- Én sjåfør ved hver residens får spillerens navn. Trykk på sportsbilen, kabrioleten eller svevebilen for å se hvem som kjører.
- Trikkesporet holder seg omtrent tre fjerdedeler av veien fra hovedhuset til kysten i hver retning. Det kan knytte sammen flere kvartaler inne på øyen.

## Nytt i 1.41.0

- Kartet, bonusfeltet, byggkortet og knappene på rundeslutt har samme bredde. Kartet viser mer av nabolaget når et bygg står ferdig.
- Elvebyen har elvelyd og fugler, Palmeøyen har bølger og vind, og Månebasen har dempet ventilasjon og radioglimt. Byggene har egne lydsignaler når de velges.
- Privathusene har en sportsbil i Elvebyen, en klassisk kabriolet på Palmeøya og en svevebil med gullhjelmet astronaut på Månebasen. Kabrioleten kjører også i gatene på Palmeøya.
- Bussen svinger inn og stopper på terminalen. Brannbilen bruker oppkjørselen, og hvert kart får en politistasjon med patruljebil og blålys.
- Trikken dekker flere kvartaler når øyen vokser. T-banenedgangene ligger langs gaten, og tog kan gå under kvartalene. Båter og annet på vannet skjules mens de passerer under brudekket.
- Flyplassene har dekker med mer tekstur. Laguneressorten prioriterer sørkysten. Fyrene har avstand til andre bygg, og Elvebyen og Palmeøya får hvert sitt steinfyr.
- Pikselpalasset, Kveldskinoen, Kulturhuset, Biblioteket, Elvekatedralen og kasinoene har nye modeller. Elvebyen beholder rådhuset som startbygg, og den tidligere rådhusplassen blir Elveby tinghus. Campingplassen er større, og de plasskrevende byggene søker tomter i utkanten.
- Framgangen lagres videre. Kart som er bygget fra før kan få enkelte bygg og veier på nye steder når tomtene beregnes på nytt.

## Nytt i 1.40.0

- De private boligene får større tomter der plassen tillater det, med stakitt, to grønne belter og en liten park med dam bak huset. I Elvebyen og på Palmeøya foretrekkes flate tomter nær en innsjø eller dam i terrenget. Boligen vises med navn i kartinformasjonen.
- Bilene parkerer plant og gir trafikken i gaten forkjørsrett. Bilene bytter på å bruke innkjørselen til de store hagene.

## Nytt i 1.39.1

- Oppgavene, menyene og historiene på kartene bruker bokmålsformer som «jobbet», «tallinjen» og «gaten».

## Nytt i 1.39.0

- Spillere med navn på profilen kan velge å bygge sitt eget hus etter to ferdige bygg på kartet. Elvebyen har en residens, Palmeøya et palass og Månebasen et rompalass. Hvert hus har hage, to parkerte kjøretøy og navnet som ble brukt da det ble valgt.
- Vinduer, karmer og vindusbrett gir flere bygg detaljer på sidene og baksiden. Restauranten på toppen av Målenåla fortsetter å rotere også på travle kart.
- Byggebonus kan gjøre ferdig et kartbygg, gi ett ekstra vekststeg eller én ekstra kloss og legge på opptil tre klosser på en superhelt. Etter runden vises det hva bonusen ga. En opptjent bonus ligger klar til en runde hvor den kan brukes.
- Større kart får flere biler. Kjøretøy som rygger i kø, gir den andre bilen tid til å komme forbi. Av og til stenger et arbeidslag et kort stykke av veien før trafikken slippes fram igjen.
- T-baneinngangene er koblet til fortauene med gangstier. Reisende går ned trappen, og hevede perronger har trapper til bakken.

## Nytt i 1.38.0

- Trafikken øker når byen vokser. Gatene får blant annet småbiler, varebiler og motorsykler. På månen kommer minirovere og månetrikes.
- Flyplasser, resorter, fyr og brygger får rettere adkomstveier som blir en del av veinettet. Kjøretøy kan kjøre helt ut til byggene, og nye gater kan kobles på underveis.
- Små flystriper får mindre propellfly som letter og lander i roligere tempo.
- Gangstier i småparkene går helt ut til fortauet. Figurene kan gå fra parken og videre langs gaten.
- Byggeframdriften følger med ved oppdatering. Gater og noen tomter kan flytte seg når eksisterende kart tegnes på nytt.

## Nytt i 1.37.0

- Fullskjermkartet følger det synlige utsnittet av nettleseren. Kartgester flytter og zoomer kartet mens sideskrolling er låst.
- Flyplasser og havnebygg får jevnere adkomstveier. Hangar og hovedflyplass deler en tomtegruppe og adkomstvei, også når hangaren bygges først.
- Biler og rovere ved verksteder, garasjer og hangarer kan ta en tur i gatene og parkere på samme plass igjen.
- Mer av terrenget rundt åpne gater og byggeplasser vises tidlig. Flere gater får trær eller lysskulpturer og gatelys på begge sider.
- Laguneressorten på Palmeøya tilbys tidlig og ligger ved kysten. Den har større grunnflate og badestrand med solsenger, parasoller og svømmere.
- Månebasen får Luna Grand Resort med panoramatårn, solsenger, parasoller og astronauter som bader i månestøv.
- Byggeframdriften følger med ved oppdatering. Noen tomter kan få ny plassering når kartet tegnes med den oppdaterte kartgeneratoren.

## Nytt i 1.36.0

- Nye kart starter med et ferdig hovedbygg som kan utforskes med en gang. Det teller ikke mot byggene spilleren får for å øve. Eksisterende kart får hovedbygget når du starter et nytt kart.
- Elveburger, Mango Express og Rover Burger er nye byggevalg. En bil svinger av gaten og stopper ved hentevinduet.
- Terrengvandrere og rovere følger mer varierte ruter rundt kartfunn, og gruveåpningene er mørkere. Elvebyens ytre spor er synlige, og kartkameraet viser hele flyplassen når den velges.
- Mellomtrinn får et rolig lydsignal. Ferdige bygg får fanfare, toget og monorailen har egne avgangssignaler, og hvert kart har fire forskjellige rolige melodistrofer med pauser.
- Veiviserens øvingsvalg og belønninger kan redigeres fra spillerprofilen. Kartdemoens stegknapper virker i fullskjerm. Dialoger åpnes med fokus på overskriften, og tastaturnavigasjon har en synlig fokusramme.

## Nytt i 1.35.0

- Lokale profiler kan slettes under **For voksne → Spiller og øving**. «Forklar meg» er tydeligere i runden, og Eplo presenterer seg i veiviseren.
- Hver tredje perfekte runde gir et ekstra byggeløft. Eplo viser hvor langt du er kommet mot neste belønning.
- Hopp på tallinjen på 3. trinn trener på å dele regnestykket opp i mindre hopp.
- Nye kart får mer varierte gater, lommer med gangstier og grøntområder eller krystallplasser, og enkelte gater får avenytrær, lysskulpturer og gatelys.
- Jernbaner får mykere kurver, perronger langs rette strekk og egne jernbanebruer. Trikken kan vokse med Palmeøya, som også får busser og flere biler.
- Oppdatert grottegrafikk, krystaller og UFO-vrak. Månefigurene får unike navn på hvert kart. På månen ligger veier og rullebaner over terrenget.
- Bruk nye kart for å prøve det oppdaterte veinettet og den nye plasseringen av byggene.

## Nytt i 1.34.0

- Velg spor for automatisk progresjon i veiviseren eller under **For voksne → Spiller og øving**. Valgene lagres per spiller og trinn og gjelder fra neste nye runde. Nye profiler på 3. trinn kan vente med «Ganging og deling», som starter uten hake. Fri blanding er et eget valg og er av under automatisk progresjon.
- Elvebyen og Palmeøya har fått mer særpreg i blant annet bakeriet, skolen, brannstasjonen, butikkene og strandhusene. Alle tre kart får seks nye byggvalg hver, inkludert Elvebadet, Mangoparken og Støvsuget med animerte rutsjebaner.
- Nye kart har plass til 40 bygg innenfor samme terreng. Elvebyen utvikler begge elvebreddene. Påbegynte kart fra forrige utgave får tilgang til de nye byggevalgene og fortsetter med sitt opprinnelige antall byggetrinn.
- Gruver, uthus, UFO-vrak og andre kartfunn har flere modeller. Trykk på en figur med spørsmålstegn for å lese om funnet i nærheten.
- Svevebiler har tydeligere motorflammer. Kjøretøy kan kjøre forbi når det er nok plass, og bruker hornet på noen forbikjøringer.
- Tog og monorail kan få underjordiske stopp etter hvert som byen vokser. Måneterrenget avrundes i oversiktsbildet.
- Eplos finalemelding ligger under fullskjermknappene.

## Nytt i 1.33.0

- Utforsk kartet i fullskjerm i appvinduet. Lukk fullskjerm med ikonet eller Escape. Spilleknappen på det aktive kartet åpner samme rundevalg som ellers.
- Nye kartfunn i alle tre kart, blant annet gruve, gullgraverleir, gammelt uthus, hestevogn, glitrende krystaller og UFO-vrak. Funnene følger kartets frø og terrenget som avdekkes.
- Flere navn, historier og korte lyder når du trykker på folk, romvesener, kjøretøy og kartfunn. Se etter romvesenet som titter fram bak en stein.
- Kjøretøy gir hverandre plass gjennom kryss. Når de har låst hverandre, kan ett kjøretøy rygge litt. Svevebilene får motorflammer mens de kjører.
- Oppsummeringen etter hver runde forteller hva som skjer på det aktuelle byggesteget.
- Praktiske pengeoppgaver fra 1. til 6. trinn. Sporene omfatter mynter, veksling, småkjøp, penger tilbake, stykkpris og budsjett. De inngår også i blanding og automatisk progresjon.
- Tolv korte oppmuntringer varierer fra oppgave til oppgave og fra runde til runde.

## Nytt i 1.32.0

- Månebasen får et større visuelt løft: Saturn-ringer, tallerkentak, kapselhotell, krystallspir, romsopper og mer særpreg på de ulike byggene. Påbegynte kart beholder framdriften sin.
- Mobil og iPad får 65 prosent større zoomområde og litt nærmere detaljvisning. Dette gjelder alle store byggeprosjekter, også superheltene.
- Trykk på personer, romvesener og kjøretøy i alle tre kart for å lese navn og små tullete historier. Treffområdet er litt romsligere på berøringsskjermer.
- Besøkende ved alle bygg beveger seg uavhengig av antallet kjøretøy. Vandrere kan stoppe for å tenke; spørsmålstegn vises i utforskvisningen.
- Fotballspillere følger ballen, sparker og får av og til en ball i hjelmen med små stjerner rundt hodet. Gjelder både Elvebyen og Månebasen.
- Flere romdrakter og romvesener, kraterutforsker og en rover-buss på månen. Buss og biler deler trafikkreglene.
- Stjernehimmelen får forsiktig parallakse når kartet flyttes og zoomes. Redusert bevegelse respekteres.
- Felles figurbevegelse og trefftesting er samlet slik at funksjonene kan brukes på alle kart. Mobil/iPad bør kontrolleres i beta før publisering.

## Nytt i 1.31.1

- Eplo får riktig avsatt plass ved snakkeboblen i pause- og velkomstvisninger, også ved superheltbygg.
- Startsiden viser én Eplo på en fast plass. Små ablegøyer begynner først etter en stund uten aktivitet; et poff etterfølges av vanlig Eplo igjen.
- 140 automatiske tester passerer. Visuell kontroll på iPhone/iPad gjenstår.

## Nytt i 1.31.0

- Eplo dukker opp på flere steder på startsiden. Hvert innslag har en liten lyd, og røykskyen har en poff-lyd.
- «Perfekt runde!» har en egen seiersmelodi. Ferdige klossebygg og planter får en kort animasjon.
- Fra «Utforsk kartet» kan du gå rett til en øvingsrunde eller fortsette der du slapp.
- «Bygging og belønninger» bruker de samme illustrasjonene som veiviseren. Bakgrunnen bak «Velkommen tilbake» er mørkere.

## Nytt i 1.30.1

- Lille Eplo og den vanlige snakkeboblen toner inn igjen etter «Perfekt runde!».
- «Velkommen tilbake» har ett lukkekryss ved tittelen og en egen plass til Eplos hilsen over forhåndsvisningen.

## Nytt i 1.30.0

- Ved en perfekt runde blir Eplo og snakkeboblen større over siste oppgave. Gnister og stjerner sprer seg rundt dem før feiringen toner ut.
- Eplo har fått større plass på startsiden. Innslagene veksler blant annet mellom vinterlue og skjerf, gjesping og boklesing.

## Nytt i 1.29.2

- Byggevalgene i veiviseren starter med «Bygg». Den mørke rammen rundt illustrasjonene følger de avrundede hjørnene.

## Nytt i 1.29.1

- Astronautbanen og andre bygg med firkantet plattform får firkantet grunnmur. Brede flater oppå plattformen følger samme kontur som muren, også på eldre kart.

## Nytt i 1.29.0

- Profilvelgeren har 24 avatarer i to grupper. De 12 nye motivene dekker blant annet musikk, sport, spill, friluftsliv og verdensrom.
- Veiviseren viser illustrerte kort for alle åtte belønninger, med egne motiver for hver helt og hvert kart.
- På siste oppgave sier Eplo «Perfekt runde!» i den vanlige snakkeboblen. Eplo hopper litt og det gnistrer rundt boblen.
- Faden på månekartet tegnes uten skjøter i den lille visningen. Flyvebilene har en astronaut bak rattet, av og til med en passasjer.

## Nytt i 1.28.0

- Tog, monorail og trikk legges med klaring til bygninger. Hjørnebistroen har fått terrakottatak, og flere andre tak skiller seg tydeligere fra veien.
- Flyvebiler kan kjøre på månebasen fra starten, så snart det finnes en kjørbar rute.
- Eplo sier «Perfekt runde!» på siste oppgave, før belønningen åpnes.
- Når startsiden har stått i ro, kan Eplo drikke juice, ta på solbriller eller sjonglere. Ved berøring forsvinner han i en liten røyksky.

## Nytt i 1.27.0

- Månebasen har stjernehimmel rundt hele kartet fra første byggesteg. Lukkekryssene i velkomstbildet har tett bakgrunn.
- Hvert bygg har en kort lyd når det velges på kartet eller i nedtrekkslisten. Det vanlige blippet spilles først.
- Eplo sier «Perfekt runde!» når alle svar er riktige på første forsøk. Meldingen toner ut av seg selv.

## Nytt i 1.26.2

- «Bygg på kartet» sentrerer kartet på bygget du velger. Når du lukker kartvinduet, tones lyd og effekter raskt ut.

## Nytt i 1.26.1

- Måneterrenget toner ut i svart. Stjernene og jordkloden har mer kontrast når de kommer til syne over horisonten.

## Nytt i 1.26.0

- Riktige svar følger en stigende lydrekke gjennom runder med fem, seks eller åtte oppgaver. Den siste oppgaven har den lyseste fanfaren.
- Elveby lufthavn har en større tomt og lengre rullebane. Månebasen har fått egen flyplass med en romferge som tar av og lander, og tre nye høyhus.
- Terrenget er synlig lenger ut fra starten og toner ut langs en ujevn, avrundet horisont. På berøringsskjermer er knipegesten på kartet forbeholdt kartets zoom.

## Nytt i 1.25.0

- Eplo ønsker spilleren velkommen tilbake med navn. Over kartet står figuren fritt ved siden av en snakkeboble med lukkeknapp. Munnbevegelsen er kortere og ender med et smil med øynene.
- Byggevalgene for flyplass, trikk og tog viser kjøretøyene. Grunnmur og grunnflate bruker samme kontur.
- Tunnelene følger banen som én sammenhengende ås. Togbanene kan vokse med byen, og lange nok baner kan få et ekstra tog eller en ekstra trikk. Tåken slipper mer av terrenget til syne rundt byen.
- Sagingen er roligere og første suksessfanfare er forkortet. Innstillingene under «For voksne» er gruppert etter tema.

## Nytt i 1.24.0

- Eplo beveger munnen litt lenger når han har en snakkeboble. Ellers smiler han med øynene.
- Elvebyen har elvelyd og små jazzstrofer, Palmeøya har bølger og cubanske strofer, og Månebasen har en egen rommelodi. Motorlydene ligger lavere i miksen.
- Tog og monorail følger gjennomgående sløyfer. Der sporet går i tunnel, kommer toget ut av en egen åpning på den andre siden. Veitunneler har flat veibane i samme høyde ved begge åpningene.

## Nytt i 1.23.0

- Nye profiler starter med fem oppgaver per runde. Første byggevalg har egen tekst, og «En runde til» er hovedvalget etter en vanlig runde.
- Eplo hilser med en liten animasjon. Hilsenen kan lukkes i pausen og når kartet er ferdig. På berøringsskjermer zoomer du ved å klype på kartet.
- Banene i Elvebyen og på Månebasen fortsetter ut av kartet gjennom tunneler. Enkelte veier går også gjennom lave åsrygger. Biler kan bytte rute på felles veistrekninger, og kjøretøyene lener seg med stigningen.
- Fyrtårn bygges ved vannet. Den delvis åpne Palmetrikken ringer ved avgang.
- Kartene har egne lengre lydsløyfer, med sporadisk theremin på månen, salsa ved hotell på Palmeøya, tivolivals når pariserhjulet er bygd og et tut fra trafikken av og til. Fire korte fanfarer veksler ved riktige svar.

## Nytt i 1.22.0

- Fri blanding på valgt klassetrinn eller på tvers av 3.–10. trinn. Valgene finnes i profilveiviseren og under «For voksne». Blandet øving teller mot byggeprosjektene, mens automatisk progresjon følger det valgte sporet.
- Nye oppgavevarianter i blant annet koordinater, brøk, måling, statistikk, algebra og økonomi, med utgangspunkt i kompetansemålene i MAT01-05.
- Trykk på et bygg for å fremheve konturen og lese det Eplo forteller. Eplo kan også dukke opp over kartet under pausen og finalen.
- Kjøretøy kan kjøre gjennom flere kvartaler og vente på hverandre. Tog og monorail stopper underveis før de fortsetter ut av kartet. Nye Palmeøya kan få en trikk med tre stopp.
- Nye kart har plass til 30 bygg og flere byggevalg, blant annet flyplass i Elvebyen og et månetårn med roterende restaurant. Nye Elvebyen har bredere elv, og både Elvebyen og Palmeøya har tydeligere dammer. Påbegynte kart beholder sine opprinnelige tomter og mål.

## Nytt i 1.21.0

- Eplo hilser i pausen, viser framgangen på valgt prosjekt og veksler mellom ulike oppmuntringer.
- Hjemskjermappen har en fast flate med samme farge som resten av appen ved statusfeltet på iPhone. Det gir iOS en heldekkende bakgrunn for toppkanten.
- På støttede iPhone- og iPad-nettlesere holder et tilnærmet lydløst signal lydøkten aktiv etter første avspilling, så lenge applyden er på og appen er i forgrunnen.
- Lyd fra fyrverkeriet følger hver rakett. Fyrverkeriet varer ett sekund lenger. Mellomsteg har en lengre og tydeligere byggeplasslyd før omgivelseslyden toner inn.
- Fly, helikopter og trafikk har egne motorlyder. Fornøyelsesparkene får små melodier og karusellhyl, og forbipasserende får korte stemmelyder.
- Tog og monorail går over flere kvartaler og svinger mellom gatene før tunnelene. Kartutsnittet rundt stasjonen viser mer av sporet.

## Nytt i 1.20.0

- Elveby stasjon og Månesporet dukker opp som byggevalg når minst to bygg står ferdige. Begge stasjonene åpner en bane med tog og tunnelportaler etter tre byggesteg.
- Helikoptre flyr over Elvebyen og bruker den nye landingsplassen ved Palmeflyplassen.
- Et trykk på et bygg fremhever tomten. Eplo hilser ved profiloppretting, gir hint i oppgavene og forteller små historier om byggene.
- Byggetrinn har egne lyder for månen og jorden. Lydbildet i kartene vokser med antall bygg, og fly, raketter og andre kjøretøy kan høres når de passerer i utsnittet. Omgivelseslyden ligger på 75 prosent av den vanlige miksen.
- Lengre fyrverkeri og applaus feirer nye bygg. Ved fullført kart eller superhelt kommer Eplo med en egen hilsen og en snarvei til samlingen. Velg «Vis finalen» i en byggedemo i beta for å se feiringen direkte.
- På iPhone og iPad ber Mattopia om avspilling i lydløsmodus der nettleseren støtter det. Lydbryteren i appen styrer fremdeles all lyd.

## Nytt i 1.19.0

- Mattopia har sesongdetaljer som følger datoen, med vinter, jul, påske, vår, sommer, høst og Halloween.
- Byggeplasser i terreng får sokler med mur- og steindetaljer, varierte grunnflater og egne adkomster. Nye veistykker kan komme til syne før det første byggesteget.
- Veikryss får ryddigere kanter. Langs gatene dukker det opp gangfelt, lys og trær.
- Rovergarasjen, verkstedet og lasteterminalen har tårn og glassbroer. Månebasen har både gatekjøring og roverruter i terrenget.
- Flyplassen har en lengre diagonal rullebane og mer bakkekjøring før avgang og etter landing. Baner og tivoli har spillere, besøkende og passasjerer.
- Trykk på et bygg i kartet eller velg det fra listen for å lese hva som skjer der.

## Nytt i 1.18.0

- Husk klossebygget bruker isometriske klosser med fargesymboler. Dra klossene til omrissene, eller trykk på en kloss og deretter plassen. Kims lek trekker fra 40 illustrasjoner.
- Nye Elvebyen, Månebasen og Palmeøya har 36 mulige bygg hver. Kartet er fullført etter 24 valg, fortsatt med tre runder per bygg. Kart som allerede er påbegynt beholder sitt opprinnelige utvalg og plasseringene sine.
- Elvebyen får blant annet fabrikk, bussterminal og skyskrapere. Månebasen får små kratere, Moon Burger, Cosmic Ice Cream og raketter som tar av og lander. Palmeøya får større hoteller, flyplasser med fly i bevegelse, badende og vannscootere.
- Når et bygg ferdigstilles, vises et lite fyrverkeri over bygget. Hele ferdige kart og superheltbygg får en egen gratulasjon og snarvei til samlingen.
- Dra direkte for å rotere en superhelt og klyp for å zoome. Kartutsnittet på rundeslutt og i pausen er litt høyere.

## Nytt i 1.17.0

- Gatenettet har avrundede svinger med midtstriper som følger veien. Automatisk bygde bruer har eget dekke, rekkverk og pilarer.
- Mot slutten går landskapet over i en isometrisk horisont som gradvis toner ut i kanten.
- Oppgavetelleren står i et fast, dekkende toppfelt mens selve oppgaven kan rulle.
- Kartene har knappen **Utforsk kartet** og viser siste byggetrinn på nært hold etter en runde og ved pause. Superheltfigurene har motsatt drageretning i roteringsmodus.

## Nytt i 1.16.0

- Kartene har fast isometrisk vinkel. Du kan dra, zoome og velge **Oversikt**. Rotasjon ligger i visningen av superheltfigurene.
- Nye kart starter med et lite kvartal og et kjøretøy. Det sammenhengende gatenettet blir synlig bit for bit etter hvert som du bygger. Kart fra 1.15.0 fortsetter med sine opprinnelige veier og byggeplasser.
- Kran, gravemaskin, sperringer og stillas viser hvor det bygges. Utsnittet viser området rundt byggeplassen. Når bygget er ferdig, zoomer visningen mykt inn. **Vis siste steg** spiller av overgangen.
- Ferdige pariserhjul snurrer og vognene kjører rundt i berg-og-dal-banen. Når kartet nærmer seg ferdig, kommer fjellene, verdensrommet eller havhorisonten til syne.
- Fasader, terreng, trær og knauser har flere detaljer. I Beta kan dere prøve de nye kartene under **For voksne → Byggedemoer**.
- Teksten beholder full kontrast ved skjermbytte. Toppen av skjermen tar høyde for mobilens sikre visningsområde.

## Nytt i 1.15.0

- Elvebyen, Månebasen og Palmeøya har faste, tilfeldig genererte landskap. Tåken letter rundt veier og byggeplasser mens spilleren utforsker terrenget. Veier svinger mellom høydedrag, dammer og kratere, og byggene vender seg mot adkomsten sin.
- Hvert nytt kart har 24 byggeprosjekter, med tre runder per bygg. Blant dem er et rådhus, en rød hengebro, en biodome, en astronautbane, en hotellresort og en berg-og-dal-bane.
- Biler, månebiler, mennesker og dyr kommer til underveis. Ferdige brygger og kaier får båttrafikk.
- **Se samlingen → Bygg og kart** samler ferdige bygg fra både aktive og tidligere kart. Trykk på et bygg for å finne det i 3D. Bruk **Oversikt** for å se hele det utforskede området.
- Påbegynte kart fra tidligere utgaver fortsetter med sin opprinnelige utforming. Det nye landskapet brukes når et nytt kart startes. I Beta kan dere prøve det under **For voksne → Byggedemoer**.

## Nytt i 1.14.0

- Elvebyen, Månebasen og Palmeøya begynner med et lite område. Gater, terreng og detaljer kommer til rundt byggene. Hvert nytt kart får et tilfeldig landskap som lagres med profilen.
- Velg mellom opptil tre bygg før du starter på neste. Hvert bygg tar tre runder, og et nytt kart har 16 byggverk. Trær, lys og kjøretøy hører til områdene som vokser fram. Når kartet er ferdig, kan du starte et nytt og finne ferdige kart under **Tidligere kart**.
- Eksisterende kart bruker samme plassering av byggene. Når et påbegynt bygg er ferdig, dukker de nye byggevalgene opp.
- Profilveiviseren lar dere velge klassetrinn, avatar, fast spor eller automatisk progresjon, antall oppgaver og belønning. Valgene kan justeres under **For voksne**.
- I Beta kan dere gå til **For voksne → Start på nytt i Beta** for å avbryte en runde eller nullstille et valgt stort prosjekt. I pausens meny ligger også **Avbryt runden**. En nullstilling av kart genererer et nytt landskap. Byggedemoene har en egen knapp for nytt demokart.

## Nytt i 1.13.0

- **For voksne** i Beta viser både den åpne betaversjonen og versjonen som svarer på `/mattopia/` på samme domene. Oppslaget henter `core.js` fra nettet utenom appens offlinecache. Det vises en egen status dersom hovedadressen er utilgjengelig.
- Elvebyen, Månebasen og Palmeøya har egne skilt, rikere fasader og mer terrengdetaljer. Bilen kjører en runde gjennom sammenhengende gater. Månebasen har en sekshjuls rover, en astronaut og en alien.
- Nye byggedeler på kartene vokser fra underlaget og får et kort lysskinn. Effekten kan spilles på nytt med **Vis igjen**. Med redusert bevegelse vises det ferdige steget direkte.
- Hvert kart har sin egen svake omgivelseslyd i 3D-visningen. **Omgivelseslyd** slår av bakgrunnslyden i den åpne visningen. Lyden stopper ved lukking, og appens lydvalg styrer om den kan spilles.
- Superhelter, små klossefigurer, planter og utmerkelser har fått mer detaljerte overflater, illustrasjoner og lys.

## Nytt i 1.12.0

- Elvebyen, Månebasen og Palmeøya har større landflater, justerte plasseringer og mykere former. Større landflater gir plass til alle bygg og gjenstander. Byggesteg og lagret framgang følger samme rekkefølge som før.
- Når et bygg eller en gjenstand blir ferdig, vises **Ferdig på kartet** med navn, konfetti og en egen fanfare. Det kan også prøves i byggedemoene.
- Forsiden veksler mellom to øvingshilsener etter fullførte runder. Stjerner og utmerkelser vises under **Så langt har du kommet**. Utmerkelsene har hver sin form, palett og illustrasjon.

## Nytt i 1.11.0

- Elvebyen, Månebasen og Palmeøya viser siste byggesteg på makszoom. Bruk **Oversikt** for å se hele kartet.
- I Beta åpner **For voksne → Byggedemoer** alle de seks store prosjektene. Bruk **Forrige**, **Neste** eller venstre og høyre piltast for å prøve byggestegene. Når selve 3D-bildet har tastaturfokus, styrer piltastene kameraet. Demoen bruker en egen teller og lagrer ingen framgang.
- Beta-merket sitter over logoen i toppfeltet og i den eksisterende framdriftslinjen under øving.
- Kims lek og avatarene har egne SVG-illustrasjoner. Øvingen har fått litt mykere overganger og korte lyder når du går videre, velger bilder eller åpner byggevisningen. Lydknappen styrer også de nye lydene.
- **En runde til** og **Ta en pause** har større, innrammede knapper.

## Nytt i 1.10.0

- Et nærbilde følger det nyeste byggesteget. Etter runden flyr de nye klossene på plass og markeres i gull. Navnet og trinnnummeret blir stående. Trykk **Vis igjen** på resultatsiden, eller **Vis siste steg** i 3D-visningen. **Oversikt** zoomer ut.
- Elvebyen, Månebasen og Palmeøya har mykere terrengkanter, små detaljer i overflatene og henholdsvis en bil, en rover og en fugl i bevegelse.
- Oppgaver, skjermbytter og dialoger har korte overganger. Når enheten ber om redusert bevegelse, vises siste byggesteg direkte og detaljene i landskapet står i ro.
- Vibrasjon følger svar og fullføringer på enheter og nettlesere som støtter Vibration API. På de enhetene kan du slå av vibrasjonen under **For voksne** uavhengig av lyden. Safari på iPhone og iPad bruker visuell tilbakemelding og lyd.

## Nytt i 1.9.0

I **For voksne → Oppgaver per runde** kan hver spiller bruke fem, seks eller åtte oppgaver. Åtte er standard. En påbegynt runde beholder lengden den startet med. Automatisk progresjon går fortsatt over til neste øvingsspor etter tre fullførte runder, og historikken viser hvor lang hver runde faktisk var.

Under **For voksne → Hva vil barnet bygge videre på? → Store byggeprosjekter** kan dere velge et bygg som vokser over flere runder. Hver fullførte runde gir én stjerne og ett byggesteg så lenge prosjektet har flere steg. Framgangen lagres separat for hvert prosjekt og hver spiller. Blomster og små klossefigurer kan fortsatt velges.

| Prosjekter | Runder per prosjekt |
| --- | ---: |
| Rustningshelten, Edderkopphelten og Skjoldhelten | 24 |
| Elvebyen, Månebasen og Palmeøya | 120 |

Trykk **Utforsk i 3D** på forsiden eller etter en runde. Velg **Flytt** eller **Roter** og dra i bildet. Klyp eller bruk **+** og **−** for å zoome. Bruk **Oversikt** for å se hele byggeprosjektet. Med tastaturet kan du bruke piltastene, pluss, minus og null når bildet har fokus. Ferdige bygg kan fortsatt utforskes.

## Nytt i 1.8.0

- Øvingssporene følger klassetrinnet som er valgt på profilen. I **For voksne** kan du bytte trinn og øvingsspor. En påbegynt runde kan fullføres før det nye valget trer i kraft. Uten klassetrinn får du de opprinnelige øvingsvalgene.
- **Automatisk progresjon** er valgfri og avslått som standard. Første runde på sporet bruker det valgte sporet. Andre og tredje runde får henholdsvis én og to oppgaver fra neste spor. Etter tre fullførte runder, altså 24 oppgaver, bytter appen spor innenfor samme trinn. Man kan også velge spor selv.
- **Hvilket tall er dette?** viser brikkene først. Forklaringen med antall hundrere, tiere og enere vises etter det andre hintet eller ved riktig svar.
- Avatarvalget har tolv større bilder. Bildene i Kims lek er også litt større.

### Eksempler på øving per trinn

| Trinn | Eksempler |
| --- | --- |
| 1 | Telle brikker, legge til og ta bort med tall til 10 |
| 2 | Tallmønstre, former og de første tallområdene |
| 3 | Plassverdi, pluss og minus, like grupper, måling og koordinater |
| 4 | Gangetabeller, deling, areal i ruter og volum i klosser |
| 5 | Brøk som del av en hel og av en mengde, enkle likninger og sjanse |
| 6 | Desimaltall og prosent i praktiske situasjoner, areal, omkrets og volum |
| 7 | Negative tall, regnerekkefølge, brøkregning, likninger og statistikk |
| 8 | Primtallsfaktorer, brøkforkorting, algebra, funksjonstabeller og fart |
| 9 | Pytagoras, formlikhet, volum, statistikk og sannsynlighet |
| 10 | Stigningstall, prosentvis vekst, likningssett, rabatt og rente |

Øvingssporene trener utvalgte deler av [Udirs læreplan i matematikk, MAT01-05](https://www.udir.no/lk20/mat01-05?lang=nob). På 1. trinn er det lagt inn en enklere inngang til kompetansemålene etter 2. trinn.

## Nytt i 1.7.0

- Første gang kan barnet velge fornavn eller kallenavn, klassetrinn og avatar. Øving fra tidligere versjoner følger med den første profilen.
- **Bytt spiller** på forsiden åpner spillerlisten. Søsken kan legge til en egen profil med separat framgang, stjerner, samling, øvingsnivå og påbegynt runde.
- Klassetrinn fra 1. til 10. trinn kan endres i profilen eller under **For voksne**. Øvingsnivå velges separat.
- Voksenpanelet forklarer hvilke oppgavetyper **Ganging og deling** blander, og hvordan fordelingen kan endre seg.

## Nytt i 1.6.1

- Neste bygg vises som et omriss uten navn på forsiden, i velkomsten og på resultatskjermen.
- **For voksne → Test pauseleker** i betaen åpner hver lek direkte. Legg til `#pauselek=kims-lek`, `#pauselek=klossebygget` eller `#pauselek=klossegulvet` på slutten av betaadressen for å bokmerke en lek. Testene gir ingen stjerner eller klosser og bruker ikke opp en planlagt pauselek.
- Et lite eple med en stjerne pryder appnavnet i toppteksten. Ikonet på enhetens hjemskjerm er beholdt.

## Nytt i 1.6.0

- Etter et ferdig bygg vises neste figur i farger både på resultatskjermen og forsiden. Barnet får den første klossen når neste runde er fullført.
- **Pauseleker mellom øvingsrundene** i voksenvisningen veksler mellom Kims lek, **Husk klossebygget** og **Klossegulvet**. Valget fra tidligere versjoner beholdes.
- I **Husk klossebygget** får barnet se en liten figur i eget tempo og plassere fargeklossene på skyggene. Dra klossene, eller trykk først på en kloss og så på en plass. Trykk på en plassert kloss for å legge den tilbake, eller dra den til en annen plass.
- I **Klossegulvet** teller barnet hvor mange klosser som trengs for å dekke de tomme rutene. Størrelsen på gulvet og de ferdiglagte klossene varierer.
- Pauselekene har to nye forsøk etter det første. Riktig gir konfetti og en fanfare. Ved nytt forsøk reagerer eplet med en liten overrasket lyd.
- **Vis alltid brikker og figurer** har fått en forklaring i voksenvisningen.

## Nytt i 1.5.0

- **Tallvenn Beta** viser et lilla merke med kolbe og «BETA · Testversjon», også under oppgavene. Ved ny publiseringsadresse legger du den til på Hjem-skjermen fra den nye adressen.
- **Kims lek** viser fire bilder så lenge barnet ønsker. Barnet velger fire av åtte bilder og trykker **Sjekk svarene**. Etter et forsøk kan barnet se på de samme bildene og prøve på nytt opptil to ganger. Fire riktige gir en liten fanfare.
- Et hint glir opp fra bunnen etter et feil svar. Svarene åpnes igjen med **Prøv igjen**. Et lite regndryss markerer feil svar, konfetti markerer riktig svar, og eplet reagerer med ansiktsuttrykk og korte, syntetiske lyder.
- Pluss og minus varierer på alle tre tallnivåer. En ny oppgavetype lar barnet finne det manglende tallet i et regnestykke. **Ganging og deling** kan velges separat under **For voksne** og bruker brikker i like grupper.
- Når barnet vender tilbake etter minst 15 minutter, kan en kort velkomst vise hva som bygges eller dyrkes og ta barnet videre til en runde.

## Nytt i 1.4.0

- 18 byggefigurer og åtte planter. Hver runde gir én kloss eller ett vekststeg. Fem steg gir et ferdig bygg eller en ferdig plante.
- Ferdige figurer og planter kan åpnes i stort format fra forsiden eller fra **Se samlingen**.
- Merker ved 3, 10, 25, 50 og 100 stjerner. Stjerner som allerede er tjent opp, teller med.
- Riktig svar får et grønt lite utbrudd. Feil valg markeres i dempet rødt og gir et hint. Etter en kort tenkepause åpner **Prøv igjen** svarene på nytt.
- **For voksne → Kims lek mellom øvingsrundene** legger inn en huskelek etter hver tredje fullførte runde. Barnet skjuler bildet når det er klart. Etter bom får det se alle bildene på nytt. Innstillingen er av som standard.

## Nytt i 1.3.0

- Svaralternativer og talltaster får ikke lenger grønn hover-farge som kan bli hengende etter berøring. Før et svar er valgt er de tre alternativene hvite. Et riktig svar blir fortsatt grønt. Tastaturfokus beholdes synlig for dem som bruker fysisk tastatur.
- Svarfeltet i regnestykkene har mer padding og automatisk høyde, også ved tresifrede svar. Luft og innramming beholdes på små skjermer.
- Talltastaturet har et kort, dempet knepp ved siffer og sletting, sammen med en liten trykkeffekt og bevegelse i tallfeltet. Lyden følger lydinnstillingen og avbryter ikke «prøv igjen»-melodien. Bevegelse slås av ved redusert bevegelse. Slettetasten er inaktiv når feltet er tomt; fysisk tastatur og Enter virker fortsatt.
- Klossene tegnes isometrisk med tydelig topp, front og side, to rader med knotter og lys/skygge. De tidligere figurene er beholdt.
- En superhelt med maske, kappe og lynmerke er lagt til. Nå veksler appen mellom **seks figurer**, fortsatt med **fem klosser per figur**. Ett fullført bygg starter et nytt tilfeldig byggeprosjekt ved neste nye runde. Et påbegynt bygg og samlingen beholdes, og superhelten legges til blant de kommende figurene ved oppgradering.

## Nytt i 1.2.2

- Ved telling bakover står det manglende tallet til venstre: **?, 700, 701**. Ved telling framover står det til høyre: **698, 699, ?**. Hjelpetallrekken viser også mindre tall til venstre og større tall til høyre.
- Oppdateringer henter alle appfiler med en versjonsmerket adresse og `cache: 'reload'`. Dermed blir ikke en ny offlinepakke fylt med eldre filer fra nettleserens HTTP-cache.
- «Oppdater nå» venter på at den nye service workeren faktisk styrer siden, og kontrollerer versjonen før framgangen lagres og appen åpnes på nytt. Gjentatte trykk blokkeres mens oppdateringen pågår. En tidsavbrutt oppdatering viser en forklaring og laster ikke siden om igjen.
- Den nye service workeren venter med å svare eldre appversjoner til aktiveringen og overtakelsen er ferdig. Det hjelper også appversjoner som fortsatt har den gamle oppdateringsknappen.

## Nytt i 1.2.1

- Tallrekkene øver fortsatt på tier- og hundreroverganger, nå i begge retninger. Eksempler: **698, 699, ? → 700** og **701, 700, ? → 699**. Retningen velges mellom oppgavene. Hint, hjelpetallrekke, skjermlesertekst og tilbakemelding følger samme retning.
- Teksten for den ferdige klosseanden er endret til **Anden er ferdig!**
- De tre tallfeltene i tallrekkene har samme størrelse og padding, også når svaret får grønn ramme.
- Påbegynte oppgaver beholdes ved oppdatering. De nye tallrekkene kommer i nye runder.

## Nytt i 1.2.0: klossebygging

Velg **For voksne → Hva vil barnet bygge videre på? → Klossebygging**. Plante er fortsatt standard og beholdes ved oppgradering.

- Hver fullførte runde gir nøyaktig én ny kloss, uansett antall feil eller bruk av hjelp. Ingen ekstraklosser gis ved å åpne forsiden på nytt, laste siden på nytt eller bytte modus.
- Fem store, tydelig tegnede klosser med knotter blir til en robot, rakett, et hus, et tog eller en and. Nye klosser får en kort plasseringseffekt. Redusert bevegelse respekteres.
- Figuren velges tilfeldig én gang per byggeprosjekt. Rekkefølgen blandes slik at alle fem modellene vises før en ny blanding, og samme figur velges ikke to ganger på rad.
- Den ferdige figuren blir stående til neste nye runde starter. Da velges et nytt bygg. De siste ferdige figurene vises som en liten samling på forsiden; samlet antall beholdes selv om den lagrede bildelisten begrenses til tjue.
- Planten og klossebygget har hver sin framgang. Bytte av modus bevarer begge, sammen med stjerner og øvingshistorikk. Planteveksten fra 1.0 og 1.1 migreres automatisk.
- Valget ligger bare i voksenvisningen. Barnet fortsetter med samme startknapp og åtte oppgaver.

Et nytt bygg begynner på null klosser når klossemodus velges for første gang. Tidligere plantestjerner blir ikke omgjort til klosser. Alle fullførte runder gir fortsatt en stjerne, uansett valgt belønning.

## Nytt i 1.1.0

- Figuren følger barnet gjennom oppgavene med små, vennlige kommentarer.
- En plante vokser for hver fullførte runde. Etter fem runder blomstrer den, og barnet samler blomster videre i hagen. Stjerner gis fortsatt for å øve, uansett feil og hjelp.
- En lys, stigende melodi ved riktig svar, en vennlig «prøv igjen»-melodi ved feil og en kort fanfare med konfetti når runden fullføres. Lydknappen er tilgjengelig både på forsiden og under øvingen. Lyden er på for nye brukere; eksisterende lydvalg beholdes. Konfetti og animasjoner tar hensyn til redusert bevegelse.
- Hjelpen kommer i tre steg. Først rettes oppmerksomheten mot en handling eller sammenheng. Siste steg kan vise svaret. Ved tierovergang kan barnet flytte nye brikker inn i en tier og telle resten.
- Appen bruker de siste rundene på valgt nivå til å velge et fokus. Vanlig oppbygning etter de første øktene er to kjente oppgaver, fire fokusoppgaver og to blandede oppgaver.
- En oppgavetype som trengte hjelp kan komme tilbake med nye tall etter to andre oppgaver. Voksen velger fortsatt tallområdet; appen øker ikke nivået automatisk.
- Visuell støtte kan bli valgfri etter flere trygge runder på samme nivå og emne. «Vis meg» henter den tilbake. Etter ytterligere øving uten hjelp kan én eller to avsluttende oppgaver få et stort talltastatur.
- Under **For voksne** finnes en emneoversikt og valget **Vis alltid brikker og figurer**. Oversikten beskriver øvingen og er ingen mestringstest.
- Oppdateringer kan oppdages i appen, og en ny versjon kan lastes uten å slette framgangen.

## Hvordan øvingen fungerer

Én startknapp og ingen tidsfrist. Runden lagres slik at barnet kan ta pause og fortsette senere. I voksenvisningen kan du velge rundelengde og øvingsspor for klassetrinnet. Uten klassetrinn starter appen med tall til 20.

Oppgavene dekker tiere og enere, tiervenner, tallrekke, pluss og minus. Brikker kan trykkes bort og legges tilbake, og tomme ruter kan fylles. Svaret velges med tre store knapper; talltastatur innføres først etter flere økter. En stjerne betyr en fullført øvingsrunde, ikke at alle oppgavene er mestret.

Tilpasningen er en enkel, lokal regelmodell, ikke en pedagogisk utredning eller en garanti for læring. Figurene blir først valgfrie når det finnes minst seks relevante svar fra minst tre runder, med overveiende riktige førsteforsøk uten åpnet hjelp. Talltastatur krever mer øving med valgfri støtte. Voksen kan overstyre ved å vise figurene hele tiden.

Bruk gjerne noen økter sammen med barnet. Spør hvordan det tenkte, og tilpass nivået i samarbeid med læreren.

## Data og personvern

Framgang, valgfritt navn, avatar og klassetrinn lagres i `localStorage` i nettleseren eller hjemskjermappen. Det er ingen analyseverktøy, annonser, konto, tredjepartsressurser eller synkronisering. Vanlig nettverkslogging hos vertstjenesten styres av vertstjenesten. Hvis nettleseren blokkerer lagring, fungerer oppgavene likevel mens appen er åpen. Voksenvisningen opplyser om dette.

Sletting av nettleserdata sletter også framgangen. Historikken til den aktive spilleren kan slettes i voksenvisningen med bekreftelse.

## Lokal utvikling og sjekk

Åpne via en webserver, ikke ved å dobbeltklikke `index.html`:

```sh
cd mattopia
python3 -m http.server 8000
```

Åpne http://localhost:8000. For oppgavegenerator, lagring og rundeoverganger:

```sh
node --test tests/*.test.js
```

Ved utvikling kan en eldre service worker holde på filene. Fjern registreringen og appens cache i nettleserens utviklerverktøy, eller bruk et nytt testoppsett.

## Oppdateringer fra GitHub Pages

**Oppdater til 1.8.0:** Erstatt filene med innholdet fra pakken, også `style.css`, `sound.js`, `rewards.js`, `sw.js` og de andre JavaScript-filene. Velg deretter **For voksne → Se etter oppdatering → Oppdater nå** når den nye versjonen er tilgjengelig. Se etter **Appversjon 1.8.0**. Eksisterende planteframgang, bygg, samling, stjerner, historikk, lydvalg og påbegynt runde beholdes.

**Hvis iPad åpner en eldre versjon:** Vent til publiseringen på GitHub Pages er ferdig. Åpne appen på nett og velg «Se etter oppdatering». Lukk deretter appen helt fra appveksleren (eller lukk alle Tallvenn-faner hvis du bruker Safari) og åpne den igjen på samme adresse. Dette lukker bare appen; ikke slett den eller nettleserdataene. Kontroller versjonen i voksenvisningen. En installert app og Safari kan ha separat framgang, så prøv i den samme du vanligvis bruker.

Last opp og erstatt appfilene på **samme adresse og sti** som før. Behold `assets/` og alle JavaScript-filene, inkludert `learning.js`, `sound.js`, `update.js` og den nye `rewards.js`.

Appen sjekker etter ny service worker ved åpning og kan sjekke igjen når den kommer tilbake fra bakgrunnen utenfor en øvingsrunde. Du kan også velge **For voksne → Se etter oppdatering**. Når en ny, komplett appversjon er lastet ned, vises **Ny versjon klar → Oppdater** på forsiden eller etter runden. Oppgavene blir aldri automatisk avbrutt av en sidelasting. Knappen lagrer framgangen før den laster siden på nytt. Hvis lagring feiler, venter oppdateringen.

**Første overgang fra 1.0.0:** Den gamle versjonen har ikke oppdateringsknappen. Etter publisering åpner du appen på nett og laster siden på nytt. Hvis 1.0.0 fortsatt vises, gi nettleseren noen sekunder til å hente den nye service workeren og last siden på nytt igjen. Du kan også lukke alle Tallvenn-faner/appvinduer og åpne igjen. Se etter **Appversjon 1.8.0** i voksenvisningen. Stjerner, historikk, lydvalg og påbegynt runde migreres automatisk.

Framgang lagres separat fra filcachen og beholdes på samme nettadresse og nettleser/installasjon. Å flytte appen til et annet domene eller en annen enhet gir ikke automatisk synkronisering. En serveroppdatering uten nett kan ikke oppdages før appen får nett igjen.

For framtidige utgaver: øk versjonen i `core.js`, `sw.js` og `package.json`. Service workeren må få en ny versjon for hver endring i appfilene. Den cacher en komplett utgave før den aktiveres. Aktivering alene laster ikke åpne sider på nytt. Cacheopprydding er avgrenset til denne appens URL-sti.

Teknisk bakgrunn: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/update

## Filer og lokal kontroll

`index.html` er inngangspunktet. `app.js` er grensesnittet, `core.js` er oppgaver, progresjon og lagring, `learning.js` er hjelpetekstene, `sound.js` er de lokale melodiene og tastelyden, `update.js` håndterer oppdateringsvarsling, og `rewards.js` inneholder klossemodellene, den isometriske tegningen og belønningsframgangen. `plants.js` tegner plantene, og `breaks.js` lager huskeleken. `style.css`, manifestet, service workeren og `assets/` følger med.

Ingen bygging eller avhengigheter er nødvendig. For lokal utvikling: `python3 -m http.server 8000`, og åpne http://localhost:8000. For automatiske tester: `node --test tests/*.test.js`.

## Avgrensninger og utprøving

Dette er en app for utprøving, med én elev per nettleser/installasjon. Det er ingen skylagring, flere profiler, innlest tale eller tidsbaserte prøver. Appen kan ikke avgjøre om et riktig svar skyldes forståelse eller gjetting.

De automatiske testene dekker oppgaver, svarflyt, belønninger, migrering, lagring, offline og oppdateringer. Prøv prøvepakken på de aktuelle enhetene før publisering.
