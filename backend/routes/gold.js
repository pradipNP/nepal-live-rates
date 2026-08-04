const express = require("express");
const axios = require("axios");

const router = express.Router();

router.get("/", async (req, res) => {
    try {

        const response = await axios.get(
            "https://api.fenegosida.org/api/website/v1/Dashboard/today",
            {
                timeout: 10000
            }
        );

        const data = response.data;

        const goldTola = data.find(
            item => item.rateType.includes("छापावाल सुन") &&
                    item.rateType.includes("१ तोला")
        );

        const goldGram = data.find(
            item => item.rateType.includes("छापावाल सुन") &&
                    item.rateType.includes("१० ग्राम")
        );

        if (!goldTola || !goldGram) {
            return res.status(404).json({
                success: false,
                message: "Gold data not found"
            });
        }

        const change =
            goldTola.todayBaseRatePerGram -
            goldTola.yestardayBaseRatePerGram;

        const percentChange =
            (
                change /
                goldTola.yestardayBaseRatePerGram
            ) * 100;

        res.json({
            success: true,

            source: "FENEGOSIDA",

            lastUpdated: goldTola.todayDate,

            gold: {
                tola: {
                    today: goldTola.todayBaseRatePerGram,
                    yesterday: goldTola.yestardayBaseRatePerGram
                },

                gram10: {
                    today: goldGram.todayBaseRatePerGram,
                    yesterday: goldGram.yestardayBaseRatePerGram
                },

                change,
                percentChange
            }
        });

    } catch (error) {

        console.error(
            "Gold API Error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Unable to fetch gold prices"
        });
    }
});

module.exports = router;