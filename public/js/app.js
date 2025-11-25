/**
 * WrapMeApp - Main Application v1.9.2
 * Clean, modular design using scientific calculation engine
 *
 * v1.9.2: Redesigned weather button - compact inline "Enter" button
 * v1.9.1: Added change location button for easy location switching
 * v1.9.0: Comprehensive UX/UI improvements - responsive, accessible, dark mode
 * v1.8.7: Simplified warmth indicator - removed CLO references, added color gradient
 * v1.8.6: Removed artificial 300ms delay - instant recommendations
 * v1.8.5: Removed "Temperature outside" heading, enlarged profile display
 * v1.8.4: Fixed icon layout - icons now inline with each item
 * v1.8.3: Fixed weather result UX - displays below input, keeps address intact
 * v1.8.2: Removed overly strict winter coat validation
 * v1.8.1: Fixed unrealistic CLO requirements for cold weather
 * v1.8.0: T-shirt foundation layering system
 * v1.7.0: Address input, geocoding, weather API integration
 */

import { getRecommendations, findSubstitutes, replaceItem } from './engine.js?v=1.8.4';

// Application state
const state = {
    age: null,
    ageCategory: null,
    gender: null,
    temperature: 10,
    location: null,
    currentRecommendation: null
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    attachEventListeners();
});

function initializeApp() {
    const tempSlider = document.getElementById('tempSlider');
    const tempValue = document.getElementById('tempValue');

    if (tempSlider) {
        tempSlider.addEventListener('input', (e) => {
            state.temperature = parseFloat(e.target.value);
            tempValue.textContent = state.temperature;
        });
    }

    tempValue.textContent = state.temperature;

    // Load saved preferences
    loadPreferences();
}

function attachEventListeners() {
    // Age selection
    document.querySelectorAll('[data-age]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const age = e.target.dataset.age;
            setAge(age, e);
        });
    });

    // Gender selection
    document.querySelectorAll('[data-gender]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const gender = e.target.dataset.gender;
            setGender(gender, e);
        });
    });

    // Continue button
    document.getElementById('continueBtn')?.addEventListener('click', getRecommendation);

    // Get weather button (geocode address)
    document.getElementById('getWeatherBtn')?.addEventListener('click', getWeatherFromAddress);

    // Location button (use current location)
    document.getElementById('locationBtn')?.addEventListener('click', useCurrentLocation);

    // Address input - Enter key triggers weather fetch
    document.getElementById('addressInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            getWeatherFromAddress();
        }
    });

    // Change profile button
    document.getElementById('changeProfileBtn')?.addEventListener('click', changeProfile);

    // Change location button
    document.getElementById('changeLocationBtn')?.addEventListener('click', changeLocation);

    // Restart button
    document.getElementById('restartBtn')?.addEventListener('click', restart);

    // Info/Substitutions button
    document.getElementById('infoBtn')?.addEventListener('click', openSubstitutionsModal);

    // Disclaimer link
    document.getElementById('disclaimerLink')?.addEventListener('click', (e) => {
        e.preventDefault();
        openSourcesModal();
    });

    // Modal close buttons
    document.getElementById('modalCloseBtn')?.addEventListener('click', closeSubstitutionsModal);
    document.getElementById('substituteModalCloseBtn')?.addEventListener('click', closeSubstituteModal);
    document.getElementById('sourcesModalCloseBtn')?.addEventListener('click', closeSourcesModal);

    // Modal backdrop clicks
    const substitutionsModal = document.getElementById('substitutionsModal');
    substitutionsModal?.addEventListener('click', (e) => {
        if (e.target === substitutionsModal) closeSubstitutionsModal();
    });

    const substituteModal = document.getElementById('substituteModal');
    substituteModal?.addEventListener('click', (e) => {
        if (e.target === substituteModal) closeSubstituteModal();
    });

    const sourcesModal = document.getElementById('sourcesModal');
    sourcesModal?.addEventListener('click', (e) => {
        if (e.target === sourcesModal) closeSourcesModal();
    });

    // Escape key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const substitutionsModal = document.getElementById('substitutionsModal');
            const substituteModal = document.getElementById('substituteModal');
            const sourcesModal = document.getElementById('sourcesModal');
            if (substitutionsModal?.classList.contains('active')) {
                closeSubstitutionsModal();
            }
            if (substituteModal?.classList.contains('active')) {
                closeSubstituteModal();
            }
            if (sourcesModal?.classList.contains('active')) {
                closeSourcesModal();
            }
        }
    });
}

