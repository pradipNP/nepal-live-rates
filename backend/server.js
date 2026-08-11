const express = require("express");
// const axios = require("axios"); //(makes external HTTP requests). Axios automatically rejects HTTP errors, automatically parses JSON, and natively supports request interceptors, Fetch API requires manual response handling and JSON conversion but introduces zero bundle size overhead
const cors = require("cors");

const forexRoutes = require("./routes/forex");
const goldRoutes = require("./routes/gold");
const silverRoutes = require("./routes/silver");
const petrolRoutes = require("./routes/petrol");

const app = express();

const PORT = process.env.PORT || 5001;

app.use(cors());
app.use("/api/forex", forexRoutes);
app.use("/api/gold", goldRoutes);
app.use("/api/silver", silverRoutes);
app.use("/api/petrol", petrolRoutes);

// Home route
app.get("/", (req, res) => {
    res.send("Nepal Live Rate Backend is Running!");
});

// Start server
app.listen(PORT, () => {
    console.log(
        `Server running on port ${PORT}`
    );
});