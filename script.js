document.addEventListener("DOMContentLoaded", function () {
    const sections = document.querySelectorAll(".hidden");
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("show");
            }
        });
    }, { threshold: 0.2 });

    sections.forEach(section => observer.observe(section));

    document.addEventListener("wheel", (event) => {
        if (event.deltaY > 0) {
            window.scrollBy({ top: window.innerHeight, behavior: "smooth" });
        } else {
            window.scrollBy({ top: -window.innerHeight, behavior: "smooth" });
        }
    });

    let touchStartY = 0;
    let touchEndY = 0;
    const swipeThreshold = 50;

    document.addEventListener("touchstart", (e) => {
        touchStartY = e.touches[0].clientY;
    });

    document.addEventListener("touchend", (e) => {
        touchEndY = e.changedTouches[0].clientY;
        handleSwipe();
    });

    function handleSwipe() {
        let swipeDistance = touchEndY - touchStartY;

        if (Math.abs(swipeDistance) > swipeThreshold) {
            if (swipeDistance < 0) {
                window.scrollBy({ top: window.innerHeight, behavior: "smooth" });
            } else {
                window.scrollBy({ top: -window.innerHeight, behavior: "smooth" });
            }
        }
    }

    document.body.style.overflow = "hidden";

    fetch("skills.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("skills-container").innerHTML = data;
            duplicateIconsForLoop();
        })
        .catch(error => console.error("Error loading skills:", error));

    function duplicateIconsForLoop() {
        let track = document.querySelector(".skills-track");
        if (track) {
            let icons = track.innerHTML;
            track.innerHTML += icons;
        }
    }

    let diceButton = document.getElementById("dice-button");
    if (!diceButton) {
        diceButton = document.createElement("button");
        diceButton.id = "dice-button";
        diceButton.innerHTML = "🎲";
        diceButton.style.position = "fixed";
        diceButton.style.bottom = "20px";
        diceButton.style.right = "20px";
        diceButton.style.padding = "3px";
        diceButton.style.fontSize = "40px";
        diceButton.style.cursor = "pointer";
        diceButton.style.border = "none";
        diceButton.style.background = "white";
        diceButton.style.borderRadius = "5px";
        diceButton.style.boxShadow = "0px 0px 10px rgba(255, 255, 255, 0.5)";
        document.body.appendChild(diceButton);
    }

    const canvasScripts = ["canvas.js", "canvas1.js", "canvas2.js", "canvas3.js", "canvas4.js", "canvas5.js"];
    let activeCanvas = "canvas.js";
    let animationFrame = null;
    let currentScript = null;

    function removeExistingCanvas() {
        const existingCanvas = document.getElementById("backgroundCanvas");
        if (existingCanvas) {
            existingCanvas.remove();
        }
    }

    function createNewCanvas() {
        const newCanvas = document.createElement("canvas");
        newCanvas.id = "backgroundCanvas";
        newCanvas.style.position = "fixed";
        newCanvas.style.top = "0";
        newCanvas.style.left = "0";
        newCanvas.style.width = "100vw";
        newCanvas.style.height = "100vh";
        newCanvas.style.zIndex = "-1";
        document.body.appendChild(newCanvas);

        function resizeCanvas() {
            newCanvas.width = window.innerWidth;
            newCanvas.height = window.innerHeight;
        }
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        return newCanvas;
    }

    function stopPreviousAnimation() {
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }
    }

    function loadCanvasScript(scriptName) {
        stopPreviousAnimation();
        removeExistingCanvas();
        createNewCanvas();

        if (currentScript) {
            currentScript.remove();
        }

        currentScript = document.createElement("script");
        currentScript.src = scriptName;
        currentScript.onload = () => console.log(`Loaded: ${scriptName}`);
        document.body.appendChild(currentScript);
    }

    loadCanvasScript("canvas.js");

    function isInSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (!section) return false;

        const rect = section.getBoundingClientRect();
        return rect.top < window.innerHeight / 2 && rect.bottom > window.innerHeight / 2;
    }

    diceButton.addEventListener("click", function () {
        let newCanvas;
        do {
            newCanvas = canvasScripts[Math.floor(Math.random() * canvasScripts.length)];
        } while (newCanvas === activeCanvas);

        activeCanvas = newCanvas;

        if (isInSection("skills") || isInSection("projects")) {
            document.getElementById("landing").scrollIntoView({ behavior: "smooth" });
            setTimeout(() => loadCanvasScript(activeCanvas), 600);
        } else {
            loadCanvasScript(activeCanvas); // Always switch canvas, even in contact section
        }
    });
});
