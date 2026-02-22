/* ========================================================
   ===================== MEDIA MODULE ======================
   ======================================================== */

/* === PHOTO & VIDEO TIMINGS === */
const photoTimings = {
    "audio/1-2005.m4a": {
        46: { open: "images/president.jpeg" }
    },

    "audio/2-bulak.m4a": {
        3.21: { open: "images/bulak shas.jpeg" },
        25.16: { open: "images/bulakdo1957.jpeg" }
    },

    "audio/41-sama-chasha.mp3": {
        177.74: { open: "images/bars.jpeg" },
        150.14: { open: "images/dashi.jpeg" },
        171.65: { open: "images/zilantiha.jpeg" },
        143.33: { open: "images/zilant.jpeg" },
        165.75: { open: "images/zilant.jpeg" },
        49.47:  { open: "images/vid.jpeg" },
        159.05: { open: "images/gerb.jpeg" },
        18:     { open: "images/chashavecher.jpeg" },
        235.94: { open: "images/president.jpeg" },
        239.16: { open: "images/ggerb.jpeg" }
    },

    /* === NEW PHOTO TIMINGS === */

    "audio/3-ploschad-tisyacheletia.m4a": {
        32.69: { open: "images/parad.jpeg" }
    },

    "audio/5-NovoSavinovskiy.m4a": {
        55.70: { open: "images/uspenskiy.jpeg" },
        61.05: { open: "images/kizich.jpeg" },
        102.61:{ open: "images/tatneft.jpeg" }
    },

    "audio/7-edinobor-Millenium.m4a": {
        26.29: { open: "images/milenium.jpeg" }
    },

    "audio/9-vezhaem-v-center-arskoe.m4a": {
        30.72: { open: "images/skotskie.jpeg" },
        75.87: { open: "images/yaroslavskih.jpeg" }
    },

    "audio/12-znachok-metro.m4a": {
        1.25: { open: "images/metro.jpeg" }
    },

    "audio/13-tramvai-piterskie-doma.m4a": {
        4.44: { open: "images/tramvay1.jpeg" },
        8.15: { open: "images/tramvay2.jpeg" }
    },

    "audio/14-ekiyat.m4a": {
        63.07: { open: "images/ekiyat.jpeg" }
    },

    "audio/15-tugan.m4a": {
        37.18: { open: "images/cveti tugana.jpeg" },
        42.09: { open: "images/alissum.jpeg" }
    },

    "audio/16-hram-gde-poyavilsya-ekiyat.m4a": {
        5.82: { open: "images/ekiyat1930.jpeg" }
    },

    "audio/17-staroobryadci.m4a": {
        26.15: { open: "images/staroobr cherni.jpeg" },
        36.37: { open: "images/staroobr cherni.jpeg" },
        38.90: { open: "images/votetozdanie.jpeg" },
        39.00: { open: "images/kazanskaya cerkov.jpeg" }
    },

    "audio/18-rotonda.m4a": {
        0.56: { open: "images/rotonda.jpeg" }
    },

    "audio/19-kostel.m4a": {
        0.52: { open: "images/kostel.jpeg" },
        14.17:{ open: "images/kostelgorkogo.jpeg" }
    },

    "audio/20-basketholl-fontan-v-vide-kazana.m4a": {
        4.33: { open: "images/fontan.jpeg" }
    },

    "audio/27-universitetskaya.m4a": {
        14.00: { open: "images/universitetskaya.jpeg" }
    },

    "audio/28-kfu.mp3": {
        24.68: { open: "images/lenin.jpeg" },
        146.25:{ open: "images/tabllenin.jpeg" },
        148.00:{ open: "images/tabllenin.jpeg" },
        148.08:{ open: "images/tabl tolstoy.jpeg" }
    },

    "audio/29-bivshaya-voskresenskaya.m4a": {
        10.65: { open: "images/voskresenskaya.jpeg" }
    },

    "audio/30-nostalgiya.m4a": {
        16.09: { open: "images/nostalgiya.jpeg" }
    },

    "audio/31.m4a": {
        6.27: { open: "images/patriki.jpeg" },
        10.32:{ open: "images/katok.jpeg" }
    },

    "audio/32-tatgoip.m4a": {
        12.51: { open: "images/teatr.jpeg" }
    },

    "audio/34-put-na-bogorodickiy(bolshaya-krasnay).m4a": {
        22.29: { open: "images/kznsobor.jpeg" }
    },

    "audio/35-yellow-zone-ikona.mp3": {
        51.36: { open: "images/ikonu obrela.jpeg" },
        169.05:{ open: "images/kazanskayaodigitriya.jpeg" },
        171.01:{ open: "images/troeruchie.jpeg" },
        174.84:{ open: "images/kazanskayaodigitriya.jpeg", duration: 4700 },
        199.65:{ open: "images/oklad.jpeg", duration: 10000 },
        211.28:{ open: "images/ikonokrad.jpeg", duration: 12000 },
        238.30:{ open: "images/vatikanskiy.jpeg" },
        240.52:{ open: "images/papa rimskiy.jpeg", duration: 2000 },
      243.56:{ open: "images/vatikanskiy.jpeg", duration: 24000 },
        270.37:{ open: "images/podlinniy.jpeg", duration: 9000 },
        279.21:{ open: "images/kznsobor.jpeg", duration: 10000 },
        296.53:{ open: "images/3hruschevki.jpeg" }
    },

    "audio/37-petropavlovskiy.m4a": {
        36.88: { open: "images/ikonosPetrpvl.jpeg" },
        59.90: { open: "images/bilyard.jpeg" }
    },

    "audio/38-istoriya-vzyatiya-kazani.mp3": {
        240.88:{ open: "images/vidvkremle.jpeg" },
        320.35:{ open: "images/kulbalkon.jpeg" }
    }
};

