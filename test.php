<?php

$name = "Laila";
echo $name . '<br>';


$wg = ["Barbie", "Ken", "Allan"];

echo $wg[2] . '<br>';

foreach ($wg as $char) {
    echo $char . '<br>';
}

$standorte = [
    "Chur" => 15.4,
    "Wien" => 20.1,
    "Zürich" => 25.3
];

echo '<pre>';
print_r($standorte["Zürich"]);
echo '</pre>';

foreach ($standorte as $stadt => $temp) {
    echo "In $stadt sind es $temp °C <br>";
}