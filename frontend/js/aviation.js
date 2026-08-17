const AVIATION_API_URL = "https://nepal-live-rates.onrender.com/api/aviation";
const AVIATION_HISTORY_API =
  "https://nepal-live-rates.onrender.com/api/aviation/history";

const FUEL_LABELS = {
  JetA1: "Jet A-1 (Domestic)",
  DutyFree: "Aviation Fuel (Duty Free)",
};

const JET_UNIT_OPTIONS = [
  { value: "litre", label: "Litre" },
  { value: "5litre", label: "5 Litre" },
  { value: "10litre", label: "10 Litre" },
  { value: "20litre", label: "20 Litre" },
];

const DUTY_FREE_UNIT_OPTIONS = [
  { value: "kilolitre", label: "Kilolitre" },
  { value: "5kilolitre", label: "5 Kilolitre" },
  { value: "10kilolitre", label: "10 Kilolitre" },
  { value: "20kilolitre", label: "20 Kilolitre" },
];

let aviationData = null;
let selectedFuelType = "JetA1";
let selectedArea = "Kathmandu";
let aviationChart = null;

function formatAviationLastUpdated(dateString) {
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
  if (!aviationData?.aviation?.[selectedFuelType]) return 0;

  return aviationData.aviation[selectedFuelType][selectedArea] || 0;
}

function getYesterdayPrice() {
  if (!aviationData?.yesterday?.[selectedFuelType]) return getCurrentPrice();

  return (
    aviationData.yesterday[selectedFuelType][selectedArea] ?? getCurrentPrice()
  );
}

function getPercentChange() {
  if (!aviationData?.percentChange?.[selectedFuelType]) return 0;

  return aviationData.percentChange[selectedFuelType][selectedArea] || 0;
}

function getCurrencyLabel() {
  return selectedFuelType === "JetA1" ? "NPR" : "USD";
}

function getUnitLabel() {
  return selectedFuelType === "JetA1" ? "/Litre" : "/Kilolitre";
}

function updateCalculatorUnitOptions() {
  const unitSelect = document.getElementById("aviationCalculatorUnit");
  const options =
    selectedFuelType === "JetA1" ? JET_UNIT_OPTIONS : DUTY_FREE_UNIT_OPTIONS;

  unitSelect.innerHTML = options
    .map(
      (option) =>
        `<option value="${option.value}">${option.label}</option>`,
    )
    .join("");
}

function updateAviationDisplay() {
  if (!aviationData) return;

  const price = getCurrentPrice();
  const yesterday = getYesterdayPrice();
  const percent = getPercentChange();
  const currency = getCurrencyLabel();

  document.getElementById("aviationFuelLabel").textContent =
    FUEL_LABELS[selectedFuelType];
  document.getElementById("aviationAreaLabel").textContent = selectedArea;
  document.getElementById("aviationCurrency").textContent = currency;
  document.getElementById("aviationPerUnit").textContent = getUnitLabel();
  document.getElementById("aviationPrice").textContent =
    price.toLocaleString(undefined, {
      minimumFractionDigits: selectedFuelType === "DutyFree" ? 2 : 0,
      maximumFractionDigits: 2,
    });
  document.getElementById("aviationYesterday").textContent =
    `Yesterday ${currency} ${yesterday.toLocaleString(undefined, {
      minimumFractionDigits: selectedFuelType === "DutyFree" ? 2 : 0,
      maximumFractionDigits: 2,
    })}`;

  const movement = document.getElementById("aviationMovement");
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

  updateCalculatorUnitOptions();
  updateAviationCalculator();
}

