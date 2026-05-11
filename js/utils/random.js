const RNG = {
    // Generate a random multiplier with a house edge bias (crash style)
    generateCrashMultiplier: function(houseEdge = 0.05) {
        const e = 2 ** 32;
        const h = crypto.getRandomValues(new Uint32Array(1))[0];
        // Instacrash
        if (h % Math.floor(1 / houseEdge) === 0) return 1.00;
        
        const multiplier = Math.floor((100 * e - h) / (e - h)) / 100;
        return Math.max(1.00, multiplier);
    },

    randomInt: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    randomFloat: function(min, max) {
        return Math.random() * (max - min) + min;
    }
};

const Helpers = {
    sleep: function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};
