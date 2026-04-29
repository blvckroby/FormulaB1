const { addonBuilder } = require("stremio-addon-sdk");
const parser = require("iptv-playlist-parser");
const axios = require("axios");

// URL RAW del file M3U su GitHub
const M3U_URL = "https://raw.githubusercontent.com/blvckroby/FormulaB1/main/f1.m3u";

const manifest = {
    id: "it.f1.github.addon",
    version: "1.3.0",
    name: "F1 GitHub Live",
    description: "Streaming F1 direttamente da repository GitHub",
    resources: ["catalog", "stream", "meta"],
    types: ["tv"],
    idPrefixes: ["f1_gh_"],
    catalogs: [{ type: "tv", id: "f1_catalog", name: "F1 GitHub" }]
};

const builder = new addonBuilder(manifest);

// Funzione per scaricare la lista da GitHub
async function getPlaylist() {
    try {
        const response = await axios.get(M3U_URL);
        return parser.parse(response.data);
    } catch (e) {
        console.error("Errore download GitHub:", e.message);
        return { items: [] };
    }
}

// --- LOGICA DI RAGGRUPPAMENTO (come prima) ---

builder.defineCatalogHandler(async ({ type, id }) => {
    if (type === "tv" && id === "f1_catalog") {
        const playlist = await getPlaylist();
        const grouped = {};

        playlist.items.forEach(item => {
            let cleanName = item.name.split('(')[0].split('-')[0].trim();
            if (!grouped[cleanName]) {
                grouped[cleanName] = {
                    name: cleanName,
                    logo: item.tvg.logo,
                };
            }
        });

        const metas = Object.keys(grouped).map(name => ({
            id: `f1_gh_${encodeURIComponent(name)}`,
            type: "tv",
            name: name,
            poster: grouped[name].logo || "https://dummyimage.com/400x600/e10600/fff&text=F1",
        }));
        return { metas };
    }
    return { metas: [] };
});

builder.defineStreamHandler(async ({ id }) => {
    const name = decodeURIComponent(id.replace("f1_gh_", ""));
    const playlist = await getPlaylist();
    
    // Filtra tutti gli stream che appartengono a questo canale raggruppato
    const streams = playlist.items
        .filter(item => item.name.startsWith(name))
        .map(item => {
            let sourceLabel = item.name.includes('(') 
                ? item.name.match(/\(([^)]+)\)/)[1] 
                : "Sorgente";
            return {
                title: `🏎️ ${sourceLabel.toUpperCase()}`,
                url: item.url
            };
        });

    return { streams };
});

module.exports = builder.getInterface();
