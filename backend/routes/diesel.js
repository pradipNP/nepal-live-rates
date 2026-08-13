const express = require("express");
const axios = require("axios");

const router = express.Router();

const CATEGORY_1_AREAS = [
  "Charali",
  "Biratnagar",
  "Janakpur",
  "Birgunj",
  "Amlekhgunj",
  "Bhalubang",
  "Nepalgunj",
  "Dhangadhi",
];

const CATEGORY_2_AREAS = ["Dang", "Surkhet"];

const CATEGORY_3_AREAS = ["Kathmandu", "Pokhara", "Dipayal"];

const DROPDOWN_AREAS = [
  "Kathmandu",
  "Pokhara",
  "Dipayal",
  "Biratnagar",
  "Birgunj",
  "Janakpur",
  "Nepalgunj",
  "Dhangadhi",
  "Dang",
  "Surkhet",
];

const priceHistory = [];
let previousDaySnapshot = null;

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

function buildDieselPrices(category1, category2, category3) {
  const diesel = {};

  CATEGORY_1_AREAS.forEach((area) => {
    diesel[area] = category1;
  });

  CATEGORY_2_AREAS.forEach((area) => {
    diesel[area] = category2;
  });

  CATEGORY_3_AREAS.forEach((area) => {
    diesel[area] = category3;
  });

  return diesel;
}

function parseNocDieselPrices(html) {
  const matches = [...html.matchAll(/Diesel\(HSD\):NRs\s*([\d.]+)/gi)];

  if (matches.length < 3) {
    throw new Error("Unable to parse NOC diesel prices");
  }

  const category1 = parseFloat(matches[0][1]);
  const category2 = parseFloat(matches[1][1]);
  const category3 = parseFloat(matches[2][1]);

  return buildDieselPrices(category1, category2, category3);
}

function getFilteredDiesel(diesel) {
  const filtered = {};

  DROPDOWN_AREAS.forEach((area) => {
    filtered[area] = diesel[area];
  });

  return filtered;
}

function buildYesterdayPrices(currentDiesel) {
  const yesterday = {};

  DROPDOWN_AREAS.forEach((area) => {
    if (previousDaySnapshot?.diesel?.[area] != null) {
      yesterday[area] = previousDaySnapshot.diesel[area];
    } else {
      yesterday[area] = currentDiesel[area];
    }
  });

  return yesterday;
}

function buildPercentChange(currentDiesel, yesterdayDiesel) {
  const percentChange = {};

  DROPDOWN_AREAS.forEach((area) => {
    const today = currentDiesel[area];
    const prev = yesterdayDiesel[area];

    if (prev === 0) {
      percentChange[area] = 0;
      return;
    }

    percentChange[area] = ((today - prev) / prev) * 100;
  });

  return percentChange;
}

function recordDailySnapshot(diesel) {
  const todayKey = getTodayKey();
  const existingIndex = priceHistory.findIndex((entry) => entry.date === todayKey);

  if (existingIndex >= 0) {
    priceHistory[existingIndex] = {
      date: todayKey,
      diesel: { ...diesel },
    };
  } else {
    if (
      priceHistory.length > 0 &&
      priceHistory[priceHistory.length - 1].date !== todayKey
    ) {
      previousDaySnapshot = priceHistory[priceHistory.length - 1];
    }

    priceHistory.push({
      date: todayKey,
      diesel: { ...diesel },
    });

    if (priceHistory.length > 14) {
      priceHistory.shift();
    }
  }
}

async function fetchNocDieselData() {
  const response = await axios.get("https://noc.org.np/", {
    timeout: 15000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; NepalLiveRates/1.0; +https://nepal-live-rates.onrender.com)",
    },
  });

  const diesel = parseNocDieselPrices(response.data);
  const filteredDiesel = getFilteredDiesel(diesel);

  recordDailySnapshot(filteredDiesel);

  const yesterdayDiesel = buildYesterdayPrices(filteredDiesel);
  const percentChange = buildPercentChange(filteredDiesel, yesterdayDiesel);

  return {
    diesel: filteredDiesel,
    yesterday: yesterdayDiesel,
    percentChange,
    lastUpdated: new Date().toISOString(),
  };
}

router.get("/", async (req, res) => {
  try {
    const data = await fetchNocDieselData();

    res.json({
      success: true,
      source: "NOC",
      lastUpdated: data.lastUpdated,
      diesel: data.diesel,
      yesterday: data.yesterday,
      percentChange: data.percentChange,
    });
  } catch (error) {
    console.error("Diesel API Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch diesel prices",
    });
  }
});

router.get("/history", async (req, res) => {
  try {
    const area = req.query.area || "Kathmandu";

    if (!DROPDOWN_AREAS.includes(area)) {
      return res.status(400).json({
        success: false,
        message: "Invalid area selected",
      });
    }

    if (priceHistory.length === 0) {
      await fetchNocDieselData();
    }

    const historyEntries = priceHistory.slice(-7);
    const fallbackPrice =
      historyEntries[historyEntries.length - 1]?.diesel?.[area] || 0;

    const history = historyEntries.map((entry) => {
      const date = new Date(`${entry.date}T12:00:00`);

      return {
        label: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        price: entry.diesel[area] ?? fallbackPrice,
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

    res.json({
      success: true,
      area,
      history,
    });
  } catch (error) {
    console.error("Diesel History Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch diesel history",
    });
  }
});

module.exports = router;
