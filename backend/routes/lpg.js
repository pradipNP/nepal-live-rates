const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

const NOC_LPG_URL = "https://noc.org.np/lpg";
const NOC_LPG_SALES_URL = "https://noc.org.np/pages?id=48";
const LPG_TABLE_HEADING = "Kathmandu, Pokhara, Dipayal";
const NOC_BASE_URL = "https://noc.org.np";

let cachedLpgPage = null;
let cachedLpgDocuments = null;
let cacheTimestamp = 0;
let documentsCacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

const NOC_REQUEST_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (compatible; NepalLiveRates/1.0; +https://nepal-live-rates.onrender.com)",
};

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

function normalizeNocUrl(url) {
  if (!url) {
    return "";
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url.replace("http://noc.org.np", NOC_BASE_URL);
  }

  if (url.startsWith("/")) {
    return `${NOC_BASE_URL}${url}`;
  }

  return `${NOC_BASE_URL}/${url}`;
}

function cleanDocumentTitle(title) {
  return title.replace(/\s*\(current\)\s*/gi, "").trim();
}

function parseDateFromTitle(title) {
  const match = title.match(/(\d{4})\.(\d{2})\.(\d{2})/);

  if (!match) {
    return null;
  }

  const adYear = parseInt(match[1], 10) - 57;

  return `${adYear}-${match[2]}-${match[3]}`;
}

function decodeTempDataHtml(html) {
  const match = html.match(/var tempData="([^"]+)"/);

  if (!match) {
    return "";
  }

  return Buffer.from(match[1], "base64").toString("utf8");
}

function dedupeDocuments(documents) {
  const seen = new Set();

  return documents.filter((document) => {
    if (!document.url || seen.has(document.url)) {
      return false;
    }

    seen.add(document.url);
    return true;
  });
}

function parseSalesDocuments(html) {
  const decodedHtml = decodeTempDataHtml(html);

  if (!decodedHtml) {
    return [];
  }

  const $ = cheerio.load(decodedHtml);
  const documents = [];

  $("a[href]").each((_, el) => {
    const title = cleanDocumentTitle($(el).text().replace(/\s+/g, " "));
    const url = normalizeNocUrl($(el).attr("href"));

    if (!title || !url) {
      return;
    }

    documents.push({
      title,
      url,
      date: parseDateFromTitle(title),
      category: "sales",
    });
  });

  return documents;
}

function parseBottlerDocuments(html) {
  const $ = cheerio.load(html);
  const documents = [];

  $("a[href]").each((_, el) => {
    const href = normalizeNocUrl($(el).attr("href") || "");
    const title = cleanDocumentTitle($(el).text().replace(/\s+/g, " "));

    if (!title || !href) {
      return;
    }

    if (/Bottler'?s Detail of LPG/i.test(title) && /fileData\/2110/i.test(href)) {
      documents.push({
        title: "Bottler's Detail of LPG",
        url: href,
        date: null,
        category: "bottlers",
      });
    }

    if (/LPG Bottlers Contact Details/i.test(title) && /filess\/53/i.test(href)) {
      documents.push({
        title: "LPG Bottlers Contact Details",
        url: href,
        date: null,
        category: "bottlers",
      });
    }
  });

  return documents;
}

async function fetchNocLpgDocuments() {
  const now = Date.now();

  if (cachedLpgDocuments && now - documentsCacheTimestamp < CACHE_TTL_MS) {
    return cachedLpgDocuments;
  }

  const documents = [];

  try {
    const response = await axios.get(NOC_LPG_SALES_URL, {
      timeout: 20000,
      headers: NOC_REQUEST_HEADERS,
    });

    documents.push(...parseSalesDocuments(response.data));
    documents.push(...parseBottlerDocuments(response.data));
  } catch (error) {
    console.error("LPG Documents scrape error:", error.message);
    throw error;
  }

  cachedLpgDocuments = dedupeDocuments(documents);
  documentsCacheTimestamp = now;

  return cachedLpgDocuments;
}

async function fetchNocLpgData() {
  const now = Date.now();

  if (cachedLpgPage && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedLpgPage;
  }

  const response = await axios.get(NOC_LPG_URL, {
    timeout: 20000,
    headers: NOC_REQUEST_HEADERS,
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

router.get("/documents", async (req, res) => {
  try {
    const documents = await fetchNocLpgDocuments();

    res.json({
      success: true,
      source: "NOC",
      documents,
    });
  } catch (error) {
    console.error("LPG Documents Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch LPG documents",
    });
  }
});

module.exports = router;
