# Tallvenn 1.3.0

En liten norsk matteapp for mobil og iPad. Åtte oppgaver i en rolig runde, tydelige mengder og en stjerne for innsatsen. Ingen konto eller eksterne avhengigheter.

## Legg på GitHub Pages

1. Pakk ut ZIP-filen.
2. Last opp innholdet i mappen `tallvenn` til roten av et GitHub-repository. `index.html` skal ligge rett i roten, sammen med `app.js`, `core.js`, `style.css`, `sw.js`, `manifest.webmanifest`, `.nojekyll` og `assets/`.
3. Gå til **Settings → Pages → Build and deployment**.
4. Velg **Deploy from a branch**, deretter grenen **main** og mappen **/(root)**. Lagre.
5. Åpne adressen GitHub viser når publiseringen er ferdig.

Appen trenger ingen npm-installasjon eller bygging. Alle stier er relative, så den fungerer både på `brukernavn.github.io/repository/` og på et eget domene. Mappen `tests/`, `package.json` og denne veiledningen kan bli med i repositoryet, men er ikke nødvendige for selve appen.

GitHubs veiledning: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## iPad og iPhone

Åpne den publiserte adressen i Safari. Bruk **Del → Legg til på Hjem-skjerm**. Åpne den installerte appen på nett én gang og la den laste ferdig. Deretter kan øvingen brukes uten nett. Nettleseren må støtte og tillate service workers og lokal lagring. Framgang kan være separat i Safari og i den installerte appen.

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

Én startknapp, åtte oppgaver, ingen tidsfrist. Runden lagres slik at barnet kan ta pause og fortsette senere. Velg **Tall til 20**, **Tall til 100** eller **Tall til 999** i voksenvisningen. Standard er tall til 20. Start gjerne der og velg nivå sammen med læreren.

Oppgavene dekker tiere og enere, tiervenner, tallrekke, pluss og minus. Brikker kan trykkes bort og legges tilbake, og tomme ruter kan fylles. Svaret velges med tre store knapper; talltastatur innføres først etter flere økter. En stjerne betyr en fullført øvingsrunde, ikke at alle oppgavene er mestret.

Tilpasningen er en enkel, lokal regelmodell, ikke en pedagogisk utredning eller en garanti for læring. Figurene blir først valgfrie når det finnes minst seks relevante svar fra minst tre runder, med overveiende riktige førsteforsøk uten åpnet hjelp. Talltastatur krever mer øving med valgfri støtte. Voksen kan overstyre ved å vise figurene hele tiden.

Bruk gjerne noen økter sammen med barnet. Spør hvordan det tenkte, og tilpass nivået i samarbeid med læreren.

## Data og personvern

Framgang lagres i `localStorage` på enheten, uten navn eller personopplysninger. Det er ingen analyseverktøy, annonser, konto, tredjepartsressurser eller synkronisering. Vanlig nettverkslogging hos vertstjenesten styres av vertstjenesten. Hvis nettleseren blokkerer lagring, fungerer oppgavene likevel mens appen er åpen. Voksenvisningen opplyser om dette.

Sletting av nettleserdata sletter også framgangen. Historikken kan slettes i voksenvisningen med bekreftelse. Appen er beregnet på én elev per nettleser/installasjon.

## Lokal utvikling og sjekk

Åpne via en webserver, ikke ved å dobbeltklikke `index.html`:

```sh
cd tallvenn
python3 -m http.server 8000
```

Åpne http://localhost:8000. For oppgavegenerator, lagring og rundeoverganger:

```sh
node --test tests/*.test.js
```

Ved utvikling kan en eldre service worker holde på filene. Fjern registreringen og appens cache i nettleserens utviklerverktøy, eller bruk et nytt testoppsett.

## Oppdateringer fra GitHub Pages

**Oppdater til 1.3.0:** Erstatt filene med innholdet fra pakken, også `style.css`, `sound.js`, `rewards.js`, `sw.js` og de andre JavaScript-filene. Velg deretter **For voksne → Se etter oppdatering → Oppdater nå** når den nye versjonen er tilgjengelig. Se etter **Appversjon 1.3.0**. Eksisterende planteframgang, bygg, samling, stjerner, historikk, lydvalg og påbegynt runde beholdes.

