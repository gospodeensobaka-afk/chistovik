/* ========================================================
   ===================== MEDIA MODULE ======================
   ======================================================== */

/* === PHOTO & VIDEO TIMINGS === */
const photoTimings = {
"audio/1-2005.m4a": {
    46: "images/president.jpeg"
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
let missedMedia = []; // { type: "photo"|"video", src: "..." }

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
        const t = Math.floor(audio.currentTime);

        if (pTimings && pTimings[t] && !shownPhoto[t]) {
            shownPhoto[t] = true;
            showFullscreenMedia(pTimings[t], "photo");
        }

        if (vTimings && vTimings[t] && !shownVideo[t]) {
            shownVideo[t] = true;
            showFullscreenMedia(vTimings[t], "video");
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

    // не дублируем медиа в галерее
    if (!missedMedia.some(m => m.src === src)) {
        missedMedia.push({ type, src });
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

    // переключаем тип медиа
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

    // если открыто из галереи — не закрываем по таймеру
    if (window.__openedFromGallery) {
        window.__openedFromGallery = false;
        return;
    }

    // авто‑закрытие только для фото
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

        missedMedia.forEach(item => {
            const thumb = document.createElement("div");
            thumb.style.width = "100px";
            thumb.style.height = "100px";
            thumb.style.borderRadius = "10px";
            thumb.style.overflow = "hidden";
            thumb.style.cursor = "pointer";
            thumb.style.background = "#000";
            thumb.style.display = "flex";
            thumb.style.alignItems = "center";
            thumb.style.justifyContent = "center";

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

        galleryOverlay.classList.remove("hidden");
    };

    galleryOverlay.onclick = (e) => {
        if (e.target === galleryOverlay) {
            galleryOverlay.classList.add("hidden");
        }
    };

});
