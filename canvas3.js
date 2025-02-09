var canvas = document.getElementById("backgroundCanvas");
var ctx = canvas.getContext("2d");
resize();
window.addEventListener("resize", resize);

var hexagons = [];
for (let i = 0; i < 10; i++) {
  hexagons.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 50 + 20,
    angle: Math.random() * Math.PI * 2,
    speed: Math.random() * 0.02 + 0.01,
  });
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
  ctx.lineWidth = 2;
  hexagons.forEach(h => {
    h.angle += h.speed;
    let x = h.x + Math.cos(h.angle) * 50;
    let y = h.y + Math.sin(h.angle) * 50;
    drawHexagon(ctx, x, y, h.size);
  });
  requestAnimationFrame(draw);
}

function drawHexagon(ctx, x, y, size) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    let angle = (Math.PI / 3) * i;
    let px = x + Math.cos(angle) * size;
    let py = y + Math.sin(angle) * size;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
}

draw();