const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

const NOC_DIESEL_URL = "https://noc.org.np/diesel";

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

const REGION_TABLES = [
  {
    id: "category1",
    headingIncludes: ["Birgunj", "Dhangadi"],
    areas: CATEGORY_1_AREAS,
  },
  {
    id: "category2",
    headingIncludes: ["Surkhet", "Dang"],
    areas: CATEGORY_2_AREAS,
  },
  {
    id: "category3",
    headingIncludes: ["Kathmandu", "Pokhara", "Dipayal"],
    areas: CATEGORY_3_AREAS,
  },
];

let cachedDieselPage = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

function normalizeHeading(text) {
  return text.replace(/\s+/g, " ").trim();
}

function parseTableRows(table) {
  const rows = [];

  table.find("tr").each((_, row) => {
    const cells = cheerio.load(row)("td")
      .map((__, cell) => cheerio.load(cell).text().trim())
      .get();

    if (cells.length < 2) {
      return;
    }

    const price = parseFloat(cells[0]);
    const date = cells[1];

    if (Number.isNaN(price) || !date) {
      return;
    }

    rows.push({ price, date });
  });

  return rows;
}

function parseNocDieselPage(html) {
  const $ = cheerio.load(html);
  const parsedTables = [];

  $("h5").each((_, el) => {
    const heading = normalizeHeading($(el).text());
    const table = $(el).next("table");

    if (!table.length) {
      return;
    }

    const rows = parseTableRows(table);

    if (!rows.length) {
      return;
    }

    parsedTables.push({ heading, rows });
  });

  const regionData = {};

  REGION_TABLES.forEach((region) => {
    const matches = parsedTables.filter((table) =>
      region.headingIncludes.every((part) => table.heading.includes(part)),
    );

    if (!matches.length) {
      throw new Error(`Unable to find diesel table for ${region.id}`);
    }

    matches.sort((a, b) => new Date(b.rows[0].date) - new Date(a.rows[0].date));
    regionData[region.id] = matches[0].rows;
  });

  return regionData;
}

function buildDieselPrices(regionData) {
  const diesel = {};

  REGION_TABLES.forEach((region) => {
    const currentPrice = regionData[region.id][0].price;

    region.areas.forEach((area) => {
      diesel[area] = currentPrice;
    });
  });

  return diesel;
}

function buildYesterdayPrices(regionData) {
  const yesterday = {};

  REGION_TABLES.forEach((region) => {
    const previousPrice =
      regionData[region.id][1]?.price ?? regionData[region.id][0].price;

    region.areas.forEach((area) => {
      if (DROPDOWN_AREAS.includes(area)) {
        yesterday[area] = previousPrice;
      }
    });
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

function getFilteredDiesel(diesel) {
  const filtered = {};

  DROPDOWN_AREAS.forEach((area) => {
    filtered[area] = diesel[area];
  });

  return filtered;
}

function getRegionIdForArea(area) {
  if (CATEGORY_3_AREAS.includes(area)) {
    return "category3";
  }

  if (CATEGORY_2_AREAS.includes(area)) {
    return "category2";
  }

  return "category1";
}

function buildHistoryForArea(regionData, area) {
  const regionId = getRegionIdForArea(area);
  const rows = regionData[regionId].slice(0, 7).reverse();

  return rows.map((row) => {
    const date = new Date(`${row.date}T12:00:00`);

    return {
      label: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      price: row.price,
      date: row.date,
    };
  });
}

async function fetchNocDieselPage() {
  const now = Date.now();

  if (cachedDieselPage && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedDieselPage;
  }

  const response = await axios.get(NOC_DIESEL_URL, {
    timeout: 20000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; NepalLiveRates/1.0; +https://nepal-live-rates.onrender.com)",
    },
  });

  const regionData = parseNocDieselPage(response.data);

  cachedDieselPage = regionData;
  cacheTimestamp = now;

  return regionData;
}

async function fetchNocDieselData() {
  const regionData = await fetchNocDieselPage();
  const diesel = getFilteredDiesel(buildDieselPrices(regionData));
  const yesterday = buildYesterdayPrices(regionData);
  const percentChange = buildPercentChange(diesel, yesterday);

  const latestDate = regionData.category3[0].date;

  return {
    diesel,
    yesterday,
    percentChange,
    regionData,
    lastUpdated: `${latestDate}T12:00:00.000Z`,
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

    const data = await fetchNocDieselData();
    const history = buildHistoryForArea(data.regionData, area);

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
