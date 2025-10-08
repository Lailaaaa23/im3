<?php
// Bindet das Skript im3extract.php für Rohdaten ein.
// Die Rückgabe von im3extract.php (ein Array) wird direkt in $rawData gespeichert.
$rawData = include('im3extract.php');

/**
 * transformData
 *
 * - Nimmt die Rohdaten (Array) entgegen.
 * - Transformiert sie in das gewünschte Format (location, counter, messzeit).
 * - Filtert "Wifi"-Einträge.
 * - Gibt einen JSON-String zurück (für load.php).
 */

function transformData(array $inputData): string {

    // Mapping: API-Location-Namen auf Anzeigenamen mappen
    $locationMap = [
        "Kapellbruecke"   => "Kappelbrücke",
        "Loewendenkmal"   => "Löwendenkmal",
        "Hertensteinstr"  => "Hertensteinstrasse",
        "Rathausquai"     => "Rathausquai",
        "Schwanenplatz"   => "Schwanenplatz"
    ];

    $result = [];

    foreach ($inputData as $entry) {
        // 1) Filterung: Eintrag "Kapellbrücke Wifi" weglassen
        // Wir prüfen, ob der Name das Wort 'Wifi' enthält.
        if (strpos($entry['name'] ?? '', 'Wifi') !== false) {
            continue; // Überspringt diesen Datensatz
        }

        // 2) Pflichtfelder prüfen (zur Sicherheit)
        if (!isset($entry['name'], $entry['counter'], $entry['ISO_time'])) {
            error_log("Fehlende Pflichtfelder in einem Datensatz: " . json_encode($entry));
            continue;
        }

        // Standortname ggf. mappen
        $location = $entry['name'];
        if (isset($locationMap[$location])) {
            $location = $locationMap[$location];
        }

        // Zählerwert casten
        $counter = (int) $entry['counter'];

        // Messzeit in MySQL-Format konvertieren
        $messzeit = date("Y-m-d H:i:s", strtotime($entry['ISO_time']));

        // Flaches Array bauen (ohne nodeid und zone)
        $result[] = [
            "location"  => $location,
            "counter"   => $counter,
            "messzeit"  => $messzeit
        ];
    }

    // 3) Optional: Sortieren nach Messzeit (aufsteigend)
    usort($result, function($a, $b) {
        return strtotime($a['messzeit']) - strtotime($b['messzeit']);
    });

    // 4) JSON kodieren und zurückgeben (WICHTIG: Kein echo, kein header!)
    return json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}

// Gibt den Rückgabewert der Funktion transformData() als Ergebnis des 'include' zurück.
if (is_array($rawData)) {
    return transformData($rawData);
} else {
    // Gibt einen leeren JSON-Array-String zurück, wenn die Rohdaten ungültig sind
    return json_encode([]);
}