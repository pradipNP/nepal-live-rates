const PETROL_API_URL = "https://nepal-live-rates.onrender.com/api/petrol";
const PETROL_HISTORY_API = "https://nepal-live-rates.onrender.com/api/petrol/history";

let petrolData = null;
let selectedArea = "Kathmandu";
let petrolChart = null;
let petrolChartData = null;

function formatPetrolLastUpdated(dateString) {
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
  if (!petrolData?.petrol) return 0;

  return petrolData.petrol[selectedArea] || 0;
}

function getYesterdayPrice() {
  if (!petrolData?.yesterday) return getCurrentPrice();

  return petrolData.yesterday[selectedArea] ?? getCurrentPrice();
}

function getPercentChange() {
  if (!petrolData?.percentChange) return 0;

  return petrolData.percentChange[selectedArea] || 0;
}

function updatePetrolDisplay() {
  if (!petrolData) return;

  const price = getCurrentPrice();
  const yesterday = getYesterdayPrice();
  const percent = getPercentChange();

  document.getElementById("petrolAreaLabel").textContent = selectedArea;
  document.getElementById("petrolPrice").textContent = price.toLocaleString();
  document.getElementById("petrolYesterday").textContent =
    `Yesterday NPR ${yesterday.toLocaleString()}`;

  const movement = document.getElementById("petrolMovement");
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

  updatePetrolCalculator();
}

async function loadPetrolRates() {
  try {
    const response = await fetch(PETROL_API_URL);

    if (!response.ok) {
      throw new Error(`Petrol API Error ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      return;
    }

    petrolData = data;

    const fullDateTime = formatPetrolLastUpdated(data.lastUpdated);
    const parts = fullDateTime.split(",");

    document.getElementById("rateDate").textContent = `${parts[0]},${parts[1]}`;
    document.getElementById("lastUpdated").textContent =
      parts[2]?.trim() || fullDateTime;

    document.getElementById("petrolUpdated").textContent = fullDateTime;

    updatePetrolDisplay();
  } catch (error) {
    console.error("Petrol Error:", error);
  }
}

function initializePetrolPage() {
  loadPetrolRates();
}

function updatePetrolCalculator() {
  if (!petrolData) return;

  const quantity =
    parseFloat(document.getElementById("petrolQuantity").value) || 0;

  const unit = document.getElementById("petrolCalculatorUnit").value;
  const unitMultipliers = {
    litre: 1,
    "5litre": 5,
    "10litre": 10,
    "20litre": 20,
  };

  const multiplier = unitMultipliers[unit] || 1;
  const total = quantity * getCurrentPrice() * multiplier;

  document.getElementById("petrolCalculatorResult").textContent =
    `NPR ${total.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })}`;
}

async function loadPetrolChart() {
  try {
    const response = await fetch(
      `${PETROL_HISTORY_API}?area=${encodeURIComponent(selectedArea)}`,
    );

    const data = await response.json();

    if (!data.success) {
      return;
    }

    petrolChartData = data.history;
    renderPetrolChart();
  } catch (error) {
    console.error("Petrol Chart Error:", error);
  }
}

function renderPetrolChart() {
  if (!petrolChartData) return;

  const labels = petrolChartData.map((item) => item.label);
  const prices = petrolChartData.map((item) => item.price);
  const ctx = document.getElementById("petrolChart").getContext("2d");

  if (petrolChart) {
    petrolChart.destroy();
  }

  petrolChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: `Petrol Price (${selectedArea})`,
          data: prices,
          borderColor: "#FF0000",
          backgroundColor: "rgba(245, 38, 11, 0.2)",
          tension: 0.35,
          fill: true,
          borderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: "#fb2424",
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
  initializePetrolPage();
  loadPetrolChart();

  const areaSelect = document.getElementById("petrolAreaSelect");
  const chartAreaSelect = document.getElementById("petrolChartArea");

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
      updatePetrolDisplay();
      await loadPetrolChart();
    });
  }

  if (chartAreaSelect) {
    chartAreaSelect.addEventListener("change", async function () {
      selectedArea = this.value;
      syncAreaDropdowns(selectedArea);
      updatePetrolDisplay();
      await loadPetrolChart();
    });
  }
});

document.addEventListener("input", (e) => {
  if (
    e.target.id === "petrolQuantity" ||
    e.target.id === "petrolCalculatorUnit"
  ) {
    updatePetrolCalculator();
  }
});

document.addEventListener("change", (e) => {
  if (e.target.id === "petrolCalculatorUnit") {
    updatePetrolCalculator();
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
      await loadPetrolRates();
      await loadPetrolChart();
    } finally {
      refreshButton.disabled = false;
      refreshButton.innerHTML =
        '<span class="refresh-icon">↻</span>Refresh Rates';
      refreshButton.classList.remove("refreshing");
    }
  });
}
