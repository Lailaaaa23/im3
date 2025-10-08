<?php

function fetchLucerneData(): array
{
    // Die API gibt die Zählerdaten für Luzern zurück
    $url = "https://portal.alfons.io/app/devicecounter/api/sensors?api_key=3ad08d9e67919877e4c9f364974ce07e36cbdc9e";

    // Initialisiert eine cURL-Sitzung
    $ch = curl_init($url);

    // Setzt Optionen
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    // Führt die cURL-Sitzung aus und erhält den Inhalt
    $response = curl_exec($ch);

    // Schließt die cURL-Sitzung
    curl_close($ch);

    // Dekodiert die JSON-Antwort
    $decoded_response = json_decode($response, true);

    // Prüft, ob 'data' vorhanden ist und gibt nur das Array mit den Sensordaten zurück.
    return $decoded_response['data'] ?? [];
}

// Gibt Daten aus, wenn das Skript per 'include' eingebunden wird
return fetchLucerneData();
