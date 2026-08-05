# Nepal Live Rates

Nepal Live Rates is a modern web application that provides live foreign exchange rates using official data from Nepal Rastra Bank (NRB). The project is designed to deliver accurate, up-to-date currency information as well as more data through a clean, responsive, and user-friendly interface.

## Live Demo

🌐 Website: https://nepalliverates.netlify.app (Old)
🌐 Website: https://nepal-live-rates.pages.dev (Updated)

⚙️ Backend API: https://nepal-live-rates.onrender.com

### API Endpoint

```http
GET https://nepal-live-rates.onrender.com/api/forex
GET https://nepal-live-rates.onrender.com/api/gold
```

## Project Status

🚧 Active Development

Current Version:

* Live Forex Exchange Rates (Completed)
* Currency Converter (Completed)
* Historical Forex Charts (Completed)

In Progress:

* Gold Rates

Planned:

* Silver Rates
* Fuel Prices
* Cryptocurrency Market
* Nepal Stock Market (NEPSE)
* Market Insights Dashboard

## Features

* Live Forex Rates from Nepal Rastra Bank (NRB)
* Money conversion implemented
* Chart for comparison
* Real-time data retrieval through a custom Node.js backend API
* Responsive design for desktop, tablet, and mobile devices
* Dark and Light theme support
* Currency search functionality
* Auto-refresh support
* Modern glassmorphism UI design
* Error handling and API validation
* Gold API implemented

## Tech Stack

### Frontend

* HTML5
* CSS3
* JavaScript (Vanilla JS)

### Backend

* Node.js
* Express.js
* Axios

### Data Source

* Nepal Rastra Bank (NRB) Forex API

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
│
├── frontend/
│   ├── assets/
│   ├── css/
│   │   ├── about.css
│   │   ├── responsive.css
│   │   ├── style.css
│   │   └── theme.css
│   ├── js/
│   │   ├── about.js
│   │   ├── gold.js
│   │   └── script.js
│   ├── index.html
│   ├── about.html
│   └── gold.html
├── README.md
├── LICENSE
└── .gitignore
```

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

Backend will run on:

```text
https://nepal-live-rates.onrender.com/api/forex
```

### Open Frontend

Open the frontend folder and launch:

```text
index.html
```

in your browser.

## API Endpoint

### Get Latest Forex Rates

```http
GET /api/forex
```

### Sample Response

```json
{
  "success": true,
  "source": "Nepal Rastra Bank",
  "rateDate": "2026-07-30",
  "rates": []
}
```

## Current Modules

### Available

* Foreign Exchange Rates (Forex)
* Gold Live Rates 

### Planned Features

* Gold Rates (few)
* Silver Rates
* Fuel Prices
* Cryptocurrency Market
* Nepal Stock Market
* Historical Charts
* Currency Converter
* Market Insights Dashboard
* Notification System

## Security

* No API keys exposed on the frontend
* Server-side API communication
* Request timeout protection
* Structured error handling
* HTTPS-compatible architecture

## License

This project is licensed under the MIT License.

## Author

**Pradip Kumar Prajapati**

Nepal Live Rates Project

---

If you find this project useful, consider giving it a star on GitHub.
