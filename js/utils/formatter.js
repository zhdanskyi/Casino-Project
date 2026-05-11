// Formatter utilities
function formatCurrency(amount, currency = "EUR") {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

const Formatter = {
    currency: formatCurrency,
    number: (num, decimals = 2) => {
        return Number(num).toFixed(decimals);
    }
};

window.formatCurrency = formatCurrency;
