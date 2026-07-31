//Backend API url
const API_URL = "http://nepal-live-rates.onrender.com/api/forex";

//Country Flags
const countryFlags = {
  INR: "assets/flags/in.svg",
  USD: "assets/flags/us.svg",
  EUR: "assets/flags/eu.svg",
  GBP: "assets/flags/gb.svg",
  CHF: "assets/flags/ch.svg",
  AUD: "assets/flags/au.svg",
  CAD: "assets/flags/ca.svg",
  SGD: "assets/flags/sg.svg",

  JPY: "assets/flags/jp.svg",
  CNY: "assets/flags/cn.svg",
  AED: "assets/flags/ae.svg",
  SAR: "assets/flags/sa.svg",
  QAR: "assets/flags/qa.svg",
  THB: "assets/flags/th.svg",
  MYR: "assets/flags/my.svg",
  KRW: "assets/flags/kr.svg",
  BHD: "assets/flags/bh.svg",
  HKD: "assets/flags/hk.svg",
  KWD: "assets/flags/kw.svg",
  OMR: "assets/flags/om.svg",
  DKK: "assets/flags/dk.svg",
  SEK: "assets/flags/se.svg",
  NOK: "assets/flags/no.svg",
};

// Currency symbol
const currencySymbols = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  CHF: "Fr",
  AUD: "$",
  CAD: "$",
  SGD: "$",
  JPY: "¥",
  CNY: "¥",
  AED: "د.إ",
  SAR: "﷼",
  QAR: "﷼",
  THB: "฿",
  MYR: "RM",
  KRW: "₩",
  BHD: ".د.ب",
  HKD: "HK$",
  KWD: "د.ك",
  OMR: "﷼",
  DKK: "kr",
  SEK: "kr",
  NOK: "kr",
};

// CARD-SPECIFIC ACCENT COLORS
const currencyColors = {
  INR: "#22c55e",
  USD: "#3b82f6",
  EUR: "#a855f7",
  GBP: "#f59e0b",
  CHF: "#06b6d4",
  AUD: "#f97316",
  CAD: "#22c55e",
  SGD: "#06b6d4",
  JPY: "#e94f12",
  CNY: "#ef4444",
  AED: "#14b8a6",
  SAR: "#84cc16",
  QAR: "#8b5cf6",
  THB: "#eab308",
  MYR: "#10b981",
  KRW: "#ec4899",
  BHD: "#f97316",
  KWD: "#6366f1",
  OMR: "#14b8a6",
  DKK: "#ef4444",
  SEK: "#3b82f6",
  NOK: "#f97316",
};

// Get HTML Elements
const refreshButton = document.getElementById("refreshButton");
const ratesContainer = document.getElementById("ratesContainer");
const loading = document.getElementById("loading");
const errorElement = document.getElementById("error");
const searchInput = document.getElementById("searchInput");

const lastUpdated = document.getElementById("lastUpdated");
const rateDateElement = document.getElementById("rateDate");

const retryButton = document.getElementById("retryButton");
const errorMessage = document.getElementById("errorMessage");

function showError(message) {
    errorMessage.textContent =
        message || "We couldn't retrieve the latest exchange rates.";
    errorElement.hidden = false;
}

function hideError() {
    errorElement.hidden = true;
}

// REFRESH BUTTON
refreshButton.addEventListener("click", async function () {
  // Prevent multiple clicks
  if (refreshButton.disabled) {
    return;
  }

  // Disable button
  refreshButton.disabled = true;

  // Change button text
  refreshButton.innerHTML = "⟳ Refreshing...";

  // Add spinning class
  refreshButton.classList.add("refreshing");

  try {
    // Fetch fresh data
    await getForexRates();
  } finally {
    // Restore button
    refreshButton.disabled = false;
    refreshButton.innerHTML = "↻ Refresh Rates";
    refreshButton.classList.remove("refreshing");
  }
});

// Store All Rates
let allRates = [];

