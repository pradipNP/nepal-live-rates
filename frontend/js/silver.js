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
