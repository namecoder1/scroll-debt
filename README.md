# Scroll Debt – Riassunto dettagliato concept app

## 1. Obiettivo del progetto

Creare un’app **Expo + React Native**, completamente **offline-first** (solo storage locale), che:

- Rende **consapevole** l’utente di quanto tempo passa a fare doomscrolling.
- Trasforma il tempo di scroll in un **“debito” verso il sé futuro**.
- Propone **azioni concrete** (basate su hobby/interessi dell’utente) per “ripagare” questo debito.
- Rimane **leggera** a livello tecnico: nessun backend, nessun account obbligatorio, niente file pesanti.


## 2. Flow generale dell’app

### 2.1. Primo avvio

1. L’utente scarica e apre l’app.
2. Onboarding con breve spiegazione:
   - “Tracciamo quanto scrolli”
   - “Ti mostriamo il tuo debito di tempo”
   - “Ti suggeriamo piccoli modi per ripagarlo”.

### 2.2. Questionario iniziale (salvato in DB locale)

Due blocchi principali:

1. **App che usi per scrollare**
   - Lista di opzioni (multi-select) tipo:
     - TikTok, Instagram, YouTube, X/Twitter, Reddit, Facebook, ecc.
   - Opzione “Altro” con campo testo opzionale.

2. **Hobby / cosa fai quando NON sei al telefono**
   - Es. leggere, suonare, disegnare, fare sport, camminare, cucinare…
   - L’utente seleziona da una lista + può aggiungere hobby custom.

I dati vengono salvati **solo in locale** (AsyncStorage/SQLite).

### 2.3. Arrivo in dashboard

Dopo il questionario:

- L’utente viene portato direttamente alla **dashboard principale**, che mostra:
  - stato del giorno (“quanto hai scrollato oggi”),
  - eventuale budget,
  - suggerimenti per ripagare il debito.

---

## 3. Funzionalità base della dashboard

### 3.1. Aggiunta tempo di scroll

- Pulsante principale: **“Aggiungi tempo scrollato”** con:
  - preset (5 / 15 / 30 / 60 minuti),
  - possibilità di inserimento manuale.
- Per ogni inserimento salvi:
  - `durata` (minuti),
  - `timestamp`,
  - **app** (tra quelle selezionate in onboarding),
  - **contesto** (se abilitati i tag, vedi §6.4).

Questi dati alimentano le analitiche.

---

### 3.2. Categoria di tempo speso + frase del giorno

In base ai minuti scrollati **oggi**, l’app calcola una categoria, ad esempio:

- `poco` – sotto X minuti.
- `medio` – tra X e Y.
- `tanto` – tra Y e Z.
- `esagerato` – oltre Z.

Per ogni categoria hai un set di frasi predefinite (in stile scherzoso/giocoso):

- Esempi:
  - Poco: “Oggi il future you ti applaude educatamente.”
  - Tanto: “Il tuo pollice ha fatto più workout di te.”
  - Esagerato: “Hai sbloccato il livello ‘scrollatore professionista’.”

La dashboard mostra:

- Categoria del giorno.
- **Frase del giorno** pescata random dal pool corrispondente.

---

### 3.3. Analitiche base

Senza backend, puoi comunque fare:

- **Trend settimanale**:
  - grafico a barre: ultimi 7 giorni, minuti scrollati al giorno.
- **Trend mensile**:
  - visione compatta (media minuti/giorno, totale, ecc.).
- **App più scrollate**:
  - ranking delle app selezionate in onboarding con percentuale di uso.
- **Ore “calde”**:
  - fascia oraria in cui lo scroll è più frequente (es. 22–24, 7–9, ecc.).

Tutto calcolato a partire dagli eventi salvati in locale.

---

## 4. Feature extra innovative (sempre senza backend)

Di seguito le funzionalità extra proposte, tutte possibili con **solo storage locale** e dati numerici/testuali leggeri.

### 4.1. Scroll Budget giornaliero

- L’utente imposta un **budget di scroll** (es. 60 min/giorno).
- Dashboard mostra:
  - “Oggi: 45 / 60 min” (consumato / budget).
  - Se superi il budget, evidenzi la parte extra come **debito**.
- Messaggi:
  - Sotto budget: “Hai ancora 15 min di scroll ‘legale’.”
  - Sopra budget: “Sei a +20 min di debito verso il future you.”

Uso dati:  
Per ogni giorno serve solo:

- `budgetGiornaliero`
- `minutiScrollTotali`

---

### 4.2. “Payback Missions” basate sugli hobby

Usi gli hobby raccolti all’onboarding per generare **missioni di ripagamento**.

Esempio:  
Regola: 15 minuti di scroll = 5 minuti di hobby.

Se l’utente aggiunge 30 min di scroll e ha come hobby:

- leggere,
- suonare,
- camminare,

puoi proporre missioni del tipo:

- “10 min di lettura = -10 min di debito”
- “10 min di chitarra = -10 min di debito”

Dashboard:

- Riquadro “Scroll Debt da ripagare: 30 min”
- Sotto, 2–3 card di missioni suggerite.

Dati salvati:

- `minutiDebitoTotali`
- `minutiRipagati` (per giorno).

---

### 4.3. Modalità “Rescue Mode”

Attiva solo quando sei in categoria `tanto` o `esagerato`.

- Dashboard mostra un call-to-action:
  - “Oggi hai esagerato. Vuoi provare a salvare la giornata?”
- Bottone **“Rescue Mode”**:
  - Avvia un timer (es. 10–15 min) durante il quale l’utente si impegna a **non scrollare**.
  - Ogni minuto di timer completato riduce parte del debito (es. 1:1 o 1:0.5).
- UI:
  - Schermata full-screen con countdown + frase motivazionale/ironica.

Dati salvati:

- `rescueSessions` per giorno (durata + minuti “recuperati”).

---

### 4.4. Tag di contesto (ultra leggeri)

Quando l’utente aggiunge tempo:

- Oltre ai preset di minuti, può selezionare un **contesto**:
  - in letto,
  - in bagno,
  - in pausa,
  - sui mezzi,
  - in università,
  - in ufficio, ecc.

Analytics:

- “Top contesti di scroll della settimana/mese”.
- Esempio: “Il 40% del tuo scroll è in letto”.

Dati per evento:

- `contextTag` (stringa breve).

---

### 4.5. Streak di “debito ripagato”

Invece della solita streak “giorni di utilizzo”, definisci:

- Streak = **numero di giorni consecutivi** in cui:
  - rimani **entro il budget**, oppure
  - ripaghi almeno una certa percentuale di debito.

Dashboard:

- Badge: “Streak: 4 giorni in pareggio o meglio”.
- Se salta la streak, frase tipo:
  - “Il future you ha segnato un asterisco su oggi.”

Dati:

- `giorniInPareggio` (bool giornaliero)
- `streakCorrente`, `streakMassima`


## 5. Vincoli tecnici / filosofia di implementazione

- **Niente database esterni**:
  - solo **AsyncStorage** o **SQLite** locale.
- **Nessun file pesante**:
  - niente foto, niente media, solo numeri e stringhe.
- **Nessun account obbligatorio**:
  - l’app funziona 100% anche senza login.
- **Notifiche opzionali**:
  - promemoria per loggare lo scroll,
  - reminder daily recap,
  - eventuale notifica “Rescue Mode?”.

