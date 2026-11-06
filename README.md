# Tallvenn 1.1.0

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

Last opp og erstatt appfilene på **samme adresse og sti** som før. Behold `assets/` og alle JavaScript-filene, inkludert `learning.js`, `sound.js` og `update.js`.

Appen sjekker etter ny service worker ved åpning og kan sjekke igjen når den kommer tilbake fra bakgrunnen utenfor en øvingsrunde. Du kan også velge **For voksne → Se etter oppdatering**. Når en ny, komplett appversjon er lastet ned, vises **Ny versjon klar → Oppdater** på forsiden eller etter runden. Oppgavene blir aldri automatisk avbrutt av en sidelasting. Knappen lagrer framgangen før den laster siden på nytt. Hvis lagring feiler, venter oppdateringen.

**Første overgang fra 1.0.0:** Den gamle versjonen har ikke oppdateringsknappen. Etter publisering åpner du appen på nett og laster siden på nytt. Hvis 1.0.0 fortsatt vises, gi nettleseren noen sekunder til å hente den nye service workeren og last siden på nytt igjen. Du kan også lukke alle Tallvenn-faner/appvinduer og åpne igjen. Se etter **Appversjon 1.1.0** i voksenvisningen. Stjerner, historikk, lydvalg og påbegynt runde migreres automatisk.

Framgang lagres separat fra filcachen og beholdes på samme nettadresse og nettleser/installasjon. Å flytte appen til et annet domene eller en annen enhet gir ikke automatisk synkronisering. En serveroppdatering uten nett kan ikke oppdages før appen får nett igjen.

For framtidige utgaver: øk versjonen i `core.js`, `sw.js` og `package.json`. Service workeren må få en ny versjon for hver endring i appfilene. Den cacher en komplett utgave før den aktiveres. Aktivering alene laster ikke åpne sider på nytt. Cacheopprydding er avgrenset til denne appens URL-sti.

Teknisk bakgrunn: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/update

## Filer og lokal kontroll

`index.html` er inngangspunktet. `app.js` er grensesnittet, `core.js` er oppgaver, progresjon og lagring, `learning.js` er hjelpetekstene, `sound.js` er de lokale melodiene, og `update.js` håndterer oppdateringsvarsling. `style.css`, manifestet, service workeren og `assets/` følger med.

Ingen bygging eller avhengigheter er nødvendig. For lokal utvikling: `python3 -m http.server 8000`, og åpne http://localhost:8000. For automatiske tester: `node --test tests/*.test.js`.

## Avgrensninger og utprøving

Dette er en app for utprøving, med én elev per nettleser/installasjon. Det er ingen skylagring, flere profiler, innlest tale eller tidsbaserte prøver. Appen kan ikke avgjøre om et riktig svar skyldes forståelse eller gjetting.

Automatiske tester dekker oppgavegenerator, runder, feil/hjelp, repetisjon, forsiktig nedtrapping av støtte, talltastatur, migrering fra 1.0, lydav/på, oppdateringsvarsling og lagring før oppdatering. Offlinefiler og cacheprinsipper testes ved både rotadresse og GitHub-prosjektsti. Grensesnittet kontrolleres i Chrome i mobil- og nettbrettbredder. Safari, lydnivå, installert PWA og den faktiske oppgraderingen på GitHub Pages bør prøves på enheten.
