var canvas = document.getElementById("backgroundCanvas");
var ctx = canvas.getContext("2d");

resize();
window.addEventListener("resize", resize);

var time = 0, velocity = 0.1, velocityTarget = 0.1;
var MAX_OFFSET = 400, SPACING = 4, POINTS = MAX_OFFSET / SPACING;
var PEAK = MAX_OFFSET * 0.25, POINTS_PER_LAP = 6, SHADOW_STRENGTH = 6;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function step() {
    time += velocity;
    velocity += (velocityTarget - velocity) * 0.3;
    clear();
    render();
    requestAnimationFrame(step);
}

function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function render() {
    var x, y, cx = canvas.width / 2, cy = canvas.height / 2;

    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = "#fff";
    ctx.shadowColor = "#fff";
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (var i = POINTS; i > 0; i--) {
        var value = i * SPACING + (time % SPACING);
        var ax = Math.sin(value / POINTS_PER_LAP) * Math.PI;
        var ay = Math.cos(value / POINTS_PER_LAP) * Math.PI;

        x = ax * value;
        y = ay * value * 0.35;
        var o = 1 - (Math.min(value, PEAK) / PEAK);

        y -= Math.pow(o, 2) * 200;
        y += 200 * value / MAX_OFFSET;
        y += x / cx * canvas.width * 0.1;

        ctx.globalAlpha = 1 - (value / MAX_OFFSET);
        ctx.shadowBlur = SHADOW_STRENGTH * o;

        ctx.lineTo(cx + x, cy + y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx + x, cy + y);
    }

    ctx.lineTo(cx, cy - 200);
    ctx.lineTo(cx, 0);
    ctx.stroke();
}

step();
