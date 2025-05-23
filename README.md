# Utleiekalender

En webapplikasjon for å administrere utleie av produkter. Hvert produkt har en unik lagerlokasjon og status ("på lager", "på service", "på utleie"). Applikasjonen inkluderer en kalender som viser utleieperioder for individuelle produkter og en oversiktskalender som viser alle utleide produkter.

## Teknologier
- **Frontend**: React, react-big-calendar
- **Backend**: Node.js, Express
- **Database**: SQLite

## Installasjon
1. Installer Node.js og SQLite3.
2. Kjør `npm install` i rotmappen.
3. Gå til `client`-mappen og kjør `npm install`.
4. Gå til `server`-mappen og kjør `npm install express cors sqlite3`.
5. Sørg for at `client/public/index.html`, `client/src/index.js`, og andre filer er som spesifisert.
6. Kjør `npm start` fra rotmappen.

## Bruk
- Gå til `http://localhost:3001` (eller port spesifisert i terminalen).
- **Produktliste**: Administrer produkter (legg til, slett, oppdater status).
- **Produktkalender**: Vis og legg til utleieperioder for et spesifikt produkt via "Vis kalender".
- **Oversiktskalender**: Se alle utleide produkter og deres utleieperioder på `/overview`.
- Utleieperioder hindrer overlapp for samme produkt.

## Feilsøking
- **"Parsing error: Missing semicolon"**: Sjekk for manglende semikolon eller ekstra parenteser i JSX-filer (f.eks. `ProductList.js`).
- **"React must be in scope"**: Sørg for at `import React from 'react';` er inkludert i alle JSX-filer (`App.js`, `ProductList.js`, `CalendarView.js`, `OverviewCalendar.js`).
- **DeprecationWarning for util._extend**: Oppdater `react-scripts` i `client/package.json` til nyeste versjon og kjør `npm install` i `client`-mappen. Alternativt, legg til `--no-deprecation` i `NODE_OPTIONS` i startskriptet.
- Hvis problemer vedvarer, legg til en `.eslintrc.json` for å konfigurere syntaksregler eller vurder å bruke Vite som bygge-verktøy.

## Database
- `rental.db` opprettes automatisk i `server`-mappen.
- Tabeller: `products` (produkter), `rentals` (utleieperioder).
- Indeks: `idx_rentals_product_id` for raskere oppslag på `product_id`.
