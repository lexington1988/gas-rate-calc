let countdown;
let stopwatchInterval;
let time = 0;
let isPaused = false;
let imperialMode = false;
let lastNetKW = null;
let lastGrossKW = null;
let lastNetKWMode = null;

function init() {
 const beep = document.getElementById('alertSound');
const endBeep = document.getElementById('endBeep');

document.body.addEventListener('click', () => {
  [beep, endBeep].forEach(audio => {
    if (audio) {
      audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
      }).catch(() => {});
    }
  });
}, { once: true });

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
  } else if (gc.trim() !== '') {
    showToast('No boiler found for this G.C. number');
  }
});

}

function toggleDarkMode() {
  const darkMode = document.getElementById('darkModeToggle').checked;
  document.body.classList.toggle('dark-mode', darkMode);
}

function toggleImperialMode() {
  imperialMode = document.getElementById('imperialToggle').checked;
  document.getElementById('imperialToggleLabel').textContent = imperialMode ? 'Metric Mode' : 'Imperial Mode';

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

      if (secondsLeft <= 5 && secondsLeft > 0) {
        timeLeft.classList.add('highlight');
        playBeep();

        // ✅ Short buzz per final 5-second beep
        if (navigator.vibrate) {
          navigator.vibrate(100);
        }
      }

      if (secondsLeft <= 0) {
        clearInterval(countdown);
        countdown = null;
        startBtn.textContent = 'Start Timer';
        timeLeft.classList.remove('highlight');
        timeLeft.textContent = '0:00';

        // ✅ Play end beep and strong vibration
        playEndBeep();
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200]); // Double-pulse buzz
        }

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
function playEndBeep() {
  const endBeep = document.getElementById('endBeep');
  if (endBeep) {
    endBeep.currentTime = 0;
    endBeep.play().catch(() => {
      // Mobile may still block it if not unlocked
    });
  }
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

    lastGrossKW = grosskW;
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
  showToast('Please enter valid initial and final readings.');
  result.style.display = 'none';
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

    lastGrossKW = gross;
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

  // ✅ Clear any last calculated values
  lastNetKW = null;
  lastGrossKW = null;
  lastNetKWMode = null;
  document.getElementById('boilerFinder').style.display = 'none';

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
  const make = boiler.Make?.trim() || '';
  const model = boiler.Model?.trim() || '';
  const gross = boiler['kW Gross'] || '';
  const net = boiler['kW Net'] || '';
  const netRange = boiler['Net kW (+5%/-10%)'] || '';
  const maxCO2 = boiler['Max CO2%'] || '';
  const minCO2 = boiler['Min CO2%'] || '';
  const maxCO = boiler['Max Co (PPM)'] || '';
  const maxPressure = boiler['Max (Burner Pressure Mb)'] || '';
  const minPressure = boiler['Min (Burner Pressure Mb)'] || '';
  const ratio = boiler['Max Ratio'] || '';
  const stripRaw = boiler['Strip Service Required']?.trim().toLowerCase() || '';
  const strip = stripRaw === 'yes' ? 'yes' : stripRaw || 'no';
  const stripBadge = `<span class="tag ${strip === 'yes' ? 'yes' : 'no'}">${strip.charAt(0).toUpperCase() + strip.slice(1)}</span>`;

  // Tolerance logic
 let toleranceMessage = '';
let netClass = '';
const match = netRange.match(/([\d.]+)[^\d]+([\d.]+)/);
if (match && lastNetKW !== null) {
  const min = parseFloat(match[1]);
  const max = parseFloat(match[2]);
  if (!isNaN(min) && !isNaN(max)) {
    const outOfRange = lastNetKW < min || lastNetKW > max;
    netClass = outOfRange ? 'red' : 'green';

    const messageText = outOfRange
      ? '⚠️ Outside of manufacturer’s tolerance'
      : '✅ Within manufacturer’s tolerance';

    // ✅ Add to boiler card layout
    toleranceMessage = `
      <div class="tolerance-message" style="grid-column: 1 / -1; font-weight: bold; color: ${outOfRange ? 'red' : 'green'};">
        ${messageText}
      </div>`;

// ✅ Also add below the #result box (if it's visible)
const resultBox = document.getElementById('result');
if (resultBox && resultBox.style.display !== 'none') {
  // Update the Net Heat Input color in #result box
  const resultNetKW = document.getElementById('netKW');
  if (resultNetKW) {
    resultNetKW.classList.remove('green', 'red');
    resultNetKW.classList.add(outOfRange ? 'red' : 'green');
  }

  // Add the tolerance message below the result
  const msg = document.createElement('div');
  msg.className = 'tolerance-message';
  msg.style.color = outOfRange ? 'red' : 'green';
  msg.style.fontWeight = 'bold';
  msg.style.marginTop = '6px';
  msg.innerHTML = messageText;
  resultBox.appendChild(msg);
}

  }
}


  const html = `
    <div class="boiler-card">
      <div class="boiler-title">${make} ${model}</div>
      <div class="boiler-grid">
        <div>
        <div class="label">Net Heat Input</div>
          <div class="value ${netClass}" id="boilerNetKW">${net} kW</div> 
        </div>
        <div>
        <div class="label">Net Heat Input Range</div>
          <div class="value">${netRange}</div>
        </div>
        <div>
        <div class="label">Gross Heat Input</div>
          <div class="value">${gross} kW</div> 
        </div>
        <div>
          <div class="label">Max CO</div>
          <div class="value">${maxCO} ppm</div>
        </div>
        <div>
          <div class="label">CO₂ Range</div>
          <div class="value">Max: ${maxCO2}%<br>Min: ${minCO2}%</div>
        </div>
        <div>
         <div class="label">Max Ratio</div>
          <div class="value">${ratio}</div>
        </div>
        <div>
        <div class="label">Burner Pressure</div>
          <div class="value">Max: ${maxPressure} mb<br>Min: ${minPressure} mb</div> 
        </div>
        <div>
          <div class="label">Strip Service Required</div>
          <div class="value">${stripBadge}</div>
        </div>
        ${toleranceMessage}
      </div>
    </div>
  `;

  document.getElementById('boilerResult').innerHTML = html;
  document.getElementById('boilerResult').scrollIntoView({ behavior: 'smooth', block: 'center' });

}
function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
    .then(() => console.log('✅ Service worker registered'))
    .catch(err => console.warn('❌ Service worker failed:', err));
}


document.addEventListener('DOMContentLoaded', () => {
  init();
  loadBoilerData();
});
