const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

const NOC_HOME_URL = "https://noc.org.np/";
const NOC_RETAIL_URL = "https://noc.org.np/retailprice";

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

let cachedKeroseneData = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

function buildKerosenePrices(category1, category2, category3) {
  const kerosene = {};

  CATEGORY_1_AREAS.forEach((area) => {
    kerosene[area] = category1;
  });

  CATEGORY_2_AREAS.forEach((area) => {
    kerosene[area] = category2;
  });

  CATEGORY_3_AREAS.forEach((area) => {
    kerosene[area] = category3;
  });

  return kerosene;
}

function parseNocKerosenePrices(html) {
  const matches = [...html.matchAll(/Kerosene\(SKO\):NRs\s*([\d.]+)/gi)];

  if (matches.length < 3) {
    throw new Error("Unable to parse NOC kerosene prices");
  }

  const category1 = parseFloat(matches[0][1]);
  const category2 = parseFloat(matches[1][1]);
  const category3 = parseFloat(matches[2][1]);

  return buildKerosenePrices(category1, category2, category3);
}

function parseRetailDate(rawDate) {
  const match = rawDate.match(/\((\d{4})[.\-/](\d{2})[.\-/](\d{2})\)/);

  if (!match) {
    return null;
  }

  return `${match[1]}-${match[2]}-${match[3]}`;
}

function parseRetailKeroseneHistory(html) {
  const $ = cheerio.load(html);
  const history = [];

  $("table tr").each((_, row) => {
    const cells = $(row)
      .find("td")
      .map((__, cell) => $(cell).text().trim())
      .get();

    if (cells.length < 5) {
      return;
    }

    const date = parseRetailDate(cells[0]);
    const price = parseFloat(cells[4]);

    if (!date || Number.isNaN(price)) {
      return;
    }

    history.push({ date, price });
  });

  if (!history.length) {
    throw new Error("Unable to parse NOC kerosene history");
  }

  return history;
}

function getFilteredKerosene(kerosene) {
  const filtered = {};

  DROPDOWN_AREAS.forEach((area) => {
    filtered[area] = kerosene[area];
  });

  return filtered;
}

function getAreaRatio(kerosene, area) {
  const basePrice = kerosene.Kathmandu || kerosene[area] || 1;

  if (!basePrice) {
    return 1;
  }

  return kerosene[area] / basePrice;
}

function buildYesterdayPrices(kerosene, retailHistory) {
  const yesterday = {};
  const previousBasePrice =
    retailHistory[1]?.price ?? retailHistory[0]?.price ?? kerosene.Kathmandu;

  DROPDOWN_AREAS.forEach((area) => {
    yesterday[area] = Number(
      (previousBasePrice * getAreaRatio(kerosene, area)).toFixed(2),
    );
  });

  return yesterday;
}

function buildPercentChange(currentKerosene, yesterdayKerosene) {
  const percentChange = {};

  DROPDOWN_AREAS.forEach((area) => {
    const today = currentKerosene[area];
    const prev = yesterdayKerosene[area];

    if (prev === 0) {
      percentChange[area] = 0;
      return;
    }

    percentChange[area] = ((today - prev) / prev) * 100;
  });

  return percentChange;
}

function buildHistoryForArea(kerosene, retailHistory, area) {
  const ratio = getAreaRatio(kerosene, area);
  const rows = retailHistory.slice(0, 7).reverse();

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

async function fetchNocKeroseneData() {
  const now = Date.now();

  if (cachedKeroseneData && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedKeroseneData;
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

  const kerosene = getFilteredKerosene(
    parseNocKerosenePrices(homeResponse.data),
  );
  const retailHistory = parseRetailKeroseneHistory(retailResponse.data);
  const yesterday = buildYesterdayPrices(kerosene, retailHistory);
  const percentChange = buildPercentChange(kerosene, yesterday);
  const latestDate = retailHistory[0].date;

  cachedKeroseneData = {
    kerosene,
    yesterday,
    percentChange,
    retailHistory,
    lastUpdated: `${latestDate}T12:00:00.000Z`,
  };
  cacheTimestamp = now;

  return cachedKeroseneData;
}

router.get("/", async (req, res) => {
  try {
    const data = await fetchNocKeroseneData();

    res.json({
      success: true,
      source: "NOC",
      lastUpdated: data.lastUpdated,
      kerosene: data.kerosene,
      yesterday: data.yesterday,
      percentChange: data.percentChange,
    });
  } catch (error) {
    console.error("Kerosene API Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch kerosene prices",
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

    const data = await fetchNocKeroseneData();
    const history = buildHistoryForArea(
      data.kerosene,
      data.retailHistory,
      area,
    );

    res.json({
      success: true,
      area,
      history,
    });
  } catch (error) {
    console.error("Kerosene History Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch kerosene history",
    });
  }
});

module.exports = router;
