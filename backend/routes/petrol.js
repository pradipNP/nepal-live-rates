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

function buildPetrolPrices(category1, category2, category3) {
  const petrol = {};

  CATEGORY_1_AREAS.forEach((area) => {
    petrol[area] = category1;
  });

  CATEGORY_2_AREAS.forEach((area) => {
    petrol[area] = category2;
  });

  CATEGORY_3_AREAS.forEach((area) => {
    petrol[area] = category3;
  });

  return petrol;
}

function parseNocPetrolPrices(html) {
  const matches = [...html.matchAll(/Petrol\(MS\):NRs\s*([\d.]+)/gi)];

  if (matches.length < 3) {
    throw new Error("Unable to parse NOC petrol prices");
  }

  const category1 = parseFloat(matches[0][1]);
  const category2 = parseFloat(matches[1][1]);
  const category3 = parseFloat(matches[2][1]);

  return buildPetrolPrices(category1, category2, category3);
}

function getFilteredPetrol(petrol) {
  const filtered = {};

  DROPDOWN_AREAS.forEach((area) => {
    filtered[area] = petrol[area];
  });

  return filtered;
}

function buildYesterdayPrices(currentPetrol) {
  const yesterday = {};

  DROPDOWN_AREAS.forEach((area) => {
    if (previousDaySnapshot?.petrol?.[area] != null) {
      yesterday[area] = previousDaySnapshot.petrol[area];
    } else {
      yesterday[area] = currentPetrol[area];
    }
  });

  return yesterday;
}

function buildPercentChange(currentPetrol, yesterdayPetrol) {
  const percentChange = {};

  DROPDOWN_AREAS.forEach((area) => {
    const today = currentPetrol[area];
    const prev = yesterdayPetrol[area];

    if (prev === 0) {
      percentChange[area] = 0;
      return;
    }

    percentChange[area] = ((today - prev) / prev) * 100;
  });

  return percentChange;
}

function recordDailySnapshot(petrol) {
  const todayKey = getTodayKey();
  const existingIndex = priceHistory.findIndex((entry) => entry.date === todayKey);

  if (existingIndex >= 0) {
    priceHistory[existingIndex] = {
      date: todayKey,
      petrol: { ...petrol },
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
      petrol: { ...petrol },
    });

    if (priceHistory.length > 14) {
      priceHistory.shift();
    }
  }
}

async function fetchNocPetrolData() {
  const response = await axios.get("https://noc.org.np/", {
    timeout: 15000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; NepalLiveRates/1.0; +https://nepal-live-rates.onrender.com)",
    },
  });

  const petrol = parseNocPetrolPrices(response.data);
  const filteredPetrol = getFilteredPetrol(petrol);

  recordDailySnapshot(filteredPetrol);

  const yesterdayPetrol = buildYesterdayPrices(filteredPetrol);
  const percentChange = buildPercentChange(filteredPetrol, yesterdayPetrol);

  return {
    petrol: filteredPetrol,
    yesterday: yesterdayPetrol,
    percentChange,
    lastUpdated: new Date().toISOString(),
  };
}

router.get("/", async (req, res) => {
  try {
    const data = await fetchNocPetrolData();

    res.json({
      success: true,
      source: "NOC",
      lastUpdated: data.lastUpdated,
      petrol: data.petrol,
      yesterday: data.yesterday,
      percentChange: data.percentChange,
    });
  } catch (error) {
    console.error("Petrol API Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch petrol prices",
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
      await fetchNocPetrolData();
    }

    const historyEntries = priceHistory.slice(-7);
    const fallbackPrice =
      historyEntries[historyEntries.length - 1]?.petrol?.[area] || 0;

    const history = historyEntries.map((entry) => {
      const date = new Date(`${entry.date}T12:00:00`);

      return {
        label: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        price: entry.petrol[area] ?? fallbackPrice,
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
    console.error("Petrol History Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch petrol history",
    });
  }
});

module.exports = router;
