// Funktion zum Laden und Anzeigen der Daten (Tabelle und Grafik)
function loadDataAndDisplay() {
    // Behalte deine tatsächliche URL bei
    const apiUrl = "https://xn--whatsuplozrn-pcb.podcastchaeller.ch/im3_semesterprojekt/im3unload.php";
    
    // Füge das Canvas-Element hinzu
    const chartCanvas = document.getElementById('counterChart'); 
    
    // Der Container für die Tabelle
    const container = document.getElementById('data-container');
    
    // Daten mit fetch abrufen
    fetch("https://xn--whatsuplozrn-pcb.podcastchaeller.ch/im3_semesterprojekt/im3unload.php")
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP-Fehler! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(dataArray => { // Name zu dataArray geändert für Klarheit
            console.log('Daten empfangen:', dataArray);
            if (dataArray.error || !dataArray || dataArray.length === 0) {
                container.innerHTML = `<p style="color: red;">Keine Daten gefunden oder Fehler: ${dataArray.error || 'Daten-Array ist leer.'}</p>`;
                return;
            }

            // ------------------------------------------
            // NEU: 1. DATEN FÜR CHART.JS AUFBEREITEN
            // ------------------------------------------
            
            // Labels (Standorte) und Daten (Zählerstände) extrahieren
            const labels = dataArray.map(item => item.location); 
            const counterValues = dataArray.map(item => item.counter); 
            
            const chartData = {
                labels: labels, 
                datasets: [
                    {
                        label: 'Aktueller Zählerstand',
                        data: counterValues,
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.7)',
                        // Bei Balken sind Farben pro Element oft gut:
                        // backgroundColor: counterValues.map(() => 'rgba(75, 192, 192, 0.7)'), 
                    }
                ]
            };
            
            // ------------------------------------------
            // NEU: 2. CHART.JS KONFIGURATION UND INSTANZIIERUNG
            // ------------------------------------------
            
            const config = {
                type: 'bar', // Balkendiagramm für Standort-Vergleich
                data: chartData,
                options: {
                    responsive: true,
                    scales: {
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
                            text: 'Aktuellste Zählerstände pro Standort'
                        }
                    }
                },
            };
            
            if (chartCanvas) {
                new Chart(
                    chartCanvas,
                    config
                );
            }


            // ------------------------------------------
            // 3. TABELLE ANZEIGEN (Deine ursprüngliche Logik)
            // ------------------------------------------

            // Starte den Tabellen-HTML-Code
            let tableHTML = '<table>';
            
            // FERTIG: Tabellenkopf erstellen
            tableHTML += '<thead><tr>';
            tableHTML += `<th>Standort</th><th>Zählerstand</th><th>Messzeit</th>`;
            tableHTML += '</tr></thead>';
            
            // KÖRPER: Tabellenzeilen erstellen
            tableHTML += '<tbody>';
            dataArray.forEach(item => { // Verwende dataArray
                tableHTML += '<tr>';
                tableHTML += `<td>${item.location}</td>`;
                tableHTML += `<td>${item.counter}</td>`;
                tableHTML += `<td>${item.messzeit}</td>`;
                tableHTML += '</tr>';
            });
            tableHTML += '</tbody>';

            // Tabelle abschliessen und einfügen
            tableHTML += '</table>';
            container.innerHTML = tableHTML;

        })
        .catch(error => {
            console.error('Fehler beim Fetchen der Daten:', error);
            container.innerHTML = `<p style="color: red;">Netzwerk- oder Verarbeitungsfehler: ${error.message}</p>`;
        });
}

// Funktion aufrufen (Namen angepasst)
loadDataAndDisplay();