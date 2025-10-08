<?php
/**
 * im3load.php
 *
 * Lädt die transformierten Zählerdaten in eine Datenbank.
 */

// 1. Transformations-Skript einbinden
// WICHTIG: Wir verwenden hier 'im3transform.php', da dies der Name aus unserem Austausch ist.
// Der Call gibt den JSON-String der transformierten Daten zurück.
$jsonData = include('im3transform.php');

// 2. Dekodiert die JSON-Daten zu einem Array
$dataArray = json_decode($jsonData, true);

// 3. Datenbankkonfiguration einbinden
require_once 'im3config.php'; // Bindet die Datenbankkonfiguration ein

// Frühzeitige Prüfung: Wenn keine Daten da sind, abbrechen.
if (!is_array($dataArray) || empty($dataArray)) {
    die("Fehler: Keine gültigen Daten zum Laden vorhanden. Überprüfe im3transform.php.");
}

try {
    // 4. Datenbankverbindung herstellen
    $pdo = new PDO($dsn, $username, $password, $options);

    // 5. SQL-Query anpassen an die Zählerdaten
    // TABELLENNAME WURDE AUF 'im3_semesterprojekt' GEÄNDERT, um mit der Datenbank zu matchen.
    // BITTE STELL SICHER, DASS DIESE TABELLE AUCH DIE SPALTEN 'location', 'counter' UND 'messzeit' ENTHÄLT!
    $sql = "INSERT INTO im3_semesterprojekt (location, counter, messzeit) VALUES (?, ?, ?)";

    // Bereitet die SQL-Anweisung vor
    $stmt = $pdo->prepare($sql);

    // 6. Daten einfügen
    foreach ($dataArray as $item) {
        // Prüfen, ob alle benötigten Schlüssel vorhanden sind (zur Sicherheit)
        if (isset($item['location'], $item['counter'], $item['messzeit'])) {
            $stmt->execute([
                $item['location'], // z.B. "Kappelbrücke"
                $item['counter'],  // z.B. 231
                $item['messzeit']  // z.B. "2025-10-07 08:32:00"
            ]);
        }
    }
    // print_r($dataArray);
    echo "Daten erfolgreich eingefügt: " . count($dataArray) . " Einträge geladen.";

} catch (PDOException $e) {
    // 7. Fehlerbehandlung
    die("Verbindung zur Datenbank konnte nicht hergestellt oder Query nicht ausgeführt werden: " . $e->getMessage());
}