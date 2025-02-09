var canvas = document.getElementById("backgroundCanvas");
var ctx = canvas.getContext("2d");
resize();
window.addEventListener("resize", resize);

var waveTime = 0;

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    for (let x = 0; x < canvas.width; x++) {
      let y = Math.sin((x / 100) + waveTime + i) * 50 + (i * 20) + canvas.height / 2;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  waveTime += 0.02;
  requestAnimationFrame(draw);
}

draw();