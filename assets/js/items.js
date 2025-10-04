document.addEventListener('DOMContentLoaded', async () => {
    let allItems = [];
    let currentLang = localStorage.getItem('preferredLang') || 'en';

    const categoryTranslationMap = {
        "Torso": "CHESTPIECE_CATEGORY",
        "weapon": "WEAPON_CATEGORY",
        "Weapon": "WEAPON_CATEGORY",
        "Shield": "SHIELD_CATEGORY",
        "Ring": "RING_CATEGORY",
        "Head": "HEADPIECE_CATEGORY",
        "Footwear": "FOOTWEAR_CATEGORY",
        "Amulet": "NECKLACE_CATEGORY"
    };

    // Charge et fusionne toutes les traductions nécessaires (items + UI)
    await loadTranslations();

    // Charge les données principales des items
    try {
        const response = await fetch('assets/data/tres_data_levels.json');
        const data = await response.json();
        allItems = processData(data);
    } catch (error) {
        console.error("Failed to load item data:", error);
        return;
    }

    // --- TRI DES OBJETS ---
    const rarityOrder = {
        'Common': 1,
        'Uncommon': 2,
        'Rare': 3,
        'Epic': 4,
        'Legendary': 5,
        'Mythic': 6
    };

    allItems.sort((a, b) => {
        const setComparison = a.set.localeCompare(b.set);
        if (setComparison !== 0) {
            return setComparison;
        }
        return rarityOrder[a.rarity] - rarityOrder[b.rarity];
    });

    const grid = document.getElementById('items-grid');
    const searchInput = document.getElementById('search-input');
    const rarityFilter = document.getElementById('rarity-filter');
    const categoryFilter = document.getElementById('category-filter');
    const setFilter = document.getElementById('set-filter');
    const statsFilter = document.getElementById('stats-filter');
    const langSwitcher = document.getElementById('lang-switcher');

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

    function processData(data) {
        const items = [];
        for (const setKey in data) {
            const folderName = setKey.replace('_set', '');
            for (const itemId in data[setKey]) {
                const itemData = data[setKey][itemId];
                items.push({ id: itemId, folder: folderName, set: setKey, ...itemData });
            }
        }
        return items;
    }

    function getTranslatedStat(statKey, statValue, lang, allStats) {
        if (statKey === 'min_physical_damage') {
            const maxVal = allStats['max_physical_damage'];
            const translatedKey = getTranslation('PHYSICAL_DAMAGE_NAME', lang);
            return `<li>${translatedKey}: ${statValue} - ${maxVal}</li>`;
        }
        if (statKey === 'max_physical_damage') return null;
        if (statKey === 'min_magic_damage') {
            const maxVal = allStats['max_magic_damage'];
            const translatedKey = getTranslation('MAGIC_DAMAGE_NAME', lang);
            return `<li>${translatedKey}: ${statValue} - ${maxVal}</li>`;
        }
        if (statKey === 'max_magic_damage') return null;

        let translatedKey = '';
        let prefix = '';

        if (statKey.startsWith('min_')) {
            prefix = getTranslation('MIN_PREFIX_KEY', lang) + ' '; 
            const baseKey = statKey.replace('min_', '').toUpperCase() + '_NAME';
            translatedKey = getTranslation(baseKey, lang);
        } else if (statKey.startsWith('max_')) {
            prefix = getTranslation('MAX_PREFIX_KEY', lang) + ' ';
            const baseKey = statKey.replace('max_', '').toUpperCase() + '_NAME';
            translatedKey = getTranslation(baseKey, lang);
        } else {
            const baseKey = statKey.toUpperCase() + '_NAME';
            translatedKey = getTranslation(baseKey, lang) || statKey;
        }

        return `<li>${prefix}${translatedKey}: ${statValue}</li>`;
    }

    function createMemoryCard(item) {
        // AJOUT : On définit ici la liste de nos exceptions pour les noms de fichiers
        const nameExceptions = {
            'draconic': 'dragonkin'
            // Si vous trouvez d'autres erreurs, vous pourrez les ajouter ici.
        };

        const card = document.createElement('div');
        card.className = `memory-card ${item.rarity.toLowerCase()}`;
        
        // Définition des URLs des deux images
        // 1. Image de l'objet (devant) : 128px (affiché en 80px)
        const itemIconUrl = `assets/game/upscaled_assets/items/sets/${item.folder}/icons/${item.icon}.png`;
        
        // 2. Image de fond (derrière) : 160px, basée sur la rareté (affiché en 100px)
        const backgroundRarityName = item.rarity.toLowerCase(); // common, rare, epic, etc.
        const itemBackgroundUrl = `assets/game/upscaled_assets/items/other/${backgroundRarityName}_item_background.png`;

        const rarityKey = `${item.rarity.toUpperCase()}_KEY`;
        const categoryKey = categoryTranslationMap[item.category] || item.category;

        const translatedName = getTranslation(item.name, currentLang);
        let nameHtml = translatedName;
        if (currentLang !== 'en') {
            const englishName = getTranslation(item.name, 'en');
            if (translatedName !== englishName) {
                nameHtml += ` <span class="english-name">(${englishName})</span>`;
            }
        }

        let setTranslationKey;
        let tooltipHtmlAttribute = '';
        let setIconHtml = '';

        if (item.rarity === 'Mythic') {
            setTranslationKey = `${item.equipment_set.toUpperCase()}_NAME`;
            const descriptionKey = setTranslationKey.replace('_NAME', '_DESCRIPTION');
            const translatedDescription = getTranslation(descriptionKey, currentLang);
            
            let iconName = item.equipment_set.toLowerCase().replace('_set', '').replace('_mythic', '');
            // On vérifie si notre nom a une exception, sinon on garde le nom original
            iconName = nameExceptions[iconName] || iconName;

            const setIconUrl = `assets/game/upscaled_assets/sets/mythics/${iconName}.png`;
            setIconHtml = `<img src="${setIconUrl}" alt="${iconName} set icon" class="set-icon">`;

            if (translatedDescription) {
                const tooltipContent = translatedDescription.replace(/"/g, '&quot;').replace(/\n/g, '&#10;');
                tooltipHtmlAttribute = `data-tooltip="${tooltipContent}"`;
            }
        } else {
            setTranslationKey = `${item.set.toUpperCase().replace('_SET', '')}_SET_NAME`;
            
            let iconName = item.set.replace('_set', '');
            // On vérifie si notre nom a une exception, sinon on garde le nom original
            iconName = nameExceptions[iconName] || iconName;
            
            const setIconUrl = `assets/game/upscaled_assets/sets/${iconName}.png`;
            setIconHtml = `<img src="${setIconUrl}" alt="${iconName} set icon" class="set-icon">`;

            const setBaseKey = `${item.set.toUpperCase()}_SET`;
            const finalDescriptionParts = [];
            const generalDescKey = `${setBaseKey}_GENERAL_DESCRIPTION`;
            const generalDesc = getTranslation(generalDescKey, currentLang);
            if (generalDesc && generalDesc !== generalDescKey) {
                finalDescriptionParts.push(generalDesc);
            }

            const breakpointParts = [];
            for (let i = 0; i <= 2; i++) {
                const bpKey = `${setBaseKey}_BREAKPOINT_${i}_DESCRIPTION`;
                const bpDesc = getTranslation(bpKey, currentLang);
                if (bpDesc && bpDesc !== bpKey) {
                    breakpointParts.push(bpDesc);
                }
            }

            if (finalDescriptionParts.length > 0 && breakpointParts.length > 0) {
                finalDescriptionParts.push('');
            }

            const fullDescription = [...finalDescriptionParts, ...breakpointParts];

            if (fullDescription.length > 0) {
                const tooltipContent = fullDescription.join('\n').replace(/"/g, '&quot;');
                tooltipHtmlAttribute = `data-tooltip="${tooltipContent}"`;
            }
        }

        let levelsHtml = '';
        for (let i = 1; i <= 3; i++) {
            const levelKey = `level ${i}`;
            const stats = item.stats[levelKey];
            let statsHtml = `<ul><li>${getTranslation('no_stats', currentLang)}</li></ul>`;
            if (stats && Object.keys(stats).length > 0) {
                statsHtml = '<ul>' + Object.entries(stats).map(([key, value]) => {
                    return getTranslatedStat(key, value, currentLang, stats);
                }).filter(Boolean).join('') + '</ul>';
            }
            levelsHtml += `<div id="level-${i}-${item.id}" class="level-content ${i === 1 ? 'active' : ''}">${statsHtml}</div>`;
        }
        
        const levelWord = getTranslation('LEVEL_WORD_KEY', currentLang) || 'Level';
        
        card.innerHTML = `
            <div class="memory-card-header"><span class="memory-card-name">${nameHtml}</span></div>
            <div class="memory-card-content">
                <div class="memory-card-image-container">
                    <img src="${itemBackgroundUrl}" alt="${item.rarity} background" class="item-background-image" loading="lazy">
                    <img src="${itemIconUrl}" alt="${translatedName}" class="memory-card-image" loading="lazy">
                </div>
                <div class="memory-card-info">
                    <div class="info-row">
                        <span class="label">${getTranslation('CATEGORY_WORD', currentLang)}</span>
                        <span class="value">${getTranslation(categoryKey, currentLang)}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">${getTranslation('RARITY_WORD', currentLang)}</span>
                        <span class="value rarity-value">${getTranslation( rarityKey, currentLang)}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">${getTranslation('SET_WORD_KEY', currentLang)}</span>
                        <span class="value set-info ${tooltipHtmlAttribute ? 'has-tooltip' : ''}" ${tooltipHtmlAttribute}>
                            ${setIconHtml}
                            <span>${getTranslation(setTranslationKey, currentLang)}</span>
                        </span>
                    </div>
                </div>
                <div class="memory-card-levels">
                    <div class="level-tabs">
                        <button class="tab-button active" data-level="1" data-itemid="${item.id}">${levelWord} 1</button>
                        <button class="tab-button" data-level="2" data-itemid="${item.id}">${levelWord} 2</button>
                        <button class="tab-button" data-level="3" data-itemid="${item.id}">${levelWord} 3</button>
                    </div>
                    ${levelsHtml}
                </div>
            </div>`;
        return card;
    }

    function displayItems() {
        grid.innerHTML = '';
        const searchValue = searchInput.value.toLowerCase();
        
        const rarityValue = rarityFilter.value;
        const categoryValue = categoryFilter.value;
        const setValue = setFilter.value;
        const statValue = statsFilter.value;

        const filteredItems = allItems.filter(item => {
            const translatedName = getTranslation(item.name, currentLang).toLowerCase();
            const nameMatch = translatedName.includes(searchValue);
            const rarityMatch = rarityValue === 'all' || item.rarity === rarityValue;
            const categoryMatch = categoryValue === 'all' || item.category === categoryValue;
            const setMatch = setValue === 'all' || item.set === setValue;
            
            const statMatch = statValue === 'all' || 
                Object.values(item.stats).some(levelStats => 
                    levelStats && Object.prototype.hasOwnProperty.call(levelStats, statValue)
                );

            return nameMatch && rarityMatch && categoryMatch && setMatch && statMatch;
        });

        filteredItems.forEach(item => {
            grid.appendChild(createMemoryCard(item));
        });
    }

    function updateUIText() {
        searchInput.placeholder = getTranslation('SEARCH_PLACEHOLDER_KEY', currentLang);
        
        document.querySelectorAll('#rarity-filter option').forEach(opt => {
            if (opt.value !== 'all') {
                opt.textContent = getTranslation(`${opt.value.toUpperCase()}_KEY`, currentLang);
            } else {
                opt.textContent = getTranslation('ALL_RARITIES_KEY', currentLang);
            }
        });

        document.querySelectorAll('#category-filter option').forEach(opt => {
             if (opt.value !== 'all') {
                opt.textContent = getTranslation(categoryTranslationMap[opt.value] || opt.value, currentLang);
            } else {
                 opt.textContent = getTranslation('ALL_CATEGORIES_KEY', currentLang);
            }
        });

        document.querySelectorAll('#set-filter option').forEach(opt => {
            if (opt.value !== 'all') {
                let key;
                if (opt.value === 'mythic') {
                    key = 'MYTHIC_KEY';
                } else {
                    key = `${opt.value.toUpperCase().replace('_SET', '')}_SET_NAME`;
                }
                opt.textContent = getTranslation(key, currentLang);
            } else {
                opt.textContent = getTranslation('ALL_SETS_KEY', currentLang);
            }
        });
        
        document.querySelectorAll('#stats-filter option').forEach(opt => {
            if (opt.value === 'all') {
                opt.textContent = getTranslation('ALL_STATS_KEY', currentLang);
            } else {
                 let statName = getTranslation(opt.value.toUpperCase() + '_NAME', currentLang);
                 if (opt.value === 'min_physical_damage') statName = getTranslation('PHYSICAL_DAMAGE_NAME', currentLang);
                 if (opt.value === 'min_magic_damage') statName = getTranslation('MAGIC_DAMAGE_NAME', currentLang);
                 opt.textContent = statName;
            }
        });
    }
    
    function populateFilters() {
        const categories = [...new Set(allItems.map(item => item.category))];
        categoryFilter.innerHTML = `<option value="all"></option>`;
        categories.sort().forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            categoryFilter.appendChild(option);
        });

        const sets = [...new Set(allItems.map(item => item.set))];
        setFilter.innerHTML = `<option value="all"></option>`;
        sets.sort().forEach(setName => {
            const option = document.createElement('option');
            option.value = setName;
            setFilter.appendChild(option);
        });
    }
    
    function populateStatsFilter() {
        const stats = new Set();
        allItems.forEach(item => {
            for (const level in item.stats) {
                if (item.stats[level]) {
                    Object.keys(item.stats[level]).forEach(statKey => {
                        if (!statKey.startsWith('max_')) {
                           stats.add(statKey);
                        }
                    });
                }
            }
        });

        const sortedStats = [...stats].sort((a, b) => {
            const translatedA = getTranslation(a.toUpperCase() + '_NAME', currentLang);
            const translatedB = getTranslation(b.toUpperCase() + '_NAME', currentLang);
            return translatedA.localeCompare(translatedB);
        });

        statsFilter.innerHTML = `<option value="all"></option>`;
        sortedStats.forEach(statKey => {
            const option = document.createElement('option');
            option.value = statKey;
            let statName = getTranslation(statKey.toUpperCase() + '_NAME', currentLang);
            if (statKey === 'min_physical_damage') statName = getTranslation('PHYSICAL_DAMAGE_NAME', currentLang);
            if (statKey === 'min_magic_damage') statName = getTranslation('MAGIC_DAMAGE_NAME', currentLang);

            option.textContent = statName;
            statsFilter.appendChild(option);
        });
    }
    
    grid.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-button')) {
            const itemId = e.target.dataset.itemid;
            const level = e.target.dataset.level;
            const card = e.target.closest('.memory-card');
            card.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            card.querySelectorAll('.level-content').forEach(content => content.classList.remove('active'));
            card.querySelector(`#level-${level}-${itemId}`).classList.add('active');
        }
    });

    // --- INITIALISATION ---
    populateLangSwitcher();
    populateFilters();
    populateStatsFilter();
    updateUIText();
    displayItems();

    // --- ÉCOUTEURS D'ÉVÉNEMENTS ---
    searchInput.addEventListener('input', debounce(displayItems, 100));
    rarityFilter.addEventListener('change', displayItems);
    categoryFilter.addEventListener('change', displayItems);
    setFilter.addEventListener('change', displayItems);
    statsFilter.addEventListener('change', displayItems);
    
    langSwitcher.addEventListener('change', (e) => {
        currentLang = e.target.value;
        localStorage.setItem('preferredLang', currentLang);
        populateStatsFilter();
        updateUIText();
        displayItems();
    });
});