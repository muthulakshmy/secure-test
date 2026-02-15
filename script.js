const ATTEMPT_ID = "ATTEMPT-12345";
const CANDIDATE = {
  name: "Mock Candidate",
  email: "mock.candidate@gmail.com"
};
const EVENT_KEY = "secure-test-events";

let violationCount = 0;
const MAX_VIOLATIONS = 20;

// Log Event
function logEvent(type, metadata = {}) {
  const event = {
    type,
    timestamp: new Date().toISOString(),
    attemptId: ATTEMPT_ID,
    metadata
  };

  const events = JSON.parse(localStorage.getItem(EVENT_KEY) || "[]");
  events.push(event);
  localStorage.setItem(EVENT_KEY, JSON.stringify(events));

  // print in UI
  const panel = document.getElementById("logPanel");
  if (panel) {
    const p = document.createElement("div");
    p.textContent = `${event.timestamp} - ${type}`;
    panel.prepend(p);
  }

  console.log(event);
}


function renderWatermark() {
  if (document.getElementById("watermark-layer")) return;

  const layer = document.createElement("div");
  layer.id = "watermark-layer";
  layer.className = "watermark-layer";

  const timestamp = new Date().toLocaleString();

  for (let i = 0; i < 24; i++) {
    const wm = document.createElement("div");
    wm.className = "watermark";
    wm.textContent = `${CANDIDATE.name} | ${CANDIDATE.email} | ${timestamp}`;
    layer.appendChild(wm);
  }

  document.body.appendChild(layer);
}


// Watermark Tampering Detection
let watermarkAlertShown = false;

setInterval(() => {
  const wm = document.getElementById("watermark-layer");

  if (!wm) {
    logEvent("WATERMARK_TAMPER");
    violation();
    if (!watermarkAlertShown) {
      alert("Watermark Tamper Attempted!");
      watermarkAlertShown = true;
    }
    renderWatermark();
  } else {
    watermarkAlertShown = false;
  }
}, 1000);


// Fullscreen Detection
let fullScreenAlertShown = false;

window.addEventListener("resize", () => {
  if (window.innerHeight === screen.height && !fullScreenAlertShown) {
    logEvent("FULLSCREEN");
    violation();
    alert("While Writing Test Fullscreen is required. Please do not exit fullscreen mode.");
    fullScreenAlertShown = true;
  }
});

// Tab Switch Detection
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    logEvent("TAB_SWITCH");
    violation();
    alert("Tab switch detected");
  }
});

// Copy-Paste Detection
document.addEventListener("copy", () => {
  logEvent("COPY");
  violation();
  alert("Copy not allowed");
});

document.addEventListener("paste", () => {
  logEvent("PASTE");
  violation();
  alert("Paste not allowed");
});

// DevTools Detection
setInterval(() => {
  if (window.outerWidth - window.innerWidth > 150) {
    logEvent("DEVTOOLS");
    violation();
  }
}, 1000);

// Page Refresh Detection
window.addEventListener("load", () => {
  const nav = performance.getEntriesByType("navigation")[0];
  if (nav && nav.type === "reload") {
    logEvent("REFRESH");
    alert("Page refresh detected");
  }
});

// Timer
let time = 10 * 60;

const timerInterval = setInterval(() => {
  const min = Math.floor(time / 60);
  const sec = time % 60;

  document.getElementById("timer").textContent =
    `${min}:${sec.toString().padStart(2, "0")}`;

  time--;
  if (time <= 0) {
    clearInterval(timerInterval);
    submitTest();
  }
}, 1000);

// Violation Handling
let isTestSubmitted = false;

function violation() {
  if (isTestSubmitted) return;
  violationCount++;
  if (violationCount >= MAX_VIOLATIONS) {
    alert("Too many violations. Auto submitting test.");
    submitTest();
  }
}

// Submit Test
function submitTest() {
  if (isTestSubmitted) return;

  isTestSubmitted = true;

  logEvent("TEST_SUBMITTED");

  const answer = document.getElementById("answer").value;

  // stop timers
  clearInterval(timerInterval);

  // disable textarea
  const answerBox = document.getElementById("answer");
  if (answerBox) answerBox.disabled = true;

  // disable buttons
  const btn = document.getElementById("submitBtn");
  if (btn) btn.disabled = true;

  // replace UI with submitted screen
  document.body.innerHTML = `
    <div style="
      display:flex;
      justify-content:center;
      align-items:center;
      height:100vh;
      font-family:Arial;
      flex-direction:column;
    ">
      <h1>Test Submitted</h1>
      <p>Thank you. Your responses have been recorded.</p>
    </div>
  `;

  console.log("Final Answer:", answer);
  console.log("Logs:", JSON.parse(localStorage.getItem(EVENT_KEY)));
}


// Initialize
renderWatermark();
logEvent("TEST_STARTED");