// =======================
// PREFERENCES MANAGEMENT
// =======================

function loadPreferences() {
    try {
        const saved = localStorage.getItem('wrapUpPreferences');
        if (saved) {
            const prefs = JSON.parse(saved);
            if (prefs.age) state.age = prefs.age;
            if (prefs.ageCategory) state.ageCategory = prefs.ageCategory;
            if (prefs.gender) state.gender = prefs.gender;

            // If we have complete preferences, go directly to temperature screen
            if (prefs.ageCategory && (prefs.gender || prefs.ageCategory === 'infant' || prefs.ageCategory === 'child')) {
                showScreen('tempScreen');
                updateTempScreenProfile();
            }
        }
    } catch (e) {
        console.error('Error loading preferences:', e);
    }
}

function savePreferences() {
    try {
        const prefs = {
            age: state.age,
            ageCategory: state.ageCategory,
            gender: state.gender
        };
        localStorage.setItem('wrapUpPreferences', JSON.stringify(prefs));
    } catch (e) {
        console.error('Error saving preferences:', e);
    }
}

function updateTempScreenProfile() {
    const profileDisplay = document.getElementById('profileDisplay');
    const profileText = document.getElementById('profileText');

    if (!state.ageCategory) {
        profileDisplay?.classList.add('hidden');
        return;
    }

    const ageRanges = {
        'infant': '0-2',
        'child': '3-12',
        'teen': '13-17',
        'adult': '18-64',
        'elderly': '65+'
    };

    const genderDisplay = {
        'male': 'Male',
        'female': 'Female',
        'any': ''
    };

    const ageCategoryDisplay = {
        'infant': 'Infant',
        'child': 'Child',
        'teen': 'Teen',
        'adult': 'Adult',
        'elderly': 'Elderly'
    };

    const ageCategory = ageCategoryDisplay[state.ageCategory] || 'Adult';
    const ageRange = ageRanges[state.ageCategory] || '18-64';
    const gender = genderDisplay[state.gender] || '';

    const displayText = gender ? `${ageCategory} ${gender}, ${ageRange}` : `${ageCategory}, ${ageRange}`;
    profileText.textContent = displayText;
    profileDisplay?.classList.remove('hidden');
}

function changeProfile() {
    showScreen('ageScreen');
}

function changeLocation() {
    // Clear the address input
    const addressInput = document.getElementById('addressInput');
    if (addressInput) {
        addressInput.value = '';
        addressInput.focus();
    }

    // Hide weather result and change button
    const weatherResult = document.getElementById('weatherResult');
    const changeLocationBtn = document.getElementById('changeLocationBtn');

    if (weatherResult) {
        weatherResult.classList.add('hidden');
    }

    if (changeLocationBtn) {
        changeLocationBtn.classList.add('hidden');
    }
}

// =======================
// NAVIGATION
// =======================

function setAge(category, event) {
    const ages = {
        'infant': 1,
        'child': 7,
        'teen': 15,
        'adult': 35,
        'elderly': 70
    };
    state.ageCategory = category;
    state.age = ages[category];

    if (event && event.target) {
        selectButton(event.target);
    }

    savePreferences();

    setTimeout(() => {
        if (category === 'infant' || category === 'child') {
            state.gender = 'any';
            savePreferences();
            showScreen('tempScreen');
            updateTempScreenProfile();
        } else {
            showScreen('genderScreen');
        }
    }, 200);
}

function setGender(gender, event) {
    state.gender = gender;

    if (event && event.target) {
        selectButton(event.target);
    }

    savePreferences();

    setTimeout(() => {
        showScreen('tempScreen');
        updateTempScreenProfile();
    }, 200);
}

