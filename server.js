const { serveHTTP } = require("stremio-addon-sdk");
const addonInterface = require("./addon");

// Hugging Face usa la porta 7860 di default
const port = process.env.PORT || 7860;

serveHTTP(addonInterface, { port });
console.log(`Addon avviato sulla porta ${port}`);
