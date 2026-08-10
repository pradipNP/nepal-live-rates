# Nepal Live Rates

Nepal Live Rates is a modern web application that provides real-time financial and commodity market information for Nepal. The platform currently offers live Foreign Exchange (Forex), Gold Rates, and Silver Rates through a responsive and user-friendly interface powered by a custom Node.js backend.

## Live Demo

🌐 Frontend (Latest): https://nepal-live-rates.pages.dev

🌐 Legacy Frontend: https://nepalliverates.netlify.app

⚙️ Backend API: https://nepal-live-rates.onrender.com

---

## API Endpoints

```http
GET /api/forex
GET /api/gold
GET /api/gold/history
GET /api/silver
GET /api/silver/history
```

---

## Project Status

### Current Version

✅ Live Forex Exchange Rates

✅ Currency Converter

✅ Historical Forex Charts

✅ Gold Rates Module

✅ Gold Calculator

✅ Gold Unit Converter

✅ Gold Price Trend Chart

✅ Silver Rates Module

✅ Silver Calculator

✅ Silver Unit Converter

✅ Silver Price Trend Chart

✅ Dark / Light Theme Support

✅ Responsive UI

### Planned Features

* Fuel Prices
* Cryptocurrency Market
* Nepal Stock Exchange (NEPSE)
* Market Insights Dashboard
* Price Alerts & Notifications
* Economic Indicators

---

## Features

### Forex Module

* Live exchange rates from Nepal Rastra Bank (NRB)
* Currency search functionality
* Currency converter
* Historical exchange rate chart
* Auto refresh support

### Gold Module

* Live Gold Rates
* Tola and Gram pricing
* Gold calculator
* Gold unit converter
* 7-day historical gold chart
* Price movement tracking

### Silver Module

* Live Silver Rates
* Tola and Gram pricing
* Silver calculator
* Silver unit converter
* 7-day historical silver chart
* Price movement tracking

### General Features

* Responsive design
* Mobile-friendly interface
* Dark and Light themes
* Glassmorphism UI
* API error handling
* Auto-refresh functionality
* Optimized performance

---

## Tech Stack

### Frontend

* HTML5
* CSS3
* Vanilla JavaScript
* Chart.js

### Backend

* Node.js
* Express.js
* Axios

### Data Sources

* Nepal Rastra Bank (NRB)
* Federation of Nepal Gold and Silver Dealers' Associations (FENEGOSIDA)

---

## Project Structure

```text
Nepal-Live-Rates/
│
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── package-lock.json
│   └── routes/
│       ├── forex.js
│       ├── gold.js
│       └── silver.js
│
├── frontend/
│   ├── assets/
│   ├── css/
│   │   ├── about.css
│   │   ├── responsive.css
│   │   ├── style.css
│   │   ├── theme.css
│   │   └── silver.css
│   │
│   ├── js/
│   │   ├── about.js
│   │   ├── script.js
│   │   ├── gold.js
│   │   └── silver.js
│   │
│   ├── index.html
│   ├── about.html
│   ├── gold.html
│   └── silver.html
│
├── README.md
├── LICENSE
└── .gitignore
```

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

Backend will run locally on:

```http
http://localhost:5000
```

Example:

```http
http://localhost:5000/api/forex
```

---

## Sample API Response

### Gold API

```json
{
  "success": true,
  "source": "FENEGOSIDA",
  "lastUpdated": "2026-08-10",
  "gold": {
    "tola": {
      "today": 210000,
      "yesterday": 208500
    },
    "gram10": {
      "today": 180050,
      "yesterday": 178700
    },
    "change": 1500,
    "percentChange": 0.72
  }
}
```

---

## Current Modules

### Available

* Foreign Exchange Rates (Forex)
* Gold Rates
* Silver Rates
* Currency Converter
* Historical Charts
* Unit Converters

### Upcoming

* Fuel Prices
* Cryptocurrency Market
* Nepal Stock Market (NEPSE)
* Notifications
* Market Insights Dashboard

---

## Security

* No sensitive API credentials exposed
* Backend-controlled data fetching
* Request timeout protection
* Structured error handling
* HTTPS-compatible architecture

---

## License

This project is licensed under the MIT License.

---

## Author

**Pradip Kumar Prajapati**

Developer of Nepal Live Rates

GitHub: https://github.com/pradipNP

---

⭐ If you find this project useful, consider starring the repository and following future updates.