function formatPublishedDate(dateString) {
  const date = new Date(dateString.replace(" ", "T"));

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatRateDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Fetch Forex Data
async function getForexRates() {
    // Hide previous error
    hideError();

    // START LOADING STATE
    loading.style.display = "block";
    try {
        console.log("Fetching forex rates...");
        // FETCH DATA FROM BACKEND
        const response = await fetch(API_URL);

        console.log(
            "Backend response status:",
            response.status
        );

        // CHECK HTTP STATUS
        if (!response.ok) {

            let message = "Unable to load live rates.";
            if (response.status === 404) {
                message = "No forex rates are currently available.";
            } else if (response.status === 502) {
                message = "The rate provider is temporarily unavailable.";
            } else if (response.status === 503) {
                message = "The rate service is currently unreachable. Please try again later.";
            } else if (response.status === 504) {
                message = "The rate service took too long to respond.";
            }
            throw new Error(message);
        }

        // CONVERT RESPONSE TO JSON
        const data = await response.json();
        console.log("Backend data:", data);

        // VALIDATE BACKEND RESPONSE
        if (
            !data ||
            data.success !== true ||
            !Array.isArray(data.rates) ||
            data.rates.length === 0
        ) {
            throw new Error(
                "No valid forex rates are currently available."
            );
        }

        // SUCCESS
        // Store rates
        allRates = data.rates;

        // UPDATE RATE DATE
        if (data.rateDate) {
            rateDateElement.textContent = formatRateDate(data.rateDate);

        }

        // UPDATE LAST UPDATED
        if (data.publishedOn) { 
          lastUpdated.textContent = formatPublishedDate(data.publishedOn);
        }

        // DISPLAY 22 CURRENCY CARDS
        displayRates(allRates);

        // SUCCESS STATE
        // Hide error after successful fetch
        hideError();

        console.log(
            "Forex rates loaded successfully."
        );

    } catch (error) {
        console.error("Forex request failed:", error);

        // Remove old cards
        ratesContainer.innerHTML = "";

        // Clear stored rates
        allRates = [];

        // Show error message
        showError(
            error.message ||
            "Unable to load live rates. Please try again later."
        );

    } finally {
        // STOP LOADING
        loading.style.display = "none";
    }
}

// RETRY BUTTON
retryButton.addEventListener(
    "click",
    async function () {
        // Prevent multiple clicks
        if (retryButton.disabled) {
            return;
        }

        // Disable retry button
        retryButton.disabled = true;

        // Change button text
        retryButton.textContent =
            "Retrying...";

        try {
            // Run the same API function
            // used by Refresh Rates
            await getForexRates();

        } finally {
            // Restore button
            retryButton.disabled = false;

            retryButton.textContent =
                "Try Again";
        }
    }
);

// DISPLAY FOREX CARDS
function displayRates(rates) {
  // Clear old cards
  ratesContainer.innerHTML = "";

  // Check if no results
  if (rates.length === 0) {
    ratesContainer.innerHTML = `
            <p>
                No currencies found.
            </p>
        `;
    return;
  }

  // Create card for every currency
  rates.forEach((rate) => {
    // Currency information
    const currency = rate.currency;
    const iso3 = currency.iso3;
    const name = currency.name;
    const unit = currency.unit;
    const buy = rate.buy;
    const sell = rate.sell;

    // Get flag
    const flag = countryFlags[iso3] || "assets/flags/default.svg";
    const symbol = currencySymbols[iso3] || "¤";
    const accentColor = currencyColors[iso3] || "#3b82f6";
    // Create card
    const card = document.createElement("div");
    card.className = "rate-card";

    // store currency color
    card.style.setProperty("--accent", accentColor);

    // Add card HTML
    card.innerHTML = `
        <!-- Large Background Currency Symbol -->
        <div class="currency-symbol">
            ${symbol}
        </div>

        <!-- Currency Header -->
        <div class="currency-header">
            <div class="currency-main">
                <!-- Country Flag -->
                <div class="currency-flag">
                    <img
                        src="${flag}"
                        alt="${iso3} flag"
                    >
                </div>

                <!-- Currency Information -->
                <div class="currency-info">
                    <div class="currency-code">
                        ${iso3}
                    </div>

                    <div class="currency-name">
                        ${name}
                    </div>
                </div>
            </div>
        </div>

        <!-- Unit Badge -->
        <div class="unit-badge">
            <span class="unit-icon">
                ↝
            </span>
            Unit: ${unit}
        </div>

        <!-- Divider -->
        <div class="rate-divider"></div>

        <!-- Buying Rate -->
        <div class="rate-row">
            <div class="rate-label">
                <span class="buy-icon">
                    ↗
                </span>
                <span>
                    Buying Rate
                </span>
            </div>
            <span class="rate-value buy">
                NPR ${buy}
            </span>
        </div>

        <!-- Selling Rate -->
        <div class="rate-row">
            <div class="rate-label">
                <span class="sell-icon">
                    🏷
                </span>
                <span>
                    Selling Rate
                </span>
            </div>

            <span class="rate-value sell">
                NPR ${sell}
            </span>
        </div>
    `;
    // Add card to page
    ratesContainer.appendChild(card);
  });
}

// SEARCH FUNCTION
searchInput.addEventListener("input", function () {
  // Get search text
  const searchTerm = this.value.toLowerCase().trim();

  // Filter rates
  const filteredRates = allRates.filter((rate) => {
    const currency = rate.currency;
    const iso3 = currency.iso3.toLowerCase();
    const name = currency.name.toLowerCase();
    return iso3.includes(searchTerm) || name.includes(searchTerm);
  });

  // Display filtered cards
  displayRates(filteredRates);
});

// GLOBAL THEME MANAGEMENT
const themeToggle = document.getElementById("themeToggle");
// Apply theme variables
function applyTheme(isDark) {
  if (isDark) {
    // DARK THEME
    document.documentElement.style.setProperty(
      "--bg",
      "#07111f"
    );

    document.documentElement.style.setProperty(
      "--card",
      "rgba(15, 29, 48, 0.75)"
    );

    document.documentElement.style.setProperty(
      "--text",
      "#f8fafc"
    );

    document.documentElement.style.setProperty(
      "--muted",
      "#94a3b8"
    );

    document.documentElement.style.setProperty(
      "--hero-bg",
      "rgba(10, 24, 42, 0.75)"
    );

    document.documentElement.style.setProperty(
      "--status-bg",
      "rgba(10, 24, 42, 0.72)"
    );

    document.documentElement.style.setProperty(
      "--border",
      "rgba(255, 255, 255, 0.12)"
    );

    document.documentElement.style.setProperty(
      "--glass-highlight",
      "rgba(255, 255, 255, 0.08)"
    );

    document.documentElement.style.setProperty(
      "--shadow",
      "rgba(0, 0, 0, 0.35)"
    );

  } else {
    // LIGHT THEME
    document.documentElement.style.setProperty(
      "--bg",
      "#f1f5f9"
    );

    document.documentElement.style.setProperty(
      "--card",
      "rgba(255, 255, 255, 0.8)"
    );

    document.documentElement.style.setProperty(
      "--text",
      "#0f172a"
    );

    document.documentElement.style.setProperty(
      "--muted",
      "#64748b"
    );

    document.documentElement.style.setProperty(
      "--hero-bg",
      "rgba(255, 255, 255, 0.75)"
    );

    document.documentElement.style.setProperty(
      "--status-bg",
      "rgba(255, 255, 255, 0.72)"
    );

    document.documentElement.style.setProperty(
      "--border",
      "rgba(15, 23, 42, 0.12)"
    );

    document.documentElement.style.setProperty(
      "--glass-highlight",
      "rgba(255, 255, 255, 0.8)"
    );

    document.documentElement.style.setProperty(
      "--shadow",
      "rgba(15, 23, 42, 0.15)"
    );
  }
}

// LOAD SAVED THEME
// Get saved theme from browser
const savedTheme = localStorage.getItem("nepalLiveRatesTheme");

// Default theme is DARK
let isDark = savedTheme !== "light";

// Apply saved theme immediately
applyTheme(isDark);

// Update toggle position
if (themeToggle) {
  themeToggle.checked = !isDark;
}

// THEME TOGGLE EVENT
if (themeToggle) {
  themeToggle.addEventListener("change", function () {
    // Checked = Light Mode
    isDark = !this.checked;

    // Apply theme
    applyTheme(isDark);

    // Save theme preference
    if (isDark) {
      localStorage.setItem(
        "nepalLiveRatesTheme",
        "dark"
      );
    } else {
      localStorage.setItem(
        "nepalLiveRatesTheme",
        "light"
      );
    }
  });
}

// ACTIVE CARD NAVIGATION
document.querySelectorAll(".active-card").forEach(card => {
  card.addEventListener("click", () => {
    const category = card.dataset.category;
    if (category == "forex") {
      document.getElementById("forexSection").scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  });
});

// COMING SOON MODAL
const modal = document.getElementById("comingSoonModal");
const modalMessage = document.getElementById("modalMessage");
const closeModal = document.getElementById("closeModal");
const modalOkay = document.getElementById("modalOkay");

// Category names
const categoryNames = {
  gold: "Gold",
  silver: "Silver",
  petrol: "Petrol",
  diesel: "Diesel",
  oil: "Crude Oil",
};

// COMING SOON CARD CLICK
document.querySelectorAll(".coming-card").forEach((card) => {
  card.addEventListener("click", function () {
    // Get category
    const category = this.dataset.category;

    // Get readable name
    const categoryName = categoryNames[category];

    // Update modal
    modalMessage.textContent = `The ${categoryName}
                         rates section is
                         currently under development.
                         We are working on integrating
                         a reliable public data source.`;

    // Show modal
    modal.classList.add("active");
  });
});

// CLOSE MODAL
closeModal.addEventListener("click", function () {
  modal.classList.remove("active");
});

modalOkay.addEventListener("click", function () {
  modal.classList.remove("active");
});

// CLOSE MODAL WHEN CLICKING OUTSIDE
modal.addEventListener("click", function (event) {
  if (event.target === modal) {
    modal.classList.remove("active");
  }
});

document.getElementById("year").textContent = new Date().getFullYear();

// START APPLICATION
getForexRates();
