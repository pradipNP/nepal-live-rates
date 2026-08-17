const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

const NOC_HOME_URL = "https://noc.org.np/";
const NOC_RETAIL_URL = "https://noc.org.np/retailprice";

const FUEL_TYPES = ["JetA1", "DutyFree"];

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

const REQUEST_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (compatible; NepalLiveRates/1.0; +https://nepal-live-rates.onrender.com)",
};

let cachedAviationData = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

function buildRegionalPrices(category1, category2, category3) {
  const prices = {};

  CATEGORY_1_AREAS.forEach((area) => {
    prices[area] = category1;
  });

  CATEGORY_2_AREAS.forEach((area) => {
    prices[area] = category2;
  });

  CATEGORY_3_AREAS.forEach((area) => {
    prices[area] = category3;
  });

  return prices;
}

function getFilteredPrices(prices) {
  const filtered = {};

  DROPDOWN_AREAS.forEach((area) => {
    filtered[area] = prices[area];
  });

  return filtered;
}

function parseNocAviationPrices(html) {
  const jetMatches = [
    ...html.matchAll(/Aviation Turbine Fuel\(Jet A-1\):NRs\s*([\d.]+)/gi),
  ];
  const dutyFreeMatches = [
    ...html.matchAll(/Aviation Fuel Duty Free:USD\s*([\d.]+)/gi),
  ];

  if (jetMatches.length < 3 || dutyFreeMatches.length < 3) {
    throw new Error("Unable to parse NOC aviation fuel prices");
  }

  return {
    JetA1: getFilteredPrices(
      buildRegionalPrices(
        parseFloat(jetMatches[0][1]),
        parseFloat(jetMatches[1][1]),
        parseFloat(jetMatches[2][1]),
      ),
    ),
    DutyFree: getFilteredPrices(
      buildRegionalPrices(
        parseFloat(dutyFreeMatches[0][1]),
        parseFloat(dutyFreeMatches[1][1]),
        parseFloat(dutyFreeMatches[2][1]),
      ),
    ),
  };
}

function parseRetailDate(rawDate) {
  const match = rawDate.match(/\((\d{4})[.\-/](\d{2})[.\-/](\d{2})\)/);

  if (!match) {
    return null;
  }

  return `${match[1]}-${match[2]}-${match[3]}`;
}

function parseRetailAviationHistory(html) {
  const $ = cheerio.load(html);
  const jetA1History = [];
  const dutyFreeHistory = [];

  $("table tr").each((_, row) => {
    const cells = $(row)
      .find("td")
      .map((__, cell) => $(cell).text().trim())
      .get();

    if (cells.length < 8) {
      return;
    }

    const date = parseRetailDate(cells[0]);
    const jetA1Price = parseFloat(cells[6]);
    const dutyFreePrice = parseFloat(cells[7]);

    if (!date || Number.isNaN(jetA1Price) || Number.isNaN(dutyFreePrice)) {
      return;
    }

    jetA1History.push({ date, price: jetA1Price });
    dutyFreeHistory.push({ date, price: dutyFreePrice });
  });

  if (!jetA1History.length || !dutyFreeHistory.length) {
    throw new Error("Unable to parse NOC aviation fuel history");
  }

  return {
    JetA1: jetA1History,
    DutyFree: dutyFreeHistory,
  };
}

function getAreaRatio(prices, area) {
  const basePrice = prices.Kathmandu || prices[area] || 1;

  if (!basePrice) {
    return 1;
  }

  return prices[area] / basePrice;
}

function buildYesterdayPrices(aviation, retailHistory) {
  const yesterday = {};

  FUEL_TYPES.forEach((fuelType) => {
    yesterday[fuelType] = {};
    const previousBasePrice =
      retailHistory[fuelType][1]?.price ??
      retailHistory[fuelType][0]?.price ??
      aviation[fuelType].Kathmandu;

    DROPDOWN_AREAS.forEach((area) => {
      yesterday[fuelType][area] = Number(
        (previousBasePrice * getAreaRatio(aviation[fuelType], area)).toFixed(2),
      );
    });
  });

  return yesterday;
}

function buildPercentChange(aviation, yesterday) {
  const percentChange = {};

  FUEL_TYPES.forEach((fuelType) => {
    percentChange[fuelType] = {};

    DROPDOWN_AREAS.forEach((area) => {
      const today = aviation[fuelType][area];
      const prev = yesterday[fuelType][area];

      if (prev === 0) {
        percentChange[fuelType][area] = 0;
        return;
      }

      percentChange[fuelType][area] = ((today - prev) / prev) * 100;
    });
  });

  return percentChange;
}

function buildHistoryForArea(aviation, retailHistory, fuelType, area) {
  const ratio = getAreaRatio(aviation[fuelType], area);
  const rows = retailHistory[fuelType].slice(0, 7).reverse();

  return rows.map((row) => {
    const date = new Date(`${row.date}T12:00:00`);

    return {
      label: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      price: Number((row.price * ratio).toFixed(2)),
      date: row.date,
    };
  });
}

async function fetchNocAviationData() {
  const now = Date.now();

  if (cachedAviationData && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedAviationData;
  }

  const [homeResponse, retailResponse] = await Promise.all([
    axios.get(NOC_HOME_URL, {
      timeout: 20000,
      headers: REQUEST_HEADERS,
    }),
    axios.get(NOC_RETAIL_URL, {
      timeout: 20000,
      headers: REQUEST_HEADERS,
    }),
  ]);

  const aviation = parseNocAviationPrices(homeResponse.data);
  const retailHistory = parseRetailAviationHistory(retailResponse.data);
  const yesterday = buildYesterdayPrices(aviation, retailHistory);
  const percentChange = buildPercentChange(aviation, yesterday);
  const latestDate = retailHistory.JetA1[0].date;

  cachedAviationData = {
    aviation,
    yesterday,
    percentChange,
    retailHistory,
    lastUpdated: `${latestDate}T12:00:00.000Z`,
  };
  cacheTimestamp = now;

  return cachedAviationData;
}

router.get("/", async (req, res) => {
  try {
    const data = await fetchNocAviationData();

    res.json({
      success: true,
      source: "NOC",
      lastUpdated: data.lastUpdated,
      aviation: data.aviation,
      yesterday: data.yesterday,
      percentChange: data.percentChange,
    });
  } catch (error) {
    console.error("Aviation API Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch aviation fuel prices",
    });
  }
});

router.get("/history", async (req, res) => {
  try {
    const area = req.query.area || "Kathmandu";
    const fuelType = req.query.type || "JetA1";

    if (!DROPDOWN_AREAS.includes(area)) {
      return res.status(400).json({
        success: false,
        message: "Invalid area selected",
      });
    }

    if (!FUEL_TYPES.includes(fuelType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid aviation fuel type selected",
      });
    }

    const data = await fetchNocAviationData();
    const history = buildHistoryForArea(
      data.aviation,
      data.retailHistory,
      fuelType,
      area,
    );

    res.json({
      success: true,
      area,
      type: fuelType,
      history,
    });
  } catch (error) {
    console.error("Aviation History Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch aviation fuel history",
    });
  }
});

module.exports = router;
