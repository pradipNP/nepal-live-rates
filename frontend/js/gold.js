const GOLD_API_URL = "https://nepal-live-rates.onrender.com/api/gold";
const GOLD_HISTORY_API = "https://nepal-live-rates.onrender.com/api/gold/history";

let goldData = null;

function formatGoldLastUpdated(dateString) {
  const date = new Date(dateString);
  try {
    const bsDate = new NepaliDate.default(date);
    const nepaliDate = bsDate.format("MMMM DD, YYYY");
    const englishTime = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    return `${nepaliDate}, ${englishTime}`;
  } catch (error) {
    return date.toLocaleString();
  }
}

async function loadGoldRates() {
  try {
    const response = await fetch(GOLD_API_URL);

    if (!response.ok) {
      throw new Error(`Gold API Error ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      return;
    }

    goldData = data.gold;
    updateGoldCalculator();
    // Status Bar Date & Time
    const fullDateTime = formatGoldLastUpdated(data.lastUpdated);
    // Example:
    // Shrawan 19, 2083, 11:13:16 AM
    const parts = fullDateTime.split(",");
    // Rates Date
    document.getElementById("rateDate").textContent = `${parts[0]},${parts[1]}`;
    // Last Updated Time
    document.getElementById("lastUpdated").textContent =
      parts[2]?.trim() || fullDateTime;

    document.getElementById("fineGoldPrice").textContent =
      data.gold.tola.today.toLocaleString();

    document.getElementById("fineGoldYesterday").textContent =
      `Yesterday: NRS ${data.gold.tola.yesterday.toLocaleString()}`;

    document.getElementById("goldUpdated").textContent = formatGoldLastUpdated(
      data.lastUpdated,
    );

    const percent = data.gold.percentChange;
    const movement = document.getElementById("goldMovement");

    if (percent > 0) {
      movement.innerHTML = `▲ ${percent.toFixed(2)}%`;
      movement.style.color = "#22c55e";
    } else if (percent < 0) {
      movement.innerHTML = `▼ ${Math.abs(percent).toFixed(2)}%`;
      movement.style.color = "#ef4444";
    } else {
      movement.innerHTML = "▬ 0.00%";
    }

    showTolaPrices();
  } catch (error) {
    console.error("Gold Error:", error);
  }
}

function showTolaPrices() {
  if (!goldData) return;

  document.getElementById("goldTitle").textContent = "Fine Gold (9999)";

  document.getElementById("goldUnitLabel").textContent = "Per 1 Tola";

  document.getElementById("fineGoldPrice").textContent =
    goldData.tola.today.toLocaleString();

  document.getElementById("fineGoldYesterday").textContent =
    `Yesterday: Nrs. ${goldData.tola.yesterday.toLocaleString()}`;
}

function showGramPrices() {
  if (!goldData) return;

  document.getElementById("goldTitle").textContent = "Fine Gold (9999)";

  document.getElementById("goldUnitLabel").textContent = "Per 10 Gram";

  document.getElementById("fineGoldPrice").textContent =
    goldData.gram10.today.toLocaleString();

  document.getElementById("fineGoldYesterday").textContent =
    `Yesterday: Nrs. ${goldData.gram10.yesterday.toLocaleString()}`;
}

function initializeGoldPage() {
  const nepaliDate = document.getElementById("goldNepaliDate");

  const englishDate = document.getElementById("goldEnglishDate");

  if (englishDate) {
    englishDate.textContent = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  if (nepaliDate) {
    try {
      const bsDate = new NepaliDate.default();

      nepaliDate.textContent = bsDate.format("YYYY MMMM DD");
    } catch {
      nepaliDate.textContent = "Unavailable";
    }
  }

  loadGoldRates();
}

document.addEventListener("DOMContentLoaded", () => {
  initializeGoldPage();
  loadGoldChart();

  const tolaBtn = document.getElementById("tolaBtn");

  const gramBtn = document.getElementById("gramBtn");

  if (tolaBtn) {
    tolaBtn.addEventListener("click", () => {
      tolaBtn.classList.add("active");
      gramBtn.classList.remove("active");
      showTolaPrices();
    });
  }

  if (gramBtn) {
    gramBtn.addEventListener("click", () => {
      gramBtn.classList.add("active");
      tolaBtn.classList.remove("active");
      showGramPrices();
    });
  }
});

function updateGoldCalculator() {
  if (!goldData) return;

  const quantity =
    parseFloat(document.getElementById("goldQuantity").value) || 0;

  const unit = document.getElementById("goldCalculatorUnit").value;

  let pricePerUnit = 0;

  if (unit === "tola") {
    pricePerUnit = goldData.tola.today;
  } else if (unit === "gram") {
    pricePerUnit = goldData.gram10.today / 10;
  } else if (unit === "lal") {
    pricePerUnit = goldData.tola.today / 96;
  }

  const total = quantity * pricePerUnit;

  document.getElementById("goldCalculatorResult").textContent =
    `NPR ${total.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })}`;
}
document.addEventListener("input", (e) => {
  if (e.target.id === "goldQuantity" || e.target.id === "goldCalculatorUnit") {
    updateGoldCalculator();
  }
});

document.addEventListener("change", (e) => {
  if (e.target.id === "goldCalculatorUnit") {
    updateGoldCalculator();
  }
});

let goldChart = null;

async function loadGoldChart() {
  try {
    const response = await fetch(GOLD_HISTORY_API);

    const data = await response.json();

    if (!data.success) {
      return;
    }

    const labels = data.history.map((item) => item.label);

    const prices = data.history.map((item) => item.tola);

    const ctx = document
      .getElementById("goldChart")
      .getContext("2d");

    if (goldChart) {
      goldChart.destroy();
    }

    goldChart = new Chart(ctx, {
      type: "line",

      data: {
        labels,

        datasets: [
          {
            label: "Gold Price (Per Tola)",
            data: prices,
            tension: 0.35,
            fill: true,
            borderWidth: 3,
          },
        ],
      },

      options: {
        responsive: true,

        plugins: {
          legend: {
            display: true,
          },
        },

        scales: {
          y: {
            beginAtZero: false,
          },
        },
      },
    });
  } catch (error) {
    console.error("Gold Chart Error:", error);
  }
}

//  GLOBAL THEME MANAGEMENT
const themeToggle = document.getElementById("themeToggle");
// Apply theme variables
function applyTheme(isDark) {
  if (isDark) {
    // DARK THEME
    document.documentElement.style.setProperty("--bg", "#07111f");

    document.documentElement.style.setProperty(
      "--card",
      "rgba(15, 29, 48, 0.75)",
    );

    document.documentElement.style.setProperty("--text", "#f8fafc");

    document.documentElement.style.setProperty("--muted", "#94a3b8");

    document.documentElement.style.setProperty(
      "--hero-bg",
      "rgba(10, 24, 42, 0.75)",
    );

    document.documentElement.style.setProperty(
      "--status-bg",
      "rgba(10, 24, 42, 0.72)",
    );

    document.documentElement.style.setProperty(
      "--border",
      "rgba(255, 255, 255, 0.12)",
    );

    document.documentElement.style.setProperty(
      "--glass-highlight",
      "rgba(255, 255, 255, 0.08)",
    );

    document.documentElement.style.setProperty(
      "--shadow",
      "rgba(0, 0, 0, 0.35)",
    );
  } else {
    // LIGHT THEME
    document.documentElement.style.setProperty("--bg", "#f1f5f9");

    document.documentElement.style.setProperty(
      "--card",
      "rgba(255, 255, 255, 0.8)",
    );

    document.documentElement.style.setProperty("--text", "#0f172a");

    document.documentElement.style.setProperty("--muted", "#64748b");

    document.documentElement.style.setProperty(
      "--hero-bg",
      "rgba(255, 255, 255, 0.75)",
    );

    document.documentElement.style.setProperty(
      "--status-bg",
      "rgba(255, 255, 255, 0.72)",
    );

    document.documentElement.style.setProperty(
      "--border",
      "rgba(15, 23, 42, 0.12)",
    );

    document.documentElement.style.setProperty(
      "--glass-highlight",
      "rgba(255, 255, 255, 0.8)",
    );

    document.documentElement.style.setProperty(
      "--shadow",
      "rgba(15, 23, 42, 0.15)",
    );
  }
}

// LOAD SAVED THEME
// Get saved theme from browser
const savedTheme = localStorage.getItem("nepalLiveRatesTheme");

// Default theme is DARK
let isDark = savedTheme === "dark";

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
      localStorage.setItem("nepalLiveRatesTheme", "dark");
    } else {
      localStorage.setItem("nepalLiveRatesTheme", "light");
    }
  });
}

const refreshButton = document.getElementById("refreshButton");

if (refreshButton) {
  refreshButton.addEventListener("click", async () => {
    if (refreshButton.disabled) return;

    refreshButton.disabled = true;
    refreshButton.innerHTML = "⟳ Refreshing...";
    refreshButton.classList.add("refreshing");

    try {
      await loadGoldRates();
    } finally {
      refreshButton.disabled = false;
      refreshButton.innerHTML =
        '<span class="refresh-icon">↻</span>Refresh Rates';

      refreshButton.classList.remove("refreshing");
    }
  });
}

const forexCard = document.querySelector('[data-category="forex"]');

if (forexCard) {
  forexCard.addEventListener("click", () => {
    window.location.href = "index.html";
  });
}
