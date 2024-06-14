document.addEventListener('DOMContentLoaded', (event) => {
    function getGreeting() {
        const now = new Date();
        const hours = now.getHours();
        let greeting;

        if (hours >= 5 && hours < 12) {
            greeting = "Morning,";
        } else if (hours >= 12 && hours < 17) {
            greeting = "Afternoon,";
        } else {
            greeting = "Evening,";
        }

        document.getElementById("greeting").innerText = greeting;
    }

    function setupQuoteToggle(quoteElement, changeContent, revertContent, positionChange) {
        const changeQuote = () => {
            quoteElement.innerHTML = changeContent;
            if (positionChange) quoteElement.style.left = positionChange.change;
        };

        const revertQuote = () => {
            quoteElement.innerHTML = revertContent;
            if (positionChange) quoteElement.style.left = positionChange.revert;
        };

        quoteElement.addEventListener('mouseover', changeQuote);
        quoteElement.addEventListener('mouseout', revertQuote);
        quoteElement.addEventListener('touchstart', changeQuote);
        quoteElement.addEventListener('touchend', revertQuote);
    }

    setupQuoteToggle(
        document.getElementById('quote'),
        '<span>"</span>cosmos resides within self<span>"</span>',
        '<span>"</span>ātmani vidyate viśvam<span>"</span>',
        { change: '52%', revert: '60%' }
    );

    setupQuoteToggle(
        document.getElementById('quote2'),
        '<span>"</span>There\'s no place like HOME<span>"</span>',
        '<span>"</span>There\'s no place like <span class="localhost" id="localhost">127.0.0.1</span><span>"</span>',
        null
    );

    let shouldReset = true;

    const boxes = document.querySelectorAll('.box');

    function handleMove(event) {
        const box = event.currentTarget;
        const boxRect = box.getBoundingClientRect();

        let mouseX, mouseY;
        if (event.type.startsWith('touch')) {
            mouseX = event.touches[0].clientX;
            mouseY = event.touches[0].clientY;
        } else {
            mouseX = event.clientX;
            mouseY = event.clientY;
        }

        const boxCenterX = boxRect.left + box.offsetWidth / 2;
        const boxCenterY = boxRect.top + box.offsetHeight / 2;
        const relativeX = mouseX - boxCenterX;
        const relativeY = mouseY - boxCenterY;

        const percentX = relativeX / (box.offsetWidth / 2);
        const percentY = relativeY / (box.offsetHeight / 2);

        const tiltX = percentY * 10;
        const tiltY = -percentX * 10;

        box.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(10px)`;
    }

    function handleLeave(event) {
        const box = event.currentTarget;
        if (shouldReset) {
            box.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)';
        }
    }

    boxes.forEach(box => {
        box.addEventListener('mousemove', handleMove);
        box.addEventListener('mouseleave', handleLeave);
        box.addEventListener('touchmove', handleMove);
        box.addEventListener('touchend', handleLeave);
    });

    function toggleResetBehavior() {
        shouldReset = !shouldReset;
    }

    document.getElementById('toggleReset').addEventListener('change', toggleResetBehavior);

    getGreeting();
});
