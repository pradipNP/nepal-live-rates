const express = require("express");
const axios = require("axios");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const response = await axios.get(
      "https://api.fenegosida.org/api/website/v1/Dashboard/today",
      {
        timeout: 10000,
      }
    );

    const data = response.data;

    const silverTola = data.find(
      (item) =>
        item.rateType.includes("असली चाँदी") &&
        item.rateType.includes("१ तोला")
    );

    const silverGram = data.find(
      (item) =>
        item.rateType.includes("असली चाँदी") &&
        item.rateType.includes("१० ग्राम")
    );

    if (!silverTola || !silverGram) {
      return res.status(404).json({
        success: false,
        message: "Silver data not found",
      });
    }

    const change =
      silverTola.todayBaseRatePerGram -
      silverTola.yestardayBaseRatePerGram;

    const percentChange =
      (change / silverTola.yestardayBaseRatePerGram) * 100;

    res.json({
      success: true,

      source: "FENEGOSIDA",

      lastUpdated: silverTola.todayDate,

      silver: {
        tola: {
          today: silverTola.todayBaseRatePerGram,
          yesterday: silverTola.yestardayBaseRatePerGram,
        },

        gram10: {
          today: silverGram.todayBaseRatePerGram,
          yesterday: silverGram.yestardayBaseRatePerGram,
        },

        change,
        percentChange,
      },
    });
  } catch (error) {
    console.error("Silver API Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch silver prices",
    });
  }
});
router.get("/history", async (req, res) => {
  try {
    const response = await axios.get(
      "https://api.fenegosida.org/api/website/v1/Dashboard/WeeklyChartRate?weekmonthyear=7",
      {
        timeout: 10000,
      }
    );
    console.log(response.data);
    const history = response.data.silverData.map((item) => ({
      label: `${item.date} ${item.month}`,
      tola: item.tola,
      gram10: item.gm,
    }));

    res.json({
      success: true,
      history,
    });
  } catch (error) {
    console.error("Silver History Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch silver history",
    });
  }
});

module.exports = router;