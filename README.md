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
  
## Database
- `rental.db` opprettes automatisk i `server`-mappen.
- Tabeller: `products` (produkter), `rentals` (utleieperioder).
- Indeks: `idx_rentals_product_id` for raskere oppslag på `product_id`.
