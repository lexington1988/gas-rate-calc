let timer;
let secondsLeft = 0;
let isPaused = false;

function init() {
  toggleMode();

  const darkModeToggle = document.getElementById("darkModeToggle");
  const darkModeSetting = localStorage.getItem("darkMode") === "true";

  document.body.classList.toggle("dark-mode", darkModeSetting);
  darkModeToggle.checked = darkModeSetting;

  darkModeToggle.addEventListener("change", () => {
    toggleDarkMode(darkModeToggle.checked);
  });

  // Set default timer display
  document.getElementById("timeLeft").textContent = "0:10";
}

function toggleMode() {
  const mode = document.getElementById("mode").value;
  const timerSection = document.getElementById("timerSection");
  const manualDuration = document.getElementById("manualDuration");
  const calculateBtn = document.getElementById("calculateBtn");

  if (mode === "manual") {
    timerSection.style.display = "none";
    manualDuration.style.display = "block";
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

  timeLeftEl.classList.remove("highlight");
  timeLeftEl.style.color = "#6a0dad";
  secondsLeft = duration;
  timeLeftEl.textContent = formatTime(secondsLeft);
  startBtn.disabled = true;
  pauseBtn.style.display = "inline-block";
  pauseBtn.textContent = "Pause";
  toggleInputs(true);

  timer = setInterval(() => {
    if (!isPaused) {
      secondsLeft--;

      if (secondsLeft <= 9) {
        timeLeftEl.style.color = "red";
      }

      if (secondsLeft > 0 && secondsLeft <= 5) {
        alertSound.pause();
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
        toggleInputs(false);
        pauseBtn.style.display = "none";
        alertSound.play();
      }
    }
  }, 1000);
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
  document.getElementById("mode").disabled = disabled;
  document.getElementById("duration").disabled = disabled;
}

function calculateRate() {
  const initial = parseFloat(document.getElementById("initial").value);
  const final = parseFloat(document.getElementById("final").value);
  const gasType = document.getElementById("gasType").value;
  const mode = document.getElementById("mode").value;
  const resultEl = document.getElementById("result");

  let duration;
  if (mode === "manual") {
    duration = parseFloat(document.getElementById("manualSeconds").value);
  } else {
    duration = parseFloat(document.getElementById("duration").value);
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
  timeLeft.textContent = "0:10";
  timeLeft.classList.remove("highlight");
  timeLeft.style.color = "#6a0dad";

  document.getElementById("startBtn").disabled = false;
  document.getElementById("calculateBtn").disabled = false;
  document.getElementById("pauseBtn").style.display = "none";

  toggleInputs(false);
  init();
}

function toggleDarkMode(enabled) {
  document.body.classList.toggle("dark-mode", enabled);
  localStorage.setItem("darkMode", enabled);
}
