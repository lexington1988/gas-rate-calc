let countdown;
let stopwatchInterval;
let time = 0;
let isPaused = false;
let imperialMode = false;
let lastNetKW = null;
let lastNetKWMode = null;

function init() {
  document.getElementById('darkModeToggle').addEventListener('change', toggleDarkMode);
  document.getElementById('imperialToggle').addEventListener('change', toggleImperialMode);
  document.getElementById('gcNumber').addEventListener('input', toggleMode);
  document.getElementById('mode').addEventListener('change', resetTimerOnly);
  document.getElementById('duration').addEventListener('change', resetTimerOnly);
  setupGCInput();
  toggleMode();

  document.getElementById('gcNumber').addEventListener('blur', () => {
    const gc = document.getElementById('gcNumber').value;
    const boiler = findBoilerByGC(gc);
    if (boiler) {
      showBoilerInfo(boiler);
    }
  });
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

  document.getElementById('calculateBtn').style.display = imperialMode ? 'none' : 'inline-block';

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
  const timeLeft = document.getElementById('timeLeft');

  if (imperialMode) {
    if (!stopwatchInterval) {
      isPaused = false;
      startBtn.textContent = 'Stop Timer';
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
      calculateRate();
    }
    return;
  }

  // METRIC MODE
  if (countdown && !isPaused) {
    isPaused = true;
    startBtn.textContent = 'Resume';
    return;
  }

  if (countdown && isPaused) {
    isPaused = false;
    startBtn.textContent = 'Pause';
    return;
  }

  const duration = parseInt(document.getElementById('duration').value);
  let secondsLeft = duration;
  timeLeft.textContent = formatTime(secondsLeft);
  isPaused = false;
  startBtn.textContent = 'Pause';

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
        countdown = null;
        startBtn.textContent = 'Start Timer';
        timeLeft.classList.remove('highlight');
        timeLeft.textContent = '0:00';
        playBeep();
        calculateRate();
      }
    }
  }, 1000);
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
  let volume, duration;

  const gc = document.getElementById('gcNumber').value;
  const boiler = findBoilerByGC(gc);

  if (imperialMode) {
    const volumeUsed = parseFloat(document.getElementById('imperialVolume').value);
    if (isNaN(volumeUsed) || volumeUsed <= 0) {
      result.textContent = 'Please enter a valid volume used in ft³.';
      result.style.display = 'block';
      return;
    }

    if (time === 0) {
      result.textContent = 'Please start and stop the timer.';
      result.style.display = 'block';
      return;
    }

    duration = time;
    const gasRate = (3600 * volumeUsed) / duration;
    const calorificValue = 1040;
    const grossBTU = gasRate * calorificValue;
    const grosskW = grossBTU / 3412;
    const netkW = grosskW / 1.1;

    lastNetKW = netkW;
    lastNetKWMode = 'imperial';

    const netKWDisplay = `<span id="netKW">${netkW.toFixed(2)}</span>`;
    result.innerHTML =
      `Gas Rate: ${gasRate.toFixed(2)} ft³/hr<br>` +
      `Gross Heat Input: ${grosskW.toFixed(2)} kW<br>` +
      `Net Heat Input: ${netKWDisplay} kW`;
    result.style.display = 'block';

    if (boiler) showBoilerInfo(boiler);
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
    const net = gross / 1.1;

    lastNetKW = net;
    lastNetKWMode = 'metric';

    const netKWDisplay = `<span id="netKW">${net.toFixed(2)}</span>`;
    result.innerHTML =
      `Gas Rate: ${m3h.toFixed(2)} m³/hr<br>` +
      `Gross Heat Input: ${gross.toFixed(2)} kW<br>` +
      `Net Heat Input: ${netKWDisplay} kW`;
    result.style.display = 'block';

    if (boiler) showBoilerInfo(boiler);
  }

  result.scrollIntoView({ behavior: 'smooth' });
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

  const duration = parseInt(document.getElementById('duration').value);
  timeLeft.textContent = formatTime(imperialMode ? 0 : duration);

  timeLeft.classList.remove('highlight');
  startBtn.textContent = 'Start Timer';
  startBtn.style.display = 'inline-block';

  document.getElementById('calculateBtn').style.display = imperialMode ? 'none' : 'inline-block';
}

function resetForm() {
  resetTimerOnly();
  document.getElementById('initial').value = '';
  document.getElementById('final').value = '';
  document.getElementById('imperialVolume').value = imperialMode ? '0.991' : '';
  document.getElementById('result').textContent = '';
  document.getElementById('result').style.display = 'none';
  document.getElementById('calculateBtn').style.display = imperialMode ? 'none' : 'inline-block';
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

function showBoilerInfo(boiler) {
  const makeModel = `<strong>${boiler.Make?.trim() || ''} ${boiler.Model?.trim() || ''}</strong><br>`;
  const toleranceText = `Net Heat Input Range: ${(boiler['Net kW (+5%/-10%)'] || '')} kW<br>`;
  const co2Range = `Max CO₂: ${boiler['Max CO2%'] || ''}% / Min CO₂: ${boiler['Min CO2%'] || ''}%<br>`;
  const ratio = `Max Ratio: ${boiler['Max Ratio'] || ''}<br>`;
  const co = `Max CO: ${boiler['Max Co (PPM)'] || ''} ppm<br>`;
  const pressure = `Max Pressure: ${boiler['Max (Burner Pressure Mb)'] || ''} mb / Min Pressure: ${boiler['Min (Burner Pressure Mb)'] || ''} mb<br>`;
  const strip = boiler['Strip Service Required']?.toLowerCase() === 'yes'
    ? `<small>*Strip Service Required</small><br>` : '';
  document.getElementById('boilerResult').innerHTML = makeModel + toleranceText + co2Range + ratio + co + pressure + strip;

  if (lastNetKW !== null) {
    const raw = boiler?.['Net kW (+5%/-10%)'] || '';
    const match = raw.match(/([\d.]+)[^\d]+([\d.]+)/);
    if (match) {
      const min = parseFloat(match[1]);
      const max = parseFloat(match[2]);
      if (!isNaN(min) && !isNaN(max)) {
        const resultBox = document.getElementById('result');
        const netKWSpan = document.getElementById('netKW');

        if (netKWSpan && resultBox) {
          const outOfRange = lastNetKW < min || lastNetKW > max;
          netKWSpan.style.color = outOfRange ? 'red' : 'green';

          const existingMsg = resultBox.querySelector('.tolerance-message');
          if (existingMsg) existingMsg.remove();

          const msg = document.createElement('div');
          msg.className = 'tolerance-message';
          msg.style.color = outOfRange ? 'red' : 'green';
          msg.style.fontWeight = 'bold';
          msg.style.marginTop = '8px';
          msg.innerHTML = outOfRange
            ? '⚠️ Outside of manufacturer’s tolerance'
            : '✅ Within manufacturer’s tolerance';

          resultBox.appendChild(msg);
        }
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  init();
  loadBoilerData();
});
