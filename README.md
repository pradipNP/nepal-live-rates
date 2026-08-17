# Nepal Live Rates

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)
![Cloudflare Pages](https://img.shields.io/badge/Cloudflare%20Pages-F38020?logo=cloudflarepages&logoColor=white)

Modern real-time Nepal financial and commodity rates platform.

**Live tracking for:**

<table align="center" border="1" cellspacing="0" cellpadding="10">
  <tr>
    <td align="center">💱<br><strong>Forex</strong></td>
    <td align="center">🥇<br><strong>Gold</strong></td>
    <td align="center">🥈<br><strong>Silver</strong></td>
    <td align="center">⛽<br><strong>Petrol</strong></td>
    <td align="center">🛢️<br><strong>Diesel</strong></td>
    <td align="center">🔥<br><strong>LPG</strong></td>
    <td align="center">🪔<br><strong>Kerosene</strong></td>
    <td align="center">✈️<br><strong>Aviation Fuel</strong></td>
    <td align="center">📈<br><strong>Crude Oil</strong></td>
  </tr>
</table>

---

## Live Website

**https://nepal-live-rates.pages.dev/**

Backend API: **https://nepal-live-rates.onrender.com**

---

## Features

- Real-time Forex Rates (Nepal Rastra Bank)
- Live Gold Prices
- Live Silver Prices
- Petrol Rates by Area
- Diesel Rates by Area
- LPG Cylinder Prices
- Kerosene Rates by Area
- Aviation Fuel Rates (Jet A-1 & Duty Free)
- Global Crude Oil Tracking (WTI & Brent)
- Interactive Charts
- Historical Trends (7-day)
- Unit Calculators
- Area & Market Selection
- Currency Converter
- Official NOC LPG Documents
- Responsive Design
- Auto Refresh Support

---

## Screenshots

| Home (Forex) | Market Cards |
| :---: | :---: |
| <img src="assets/screenshots/screenshot1%20(1).png" width="360" alt="Home page"> | <img src="assets/screenshots/screenshot1%20(2).png" width="360" alt="Gold page"> |
| *Forex dashboard with live NRB exchange rates* | *Available market cards* |

| Chart Sample | Exchange Rate Cards |
| :---: | :---: |
| <img src="assets/screenshots/screenshot1%20(3).png" width="360" alt="Silver page"> | <img src="assets/screenshots/screenshot1%20(4).png" width="360" alt="Petrol page"> |
| *Trend chart sample for exchange rate* | *Currency cards with rates* |

| Gold | Gold Rates |
| :---: | :---: |
| <img src="assets/screenshots/screenshot1%20(5).png" width="360" alt="Diesel page"> | <img src="assets/screenshots/screenshot1%20(6).png" width="360" alt="LPG page"> |
| *Interface of gold page* | *Live gold rates with details* |

| Converter |
| :---: |
| <img src="assets/screenshots/screenshot1%20(7).png" width="360" alt="Kerosene page"> |
| *Unit converter for gold* |

Crude Oil, Aviation Fuel, and more details are live on the site; go and visit there: **https://nepal-live-rates.pages.dev/**.

---

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | HTML5, CSS3, Vanilla JavaScript, Chart.js |
| Backend | Node.js, Express.js, Axios, Cheerio |
| Deployment | Cloudflare Pages (frontend), Render (backend) |
| Data Sources | Nepal Rastra Bank, FENEGOSIDA, NOC Nepal, Oil-Price.net |

---

## Project Structure

```text
Nepal-Live-Rates/
├── assets/
│   └── screenshots/
├── backend/
│   ├── server.js
│   ├── package.json
│   └── routes/
│       ├── forex.js
│       ├── gold.js
│       ├── silver.js
│       ├── petrol.js
│       ├── diesel.js
│       ├── lpg.js
│       ├── kerosene.js
│       ├── aviation.js
│       └── crude.js
├── frontend/
│   ├── assets/flags/
│   ├── css/
│   │   ├── style.css
│   │   ├── responsive.css
│   │   ├── about.css
│   │   ├── petrol.css
│   │   ├── diesel.css
│   │   ├── lpg.css
│   │   ├── kerosene.css
│   │   ├── aviation.css
│   │   ├── crude.css
│   │   └── silver.css
│   ├── js/
│   │   ├── script.js
│   │   ├── common.js
│   │   ├── gold.js
│   │   ├── silver.js
│   │   ├── petrol.js
│   │   ├── diesel.js
│   │   ├── lpg.js
│   │   ├── kerosene.js
│   │   ├── aviation.js
│   │   ├── crude.js
│   │   └── about.js
│   ├── index.html
│   ├── gold.html
│   ├── silver.html
│   ├── petrol.html
│   ├── diesel.html
│   ├── lpg.html
│   ├── kerosene.html
│   ├── aviation.html
│   ├── crude.html
│   ├── about.html
│   ├── robots.txt
│   └── sitemap.xml
├── LICENSE
└── README.md
```

---

## API Endpoints

Base URL: `https://nepal-live-rates.onrender.com`

| Endpoint | Description |
| --- | --- |
| `GET /api/forex` | Live foreign exchange rates published by Nepal Rastra Bank (NRB). |
| `GET /api/gold` | Current gold rates in tola and gram with daily change tracking. |
| `GET /api/silver` | Current silver rates in tola and gram with daily change tracking. |
| `GET /api/petrol` | Live petrol prices by area across Nepal (NOC). |
| `GET /api/diesel` | Live diesel prices by area across Nepal (NOC). |
| `GET /api/lpg` | Domestic LPG cylinder prices and official NOC document links. |
| `GET /api/kerosene` | Live kerosene prices by area across Nepal (NOC). |
| `GET /api/aviation` | Aviation fuel rates including Jet A-1 and duty-free by area. |
| `GET /api/crude` | Global crude oil prices for WTI and Brent markets. |

History endpoints (e.g. `/api/gold/history`, `/api/forex/history/:currency`) are also available for chart data.

---

## Installation

### Clone Repository

```bash
git clone https://github.com/pradipNP/nepal-live-rates.git
cd Nepal-Live-Rates
```

### Install Backend Dependencies

```bash
cd backend
npm install
```

### Start Backend Server

```bash
npm start
```

Local API: `http://localhost:5000/api/forex`

Serve the `frontend/` folder with any static file server for local development.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Author

**Pradip Kumar Prajapati**

GitHub: [pradipNP](https://github.com/pradipNP)

---

⭐ If you find this project useful, consider starring the repository.
