/*
  Generador de números aleatorios y utilidades relacionadas.
  Incluye probabilidades con sesgo para mecánicas de tipo crash y funciones básicas.
*/
const RNG = {
  // Genera un multiplicador aleatorio con ligera ventaja de la casa.
  generateCrashMultiplier: function (houseEdge = 0.05) {
    const e = 2 ** 32;
    const h = crypto.getRandomValues(new Uint32Array(1))[0];
    // Instacrash
    if (h % Math.floor(1 / houseEdge) === 0) return 1.0;

    const multiplier = Math.floor((100 * e - h) / (e - h)) / 100;
    return Math.max(1.0, multiplier);
  },

  // Devuelve un entero aleatorio entre min y max inclusive.
  randomInt: function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  // Devuelve un flotante aleatorio entre min y max.
  randomFloat: function (min, max) {
    return Math.random() * (max - min) + min;
  },
};

const Helpers = {
  // Pausa la ejecución de un async function durante ms milisegundos.
  sleep: function (ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },
};
