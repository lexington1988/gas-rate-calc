let countdown;
let stopwatchInterval;
let time = 0;
let isPaused = false;
let imperialMode = false;
let lastCalculatedNetKW = null;

function init() {
  document.getElementById('darkModeToggle').addEventListener('change', toggleDarkMode);
  document.getElementById('imperialToggle').addEventListener('change', toggleImperialMode);
  document.getElementById('gcNumber').addEventListener('input', () => {
    toggleMode();
    applyToleranceWarning(); // ✅ Check Net kW when GC changes
  });
  setupGCInput();
  toggleMode();
}

function toggleDarkMode() {
  const darkMode = document.getElementById('darkModeToggle').checked;
  document.body.classList.toggle('dark-mode', darkMode);
}

function toggleImperialMode() {
  imperialMode = document.getElementById('imperialToggle').checked;
  const status = document.getElementById('imperialStatus');
  const durationLabel = document.querySelector('label[for="duration"]');
  const modeSelect = document.getElementById('mode');
  const modeLabel = document.querySelector('label[for="mode"]');
  const imperialVolumeSection = document.getElementById('imperialVolumeSection');
  const imperialVolumeInput = document.getElementById('imperialVolume');
  const meterReadings = document.getElementById('meterReadings');

  resetTimerOnly();
  document.getElementById('result').textContent = '';
  document.getElementById('result').style.display = 'none';

  const manualOption = [...modeSelect.options].find(opt => opt.value === 'manual');

  if (imperialMode) {
    status.textContent = 'Imperial mode activated';
    modeSelect.value = 'timer';
    if (manualOption) modeSelect.removeChild(manualOption);
    modeSelect.style.display = 'none';
    if (modeLabel) modeLabel.textContent = '';

    imperialVolumeSection.style.display = 'block';
    imperialVolumeInput.value = '0.991';
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
    modeSelect.style.display = '';
    if (modeLabel) modeLabel.textContent = 'Mode:';

    imperialVolumeSection.style.display = 'none';
    imperialVolumeInput.readOnly = false;
    meterReadings.style.display = 'block';
    durationLabel.style.display = '';
    document.getElementById('duration').style.display = '';
  }

  toggleMode();
  toggleDarkMode();
}

