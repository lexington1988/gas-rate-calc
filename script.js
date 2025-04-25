
let startTime, endTime;

const startTimerBtn = document.getElementById("startTimerBtn");
const stopTimerBtn = document.getElementById("stopTimerBtn");
const timerDisplay = document.getElementById("timerDisplay");
const calculateBtn = document.getElementById("calculateBtn");
const resetBtn = document.getElementById("resetBtn");
const darkModeToggle = document.getElementById("darkModeToggle");
const modeSelector = document.getElementById("modeSelector");
const manualTimeInput = document.getElementById("manualTimeInput");
const timerSection = document.getElementById("timerSection");

modeSelector.addEventListener("change", () => {
  if (modeSelector.value === "manual") {
    manualTimeInput.style.display = "block";
    timerSection.style.display = "none";
  } else {
    manualTimeInput.style.display = "none";
    timerSection.style.display = "block";
  }
});

startTimerBtn.addEventListener("click", () => {
  startTime = new Date();
  startTimerBtn.disabled = true;
  stopTimerBtn.disabled = false;
  timerDisplay.textContent = "Timer started...";
});

stopTimerBtn.addEventListener("click", () => {
  endTime = new Date();
  const duration = Math.floor((endTime - startTime) / 1000);
  timerDisplay.textContent = `Timer stopped. Duration: ${duration} seconds`;
  stopTimerBtn.disabled = true;
  startTimerBtn.disabled = false;
});

calculateBtn.addEventListener("click", () => {
  const initialReading = parseFloat(document.getElementById("initialReading").value);
  const finalReading = parseFloat(document.getElementById("finalReading").value);
  const gasType = document.getElementById("gasTypeSelector").value;
  let timeElapsed;

  if (modeSelector.value === "manual") {
    timeElapsed = parseFloat(document.getElementById("manualTime").value);
  } else {
    if (!startTime || !endTime) {
      alert("Please start and stop the timer first.");
      return;
    }
    timeElapsed = Math.floor((endTime - startTime) / 1000);
  }

  const volumeUsed = finalReading - initialReading;
  if (volumeUsed <= 0 || isNaN(volumeUsed)) {
    alert("Please check your readings. Final reading must be greater than initial reading.");
    return;
  }

  const rate = gasType === "Natural Gas" 
    ? (volumeUsed / timeElapsed) * 3600 * 1.02264 * 39.3
    : (volumeUsed / timeElapsed) * 3600 * 1.02264 * 25.3;

  const resultText = `Gas Rate: ${rate.toFixed(2)} kW`;
  document.getElementById("result").textContent = resultText;
});

resetBtn.addEventListener("click", () => {
  document.getElementById("initialReading").value = "";
  document.getElementById("finalReading").value = "";
  document.getElementById("result").textContent = "";
  timerDisplay.textContent = "";
  startTimerBtn.disabled = false;
  stopTimerBtn.disabled = true;
  startTime = null;
  endTime = null;
});

darkModeToggle.addEventListener("change", () => {
  document.body.classList.toggle("dark-mode", darkModeToggle.checked);
});
