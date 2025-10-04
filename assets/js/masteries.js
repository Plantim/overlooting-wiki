// assets/js/masteries.js

document.addEventListener('DOMContentLoaded', async () => {
    let allMasteries = {};
    let currentLang = localStorage.getItem('preferredLang') || 'en';

    // Correspondance entre les clés du JSON et les clés de traduction
    const heroTranslationMap = {
        "cat": "CAT_HERO_NAME",
        "dog": "DOG_HERO_NAME",
        "shadow": "SHADOW_HERO_NAME"
    };

    // --- CHARGEMENT DES DONNÉES ---
    await loadTranslations();

    try {
        const response = await fetch('assets/data/masteries.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        allMasteries = await response.json();
    } catch (error) {
        console.error("Failed to load masteries data:", error);
        return;
    }

    // --- SÉLECTION DES ÉLÉMENTS DU DOM ---
    const container = document.getElementById('masteries-container');
    const heroFilter = document.getElementById('hero-filter');
    const langSwitcher = document.getElementById('lang-switcher');
    const pageTitle = document.getElementById('page-title');

    // --- FONCTIONS ---

    function populateLangSwitcher() {
        const langNames = {
            en: "English", fr: "Français", de: "Deutsch", es: "Español",
            ja: "日本語", ko: "한국어", pt_BR: "Português (Brasil)",
            ru: "Русский", zh_CH: "简体中文"
        };
        const availableLangs = Object.keys(translations);
        langSwitcher.innerHTML = '';
        availableLangs.forEach(langCode => {
            if (langNames[langCode]) {
                const option = document.createElement('option');
                option.value = langCode;
                option.textContent = langNames[langCode];
                langSwitcher.appendChild(option);
            }
        });
        langSwitcher.value = currentLang;
    }

    function populateHeroFilter() {
        const heroes = Object.keys(allMasteries);
        heroFilter.innerHTML = `<option value="">${getTranslation('SELECT_HERO_PLACEHOLDER', currentLang)}</option>`; // Placeholder
        heroes.forEach(heroKey => {
            const option = document.createElement('option');
            option.value = heroKey;
            const translationKey = heroTranslationMap[heroKey] || heroKey;
            option.textContent = getTranslation(translationKey, currentLang);
            heroFilter.appendChild(option);
        });
    }

    function createMasteryCard(masteryId, masteryData, heroKey) {
        const card = document.createElement('div');
        card.className = 'mastery-card has-tooltip';

        const translatedName = getTranslation(masteryData.name, currentLang);
        const translatedDescription = getTranslation(masteryData.description, currentLang);
        
        // Supposition sur le chemin de l'icône
        const iconUrl = `assets/game/masteries/${heroKey}/${masteryId}.png`;

        card.setAttribute('data-tooltip', translatedDescription);

        card.innerHTML = `
            <img src="${iconUrl}" alt="${translatedName}" class="mastery-icon" loading="lazy">
            <div class="mastery-name">${translatedName}</div>
        `;
        return card;
    }

    function displayMasteries() {
        const selectedHero = heroFilter.value;
        container.innerHTML = '';

        if (!selectedHero || !allMasteries[selectedHero]) {
            container.innerHTML = `<p class="hero-selection-prompt">${getTranslation('SELECT_HERO_PLACEHOLDER', currentLang)}</p>`;
            return;
        }

        const heroData = allMasteries[selectedHero];
        const levelWord = getTranslation('LEVEL_WORD_KEY', currentLang);

        // Affiche les niveaux dans l'ordre (level_1, level_2, ...)
        Object.keys(heroData).sort().forEach(levelKey => {
            const levelNumber = levelKey.split('_')[1];
            const levelMasteries = heroData[levelKey];
            
            const levelSection = document.createElement('div');
            levelSection.className = 'mastery-level-section';
            
            const levelTitle = document.createElement('h2');
            levelTitle.className = 'mastery-level-title';
            levelTitle.textContent = `${levelWord} ${levelNumber}`;
            
            const grid = document.createElement('div');
            grid.className = 'mastery-grid';

            for (const masteryId in levelMasteries) {
                const card = createMasteryCard(masteryId, levelMasteries[masteryId], selectedHero);
                grid.appendChild(card);
            }
            
            levelSection.appendChild(levelTitle);
            levelSection.appendChild(grid);
            container.appendChild(levelSection);
        });
    }

    function updateUIText() {
        document.title = getTranslation('PAGE_TITLE_MASTERIES', currentLang);
        pageTitle.textContent = getTranslation('PAGE_TITLE_MASTERIES', currentLang);
        populateHeroFilter(); // Recrée le filtre avec les noms traduits
        // Affiche à nouveau les maîtrises pour mettre à jour les noms/descriptions
        displayMasteries(); 
    }

    // --- INITIALISATION ---
    populateLangSwitcher();
    updateUIText(); // Appelle populateHeroFilter et displayMasteries

    // --- ÉCOUTEURS D'ÉVÉNEMENTS ---
    heroFilter.addEventListener('change', displayMasteries);
    
    langSwitcher.addEventListener('change', (e) => {
        currentLang = e.target.value;
        localStorage.setItem('preferredLang', currentLang);
        updateUIText();
    });
});