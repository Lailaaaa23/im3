console.log("hello world");

fetch("https://xn--whatsuplozrn-pcb.podcastchaeller.ch/im3_semesterprojekt/im3unload.php")
    .then (response => response.json())
    .then (data => {
        console.log(data);
    })
    .catch(error => {
        console.error('Error:', error);
});
