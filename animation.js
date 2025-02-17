document.addEventListener("DOMContentLoaded", function () {
    const container = document.querySelector(".projects-container");

    let isScrolling = false;
    let scrollSpeed = 0;

    // Smooth Auto-Scroll on Mouse Move
    container.addEventListener("mousemove", function (event) {
        const { left, width } = container.getBoundingClientRect();
        const mouseX = event.clientX - left;
        const centerX = width / 2;

        scrollSpeed = (mouseX - centerX) / centerX * 5;

        if (!isScrolling) {
            isScrolling = true;
            requestAnimationFrame(scrollProjects);
        }
    });

    function scrollProjects() {
        if (Math.abs(scrollSpeed) > 0.1) {
            container.scrollLeft += scrollSpeed;
            requestAnimationFrame(scrollProjects);
        } else {
            isScrolling = false;
        }
    }

    // Mouse Drag Scrolling
    let isDragging = false;
    let startX, scrollLeft;

    container.addEventListener("mousedown", (e) => {
        isDragging = true;
        startX = e.pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
        container.style.cursor = "grabbing";
    });

    container.addEventListener("mouseup", () => {
        isDragging = false;
        container.style.cursor = "grab";
    });

    container.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - container.offsetLeft;
        const walk = (x - startX) * 2;
        container.scrollLeft = scrollLeft - walk;
    });

    // **Smooth Swipe Scrolling with Momentum**
    let touchStartX = 0;
    let touchScrollLeft = 0;
    let velocity = 0;
    let rafId = null;

    function easeOut() {
        if (Math.abs(velocity) < 0.1) {
            cancelAnimationFrame(rafId);
            return;
        }
        container.scrollLeft += velocity;
        velocity *= 0.95; // Smooth out momentum
        rafId = requestAnimationFrame(easeOut);
    }

    container.addEventListener("touchstart", (e) => {
        cancelAnimationFrame(rafId); // Stop previous inertia
        touchStartX = e.touches[0].pageX;
        touchScrollLeft = container.scrollLeft;
        velocity = 0; 
    });

    container.addEventListener("touchmove", (e) => {
        const touchX = e.touches[0].pageX;
        const deltaX = touchX - touchStartX;
        container.scrollLeft = touchScrollLeft - deltaX;
        velocity = -deltaX * 0.8; // Capture swipe speed
        touchStartX = touchX;
    });

    container.addEventListener("touchend", () => {
        rafId = requestAnimationFrame(easeOut); // Apply inertia scrolling
    });
});
