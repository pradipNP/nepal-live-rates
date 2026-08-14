const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

const NOC_LPG_URL = "https://noc.org.np/lpg";
const LPG_TABLE_HEADING = "Kathmandu, Pokhara, Dipayal";

let cachedLpgPage = null;
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

function parseNocLpgPage(html) {
  const $ = cheerio.load(html);
  let lpgRows = null;

  $("h5").each((_, el) => {
    const heading = normalizeHeading($(el).text());

    if (!heading.includes(LPG_TABLE_HEADING)) {
      return;
    }

    const table = $(el).next("table");

    if (!table.length) {
      return;
    }

    const rows = parseTableRows(table);

    if (rows.length) {
      lpgRows = rows;
    }
  });

  if (!lpgRows?.length) {
    throw new Error("Unable to parse NOC LPG prices");
  }

  return lpgRows;
}

function buildLpgSummary(rows) {
  const current = rows[0].price;
  const yesterday = rows[1]?.price ?? current;
  const change = current - yesterday;
  const percentChange = yesterday === 0 ? 0 : (change / yesterday) * 100;

  return {
    current,
    yesterday,
    change,
    percentChange,
    lastUpdated: `${rows[0].date}T12:00:00.000Z`,
  };
}

function buildHistory(rows) {
  return rows
    .slice(0, 7)
    .reverse()
    .map((row) => {
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

async function fetchNocLpgData() {
  const now = Date.now();

  if (cachedLpgPage && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedLpgPage;
  }

  const response = await axios.get(NOC_LPG_URL, {
    timeout: 20000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; NepalLiveRates/1.0; +https://nepal-live-rates.onrender.com)",
    },
  });

  const rows = parseNocLpgPage(response.data);
  const summary = buildLpgSummary(rows);
  const history = buildHistory(rows);

  cachedLpgPage = { summary, history, rows };
  cacheTimestamp = now;

  return cachedLpgPage;
}

router.get("/", async (req, res) => {
  try {
    const data = await fetchNocLpgData();

    res.json({
      success: true,
      source: "NOC",
      lastUpdated: data.summary.lastUpdated,
      lpg: {
        current: data.summary.current,
        yesterday: data.summary.yesterday,
        change: data.summary.change,
        percentChange: Number(data.summary.percentChange.toFixed(2)),
      },
    });
  } catch (error) {
    console.error("LPG API Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch LPG prices",
    });
  }
});

router.get("/history", async (req, res) => {
  try {
    const data = await fetchNocLpgData();

    res.json({
      success: true,
      history: data.history,
    });
  } catch (error) {
    console.error("LPG History Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch LPG history",
    });
  }
});

module.exports = router;
