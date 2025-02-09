document.addEventListener("DOMContentLoaded", function () {
    // Intersection Observer for section animations
    const sections = document.querySelectorAll(".hidden");
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("show");
            }
        });
    }, { threshold: 0.2 });

    sections.forEach(section => observer.observe(section));

    // Smooth scrolling for desktop (Mouse wheel)
    document.addEventListener("wheel", (event) => {
        if (event.deltaY > 0) {
            window.scrollBy({ top: window.innerHeight, behavior: "smooth" });
        } else {
            window.scrollBy({ top: -window.innerHeight, behavior: "smooth" });
        }
    });

    // Smooth swipe scrolling for mobile (Fixed)
    let touchStartY = 0;
    let touchEndY = 0;
    const swipeThreshold = 50; // Minimum swipe distance

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
                window.scrollBy({ top: window.innerHeight, behavior: "smooth" }); // Swipe up → Scroll down
            } else {
                window.scrollBy({ top: -window.innerHeight, behavior: "smooth" }); // Swipe down → Scroll up
            }
        }
    }

    // Hide scrollbars (CSS method)
    document.body.style.overflow = "hidden";

    // Load skills dynamically
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
            track.innerHTML += icons; // Duplicate icons for smooth looping effect
        }
    }

    // Create Dice button if not already present
    let diceButton = document.getElementById("dice-button");
    if (!diceButton) {
        diceButton = document.createElement("button");
        diceButton.id = "dice-button";
        diceButton.innerHTML = "🎲";
        diceButton.style.position = "fixed";
        diceButton.style.bottom = "20px";
        diceButton.style.right = "20px";
        diceButton.style.padding = "10px";
        diceButton.style.fontSize = "20px";
        diceButton.style.cursor = "pointer";
        diceButton.style.border = "none";
        diceButton.style.background = "white";
        diceButton.style.borderRadius = "5px";
        diceButton.style.boxShadow = "0px 0px 10px rgba(255, 255, 255, 0.5)";
        document.body.appendChild(diceButton);
    }

    // Canvas handling
    const canvasScripts = ["canvas.js", "canvas1.js", "canvas2.js", "canvas3.js", "canvas4.js", "canvas5.js"];
    let activeCanvas = "canvas.js"; // Default canvas
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

        // Remove old canvas and create a new one
        removeExistingCanvas();
        createNewCanvas();

        // Remove old script
        if (currentScript) {
            currentScript.remove();
        }

        // Load new script
        currentScript = document.createElement("script");
        currentScript.src = scriptName;
        currentScript.onload = () => console.log(`Loaded: ${scriptName}`);
        document.body.appendChild(currentScript);
    }

    // Load default canvas (canvas.js) initially
    loadCanvasScript("canvas.js");

    diceButton.addEventListener("click", function () {
        let newCanvas;
        do {
            newCanvas = canvasScripts[Math.floor(Math.random() * canvasScripts.length)];
        } while (newCanvas === activeCanvas); // Ensure it switches to a different one

        activeCanvas = newCanvas;
        loadCanvasScript(activeCanvas);
    });
});
