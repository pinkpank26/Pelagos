const zones = [
  {
    zone: "Эпипелагиаль", title: ["Там, где", "есть свет"],
    description: "Первые 200 метров океана. Здесь солнечный свет питает планктон, а у поверхности можно встретить горбатого кита.",
    animal: "Горбатый кит", latin: "Megaptera novaeangliae",
    range: "0–200 м", light: "Достаточно для фотосинтеза"
  },
  {
    zone: "Мезопелагиаль", title: ["Зона", "сумерек"],
    description: "С поверхности сюда доходит лишь слабый свет. В полумраке легче заметить полупрозрачных медуз и других обитателей открытой воды.",
    animal: "Глубоководная медуза", latin: "Scyphozoa",
    range: "200–1 000 м", light: "Рассеянный полумрак"
  },
  {
    zone: "Батипелагиаль", title: ["Вечная", "полночь"],
    description: "Солнечный свет сюда уже не проникает. Глубоководный удильщик подманивает добычу светящейся приманкой над пастью.",
    animal: "Глубоководный удильщик", latin: "Ceratioidei",
    range: "1 000–4 000 м", light: "Полная темнота"
  },
  {
    zone: "Абиссопелагиаль", title: ["У края", "бездны"],
    description: "Над равнинами океанского дна царит темнота. Осьминог Дамбо движется в толще воды, взмахивая плавниками, похожими на уши.",
    animal: "Осьминог Дамбо", latin: "Grimpoteuthis",
    range: "4 000–6 000 м", light: "Полная темнота"
  },
  {
    zone: "Хадаль", title: ["На дне", "желобов"],
    description: "Глубже шести километров начинаются океанические желоба. В их холодной воде под огромным давлением живут рыбы-слизни.",
    animal: "Рыба-слизень", latin: "Liparidae",
    range: "От 6 000 м", light: "Полная темнота"
  }
];

const markers = [...document.querySelectorAll("[data-zone]")];
const scenes = [...document.querySelectorAll(".scene")];
const next = document.querySelector("#next");
const dialog = document.querySelector("#project");
const depths = [0, 200, 1000, 4000, 6000];
const transit = document.querySelector("#transit");
const transitDirection = document.querySelector("#transit-direction");
const transitDepth = document.querySelector("#transit-depth");
const transitProgress = document.querySelector("#transit-progress");
const canvas = document.querySelector("#water-particles");
const water = canvas.getContext("2d");
const depthFormat = new Intl.NumberFormat("ru-RU");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const particles = Array.from({ length: 100 }, () => ({
  x: Math.random(),
  y: Math.random(),
  size: 0.5 + Math.random() * 1.8,
  speed: 0.15 + Math.random() * 0.95
}));
let active = 0;
let target = 0;
let currentDepth = 0;
let frame = 0;

function drawWater(depth, travel, direction) {
  const daylight = Math.exp(-depth / 460);
  const ambient = Math.exp(-depth / 2400);
  transit.style.setProperty("--daylight", daylight);
  transit.style.setProperty("--water-top", `rgb(${5 + 16 * daylight} ${14 + 64 * daylight + 10 * ambient} ${29 + 77 * daylight + 15 * ambient})`);
  transit.style.setProperty("--water-bottom", `rgb(3 ${8 + 23 * ambient} ${16 + 36 * ambient})`);
  if (!water) return;

  const { width, height } = canvas;
  water.clearRect(0, 0, width, height);
  for (const particle of particles) {
    const x = particle.x * width;
    const y = ((particle.y - travel * particle.speed) % 1 + 1) % 1 * height;
    const trail = direction * particle.speed * 14;
    water.strokeStyle = `rgba(164, 227, 245, ${0.08 + particle.speed * 0.35})`;
    water.lineWidth = particle.size;
    water.beginPath();
    water.moveTo(x, y);
    water.lineTo(x + 1, y + trail);
    water.stroke();
  }
}

function showZone(index) {
  if (index === target) return;
  target = index;
  cancelAnimationFrame(frame);
  if (reducedMotion.matches) {
    currentDepth = depths[index];
    transit.classList.remove("in-water");
    revealZone(index);
    return;
  }

  const origin = currentDepth;
  const destination = depths[index];
  const direction = destination >= origin ? 1 : -1;
  const duration = Math.min(4300, 2300 + Math.abs(destination - origin) / 3);
  const initialOpacity = transit.classList.contains("in-water") ? Number(transit.style.opacity) : 0;
  const bounds = transit.getBoundingClientRect();
  canvas.width = Math.max(1, Math.round(bounds.width));
  canvas.height = Math.max(1, Math.round(bounds.height));
  transitDirection.textContent = direction > 0 ? "Погружение" : "Подъём";
  transit.classList.add("in-water");
  const start = performance.now();

  function render(now) {
    const progress = Math.min(1, (now - start) / duration);
    const travel = Math.min(1, progress / 0.8);
    const eased = travel * travel * (3 - 2 * travel);
    currentDepth = origin + (destination - origin) * eased;
    transitDepth.textContent = depthFormat.format(Math.round(currentDepth));
    transitProgress.style.transform = `scaleX(${travel})`;
    const fadeIn = Math.min(1, initialOpacity + progress / 0.15);
    const fadeOut = Math.min(1, (1 - progress) / 0.2);
    const visibility = Math.min(fadeIn, fadeOut);
    transit.style.opacity = String(visibility);
    transit.style.setProperty("--reading-opacity", Math.max(0, (visibility - 0.85) / 0.15));
    drawWater(currentDepth, direction * progress * 2, direction);

    if (progress >= 0.8 && active !== index) revealZone(index);
    if (progress < 1) {
      frame = requestAnimationFrame(render);
    } else {
      transit.classList.remove("in-water");
    }
  }
  frame = requestAnimationFrame(render);
}

function revealZone(index) {
  scenes.forEach((scene, position) => scene.classList.toggle("current", position === index));
  const zone = zones[index];
  active = index;
  for (const field of ["zone", "description", "animal", "latin", "range", "light"]) {
    document.getElementById(field).textContent = zone[field];
  }
  document.querySelector("#title").replaceChildren(
    zone.title[0], document.createElement("br"), zone.title[1]
  );
  markers.forEach((marker, position) => {
    if (position === index) marker.setAttribute("aria-current", "step");
    else marker.removeAttribute("aria-current");
  });
  const deepest = index === zones.length - 1;
  document.querySelector("#count").textContent = String(index + 1).padStart(2, "0");
  document.querySelector("#action").textContent = deepest ? "Вернуться к поверхности" : "Погрузиться глубже";
  document.querySelector("#direction").textContent = deepest ? "↑" : "↓";
}

markers.forEach((marker, index) => {
  marker.addEventListener("click", () => showZone(index));
  marker.addEventListener("keydown", (event) => {
    const offsets = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
    const offset = offsets[event.key];
    if (offset === undefined) return;
    event.preventDefault();
    const position = (index + offset + zones.length) % zones.length;
    showZone(position);
    markers[position].focus();
  });
});
next.addEventListener("click", () => showZone((target + 1) % zones.length));
document.querySelector("#about").addEventListener("click", () => dialog.showModal());
