/* ========================================================
   ================== ONBOARDING MODULE ===================
   Премиальный онбординг + стартовый экран для аудиогида
   ======================================================== */

(function initOnboarding() {

    /* ── Инжектим шрифт ── */
    const fontLink = document.createElement("link");
    fontLink.rel = "stylesheet";
    fontLink.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Manrope:wght@400;500;600&display=swap";
    document.head.appendChild(fontLink);

    /* ── CSS ── */
    const style = document.createElement("style");
    style.textContent = `
        :root {
            --gold: #C9A96E;
            --gold-light: #E8C98A;
            --dark: #080C12;
            --dark2: #0E1420;
            --text: rgba(255,255,255,0.92);
            --muted: rgba(255,255,255,0.45);
        }

        #kzn-onboarding {
            position: fixed;
            inset: 0;
            z-index: 999998;
            background: var(--dark);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            font-family: 'Manrope', sans-serif;
            -webkit-tap-highlight-color: transparent;
        }

        /* ── Фоновый паттерн ── */
        #kzn-onboarding::before {
            content: '';
            position: absolute;
            inset: 0;
            background-image:
                radial-gradient(ellipse 80% 50% at 50% -10%, rgba(201,169,110,0.15) 0%, transparent 70%),
                radial-gradient(ellipse 60% 40% at 80% 110%, rgba(201,169,110,0.08) 0%, transparent 60%);
            pointer-events: none;
        }

        /* ── Слайды ── */
        #kzn-slides {
            flex: 1;
            display: flex;
            overflow: hidden;
            position: relative;
        }

        .kzn-slide {
            min-width: 100%;
            padding: 0 28px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            transition: opacity 0.45s ease;
            opacity: 0;
            position: absolute;
            inset: 0;
            pointer-events: none;
        }

        .kzn-slide.active {
            opacity: 1;
            pointer-events: auto;
            position: relative;
        }

        /* ── Слайд 1: заставка ── */
        .kzn-slide-1 .kzn-city {
            font-family: 'Cormorant Garamond', serif;
            font-size: clamp(52px, 16vw, 72px);
            font-weight: 600;
            color: var(--text);
            letter-spacing: 0.04em;
            line-height: 1;
            margin-bottom: 6px;
        }

        .kzn-slide-1 .kzn-subtitle-line {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 32px;
        }

        .kzn-slide-1 .kzn-line {
            flex: 1;
            height: 1px;
            background: linear-gradient(90deg, transparent, var(--gold), transparent);
            max-width: 60px;
        }

        .kzn-slide-1 .kzn-subtitle {
            font-size: 11px;
            letter-spacing: 0.25em;
            text-transform: uppercase;
            color: var(--gold);
            font-weight: 500;
        }

        .kzn-emblem {
            width: 100px;
            height: 100px;
            margin-bottom: 28px;
            position: relative;
        }

        .kzn-emblem svg {
            width: 100%;
            height: 100%;
            filter: drop-shadow(0 0 20px rgba(201,169,110,0.4));
            animation: kznRotate 20s linear infinite;
        }

        @keyframes kznRotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        .kzn-emblem-center {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            animation: kznPulse 3s ease-in-out infinite;
        }

        @keyframes kznPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.08); }
        }

        .kzn-tagline {
            font-family: 'Cormorant Garamond', serif;
            font-style: italic;
            font-size: clamp(18px, 5vw, 22px);
            color: var(--text);
            line-height: 1.5;
            max-width: 280px;
            margin-bottom: 8px;
        }

        .kzn-tagline-sub {
            font-size: 13px;
            color: var(--muted);
            line-height: 1.6;
            max-width: 260px;
        }

        /* ── Слайды 2–3: фичи ── */
        .kzn-feat-icon {
            font-size: 48px;
            margin-bottom: 20px;
            line-height: 1;
            filter: drop-shadow(0 4px 16px rgba(201,169,110,0.3));
        }

        .kzn-feat-title {
            font-family: 'Cormorant Garamond', serif;
            font-size: clamp(28px, 8vw, 36px);
            font-weight: 600;
            color: var(--text);
            line-height: 1.15;
            margin-bottom: 16px;
            max-width: 300px;
        }

        .kzn-feat-list {
            list-style: none;
            padding: 0;
            margin: 0;
            text-align: left;
            max-width: 300px;
            width: 100%;
        }

        .kzn-feat-list li {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            padding: 10px 0;
            border-bottom: 1px solid rgba(255,255,255,0.06);
            font-size: 14px;
            color: rgba(255,255,255,0.75);
            line-height: 1.5;
        }

        .kzn-feat-list li:last-child {
            border-bottom: none;
        }

        .kzn-feat-list li .feat-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--gold);
            flex-shrink: 0;
            margin-top: 6px;
        }

        /* ── Нижняя панель ── */
        #kzn-bottom {
            padding: 20px 28px 36px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
            flex-shrink: 0;
        }

        /* ── Точки прогресса ── */
        #kzn-dots {
            display: flex;
            gap: 8px;
            align-items: center;
        }

        .kzn-dot {
            width: 6px;
            height: 6px;
            border-radius: 3px;
            background: rgba(255,255,255,0.2);
            transition: all 0.3s ease;
        }

        .kzn-dot.active {
            width: 24px;
            background: var(--gold);
        }

        /* ── Кнопка ── */
        #kzn-next-btn {
            width: 100%;
            max-width: 320px;
            height: 60px;
            border: none;
            border-radius: 18px;
            background: linear-gradient(135deg, var(--gold) 0%, #A8803E 100%);
            color: #080C12;
            font-family: 'Manrope', sans-serif;
            font-size: 16px;
            font-weight: 700;
            letter-spacing: 0.02em;
            cursor: pointer;
            position: relative;
            overflow: hidden;
            transition: transform 0.15s ease, box-shadow 0.15s ease;
            box-shadow: 0 8px 32px rgba(201,169,110,0.35);
        }

        #kzn-next-btn::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%);
        }

        #kzn-next-btn:active {
            transform: scale(0.97);
            box-shadow: 0 4px 16px rgba(201,169,110,0.25);
        }

        #kzn-next-btn .btn-inner {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        #kzn-skip {
            font-size: 13px;
            color: var(--muted);
            cursor: pointer;
            padding: 4px 12px;
            transition: color 0.2s;
            background: none;
            border: none;
            font-family: 'Manrope', sans-serif;
        }

        #kzn-skip:active { color: var(--text); }

        /* ── Стартовый экран (поверх карты) ── */
        #kzn-start-screen {
            position: fixed;
            inset: 0;
            z-index: 999997;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-end;
            padding-bottom: 48px;
            pointer-events: none;
        }

        #kzn-start-screen.hidden {
            display: none;
        }

        /* ── Новая стартовая кнопка ── */
        #kzn-start-btn {
            pointer-events: auto;
            width: calc(100% - 48px);
            max-width: 340px;
            height: 68px;
            border: none;
            border-radius: 20px;
            background: linear-gradient(135deg, var(--gold) 0%, #A8803E 100%);
            color: #080C12;
            font-family: 'Manrope', sans-serif;
            font-size: 18px;
            font-weight: 700;
            letter-spacing: 0.01em;
            cursor: pointer;
            position: relative;
            overflow: hidden;
            box-shadow:
                0 12px 40px rgba(201,169,110,0.45),
                0 0 0 1px rgba(255,255,255,0.08) inset;
            transition: transform 0.15s ease, box-shadow 0.15s ease;
            animation: kznStartPulse 2.5s ease-in-out infinite;
        }

        @keyframes kznStartPulse {
            0%, 100% { box-shadow: 0 12px 40px rgba(201,169,110,0.45), 0 0 0 1px rgba(255,255,255,0.08) inset; }
            50% { box-shadow: 0 16px 56px rgba(201,169,110,0.65), 0 0 0 1px rgba(255,255,255,0.08) inset; }
        }

        #kzn-start-btn::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 55%);
        }

        #kzn-start-btn:active {
            transform: scale(0.96);
            animation: none;
            box-shadow: 0 6px 20px rgba(201,169,110,0.3);
        }

        #kzn-start-btn .btn-inner {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }

        #kzn-start-btn .btn-arrow {
            width: 28px;
            height: 28px;
            background: rgba(0,0,0,0.15);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
        }

        /* ── Fade-in анимация слайдов ── */
        @keyframes kznSlideIn {
            from { opacity: 0; transform: translateY(16px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .kzn-slide.active > * {
            animation: kznSlideIn 0.5s ease forwards;
        }

        .kzn-slide.active > *:nth-child(2) { animation-delay: 0.08s; opacity: 0; }
        .kzn-slide.active > *:nth-child(3) { animation-delay: 0.16s; opacity: 0; }
        .kzn-slide.active > *:nth-child(4) { animation-delay: 0.24s; opacity: 0; }
        .kzn-slide.active > *:nth-child(5) { animation-delay: 0.32s; opacity: 0; }
    `;
    document.head.appendChild(style);

    /* ── HTML онбординга ── */
    const onboarding = document.createElement("div");
    onboarding.id = "kzn-onboarding";
    onboarding.innerHTML = `
        <div id="kzn-slides">

            <!-- Слайд 1: Заставка -->
            <div class="kzn-slide kzn-slide-1 active">
                <div class="kzn-emblem">
                    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="50" cy="50" r="46" stroke="#C9A96E" stroke-width="0.8" stroke-dasharray="4 3"/>
                        <circle cx="50" cy="50" r="38" stroke="#C9A96E" stroke-width="0.4" opacity="0.5"/>
                        <path d="M50 8 L53 20 L50 18 L47 20 Z" fill="#C9A96E"/>
                        <path d="M50 92 L53 80 L50 82 L47 80 Z" fill="#C9A96E"/>
                        <path d="M8 50 L20 47 L18 50 L20 53 Z" fill="#C9A96E"/>
                        <path d="M92 50 L80 47 L82 50 L80 53 Z" fill="#C9A96E"/>
                        <path d="M22 22 L30 28 L27 28 L28 31 Z" fill="#C9A96E" opacity="0.6"/>
                        <path d="M78 22 L70 28 L73 28 L72 31 Z" fill="#C9A96E" opacity="0.6"/>
                        <path d="M22 78 L30 72 L27 72 L28 69 Z" fill="#C9A96E" opacity="0.6"/>
                        <path d="M78 78 L70 72 L73 72 L72 69 Z" fill="#C9A96E" opacity="0.6"/>
                    </svg>
                    <div class="kzn-emblem-center">🕌</div>
                </div>
                <div class="kzn-city">Казань</div>
                <div class="kzn-subtitle-line">
                    <div class="kzn-line"></div>
                    <div class="kzn-subtitle">Аудиогид</div>
                    <div class="kzn-line"></div>
                </div>
                <div class="kzn-tagline">Город глазами того, кто здесь живёт</div>
                <div class="kzn-tagline-sub" style="margin-top:12px;">Маршрут на автомобиле.<br>Аудио, фото и видео включаются сами.</div>
            </div>

            <!-- Слайд 2: Как работает -->
            <div class="kzn-slide kzn-slide-2">
                <div class="kzn-feat-icon">🎧</div>
                <div class="kzn-feat-title">Всё происходит само</div>
                <ul class="kzn-feat-list">
                    <li><div class="feat-dot"></div><span>Подключите телефон к колонкам авто по Bluetooth — аудио зазвучит для всех</span></li>
                    <li><div class="feat-dot"></div><span>Подъезжаете к точке — включается аудио, всплывают фото и видео</span></li>
                    <li><div class="feat-dot"></div><span>Зелёная стрелка на карте всегда показывает, куда ехать дальше</span></li>
                    <li><div class="feat-dot"></div><span>Прогресс сохраняется — можно прерваться и вернуться на следующий день</span></li>
                </ul>
            </div>

            <!-- Слайд 3: Старт -->
            <div class="kzn-slide kzn-slide-3">
                <div class="kzn-feat-icon">📍</div>
                <div class="kzn-feat-title">Доберитесь до старта</div>
                <ul class="kzn-feat-list">
                    <li><div class="feat-dot"></div><span><strong style="color:var(--gold)">Остановка «ст. метро Площадь Тукая»</strong> со стороны улицы Баумана</span></li>
                    <li><div class="feat-dot"></div><span>Координаты: <strong style="color:rgba(255,255,255,0.9)">55.787253, 49.121842</strong></span></li>
                    <li><div class="feat-dot"></div><span>Нажмите «Начать экскурсию», дослушайте стартовое аудио и двигайтесь к первой зелёной стрелке</span></li>
                </ul>
            </div>

        </div>

        <!-- Нижняя панель -->
        <div id="kzn-bottom">
            <div id="kzn-dots">
                <div class="kzn-dot active"></div>
                <div class="kzn-dot"></div>
                <div class="kzn-dot"></div>
            </div>
            <button id="kzn-next-btn">
                <div class="btn-inner">
                    <span id="kzn-btn-text">Далее</span>
                    <span>→</span>
                </div>
            </button>
            <button id="kzn-skip">Пропустить</button>
        </div>
    `;
    document.body.appendChild(onboarding);

    /* ── Логика слайдов ── */
    let currentSlide = 0;
    const slides = onboarding.querySelectorAll(".kzn-slide");
    const dots = onboarding.querySelectorAll(".kzn-dot");
    const nextBtn = onboarding.querySelector("#kzn-next-btn");
    const skipBtn = onboarding.querySelector("#kzn-skip");
    const btnText = onboarding.querySelector("#kzn-btn-text");

    function goToSlide(idx) {
        slides[currentSlide].classList.remove("active");
        dots[currentSlide].classList.remove("active");
        currentSlide = idx;
        slides[currentSlide].classList.add("active");
        dots[currentSlide].classList.add("active");
        btnText.textContent = currentSlide === slides.length - 1 ? "Начать экскурсию" : "Далее";
        skipBtn.style.opacity = currentSlide === slides.length - 1 ? "0" : "1";
        skipBtn.style.pointerEvents = currentSlide === slides.length - 1 ? "none" : "auto";
    }

    function closeOnboarding() {
        onboarding.style.transition = "opacity 0.4s ease";
        onboarding.style.opacity = "0";
        setTimeout(() => {
            onboarding.remove();
            showStartScreen();
        }, 400);
    }

    nextBtn.addEventListener("click", () => {
        if (currentSlide < slides.length - 1) {
            goToSlide(currentSlide + 1);
        } else {
            closeOnboarding();
        }
    });

    skipBtn.addEventListener("click", closeOnboarding);

    /* ── Свайп между слайдами ── */
    let touchStartX = 0;
    onboarding.addEventListener("touchstart", e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    onboarding.addEventListener("touchend", e => {
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (dx < -50 && currentSlide < slides.length - 1) goToSlide(currentSlide + 1);
        if (dx > 50 && currentSlide > 0) goToSlide(currentSlide - 1);
    }, { passive: true });

    /* ── Стартовый экран поверх карты ── */
    function showStartScreen() {
        // Скрываем старую кнопку startTourBtn если есть
        const oldBtn = document.getElementById("startTourBtn");
        if (oldBtn) oldBtn.style.display = "none";

        const screen = document.createElement("div");
        screen.id = "kzn-start-screen";
        screen.innerHTML = `
            <button id="kzn-start-btn">
                <div class="btn-inner">
                    <span>Начать экскурсию</span>
                    <div class="btn-arrow">▶</div>
                </div>
            </button>
        `;
        document.body.appendChild(screen);

        document.getElementById("kzn-start-btn").addEventListener("click", () => {
            screen.classList.add("hidden");
            // Вызываем оригинальный обработчик startTourBtn
            if (oldBtn) {
                oldBtn.click();
            } else {
                // Fallback: триггерим событие напрямую
                const event = new CustomEvent("kzn:startTour");
                document.dispatchEvent(event);
            }
        });
    }

})();

