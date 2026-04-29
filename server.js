const { serveHTTP } = require("stremio-addon-sdk");
const addonInterface = require("./addon");

// Render e altri servizi cloud passano la porta tramite una variabile d'ambiente
const port = process.env.PORT || 7000; 

serveHTTP(addonInterface, { port });
console.log(`Addon online sulla porta ${port}`);