const SILVER_API_URL = "https://nepal-live-rates.onrender.com/api/silver";
const SILVER_HISTORY_API = "https://nepal-live-rates.onrender.com/api/silver/history";

let silverData = null;

function formatSilverLastUpdated(dateString) {
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

async function loadSilverRates() {
  try {
    const response = await fetch(SILVER_API_URL);

    if (!response.ok) {
      throw new Error(`Silver API Error ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      return;
    }

    silverData = data.silver;
    updateSilverCalculator();
    // Status Bar Date & Time
    const fullDateTime = formatSilverLastUpdated(data.lastUpdated);
    // Example:
    // Shrawan 19, 2083, 11:13:16 AM
    const parts = fullDateTime.split(",");
    // Rates Date
    document.getElementById("rateDate").textContent = `${parts[0]},${parts[1]}`;
    // Last Updated Time
    document.getElementById("lastUpdated").textContent =
      parts[2]?.trim() || fullDateTime;

    document.getElementById("silverPrice").textContent =
      data.silver.tola.today.toLocaleString();

    document.getElementById("silverYesterday").textContent =
      `Yesterday: NRS ${data.silver.tola.yesterday.toLocaleString()}`;

    document.getElementById("silverUpdated").textContent =
      formatSilverLastUpdated(data.lastUpdated);

    const percent = data.silver.percentChange;
    const movement = document.getElementById("silverMovement");

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
    console.error("Silver Error:", error);
  }
}

function showTolaPrices() {
  if (!silverData) return;

  document.getElementById("silverTitle").textContent = "Pure Silver";

  document.getElementById("silverUnitLabel").textContent = "Per 1 Tola";

  document.getElementById("silverPrice").textContent =
    silverData.tola.today.toLocaleString();

  document.getElementById("silverYesterday").textContent =
    `Yesterday: Nrs. ${silverData.tola.yesterday.toLocaleString()}`;
}

function showGramPrices() {
  if (!silverData) return;

  document.getElementById("silverTitle").textContent = "Pure Silver";

  document.getElementById("silverUnitLabel").textContent = "Per 10 Gram";

  document.getElementById("silverPrice").textContent =
    silverData.gram10.today.toLocaleString();

  document.getElementById("silverYesterday").textContent =
    `Yesterday: Nrs. ${silverData.gram10.yesterday.toLocaleString()}`;
}

function initializeSilverPage() {
  const nepaliDate = document.getElementById("silverNepaliDate");

  const englishDate = document.getElementById("silverEnglishDate");

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

  loadSilverRates();
}

document.addEventListener("DOMContentLoaded", () => {
  initializeSilverPage();
  loadSilverChart();
  updateUnitConverter();

  document
    .getElementById("silverConverterValue")
    ?.addEventListener("input", updateUnitConverter);

  document
    .getElementById("silverConverterFrom")
    ?.addEventListener("change", updateUnitConverter);

  document
    .getElementById("silverConverterTo")
    ?.addEventListener("change", updateUnitConverter);
  const silverChartUnit = document.getElementById("silverChartUnit");

  if (silverChartUnit) {
    silverChartUnit.addEventListener("change", function () {
      renderSilverChart(this.value);
    });
  }

  const tolaBtn = document.getElementById("silverTolaBtn");

  const gramBtn = document.getElementById("silverGramBtn");

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

function updateSilverCalculator() {
  if (!silverData) return;

  const quantity =
    parseFloat(document.getElementById("silverQuantity").value) || 0;

  const unit = document.getElementById("silverCalculatorUnit").value;

  let pricePerUnit = 0;

  if (unit === "tola") {
    pricePerUnit = silverData.tola.today;
  } else if (unit === "gram") {
    pricePerUnit = silverData.gram10.today / 10;
  } else if (unit === "lal") {
    pricePerUnit = silverData.tola.today / 96;
  }

  const total = quantity * pricePerUnit;

  document.getElementById("silverCalculatorResult").textContent =
    `Nrs. ${total.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })}`;
}

document.addEventListener("input", (e) => {
  if (
    e.target.id === "silverQuantity" ||
    e.target.id === "silverCalculatorUnit"
  ) {
    updateSilverCalculator();
  }
});

document.addEventListener("change", (e) => {
  if (e.target.id === "silverCalculatorUnit") {
    updateSilverCalculator();
  }
});

let silverChart = null;
let silverChartData = null;

async function loadSilverChart() {
  try {
    const response = await fetch(SILVER_HISTORY_API);

    const data = await response.json();

    if (!data.success) {
      return;
    }

    silverChartData = data.history;

    renderSilverChart("tola");
  } catch (error) {
    console.error("Silver Chart Error:", error);
  }
}

function renderSilverChart(unit) {
  if (!silverChartData) return;

  const labels = silverChartData.map((item) => item.label);

  const prices = silverChartData.map((item) =>
    unit === "tola" ? item.tola : item.gram10,
  );

  const ctx = document.getElementById("silverChart").getContext("2d");

  if (silverChart) {
    silverChart.destroy();
  }

  silverChart = new Chart(ctx, {
    type: "line",

    data: {
      labels,

      datasets: [
        {
          label:
            unit === "tola"
              ? "Silver Price (1 Tola)"
              : "Silver Price (10 Gram)",

          data: prices,
          borderColor: "#94a3b8",
          backgroundColor: "rgba(148,163,184,0.2)",
          tension: 0.35,

          fill: true,

          borderWidth: 3,
          pointRadius: 6,

          pointHoverRadius: 8,

          pointBackgroundColor: "#cbd5e1",

          pointBorderWidth: 0,
        },
      ],
    },

    options: {
      responsive: true,

      maintainAspectRatio: true,

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
      await loadSilverRates();
    } finally {
      refreshButton.disabled = false;
      refreshButton.innerHTML =
        '<span class="refresh-icon">↻</span>Refresh Rates';

      refreshButton.classList.remove("refreshing");
    }
  });
}

// Card switching logic
const forexCard = document.querySelector('[data-category="forex"]');

if (forexCard) {
  forexCard.addEventListener("click", () => {
    window.location.href = "index.html";
  });
}
const goldCard =
  document.querySelector('[data-category="gold"]');

if (goldCard) {
  goldCard.addEventListener("click", () => {
    window.location.href = "gold.html";
  });
}
const silverCard = document.querySelector('[data-category="silver"]');

if (silverCard) {
  silverCard.addEventListener("click", () => {
    window.location.href = "silver.html";
  });
}

const CONVERSION_TO_GRAMS = {
  tola: 11.6638,
  gram: 1,
  aana: 0.7289875, // 11.6638 / 16
  lal: 0.116638,
};

function updateUnitConverter() {
  const value =
    parseFloat(document.getElementById("silverConverterValue").value) || 0;

  const from = document.getElementById("silverConverterFrom").value;

  const to = document.getElementById("silverConverterTo").value;

  // convert to grams first
  const grams = value * CONVERSION_TO_GRAMS[from];

  // grams to target unit
  const result = grams / CONVERSION_TO_GRAMS[to];

  document.getElementById("silverConverterResult").innerHTML = `
    <span class="silver-converter-number">${result.toFixed(4)}</span>
    <span class="silver-converter-unit">${to.charAt(0).toUpperCase() + to.slice(1)}</span>`;
}
