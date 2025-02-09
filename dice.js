document.addEventListener("DOMContentLoaded", function () {
    // Initialize Scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(150, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true }); // Enable transparency
    renderer.setClearColor(0x000000, 0); // Set background to transparent
    renderer.setSize(200, 200); // Small like a button
    const diceContainer = document.getElementById("dice-3d");
    diceContainer.appendChild(renderer.domElement);

    // Load GLTF Model
    const loader = new THREE.GLTFLoader();
    let dice;
    let isRolling = false;

    loader.load('assets/scene.gltf', function (gltf) {
        dice = gltf.scene;
        // Ensure correct scale and position
        dice.scale.set(1.5, 1.5, 1.5);
        dice.position.set(0, 0, 0);
        dice.rotation.set(0, 0, 0);

        // Ensure materials and textures are applied
        dice.traverse((node) => {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
                node.material.needsUpdate = true; // Ensure materials refresh
            }
        });

        scene.add(dice);
    });

    // Lighting Setup (to make the model look correct)
    const light = new THREE.DirectionalLight(0xffffff, 2);
    light.position.set(3, 5, 2);
    scene.add(light);
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    camera.position.z = 3;

    function rollDice() {
        if (isRolling || !dice) return; // Prevent multiple rolls
        isRolling = true;

        // Define animation parameters
        const frames = 120; // Total frames for animation (slower animation)
        let frame = 0;

        // Initial upward movement and scaling
        let startY = 0;
        let velocityY = 0.05; // Initial upward velocity
        let gravity = 0.001; // Gravity force
        let maxScale = 1.8; // Maximum enlargement

        // Track total rotations
        let totalRotation = { x: 0, y: 0, z: 0 };

        function animateRoll() {
            if (frame < frames) {
                // Apply gravity
                velocityY -= gravity;
                dice.position.y += velocityY;

                // Enlarge the dice during the first half of the animation
                if (frame < frames / 2) {
                    let scaleFactor = 1.5 + ((maxScale - 1.5) * frame) / (frames / 2);
                    dice.scale.set(scaleFactor, scaleFactor, scaleFactor);
                } else {
                    // Shrink back to original size during the second half
                    let scaleFactor =
                        maxScale - ((maxScale - 1.5) * (frame - frames / 2)) / (frames / 2);
                    dice.scale.set(scaleFactor, scaleFactor, scaleFactor);
                }

                // Rotate the dice
                dice.rotation.x += Math.PI / frames;
                dice.rotation.y += Math.PI / frames;
                dice.rotation.z += Math.PI / frames;

                // Accumulate total rotations
                totalRotation.x += Math.PI / frames;
                totalRotation.y += Math.PI / frames;
                totalRotation.z += Math.PI / frames;

                frame++;
                requestAnimationFrame(animateRoll);
            } else {
                // Snap to the nearest face
                snapToNearestFace(totalRotation);

                // Return to original position
                dice.position.set(0, 0, 0);
                dice.scale.set(1.5, 1.5, 1.5);
                isRolling = false;

                // Change Canvas After Roll Completes
                changeCanvas();
            }
        }

        animateRoll();
    }

    function snapToNearestFace(totalRotation) {
        // Convert total rotations to degrees
        let xDeg = (totalRotation.x * 180) / Math.PI;
        let yDeg = (totalRotation.y * 180) / Math.PI;
        let zDeg = (totalRotation.z * 180) / Math.PI;

        // Normalize angles to [0, 360)
        xDeg = ((xDeg % 360) + 360) % 360;
        yDeg = ((yDeg % 360) + 360) % 360;
        zDeg = ((zDeg % 360) + 360) % 360;

        // Determine the dominant axis (closest to a multiple of 90 degrees)
        let xSnap = Math.round(xDeg / 90) * 90;
        let ySnap = Math.round(yDeg / 90) * 90;
        let zSnap = Math.round(zDeg / 90) * 90;

        // Snap the dice to the nearest face
        dice.rotation.set(
            (xSnap * Math.PI) / 180,
            (ySnap * Math.PI) / 180,
            (zSnap * Math.PI) / 180
        );

        // Log the face number (optional)
        console.log(`Dice landed on face: ${getFaceNumber(xSnap, ySnap, zSnap)}`);
    }

    function getFaceNumber(xSnap, ySnap, zSnap) {
        // Map snapped angles to face numbers (1 to 6)
        if (xSnap === 0 && ySnap === 0 && zSnap === 0) return 1;
        if (xSnap === 90 && ySnap === 0 && zSnap === 0) return 2;
        if (xSnap === 180 && ySnap === 0 && zSnap === 0) return 3;
        if (xSnap === 270 && ySnap === 0 && zSnap === 0) return 4;
        if (xSnap === 0 && ySnap === 90 && zSnap === 0) return 5;
        if (xSnap === 0 && ySnap === 270 && zSnap === 0) return 6;
        return 1; // Default face
    }

    function changeCanvas() {
        let canvasScripts = ["canvas.js", "canvas1.js", "canvas2.js", "canvas3.js"];
        let newCanvas;
        do {
            newCanvas = canvasScripts[Math.floor(Math.random() * canvasScripts.length)];
        } while (newCanvas === activeCanvas);
        activeCanvas = newCanvas;
        loadCanvasScript(activeCanvas);
    }

    diceContainer.addEventListener("click", rollDice);

    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }

    animate();
});