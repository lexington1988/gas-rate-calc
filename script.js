let timer;
let secondsLeft = 0;
let isPaused = false;
let isImperial = false;
let stopwatchStartTime = 0;

function init() {
  toggleMode();

  const darkModeToggle = document.getElementById("darkModeToggle");
  const imperialToggle = document.getElementById("imperialToggle");
  const darkModeSetting = localStorage.getItem("darkMode") === "true";
  const imperialSetting = localStorage.getItem("imperialMode") === "true";

  document.body.classList.toggle("dark-mode", darkModeSetting);
  darkModeToggle.checked = darkModeSetting;

  isImperial = imperialSetting;
  imperialToggle.checked = imperialSetting;
  updateImperialStatus();
  applyImperialRestrictions();

  darkModeToggle.addEventListener("change", () => {
    toggleDarkMode(darkModeToggle.checked);
  });

  imperialToggle.addEventListener("change", () => {
    toggleImperialMode(imperialToggle.checked);
  });
}

function toggleDarkMode(enabled) {
  document.body.classList.toggle("dark-mode", enabled);
  localStorage.setItem("darkMode", enabled);
}

function toggleImperialMode(enabled) {
  isImperial = enabled;
  localStorage.setItem("imperialMode", enabled);
  updateImperialStatus();
  applyImperialRestrictions();
  toggleMode(); // Update UI based on new imperial state
}

function updateImperialStatus() {
  const status = document.getElementById("imperialStatus");
  status.textContent = isImperial ? "Imperial Mode Active" : "";
}

function applyImperialRestrictions() {
  const modeSelect = document.getElementById("mode");
  const durationInput = document.getElementById("duration");

  modeSelect.disabled = isImperial;
  durationInput.disabled = isImperial;
}

function toggleMode() {
  const mode = document.getElementById("mode").value;
  const timerSection = document.getElementById("timerSection");
  const manualDuration = document.getElementById("manualDuration");
  const calculateBtn = document.getElementById("calculateBtn");

  if (mode === "manual" || isImperial) {
    timerSection.style.display = isImperial ? "block" : "none";
    manualDuration.style.display = isImperial ? "none" : "block";
    calculateBtn.disabled = false;
  } else {
    timerSection.style.display = "block";
    manualDuration.style.display = "none";
    calculateBtn.disabled = true;
  }
}

function startTimer() {
  const duration = parseInt(document.getElementById("duration").value);
  const timeLeftEl = document.getElementById("timeLeft");
  const startBtn = document.getElementById("startBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const alertSound = document.getElementById("alertSound");

  clearInterval(timer);
  timer = null;
  isPaused = false;
  secondsLeft = isImperial ? 0 : duration;
  stopwatchStartTime = Date.now();

  timeLeftEl.classList.remove("highlight");
  timeLeftEl.style.color = "#6a0dad";
  timeLeftEl.textContent = formatTime(secondsLeft);
  startBtn.disabled = false;
  document.getElementById("calculateBtn").disabled = true;
  pauseBtn.style.display = "inline-block";
  pauseBtn.textContent = "Pause";

  document.getElementById("gasType").disabled = true;

  if (!isImperial) {
    document.getElementById("mode").disabled = true;
    document.getElementById("duration").disabled = true;
  }

  if (isImperial) {
    // Stopwatch mode
    timer = setInterval(() => {
      if (!isPaused) {
        secondsLeft++;
        timeLeftEl.textContent = formatTime(secondsLeft);
      }
    }, 1000);
  } else {
    // Countdown mode
    timer = setInterval(() => {
      if (!isPaused) {
        secondsLeft--;

        if (secondsLeft <= 9) {
          timeLeftEl.style.color = "red";
        }

        if (secondsLeft > 0 && secondsLeft <= 5) {
          alertSound.currentTime = 0;
          alertSound.play();
        }

        timeLeftEl.textContent = formatTime(secondsLeft);

        if (secondsLeft <= 0) {
          clearInterval(timer);
          timer = null;
          timeLeftEl.textContent = "Timer finished!";
          timeLeftEl.classList.add("highlight");
          startBtn.disabled = false;
          document.getElementById("calculateBtn").disabled = false;
          pauseBtn.style.display = "none";
          alertSound.play();
          toggleInputs(false);
        }
      }
    }, 1000);
  }
}

function togglePauseResume() {
  isPaused = !isPaused;
  document.getElementById("pauseBtn").textContent = isPaused ? "Resume" : "Pause";
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function toggleInputs(disabled) {
  document.getElementById("initial").disabled = disabled;
  document.getElementById("final").disabled = disabled;
  document.getElementById("gasType").disabled = disabled;

  // These are conditionally disabled elsewhere when imperial is true
  if (!isImperial) {
    document.getElementById("mode").disabled = disabled;
    document.getElementById("duration").disabled = disabled;
  }
}

function calculateRate() {
  const initial = parseFloat(document.getElementById("initial").value);
  const final = parseFloat(document.getElementById("final").value);
  const gasType = document.getElementById("gasType").value;
  const mode = document.getElementById("mode").value;
  const resultEl = document.getElementById("result");

  let duration;
  if (mode === "manual" && !isImperial) {
    duration = parseFloat(document.getElementById("manualSeconds").value);
  } else {
    duration = isImperial ? secondsLeft : parseFloat(document.getElementById("duration").value);
  }

  if (isNaN(initial) || isNaN(final)) {
    resultEl.textContent = "Please enter both initial and final readings.";
    return;
  }
  if (isNaN(duration) || duration <= 0) {
    resultEl.textContent = "Duration must be greater than zero.";
    return;
  }
  if (final <= initial) {
    resultEl.textContent = "Final reading must be greater than initial reading.";
    return;
  }

  const usage = final - initial;
  const volumePerHour = (usage * 3600) / duration;

  let calorificValue = gasType === "natural" ? 10.76 : 26.39;
  const grossKW = volumePerHour * calorificValue;
  const netKW = grossKW / 1.11;

  resultEl.innerHTML = `
    <strong>Gas Usage Rate:</strong> ${volumePerHour.toFixed(2)} m³/h<br/>
    <strong>Gross kW:</strong> ${grossKW.toFixed(2)}<br/>
    <strong>Net kW:</strong> ${netKW.toFixed(2)}
  `;

  resultEl.scrollIntoView({ behavior: "smooth" });
}

function resetForm() {
  clearInterval(timer);
  timer = null;
  secondsLeft = 0;
  isPaused = false;

  document.getElementById("initial").value = "";
  document.getElementById("final").value = "";
  document.getElementById("result").innerHTML = "";

  const timeLeft = document.getElementById("timeLeft");
  timeLeft.textContent = "0:00";
  timeLeft.classList.remove("highlight");
  timeLeft.style.color = "#6a0dad";

  document.getElementById("startBtn").disabled = false;
  document.getElementById("calculateBtn").disabled = false;
  document.getElementById("pauseBtn").style.display = "none";

  toggleInputs(false);
  init();
}
