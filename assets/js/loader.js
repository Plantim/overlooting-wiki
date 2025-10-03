document.addEventListener('DOMContentLoaded', function() {
    const loaderWrapper = document.getElementById('loader-wrapper');
    const container = document.querySelector('.container');


    
    // Attend que toute la page soit chargée (y compris les images et les styles)
    window.addEventListener('load', function() {
        // Cache le loader en douceur (optionnel, pour un effet de fondu)
        if (loaderWrapper) {
            loaderWrapper.style.opacity = '0';
            // Attend la fin de la transition avant de le cacher complètement
            setTimeout(() => {
                loaderWrapper.style.display = 'none';
            }, 500); // 500ms correspond à la durée de la transition CSS si vous en ajoutez une
        }
        
        // Affiche le contenu principal
        if (container) {
            container.style.display = 'block';
        }
    });
    
    // AJOUT : Affiche le numéro de version en bas à droite
    const versionDisplay = document.getElementById('version-display');
    // On vérifie que la variable globale APP_VERSION existe bien
    if (versionDisplay && typeof APP_VERSION !== 'undefined') {
        versionDisplay.textContent = `v${APP_VERSION}`;
    }
});