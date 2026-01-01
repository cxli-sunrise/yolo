const video = document.getElementById("video");
const overlay = document.getElementById("overlay");
const startCamera = document.getElementById("startCamera");
const stopCamera = document.getElementById("stopCamera");
const detectBtn = document.getElementById("detectBtn");
const snapshotBtn = document.getElementById("snapshotBtn");
const uploadInput = document.getElementById("uploadInput");
const statusBox = document.getElementById("status");
const placeholder = document.getElementById("placeholder");
const resultBox = document.getElementById("result");
const tipsList = document.getElementById("tips");

let stream;

const sampleResults = [
  {
    name: "稻瘟病",
    confidence: 0.92,
    risk: "高风险",
    tip: "建议立即喷施三环唑，注意隔离病株。",
  },
  {
    name: "蚜虫侵害",
    confidence: 0.88,
    risk: "中风险",
    tip: "使用高效低毒杀虫剂，并加强通风。",
  },
  {
    name: "白粉病",
    confidence: 0.84,
    risk: "中风险",
    tip: "减少氮肥施用，喷施硫磺制剂。",
  },
];

const statusText = (text, active = false) => {
  statusBox.querySelector("span:last-child").textContent = text;
  statusBox.style.background = active
    ? "rgba(32, 201, 151, 0.12)"
    : "rgba(255, 188, 66, 0.16)";
  statusBox.style.color = active ? "#1f9c74" : "#b26a00";
};

const resizeOverlay = () => {
  overlay.width = video.videoWidth || video.clientWidth;
  overlay.height = video.videoHeight || video.clientHeight;
};

const drawDetections = (detections) => {
  const ctx = overlay.getContext("2d");
  ctx.clearRect(0, 0, overlay.width, overlay.height);
  detections.forEach((det) => {
    ctx.strokeStyle = det.color;
    ctx.lineWidth = 3;
    ctx.strokeRect(det.x, det.y, det.w, det.h);
    ctx.fillStyle = det.color;
    ctx.font = "16px sans-serif";
    ctx.fillText(`${det.label} ${Math.round(det.score * 100)}%`, det.x + 6, det.y + 20);
  });
};

const renderResults = (items) => {
  resultBox.innerHTML = "";
  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "result-item";
    card.innerHTML = `
      <strong>${item.name}</strong>
      <div class="result-meta">
        <span>置信度 ${Math.round(item.confidence * 100)}%</span>
        <span>${item.risk}</span>
      </div>
    `;
    resultBox.appendChild(card);
  });

  tipsList.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item.tip;
    tipsList.appendChild(li);
  });
};

const simulateDetections = () => {
  const selection = sampleResults.sort(() => 0.5 - Math.random()).slice(0, 2);
  const detections = selection.map((item, index) => ({
    label: item.name,
    score: item.confidence,
    color: index === 0 ? "#20c997" : "#ff9f43",
    x: 60 + index * 180,
    y: 80 + index * 60,
    w: 180,
    h: 140,
  }));
  drawDetections(detections);
  renderResults(selection);
};

const connectCamera = async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false,
    });
    video.srcObject = stream;
    placeholder.style.display = "none";
    detectBtn.disabled = false;
    snapshotBtn.disabled = false;
    stopCamera.disabled = false;
    statusText("摄像头已连接，等待识别。", true);
  } catch (error) {
    statusText("摄像头连接失败，请检查权限设置。", false);
  }
};

const stopStream = () => {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }
  video.srcObject = null;
  placeholder.style.display = "grid";
  detectBtn.disabled = true;
  snapshotBtn.disabled = true;
  stopCamera.disabled = true;
  statusText("摄像头已关闭。", false);
};

startCamera.addEventListener("click", connectCamera);
stopCamera.addEventListener("click", stopStream);

video.addEventListener("loadedmetadata", () => {
  resizeOverlay();
});

window.addEventListener("resize", () => {
  resizeOverlay();
});

detectBtn.addEventListener("click", () => {
  if (!stream && video.srcObject === null) {
    statusText("请先开启摄像头或上传图片。", false);
    return;
  }
  statusText("识别中，正在分析图像...", true);
  setTimeout(() => {
    simulateDetections();
    statusText("识别完成，已更新结果。", true);
  }, 600);
});

snapshotBtn.addEventListener("click", () => {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth || overlay.width;
  canvas.height = video.videoHeight || overlay.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const link = document.createElement("a");
  link.download = `snapshot-${Date.now()}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
});

uploadInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  video.srcObject = null;
  video.src = url;
  video.play();
  placeholder.style.display = "none";
  detectBtn.disabled = false;
  snapshotBtn.disabled = true;
  stopCamera.disabled = true;
  statusText("图片已加载，点击开始识别。", true);
  video.onloadeddata = () => {
    resizeOverlay();
  };
});