const videoTimings = {
    "audio/5-NovoSavinovskiy.m4a": {
        32.35: { open: "videos/novosavinovskiy.mp4", duration: 19000 }
    },

    "audio/8-sport-na-mileniume.m4a": {
        32.89: { open: "videos/3d modelki.mp4", duration: 22410 } // 22.41 сек
    },
   
   "audio/23-teatr-3h-smehov.mp3": {
    2.33: { open: "videos/kamala.mp4", duration: 10000 }
},
   
"audio/24-stska-glavniy-tezis.mp3": {
    73.93: { open: "videos/2009 panorama.mp4", duration: 40000 }
},
   
   "audio/25-put-na-pl-tukaya-stih.mp3": {
    45.90: { open: "videos/pamyatniki.mp4", duration: 10000 }
    }
};

/* === MISSED MEDIA STORAGE === */
let missedMedia = {}; // { zoneId: [ {type, src}, ... ] }

/* ========================================================
   ========== TIMINGS → FULLSCREEN MEDIA HANDLER ===========
   ======================================================== */

function setupPhotoTimingsForAudio(audio, zoneId) {
    const src = audio.src.split("/").pop();
    const key = "audio/" + src;

    const pTimings = photoTimings[key] || null;
    const vTimings = videoTimings[key] || null;

    if (!pTimings && !vTimings) return;

   const shownPhoto = {};
const shownVideo = {};
let lastTime = 0;

audio.ontimeupdate = () => {
    const current = audio.currentTime;

   // === PHOTOS ===
if (pTimings) {
    for (const timeStr in pTimings) {
        const target = parseFloat(timeStr);
        const cfg = pTimings[timeStr];

        if (!shownPhoto[target] && lastTime < target && current >= target) {
            shownPhoto[target] = true;
            showFullscreenMedia(cfg.open, "photo", cfg.duration);
        }
    }
}

    // === VIDEOS ===
    if (vTimings) {
        for (const timeStr in vTimings) {
            const target = parseFloat(timeStr);

            if (!shownVideo[target] && lastTime < target && current >= target) {
                shownVideo[target] = true;
               const cfg = vTimings[timeStr];
showFullscreenMedia(cfg.open, "video", cfg.duration);
            }
        }
    }

    lastTime = current;
};
}

/* ========================================================
   ===================== FULLSCREEN MEDIA ==================
   ======================================================== */

