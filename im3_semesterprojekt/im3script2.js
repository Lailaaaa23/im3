// Funktion zum Laden und Anzeigen der Daten (Tabelle und Grafik)
function loadDataAndDisplay() {
    // Behalte deine tatsächliche URL bei
    const apiUrl = "https://xn--whatsuplozrn-pcb.podcastchaeller.ch/im3_semesterprojekt/im3unload.php";
    
    // Füge das Canvas-Element hinzu
    const chartCanvas = document.getElementById('counterChart'); 
    
    // Daten mit fetch abrufen
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP-Fehler! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(dataArray => { 
            console.log('Daten empfangen:', dataArray);
            if (dataArray.error || !dataArray || dataArray.length === 0) {
                // Nur Logging, keine Anzeige im HTML mehr
                console.error('Keine Daten gefunden oder Fehler:', dataArray.error || 'Daten-Array ist leer.');
                return;
            }

            // ==========================================
            // 1. DATEN FÜR ZEITREIHEN-CHART.JS AUFBEREITEN
            // ==========================================

            const groupedData = dataArray.reduce((acc, item) => {
                const location = item.location;
                if (!acc[location]) {
                    acc[location] = [];
                }
                acc[location].push(item);
                return acc;
            }, {});

            const colors = ['rgb(255, 99, 132)', 'rgb(54, 162, 235)', 'rgb(255, 206, 86)', 'rgb(75, 192, 192)', 'rgb(153, 102, 255)']; 
            let colorIndex = 0;

            const datasets = Object.keys(groupedData).map(location => {
                const locationData = groupedData[location];
                const color = colors[colorIndex++ % colors.length]; 

                const dataPoints = locationData
                    .sort((a, b) => new Date(a.messzeit) - new Date(b.messzeit))
                    .map(item => ({
                        x: item.messzeit, 
                        y: item.counter
                    }));

                return {
                    label: location,
                    data: dataPoints,
                    borderColor: color,
                    backgroundColor: color.replace('rgb', 'rgba').replace(')', ', 0.5)'), 
                    tension: 0.1, 
                    fill: false, 
                };
            });

            const allMesszeiten = [...new Set(dataArray.map(item => item.messzeit))];

            const chartData = {
                labels: allMesszeiten.sort(), 
                datasets: datasets,
            };

            // ==========================================
            // 2. CHART.JS KONFIGURATION
            // ==========================================

            const config = {
                type: 'line', 
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false, 
                    scales: {
                        x: {
                            type: 'time', 
                            time: {
                                unit: 'hour', 
                                displayFormats: {
                                    hour: 'HH:mm' 
                                },
                                tooltipFormat: 'dd.MM.yyyy HH:mm:ss', 
                            },
                            title: {
                                display: true,
                                text: 'Messzeit'
                            }
                        },
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Anzahl Zählungen'
                            }
                        }
                    },
                    plugins: {
                        legend: { position: 'top' },
                        title: {
                            display: true,
                            text: 'Entwicklung der Zählerstände pro Standort über die Zeit'
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                        }
                    },
                },
            };

            if (chartCanvas) {
                if (window.myLineChart instanceof Chart) {
                   window.myLineChart.destroy();
                }

                window.myLineChart = new Chart( 
                    chartCanvas,
                    config
                );
            }

        })
        .catch(error => {
            console.error('Fehler beim Fetchen der Daten:', error);
            // Keine Meldung an den Benutzer, Fokus liegt auf dem Diagramm
        });
}

// Funktion aufrufen
loadDataAndDisplay();