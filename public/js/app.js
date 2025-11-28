/**
 * WrapMeApp - Main Application v1.9.2
 * Clean, modular design using CLO-guided calculation engine
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
    currentRecommendation: null,
    warmthAdjustment: 0 // -1 = cooler, 0 = normal, +1 = warmer
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
    loadWarmthPreference();
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

    // Change temperature button
    document.getElementById('changeTempBtn')?.addEventListener('click', changeTemperature);

    // Change location button
    document.getElementById('changeLocationBtn')?.addEventListener('click', changeLocation);


    // Restart button
    document.getElementById('restartBtn')?.addEventListener('click', restart);

    // Disclaimer link
    document.getElementById('disclaimerLink')?.addEventListener('click', (e) => {
        e.preventDefault();
        openSourcesModal();
    });

    // Modal close buttons
    document.getElementById('substituteModalCloseBtn')?.addEventListener('click', closeSubstituteModal);
    document.getElementById('sourcesModalCloseBtn')?.addEventListener('click', closeSourcesModal);

    // Modal backdrop clicks
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
            const substituteModal = document.getElementById('substituteModal');
            const sourcesModal = document.getElementById('sourcesModal');
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
        'elderly': '65-80',
        'very-elderly': '80+'
    };

    const genderDisplay = {
        'male': 'Male',
        'female': 'Female',
        'any': ''
    };

    const ageRange = ageRanges[state.ageCategory] || '18-64';
    const gender = genderDisplay[state.gender] || '';

    const displayText = gender ? `${gender}, ${ageRange}` : ageRange;
    profileText.textContent = displayText;
    profileDisplay?.classList.remove('hidden');
}

function changeProfile() {
    // Reset warmth adjustment when changing profile
    state.warmthAdjustment = 0;
    saveWarmthPreference();
    showScreen('ageScreen');
}

function changeTemperature() {
    showScreen('tempScreen');
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

    // Reset warmth adjustment when changing age
    state.warmthAdjustment = 0;
    saveWarmthPreference();

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

    // Reset warmth adjustment when changing gender
    state.warmthAdjustment = 0;
    saveWarmthPreference();

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
    const addressInput = document.getElementById('addressInput');
    const originalPlaceholder = addressInput.placeholder;

    btn.style.opacity = '0.6';
    addressInput.placeholder = 'Getting your location...';
    addressInput.value = '';

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            try {
                // Reverse geocode to get location name
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=12&addressdetails=1`,
                    {
                        headers: {
                            'User-Agent': 'WrapMeApp/2.0'
                        }
                    }
                );

                if (!response.ok) {
                    throw new Error('Failed to get location name');
                }

                const data = await response.json();
                const address = data.address;

                // Extract a readable location name (prioritize city/town/village)
                let locationName = '';

                if (address.city) {
                    locationName = address.city;
                } else if (address.town) {
                    locationName = address.town;
                } else if (address.village) {
                    locationName = address.village;
                } else if (address.suburb) {
                    locationName = address.suburb;
                } else if (address.neighbourhood) {
                    locationName = address.neighbourhood;
                } else if (address.county) {
                    locationName = address.county;
                } else if (address.state) {
                    locationName = address.state;
                } else {
                    // Fallback to coordinates
                    locationName = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
                }

                // Populate the input field with the location name
                addressInput.value = locationName;
                addressInput.placeholder = originalPlaceholder;

                // Get weather for this location
                await getWeatherFromCoordinates(lat, lon, locationName);
            } catch (error) {
                console.error('Error:', error);
                addressInput.placeholder = originalPlaceholder;
                addressInput.value = '';
                alert('Unable to get location data. Please enter your address manually.');
            } finally {
                btn.style.opacity = '1';
            }
        },
        (error) => {
            console.error('Geolocation error:', error);
            btn.style.opacity = '1';
            addressInput.placeholder = originalPlaceholder;

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
            state.gender,
            state.warmthAdjustment
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

    // Build recommendations by zone
    let textHtml = '';

    // Warning for sub-zero temperatures
    if (state.temperature <= -10) {
        textHtml += '<div class="warning warning-extreme">';
        textHtml += '<div class="warning-title">⚠️ Extreme Cold Warning</div>';
        textHtml += `<div class="warning-text"><strong>Get inside immediately!</strong> At this temperature, frostbite can occur within minutes. No amount of clothing makes extended outdoor exposure safe.</div>`;
        textHtml += '</div>';
    } else if (state.temperature < 0) {
        textHtml += '<div class="warning">';
        textHtml += '<div class="warning-title">Cold Weather Warning</div>';
        textHtml += `<div class="warning-text">Minimize outdoor time. Risk of frostbite and hypothermia.</div>`;
        textHtml += '</div>';
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

        // Base Layers
        if (coreByCategory.base.length > 0) {
            textHtml += '<div class="layer-section">';
            textHtml += '<div class="layer-heading-wrapper">';
            textHtml += '<h3 class="layer-heading">Base Layers</h3>';
            textHtml += '<span class="alternatives-tip">💡 click item of clothing for alternatives</span>';
            textHtml += '</div>';
            textHtml += '<ul class="item-list">';
            coreByCategory.base.forEach((item, index) => {
                const isLast = index === coreByCategory.base.length - 1;
                const isFirst = index === 0;
                textHtml += generateItemWithIcon(item, isLast, isFirst);
            });
            textHtml += '</ul></div>';
        }

        // Mid Layers
        if (coreByCategory.mid.length > 0) {
            textHtml += '<div class="layer-section">';
            textHtml += '<h3 class="layer-heading">Mid Layers</h3>';
            textHtml += '<ul class="item-list">';
            coreByCategory.mid.forEach((item, index) => {
                const isLast = index === coreByCategory.mid.length - 1;
                const isFirst = index === 0;
                textHtml += generateItemWithIcon(item, isLast, isFirst);
            });
            textHtml += '</ul></div>';
        }

        // Outer Layer
        if (coreByCategory.outer.length > 0) {
            textHtml += '<div class="layer-section">';
            textHtml += '<h3 class="layer-heading">Outer Layer</h3>';
            textHtml += '<ul class="item-list">';
            coreByCategory.outer.forEach((item, index) => {
                const isLast = index === coreByCategory.outer.length - 1;
                const isFirst = index === 0;
                textHtml += generateItemWithIcon(item, isLast, isFirst);
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
        accessories.forEach((item, index) => {
            const isLast = index === accessories.length - 1;
            const isFirst = index === 0;
            textHtml += generateItemWithIcon(item, isLast, isFirst);
        });
        textHtml += '</ul>';
        textHtml += '</div>';
    }

    // Add calibration slider
    textHtml += '<div class="warmth-calibration">';
    textHtml += '<label class="calibration-label">Not quite right for me?</label>';
    textHtml += '<input type="range" id="warmthSlider" class="warmth-slider" min="-2" max="2" value="' + state.warmthAdjustment + '" step="1" aria-label="Warmth calibration">';
    textHtml += '<div class="calibration-scale">';
    textHtml += '<span class="scale-label">Less layers</span>';
    textHtml += '<span class="scale-label">More layers</span>';
    textHtml += '</div>';
    textHtml += '</div>';

    document.getElementById('recommendations').innerHTML = textHtml;

    // Attach click handlers to clickable items
    attachItemClickHandlers();

    // Attach calibration slider handler
    attachCalibrationSlider();

    showScreen('resultsScreen');
}

function generateItemWithIcon(item, isLast = false, isFirst = false) {
    let imagePath = `/images/clothing/${item.file}`;
    if (!item.file.includes('scarf')) {
        imagePath = imagePath.replace('.png', '.svg');
    }

    // Add + sign at beginning of line for all items except the first
    const plusPrefix = isFirst ? '' : '<strong class="plus-sign">+&nbsp;&nbsp;</strong>';
    const displayText = `${plusPrefix}${item.name}`;

    return `
        <li class="item-with-icon clickable-item" data-item-key="${item.key}">
            <span class="item-text">${displayText} <span class="swap-icon">⇄</span></span>
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
        'elderly': '65-80',
        'very-elderly': '80+'
    };

    const ageCategoryLabels = {
        'infant': 'Infant',
        'child': 'Child',
        'teen': 'Teen',
        'adult': 'Adult',
        'elderly': 'Elderly',
        'very-elderly': 'Very Elderly'
    };

    const genderDisplay = {
        'male': 'Male',
        'female': 'Female',
        'any': ''
    };

    const ageRange = ageRanges[state.ageCategory] || '18-64';
    const ageCategoryLabel = ageCategoryLabels[state.ageCategory] || 'Adult';
    const gender = genderDisplay[state.gender] || '';

    document.getElementById('displayAge').textContent = ageRange;
    // If we have gender (male/female), show that; otherwise show age category label
    document.getElementById('displayGender').textContent = gender || ageCategoryLabel;
}

// =======================
// WARMTH CALIBRATION
// =======================

function attachCalibrationSlider() {
    const slider = document.getElementById('warmthSlider');
    if (!slider) return;

    // Refresh recommendations when user releases slider
    slider.addEventListener('change', (e) => {
        const newValue = parseInt(e.target.value);

        state.warmthAdjustment = newValue;
        saveWarmthPreference();
        refreshRecommendations();
    });
}

function saveWarmthPreference() {
    try {
        localStorage.setItem('warmthAdjustment', state.warmthAdjustment.toString());
    } catch (e) {
        console.log('Could not save warmth preference');
    }
}

function loadWarmthPreference() {
    try {
        const saved = localStorage.getItem('warmthAdjustment');
        if (saved !== null) {
            state.warmthAdjustment = parseInt(saved, 10);
        }
    } catch (e) {
        console.log('Could not load warmth preference');
    }
}

function refreshRecommendations() {
    // Regenerate recommendations with current settings
    const recommendations = getRecommendations(
        state.temperature,
        state.ageCategory,
        state.gender,
        state.warmthAdjustment
    );

    if (recommendations && recommendations.length > 0) {
        state.currentRecommendation = recommendations[0];
        displayRecommendation(state.currentRecommendation);
    }
}

// =======================
// MODAL FUNCTIONS
// =======================

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
    const substitutes = findSubstitutes(state.currentRecommendation, itemToReplace, state.temperature);

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
    const substitutes = findSubstitutes(state.currentRecommendation, oldItem, state.temperature);
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
