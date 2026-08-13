const pageRoutes = {
  forex: "index.html",
  gold: "gold.html",
  silver: "silver.html",
  petrol: "petrol.html",
  diesel: "diesel.html",
};

function initializeMarketCardNavigation() {
  Object.entries(pageRoutes).forEach(([category, route]) => {
    const card = document.querySelector(`[data-category="${category}"]`);

    if (!card) {
      return;
    }

    card.addEventListener("click", () => {
      window.location.href = route;
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const yearElement = document.getElementById("year");

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  initializeMarketCardNavigation();
});