function showFullscreenMedia(src, type, duration = null) {
    let overlay = document.getElementById("fsMediaOverlay");
    let media = document.getElementById("fsMediaElement");
    let closeBtn = document.getElementById("fsMediaClose");

    // === ГРУППИРУЕМ МЕДИА ПО ЗОНАМ ===
  // === ГРУППИРУЕМ МЕДИА ПО ЗОНАМ (ТОЛЬКО ДЛЯ АУДИОЗОН) ===
if (window.__currentZoneId !== undefined && window.__currentZoneId !== null) {
    if (!missedMedia[window.__currentZoneId]) {
        missedMedia[window.__currentZoneId] = [];
    }

    if (!missedMedia[window.__currentZoneId].some(m => m.src === src)) {
        missedMedia[window.__currentZoneId].push({ type, src });
    }
}

    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "fsMediaOverlay";
        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.background = "rgba(0,0,0,0.9)";
        overlay.style.display = "flex";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";
        overlay.style.zIndex = "300000";
        document.body.appendChild(overlay);

        media = document.createElement("img");
        media.id = "fsMediaElement";
        media.style.maxWidth = "100%";
        media.style.maxHeight = "100%";
        overlay.appendChild(media);

        closeBtn = document.createElement("button");
        closeBtn.id = "fsMediaClose";
        closeBtn.textContent = "×";
        closeBtn.style.position = "absolute";
        closeBtn.style.top = "20px";
        closeBtn.style.right = "20px";
        closeBtn.style.width = "40px";
        closeBtn.style.height = "40px";
        closeBtn.style.borderRadius = "20px";
        closeBtn.style.border = "none";
        closeBtn.style.background = "rgba(0,0,0,0.7)";
        closeBtn.style.color = "white";
        closeBtn.style.fontSize = "24px";
        closeBtn.style.cursor = "pointer";
        closeBtn.onclick = () => {
            overlay.style.display = "none";
        };
        overlay.appendChild(closeBtn);
    }

    // === ПЕРЕКЛЮЧЕНИЕ ТИПА МЕДИА ===
if (type === "video") {
    const newVideo = document.createElement("video");
    newVideo.id = "fsMediaElement";
   if (window.__videoCache && window.__videoCache[src]) {
    newVideo.src = window.__videoCache[src];
} else {
   if (window.__videoCache && window.__videoCache[src]) {
    newVideo.src = window.__videoCache[src];
} else {
    newVideo.src = src;
}
}
    newVideo.style.maxWidth = "100%";
    newVideo.style.maxHeight = "100%";

    // === Универсальный кроссплатформенный фикс ===
    newVideo.muted = true;        // видео без звука → iOS не ставит аудио на паузу
    newVideo.playsInline = true;  // не открывать видео в системном плеере
    newVideo.controls = true;     // можно оставить, Android/Windows не страдают

    overlay.replaceChild(newVideo, media);
    media = newVideo;

    media.play().catch(() => {});
} else {
    if (media.tagName.toLowerCase() !== "img") {
        const newImg = document.createElement("img");
        newImg.id = "fsMediaElement";
        newImg.style.maxWidth = "100%";
        newImg.style.maxHeight = "100%";
        overlay.replaceChild(newImg, media);
        media = newImg;
    }

    // Скрываем фото до загрузки
    media.style.opacity = "0";
    media.style.transform = "translateX(0)";

    media.onload = () => {
        // Фото загрузилось → показываем плавно
        media.style.transition = "opacity 0.15s ease";
        media.style.opacity = "1";
    };

    media.src = src;
}

   
// === СВАЙПЫ ДЛЯ ФОТО С АНИМАЦИЕЙ ===
if (type === "photo") {
    let startX = null;
    let isDragging = false;

    overlay.ontouchstart = (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
        media.style.transition = "none";
    };

    overlay.ontouchmove = (e) => {
        if (!isDragging) return;
        const dx = e.touches[0].clientX - startX;
        media.style.transform = `translateX(${dx}px)`;
    };

    overlay.ontouchend = (e) => {
        if (!isDragging) return;
        isDragging = false;

        const endX = e.changedTouches[0].clientX;
        const dx = endX - startX;

        media.style.transition = "transform 0.25s ease";

        if (!window.__fsGallery || window.__fsGallery.length < 2) {
            media.style.transform = "translateX(0)";
            return;
        }

        // свайп влево → следующее фото
        if (dx < -50 && window.__fsIndex < window.__fsGallery.length - 1) {
            media.style.transform = "translateX(-100%)";
            setTimeout(() => {
                window.__fsIndex++;
                showFullscreenMedia(window.__fsGallery[window.__fsIndex], "photo");
            }, 200);
            return;
        }

        // свайп вправо → предыдущее фото
        if (dx > 50 && window.__fsIndex > 0) {
            media.style.transform = "translateX(100%)";
            setTimeout(() => {
                window.__fsIndex--;
                showFullscreenMedia(window.__fsGallery[window.__fsIndex], "photo");
            }, 200);
            return;
        }

        // если свайп слабый — возвращаем назад
        media.style.transform = "translateX(0)";
    };
}
overlay.style.display = "flex";

