const express = require("express");
const axios = require("axios");

const router = express.Router();

const WTI_WIDGET_URL = "https://www.oil-price.net/TABLE2/gen.php?lang=en";
const BRENT_WIDGET_URL =
  "https://www.oil-price.net/widgets/brent_crude_price_large/gen.php?lang=en";

const REQUEST_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (compatible; NepalLiveRates/1.0; +https://nepal-live-rates.onrender.com)",
};

const priceHistory = [];
let cachedCrudeData = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

function parseOilWidget(scriptContent) {
  const priceMatch = scriptContent.match(/\$([\d.]+)/);
  const changeMatch = scriptContent.match(/&#9650;([\d.]+)|&#9660;([\d.]+)/);
  const percentMatch = scriptContent.match(/(\d+\.\d+)%/);
  const dateMatch = scriptContent.match(/(\d{4}\.\d{2}\.\d{2})/);

  if (!priceMatch) {
    throw new Error("Unable to parse oil price widget");
  }

  const price = parseFloat(priceMatch[1]);
  const changeAmount = changeMatch
    ? parseFloat(changeMatch[1] || changeMatch[2])
    : 0;
  const isDown = scriptContent.includes("&#9660;");
  const change = isDown ? -changeAmount : changeAmount;
  const percentChange = percentMatch ? parseFloat(percentMatch[1]) : 0;
  const signedPercent = isDown ? -percentChange : percentChange;
  const yesterday = Number((price - change).toFixed(2));

  let lastUpdated = new Date().toISOString();

  if (dateMatch) {
    const [year, month, day] = dateMatch[1].split(".");
    lastUpdated = `${year}-${month}-${day}T12:00:00.000Z`;
  }

  return {
    price: Number(price.toFixed(2)),
    yesterday,
    change: Number(change.toFixed(2)),
    percentChange: Number(signedPercent.toFixed(2)),
    lastUpdated,
  };
}

function recordDailySnapshot(crude) {
  const todayKey = getTodayKey();
  const entry = {
    date: todayKey,
    WTI: crude.WTI.price,
    Brent: crude.Brent.price,
  };
  const existingIndex = priceHistory.findIndex((item) => item.date === todayKey);

  if (existingIndex >= 0) {
    priceHistory[existingIndex] = entry;
  } else {
    priceHistory.push(entry);

    if (priceHistory.length > 14) {
      priceHistory.shift();
    }
  }
}

function buildMarketHistory(market, entries) {
  const fallbackPrice = entries[entries.length - 1]?.[market] || 0;

  const history = entries.map((entry) => {
    const date = new Date(`${entry.date}T12:00:00`);

    return {
      label: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      price: entry[market] ?? fallbackPrice,
    };
  });

  while (history.length < 7) {
    const placeholderDate = new Date();
    placeholderDate.setDate(placeholderDate.getDate() - (7 - history.length));

    history.unshift({
      label: placeholderDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      price: fallbackPrice,
    });
  }

  return history;
}

function buildHistory() {
  const entries = priceHistory.slice(-7);

  return {
    WTI: buildMarketHistory("WTI", entries),
    Brent: buildMarketHistory("Brent", entries),
  };
}

async function fetchCrudeData() {
  const now = Date.now();

  if (cachedCrudeData && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedCrudeData;
  }

  const [wtiResponse, brentResponse] = await Promise.all([
    axios.get(WTI_WIDGET_URL, {
      timeout: 20000,
      headers: REQUEST_HEADERS,
    }),
    axios.get(BRENT_WIDGET_URL, {
      timeout: 20000,
      headers: REQUEST_HEADERS,
    }),
  ]);

  const wti = parseOilWidget(wtiResponse.data);
  const brent = parseOilWidget(brentResponse.data);

  const crude = {
    WTI: {
      price: wti.price,
      yesterday: wti.yesterday,
      change: wti.change,
      percentChange: wti.percentChange,
    },
    Brent: {
      price: brent.price,
      yesterday: brent.yesterday,
      change: brent.change,
      percentChange: brent.percentChange,
    },
  };

  recordDailySnapshot(crude);

  const lastUpdated =
    wti.lastUpdated > brent.lastUpdated ? wti.lastUpdated : brent.lastUpdated;

  cachedCrudeData = {
    crude,
    lastUpdated,
    history: buildHistory(),
  };
  cacheTimestamp = now;

  return cachedCrudeData;
}

router.get("/", async (req, res) => {
  try {
    const data = await fetchCrudeData();

    res.json({
      success: true,
      source: "Oil-Price.net",
      lastUpdated: data.lastUpdated,
      crude: data.crude,
    });
  } catch (error) {
    console.error("Crude API Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch crude oil prices",
    });
  }
});

router.get("/history", async (req, res) => {
  try {
    const data = await fetchCrudeData();

    res.json({
      success: true,
      history: data.history,
    });
  } catch (error) {
    console.error("Crude History Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch crude oil history",
    });
  }
});

module.exports = router;
