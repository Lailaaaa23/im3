<?php

$name = "Laila";
echo $name;

echo '<br>';

$a = 292;
$b = 130;
echo $a + $b;

$banane = ['mama banane', 'papa banane', 'baby banane'];

echo '<pre>';
print_r($banane[2]);
echo '</pre>';

foreach ($banane as $item) {
    echo $item . '<br>';
}

$standorte = [
    ['stadt' => 'Zürich', 'land' => 'Schweiz'],
    ['stadt' => 'Berlin', 'land' => 'Deutschland'],
    ['stadt' => 'Wien', 'land' => 'Österreich']
];