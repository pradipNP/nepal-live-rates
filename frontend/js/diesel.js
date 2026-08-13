const DIESEL_API_URL = "https://nepal-live-rates.onrender.com/api/diesel";
const DIESEL_HISTORY_API = "https://nepal-live-rates.onrender.com/api/diesel/history";

let dieselData = null;
let selectedArea = "Kathmandu";
let dieselChart = null;
let dieselChartData = null;

function formatDieselLastUpdated(dateString) {
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

function getCurrentPrice() {
  if (!dieselData?.diesel) return 0;

  return dieselData.diesel[selectedArea] || 0;
}

function getYesterdayPrice() {
  if (!dieselData?.yesterday) return getCurrentPrice();

  return dieselData.yesterday[selectedArea] ?? getCurrentPrice();
}

function getPercentChange() {
  if (!dieselData?.percentChange) return 0;

  return dieselData.percentChange[selectedArea] || 0;
}

function updateDieselDisplay() {
  if (!dieselData) return;

  const price = getCurrentPrice();
  const yesterday = getYesterdayPrice();
  const percent = getPercentChange();

  document.getElementById("dieselAreaLabel").textContent = selectedArea;
  document.getElementById("dieselPrice").textContent = price.toLocaleString();
  document.getElementById("dieselYesterday").textContent =
    `Yesterday NPR ${yesterday.toLocaleString()}`;

  const movement = document.getElementById("dieselMovement");
  movement.classList.remove("positive", "negative", "neutral");

  if (percent > 0) {
    movement.innerHTML = `▲ ${percent.toFixed(2)}%`;
    movement.classList.add("positive");
  } else if (percent < 0) {
    movement.innerHTML = `▼ ${Math.abs(percent).toFixed(2)}%`;
    movement.classList.add("negative");
  } else {
    movement.innerHTML = "▬ 0.00%";
    movement.classList.add("neutral");
  }

  updateDieselCalculator();
}

async function loadDieselRates() {
  try {
    const response = await fetch(DIESEL_API_URL);

    if (!response.ok) {
      throw new Error(`Diesel API Error ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      return;
    }

    dieselData = data;

    const fullDateTime = formatDieselLastUpdated(data.lastUpdated);
    const parts = fullDateTime.split(",");

    document.getElementById("rateDate").textContent = `${parts[0]},${parts[1]}`;
    document.getElementById("lastUpdated").textContent =
      parts[2]?.trim() || fullDateTime;

    document.getElementById("dieselUpdated").textContent = fullDateTime;

    updateDieselDisplay();
  } catch (error) {
    console.error("Diesel Error:", error);
  }
}

function initializeDieselPage() {
  loadDieselRates();
}

function updateDieselCalculator() {
  if (!dieselData) return;

  const quantity =
    parseFloat(document.getElementById("dieselQuantity").value) || 0;

  const unit = document.getElementById("dieselCalculatorUnit").value;
  const unitMultipliers = {
    litre: 1,
    "5litre": 5,
    "10litre": 10,
    "20litre": 20,
  };

  const multiplier = unitMultipliers[unit] || 1;
  const total = quantity * getCurrentPrice() * multiplier;

  document.getElementById("dieselCalculatorResult").textContent =
    `NPR ${total.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })}`;
}

async function loadDieselChart() {
  try {
    const response = await fetch(
      `${DIESEL_HISTORY_API}?area=${encodeURIComponent(selectedArea)}`,
    );

    const data = await response.json();

    if (!data.success) {
      return;
    }

    dieselChartData = data.history;
    renderDieselChart();
  } catch (error) {
    console.error("Diesel Chart Error:", error);
  }
}

function renderDieselChart() {
  if (!dieselChartData) return;

  const labels = dieselChartData.map((item) => item.label);
  const prices = dieselChartData.map((item) => item.price);
  const ctx = document.getElementById("dieselChart").getContext("2d");

  if (dieselChart) {
    dieselChart.destroy();
  }

  dieselChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: `Diesel Price (${selectedArea})`,
          data: prices,
          borderColor: "#2563eb",
          backgroundColor: "rgba(37, 99, 235, 0.2)",
          tension: 0.35,
          fill: true,
          borderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: "#3b82f6",
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
  initializeDieselPage();
  loadDieselChart();

  const areaSelect = document.getElementById("dieselAreaSelect");
  const chartAreaSelect = document.getElementById("dieselChartArea");

  function syncAreaDropdowns(area) {
    if (areaSelect) {
      areaSelect.value = area;
    }

    if (chartAreaSelect) {
      chartAreaSelect.value = area;
    }
  }

  if (areaSelect) {
    areaSelect.addEventListener("change", async function () {
      selectedArea = this.value;
      syncAreaDropdowns(selectedArea);
      updateDieselDisplay();
      await loadDieselChart();
    });
  }

  if (chartAreaSelect) {
    chartAreaSelect.addEventListener("change", async function () {
      selectedArea = this.value;
      syncAreaDropdowns(selectedArea);
      updateDieselDisplay();
      await loadDieselChart();
    });
  }
});

document.addEventListener("input", (e) => {
  if (
    e.target.id === "dieselQuantity" ||
    e.target.id === "dieselCalculatorUnit"
  ) {
    updateDieselCalculator();
  }
});

document.addEventListener("change", (e) => {
  if (e.target.id === "dieselCalculatorUnit") {
    updateDieselCalculator();
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
      await loadDieselRates();
      await loadDieselChart();
    } finally {
      refreshButton.disabled = false;
      refreshButton.innerHTML =
        '<span class="refresh-icon">↻</span>Refresh Rates';
      refreshButton.classList.remove("refreshing");
    }
  });
}
