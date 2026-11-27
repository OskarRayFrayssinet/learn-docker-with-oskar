# Lär dig Docker med Oskar

I den här mappen finns ett chattrum som består av tre containers. Du startar det, tittar på hur delarna hänger ihop, ändrar det, bygger ut det och felsöker det. Målet är att du ska förstå Docker genom att göra, inte genom att läsa.

**Du lär dig:** images och containers, Dockerfile, Docker Compose, portar, Docker-nätverk, nginx som webbserver och reverse proxy, loggar och felsökning.

## Innehåll

- [Förberedelser](#förberedelser)
- [Kom igång](#kom-igång)
- [Så fungerar chatten](#så-fungerar-chatten)
- [Så arbetar du med övningarna](#så-arbetar-du-med-övningarna)
- [Del 1: Observera](#del-1-observera)
- [Del 2: Ändra och bygg om](#del-2-ändra-och-bygg-om)
- [Del 3: Nätverk och portar](#del-3-nätverk-och-portar)
- [Del 4: Bygg ut chatten](#del-4-bygg-ut-chatten)
- [Del 5: Sabotera och laga](#del-5-sabotera-och-laga)
- [Bonusövningar](#bonusövningar)
- [Förstå kommandona (utfällbara förklaringar)](#förstå-kommandona)
- [Felsökning](#felsökning)
- [Ordlista](#ordlista)

---

## Förberedelser

- **Docker Desktop** installerat och igång. Kontrollera: `docker version` ska visa både `Client` och `Server`.
- **Git**: `git --version` (saknas det: `winget install Git.Git`).
- **VS Code** (eller annan editor) för att redigera filer.
- **Windows PowerShell:** skriv alltid `curl.exe`, aldrig bara `curl`. I PowerShell är `curl` ett alias för ett annat kommando med andra flaggor.
- Sökvägar med mellanslag skrivs inom citattecken: `"C:\Users\Ditt Namn\..."`.

## Kom igång

```powershell
git clone https://github.com/OskarRayFrayssinet/learn-docker-with-oskar.git
cd learn-docker-with-oskar\chatt
docker compose up -d --build
docker compose ps
```

Öppna `http://localhost:8081` och `http://localhost:8082` i två flikar. Skriv ett namn och ett meddelande i den ena. Det ska synas i båda.

Stäng ner när du är klar:

```powershell
docker compose down
```

Alla kommandon i övningarna körs i mappen `chatt` (där `compose.yaml` ligger) om inget annat anges.

## Så fungerar chatten

```
Webbläsare ──► datorns port 8081 ──► klient1 (nginx, port 80)
                                          │  /ws
                                          ▼
                       namnuppslag "chattserver" ──► chattserver (Node, port 3000)
                                                          │ skickar till alla
Webbläsare ◄── samma väg tillbaka ◄──────────────────────┘
```

```
chatt/
├── compose.yaml        startar allt: tre containers och ett nätverk
├── server/
│   ├── Dockerfile      bygger server-imagen (Node + biblioteket ws)
│   ├── package.json    beroenden
│   └── server.js       tar emot meddelanden och skickar till alla anslutna
└── klient/
    ├── Dockerfile      bygger klient-imagen (nginx)
    ├── default.conf    nginx-konfig: serverar sidan, skickar /ws vidare till servern
    └── index.html      chattsidan i webbläsaren
```

- `klient1` och `klient2` är två containers från **samma image**. De har **samma server** bakom sig, så alla hamnar i samma chattrum.
- Servern har ingen publicerad port. Den nås bara inifrån Docker-nätverket, via nginx.
- Compose skapar nätverket automatiskt. Det heter oftast `chatt_default` (mappnamnet + `_default`). Heter din mapp något annat, kolla med `docker network ls`.
- Containrarna får namn som `chatt-chattserver-1`. Se dem med `docker compose ps`.

## Så arbetar du med övningarna

1. **Gissa först.** Skriv ner vad du tror ska hända innan du kör kommandot.
2. **Kör och jämför.** Stämde gissningen? Om inte, varför?
3. **Bevisa.** Varje övning slutar med **Klart när**. Det är krav du ska kunna visa med ett kommando eller en skärmbild.
4. **Förklara.** Under **Svara på** står frågor. Svara med egna ord, helst högt till en kompis.
5. **Spara ditt arbete.** Innan du sabotera eller ändra mycket: `git add .` och sedan `git commit -m "Före övning X"` (två kommandon, ett i taget). Då kan du alltid gå tillbaka med `git restore .`.

Ledtrådar står under **Ledtråd**. Försök först utan dem.

**Förstår du inte ett kommando, en flagga eller en rad i en fil?** Öppna [Förstå kommandona](#förstå-kommandona) och klicka upp rätt avsnitt. Där förklaras varje del av alla kommandon och filer i det här projektet.

---

## Del 1: Observera

### Övning 1: Starta och verifiera

**Gör:**
1. Starta allt: `docker compose up -d --build`
2. Kolla status: `docker compose ps`
3. Testa båda klienterna: `curl.exe -I http://localhost:8081` och `curl.exe -I http://localhost:8082`
4. Läs serverns logg: `docker compose logs chattserver`

**Klart när:**
- [ ] `docker compose ps` visar tre containers med status `running`.
- [ ] Båda `curl.exe`-anropen svarar `HTTP/1.1 200 OK`.
- [ ] Loggen innehåller `Chattserver körs på port 3000`.

**Svara på:** Varför har `chattserver` ingen portmappning i `docker compose ps`, medan klienterna har `8081->80`?

### Övning 2: Följ ett meddelande

**Gör:**
1. Öppna `http://localhost:8081` och `http://localhost:8082` i två flikar.
2. Tryck F12 i den första fliken och öppna **Network**. Filtrera på `WS`. Ladda om sidan.
3. Klicka på raden `ws` och öppna fliken **Messages**.
4. Skriv ett meddelande i en av flikarna och titta på Messages i den andra.
5. Titta i nginx-loggen: `docker compose logs klient1`

**Klart när:**
- [ ] Du har en skärmbild där `ws` har status `101` och ett meddelande syns under Messages.
- [ ] Du har ritat (för hand eller i ett program) vägen ett meddelande tar från flik 1 till flik 2, med varje station namngiven.

**Svara på:**
- Vilken fil i projektet skickar meddelandet från webbläsaren?
- Vilken fil bestämmer att nginx skickar `/ws` vidare till servern?
- Vilken fil skickar meddelandet till alla klienter?

**Ledtråd:** nginx skriver loggraden för `/ws` först när anslutningen **stängs**. Stäng en flik och kör `docker compose logs klient1` igen.

### Övning 3: Gå in i en container

**Gör:**
1. Gå in i klient-containern: `docker compose exec klient1 bash`
2. Kör inne i containern:
   ```
   ls /usr/share/nginx/html
   cat /etc/nginx/conf.d/default.conf
   nginx -t
   exit
   ```
3. Notera hur prompten ändras när du är inne i containern och när du lämnar den.

**Klart när:**
- [ ] Du kan visa att `index.html` ligger i `/usr/share/nginx/html` i containern.
- [ ] Du har hittat raden i `default.conf` som skickar trafik till servern.
- [ ] `nginx -t` svarar `syntax is ok`.

**Svara på:** Filen ligger både på din dator och i containern. Hur kom den dit? (Titta i `klient/Dockerfile`.)

### Övning 4: Hitta serverns IP-adress

**Gör:** Ta reda på `chattserver`s IP-adress på tre olika sätt:
1. `docker compose exec klient1 getent hosts chattserver`
2. `docker network inspect chatt_default`
3. `docker inspect -f "{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}" chatt-chattserver-1`

**Klart när:**
- [ ] Alla tre sätten ger samma IP-adress (t.ex. `172.18.0.2`).

**Svara på:** I `default.conf` står `proxy_pass http://chattserver:3000;`. Där finns ingen IP-adress. Vem översätter namnet `chattserver` till en IP?

**Ledtråd:** Heter ditt nätverk eller din container något annat? Kolla `docker network ls` och `docker compose ps`.

### Övning 5: Stoppa servern

**Gör:**
1. Ha chatten öppen i två flikar och skicka ett meddelande. Det fungerar.
2. Stoppa servern: `docker compose stop chattserver`
3. Försök skicka ett meddelande. Kolla F12 → Console.
4. Starta servern igen: `docker compose start chattserver`
5. Försök skicka igen **utan att ladda om sidan**. Ladda sedan om och försök igen.

**Klart när:**
- [ ] Du har sett vad som händer i webbläsaren när servern stoppas.
- [ ] Du kan förklara varför chatten inte fungerar efter `start` förrän sidan laddats om.

**Svara på:** Vad skulle sidan behöva göra för att ansluta på nytt av sig själv? (Det bygger du i övning 17.)

---

## Del 2: Ändra och bygg om

### Övning 6: Ändra sidan

**Gör:**
1. Öppna `klient/index.html`. Ändra texten i `<h1>Chattrum</h1>` till något eget.
2. Bygg om och starta om: `docker compose up -d --build`
3. Ladda om båda flikarna med Ctrl+F5.

**Klart när:**
- [ ] Den nya rubriken syns på både `localhost:8081` och `localhost:8082`.

**Svara på:** Varför ändrades båda klienterna fast du bara ändrade en fil? Och varför syntes ingenting innan du körde `--build`?

### Övning 7: Versioner med taggar

**Gör:**
1. Bygg klienten som version 2.0: `docker build -t chatt-klient:2.0 ./klient`
2. Ändra rubriken i `klient/index.html` till något annat.
3. Bygg som version 2.1: `docker build -t chatt-klient:2.1 ./klient`
4. Lista dem: `docker images` (leta efter `chatt-klient`)
5. Starta båda i det befintliga nätverket, på varsin port:
   ```powershell
   docker run -d --name klient20 --network chatt_default -p 8090:80 chatt-klient:2.0
   docker run -d --name klient21 --network chatt_default -p 8091:80 chatt-klient:2.1
   ```
6. Öppna `http://localhost:8090` och `http://localhost:8091`.
7. Städa: `docker rm -f klient20 klient21`

**Klart när:**
- [ ] Port 8090 visar den gamla rubriken och port 8091 den nya.

**Svara på:**
- Varför går båda versionerna att köra samtidigt?
- Vad händer om du hoppar över `--network chatt_default`? (Prova och läs `docker logs klient20`.)

**Ledtråd:** `docker compose up` måste vara igång så att nätverket `chatt_default` finns.

### Övning 8: Lägg till en tredje klient

**Gör:**
1. Öppna `compose.yaml` och lägg till en tjänst `klient3` på port 8083, modellerad efter `klient2`.
2. Starta: `docker compose up -d --build`
3. Öppna `http://localhost:8083` och chatta mellan alla tre.

**Klart när:**
- [ ] `docker compose ps` visar fyra containers.
- [ ] Ett meddelande från `localhost:8083` syns på `localhost:8081`.

**Svara på:** Varför måste varje klient ha en egen port på din dator, men ändå alla lyssna på port 80 inne i containern?

### Övning 9: Byt serverns port

**Gör:**
1. Ändra serverns port från 3000 till 4000. Det finns flera ställen. Hitta dem alla med `Ctrl+Shift+F` (sök i alla filer) efter `3000`.
2. Bygg om och testa chatten.

**Klart när:**
- [ ] Chatten fungerar med servern på port 4000.
- [ ] Du kan lista vilka filer du ändrade och varför varje ändring behövdes.

**Svara på:** Vad händer om du ändrar `server.js` men glömmer `default.conf`? Vilket felmeddelande ser du, och var?

**Ledtråd:** Raden `EXPOSE` i `server/Dockerfile` påverkar inte funktionen, den är bara dokumentation. Prova att ändra den sist och se att ingenting förändras.

### Övning 10: Ändra utan att bygga om

**Gör:**
1. Lägg till en rad under `klient1` i `compose.yaml`:
   ```yaml
       volumes:
         - ./klient:/usr/share/nginx/html:ro
   ```
2. Starta om: `docker compose up -d`
3. Ändra rubriken i `klient/index.html`, spara och tryck Ctrl+F5 på `localhost:8081`. **Kör inte `--build`.**
4. Jämför med `localhost:8082`.

**Klart när:**
- [ ] `localhost:8081` visar din ändring direkt, medan `localhost:8082` fortfarande visar den inbyggda versionen.

**Svara på:**
- Vad är skillnaden mellan att *kopiera in* en fil i imagen (`COPY`) och att *montera* den (`volumes`)?
- När passar vilket? (Tips: utveckling kontra leverans.)

**Ledtråd:** Montering döljer det som låg i `/usr/share/nginx/html` i imagen. Mappen innehåller även `Dockerfile` och `default.conf`, vilket är harmlöst här men inte det du skulle göra i drift.

---

## Del 3: Nätverk och portar

### Övning 11: Ge nätverket ett eget namn

**Gör:** Ändra `compose.yaml` så att alla tre tjänster ligger i ett nätverk som heter `chatt-nat`:

```yaml
services:
  chattserver:
    build: ./server
    networks:
      - chatt-nat
  # ... samma rad under klient1, klient2 (och klient3)

networks:
  chatt-nat:
    name: chatt-nat
```

Kör sedan `docker compose up -d --build` och `docker network ls`.

**Klart när:**
- [ ] `docker network ls` visar ett nätverk som heter exakt `chatt-nat`.
- [ ] `docker network inspect chatt-nat` listar alla dina containers.
- [ ] Chatten fungerar fortfarande.

**Svara på:** Varför är det praktiskt att nätverket har ett fast namn?

**Obs:** Från och med den här övningen heter nätverket `chatt-nat`, inte `chatt_default`. Använd det namnet i kommandon som `docker network inspect`.

### Övning 12: En främmande container i nätverket

**Gör:**
1. Starta en tillfällig container **i** nätverket och hämta klientens sida:
   ```powershell
   docker run --rm -it --network chatt-nat node:22-alpine sh
   ```
   Kör inne i den: `wget -qO- http://klient1` och sedan `exit`.
2. Gör samma sak utan nätverket:
   ```powershell
   docker run --rm node:22-alpine wget -qO- -T 3 http://klient1
   ```

**Klart när:**
- [ ] I steg 1 skrivs chattsidans HTML ut.
- [ ] I steg 2 får du ett fel.

**Svara på:** Varför kan den ena containern slå upp namnet `klient1` men inte den andra?

### Övning 13: Publicera en port

**Gör:**
1. Försök nå servern direkt från din dator: `curl.exe -I http://localhost:3000`
2. Lägg till under `chattserver` i `compose.yaml`:
   ```yaml
       ports:
         - "3000:3000"
   ```
3. Kör `docker compose up -d` och försök igen: `curl.exe -I http://localhost:3000`
4. Ta bort raden igen och kör `docker compose up -d`.

**Klart när:**
- [ ] I steg 1 misslyckas anropet (`Failed to connect`).
- [ ] I steg 3 får du ett svar (`426 Upgrade Required` är rätt: servern vill ha WebSocket, inte vanlig HTTP).

**Svara på:** Varför är det bra att servern **inte** är publicerad som standard?

### Övning 14: Låt andra ansluta

**Gör:**
1. Ta reda på din dators IP-adress: `ipconfig` (leta efter `IPv4-adress`, t.ex. `192.168.1.23`).
2. På en annan enhet i samma nätverk (mobil, kompis dator): öppna `http://DIN-IP:8081`.
3. Chatta mellan era enheter.
4. Begränsa åtkomsten: ändra `"8081:80"` till `"127.0.0.1:8081:80"` under `klient1`, kör `docker compose up -d`, och försök igen från den andra enheten.

**Klart när:**
- [ ] Ni chattar mellan två olika enheter.
- [ ] Efter steg 4 går det inte längre att nå `:8081` från den andra enheten, men fortfarande från din egen dator.

**Svara på:** Kom den andra enheten någonsin *in i* Docker-nätverket? Vilken väg tog trafiken?

**Ledtråd:** Laddas sidan inte? Windows-brandväggen kan blockera. Tillåt Docker när Windows frågar. Se till att båda enheterna sitter på samma nät (inte gäst-Wi-Fi).

### Övning 15: Mät och begränsa resurser

**Gör:**
1. Se vad containrarna använder: `docker stats --no-stream`
2. Lägg till under `chattserver` i `compose.yaml`:
   ```yaml
       mem_limit: 64m
       cpus: "0.5"
   ```
3. Kör `docker compose up -d` och `docker stats --no-stream` igen.

**Klart när:**
- [ ] Kolumnen `MEM USAGE / LIMIT` visar `64MiB` som gräns för `chattserver`.

**Svara på:** Vad är skillnaden mellan hur mycket en container *använder* och hur mycket den *får* använda? Varför vill man sätta gränser?

---

## Del 4: Bygg ut chatten

Nu ändrar du själva programmet. Efter varje ändring: `docker compose up -d --build` och Ctrl+F5 i webbläsaren.

### Övning 16: Tidsstämpel

**Gör:** Visa klockslaget före varje meddelande i chatten, t.ex. `14:32:05 Anna: hej`.

**Klart när:**
- [ ] Varje rad i chattrutan börjar med ett klockslag.

**Ledtråd:** Ändra raden där texten sätts i `ws.onmessage` i `klient/index.html`:
```js
rad.textContent = new Date().toLocaleTimeString('sv-SE') + ' ' + e.data;
```

### Övning 17: Automatisk återanslutning

**Gör:** Få sidan att ansluta på nytt av sig själv om anslutningen tappas, så att övning 5 fungerar utan att ladda om.

**Klart när:**
- [ ] Du stoppar servern (`docker compose stop chattserver`), startar den igen (`docker compose start chattserver`), väntar några sekunder och kan chatta **utan** att ladda om sidan.

**Ledtråd:** Lägg anslutningen i en funktion och anropa den igen när anslutningen stängs:
```js
let ws;

function connect() {
  ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws');
  ws.onmessage = (e) => {
    // samma kod som tidigare
  };
  ws.onclose = () => setTimeout(connect, 2000);
}
connect();
```
`skicka()` ska kontrollera att `ws.readyState === 1` innan den skickar.

**Svara på:** Varför väntar vi två sekunder innan nästa försök? Vad kunde hända om vi försökte om och om igen utan paus?

### Övning 18: Se vem som är ansluten

**Gör:** Låt servern logga när någon ansluter eller lämnar, med antal anslutna.

**Klart när:**
- [ ] `docker compose logs chattserver` visar rader som `Ansluten. Antal: 2` när du öppnar en flik, och `Frånkopplad. Antal: 1` när du stänger en.

**Ledtråd:** Lägg till i `server/server.js`, inuti `wss.on('connection', (ws) => { ... })`:
```js
console.log('Ansluten. Antal:', wss.clients.size);
ws.on('close', () => console.log('Frånkopplad. Antal:', wss.clients.size));
```

### Övning 19: Meddelandehistorik

**Gör:** Låt servern spara de senaste 20 meddelandena och skicka dem till den som ansluter, så att en ny flik ser vad som sagts.

**Klart när:**
- [ ] En ny flik visar de senaste meddelandena direkt när den öppnas.
- [ ] Du har provat `docker compose restart chattserver` och sett att historiken försvinner.

**Svara på:** Varför försvann historiken? Var finns den lagrad? Vad skulle du behöva för att den ska överleva en omstart? (Tänk på volymer eller en databas, se bonusövningarna.)

**Ledtråd:** Kod för `server/server.js`, testad:
```js
const historik = [];

wss.on('connection', (ws) => {
  historik.forEach((m) => ws.send(m));
  ws.on('message', (data) => {
    const text = data.toString();
    historik.push(text);
    if (historik.length > 20) historik.shift();
    for (const c of wss.clients) {
      if (c.readyState === 1) c.send(text);
    }
  });
});
```

---

## Del 5: Sabotera och laga

Arbeta två och två. **A** förstör något med flit enligt tabellen, **B** hittar felet utan att veta vad som ändrats. B får bara använda:

```powershell
docker compose ps -a
docker compose logs <tjänst>
docker compose exec klient1 nginx -t
curl.exe -v http://localhost:8081
```

och F12 i webbläsaren. Byt roller efter varje sabotage. **A, kom ihåg:** committa innan (`git add .` följt av `git commit -m "Före sabotage"`) och återställ efteråt med `git restore .`.

| # | A gör (sabotage) | Symptom B ska se | Var felet syns |
|---|---|---|---|
| 1 | Byt namnet `chattserver` i `compose.yaml` (t.ex. till `server`) men inte i `default.conf` | Klient-containrarna är inte `running` | `docker compose ps -a`, `docker compose logs klient1` (`host not found in upstream`) |
| 2 | Ta bort raderna med `Upgrade` och `Connection` i `default.conf` | Sidan laddas men chatten ansluter inte | F12 → Network → `WS`, och curl-testet nedan |
| 3 | Ändra till `proxy_pass http://chattserver:3001;` | Sidan laddas, chatten ansluter inte | `502 Bad Gateway`, `docker compose logs klient1` |
| 4 | Skriv fel i en nginx-rad, t.ex. `listn 80;` | Klient-containern kraschar | `docker compose logs klient1` (`unknown directive`) |
| 5 | Skriv fel filnamn i en `COPY`-rad i `klient/Dockerfile` | Bygget misslyckas | Felet vid `docker compose up --build` |
| 6 | Sätt samma värdport (`8081`) på två tjänster | En tjänst startar inte | `port is already allocated` vid start |
| 7 | Ta bort `ports:` från `klient1` | `localhost:8081` svarar inte | `curl.exe -I http://localhost:8081` ger `Failed to connect`, `docker compose ps` saknar portmappning |

Testa WebSocket-kopplingen direkt med curl (rätt resultat är `101 Switching Protocols`):

```powershell
curl.exe -i -m 3 -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: SGVsbG8sIHdvcmxkIQ==" http://localhost:8081/ws
```

**Klart när (för B, per sabotage):**
- [ ] Du pekade ut felet (fil och rad) och förklarade varför det ger just det symptomet.
- [ ] Du lagade det och visade att chatten fungerar igen.

**Svara på efteråt:** Vilket verktyg avslöjade felet snabbast i varje fall?

**Tips på arbetsordning vid felsökning:** lever containern (`ps`), vad säger loggen (`logs`), är konfigen giltig (`nginx -t`), når containers varandra (`getent hosts`), fungerar uppgraderingen (curl ovan), och till sist webbläsaren (F12).

---

## Bonusövningar

Dessa är större och har inga steg-för-steg-instruktioner. Använd det du lärt dig.

| Övning | Mål |
|---|---|
| **Spara historiken i Redis** | Lägg till en tredje tjänst (`image: redis`) i `compose.yaml` och låt servern spara meddelanden där. Historiken ska överleva `docker compose restart chattserver`. |
| **Volym** | Ge Redis en volym så att data överlever `docker compose down` men försvinner med `docker compose down -v`. |
| **Självläkning** | Lägg till `restart: unless-stopped` på servern, döda den med `docker compose kill chattserver`, och visa att den startar om själv. |
| **Healthcheck** | Lägg till en `healthcheck` på servern så att `docker compose ps` visar `healthy`. |
| **Belastningstest** | Skriv ett litet Node-skript som öppnar 100 anslutningar och skickar meddelanden. Mät med `docker stats` var gränsen går. |
| **Storlek** | Byt `FROM nginx` till `FROM nginx:alpine` och jämför storlek med `docker images` och lager med `docker history`. |
| **Konfiguration** | Flytta portnummer till en `.env`-fil som Compose läser. |
| **Docker Hub** | Pusha dina images till Docker Hub och låt en kompis köra dem med `docker run`. |
| **Flera rum** | Gör så att `/ws/rum1` och `/ws/rum2` är separata chattrum. |
| **HTTPS** | Skapa ett självsignerat certifikat och låt nginx servera chatten över HTTPS. |

---

## Förstå kommandona

Klicka på en rubrik för att fälla ut förklaringen. Här står vad varje del av kommandona och filerna betyder, så att du kan läsa dem istället för att bara kopiera.

<details>
<summary><b>curl.exe</b>: kommandot och flaggorna</summary>

&nbsp;

`curl.exe` skickar ett anrop till en adress och visar svaret. I PowerShell måste du skriva `curl.exe` eftersom `curl` är ett alias för ett annat program.

| Del | Betydelse |
|---|---|
| `curl.exe http://localhost:8081` | Hämta sidan och skriv ut innehållet (HTML) |
| `-I` | Skicka en `HEAD`-förfrågan: visa bara svarsrubrikerna (headers), inte innehållet |
| `-i` | Visa rubrikerna **och** innehållet |
| `-v` | Verbose: visa hela förfrågan (`>`) och svaret (`<`) |
| `-m 3` | Max 3 sekunder totalt, sedan avbryts anropet |
| `-H "Namn: värde"` | Lägg till en egen rubrik i förfrågan |
| `-s` | Tyst läge: ingen förloppsvisning |
| `-N` | Buffra inte svaret (användbart för strömmar) |

**WebSocket-testet i övning 2 och 5 steg för steg:**

```powershell
curl.exe -i -m 3 -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: SGVsbG8sIHdvcmxkIQ==" http://localhost:8081/ws
```

| Del | Betydelse |
|---|---|
| `Connection: Upgrade` + `Upgrade: websocket` | "Jag vill byta protokoll från vanlig HTTP till WebSocket" |
| `Sec-WebSocket-Version: 13` | Vilken version av WebSocket-protokollet som används |
| `Sec-WebSocket-Key: ...` | En slumpmässig nyckel som protokollet kräver i handskakningen. För ett test duger vilken giltig nyckel som helst |
| `-m 3` | Anslutningen hålls öppen när den lyckas, så curl avslutas efter 3 s |
| Förväntat svar | `HTTP/1.1 101 Switching Protocols`: servern gick med på att byta |

**Statuskoder du ser i övningarna:**

| Kod | Betydelse |
|---|---|
| `101` | Protokollbyte godkänt (WebSocket lyckades) |
| `200` | OK |
| `426 Upgrade Required` | Servern vill ha WebSocket, inte vanlig HTTP |
| `502 Bad Gateway` | nginx fick inget svar från servern bakom sig |

**`curl.exe`-felkoder** (visas som `curl: (7) ...`):

| Kod | Betydelse |
|---|---|
| 6 | Kunde inte slå upp namnet (DNS) |
| 7 | Kunde inte ansluta (ingen lyssnar på porten) |
| 28 | Tidsgränsen (`-m`) gick ut |

</details>

<details>
<summary><b>docker compose</b>: alla kommandon</summary>

&nbsp;

`docker compose` läser `compose.yaml` i mappen du står i och styr alla tjänster i den på en gång.

| Kommando | Vad det gör |
|---|---|
| `docker compose up` | Skapar nätverk och containers enligt `compose.yaml` och startar dem. Bygger images som saknas |
| `-d` | *Detached*: kör i bakgrunden så att du får tillbaka prompten |
| `--build` | Bygg om imagerna från Dockerfilerna först, även om de redan finns |
| `docker compose ps` | Visar status och portar för tjänsterna |
| `docker compose ps -a` | Visar även stoppade och kraschade containers |
| `docker compose logs chattserver` | Visar vad tjänsten har skrivit (stdout) |
| `docker compose logs -f --tail 20` | `-f` följer loggen live, `--tail 20` visar bara de 20 sista raderna |
| `docker compose exec klient1 bash` | Kör ett kommando **inne i** en körande container. `bash` ger ett interaktivt skal |
| `docker compose exec klient1 nginx -t` | Kör ett enda kommando inne i containern och återvänder |
| `docker compose exec -T ...` | `-T` stänger av terminalen (behövs om du skickar in något via `\|`) |
| `docker compose stop chattserver` | Stoppar tjänsten men behåller containern |
| `docker compose start chattserver` | Startar en stoppad tjänst igen |
| `docker compose restart chattserver` | Stoppar och startar |
| `docker compose down` | Stoppar och **tar bort** containers och nätverket (images och egna volymer finns kvar) |
| `docker compose down --rmi local` | Tar även bort images som byggts av projektet |
| `docker compose down -v` | Tar även bort volymer |
| `docker compose config` | Kontrollerar och skriver ut den färdiga `compose.yaml`. Bra för att hitta indragsfel |

**`bash` eller `sh`?** Den vanliga `nginx`-imagen har `bash`. Servern använder `node:22-alpine`, som bara har `sh`.

**Skillnaden `stop` och `down`:** `stop` pausar containern, och dina ändringar inne i den finns kvar. `down` tar bort containern, så ändringar som inte ligger i en image eller volym försvinner.

</details>

<details>
<summary><b>docker run, build och övriga docker-kommandon</b></summary>

&nbsp;

**Bygga och starta för hand** (som övning 7):

```powershell
docker build -t chatt-klient:2.0 ./klient
docker run -d --name klient20 --network chatt_default -p 8090:80 chatt-klient:2.0
```

| Del | Betydelse |
|---|---|
| `docker build` | Bygger en image från en Dockerfile |
| `-t chatt-klient:2.0` | *Tag*: imagens namn (`chatt-klient`) och version (`2.0`) |
| `./klient` | *Build context*: mappen med Dockerfile och filerna som ska kopieras in |
| `docker run` | Skapar **och** startar en container från en image |
| `-d` | Kör i bakgrunden |
| `--name klient20` | Containerns namn. Namnet blir också dess adress i nätverket |
| `--network chatt_default` | Koppla containern till det nätverket |
| `-p 8090:80` | Portmappning `datorns-port:containerns-port`. Port 8090 på din dator går till port 80 i containern |
| `--rm` | Ta bort containern automatiskt när den avslutas |
| `-it` | `-i` håller indata öppen, `-t` ger en terminal: tillsammans ett interaktivt skal |
| `chatt-klient:2.0` | Imagen att starta från (sist i kommandot) |

**Övriga kommandon:**

| Kommando | Vad det gör |
|---|---|
| `docker images` | Listar images på din dator |
| `docker rm -f klient20 klient21` | Tar bort containers. `-f` (force) stoppar dem först om de körs |
| `docker network ls` | Listar nätverk |
| `docker network inspect chatt-nat` | Visar ett nätverks containers och IP-adresser |
| `docker inspect <namn>` | All metadata om en container som JSON |
| `docker stats` | CPU, minne och nätverk live per container (`--no-stream` ger en ögonblicksbild) |
| `docker version` | Visar klient- och serverversion. Visas inte `Server` är Docker Desktop inte igång |
| `docker system prune` | Tar bort oanvänt (stoppade containers, oanvända nätverk, ogiltiga images). Frågar först |
| `docker history <image>` | Visar lagren en image består av |

**`docker inspect -f` i övning 4:**

```powershell
docker inspect -f "{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}" chatt-chattserver-1
```

`-f` (format) tar en mall. `range .NetworkSettings.Networks` går igenom alla nätverk containern är med i, och `{{.IPAddress}}` skriver ut IP-adressen i varje. Utan `-f` får du all information på en gång.

**Containrarnas namn:** Compose döper dem `<projekt>-<tjänst>-<nummer>`, t.ex. `chatt-chattserver-1`. Projektnamnet är mappens namn. Se dem med `docker compose ps`.

</details>

<details>
<summary><b>Kommandon inne i containern</b></summary>

&nbsp;

Efter `docker compose exec klient1 bash` är du **inne i** containern. Prompten visar `root@<container-id>:/#`. Det är ett litet Linux-system, inte din dator.

| Kommando | Vad det gör |
|---|---|
| `ls /usr/share/nginx/html` | Listar filerna i den mappen. Där ligger `index.html` |
| `cat /etc/nginx/conf.d/default.conf` | Skriver ut innehållet i konfigfilen |
| `nginx -t` | Testar nginx-konfigen utan att starta om. `syntax is ok` betyder giltig |
| `getent hosts chattserver` | Frågar systemets namnuppslag: vilken IP har `chattserver`? Det är samma fråga nginx ställer |
| `wget -qO- http://klient1` | Hämtar en sida. `-q` tyst, `-O-` skriv till skärmen, `-T 3` gränsar tiden till 3 s |
| `exit` | Lämnar containern. Containern fortsätter köra |

**Viktigt:** `exit` stoppar inte containern. `docker compose exec` startar bara ett extra skal i en container som redan kör.

</details>

<details>
<summary><b>Dockerfile</b>: varje rad i båda filerna</summary>

&nbsp;

En Dockerfile är ett recept för att bygga en **image**. Varje rad blir ett lager som Docker cachar.

**`klient/Dockerfile`:**

```dockerfile
FROM nginx
COPY default.conf /etc/nginx/conf.d/default.conf
COPY index.html /usr/share/nginx/html/index.html
```

**`server/Dockerfile`:**

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package.json .
RUN npm install --omit=dev
COPY server.js .
EXPOSE 3000
CMD ["node", "server.js"]
```

| Nyckelord | Betydelse |
|---|---|
| `FROM nginx` | Basimage: börja med den officiella nginx-imagen. Måste vara första raden |
| `FROM node:22-alpine` | Börja med Node.js 22 på Alpine Linux (liten) |
| `WORKDIR /app` | Arbetsmapp i imagen. Följande rader körs härifrån. Skapas om den saknas |
| `COPY källa mål` | Kopierar en fil **från din mapp** (build context) **in i imagen** |
| `COPY package.json .` | Punkten betyder arbetsmappen i imagen (`/app`) |
| `RUN npm install --omit=dev` | Körs **vid bygget** och installerar biblioteket `ws`. `--omit=dev` hoppar över utvecklingsbibliotek |
| `EXPOSE 3000` | Dokumenterar att programmet använder port 3000. Publicerar **inte** porten, det gör `ports:` |
| `CMD ["node", "server.js"]` | Kommandot som körs **när containern startar**. Hakparentesformen gör att stoppsignaler når programmet direkt |

**Varför kopieras `package.json` före `server.js`?** Docker återanvänder ett lager om inget som ingår i det ändrats. Ändrar du bara `server.js` återanvänds det långsamma `npm install`-lagret, och bygget går snabbt.

**`RUN` kontra `CMD`:** `RUN` körs en gång när imagen byggs. `CMD` körs varje gång en container startas från imagen.

</details>

<details>
<summary><b>compose.yaml</b>: varje nyckel</summary>

&nbsp;

```yaml
services:
  chattserver:
    build: ./server
  klient1:
    build: ./klient
    ports:
      - "8081:80"
```

| Nyckel | Betydelse |
|---|---|
| `services:` | Listan över containers (tjänster) som ska köras |
| `chattserver:` | Tjänstens namn. Det blir också dess **adress** i nätverket, vilket är varför `proxy_pass http://chattserver:3000` fungerar |
| `build: ./server` | Bygg imagen från Dockerfilen i den mappen |
| `image: redis` | Använd en färdig image istället för att bygga |
| `ports:` + `"8081:80"` | Publicera: datorns port 8081 går till containerns port 80. Citattecken rekommenderas |
| `"127.0.0.1:8081:80"` | Samma sak, men bara nåbar från din egen dator |
| `networks:` (under en tjänst) | Vilka nätverk tjänsten ansluts till |
| `networks:` (längst ner) | Definierar nätverken. `name:` ger exakt det namnet |
| `volumes:` | Montera en mapp eller fil från din dator in i containern: `./klient:/usr/share/nginx/html:ro` betyder `källa:mål:skrivskyddat` |
| `mem_limit: 64m` | Högst 64 MB minne |
| `cpus: "0.5"` | Högst en halv processorkärna |
| `restart: unless-stopped` | Starta om containern om den kraschar, men inte om du själv stoppat den |
| `healthcheck:` | Ett test Docker kör regelbundet för att avgöra om tjänsten mår bra |
| `depends_on:` | Starta den här tjänsten efter en annan |

**Indrag är viktigt:** YAML använder **mellanslag** (två per nivå), aldrig tabbar. Fel indrag är det vanligaste felet. Kontrollera med `docker compose config`.

**Varför inget `ports:` på `chattserver`?** Den ska bara nås inifrån nätverket, via nginx.

</details>

<details>
<summary><b>default.conf</b>: nginx-konfigen rad för rad</summary>

&nbsp;

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;

    location /ws {
        proxy_pass http://chattserver:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 3600s;
    }
}
```

| Rad | Betydelse |
|---|---|
| `server { ... }` | En virtuell webbserver |
| `listen 80;` | Lyssna på port 80 **inne i containern** |
| `root /usr/share/nginx/html;` | Mappen med filerna som serveras. Adressen `/` ger `index.html` därifrån, eftersom nginx som standard letar efter just `index.html` |
| `location /ws { ... }` | Regler för alla adresser som börjar på `/ws`. Allt annat serveras som filer |
| `proxy_pass http://chattserver:3000;` | Skicka förfrågan vidare till servern. `chattserver` slås upp av Dockers DNS |
| `proxy_http_version 1.1;` | WebSocket kräver HTTP/1.1 mellan nginx och servern |
| `proxy_set_header Upgrade $http_upgrade;` | För webbläsarens önskan om att uppgradera till WebSocket vidare till servern. `$http_upgrade` är värdet på webbläsarens `Upgrade`-rubrik |
| `proxy_set_header Connection "upgrade";` | Hör ihop med raden ovan. Utan båda blir det fel och chatten ansluter inte |
| `proxy_read_timeout 3600s;` | nginx stänger annars en förbindelse som varit tyst i 60 sekunder. Med raden ligger den öppen i en timme |

**Varför `/ws` och inte hela sidan?** Sidan (HTML) serveras som vanliga filer av nginx. Bara chatt-trafiken ska vidare till servern.

**Ändra konfigen:** efter en ändring bygg om (`docker compose up -d --build`) eller, om filen är monterad, kör `docker compose exec klient1 nginx -s reload`. Testa alltid med `nginx -t` först.

</details>

<details>
<summary><b>server.js</b>: servern rad för rad</summary>

&nbsp;

```js
const { WebSocketServer } = require('ws');
const wss = new WebSocketServer({ port: 3000 });

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    for (const c of wss.clients) {
      if (c.readyState === 1) c.send(data.toString());
    }
  });
});

console.log('Chattserver körs på port 3000');
```

| Rad | Betydelse |
|---|---|
| `require('ws')` | Läser in biblioteket `ws` (installerat av `npm install` i Dockerfilen) |
| `new WebSocketServer({ port: 3000 })` | Startar en WebSocket-server som lyssnar på port 3000 |
| `wss.on('connection', (ws) => { ... })` | Körs **varje gång en klient ansluter**. `ws` är just den klientens anslutning |
| `ws.on('message', (data) => { ... })` | Körs när **den klienten** skickar ett meddelande. `data` är meddelandet |
| `wss.clients` | Mängden av alla anslutna klienter |
| `c.readyState === 1` | 1 betyder `OPEN`. Hoppar över anslutningar som håller på att stängas |
| `c.send(data.toString())` | Skickar texten till klienten. Loopen går över **alla**, så även avsändaren får meddelandet |
| `console.log(...)` | Skriver till stdout, som syns i `docker compose logs chattserver` |

**Varför inget `ports:` för servern?** Servern lyssnar inne i containern. Bara nginx i samma nätverk ska prata med den.

</details>

<details>
<summary><b>index.html</b>: webbsidans JavaScript rad för rad</summary>

&nbsp;

| Del | Betydelse |
|---|---|
| `<input id="namn">`, `<input id="text">`, `<button id="knapp">` | Fält för namn och meddelande, samt skicka-knappen. `id` används för att hitta dem från JavaScript |
| `<div id="logg">` | Rutan där meddelandena visas |
| `new WebSocket(...)` | Öppnar anslutningen till servern |
| `location.protocol === 'https:' ? 'wss://' : 'ws://'` | Använd krypterad (`wss`) om sidan laddats över https, annars `ws` |
| `location.host` | Adressen sidan laddades från, t.ex. `localhost:8081`. Därför funkar sidan från vilken enhet som helst |
| `+ '/ws'` | Sökvägen som nginx skickar vidare till servern |
| `ws.onmessage = (e) => { ... }` | Körs när ett meddelande kommer in. `e.data` är texten |
| `document.createElement('div')` | Skapar en ny rad |
| `rad.textContent = e.data` | Sätter texten som **ren text**, inte HTML. Det hindrar att någon skickar in skript i chatten |
| `logg.append(rad)` | Lägger raden i rutan |
| `logg.scrollTop = logg.scrollHeight` | Scrollar ned till senaste meddelandet |
| `ws.send(namn + ': ' + text)` | Skickar meddelandet till servern |
| `text.value.trim()` | Tar bort mellanslag i början och slutet. Tomt meddelande skickas inte |
| `text.onkeydown = (e) => { if (e.key === 'Enter') ... }` | Skickar även när du trycker Enter |

**Flödet:** du trycker Skicka → `skicka()` → `ws.send(...)` → nginx → servern → alla anslutna → `ws.onmessage` hos var och en.

</details>

<details>
<summary><b>PowerShell och git</b>: vardagskommandon</summary>

&nbsp;

| Kommando | Vad det gör |
|---|---|
| `cd chatt` | Går in i mappen `chatt` |
| `cd ..` | Går upp en nivå |
| `dir` | Listar filer och mappar |
| `mkdir namn` | Skapar en mapp |
| `code .` | Öppnar aktuell mapp i VS Code |
| `ipconfig` | Visar datorns nätverksadresser. Leta efter `IPv4-adress` |
| `Ctrl+C` | Avbryter ett kommando som körs |
| `"..."` runt sökvägar | Behövs om sökvägen innehåller mellanslag |

| Git-kommando | Vad det gör |
|---|---|
| `git clone <adress>` | Hämtar ett repo till din dator |
| `git status` | Visar vilka filer som ändrats |
| `git add .` | Markerar alla ändringar för nästa commit |
| `git commit -m "text"` | Sparar en version lokalt med ett meddelande |
| `git restore .` | **Kastar ändringarna** sedan senaste commit. Används för att återställa efter sabotage |
| `git push` | Skickar dina commits till GitHub |

**Spara innan du experimenterar:** kör `git add .` och sedan `git commit -m "Före övning X"`. I Windows PowerShell 5.1 fungerar inte `&&` mellan kommandon, så kör dem på varsin rad, eller separera dem med `;`.

</details>

---

## Felsökning

| Symptom | Trolig orsak | Åtgärd |
|---|---|---|
| `curl` ger konstigt fel i PowerShell | `curl` är ett alias | Skriv `curl.exe` |
| `docker version` visar bara `Client` | Docker Desktop är inte startat | Starta Docker Desktop |
| `failed to read dockerfile` | Fel filnamn eller mapp | Filen ska heta `Dockerfile`, utan ändelse, och ligga i `server/` respektive `klient/` |
| `COPY failed: file not found` | Filen saknas i build context | Kontrollera filnamn och mapp |
| `port is already allocated` | Porten används av något annat | Byt port i `compose.yaml` eller stoppa det som använder den |
| Klient-containern startar inte | Fel i `default.conf` eller namnet `chattserver` stämmer inte | `docker compose logs klient1` |
| `502 Bad Gateway` på `/ws` | Servern är nere eller fel port i `proxy_pass` | `docker compose ps`, `docker compose logs chattserver` |
| Chatten ansluter inte | `Upgrade`-raderna saknas | F12 → Network → `WS`, kolla `default.conf` |
| Ändringen syns inte | Gammal image eller webbläsarcache | `docker compose up -d --build`, sedan Ctrl+F5 |
| Chatten tappar kontakten efter en minut | nginx stänger tysta anslutningar | `proxy_read_timeout 3600s;` ska finnas i `default.conf` |
| Andra enheter når inte chatten | Brandvägg eller fel nät | Tillåt Docker i brandväggen, kontrollera IP med `ipconfig` |

Användbara kommandon:

```powershell
docker compose ps -a                  # alla containers, även stoppade
docker compose logs -f --tail 20      # följ loggarna live
docker compose exec klient1 sh        # gå in i en container
docker network inspect chatt_default  # se nätverket
docker stats                          # CPU och minne live
docker compose down                   # stäng ner allt
```

## Ordlista

| Begrepp | Förklaring |
|---|---|
| Image | Skrivskyddad mall: program, bibliotek och konfiguration |
| Container | En körande kopia av en image |
| Dockerfile | Recept för att bygga en image |
| Compose | Verktyg som beskriver och startar flera containers tillsammans |
| Tagg | Versionsetikett på en image, t.ex. `chatt-klient:2.1` |
| Build context | Mappen som skickas till Docker när du bygger en image |
| Portmappning | Koppling mellan datorns port och containerns port (`8081:80`) |
| Nätverk | Privat virtuellt nätverk där containers hittar varandra via namn |
| Reverse proxy | Server som tar emot trafik och skickar vidare till en annan (nginx här) |
| WebSocket | Anslutning som hålls öppen så att servern kan skicka data när som helst |
| Bind mount | Mapp eller fil från din dator monterad i containern |
| Volym | Data som Docker hanterar och som överlever containern |
| Healthcheck | Test som Docker kör för att se att en tjänst mår bra |

## Städa upp

```powershell
docker compose down                   # tar bort containers och nätverket
docker compose down --rmi local       # tar även bort images som byggts här
docker system prune                   # tar bort oanvänt (frågar först)
```

Kontrollera med `docker ps -a`, `docker network ls` och `docker images`.
