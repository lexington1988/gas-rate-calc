let countdown;
let stopwatchInterval;
let time = 0;
let isPaused = false;
let imperialMode = false;

function init() {
  document.getElementById('darkModeToggle').addEventListener('change', toggleDarkMode);
  document.getElementById('imperialToggle').addEventListener('change', toggleImperialMode);
  toggleMode();
}

function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
}

function toggleImperialMode() {
  imperialMode = document.getElementById('imperialToggle').checked;
  const status = document.getElementById('imperialStatus');
  const durationLabel = document.querySelector('label[for="duration"]');
  const modeSelect = document.getElementById('mode');
  const imperialVolumeSection = document.getElementById('imperialVolumeSection');
  const imperialVolumeInput = document.getElementById('imperialVolume');
  const meterReadings = document.getElementById('meterReadings');

  // Reset timer when switching mode
  resetTimerOnly();

  const manualOption = [...modeSelect.options].find(opt => opt.value === 'manual');

  if (imperialMode) {
    status.textContent = 'Imperial mode activated';
    modeSelect.value = 'timer';

    if (manualOption) {
      modeSelect.removeChild(manualOption);
    }

    imperialVolumeSection.style.display = 'block';
    imperialVolumeInput.value = '1';
    imperialVolumeInput.readOnly = true;
    meterReadings.style.display = 'none';
    durationLabel.style.display = 'none';
    document.getElementById('duration').style.display = 'none';
  } else {
    status.textContent = '';

    if (!manualOption) {
      const newOption = document.createElement('option');
      newOption.value = 'manual';
      newOption.textContent = 'Manual Entry';
      modeSelect.insertBefore(newOption, modeSelect.firstChild);
    }

    imperialVolumeSection.style.display = 'none';
    imperialVolumeInput.readOnly = false;
    meterReadings.style.display = 'block';
    durationLabel.style.display = '';
    document.getElementById('duration').style.display = '';
  }

  toggleMode();
}

function toggleMode() {
  const mode = document.getElementById('mode').value;
  const manualSection = document.getElementById('manualDuration');
  const timerSection = document.getElementById('timerSection');

  if (mode === 'manual') {
    manualSection.style.display = 'block';
    timerSection.style.display = 'none';
  } else {
    manualSection.style.display = 'none';
    timerSection.style.display = 'block';
  }
}

function startTimer() {
  const startBtn = document.getElementById('startBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const timeLeft = document.getElementById('timeLeft');

  if (imperialMode) {
    if (!stopwatchInterval) {
      time = 0;
      startBtn.textContent = 'Stop Timer';
      timeLeft.textContent = formatTime(time);
      stopwatchInterval = setInterval(() => {
        if (!isPaused) {
          time++;
          timeLeft.textContent = formatTime(time);
        }
      }, 1000);
    } else {
      clearInterval(stopwatchInterval);
      stopwatchInterval = null;
      startBtn.textContent = 'Start Timer';
    }
    return;
  }

  const duration = parseInt(document.getElementById('duration').value);
  let secondsLeft = duration;

  clearInterval(countdown);
  startBtn.style.display = 'none';
  pauseBtn.style.display = 'inline-block';
  timeLeft.classList.remove('highlight');

  countdown = setInterval(() => {
    if (!isPaused) {
      secondsLeft--;
      timeLeft.textContent = formatTime(secondsLeft);
      if (secondsLeft <= 5) {
        timeLeft.classList.add('highlight');
        playBeep();
      }
      if (secondsLeft <= 0) {
        clearInterval(countdown);
        document.getElementById('startBtn').style.display = 'inline-block';
        pauseBtn.style.display = 'none';
        timeLeft.classList.remove('highlight');
        timeLeft.textContent = '0:00';
        playBeep();
      }
    }
  }, 1000);
}

function togglePauseResume() {
  isPaused = !isPaused;
  document.getElementById('pauseBtn').textContent = isPaused ? 'Resume' : 'Pause';
}

function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

function playBeep() {
  const beep = document.getElementById('alertSound');
  beep.currentTime = 0;
  beep.play();
}

function calculateRate() {
  const result = document.getElementById('result');
  result.textContent = '';
  let volume, duration;

  if (imperialMode) {
    const volumeUsed = parseFloat(document.getElementById('imperialVolume').value);
    if (isNaN(volumeUsed) || volumeUsed <= 0) {
      result.textContent = 'Please enter a valid volume used in ft³.';
      return;
    }

    if (!stopwatchInterval && time === 0) {
      result.textContent = 'Please start and stop the timer.';
      return;
    }

    duration = time;
    const gasRate = (3600 * volumeUsed) / duration; // ft³/hr
    const calorificValue = 1040; // Typical CV for imperial in BTU/ft³
    const grossBTU = gasRate * calorificValue;
    const grosskW = grossBTU / 3412;
    const netkW = grosskW / 1.1;

    result.innerHTML =
      `Gas Rate: ${gasRate.toFixed(2)} ft³/hr<br>` +
      `Gross Heat Input: ${grosskW.toFixed(2)} kW<br>` +
      `Net Heat Input: ${netkW.toFixed(2)} kW`;

  } else {
    const initial = parseFloat(document.getElementById('initial').value);
    const final = parseFloat(document.getElementById('final').value);

    if (isNaN(initial) || isNaN(final) || final <= initial) {
      result.textContent = 'Please enter valid initial and final readings.';
      return;
    }

    volume = final - initial;

    const mode = document.getElementById('mode').value;
    duration = mode === 'manual'
      ? parseInt(document.getElementById('manualSeconds').value)
      : parseInt(document.getElementById('duration').value);

    const m3h = (3600 * volume) / duration;
    const gasType = document.getElementById('gasType').value;
    const calorificValue = gasType === 'natural' ? 39.3 : 93.2;

    const gross = (3600 * calorificValue * volume) / (duration * 3.6);
    const net = gross / 1.1;

    result.innerHTML =
      `Gas Rate: ${m3h.toFixed(2)} m³/hr<br>` +
      `Gross Heat Input: ${gross.toFixed(2)} kW<br>` +
      `Net Heat Input: ${net.toFixed(2)} kW`;
  }
}

function resetTimerOnly() {
  clearInterval(countdown);
  clearInterval(stopwatchInterval);
  countdown = null;
  stopwatchInterval = null;
  time = 0;
  isPaused = false;

  const timeLeft = document.getElementById('timeLeft');
  const startBtn = document.getElementById('startBtn');
  const pauseBtn = document.getElementById('pauseBtn');

  timeLeft.textContent = '0:00';
  timeLeft.classList.remove('highlight');
  startBtn.textContent = 'Start Timer';
  startBtn.style.display = 'inline-block';
  pauseBtn.style.display = 'none';
  pauseBtn.textContent = 'Pause';
}

function resetForm() {
  resetTimerOnly();

  document.getElementById('initial').value = '';
  document.getElementById('final').value = '';
  document.getElementById('imperialVolume').value = imperialMode ? '1' : '';
  document.getElementById('result').textContent = '';
}
