const CRUDE_API_URL = "https://nepal-live-rates.onrender.com/api/crude";
const CRUDE_HISTORY_API = "https://nepal-live-rates.onrender.com/api/crude/history";

const MARKET_LABELS = {
  WTI: "WTI Crude Oil",
  Brent: "Brent Crude Oil",
};

let crudeData = null;
let selectedMarket = "WTI";
let crudeChart = null;
let crudeChartData = null;

function formatCrudeLastUpdated(dateString) {
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

function getCurrentMarketData() {
  if (!crudeData?.crude) return null;

  return crudeData.crude[selectedMarket] || null;
}

function updateCrudeDisplay() {
  const marketData = getCurrentMarketData();

  if (!marketData) return;

  document.getElementById("crudeMarketLabel").textContent =
    MARKET_LABELS[selectedMarket];
  document.getElementById("crudePrice").textContent =
    marketData.price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  document.getElementById("crudeYesterday").textContent =
    `Yesterday USD ${marketData.yesterday.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const movement = document.getElementById("crudeMovement");
  movement.classList.remove("positive", "negative", "neutral");

  if (marketData.percentChange > 0) {
    movement.innerHTML = `▲ ${marketData.percentChange.toFixed(2)}%`;
    movement.classList.add("positive");
  } else if (marketData.percentChange < 0) {
    movement.innerHTML = `▼ ${Math.abs(marketData.percentChange).toFixed(2)}%`;
    movement.classList.add("negative");
  } else {
    movement.innerHTML = "▬ 0.00%";
    movement.classList.add("neutral");
  }

  updateCrudeCalculator();
  renderCrudeChart();
}

async function loadCrudeRates() {
  try {
    const response = await fetch(CRUDE_API_URL);

    if (!response.ok) {
      throw new Error(`Crude API Error ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      return;
    }

    crudeData = data;

    const fullDateTime = formatCrudeLastUpdated(data.lastUpdated);
    const parts = fullDateTime.split(",");

    document.getElementById("rateDate").textContent = `${parts[0]},${parts[1]}`;
    document.getElementById("lastUpdated").textContent =
      parts[2]?.trim() || fullDateTime;

    document.getElementById("crudeUpdated").textContent = fullDateTime;

    updateCrudeDisplay();
  } catch (error) {
    console.error("Crude Error:", error);
  }
}

function initializeCrudePage() {
  loadCrudeRates();
}

function updateCrudeCalculator() {
  const marketData = getCurrentMarketData();

  if (!marketData) return;

  const quantity =
    parseFloat(document.getElementById("crudeQuantity").value) || 0;

  const unit = document.getElementById("crudeCalculatorUnit").value;
  const unitMultipliers = {
    barrel: 1,
    "5barrel": 5,
    "10barrel": 10,
    "50barrel": 50,
  };

  const multiplier = unitMultipliers[unit] || 1;
  const total = quantity * marketData.price * multiplier;

  document.getElementById("crudeCalculatorResult").textContent =
    `USD ${total.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
}

async function loadCrudeChart() {
  try {
    const response = await fetch(CRUDE_HISTORY_API);
    const data = await response.json();

    if (!data.success) {
      return;
    }

    crudeChartData = data.history;
    renderCrudeChart();
  } catch (error) {
    console.error("Crude Chart Error:", error);
  }
}

function renderCrudeChart() {
  if (!crudeChartData?.[selectedMarket]) return;

  const history = crudeChartData[selectedMarket];
  const labels = history.map((item) => item.label);
  const prices = history.map((item) => item.price);
  const ctx = document.getElementById("crudeChart").getContext("2d");

  if (crudeChart) {
    crudeChart.destroy();
  }

  crudeChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: `${MARKET_LABELS[selectedMarket]} (USD/Barrel)`,
          data: prices,
          borderColor: "#374151",
          backgroundColor: "rgba(55, 65, 81, 0.2)",
          tension: 0.35,
          fill: true,
          borderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: "#6b7280",
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

document.addEventListener("DOMContentLoaded", () => {
  initializeCrudePage();
  loadCrudeChart();

  const marketSelect = document.getElementById("crudeMarketSelect");
  const chartMarketSelect = document.getElementById("crudeChartMarket");

  function syncMarketDropdowns(market) {
    if (marketSelect) {
      marketSelect.value = market;
    }

    if (chartMarketSelect) {
      chartMarketSelect.value = market;
    }
  }

  if (marketSelect) {
    marketSelect.addEventListener("change", function () {
      selectedMarket = this.value;
      syncMarketDropdowns(selectedMarket);
      updateCrudeDisplay();
    });
  }

  if (chartMarketSelect) {
    chartMarketSelect.addEventListener("change", function () {
      selectedMarket = this.value;
      syncMarketDropdowns(selectedMarket);
      updateCrudeDisplay();
    });
  }
});

document.addEventListener("input", (e) => {
  if (
    e.target.id === "crudeQuantity" ||
    e.target.id === "crudeCalculatorUnit"
  ) {
    updateCrudeCalculator();
  }
});

document.addEventListener("change", (e) => {
  if (e.target.id === "crudeCalculatorUnit") {
    updateCrudeCalculator();
  }
});

const themeToggle = document.getElementById("themeToggle");

function applyTheme(isDark) {
  if (isDark) {
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

const savedTheme = localStorage.getItem("nepalLiveRatesTheme");
let isDark = savedTheme === "dark";

applyTheme(isDark);

if (themeToggle) {
  themeToggle.checked = !isDark;
}

if (themeToggle) {
  themeToggle.addEventListener("change", function () {
    isDark = !this.checked;
    applyTheme(isDark);

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
      await loadCrudeRates();
      await loadCrudeChart();
    } finally {
      refreshButton.disabled = false;
      refreshButton.innerHTML =
        '<span class="refresh-icon">↻</span>Refresh Rates';
      refreshButton.classList.remove("refreshing");
    }
  });
}
