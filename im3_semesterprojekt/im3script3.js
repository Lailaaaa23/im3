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

function formatCH(dateLike) {
  const d = new Date(dateLike);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function average(arr) {
  if (!arr.length) return 0;
  return arr.reduce((s, n) => s + n, 0) / arr.length;
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
              title: { display: true, text: "Anzahl Zaehlungen" },
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
              text: "Entwicklung der Zaehlstaende pro Standort ueber die Zeit",
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
});