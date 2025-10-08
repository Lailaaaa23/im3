<?php
/**
 * im3unload.php
 *
 * Ruft die neuesten Zählerdaten pro Standort aus der Datenbank ab
 * und gibt sie als JSON-Array zurück.
 */

// 1. Datenbankkonfiguration einbinden
// WICHTIG: Passe den Pfad zu deiner Konfigurationsdatei an, falls nötig!
require_once 'im3config.php';

// Setzt den Content-Type-Header auf JSON, damit Browser oder Clients wissen,
// dass es sich um JSON-Daten handelt.
header('Content-Type: application/json');

try {
    // 2. Datenbankverbindung herstellen
    $pdo = new PDO($dsn, $username, $password, $options);

    // 3. SQL-Query: Neueste Messung pro Standort abrufen
    // Ein gängiges Muster ist die Verwendung eines JOINs oder eines Sub-Queries,
    // um die maximale 'messzeit' pro 'location' zu finden und dann
    // die vollständigen Zeilen abzurufen.

    $sql = "
        SELECT 
            t1.location, 
            t1.counter, 
            t1.messzeit
        FROM 
            im3_semesterprojekt t1
        INNER JOIN (
            SELECT 
                location, 
                MAX(messzeit) AS latest_messzeit
            FROM 
                im3_semesterprojekt
            GROUP BY 
                location
        ) t2 
        ON t1.location = t2.location AND t1.messzeit = t2.latest_messzeit
        ORDER BY 
            t1.location ASC
    ";

    // Bereitet die SQL-Anweisung vor und führt sie aus
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    
    // Holt alle Ergebnisse als assoziatives Array
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 4. JSON-Ausgabe
    // Gibt das Ergebnis-Array als JSON kodiert zurück
    echo json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    // 5. Fehlerbehandlung
    // Gibt einen Fehler im JSON-Format aus, falls eine Ausnahme auftritt
    error_log("Datenbankfehler in im3unload.php: " . $e->getMessage());
    http_response_code(500); // Setzt den HTTP-Statuscode auf 500 (Internal Server Error)
    echo json_encode(['error' => 'Datenbankfehler beim Abrufen der Daten: ' . $e->getMessage()]);
}