**Hvis iPad åpner en eldre versjon:** Vent til publiseringen på GitHub Pages er ferdig. Åpne appen på nett og velg «Se etter oppdatering». Lukk deretter appen helt fra appveksleren (eller lukk alle Tallvenn-faner hvis du bruker Safari) og åpne den igjen på samme adresse. Dette lukker bare appen; ikke slett den eller nettleserdataene. Kontroller versjonen i voksenvisningen. En installert app og Safari kan ha separat framgang, så prøv i den samme du vanligvis bruker.

Last opp og erstatt appfilene på **samme adresse og sti** som før. Behold `assets/` og alle JavaScript-filene, inkludert `learning.js`, `sound.js`, `update.js` og den nye `rewards.js`.

Appen sjekker etter ny service worker ved åpning og kan sjekke igjen når den kommer tilbake fra bakgrunnen utenfor en øvingsrunde. Du kan også velge **For voksne → Se etter oppdatering**. Når en ny, komplett appversjon er lastet ned, vises **Ny versjon klar → Oppdater** på forsiden eller etter runden. Oppgavene blir aldri automatisk avbrutt av en sidelasting. Knappen lagrer framgangen før den laster siden på nytt. Hvis lagring feiler, venter oppdateringen.

**Første overgang fra 1.0.0:** Den gamle versjonen har ikke oppdateringsknappen. Etter publisering åpner du appen på nett og laster siden på nytt. Hvis 1.0.0 fortsatt vises, gi nettleseren noen sekunder til å hente den nye service workeren og last siden på nytt igjen. Du kan også lukke alle Tallvenn-faner/appvinduer og åpne igjen. Se etter **Appversjon 1.3.0** i voksenvisningen. Stjerner, historikk, lydvalg og påbegynt runde migreres automatisk.

Framgang lagres separat fra filcachen og beholdes på samme nettadresse og nettleser/installasjon. Å flytte appen til et annet domene eller en annen enhet gir ikke automatisk synkronisering. En serveroppdatering uten nett kan ikke oppdages før appen får nett igjen.

For framtidige utgaver: øk versjonen i `core.js`, `sw.js` og `package.json`. Service workeren må få en ny versjon for hver endring i appfilene. Den cacher en komplett utgave før den aktiveres. Aktivering alene laster ikke åpne sider på nytt. Cacheopprydding er avgrenset til denne appens URL-sti.

Teknisk bakgrunn: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/update

## Filer og lokal kontroll

`index.html` er inngangspunktet. `app.js` er grensesnittet, `core.js` er oppgaver, progresjon og lagring, `learning.js` er hjelpetekstene, `sound.js` er de lokale melodiene og tastelyden, `update.js` håndterer oppdateringsvarsling, og `rewards.js` inneholder de seks klossemodellene, den isometriske tegningen og den separate belønningsframgangen. `style.css`, manifestet, service workeren og `assets/` følger med.

Ingen bygging eller avhengigheter er nødvendig. For lokal utvikling: `python3 -m http.server 8000`, og åpne http://localhost:8000. For automatiske tester: `node --test tests/*.test.js`.

## Avgrensninger og utprøving

Dette er en app for utprøving, med én elev per nettleser/installasjon. Det er ingen skylagring, flere profiler, innlest tale eller tidsbaserte prøver. Appen kan ikke avgjøre om et riktig svar skyldes forståelse eller gjetting.

53 automatiske tester dekker blant annet telling begge veier, plassering av svarfeltet, hjelpetallrekke, hint og skjermlesertekst, de seks byggene, isometriske flater, én kloss per runde, tilfeldig rekkefølge, lagring, modusbytte og migrering, samt oppgavegenerator, runder, feil/hjelp, repetisjon, forsiktig nedtrapping av støtte, talltastatur, nye runder uten gammel markering, tastelyd, redusert bevegelse, migrering fra 1.0 og lydav/på. Oppdateringstestene dekker blant annet gammel HTTP-cache, forsinket aktivering, ventende service worker, manglende controllerchange-hendelse, dobbelttrykk, tidsavbrudd og lagring før ny sidelasting. Offlinefiler og cacheprinsipper testes ved både rotadresse og GitHub-prosjektsti. Figurer, hvite taster og luftige svarfelt er kontrollert i Chrome, inkludert mobil- og nettbrettbredder. Lydnivå, installert PWA og den faktiske oppgraderingen på GitHub Pages bør prøves på enheten.
