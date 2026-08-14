const LPG_API_URL = "https://nepal-live-rates.onrender.com/api/lpg";
const LPG_HISTORY_API = "https://nepal-live-rates.onrender.com/api/lpg/history";
const LPG_DOCUMENTS_API = "https://nepal-live-rates.onrender.com/api/lpg/documents";

let lpgData = null;
let lpgChart = null;
let lpgChartData = null;

function formatLpgLastUpdated(dateString) {
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

function updateLpgDisplay() {
  if (!lpgData?.lpg) return;

  const { current, yesterday, percentChange } = lpgData.lpg;

  document.getElementById("lpgPrice").textContent = current.toLocaleString();
  document.getElementById("lpgYesterday").textContent =
    `Yesterday NPR ${yesterday.toLocaleString()}`;

  const movement = document.getElementById("lpgMovement");
  movement.classList.remove("positive", "negative", "neutral");

  if (percentChange > 0) {
    movement.innerHTML = `▲ ${percentChange.toFixed(2)}%`;
    movement.classList.add("positive");
  } else if (percentChange < 0) {
    movement.innerHTML = `▼ ${Math.abs(percentChange).toFixed(2)}%`;
    movement.classList.add("negative");
  } else {
    movement.innerHTML = "▬ 0.00%";
    movement.classList.add("neutral");
  }

  updateLpgCalculator();
}

async function loadLpgRates() {
  try {
    const response = await fetch(LPG_API_URL);

    if (!response.ok) {
      throw new Error(`LPG API Error ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      return;
    }

    lpgData = data;

    const fullDateTime = formatLpgLastUpdated(data.lastUpdated);
    const parts = fullDateTime.split(",");

    document.getElementById("rateDate").textContent = `${parts[0]},${parts[1]}`;
    document.getElementById("lastUpdated").textContent =
      parts[2]?.trim() || fullDateTime;

    document.getElementById("lpgUpdated").textContent = fullDateTime;

    updateLpgDisplay();
  } catch (error) {
    console.error("LPG Error:", error);
  }
}

function initializeLpgPage() {
  loadLpgRates();
}

function updateLpgCalculator() {
  if (!lpgData?.lpg) return;

  const quantity =
    parseFloat(document.getElementById("lpgQuantity").value) || 0;

  const unit = document.getElementById("lpgCalculatorUnit").value;
  const unitMultipliers = {
    "1cylinder": 1,
    "2cylinder": 2,
    "5cylinder": 5,
    "10cylinder": 10,
  };

  const multiplier = unitMultipliers[unit] || 1;
  const total = quantity * lpgData.lpg.current * multiplier;

  document.getElementById("lpgCalculatorResult").textContent =
    `NPR ${total.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })}`;
}

async function loadLpgChart() {
  try {
    const response = await fetch(LPG_HISTORY_API);
    const data = await response.json();

    if (!data.success) {
      return;
    }

    lpgChartData = data.history;
    renderLpgChart();
  } catch (error) {
    console.error("LPG Chart Error:", error);
  }
}

function renderLpgChart() {
  if (!lpgChartData) return;

  const labels = lpgChartData.map((item) => item.label);
  const prices = lpgChartData.map((item) => item.price);
  const ctx = document.getElementById("lpgChart").getContext("2d");

  if (lpgChart) {
    lpgChart.destroy();
  }

  lpgChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "LPG Price (Domestic Cylinder)",
          data: prices,
          borderColor: "#f97316",
          backgroundColor: "rgba(249, 115, 22, 0.2)",
          tension: 0.35,
          fill: true,
          borderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: "#fb923c",
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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderLpgDocumentsState(message, isError = false) {
  const container = document.getElementById("lpgDocumentsContainer");

  if (!container) {
    return;
  }

  container.innerHTML = `<div class="lpg-documents-state${isError ? " error" : ""}">${escapeHtml(message)}</div>`;
}

function renderLpgDocuments(documents) {
  const container = document.getElementById("lpgDocumentsContainer");

  if (!container) {
    return;
  }

  if (!documents.length) {
    renderLpgDocumentsState("No official LPG documents are available right now.");
    return;
  }

  container.innerHTML = documents
    .map((document) => {
      const dateMarkup = document.date
        ? `<span>📅 Published: ${escapeHtml(document.date)}</span>`
        : "";

      return `
        <article class="lpg-document-card">
          <div class="lpg-document-title">📄 ${escapeHtml(document.title)}</div>
          <div class="lpg-document-meta">
            ${dateMarkup}
            <span>🏢 Source: NOC</span>
          </div>
          <a
            class="lpg-document-button"
            href="${escapeHtml(document.url)}"
            target="_blank"
            rel="noopener noreferrer"
          >
            View Document
          </a>
        </article>
      `;
    })
    .join("");
}

async function loadLpgDocuments() {
  renderLpgDocumentsState("Loading official documents...");

  try {
    const response = await fetch(LPG_DOCUMENTS_API);

    if (!response.ok) {
      throw new Error(`LPG Documents API Error ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      renderLpgDocumentsState("Unable to load official LPG documents.", true);
      return;
    }

    renderLpgDocuments(data.documents || []);
  } catch (error) {
    console.error("LPG Documents Error:", error);
    renderLpgDocumentsState(
      "Unable to load official LPG documents. Please try again later.",
      true,
    );
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initializeLpgPage();
  loadLpgChart();
  loadLpgDocuments();
});

document.addEventListener("input", (e) => {
  if (e.target.id === "lpgQuantity" || e.target.id === "lpgCalculatorUnit") {
    updateLpgCalculator();
  }
});

document.addEventListener("change", (e) => {
  if (e.target.id === "lpgCalculatorUnit") {
    updateLpgCalculator();
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
      await loadLpgRates();
      await loadLpgChart();
      await loadLpgDocuments();
    } finally {
      refreshButton.disabled = false;
      refreshButton.innerHTML =
        '<span class="refresh-icon">↻</span>Refresh Rates';
      refreshButton.classList.remove("refreshing");
    }
  });
}