if (window.__openedFromGallery) {
    window.__openedFromGallery = false;
    return;
}

// === НОВАЯ ЛОГИКА ЗАКРЫТИЯ ===
if (duration) {
    setTimeout(() => {
        if (overlay && overlay.style.display !== "none") {
            overlay.style.display = "none";
        }
    }, duration);
    return;
}

// === МЕДИАЗОНЫ: НИКОГДА не закрываем автоматически ===
if (window.__mediaMenuMode) {
    return;
}

// === Fallback 3000 мс (для аудиотаймингов) ===
setTimeout(() => {
    if (overlay && overlay.style.display !== "none") {
        overlay.style.display = "none";
    }
}, 3000);
}

/* ========================================================
   ======================== GALLERY ========================
   ======================================================== */

document.addEventListener("DOMContentLoaded", () => {
    const notReadyBtn = document.getElementById("notReadyBtn");
    const galleryOverlay = document.getElementById("galleryOverlay");

    if (!notReadyBtn || !galleryOverlay) return;

    notReadyBtn.onclick = () => {
    // Полностью очищаем overlay
    galleryOverlay.innerHTML = "";

    // Создаём новый track
    const galleryTrack = document.createElement("div");
    galleryTrack.id = "galleryTrack";
    galleryTrack.style.display = "inline-flex";
    galleryTrack.style.flexDirection = "row";
    galleryTrack.style.gap = "12px";
    galleryTrack.style.whiteSpace = "nowrap";

    // Добавляем track в overlay
    galleryOverlay.appendChild(galleryTrack);

    const zoneIds = Object.keys(missedMedia)
        .map(id => Number(id))
        .sort((a, b) => b - a);

    const lastThree = zoneIds.slice(0, 3);

    lastThree.forEach(zoneId => {
        const items = missedMedia[zoneId];

        const title = document.createElement("div");
        title.textContent = `Зона ${zoneId}`;
        title.style.color = "white";
        title.style.margin = "10px 0 5px 0";
        title.style.fontSize = "16px";
        galleryOverlay.appendChild(title);

        items.forEach(item => {
            const thumb = document.createElement("div");
            thumb.style.width = "100px";
            thumb.style.height = "100px";
            thumb.style.borderRadius = "10px";
            thumb.style.overflow = "hidden";
            thumb.style.cursor = "pointer";
            thumb.style.background = "#000";
            thumb.style.display = "inline-flex";
            thumb.style.alignItems = "center";
            thumb.style.justifyContent = "center";
            thumb.style.marginRight = "10px";

            if (item.type === "photo") {
                const img = document.createElement("img");
                img.src = item.src;
                img.style.width = "100%";
                img.style.height = "100%";
                img.style.objectFit = "cover";
                thumb.appendChild(img);
            } else {
                const icon = document.createElement("div");
                icon.style.width = "0";
                icon.style.height = "0";
                icon.style.borderLeft = "20px solid white";
                icon.style.borderTop = "12px solid transparent";
                icon.style.borderBottom = "12px solid transparent";
                thumb.appendChild(icon);
            }

           thumb.onclick = () => {
    galleryOverlay.classList.add("hidden");
    window.__openedFromGallery = true;

    const photos = missedMedia[zoneId]
        .filter(m => m.type === "photo")
        .map(m => m.src);

    window.__fsGallery = photos;
    window.__fsIndex = photos.indexOf(item.src);

    showFullscreenMedia(item.src, item.type);
};

            galleryTrack.appendChild(thumb);
        });
    });

    galleryOverlay.classList.remove("hidden");
};
});





