
// ✅ Repaired script with working fuzzy search and no re-declaration conflicts

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

      const enrichedBoilerData = window.boilerData.map(entry => {
        const make = entry.Make || '';
        const model = entry.Model || '';
        const gc = entry["GC Number"] || '';
        return {
          ...entry,
          allText: \`\${make} \${model} \${gc}\`.toLowerCase().replace(/[^\w\s]/g, '')
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

const gcInput = document.getElementById('gcNumber');
const suggestionsDiv = document.querySelector('.suggestions');

function showSuggestions(query) {
  suggestionsDiv.innerHTML = '';
  if (!query || !fuse) return;

  const trimmed = query.trim().toLowerCase();
  const digitsOnly = trimmed.replace(/\D/g, '');

  let results = [];

  const isFullGC = /^\d{7}$/.test(digitsOnly);
  const isMostlyNumeric = /^[\d\s-]{3,}$/.test(trimmed); // 3+ characters, mostly digits/dashes

  if (isFullGC) {
    const match = window.boilerData.find(entry => {
      const gcRaw = (entry["GC Number"] || '').replace(/\D/g, '');
      return gcRaw === digitsOnly;
    });
    if (match) results = [{ item: match }];
  } else if (isMostlyNumeric) {
    results = fuse.search(trimmed).slice(0, 8);
  } else {
    const tokens = trimmed
      .split(/\s+/)
      .filter(Boolean)
      .map(token => `'${token}`);
    const searchQuery = tokens.join(' ');
    results = fuse.search(searchQuery).slice(0, 8);
  }

  results.forEach(({ item }) => {
    const div = document.createElement('div');
    div.textContent = \`\${item["GC Number"]} - \${item["Make"]} \${item["Model"]}\`;
    div.style.padding = '5px';
    div.style.cursor = 'pointer';
    div.addEventListener('click', () => {
      const raw = item["GC Number"].replace(/\D/g, '');
      let formattedGC = raw;
      if (raw.length === 7) {
        formattedGC = \`\${raw.slice(0,2)}-\${raw.slice(2,5)}-\${raw.slice(5,7)}\`;
      }

      gcInput.value = formattedGC;
      suggestionsDiv.innerHTML = '';
      showBoilerInfo(item);

      const resultBox = document.getElementById('boilerResult');
      if (resultBox) {
        resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    suggestionsDiv.appendChild(div);
  });
}

gcInput.addEventListener('input', function (e) {
  showSuggestions(e.target.value);
});

document.addEventListener('click', function (e) {
  if (e.target !== gcInput) {
    suggestionsDiv.innerHTML = '';
  }
});

document.addEventListener('DOMContentLoaded', () => {
  init();
  loadBoilerData();
});
