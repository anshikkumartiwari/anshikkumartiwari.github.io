var canvas = document.getElementById("backgroundCanvas");
var ctx = canvas.getContext("2d");
resize();
window.addEventListener("resize", resize);

var spiralTime = 0;

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
  ctx.beginPath();
  for (let i = 0; i < 100; i++) {
    let angle = i * 0.2 + spiralTime;
    let radius = i * 2;
    let x = Math.cos(angle) * radius + canvas.width / 2;
    let y = Math.sin(angle) * radius + canvas.height / 2;
    ctx.lineTo(x, y);
  }
  ctx.stroke();
  spiralTime += 0.05;
  requestAnimationFrame(draw);
}

draw();