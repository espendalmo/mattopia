# Tallvenn 1.0.0

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

## Hvordan øvingen fungerer

- Én startknapp. Åtte oppgaver i et fast, variert spor; tallene varierer fra runde til runde.
- Tre nivåer velges under **For voksne**: tall til 20, til 100 og til 999. Standardnivået er til 20. Det er ingen automatisk nivåøkning.
- Tall til 20 vises som grupper med ti og løse brikker. Større tall får hundrerfelt, tierstaver og enere. Antall og tall kobles til regnestykket.
- Løse brikker kan trykkes bort og legges tilbake. Tomme ruter kan fylles når barnet bygger ti. Svaret velges med store tallknapper.
- **Vis meg** forklarer en strategi. Etter et feil svar åpnes hjelpen automatisk. Barnet kan prøve igjen uten poengtrekk eller mistede liv.
- Runden har ingen tidsfrist. Appen registrerer ikke svartid. Åtte oppgaver avgrenser økten uten nedtelling.
- En stjerne gis for hver fullførte runde, uansett hjelp og antall forsøk. Det er ingen daglig rekke som kan brytes.
- En påbegynt runde lagres. Lukkeknappen lar barnet ta pause og fortsette senere.
- Voksenvisningen viser de siste fem rundene. Inntil 40 runder lagres; samlet stjernetall beholdes også etter dette. Første forsøk og åpnet hjelp beskriver bruk, ikke en vurdering av barnets ferdigheter. Bruk av brikkene teller ikke som å ha åpnet hjelp.
- En diskret lyd kan slås på i voksenvisningen. Standard er lyd av. Appen tar hensyn til redusert bevegelse.

Bruk gjerne noen økter sammen med barnet. Spør hvordan det tenkte, og tilpass nivået i samarbeid med læreren. Dette er øving, ikke en kartleggingsprøve eller diagnostikk.

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

## Oppdateringer

Endre versjonen i `core.js`, `package.json` og cacheversjonen i `sw.js` når appen endres. Service workeren cacher en samlet appversjon og overtar først når eksisterende appvinduer er lukket. Etter publisering: åpne på nett, lukk alle Tallvenn-vinduer og åpne igjen for å få ny versjon. Frammegangen ligger separat og beholdes. Cachen er avgrenset til appens egen URL-sti, slik at andre apper på samme GitHub Pages-domene ikke slettes.

Teknisk bakgrunn: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers

## Filer

`index.html` er inngangspunktet. `style.css` inneholder all utforming, `app.js` grensesnittet og `core.js` oppgavene og rundelogikken. `sw.js` og manifestet gir offlinebruk og installasjon. Ikonene er lokale og kan byttes i `assets/`.

## Avgrensninger

Dette er førsteversjon for utprøving. Nivåvalg gjøres av en voksen. Det er ingen skylagring, flere elevprofiler, innlest tale eller egen fartstrening. Sammenhenger vises og forklares, men appen kan ikke avgjøre om et riktig svar skyldes forståelse eller gjetting.

## Kontroll av førsteversjonen

Ti automatiske tester dekker blant annet 3 600 genererte runder på tre nivåer, riktige regnestykker, unike svarvalg, feil og nye forsøk, gjenopptakelse, oppsummering, relative stier og offline-cache ved både rotadresse og GitHub-prosjektsti. Grensesnittet er prøvd i Chrome med 320, 390 og 768 pikslers bredde og på en bred skjerm. Hele runder, hjelp, brikker, pauser, nivåvalg, historikk og nullstilling er kontrollert. Fysisk iPad/iPhone, Safari og offlinebruk i en installert app må fortsatt prøves på enheten.
