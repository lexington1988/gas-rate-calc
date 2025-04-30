let timerInterval;
let startTime;
let boilerData = [];

document.addEventListener('DOMContentLoaded', () => {
  const gcInput = document.getElementById('gcNumber');
  const imperialToggle = document.getElementById('imperialToggle');
  const volumeGroup = document.getElementById('volumeGroup');

  // Format GC number input
  gcInput.addEventListener('input', () => {
    let val = gcInput.value.replace(/\D/g, '');
    if (val.length > 7) val = val.slice(0, 7);
    let formatted = '';
    if (val.length >= 2) formatted += val.slice(0, 2) + '-';
    if (val.length >= 5) formatted += val.slice(2, 5) + '-';
    if (val.length > 5) formatted += val.slice(5);
    else if (val.length > 2) formatted += val.slice(2);
    gcInput.value = formatted;
  });

  // Load boiler data from CSV
  fetch('https://your-github-username.github.io/your-repo-name/boiler_data.csv') // replace this URL
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.text();
    })
    .then(csvText => {
      const rows = csvText.trim().split('\n');
      const headers = rows[0].split(',');
      boilerData = rows.slice(1).map(row => {
        const values = row.split(',');
        const entry = {};
        headers.forEach((header, i) => {
          entry[header.trim()] = values[i].trim();
        });
        return entry;
      });

      console.log('✅ Boiler data loaded');
      console.log(`Total boilers loaded: ${boilerData.length}`);
      console.log('Sample GC numbers:', boilerData.slice(0, 5).map(b => b.GCNumber));
    })
    .catch(error => {
      console.error('❌ Failed to fetch CSV file:', error);
    });

  // Toggle Imperial fields
  imperialToggle.addEventListener('change', () => {
    volumeGroup.style.display = imperialToggle.checked ? 'block' : 'none';
    const message = document.getElementById('imperialMessage');
    message.textContent = imperialToggle.checked ? 'Imperial mode activated' : '';
  });
});

function startTimer() {
  const imperialMode = document.getElementById('imperialToggle').checked;
  const timeDisplay = document.getElementById('time');
  startTime = Date.now();

  clearInterval(timerInterval);

  if (imperialMode) {
    timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      timeDisplay.textContent = elapsed;
    }, 1000);
  } else {
    let duration = parseInt(timeDisplay.textContent);
    timerInterval = setInterval(() => {
      if (duration > 0) {
        duration--;
        timeDisplay.textContent = duration;
      } else {
        clearInterval(timerInterval);
      }
    }, 1000);
  }
}

function resetTimer() {
  clearInterval(timerInterval);
  const imperialMode = document.getElementById('imperialToggle').checked;
  document.getElementById('time').textContent = imperialMode ? '0' : '120';
}

function calculateGasRate() {
  const imperialMode = document.getElementById('imperialToggle').checked;
  const time = parseInt(document.getElementById('time').textContent);
  const gcNumber = document.getElementById('gcNumber').value.trim();
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = '';

  console.log('🔎 Searching for GC number:', gcNumber);

  if (imperialMode) {
    const volume = parseFloat(document.getElementById('volume').value);
    if (isNaN(volume) || volume <= 0 || time <= 0) {
      resultsDiv.textContent = 'Please enter valid volume and time.';
      return;
    }

    const gasRate = (3600 * volume) / time;
    const cv = 1040; // default CV for Imperial
    const grossBTU = gasRate * cv;
    const netKW = grossBTU / 3412 / 1.1;

    const boiler = boilerData.find(b => b.GCNumber === gcNumber);
    console.log('Boiler found?', boiler !== undefined);

    if (boiler) {
      resultsDiv.innerHTML = `
        <strong>${boiler.MakeModel}</strong><br>
        Gross Heat Input: ${grossBTU.toFixed(0)} BTU/hr<br>
        Net Heat Input: ${netKW.toFixed(2)} kW<br>
        Net kW (+5%/-10%): ${(
          netKW * 1.05
        ).toFixed(2)} / ${(
        netKW * 0.9
      ).toFixed(2)} kW<br>
        Max Co2%: ${boiler.MaxCO2}%<br>
        Min Co2%: ${boiler.MinCO2}%<br>
        Max Ratio: ${boiler.MaxRatio}<br>
        Max Co(PPM): ${boiler.MaxCOppm}<br>
        Max Burner Pressure (Mb): ${boiler.MaxBurnerPressure}<br>
        Min Burner Pressure (Mb): ${boiler.MinBurnerPressure}<br>
        <small>*Strip Service Required</small>
      `;
    } else {
      resultsDiv.textContent =
        'Boiler not found. Please check the G.C number.';
    }
  } else {
    const initial = parseFloat(document.getElementById('initial').value);
    const final = parseFloat(document.getElementById('final').value);
    if (isNaN(initial) || isNaN(final) || time <= 0 || final <= initial) {
      resultsDiv.textContent =
        'Please enter valid initial/final readings and time.';
      return;
    }

    const volume = final - initial;
    const rate = (volume * 3600) / time;
    const cv = 10.8; // metric CV
    const grossKW = (cv * rate) / 3.6;
    const netKW = grossKW / 1.1;

    resultsDiv.innerHTML = `
      Gas Rate: ${rate.toFixed(2)} m³/h<br>
      Gross Heat Input: ${grossKW.toFixed(2)} kW<br>
      Net Heat Input: ${netKW.toFixed(2)} kW
    `;
  }
}
