// Conserve vos fonctions existantes
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

let translations = {};

/**
 * MODIFIÉ : Charge maintenant translations.json ET ui_strings.json
 * et les fusionne dans un seul objet 'translations'.
 */
async function loadTranslations() {
    try {
        // On lance les deux requêtes en parallèle pour plus d'efficacité
        const [itemsRes, uiRes] = await Promise.all([
            fetch('assets/data/translations.json'),
            fetch('assets/data/ui_strings.json')
        ]);

        if (!itemsRes.ok || !uiRes.ok) {
            throw new Error(`HTTP error! status: ${itemsRes.status} or ${uiRes.status}`);
        }

        const itemsTranslations = await itemsRes.json();
        const uiStrings = await uiRes.json();

        // On fusionne les deux objets de traduction
        // Pour chaque langue, on combine les traductions des items et de l'UI
        for (const lang in uiStrings) {
            if (!itemsTranslations[lang]) {
                itemsTranslations[lang] = {}; // S'assure que la langue existe dans l'objet principal
            }
            // Les traductions de l'UI écraseront celles des items en cas de conflit de clé
            itemsTranslations[lang] = { ...itemsTranslations[lang], ...uiStrings[lang] };
        }
        
        translations = itemsTranslations;
        console.log("All translations loaded and merged successfully.");

    } catch (error) {
        console.error("Could not load translations:", error);
    }
}

function getTranslation(key, lang) {
    if (translations[lang] && translations[lang][key]) {
        return translations[lang][key];
    }
    // Si la traduction n'est pas trouvée, retourner la clé pour le débogage
    return key;
}

// --- GESTION DE LA NAVIGATION ACTIVE ET TRADUCTION ---
document.addEventListener('DOMContentLoaded', () => {
    // Cette fonction sera appelée une fois que les traductions seront chargées
    const setupNavigation = () => {
        const currentLang = localStorage.getItem('preferredLang') || 'en';
        const currentPage = window.location.pathname.split('/').pop();

        const navItemsLink = document.getElementById('nav-items');
        const navMasteriesLink = document.getElementById('nav-masteries');

        if (navItemsLink) {
            navItemsLink.textContent = getTranslation('NAV_ITEMS', currentLang);
            if (currentPage === 'items.html') {
                navItemsLink.classList.add('active');
            }
        }
        
        if (navMasteriesLink) {
            navMasteriesLink.textContent = getTranslation('NAV_MASTERIES', currentLang);
            if (currentPage === 'masteries.html') {
                navMasteriesLink.classList.add('active');
            }
        }
    };

    // On attend que la fonction loadTranslations soit disponible et on l'appelle.
    // Puis on configure la navigation.
    if (typeof loadTranslations === 'function') {
        loadTranslations().then(setupNavigation);
    } else {
        // Fallback si loadTranslations n'est pas encore défini
        setupNavigation();
    }

    // Ajout d'un écouteur pour mettre à jour la nav lors du changement de langue
    document.getElementById('lang-switcher')?.addEventListener('change', () => {
        // Petit délai pour s'assurer que le reste de l'interface a eu le temps de se mettre à jour
        setTimeout(setupNavigation, 50);
    });
});