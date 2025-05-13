let countdown;
let stopwatchInterval;
let time = 0;
let isPaused = false;
let imperialMode = false;
let lastNetKW = null;
let lastGrossKW = null;
let lastNetKWMode = null;
let fuse;

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
  // (same as your original — no changes here)
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
  // (same as your original — no changes here)
}

function setupGCInput() {
  const gcInput = document.getElementById('gcNumber');
  if (!gcInput) return;

  gcInput.addEventListener('input', function (e) {
    let raw = e.target.value;
    if (/^\d*$/.test(raw.replace(/-/g, ''))) {
      let value = raw.replace(/\D/g, '');
      let formatted = '';
      if (value.length > 0) formatted += value.substring(0, 2);
      if (value.length >= 3) formatted += '-' + value.substring(2, 5);
      if (value.length >= 6) formatted += '-' + value.substring(5, 7);
      e.target.value = formatted;
    }
    showSuggestions(e.target.value); // 🔁 Add live search here
  });

  gcInput.addEventListener('keydown', function (e) {
    const pos = gcInput.selectionStart;
    const isFormattedGC = /^\d{2}-\d{3}-\d{2}$/.test(gcInput.value);

    if (isFormattedGC && (e.key === 'Backspace' || e.key === 'Delete') && (pos === 3 || pos === 7)) {
      e.preventDefault();
      gcInput.setSelectionRange(pos - 1, pos - 1);
    }
  });
}

function loadBoilerData() {
  fetch('https://raw.githubusercontent.com/lexington1988/gas-rate-unfinished/main/service_info_full.csv')
    .then(response => response.ok ? response.text() : Promise.reject(response.statusText))
    .then(csvText => {
      const lines = csvText.trim().split('\n');
      const headers = lines[0].split(',');

      window.boilerData = lines.slice(1).map(line => {
        const parts = line.split(',');
        const entry = {};
        headers.forEach((h, i) => entry[h.trim()] = parts[i]?.trim());
        return entry;
      });

      const enrichedBoilerData = window.boilerData.map(entry => {
        const make = entry.Make || '';
        const model = entry.Model || '';
        const gc = entry["GC Number"] || '';
        return {
          ...entry,
          allText: `${make} ${model} ${gc}`.toLowerCase().replace(/[^\w\s]/g, '')
        };
      });

      fuse = new Fuse(enrichedBoilerData, {
        keys: ['allText'],
        threshold: 0.4,
        ignoreLocation: true,
        minMatchCharLength: 2,
        useExtendedSearch: true,
      });
    })
    .catch(err => console.error('CSV load error:', err));
}

function showSuggestions(query) {
  const suggestionsDiv = document.querySelector('.suggestions');
  suggestionsDiv.innerHTML = '';
  if (!query || !fuse) return;

  const trimmed = query.trim().toLowerCase();
  const digitsOnly = trimmed.replace(/\D/g, '');

  let results = [];

  if (/^\d{7}$/.test(digitsOnly)) {
    const match = window.boilerData.find(entry =>
      (entry["GC Number"] || '').replace(/\D/g, '') === digitsOnly
    );
    if (match) results = [{ item: match }];
  } else {
    const tokens = trimmed.split(/\s+/).map(t => `'${t}`);
    results = fuse.search(tokens.join(' ')).slice(0, 8);
  }

  results.forEach(({ item }) => {
    const div = document.createElement('div');
    div.textContent = `${item["GC Number"]} - ${item.Make} ${item.Model}`;
    div.style.padding = '5px';
    div.style.cursor = 'pointer';
    div.addEventListener('click', () => {
      const raw = item["GC Number"].replace(/\D/g, '');
      const formattedGC = `${raw.slice(0,2)}-${raw.slice(2,5)}-${raw.slice(5,7)}`;
      document.getElementById('gcNumber').value = formattedGC;
      suggestionsDiv.innerHTML = '';
      showBoilerInfo(item);
      document.getElementById('boilerResult').scrollIntoView({ behavior: 'smooth' });
    });
    suggestionsDiv.appendChild(div);
  });
}

document.addEventListener('click', function (e) {
  if (e.target !== document.getElementById('gcNumber')) {
    document.querySelector('.suggestions').innerHTML = '';
  }
});

document.addEventListener('DOMContentLoaded', () => {
  init();
  loadBoilerData();
});