async function loadAviationRates() {
  try {
    const response = await fetch(AVIATION_API_URL);

    if (!response.ok) {
      throw new Error(`Aviation API Error ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      return;
    }

    aviationData = data;

    const fullDateTime = formatAviationLastUpdated(data.lastUpdated);
    const parts = fullDateTime.split(",");

    document.getElementById("rateDate").textContent = `${parts[0]},${parts[1]}`;
    document.getElementById("lastUpdated").textContent =
      parts[2]?.trim() || fullDateTime;

    document.getElementById("aviationUpdated").textContent = fullDateTime;

    updateAviationDisplay();
  } catch (error) {
    console.error("Aviation Error:", error);
  }
}

function initializeAviationPage() {
  loadAviationRates();
}

function updateAviationCalculator() {
  if (!aviationData) return;

  const quantity =
    parseFloat(document.getElementById("aviationQuantity").value) || 0;

  const unit = document.getElementById("aviationCalculatorUnit").value;
  const jetMultipliers = {
    litre: 1,
    "5litre": 5,
    "10litre": 10,
    "20litre": 20,
  };
  const dutyFreeMultipliers = {
    kilolitre: 1,
    "5kilolitre": 5,
    "10kilolitre": 10,
    "20kilolitre": 20,
  };

  const multipliers =
    selectedFuelType === "JetA1" ? jetMultipliers : dutyFreeMultipliers;
  const multiplier = multipliers[unit] || 1;
  const total = quantity * getCurrentPrice() * multiplier;
  const currency = getCurrencyLabel();

  document.getElementById("aviationCalculatorResult").textContent =
    `${currency} ${total.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
}

async function loadAviationChart() {
  try {
    const response = await fetch(
      `${AVIATION_HISTORY_API}?area=${encodeURIComponent(selectedArea)}&type=${encodeURIComponent(selectedFuelType)}`,
    );

    const data = await response.json();

    if (!data.success) {
      return;
    }

    renderAviationChart(data.history);
  } catch (error) {
    console.error("Aviation Chart Error:", error);
  }
}

function renderAviationChart(history) {
  if (!history) return;

  const labels = history.map((item) => item.label);
  const prices = history.map((item) => item.price);
  const ctx = document.getElementById("aviationChart").getContext("2d");
  const currency = getCurrencyLabel();
  const unit = selectedFuelType === "JetA1" ? "Litre" : "Kilolitre";

  if (aviationChart) {
    aviationChart.destroy();
  }

  aviationChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: `${FUEL_LABELS[selectedFuelType]} - ${selectedArea} (${currency}/${unit})`,
          data: prices,
          borderColor: "#0284c7",
          backgroundColor: "rgba(2, 132, 199, 0.2)",
          tension: 0.35,
          fill: true,
          borderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: "#0369a1",
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

function syncAviationDropdowns() {
  const fuelSelect = document.getElementById("aviationFuelSelect");
  const areaSelect = document.getElementById("aviationAreaSelect");
  const chartFuelSelect = document.getElementById("aviationChartFuel");
  const chartAreaSelect = document.getElementById("aviationChartArea");

  if (fuelSelect) {
    fuelSelect.value = selectedFuelType;
  }

  if (areaSelect) {
    areaSelect.value = selectedArea;
  }

  if (chartFuelSelect) {
    chartFuelSelect.value = selectedFuelType;
  }

  if (chartAreaSelect) {
    chartAreaSelect.value = selectedArea;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initializeAviationPage();
  loadAviationChart();

  const fuelSelect = document.getElementById("aviationFuelSelect");
  const areaSelect = document.getElementById("aviationAreaSelect");
  const chartFuelSelect = document.getElementById("aviationChartFuel");
  const chartAreaSelect = document.getElementById("aviationChartArea");

  if (fuelSelect) {
    fuelSelect.addEventListener("change", async function () {
      selectedFuelType = this.value;
      syncAviationDropdowns();
      updateAviationDisplay();
      await loadAviationChart();
    });
  }

  if (areaSelect) {
    areaSelect.addEventListener("change", async function () {
      selectedArea = this.value;
      syncAviationDropdowns();
      updateAviationDisplay();
      await loadAviationChart();
    });
  }

  if (chartFuelSelect) {
    chartFuelSelect.addEventListener("change", async function () {
      selectedFuelType = this.value;
      syncAviationDropdowns();
      updateAviationDisplay();
      await loadAviationChart();
    });
  }

  if (chartAreaSelect) {
    chartAreaSelect.addEventListener("change", async function () {
      selectedArea = this.value;
      syncAviationDropdowns();
      updateAviationDisplay();
      await loadAviationChart();
    });
  }
});

document.addEventListener("input", (e) => {
  if (
    e.target.id === "aviationQuantity" ||
    e.target.id === "aviationCalculatorUnit"
  ) {
    updateAviationCalculator();
  }
});

document.addEventListener("change", (e) => {
  if (e.target.id === "aviationCalculatorUnit") {
    updateAviationCalculator();
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
      await loadAviationRates();
      await loadAviationChart();
    } finally {
      refreshButton.disabled = false;
      refreshButton.innerHTML =
        '<span class="refresh-icon">↻</span>Refresh Rates';
      refreshButton.classList.remove("refreshing");
    }
  });
}
