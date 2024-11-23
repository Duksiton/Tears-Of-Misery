const backgroundMusic = document.getElementById("backgroundMusic");
const playPauseButton = document.getElementById("playPauseButton");
const volumeSlider = document.getElementById("volumeSlider");

// Cargar el estado guardado al cargar la página
window.addEventListener('load', () => {
    const isPlaying = localStorage.getItem('isPlaying') !== 'false'; // Por defecto, inicia como "true"
    const volume = localStorage.getItem('volume');

    // Asigna el volumen guardado
    if (volume) {
        backgroundMusic.volume = volume;
        volumeSlider.value = volume; // Actualiza el slider con el volumen guardado
    }

    // Si no se ha pausado y está silenciado, intenta reproducir
    if (isPlaying) {
        backgroundMusic.play().catch(error => {
            console.log("La reproducción automática fue bloqueada por el navegador.");
        });
        playPauseButton.textContent = "⏸ Pause"; // Cambia el texto para mayor claridad
    }
});

// Función para reproducir, pausar y guardar el estado
function togglePlayPause() {
    if (backgroundMusic.paused) {
        backgroundMusic.muted = false; // Desmutea antes de reproducir
        backgroundMusic.play();
        playPauseButton.textContent = "⏸ Pause"; // Cambia el texto
        localStorage.setItem('isPlaying', 'true');
    } else {
        backgroundMusic.pause();
        playPauseButton.textContent = "▶ Play"; // Cambia el texto a "Play"
        localStorage.setItem('isPlaying', 'false');
    }
}

// Función para ajustar el volumen y guardar el nivel
function changeVolume() {
    backgroundMusic.volume = volumeSlider.value;
    localStorage.setItem('volume', volumeSlider.value);
}
