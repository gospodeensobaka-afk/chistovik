/* ========================================================
   CACHE BUSTER — показывает версию деплоя
   ======================================================== */

const BUILD_ID = "1"; // ← меняй вручную при каждом коммите

const buildBadge = document.createElement("div");
buildBadge.textContent = `build: ${BUILD_ID}`;
buildBadge.style.position = "fixed";
buildBadge.style.top = "8px";
buildBadge.style.right = "8px";
buildBadge.style.background = "rgba(0,0,0,0.6)";
buildBadge.style.color = "#0f0";
buildBadge.style.fontSize = "11px";
buildBadge.style.fontFamily = "monospace";
buildBadge.style.padding = "3px 7px";
buildBadge.style.borderRadius = "6px";
buildBadge.style.zIndex = "999999";
buildBadge.style.pointerEvents = "none";
document.addEventListener("DOMContentLoaded", () => document.body.appendChild(buildBadge));
