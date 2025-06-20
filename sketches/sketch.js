const { Responsive } = P5Template;

let video;
let cols = 64;
let rows = 48;
let cellSize = 12;
let ripples = [];

let rippleInterval = 30;
let framesSinceLastRipple = 0;

let isInverted = false; // 반전 상태 저장

function setup() {
  new Responsive().createResponsiveCanvas(
    cols * cellSize,
    rows * cellSize,
    'contain',
    true
  );
  pixelDensity(1);

  video = createCapture(VIDEO);
  video.size(cols, rows);
  video.hide();

  noStroke();
  ellipseMode(RADIUS);
  frameRate(60);
}

function draw() {
  video.loadPixels();

  background(isInverted ? 255 : 0);

  // 자동 파동 생성
  framesSinceLastRipple++;
  if (framesSinceLastRipple > rippleInterval) {
    ripples.push(makeRipple(random(width), random(height), 10, 1.0));
    framesSinceLastRipple = 0;
  }

  push();
  translate(width, 0);
  scale(-1, 1);

  if (video.pixels.length > 0) {
    for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
      for (let colIndex = 0; colIndex < cols; colIndex++) {
        let pixelIndex = (colIndex + rowIndex * cols) * 4;
        let r = video.pixels[pixelIndex];
        let g = video.pixels[pixelIndex + 1];
        let b = video.pixels[pixelIndex + 2];

        let brightness = (r + g + b) / 3 / 255;
        brightness = pow(brightness, 0.65);
        brightness = constrain(brightness, 0, 1);

        let dotBaseSize = map(brightness, 0, 1, 1, cellSize * 0.8);
        let centerX = colIndex * cellSize + cellSize / 2;
        let centerY = rowIndex * cellSize + cellSize / 2;

        let maxEffect = 0;

        for (let ripple of ripples) {
          let rippleAge = frameCount - ripple.startFrame;

          for (let ring = 0; ring < ripple.ringCount; ring++) {
            let ringAge = rippleAge - ring * ripple.ringGap;
            if (ringAge < 0) continue;

            let radius = ringAge * ripple.growthSpeed;
            let alpha = pow(ripple.alphaDecay, ringAge);

            let distToCenter = dist(centerX, centerY, ripple.x, ripple.y);
            let diff = abs(distToCenter - radius);
            let range = 20;

            if (diff < range) {
              let strength = (range - diff) / range;
              let randomSize = random(0.92, 1.08);
              let effect = strength * alpha * ripple.strength * randomSize;
              if (effect > maxEffect) maxEffect = effect;
            }
          }
        }

        let finalSize = dotBaseSize + maxEffect;
        fill(isInverted ? 0 : 255, 255 * (finalSize / (cellSize * 1.5)));
        ellipse(centerX, centerY, finalSize / 2, finalSize / 2);
      }
    }
  }

  pop();

  ripples = ripples.filter((r) => frameCount - r.startFrame < r.lifeSpan);
}

function mousePressed() {
  let correctedX = width - mouseX;
  ripples.push(makeRipple(correctedX, mouseY, 15, 0.4));
  isInverted = !isInverted; // 색 반전 토글
}

function makeRipple(x, y, strength, alpha = 1.0) {
  return {
    x: x,
    y: y,
    strength: strength,
    startFrame: frameCount,
    ringCount: floor(random(1, 5)),
    ringGap: 5,
    growthSpeed: 7.0,
    alphaDecay: 0.92,
    alpha: alpha,
    lifeSpan: 200,
  };
}