function toggleMode() {
  const mode = document.getElementById('mode').value;
  const manualSection = document.getElementById('manualDuration');
  const timerSection = document.getElementById('timerSection');

  manualSection.style.display = mode === 'manual' ? 'block' : 'none';
  timerSection.style.display = mode !== 'manual' ? 'block' : 'none';
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
      timeLeft.textContent = '0:00';
      startBtn.textContent = 'Start Timer';
      time = 0;
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
  result.style.display = 'none';
  document.getElementById('boilerResult').innerHTML = '';
  let volume, duration, netkW;

  if (imperialMode) {
    const volumeUsed = parseFloat(document.getElementById('imperialVolume').value);
    if (isNaN(volumeUsed) || volumeUsed <= 0) {
      result.textContent = 'Please enter a valid volume used in ft³.';
      result.style.display = 'block';
      return;
    }

    if (!stopwatchInterval && time === 0) {
      result.textContent = 'Please start and stop the timer.';
      result.style.display = 'block';
      return;
    }

    duration = time;
    const gasRate = (3600 * volumeUsed) / duration;
    const calorificValue = 1040;
    const grossBTU = gasRate * calorificValue;
    const grosskW = grossBTU / 3412;
    netkW = grosskW / 1.1;

    lastCalculatedNetKW = netkW;

    result.innerHTML =
      `Gas Rate: ${gasRate.toFixed(2)} ft³/hr<br>` +
      `Gross Heat Input: ${grosskW.toFixed(2)} kW<br>` +
      `Net Heat Input: <span id="netKW">${netkW.toFixed(2)}</span> kW`;
    result.style.display = 'block';
  } else {
    const initial = parseFloat(document.getElementById('initial').value);
    const final = parseFloat(document.getElementById('final').value);

    if (isNaN(initial) || isNaN(final) || final <= initial) {
      result.textContent = 'Please enter valid initial and final readings.';
      result.style.display = 'block';
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
    netkW = gross / 1.1;

    lastCalculatedNetKW = netkW;

    result.innerHTML =
      `Gas Rate: ${m3h.toFixed(2)} m³/hr<br>` +
      `Gross Heat Input: ${gross.toFixed(2)} kW<br>` +
      `Net Heat Input: <span id="netKW">${netkW.toFixed(2)}</span> kW`;
    result.style.display = 'block';
  }

  applyToleranceWarning(); // ✅ Call after result is shown
  result.scrollIntoView({ behavior: 'smooth' });
}

function applyToleranceWarning() {
  const gc = document.getElementById('gcNumber').value;
  const boiler = findBoilerByGC(gc);
  const netKWSpan = document.getElementById('netKW');

  // Create or get the message element
  let message = document.getElementById('toleranceMessage');
  if (!message) {
    message = document.createElement('div');
    message.id = 'toleranceMessage';
    message.style.marginTop = '5px';
    message.style.fontWeight = 'bold';
    document.getElementById('result').appendChild(message);
  }

  // Reset default styles
  message.textContent = '';
  message.style.color = '';
  netKWSpan.style.color = '';
  netKWSpan.title = '';

  if (!boiler || !netKWSpan || lastCalculatedNetKW === null) return;

  const toleranceField = boiler['Net kW (+5%/-10%)'];
  if (!toleranceField) return;

  const match = toleranceField.match(/([\d.]+)\s*[-–]\s*([\d.]+)/);
  if (!match) return;

  let val1 = parseFloat(match[1]);
  let val2 = parseFloat(match[2]);
  if (isNaN(val1) || isNaN(val2)) return;

  const minKW = Math.min(val1, val2);
  const maxKW = Math.max(val1, val2);

  if (lastCalculatedNetKW < minKW || lastCalculatedNetKW > maxKW) {
    netKWSpan.style.color = 'red';
    netKWSpan.title = `Outside expected range: ${minKW} – ${maxKW} kW`;
    message.innerHTML = '⚠️ <span style="color: red;">Outside of manufacturer’s tolerance</span>';
    message.style.color = 'red';
  } else {
    netKWSpan.style.color = 'green';
    netKWSpan.title = `Within expected range: ${minKW} – ${maxKW} kW`;
    message.innerHTML = '✅ <span style="color: green;">Within manufacturer’s tolerance</span>';
    message.style.color = 'green';
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
  lastCalculatedNetKW = null;
  document.getElementById('initial').value = '';
  document.getElementById('final').value = '';
  document.getElementById('imperialVolume').value = imperialMode ? '0.991' : '';
  document.getElementById('result').textContent = '';
  document.getElementById('result').style.display = 'none';
  document.getElementById('boilerResult').innerHTML = '';
  document.getElementById('gcNumber').value = '';
}

function setupGCInput() {
  const gcInput = document.getElementById('gcNumber');
  if (!gcInput) return;

  gcInput.addEventListener('input', function (e) {
    let value = e.target.value.replace(/\D/g, '');
    let formatted = '';

    if (value.length > 0) formatted += value.substring(0, 2);
    if (value.length >= 3) formatted += '-' + value.substring(2, 5);
    if (value.length >= 6) formatted += '-' + value.substring(5, 7);

    e.target.value = formatted;
  });

  gcInput.addEventListener('keydown', function (e) {
    const pos = gcInput.selectionStart;
    if ((e.key === 'Backspace' || e.key === 'Delete') && (pos === 3 || pos === 7)) {
      e.preventDefault();
      gcInput.setSelectionRange(pos - 1, pos - 1);
    }
  });
}

function loadBoilerData() {
  fetch('https://raw.githubusercontent.com/lexington1988/gas-rate-unfinished/main/service_info_full.csv')
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.text();
    })
    .then(csvText => {
      const lines = csvText.trim().split('\n');
      const headers = lines[0].split(',');

      window.boilerData = lines.slice(1).map(line => {
        const parts = line.split(',');
        const entry = {};
        headers.forEach((h, i) => entry[h.trim()] = parts[i]?.trim());
        return entry;
      });
    })
    .catch(err => console.error('CSV load error:', err));
}

function findBoilerByGC(gcInput) {
  const formattedGC = gcInput.trim().replace(/-/g, '');
  return window.boilerData?.find(entry =>
    entry["GC Number"]?.replace(/-/g, '') === formattedGC
  );
}

document.addEventListener('DOMContentLoaded', () => {
  init();
  loadBoilerData();
});
