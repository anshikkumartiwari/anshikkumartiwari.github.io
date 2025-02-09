document.addEventListener("DOMContentLoaded", function () {
    const container = document.querySelector(".projects-container");

    let isScrolling = false;
    let scrollSpeed = 0;

    container.addEventListener("mousemove", function (event) {
        const { left, width } = container.getBoundingClientRect();
        const mouseX = event.clientX - left;
        const centerX = width / 2;

        // Determine scroll speed based on mouse position
        if (mouseX < centerX) {
            scrollSpeed = -((centerX - mouseX) / centerX) * 5;
        } else {
            scrollSpeed = ((mouseX - centerX) / centerX) * 5;
        }

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

    // Allow manual scrolling with mouse/touchpad
    let isDragging = false;
    let startX, scrollLeft;

    container.addEventListener("mousedown", (e) => {
        isDragging = true;
        startX = e.pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
        container.style.cursor = "grabbing";
    });

    container.addEventListener("mouseleave", () => {
        isDragging = false;
        container.style.cursor = "grab";
    });

    container.addEventListener("mouseup", () => {
        isDragging = false;
        container.style.cursor = "grab";
    });

    container.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - container.offsetLeft;
        const walk = (x - startX) * 2; // Adjust speed
        container.scrollLeft = scrollLeft - walk;
    });

    // Enable touch support for mobile users
    let touchStartX, touchScrollLeft;

    container.addEventListener("touchstart", (e) => {
        touchStartX = e.touches[0].pageX - container.offsetLeft;
        touchScrollLeft = container.scrollLeft;
    });

    container.addEventListener("touchmove", (e) => {
        if (!touchStartX) return;
        const touchX = e.touches[0].pageX - container.offsetLeft;
        const walk = (touchX - touchStartX) * 2; // Adjust speed
        container.scrollLeft = touchScrollLeft - walk;
    });
});
