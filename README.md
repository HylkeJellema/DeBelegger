# 🧮 DeBelegger — Box 3 Belasting Calculator

Een interactieve tool om de impact van het Nederlandse **Box 3 belastingstelsel** op je vermogen te visualiseren. Vergelijk drie belastingregimes naast elkaar op basis van historische marktdata.

## ✨ Features

- **Drie belastingregimes** vergelijken:
  - Oud systeem (vóór 2017) — forfaitair rendement van 4%
  - Huidig systeem (overbruggingswet) — forfaitaire rendementen op spaargeld, beleggingen en schulden (incl. schuldendrempel)
  - Toekomstig systeem (2028+) — werkelijk rendement belast (incl. verliesdrempel/carry-forward)
- **Historische marktdata** — AEX, S&P 500, MSCI All World
- **Eigen data invoeren** via de marktdata-pagina
- **Maandelijkse inleg** — vaste inleg aan het einde van elke maand
- **Fiscale partner-toggle** — verdubbelt vrijstellingen en drempels
- Volledig configureerbare parameters per belastingsysteem
- Interactieve grafieken (vermogensgroei, jaarlijkse belasting, cumulatieve belasting)

## 🚀 Lokaal draaien

```bash
npm install
npm run dev
```

Open vervolgens [http://localhost:5173](http://localhost:5173) in je browser.

## 🏗️ Tech Stack

- **Vite** — build tool & dev server
- **Chart.js** — grafieken
- Vanilla HTML, CSS & JavaScript

## 📁 Projectstructuur

```
DeBelegger/
├── index.html        # Hoofdpagina (calculator)
├── data.html         # Marktdata-pagina
├── css/
│   └── style.css     # Styling
├── js/
│   ├── app.js        # Hoofd-applicatielogica
│   ├── taxSystems.js # Belastingberekeningen
│   ├── marketData.js # Marktdata & historische rendementen
│   ├── simulation.js # Simulatielogica
│   └── data.js       # Data-laag
└── assets/
    └── logo.png
```

## ⚠️ Disclaimer

Deze tool is uitsluitend bedoeld ter illustratie. Raadpleeg een belastingadviseur voor persoonlijk advies.

---

Gemaakt door [Hylke Jellema](https://www.linkedin.com/in/hylkej/) voor DeBelegger.
