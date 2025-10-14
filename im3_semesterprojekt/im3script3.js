// im3script2.js — verbesserte Version

// ===== Helpers & constants for Startscreen map =====
const API_URL = "https://xn--whatsuplozrn-pcb.podcastchaeller.ch/im3_semesterprojekt/im3unload.php";
const MAP_POSITIONS = {
  // Prozentuale Positionen (anpassen falls nötig)
  "Schwanenplatz": { x: 56, y: 34 },
  "Löwendenkmal": { x: 68, y: 11 },
  "Hertensteinstrasse": { x: 42, y: 48 },
  "Kapellbrücke": { x: 44, y: 67 },
  "Rathausquai": { x: 28, y: 58 },
};
const MAP_ICONS = {
  "Löwendenkmal": "/im3_semesterprojekt/img/icon_1.png",
  "Rathausquai": "/im3_semesterprojekt/img/icon_2.png",
  "Schwanenplatz": "/im3_semesterprojekt/img/icon_3.png",
  "Hertensteinstrasse": "/im3_semesterprojekt/img/icon_4.png",
  "Kapellbrücke": "/im3_semesterprojekt/img/icon_5.png",
};

let RAW_DATA = [];

function formatCH(dateLike) {
  const d = new Date(dateLike);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function average(arr) {
  if (!arr.length) return 0;
  return arr.reduce((s, n) => s + n, 0) / arr.length;
}

// === Confetti helper (uses canvas-confetti) ===
// Fires a burst with exactly `count` particles (capped for safety), originating near the click.
function launchConfettiForCount(count, clientX, clientY) {
  if (typeof confetti !== 'function' || !count) return;

  // Normalize click position to viewport [0..1] as required by canvas-confetti `origin`
  const origin = {
    x: Math.min(Math.max(clientX / window.innerWidth, 0), 1),
    y: Math.min(Math.max(clientY / window.innerHeight, 0), 1),
  };

  // Safety cap to avoid freezing the browser on very large numbers
  const MAX_TOTAL = 2000;
  const total = Math.min(Math.max(0, Math.floor(count)), MAX_TOTAL);

  // Fire in small batches to keep animation smooth while preserving exact `total`
  const BURST_SIZE = 160;
  let remaining = total;

  const shoot = () => {
    const n = Math.min(remaining, BURST_SIZE);
    remaining -= n;
    confetti({
      particleCount: n,
      spread: 70,
      startVelocity: 36,
      gravity: 0.95,
      ticks: 220,
      scalar: 1.05,
      origin,
      disableForReducedMotion: true,
      colors: ['#b899f2', '#a382ee', '#ffffff', '#6f887f', '#2c2c2c'],
    });
    if (remaining > 0) requestAnimationFrame(shoot);
  };

  shoot();
}
function loadDataAndDisplay() {
  const apiUrl = API_URL;
  const chartCanvas = document.getElementById("counterChart");

  fetch(apiUrl)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP-Fehler ${res.status}`);
      return res.json();
    })
    .then((dataArray) => {
      if (!Array.isArray(dataArray) || dataArray.length === 0) return;
      RAW_DATA = dataArray;

      // Gruppieren nach Standort
      const grouped = dataArray.reduce((acc, it) => {
        (acc[it.location] ||= []).push(it);
        return acc;
      }, {});

      // Helper: ISO -> Date; invalid abfangen
      const toDate = (s) => {
        const d = new Date(s);
        return isNaN(d) ? null : d;
      };

      // Datensätze aufbereiten
      const palette = [
        "rgb(255, 99, 132)",
        "rgb(54, 162, 235)",
        "rgb(255, 206, 86)",
        "rgb(75, 192, 192)",
        "rgb(153, 102, 255)",
        "rgb(255, 159, 64)",
      ];
      let idx = 0;

      const datasets = Object.entries(grouped).map(([location, arr]) => {
        // sortiert + Duplikate nach Timestamp entfernen
        const sorted = arr
          .map((it) => ({ x: +toDate(it.messzeit), y: Number(it.counter) }))
          .filter((p) => p.x && !Number.isNaN(p.y))
          .sort((a, b) => a.x - b.x);

        const dedup = [];
        const seen = new Set();
        for (const p of sorted) {
          const key = p.x;
          if (!seen.has(key)) {
            seen.add(key);
            dedup.push(p);
          }
        }

        const color = palette[idx++ % palette.length];
        const bg = color.replace("rgb(", "rgba(").replace(")", ", 0.2)");

        return {
          label: location,
          data: dedup,
          parsing: {
            xAxisKey: "x",
            yAxisKey: "y",
          },
          borderColor: color,
          backgroundColor: bg,
          borderWidth: 2,
          pointRadius: 2,
          tension: 0.15,
          fill: false,
          spanGaps: true,
        };
      });

      // Chart-Konfig (ohne labels – Zeit kommt aus data.x)
      const config = {
        type: "line",
        data: { datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "nearest", intersect: false },
          scales: {
            x: {
              type: "time",
              time: {
                unit: "day",
                displayFormats: {
                  day: "dd.MM.yyyy",
                },
                tooltipFormat: "dd.MM.yyyy HH:mm",
              },
              ticks: {
                source: "auto",
                autoSkip: true,
                maxRotation: 0,
                autoSkipPadding: 16,
              },
              title: { display: true, text: "Messzeit" },
            },
            y: {
              beginAtZero: true,
              title: { display: true, text: "Anzahl Zählungen" },
              ticks: { precision: 0 },
            },
          },
          plugins: {
            legend: {
              position: "top",
              labels: { usePointStyle: true },
              onClick: (e, legendItem, legend) => {
                // Solo-Toggle: mit Cmd/Strg auf einen Eintrag klicken, um nur diesen zu zeigen
                const meta = legend.chart.getDatasetMeta(legendItem.datasetIndex);
                const solo = e.native && (e.native.ctrlKey || e.native.metaKey);
                if (solo) {
                  legend.chart.data.datasets.forEach((ds, i) => {
                    const m = legend.chart.getDatasetMeta(i);
                    m.hidden = i === legendItem.datasetIndex ? null : true;
                  });
                } else {
                  meta.hidden = meta.hidden === null ? true : null;
                }
                legend.chart.update();
              },
            },
            title: {
              display: true,
              text: "Entwicklung der Zählstände pro Standort über die Zeit",
            },
            tooltip: {
              callbacks: {
                title: (items) =>
                  items[0]?.parsed?.x
                    ? new Date(items[0].parsed.x).toLocaleString("de-CH")
                    : "",
                label: (item) => `${item.dataset.label}: ${item.formattedValue}`,
              },
            },
          },
        },
      };

      if (chartCanvas) {
        if (window.myLineChart instanceof Chart) {
          window.myLineChart.destroy();
        }
        window.myLineChart = new Chart(chartCanvas, config);
      }
    })
    .catch((err) => console.error("Fetch/Chart Fehler:", err));
}

// ===== Startscreen: interaktive Map mit Pins =====
async function initStartScreen() {
  const mapEl = document.getElementById("map");
  if (!mapEl) return; // Seite ohne Startscreen

  // Ebenen vorbereiten
  const pinsLayer = document.createElement("div");
  pinsLayer.id = "mapPins";
  pinsLayer.style.position = "absolute";
  pinsLayer.style.inset = 0;
  pinsLayer.style.pointerEvents = "none";
  pinsLayer.style.zIndex = "2";

  const infoCard = document.createElement("div");
  infoCard.id = "infoCard";
  infoCard.setAttribute("aria-live", "polite");
  infoCard.style.position = "absolute";
  infoCard.style.display = "none";
  infoCard.style.zIndex = "3";

  mapEl.style.position = "relative";
  mapEl.appendChild(pinsLayer);
  mapEl.appendChild(infoCard);

  // Daten holen
  let dataArray = [];
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    dataArray = await res.json();
  } catch (e) {
    console.error("Map-Daten Fehler:", e);
    return;
  }
  if (!Array.isArray(dataArray) || !dataArray.length) return;

  // Nach Standort gruppieren & Kennzahlen
  const byLoc = dataArray.reduce((acc, it) => {
    (acc[it.location] ||= []).push(it);
    return acc;
  }, {});

  const latestByLoc = Object.fromEntries(
    Object.entries(byLoc).map(([loc, arr]) => {
      arr.sort((a, b) => new Date(b.messzeit) - new Date(a.messzeit));
      return [loc, arr[0]];
    })
  );
  const avgByLoc = Object.fromEntries(
    Object.entries(byLoc).map(([loc, arr]) => [loc, average(arr.map((x) => Number(x.counter) || 0))])
  );

  function classify(loc, value) {
    const avg = avgByLoc[loc] || 0;
    if (!avg) return "Keine Vergleichsdaten";
    if (value < avg * 0.85) return "Weniger Besuchende als gewöhnlich";
    if (value > avg * 1.15) return "Mehr Besuchende als gewöhnlich";
    return "Etwa wie gewöhnlich";
  }

  function showInfo(loc) {
    const rec = latestByLoc[loc];
    if (!rec) return;
    infoCard.style.display = "block";
    infoCard.innerHTML = `
      <div class="bubble">
        <div class="bubble-title">${loc}</div>
        <div class="bubble-line">Auslastung: <strong>${Number(rec.counter)}</strong> Anzahl Personen</div>
        <div class="bubble-line">${classify(loc, Number(rec.counter))}</div>
        <div class="bubble-line bubble-muted">Letzte Aktualisierung: ${formatCH(rec.messzeit)}</div>
      </div>
    `;
    // Position Info-Bubble rechts oben vom Pin (leicht versetzt)
    const pos = MAP_POSITIONS[loc];
    const x = Math.max(0, Math.min(100, pos?.x ?? 50));
    const y = Math.max(0, Math.min(100, pos?.y ?? 50));
    infoCard.style.left = `${x + 3}%`;
    infoCard.style.top = `${y - 3}%`;
  }

  // Pins rendern
  Object.entries(MAP_POSITIONS).forEach(([loc, pos]) => {
    if (!latestByLoc[loc]) return; // nur Pins mit Daten
    const btn = document.createElement("button");
    btn.className = "pin";
    btn.type = "button";
    btn.style.left = `${pos.x}%`;
    btn.style.top = `${pos.y}%`;
    btn.title = loc;
    const iconSrc = MAP_ICONS[loc] || "/im3_semesterprojekt/img/icon_1.png";
    btn.dataset.loc = loc;
    btn.setAttribute("aria-label", loc);
    btn.innerHTML = `<img class="pin-img" src="${iconSrc}" alt="${loc}" onerror="this.src='/im3_semesterprojekt/img/icon_1.png'" />`;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      showInfo(loc);
      const current = Number(latestByLoc[loc]?.counter) || 0;
      // Fire confetti at the click position with exactly `current` particles (capped internally)
      launchConfettiForCount(current, e.clientX, e.clientY);
    });
    btn.style.pointerEvents = "auto";
    pinsLayer.appendChild(btn);
  });

  // Klick auf Karte schliesst Info
  mapEl.addEventListener("click", () => {
    infoCard.style.display = "none";
  });
}

// ===== Bootstrapping: je nach vorhandenen Elementen initialisieren
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("counterChart")) {
    loadDataAndDisplay();
  }
  if (document.getElementById("map")) {
    initStartScreen();
  }
  if (document.getElementById('calGrid')) { initPlanner(); }
});

// ===== Visit Planner (Calendar + Time) with simple prediction =====
function initPlanner(){
  const calGrid = document.getElementById('calGrid');
  const calMonthEl = document.getElementById('calMonth');
  const calYearEl = document.getElementById('calYear');
  const prevBtn = document.getElementById('calPrev');
  const nextBtn = document.getElementById('calNext');
  const timeToggle = document.getElementById('timeToggle');
  const timeList = document.getElementById('timeList');
  const predictBtn = document.getElementById('predictBtn');
  const predictOutput = document.getElementById('predictOutput');

  if(!calGrid || !calMonthEl || !calYearEl) return; // planner not on page

  const months = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
  let viewDate = new Date();
  let selectedDate = null; // JS Date
  let selectedTime = null; // string HH:MM

  function renderCalendar(date){
    const year = date.getFullYear();
    const month = date.getMonth();
    calMonthEl.textContent = months[month];
    calYearEl.textContent = year;

    // start Monday
    const first = new Date(year, month, 1);
    const startDay = (first.getDay() + 6) % 7; // 0 = Monday
    const daysInMonth = new Date(year, month+1, 0).getDate();

    // Compute today's midnight
    const todayMid = new Date();
    todayMid.setHours(0,0,0,0);

    calGrid.innerHTML = '';
    for(let i=0;i<startDay;i++) calGrid.appendChild(document.createElement('div'));
    for(let d=1; d<=daysInMonth; d++){
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cal-day';
      btn.textContent = d;
      const thisDate = new Date(year, month, d);
      if(isSameDate(thisDate, new Date())) btn.classList.add('is-today');
      const isPast = thisDate.getTime() < todayMid.getTime();
      if(isPast){
        btn.setAttribute('disabled','');
        btn.setAttribute('aria-disabled','true');
        btn.title = 'Vergangener Tag';
      } else {
        btn.addEventListener('click', ()=>{
          selectedDate = thisDate;
          document.querySelectorAll('.cal-day.is-selected').forEach(el=>el.classList.remove('is-selected'));
          btn.classList.add('is-selected');
        });
      }
      calGrid.appendChild(btn);
    }
  }
  function isSameDate(a,b){ return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }

  prevBtn?.addEventListener('click', ()=>{ viewDate.setMonth(viewDate.getMonth()-1); renderCalendar(viewDate); });
  nextBtn?.addEventListener('click', ()=>{ viewDate.setMonth(viewDate.getMonth()+1); renderCalendar(viewDate); });

  timeToggle?.addEventListener('click', ()=>{
    const show = !timeList.classList.contains('show');
    timeList.classList.toggle('show', show);
    timeToggle.setAttribute('aria-expanded', String(show));
  });
  timeList?.addEventListener('click', (e)=>{
    const li = e.target.closest('li');
    if(!li) return;
    selectedTime = li.dataset.time;
    timeToggle.textContent = `Uhrzeit: ${selectedTime}`;
    timeList.classList.remove('show');
    timeToggle.setAttribute('aria-expanded', 'false');
  });

  predictBtn?.addEventListener('click', ()=>{
    if(!selectedDate || !selectedTime){
      predictOutput.textContent = 'Bitte wähle Datum und Uhrzeit.';
      return;
    }
    const est = estimateVisitors(selectedDate, selectedTime);
    const dd = String(selectedDate.getDate()).padStart(2,'0');
    const mm = String(selectedDate.getMonth()+1).padStart(2,'0');
    const yyyy = selectedDate.getFullYear();
    predictOutput.classList.add('predict-result');
    predictOutput.innerHTML = `
      <p>Die geschätzte Auslastung am ${dd}.${mm}.${yyyy} um ${selectedTime} in Luzern liegt bei</p>
      <strong>${est.toLocaleString('de-CH')} Besucher:innen</strong>
      <p class="predict-footer">Viu Spass bi dim Usflug uf Lozärn!</p>
    `;
  });

  renderCalendar(viewDate);
}

// Simple heuristic: average of last 30 days, matching weekday and hour across all locations
function estimateVisitors(dateObj, timeStr){
  try {
    if(!Array.isArray(RAW_DATA) || RAW_DATA.length===0) return 0;
    const [hStr] = timeStr.split(':');
    const targetHour = Number(hStr);
    const targetWk = dateObj.getDay(); // 0=Sun
    const now = new Date();
    const cutoff = now.getTime() - 90*24*60*60*1000; // last 90 days

    // group by location to avoid bias if some locations have more entries
    const byLoc = RAW_DATA.reduce((acc, it)=>{
      const t = new Date(it.messzeit).getTime();
      if(isNaN(t) || t < cutoff) return acc;
      const d = new Date(t);
      const wk = d.getDay();
      const hr = d.getHours();
      if(wk !== targetWk || hr !== targetHour) return acc;
      (acc[it.location] ||= []).push(Number(it.counter)||0);
      return acc;
    }, {});

    // average per location, then sum
    let total = 0;
    Object.values(byLoc).forEach(arr=>{
      if(arr.length){ total += arr.reduce((s,n)=>s+n,0)/arr.length; }
    });
    return Math.round(total);
  } catch(e){
    console.error('estimateVisitors error', e);
    return 0;
  }
}