const KEROSENE_API_URL = "https://nepal-live-rates.onrender.com/api/kerosene";
const KEROSENE_HISTORY_API =
  "https://nepal-live-rates.onrender.com/api/kerosene/history";

let keroseneData = null;
let selectedArea = "Kathmandu";
let keroseneChart = null;
let keroseneChartData = null;

function formatKeroseneLastUpdated(dateString) {
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
  if (!keroseneData?.kerosene) return 0;

  return keroseneData.kerosene[selectedArea] || 0;
}

function getYesterdayPrice() {
  if (!keroseneData?.yesterday) return getCurrentPrice();

  return keroseneData.yesterday[selectedArea] ?? getCurrentPrice();
}

function getPercentChange() {
  if (!keroseneData?.percentChange) return 0;

  return keroseneData.percentChange[selectedArea] || 0;
}

function updateKeroseneDisplay() {
  if (!keroseneData) return;

  const price = getCurrentPrice();
  const yesterday = getYesterdayPrice();
  const percent = getPercentChange();

  document.getElementById("keroseneAreaLabel").textContent = selectedArea;
  document.getElementById("kerosenePrice").textContent =
    price.toLocaleString();
  document.getElementById("keroseneYesterday").textContent =
    `Yesterday NPR ${yesterday.toLocaleString()}`;

  const movement = document.getElementById("keroseneMovement");
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

  updateKeroseneCalculator();
}

async function loadKeroseneRates() {
  try {
    const response = await fetch(KEROSENE_API_URL);

    if (!response.ok) {
      throw new Error(`Kerosene API Error ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      return;
    }

    keroseneData = data;

    const fullDateTime = formatKeroseneLastUpdated(data.lastUpdated);
    const parts = fullDateTime.split(",");

    document.getElementById("rateDate").textContent = `${parts[0]},${parts[1]}`;
    document.getElementById("lastUpdated").textContent =
      parts[2]?.trim() || fullDateTime;

    document.getElementById("keroseneUpdated").textContent = fullDateTime;

    updateKeroseneDisplay();
  } catch (error) {
    console.error("Kerosene Error:", error);
  }
}

function initializeKerosenePage() {
  loadKeroseneRates();
}

function updateKeroseneCalculator() {
  if (!keroseneData) return;

  const quantity =
    parseFloat(document.getElementById("keroseneQuantity").value) || 0;

  const unit = document.getElementById("keroseneCalculatorUnit").value;
  const unitMultipliers = {
    litre: 1,
    "5litre": 5,
    "10litre": 10,
    "20litre": 20,
  };

  const multiplier = unitMultipliers[unit] || 1;
  const total = quantity * getCurrentPrice() * multiplier;

  document.getElementById("keroseneCalculatorResult").textContent =
    `NPR ${total.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })}`;
}

async function loadKeroseneChart() {
  try {
    const response = await fetch(
      `${KEROSENE_HISTORY_API}?area=${encodeURIComponent(selectedArea)}`,
    );

    const data = await response.json();

    if (!data.success) {
      return;
    }

    keroseneChartData = data.history;
    renderKeroseneChart();
  } catch (error) {
    console.error("Kerosene Chart Error:", error);
  }
}

function renderKeroseneChart() {
  if (!keroseneChartData) return;

  const labels = keroseneChartData.map((item) => item.label);
  const prices = keroseneChartData.map((item) => item.price);
  const ctx = document.getElementById("keroseneChart").getContext("2d");

  if (keroseneChart) {
    keroseneChart.destroy();
  }

  keroseneChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: `Kerosene Price (${selectedArea})`,
          data: prices,
          borderColor: "#50a6e1",
          backgroundColor: "rgba(79, 108, 205, 0.2)",
          tension: 0.35,
          fill: true,
          borderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: "#50a6e1",
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
  initializeKerosenePage();
  loadKeroseneChart();

  const areaSelect = document.getElementById("keroseneAreaSelect");
  const chartAreaSelect = document.getElementById("keroseneChartArea");

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
      updateKeroseneDisplay();
      await loadKeroseneChart();
    });
  }

  if (chartAreaSelect) {
    chartAreaSelect.addEventListener("change", async function () {
      selectedArea = this.value;
      syncAreaDropdowns(selectedArea);
      updateKeroseneDisplay();
      await loadKeroseneChart();
    });
  }
});

document.addEventListener("input", (e) => {
  if (
    e.target.id === "keroseneQuantity" ||
    e.target.id === "keroseneCalculatorUnit"
  ) {
    updateKeroseneCalculator();
  }
});

document.addEventListener("change", (e) => {
  if (e.target.id === "keroseneCalculatorUnit") {
    updateKeroseneCalculator();
  }
});
const refreshButton = document.getElementById("refreshButton");

if (refreshButton) {
  refreshButton.addEventListener("click", async () => {
    if (refreshButton.disabled) return;

    refreshButton.disabled = true;
    refreshButton.innerHTML = "⟳ Refreshing...";
    refreshButton.classList.add("refreshing");

    try {
      await loadKeroseneRates();
      await loadKeroseneChart();
    } finally {
      refreshButton.disabled = false;
      refreshButton.innerHTML =
        '<span class="refresh-icon">↻</span>Refresh Rates';
      refreshButton.classList.remove("refreshing");
    }
  });
}
