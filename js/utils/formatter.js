/*
  Utilidades de formato:
  - Convierte números a formato monetario en español.
  - Proporciona helpers genéricos para mostrar valores con decimales.
*/
function formatCurrency(amount, currency = "EUR") {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

const Formatter = {
  currency: formatCurrency,
  number: (num, decimals = 2) => {
    return Number(num).toFixed(decimals);
  },
};

window.formatCurrency = formatCurrency;