function selectButton(button) {
    const siblings = button.parentElement.querySelectorAll('.option');
    siblings.forEach(btn => btn.classList.remove('selected'));
    button.classList.add('selected');
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function restart() {
    state.age = null;
    state.ageCategory = null;
    state.gender = null;
    state.temperature = 10;
    state.currentRecommendation = null;

    const tempSlider = document.getElementById('tempSlider');
    const tempValue = document.getElementById('tempValue');

    if (tempSlider) tempSlider.value = 10;
    if (tempValue) tempValue.textContent = 10;

    showScreen('ageScreen');
}

// =======================
// WEATHER & LOCATION
// =======================

async function getWeatherFromAddress() {
    const addressInput = document.getElementById('addressInput');
    const address = addressInput.value.trim();

    if (!address) {
        alert('Please enter an address or postcode');
        return;
    }

    const btn = document.getElementById('getWeatherBtn');
    const originalText = btn.textContent;
    btn.textContent = 'Getting weather...';
    btn.disabled = true;

    try {
        // 1. Geocode the address using Nominatim (OpenStreetMap)
        const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
        const geocodeResponse = await fetch(geocodeUrl, {
            headers: {
                'User-Agent': 'WrapUp-ClothingApp/1.0'
            }
        });

        if (!geocodeResponse.ok) {
            throw new Error('Failed to geocode address');
        }

        const geocodeData = await geocodeResponse.json();

        if (geocodeData.length === 0) {
            alert('Address not found. Please try a different address or postcode.');
            btn.textContent = originalText;
            btn.disabled = false;
            return;
        }

        const location = geocodeData[0];
        const lat = parseFloat(location.lat);
        const lon = parseFloat(location.lon);

        console.log(`📍 Found location: ${location.display_name}`);
        console.log(`📍 Coordinates: ${lat}, ${lon}`);

        // 2. Get weather data
        await getWeatherFromCoordinates(lat, lon, location.display_name);

    } catch (error) {
        console.error('Error fetching weather:', error);
        alert('Unable to get weather data. Please check your address or use manual temperature.');
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

async function useCurrentLocation() {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser. Please enter your address manually.');
        return;
    }

    const btn = document.getElementById('locationBtn');
    btn.style.opacity = '0.6';

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            console.log(`📍 Current location: ${lat}, ${lon}`);

            try {
                await getWeatherFromCoordinates(lat, lon, 'Your location');
            } catch (error) {
                console.error('Error fetching weather:', error);
                alert('Unable to get weather data. Please use manual temperature.');
            } finally {
                btn.style.opacity = '1';
            }
        },
        (error) => {
            console.error('Geolocation error:', error);
            btn.style.opacity = '1';

            let message = 'Unable to get your location. ';
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    message += 'Please allow location access in your browser settings.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    message += 'Location information unavailable.';
                    break;
                case error.TIMEOUT:
                    message += 'Location request timed out.';
                    break;
                default:
                    message += 'Please enter your address manually.';
            }
            alert(message);
        },
        {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
        }
    );
}

