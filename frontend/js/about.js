// =========================================
// ABOUT PAGE THEME MANAGEMENT
// =========================================

const themeToggle = document.getElementById("themeToggle");


// =========================================
// APPLY THEME
// =========================================

function applyTheme(isDark) {

  if (isDark) {

    // =========================
    // DARK THEME
    // =========================

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

    // =========================
    // LIGHT THEME
    // =========================

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


// =========================================
// READ SAVED THEME
// =========================================

const savedTheme =
  localStorage.getItem("nepalLiveRatesTheme");


// Default = Dark
let isDark = savedTheme !== "light";


// =========================================
// APPLY SAVED THEME
// =========================================

applyTheme(isDark);


// =========================================
// UPDATE TOGGLE
// =========================================

if (themeToggle) {

  themeToggle.checked = !isDark;

}


// =========================================
// THEME TOGGLE
// =========================================

if (themeToggle) {

  themeToggle.addEventListener(
    "change",
    function () {

      // Checked = Light
      isDark = !this.checked;

      // Apply theme
      applyTheme(isDark);

      // Save preference
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

    }
  );

}

document.getElementById("year").textContent = new Date().getFullYear();