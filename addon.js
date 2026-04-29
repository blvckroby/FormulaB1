const { addonBuilder } = require("stremio-addon-sdk");
const parser = require("iptv-playlist-parser");
const fs = require("fs");
const path = require("path");

const FILE_NAME = "f1.m3u";
const FILE_PATH = path.join(__dirname, FILE_NAME);

const manifest = {
    id: "it.f1.grouped.addon",
    version: "1.1.0",
    name: "Mio Addon F1 Pro",
    description: "Canali raggruppati con sorgenti multiple",
    resources: ["catalog", "stream", "meta"],
    types: ["tv"],
    idPrefixes: ["f1_ch_"],
    catalogs: [{ type: "tv", id: "f1_catalog", name: "Lista F1" }]
};

const builder = new addonBuilder(manifest);

// Funzione che raggruppa i canali per nome
function getGroupedPlaylist() {
    try {
        const data = fs.readFileSync(FILE_PATH, "utf8");
        const playlist = parser.parse(data);
        const grouped = {};

        playlist.items.forEach(item => {
            const name = item.name.trim();
            if (!grouped[name]) {
                grouped[name] = {
                    name: name,
                    logo: item.tvg.logo,
                    streams: []
                };
            }
            // Aggiungiamo lo stream alla lista di quel canale
            grouped[cleanName].streams.push({
                // Personalizza qui il titolo che appare su Stremio
                title: `🏎️ STREAM | ${sourceLabel}`, 
                url: item.url
            });
        });

        return grouped;
    } catch (e) {
        console.error(e);
        return {};
    }
}

// 1. Catalogo: mostriamo solo nomi UNICI
builder.defineCatalogHandler(({ type, id }) => {
    if (type === "tv" && id === "f1_catalog") {
        const grouped = getGroupedPlaylist();
        const metas = Object.keys(grouped).map(name => ({
            id: `f1_ch_${encodeURIComponent(name)}`, // Usiamo il nome come ID
            type: "tv",
            name: name,
            poster: grouped[name].logo || "https://i.pinimg.com/736x/e6/98/79/e69879bed28ebf865d230115a87fc01d.jpg",
        }));
        return Promise.resolve({ metas });
    }
    return Promise.resolve({ metas: [] });
});

// 2. Meta
builder.defineMetaHandler(({ id }) => {
    const name = decodeURIComponent(id.replace("f1_ch_", ""));
    const grouped = getGroupedPlaylist();
    const channel = grouped[name];

    if (channel) {
        return Promise.resolve({
            meta: {
                id: id,
                type: "tv",
                name: channel.name,
                poster: channel.logo,
                background: channel.logo,
                description: `Disponibili ${channel.streams.length} sorgenti per questo canale.`
            }
        });
    }
    return Promise.resolve({ meta: null });
});

// 3. Stream: Restituiamo tutti i link trovati per quel nome
builder.defineStreamHandler(({ id }) => {
    const name = decodeURIComponent(id.replace("f1_ch_", ""));
    const grouped = getGroupedPlaylist();
    const channel = grouped[name];

    if (channel && channel.streams) {
        return Promise.resolve({ streams: channel.streams });
    }
    return Promise.resolve({ streams: [] });
});

module.exports = builder.getInterface();