async function getWeatherFromCoordinates(lat, lon, locationName) {
    try {
        // Use Open-Meteo API (free, no API key required)
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature&timezone=auto`;

        const weatherResponse = await fetch(weatherUrl);

        if (!weatherResponse.ok) {
            throw new Error('Failed to fetch weather data');
        }

        const weatherData = await weatherResponse.json();
        const actualTemp = Math.round(weatherData.current.temperature_2m);
        const feelsLike = Math.round(weatherData.current.apparent_temperature);

        console.log(`🌡️ Temperature: ${actualTemp}°C (feels like ${feelsLike}°C)`);

        // Update state and UI with feels-like temperature
        state.temperature = feelsLike;
        state.location = locationName;

        const tempSlider = document.getElementById('tempSlider');
        const tempValue = document.getElementById('tempValue');

        if (tempSlider) {
            // Constrain to slider range
            const constrainedTemp = Math.max(-15, Math.min(20, feelsLike));
            tempSlider.value = constrainedTemp;
            tempValue.textContent = constrainedTemp;
        }

        // Extract just the area/city name (first part of location)
        const shortLocationName = locationName.split(',')[0].trim();

        // Fill in address input with discovered location
        const addressInput = document.getElementById('addressInput');
        if (addressInput) {
            addressInput.value = shortLocationName;
        }

        // Show weather result in dedicated element
        const weatherResult = document.getElementById('weatherResult');
        const weatherText = document.getElementById('weatherText');
        const changeLocationBtn = document.getElementById('changeLocationBtn');

        if (weatherResult && weatherText) {
            weatherText.textContent = `${actualTemp}°C (feels like ${feelsLike}°C)`;
            weatherResult.classList.remove('hidden');

            // Show change location button
            if (changeLocationBtn) {
                changeLocationBtn.classList.remove('hidden');
            }
        }

        console.log(`✅ Weather updated for ${locationName}`);

    } catch (error) {
        throw error; // Re-throw to be handled by caller
    }
}

// =======================
// RECOMMENDATIONS ENGINE
// =======================

async function getRecommendation() {
    showScreen('loadingScreen');

    try {
        // Get recommendations from engine
        const recommendations = getRecommendations(
            state.temperature,
            state.ageCategory,
            state.gender
        );

        // Check if we got any recommendations
        if (!recommendations || recommendations.length === 0) {
            console.error('No valid recommendations found');
            alert('Unable to generate recommendations for these conditions. Please try a different temperature.');
            showScreen('tempScreen');
            return;
        }

        // Use the best recommendation (first one)
        state.currentRecommendation = recommendations[0];

        // Display recommendation
        displayRecommendation(state.currentRecommendation);
    } catch (error) {
        console.error('Recommendation Error:', error);
        alert('Error generating recommendations. Please try again.');
        showScreen('tempScreen');
    }
}

// =======================
// DISPLAY RESULTS
// =======================

function displayRecommendation(recommendation) {
    // Update temperature and alert
    document.getElementById('resultTemp').textContent = Math.round(state.temperature);

    const alertLevel = document.getElementById('alertLevel');
    const alertMap = {
        'green': { text: 'Low Risk', class: 'alert-green' },
        'yellow': { text: 'Moderate Risk', class: 'alert-yellow' },
        'amber': { text: 'High Risk', class: 'alert-amber' },
        'red': { text: 'Severe Risk', class: 'alert-red' }
    };

    const alert = alertMap[recommendation.requirements.alert] || alertMap['yellow'];
    alertLevel.textContent = alert.text;
    alertLevel.className = 'alert-level ' + alert.class;

    // Update user profile display
    updateProfileDisplay();

    // Build warmth indicator
    const warmthHtml = buildWarmthIndicator(recommendation);
    document.getElementById('warmthIndicator').innerHTML = warmthHtml;

    // Build recommendations by zone
    let textHtml = '';

    // Warning for high risk
    if (recommendation.requirements.riskLevel === 'high' || recommendation.requirements.riskLevel === 'very-high' || recommendation.requirements.riskLevel === 'severe') {
        textHtml += '<div class="warning">';
        textHtml += '<div class="warning-title">Important</div>';
        textHtml += `<div class="warning-text">`;
        if (recommendation.requirements.maxExposure) {
            textHtml += `Maximum outdoor time: ${recommendation.requirements.maxExposure} minutes. `;
        }
        if (recommendation.requirements.warning) {
            textHtml += recommendation.requirements.warning;
        } else {
            textHtml += 'Take care in cold weather.';
        }
        textHtml += `</div></div>`;
    }

    // Core layers
    if (recommendation.core.length > 0) {
        const coreByCategory = {
            base: [],
            mid: [],
            outer: []
        };

        recommendation.core.forEach(item => {
            if (coreByCategory[item.category]) {
                coreByCategory[item.category].push(item);
            }
        });

        // Base Layer
        if (coreByCategory.base.length > 0) {
            textHtml += '<div class="layer-section">';
            textHtml += '<h3 class="layer-heading">Base Layer</h3>';
            textHtml += '<ul class="item-list">';
            coreByCategory.base.forEach(item => {
                textHtml += generateItemWithIcon(item);
            });
            textHtml += '</ul></div>';
        }

        // Mid Layers
        if (coreByCategory.mid.length > 0) {
            textHtml += '<div class="layer-section">';
            textHtml += '<h3 class="layer-heading">Mid Layers</h3>';
            textHtml += '<ul class="item-list">';
            coreByCategory.mid.forEach(item => {
                textHtml += generateItemWithIcon(item);
            });
            textHtml += '</ul></div>';
        }

        // Outer Layer
        if (coreByCategory.outer.length > 0) {
            textHtml += '<div class="layer-section">';
            textHtml += '<h3 class="layer-heading">Outer Layer</h3>';
            textHtml += '<ul class="item-list">';
            coreByCategory.outer.forEach(item => {
                textHtml += generateItemWithIcon(item);
            });
            textHtml += '</ul></div>';
        }
    }

    // Accessories
    const accessories = [
        ...recommendation.head,
        ...recommendation.hands,
        ...recommendation.neck,
        ...recommendation.feet
    ];

    if (accessories.length > 0) {
        textHtml += '<div class="layer-section">';
        textHtml += '<h3 class="layer-heading">Accessories</h3>';
        textHtml += '<ul class="item-list">';
        accessories.forEach(item => {
            textHtml += generateItemWithIcon(item);
        });
        textHtml += '</ul></div>';
    }

    document.getElementById('recommendations').innerHTML = textHtml;

    // Attach click handlers to clickable items
    attachItemClickHandlers();

    showScreen('resultsScreen');
}

function buildWarmthIndicator(recommendation) {
    const currentCLO = recommendation.coreCLO;
    const optimalCLO = recommendation.requirements.core.optimal;
    const minCLO = recommendation.requirements.core.min;
    const maxCLO = recommendation.requirements.core.max;

    console.log('🌡️ Warmth Indicator:', {
        currentCLO,
        optimalCLO,
        minCLO,
        maxCLO,
        difference: currentCLO - optimalCLO
    });

    // Calculate percentages for positioning
    const range = maxCLO - minCLO;
    const currentPercent = ((currentCLO - minCLO) / range) * 100;
    const optimalPercent = ((optimalCLO - minCLO) / range) * 100;

    // Calculate how far from optimal (-1 = too cold, 0 = optimal, +1 = too warm)
    const deviation = (currentCLO - optimalCLO) / range;

    // Color gradient: cool blues → green → soft reds
    let barColor;
    if (deviation < -0.15) {
        // Too cold - cool blues
        barColor = 'linear-gradient(to right, #7ba3cc, #6b93bc)';
    } else if (deviation > 0.15) {
        // Too warm - soft reds
        barColor = 'linear-gradient(to right, #d4a5a5, #c99b9b)';
    } else {
        // Just right - green
        barColor = 'linear-gradient(to right, #a8c5b8, #9fb8aa)';
    }

    // Determine status text with simple language
    let statusText = 'Just right';
    let statusClass = 'status-good';
    if (currentCLO < optimalCLO - 0.1) {
        statusText = 'A bit light';
        statusClass = 'status-under';
    } else if (currentCLO > optimalCLO + 0.1) {
        statusText = 'A bit warm';
        statusClass = 'status-over';
    }
    if (Math.abs(currentCLO - optimalCLO) > 0.20) {
        statusText = currentCLO < optimalCLO ? 'Too light' : 'Too warm';
        statusClass = currentCLO < optimalCLO ? 'status-cold' : 'status-warm';
    }

    return `
        <div class="warmth-indicator-new">
            <div class="warmth-header">
                <div class="warmth-status ${statusClass}">${statusText}</div>
            </div>

            <div class="warmth-bar-track">
                <div class="warmth-bar-fill" style="width: ${Math.min(100, Math.max(0, currentPercent))}%; background: ${barColor};"></div>
                <div class="warmth-optimal-marker" style="left: ${optimalPercent}%;">
                    <div class="optimal-line"></div>
                    <div class="optimal-label">Optimal</div>
                </div>
            </div>

            <div class="warmth-scale">
                <span class="scale-min">Too cold</span>
                <span class="scale-label">Warmth</span>
                <span class="scale-max">Too warm</span>
            </div>
        </div>
    `;
}

function generateItemWithIcon(item) {
    let imagePath = `/images/clothing/${item.file}`;
    if (!item.file.includes('scarf')) {
        imagePath = imagePath.replace('.png', '.svg');
    }

    return `
        <li class="item-with-icon clickable-item" data-item-key="${item.key}">
            <span class="item-text">${item.name} <span class="swap-icon">⇄</span></span>
            <img
                src="${imagePath}"
                alt="${item.name}"
                class="item-icon"
                title="${item.name}"
                onerror="this.style.display='none';"
            />
        </li>
    `;
}

function generateLayerImages(items) {
    let imagesHtml = '<div class="layer-images">';
    items.forEach(item => {
        let imagePath = `/images/clothing/${item.file}`;
        if (!item.file.includes('scarf')) {
            imagePath = imagePath.replace('.png', '.svg');
        }
        imagesHtml += `
            <img
                src="${imagePath}"
                alt="${item.name}"
                class="layer-image"
                title="${item.name}"
                onerror="this.style.display='none';"
            />
        `;
    });
    imagesHtml += '</div>';
    return imagesHtml;
}

function updateProfileDisplay() {
    const ageRanges = {
        'infant': '0-2',
        'child': '3-12',
        'teen': '13-17',
        'adult': '18-64',
        'elderly': '65+'
    };

    const genderDisplay = {
        'male': 'Male',
        'female': 'Female',
        'any': 'Child'
    };

    const ageCategoryDisplay = {
        'infant': 'Infant',
        'child': 'Child',
        'teen': 'Teen',
        'adult': 'Adult',
        'elderly': 'Elderly'
    };

    const ageRange = ageRanges[state.ageCategory] || '18-64';
    const gender = genderDisplay[state.gender] || 'Adult';
    const ageCategory = ageCategoryDisplay[state.ageCategory] || 'Adult';

    document.getElementById('displayAge').textContent = ageRange;

    if (state.gender === 'any') {
        document.getElementById('displayGender').textContent = ageCategory;
    } else {
        document.getElementById('displayGender').textContent = `${ageCategory} ${gender}`;
    }
}

// =======================
// MODAL FUNCTIONS
// =======================

function openSubstitutionsModal() {
    const modal = document.getElementById('substitutionsModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeSubstitutionsModal() {
    const modal = document.getElementById('substitutionsModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// =======================
// ITEM SUBSTITUTION
// =======================

function attachItemClickHandlers() {
    document.querySelectorAll('.clickable-item').forEach(element => {
        element.addEventListener('click', (e) => {
            const itemKey = e.currentTarget.dataset.itemKey;
            showSubstituteModal(itemKey);
        });
    });
}

function showSubstituteModal(itemKey) {
    if (!state.currentRecommendation) return;

    // Find the item in the recommendation
    const allItems = [
        ...state.currentRecommendation.core,
        ...state.currentRecommendation.head,
        ...state.currentRecommendation.hands,
        ...state.currentRecommendation.neck,
        ...state.currentRecommendation.feet
    ];

    const itemToReplace = allItems.find(item => item.key === itemKey);
    if (!itemToReplace) return;

    // Find substitutes
    const substitutes = findSubstitutes(state.currentRecommendation, itemToReplace);

    // Update modal title
    document.getElementById('substituteModalTitle').textContent = `Replace ${itemToReplace.name}`;

    // Generate substitute options HTML
    const modalBody = document.getElementById('substituteModalBody');
    if (substitutes.length === 0) {
        modalBody.innerHTML = '<div class="no-substitutes">No alternatives available for this item.</div>';
    } else {
        let optionsHtml = '';
        substitutes.forEach(substitute => {
            optionsHtml += `
                <div class="substitute-option" data-old-key="${itemToReplace.key}" data-new-key="${substitute.key}">
                    <div class="substitute-info">
                        <div class="substitute-name">${substitute.name}</div>
                    </div>
                    <div class="substitute-arrow">→</div>
                </div>
            `;
        });
        modalBody.innerHTML = optionsHtml;

        // Attach click handlers to substitute options
        modalBody.querySelectorAll('.substitute-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const oldKey = e.currentTarget.dataset.oldKey;
                const newKey = e.currentTarget.dataset.newKey;
                handleSubstitution(oldKey, newKey);
            });
        });
    }

    // Show modal
    openSubstituteModal();
}

function handleSubstitution(oldItemKey, newItemKey) {
    if (!state.currentRecommendation) return;

    // Find the old and new items
    const allItems = [
        ...state.currentRecommendation.core,
        ...state.currentRecommendation.head,
        ...state.currentRecommendation.hands,
        ...state.currentRecommendation.neck,
        ...state.currentRecommendation.feet
    ];

    const oldItem = allItems.find(item => item.key === oldItemKey);
    if (!oldItem) return;

    // Get the new item from the same zone/category
    const allPossibleItems = [];
    for (const zone in { core: 1, head: 1, hands: 1, neck: 1, feet: 1 }) {
        const zoneItems = state.currentRecommendation[zone] || [];
        for (const item of zoneItems) {
            allPossibleItems.push(item);
        }
    }

    // Find new item from substitutes list
    const substitutes = findSubstitutes(state.currentRecommendation, oldItem);
    const newItem = substitutes.find(item => item.key === newItemKey);
    if (!newItem) return;

    // Replace the item
    state.currentRecommendation = replaceItem(state.currentRecommendation, oldItem, newItem);

    // Close modal
    closeSubstituteModal();

    // Re-display the recommendation
    displayRecommendation(state.currentRecommendation);
}

function openSubstituteModal() {
    const modal = document.getElementById('substituteModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeSubstituteModal() {
    const modal = document.getElementById('substituteModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function openSourcesModal() {
    const modal = document.getElementById('sourcesModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeSourcesModal() {
    const modal = document.getElementById('sourcesModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}
