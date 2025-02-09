var canvas = document.getElementById("backgroundCanvas");
var ctx = canvas.getContext("2d");
resize();
window.addEventListener("resize", resize);

var lines = [];
for (let i = 0; i < 50; i++) {
  lines.push({
    x1: Math.random() * canvas.width,
    y1: Math.random() * canvas.height,
    x2: Math.random() * canvas.width,
    y2: Math.random() * canvas.height,
    speedX: (Math.random() - 0.5) * 2,
    speedY: (Math.random() - 0.5) * 2,
  });
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
  lines.forEach(l => {
    l.x1 += l.speedX;
    l.y1 += l.speedY;
    l.x2 += l.speedX;
    l.y2 += l.speedY;
    if (l.x1 < 0 || l.x1 > canvas.width) l.speedX *= -1;
    if (l.y1 < 0 || l.y1 > canvas.height) l.speedY *= -1;
    ctx.beginPath();
    ctx.moveTo(l.x1, l.y1);
    ctx.lineTo(l.x2, l.y2);
    ctx.stroke();
  });
  requestAnimationFrame(draw);
}

draw();