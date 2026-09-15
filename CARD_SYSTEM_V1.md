# Snazzle Cards — definitieve basisstructuur v1

Status: **vastgelegd**

## Hoofdcollectie

De vaste hoofdcollectie bestaat uit **48 basiskaarten**:

- WILD Series 01 — 12 kaarten
- SPARK Series 01 — 12 kaarten
- MYSTIC Series 01 — 12 kaarten
- BLAZE Series 01 — 12 kaarten

Vault-, event-, seizoens-, sponsor- en promotiekaarten zijn bonuskaarten en tellen **niet** mee voor 48/48.

## Vaste rarity-verdeling per serie

Iedere serie gebruikt exact dezelfde verdeling:

- kaart 01 t/m 06 — CORE
- kaart 07 t/m 08 — RARE
- kaart 09 t/m 10 — SILVER
- kaart 11 — GOLD
- kaart 12 — PLATINUM

Totaal over de 48 basiskaarten:

- 24 CORE
- 8 RARE
- 8 SILVER
- 4 GOLD
- 4 PLATINUM

## Series en verdienmechanisme

### WILD — AR-vangsten

WILD-kaarten worden uitsluitend verdiend door Snazzles via AR te vangen. Elke WILD-kaart wordt gekoppeld aan één unieke AR-Snazzle / AR-point. De eerste geldige vangst ontgrendelt de bijbehorende kaart permanent.

### SPARK — gewone Hunts

SPARK-kaarten worden verdiend door gewone, centraal bevestigde Snazzle Hunts te voltooien. De voortgang loopt van 1 t/m 12 geldige gewone Hunt-vondsten. Elke nieuwe mijlpaal ontgrendelt de volgende SPARK-kaart permanent.

### MYSTIC — speciale / mysterieuze Hunts en Events

MYSTIC-kaarten worden niet door gewone aantallen ontgrendeld. Elke MYSTIC-kaart wordt gekoppeld aan een aangewezen Mystery Hunt, Special Hunt of Event. Alleen die specifieke bevestigde activiteit kan de kaart permanent ontgrendelen.

### BLAZE — Challenges / prestaties

BLAZE-kaarten worden verdiend via twaalf oplopende Snazzle Challenges. Elke kaart heeft één vaste `challengeId`. Challenges worden gebaseerd op controleerbare activiteit in de app, bijvoorbeeld Hunt-prestaties, AR-prestaties, meerdere dorpen of combinaties daarvan. Een voltooide challenge ontgrendelt de gekoppelde BLAZE-kaart permanent. Challenge-inhoud mag in Beheer worden aangepast; het principe **1 challenge = 1 BLAZE-kaart** blijft vast.

## Permanente ontgrendeling

Een eenmaal verdiende basiskaart mag nooit opnieuw op slot gaan door latere wijzigingen aan Hunts, AR-punten, kaartinstellingen of series.

De uiteindelijke bron van waarheid wordt een server-bevestigd unlock-record, bijvoorbeeld:

`userCardUnlocks/{uid}_{cardNumber}`

Met minimaal:

- `userId`
- `cardNumber`
- `seriesKey`
- `unlockedAt`
- `sourceType` (`ar`, `hunt`, `event`, `challenge`)
- `sourceId`
- `structureVersion`

De app mag deze records lezen, maar een gewone gebruiker mag ze niet zelf aanmaken, wijzigen of verwijderen. Ontgrendeling hoort via vertrouwde/serverlogica te gebeuren na een bevestigde activiteit.

## Beloningen

Beloningen staan los van de 48 basiskaarten en veranderen de teller 48/48 niet.

### 6/12 in één serie

- digitale **Halverwege-badge** van die serie
- korte vier-/animatie in de kaartenverzameling

Reward-id: `series_<seriesKey>_6`

### 12/12 in één serie

- digitale **Series Master-badge**
- één **Series Vault Key**
- toegang tot een exclusieve bonus/Vault-beloning voor die serie

Reward-id: `series_<seriesKey>_12`

### 48/48 hoofdcollectie compleet

- **Snazzle Master Collector**-badge
- exclusief Master Collector-profielkader
- exclusieve **Master Collector Vault Card**
- speciale voltooiingsanimatie

Reward-id: `master_collector_48`

## Voortgang in de UI

De app toont afzonderlijk:

- WILD x/12
- SPARK x/12
- MYSTIC x/12
- BLAZE x/12
- totale basiscollectie x/48

Bonus/Vault-kaarten worden apart geteld.

## Definitieve kaartvolgorde

### WILD Series 01

1. S01-W01 — Trail Blazer
2. S01-W02 — Jungle Jax
3. S01-W03 — Mud Runner
4. S01-W04 — Storm Scout
5. S01-W05 — Boulder Buddy
6. S01-W06 — Night Tracker
7. S01-W07 — River Rush
8. S01-W08 — Forest Flash
9. S01-W09 — Thunder Trek
10. S01-W10 — Shadow Scout
11. S01-W11 — Wild Guardian
12. S01-W12 — Alpha Snazzle

### SPARK Series 01

1. S01-S01 — Star Sprinkle
2. S01-S02 — Moon Glow
3. S01-S03 — Dream Dancer
4. S01-S04 — Crystal Pop
5. S01-S05 — Bubble Bloom
6. S01-S06 — Glitter Glide
7. S01-S07 — Comet Dash
8. S01-S08 — Rainbow Rush
9. S01-S09 — Starlight Hug
10. S01-S10 — Aurora Whirl
11. S01-S11 — Sparkle Sprout
12. S01-S12 — Nova Shine

### MYSTIC Series 01

1. S01-M01 — Moon Whisper
2. S01-M02 — Crystal Dream
3. S01-M03 — Mystic Glow
4. S01-M04 — Shadow Spell
5. S01-M05 — Star Oracle
6. S01-M06 — Dream Keeper
7. S01-M07 — Phantom Flash
8. S01-M08 — Magic Mist
9. S01-M09 — Lunar Legend
10. S01-M10 — Secret Spirit
11. S01-M11 — Mystic Guardian
12. S01-M12 — Mystic Master

### BLAZE Series 01

1. S01-B01 — Flame Runner
2. S01-B02 — Ember Dash
3. S01-B03 — Fire Jumper
4. S01-B04 — Heat Rider
5. S01-B05 — Lava Leap
6. S01-B06 — Spark Striker
7. S01-B07 — Blazing Bolt
8. S01-B08 — Inferno Rush
9. S01-B09 — Firestorm Fury
10. S01-B10 — Crimson Blaze
11. S01-B11 — Flame Guardian
12. S01-B12 — Blaze Master

## Regel voor toekomstige uitbreidingen

Nieuwe series mogen worden toegevoegd, maar wijzigen nooit de betekenis van de oorspronkelijke 48/48 Master Collector-doelstelling. Een nieuwe Series 02 of tijdelijke serie krijgt een eigen verzameldoel en teller.