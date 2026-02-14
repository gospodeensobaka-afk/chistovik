const fs = require("fs");
const path = require("path");

function scan(dir) {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
        .filter(f => !f.startsWith("."))
        .map(f => path.join(dir, f).replace(/\\/g, "/"));
}

const audio = scan("audio");
const photos = scan("images");
const videos = scan("videos");

const index = { audio, photos, videos };

fs.writeFileSync("media-index.json", JSON.stringify(index, null, 2));

console.log("media-index.json создан!");