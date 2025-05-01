document.addEventListener('DOMContentLoaded', () => {
  setupDarkModeToggle();
  setupImperialToggle();
  setupGCInput();
  loadBoilerData();
  setupFormSubmission();
});

function setupDarkModeToggle() {
  const toggle = document.getElementById('darkMode');
  toggle.addEventListener('change', () => {
    document.body.classList.toggle('dark-mode', toggle.checked);
  });
}

function setupImperialToggle() {
  const toggle = document.getElementById('imperialToggle');
  const imperialNotice = document.getElementById('imperialNotice');
  const volumeLabel = document.getElementById('volumeLabel');
  const endReadingGroup = document.getElementById('endReadingGroup');

  toggle.addEventListener('change', () => {
    imperialNotice.style.display = toggle.checked ? 'block' : 'none';
    if (toggle.checked) {
      volumeLabel.textContent = 'Volume Used (ft³):';
      endReadingGroup.style.display = 'none';
    } else {
      volumeLabel.textContent = 'Initial Reading (m³):';
      endReadingGroup.style.display = 'block';
    }
  });
}

function setupGCInput() {
  const gcInput = document.getElementById('gcNumber');

  if (!gcInput) return;

  gcInput.addEventListener('input', function (e) {
    console.log('Input event triggered:', e.target.value);
    let value = e.target.value.replace(/\D/g, '');
    let formatted = '';

    if (value.length > 0) formatted += value.substring(0, 2);
    if (value.length >= 3) formatted += '-' + value.substring(2, 5);
    if (value.length >= 6) formatted += '-' + value.substring(5, 7);

    e.target.value = formatted;
    console.log('Formatted GC Number:', e.target.value);
  });

  gcInput.addEventListener('keydown', function (e) {
    const pos = gcInput.selectionStart;
    if ((e.key === 'Backspace' || e.key === 'Delete') && (pos === 3 || pos === 7)) {
      e.preventDefault();
      gcInput.setSelectionRange(pos - 1, pos - 1);
      console.log('Adjusted cursor position to:', pos - 1);
    }
  });
}

function loadBoilerData() {
  console.log('Initiating boiler data fetch...');
  fetch('https://raw.githubusercontent.com/lexington1988/gas-rate-unfinished/main/service_info_full.csv')
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.text();
    })
    .then(csv => {
      console.log('CSV data fetched successfully.');
      const lines = csv.trim().split('\n');
      const headers = lines[0].split(',');
      console.log('CSV Headers:', headers);

      window.boilerData = lines.slice(1).map(line => {
        const parts = line.split(',');
        const entry = {};
        headers.forEach((h, i) => entry[h.trim()] = parts[i]?.trim());
        return entry;
      });

      console.log('Parsed Boiler Data:', window.boilerData);
    })
    .catch(err => console.error('Error loading CSV:', err));
}

function setupFormSubmission() {
  const form = document.getElementById('gasRateForm');
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  let startTime = 0;
  let timerInterval;

  startBtn.addEventListener('click', function () {
    startTime = Date.now();
    startBtn.disabled = true;
    stopBtn.disabled = false;
    console.log('Stopwatch started...');
    timerInterval = setInterval(() => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      document.getElementById('duration').value = elapsed;
    }, 100);
  });

  stopBtn.addEventListener('click', function () {
    clearInterval(timerInterval);
    stopBtn.disabled = true;
    startBtn.disabled = false;
    console.log('Stopwatch stopped. Duration:', document.getElementById('duration').value);
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    console.log('Form submitted. Calculating...');
    calculateRate();
  });
}

function calculateRate() {
  debugger; // Pause here for debugging in DevTools

  const imperialMode = document.getElementById('imperialToggle').checked;
  const duration = parseFloat(document.getElementById('duration').value);
  const gcNumber = document.getElementById('gcNumber').value;
  const boilerInfo = lookupBoiler(gcNumber);
  const results = document.getElementById('results');

  let rate, gross, net;

  if (imperialMode) {
    const ftUsed = parseFloat(document.getElementById('initialReading').value);
    const CV = 1040;
    const gasRate = (3600 * ftUsed) / duration;
    gross = gasRate * CV;
    net = gross / 3412 / 1.1;
    rate = gasRate.toFixed(1);

    results.innerHTML = `
      <strong>${boilerInfo.model || 'Boiler info not found'}</strong><br>
      Gross Heat Input: ${(gross / 1000).toFixed(1)} BTU/hr<br>
      Net Heat Input: ${net.toFixed(1)} kW<br>
      Net kW Range: ${ (net * 1.05).toFixed(1) } kW (+5%) / ${ (net * 0.9).toFixed(1) } kW (-10%)<br>
      Max CO₂: ${boilerInfo.max_co2 || 'N/A'}<br>
      Min CO₂: ${boilerInfo.min_co2 || 'N/A'}<br>
      Max Ratio: ${boilerInfo.max_ratio || 'N/A'}<br>
      Max CO (PPM): ${boilerInfo.max_co || 'N/A'}<br>
      Max Burner Pressure: ${boilerInfo.max_burner || 'N/A'} Mb<br>
      Min Burner Pressure: ${boilerInfo.min_burner || 'N/A'} Mb<br>
      <small>*Strip Service Required</small>
    `;
  } else {
    const start = parseFloat(document.getElementById('initialReading').value);
    const end = parseFloat(document.getElementById('finalReading').value);
    const volume = end - start;
    const CV = parseFloat(document.getElementById('cv').value || 39.3);
    const correction = parseFloat(document.getElementById('correction').value || 1.02264);
    const kWh = ((volume * CV * correction) / 3.6) / (duration / 3600);
    rate = (volume * 3600 / duration).toFixed(2);

    results.innerHTML = `
      Volume per Hour: ${rate} m³/h<br>
      Net Heat Input: ${kWh.toFixed(2)} kW
    `;
  }

  console.log('Calculation complete. Gas Rate:', rate);
}

function lookupBoiler(gcNumber) {
  if (!window.boilerData) {
    console.warn('Boiler data not loaded yet.');
    return {};
  }

  const formattedGC = gcNumber.trim();
  console.log('Looking up boiler info for GC number:', formattedGC);

  const match = window.boilerData.find(b => b.gc_number === formattedGC);
  if (!match) {
    console.warn('No match found for GC:', formattedGC);
    return {};
  }

  console.log('Boiler info found:', match);
  return {
    model: match.model,
    max_co2: match.max_co2,
    min_co2: match.min_co2,
    max_ratio: match.max_ratio,
    max_co: match.max_co,
    max_burner: match.max_burner_pressure,
    min_burner: match.min_burner_pressure
  };
}
