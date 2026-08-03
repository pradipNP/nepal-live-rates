const express = require("express");
const axios = require("axios"); //(makes external HTTP requests). Axios automatically rejects HTTP errors, automatically parses JSON, and natively supports request interceptors, Fetch API requires manual response handling and JSON conversion but introduces zero bundle size overhead
const cors = require("cors");


const app = express();

const PORT = process.env.PORT || 5001;

app.use(cors());


// Home route
app.get("/", (req, res) => {
    res.send("Nepal Live Rate Backend is Running!");
});


// HELPER FUNCTION
// GET DATE IN YYYY-MM-DD FORMAT
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

// Forex API Route
app.get("/api/forex", async (req, res) => {
    try {

        // Today's date
        const today = new Date();

        // Calculate date 7 days ago
        const startDate = new Date();
        startDate.setDate(today.getDate() - 7);

        // Format dates
        const fromDate = formatDate(startDate);
        const toDate = formatDate(today);

        // Call Nepal Rastra Bank API
        const response = await axios.get(
            "https://www.nrb.org.np/api/forex/v1/rates",
            {
                params: {
                    page: 1,
                    per_page: 10,
                    from: fromDate,
                    to: toDate
                },
                
                timeout: 10000
            }
        );

        // Get NRB response
        const nrbData = response.data;

        // Validate NRB response structure
        if (
            !nrbData ||
            !nrbData.data ||
            !Array.isArray(nrbData.data.payload)
        ) {
            console.error("Unexpected response structure from NRB");

            return res.status(502).json({
                success: false,
                message: "Unable to retrieve valid forex data."
            });
        }

        // Get payload
        const payload = nrbData.data.payload;

        // Check if data exists
        if (payload.length === 0) {

            return res.status(404).json({
                success: false,
                message: "No forex data is currently available."
            });

        }

        // Find latest record
        const latestData = payload.reduce((latest, current) => {

            if (
                new Date(current.date) >
                new Date(latest.date)
            ) {
                return current;
            }

            return latest;

        });

        // Validate latest record
        if (
            !latestData ||
            !latestData.rates ||
            !Array.isArray(latestData.rates)
        ) {

            console.error(
                "Invalid forex rate structure received from NRB"
            );

            return res.status(502).json({
                success: false,
                message: "Forex data is temporarily unavailable."
            });

        }

        // Clean response
        res.status(200).json({

            success: true,

            source: "Nepal Rastra Bank",

            rateDate: latestData.date,

            publishedOn: latestData.published_on,

            modifiedOn: latestData.modified_on,

            rates: latestData.rates

        });

    } catch (error) {

        // Log detailed error only on backend
        console.error(
            "Forex API Error:",
            error.message
        );

        // Timeout
        if (error.code === "ECONNABORTED") {

            return res.status(504).json({
                success: false,
                message: "The rate service took too long to respond."
            });

        }

        // NRB returned HTTP error
        if (error.response) {

            console.error(
                "NRB HTTP Status:",
                error.response.status
            );

            return res.status(502).json({
                success: false,
                message: "The rate provider is temporarily unavailable."
            });

        }

        // Network / connection error
        if (error.request) {

            return res.status(503).json({
                success: false,
                message: "The rate service is temporarily unavailable."
            });

        }

        // Unknown server error
        return res.status(500).json({
            success: false,
            message: "Unable to fetch forex rates at this time."
        });

    }
});

app.get("/api/forex/history/:currency", async (req, res) => {
    try {
        const currencyCode = req.params.currency.toUpperCase();
        const today = new Date();
        const startDate = new Date();

        startDate.setDate(today.getDate() - 30);

        const fromDate = formatDate(startDate);
        const toDate = formatDate(today);

        const response = await axios.get("https://www.nrb.org.np/api/forex/v1/rates", {
            params: {
                page: 1,
                per_page: 50,
                from: fromDate,
                to: toDate
            },
            timeout: 10000
        });
        console.log(JSON.stringify(response.data, null, 2));
        const payload = response.data?.data?.payload;

        if (!Array.isArray(payload)) {
            console.log(JSON.stringify(response.data, null, 2));

            return res.status(500).json({
                success: false,
                message: "NRB returned invalid history data"
            });
        }

        const history = [];

        payload.forEach(day => {
            const currency = day.rates.find(rate => rate.currency.iso3 === currencyCode);
            if (currency) {
                history.push({
                    date: day.date,
                    buy: currency.buy,
                    sell: currency.sell,
                    unit: currency.currency.unit
                });
            }
        });

        res.json({
            success: true,
            currency: currencyCode,
            history
        });
    } catch (error) {
        console.error("History API Error:", error.message);
        res.status(500).json({
            success: false,
            message: "Unable to load historical data"
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(
        `Server running on port ${PORT}`
    );
});