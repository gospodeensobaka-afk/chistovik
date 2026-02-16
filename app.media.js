/* ========================================================
   ===================== MEDIA MODULE ======================
   ======================================================== */

/* === PHOTO & VIDEO TIMINGS === */
const photoTimings = {
    "audio/1-2005.m4a": {
        46: "images/president.jpeg"
    },

    "audio/2-bulak.m4a": {
        3.21: "images/bulak shas.jpeg",
        25.16: "images/bulakdo1957.jpeg"
    },

    "audio/5.mp3": {
        3: "images/zone5_photo.jpg"
    }
};

const videoTimings = {
    "audio/3.mp3": {
        3: "videos/zone3_video.mp4"
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

    audio.ontimeupdate = () => {
        const current = audio.currentTime;

        // === PHOTOS ===
        if (pTimings) {
            for (const timeStr in pTimings) {
                const target = parseFloat(timeStr);

                if (!shownPhoto[target] && current >= target && current < target + 0.15) {
                    shownPhoto[target] = true;
                    showFullscreenMedia(pTimings[timeStr], "photo");
                }
            }
        }

        // === VIDEOS ===
        if (vTimings) {
            for (const timeStr in vTimings) {
                const target = parseFloat(timeStr);

                if (!shownVideo[target] && current >= target && current < target + 0.15) {
                    shownVideo[target] = true;
                    showFullscreenMedia(vTimings[timeStr], "video");
                }
            }
        }
    };
}

/* ========================================================
   ===================== FULLSCREEN MEDIA ==================
   ======================================================== */

function showFullscreenMedia(src, type) {
    let overlay = document.getElementById("fsMediaOverlay");
    let media = document.getElementById("fsMediaElement");
    let closeBtn = document.getElementById("fsMediaClose");

    // === ГРУППИРУЕМ МЕДИА ПО ЗОНАМ ===
    if (!missedMedia[window.__currentZoneId]) {
        missedMedia[window.__currentZoneId] = [];
    }

    if (!missedMedia[window.__currentZoneId].some(m => m.src === src)) {
        missedMedia[window.__currentZoneId].push({ type, src });
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
        newVideo.src = src;
        newVideo.style.maxWidth = "100%";
        newVideo.style.maxHeight = "100%";
        newVideo.controls = true;
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
        media.src = src;
    }

    overlay.style.display = "flex";

    if (window.__openedFromGallery) {
        window.__openedFromGallery = false;
        return;
    }

    if (type === "photo") {
        setTimeout(() => {
            if (overlay && overlay.style.display !== "none") {
                overlay.style.display = "none";
            }
        }, 3000);
    }
}

/* ========================================================
   ======================== GALLERY ========================
   ======================================================== */

document.addEventListener("DOMContentLoaded", () => {
    const notReadyBtn = document.getElementById("notReadyBtn");
    const galleryOverlay = document.getElementById("galleryOverlay");

    if (!notReadyBtn || !galleryOverlay) return;

    notReadyBtn.onclick = () => {
        galleryOverlay.innerHTML = "";

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
                    showFullscreenMedia(item.src, item.type);
                };

                galleryOverlay.appendChild(thumb);
            });
        });

        galleryOverlay.classList.remove("hidden");
    };
});
