// ICD Code Converter Application

// ============= INTERNATIONALIZATION (i18n) =============
const translations = {
    es: {
        mainTitle: "Sistema de Conversión de Códigos ICD",
        mainSubtitle: "Base de datos de codificación médica | ICD-10-CM ⇄ ICD-9-CM",
        navSearch: "Búsqueda de Códigos",
        navDocs: "Documentación",
        disclaimerTitle: "Aviso Legal y Limitación de Responsabilidad",
        disclaimerP1: "Esta aplicación es una herramienta educativa y de referencia. El creador <strong>no es un profesional de la salud</strong> y <strong>no se responsabiliza</strong> del uso que se le dé a esta aplicación ni de las consecuencias derivadas de su uso.",
        disclaimerP2: "<strong>Todos los códigos y conversiones deben ser revisados y validados por profesionales médicos cualificados.</strong> No utilice esta información para diagnósticos, tratamientos o decisiones clínicas sin la supervisión apropiada.",
        disclaimerP3: "Los datos provienen de fuentes oficiales (CMS.org, NBER.org, HCUP-US-AHRQ.gov, PMC-NCBI.NLM.NIH.gov), pero pueden contener errores o estar desactualizados.",
        searchTitle: "Buscar Código",
        searchPlaceholder: "Ej: E10.10, E10, 25000",
        searchBtn: "Buscar",
        clearBtn: "Limpiar",
        helpText: "Nota: Puede buscar códigos específicos (E10.10) o familias enteras (E10). La notación \"E10.x\" significa todos los códigos de la familia E10.",
        historyTitle: "Búsquedas Recientes",
        resultsTitle: "Resultados de Búsqueda",
        originalCodeTitle: "Código Original",
        conversionTitle: "Conversión ICD",
        elixhauserTitle: "Comorbilidades Elixhauser",
        charlsonTitle: "Índice Charlson",
        loadingText: "Cargando datos...",
        noDataFound: "No se encontraron datos",
        errorProcessing: "Error al procesar",
        notFound: "Código no encontrado",
        enterCode: "Por favor, introduzca un código"
    },
    en: {
        mainTitle: "ICD Code Conversion System",
        mainSubtitle: "Medical coding database | ICD-10-CM ⇄ ICD-9-CM",
        navSearch: "Code Lookup",
        navDocs: "Documentation",
        disclaimerTitle: "Legal Disclaimer and Limitation of Liability",
        disclaimerP1: "This application is an educational and reference tool. The creator <strong>is not a healthcare professional</strong> and <strong>assumes no responsibility</strong> for the use of this application or the consequences thereof.",
        disclaimerP2: "<strong>All codes and conversions must be reviewed and validated by qualified medical professionals.</strong> Do not use this information for diagnoses, treatments, or clinical decisions without proper supervision.",
        disclaimerP3: "Data comes from official sources (CMS.org, NBER.org, HCUP-US-AHRQ.gov, PMC-NCBI.NLM.NIH.gov), but may contain errors or be outdated.",
        searchTitle: "Code Search",
        searchPlaceholder: "Ex: E10.10, E10, 25000",
        searchBtn: "Search",
        clearBtn: "Clear",
        helpText: "Note: You can search for specific codes (E10.10) or entire families (E10). The notation \"E10.x\" means all codes in the E10 family.",
        historyTitle: "Recent Searches",
        resultsTitle: "Search Results",
        originalCodeTitle: "Original Code",
        conversionTitle: "ICD Conversion",
        elixhauserTitle: "Elixhauser Comorbidities",
        charlsonTitle: "Charlson Index",
        loadingText: "Loading data...",
        noDataFound: "No data found",
        errorProcessing: "Error processing",
        notFound: "Code not found",
        enterCode: "Please enter a code"
    }
};

let currentLanguage = 'es';

function changeLanguage() {
    currentLanguage = document.getElementById('languageSelector').value;
    const t = translations[currentLanguage];
    
    // Update main elements
    document.getElementById('mainTitle').textContent = t.mainTitle;
    document.getElementById('mainSubtitle').textContent = t.mainSubtitle;
    document.getElementById('navSearch').textContent = t.navSearch;
    document.getElementById('navDocs').textContent = t.navDocs;
    
    // Update disclaimer
    document.getElementById('disclaimerTitle').innerHTML = t.disclaimerTitle;
    document.getElementById('disclaimerP1').innerHTML = t.disclaimerP1;
    document.getElementById('disclaimerP2').innerHTML = t.disclaimerP2;
    document.getElementById('disclaimerP3').innerHTML = t.disclaimerP3;
    
    // Update search section
    const searchSection = document.querySelector('.search-section h2');
    if (searchSection) searchSection.textContent = t.searchTitle;
    
    document.getElementById('codeInput').placeholder = t.searchPlaceholder;
    document.getElementById('searchBtn').textContent = t.searchBtn;
    document.getElementById('clearBtn').textContent = t.clearBtn;
    
    const helpText = document.querySelector('.help-text');
    if (helpText) helpText.textContent = t.helpText;
    
    // Update history section
    const historyTitle = document.querySelector('.history-section h3');
    if (historyTitle) historyTitle.textContent = t.historyTitle;
    
    // Update results titles
    const resultsTitle = document.querySelector('.results-section h2');
    if (resultsTitle) resultsTitle.textContent = t.resultsTitle;
    
    const resultCards = document.querySelectorAll('.result-card h3');
    if (resultCards.length >= 4) {
        resultCards[0].textContent = t.originalCodeTitle;
        resultCards[1].textContent = t.conversionTitle;
        resultCards[2].textContent = t.elixhauserTitle;
        resultCards[3].textContent = t.charlsonTitle;
    }
    
    // Update loading text
    const loadingText = document.querySelector('.loading p');
    if (loadingText) loadingText.textContent = t.loadingText;
}

function t(key) {
    return translations[currentLanguage][key] || key;
}

// Data storage
let icd10ToIcd9 = {};
let icd9ToIcd10 = {};
let icd10Descriptions = {};
let elixhauserData = {};
let charlsonIcd10 = {};
let charlsonIcd9 = {};

// History management
const MAX_HISTORY = 5;
let searchHistory = [];

// Initialize application
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Inicializando aplicación...');
    await loadAllData();
    setupEventListeners();
    loadHistoryFromStorage();
    displayHistory();
});

// Load all JSON data files
async function loadAllData() {
    const loading = document.getElementById('loading');
    loading.style.display = 'block';

    try {
        // Load mapping data
        const [
            icd10to9Data,
            icd9to10Data,
            descriptionsData,
            elixhauserFile,
            charlson10Data,
            charlson9Data
        ] = await Promise.all([
            fetch('data/icd10_to_icd9.json').then(r => r.json()),
            fetch('data/icd9_to_icd10.json').then(r => r.json()),
            fetch('data/icd10_descriptions.json').then(r => r.json()),
            fetch('data/elixhauser.json').then(r => r.json()),
            fetch('data/charlson_icd10.json').then(r => r.json()),
            fetch('data/charlson_icd9.json').then(r => r.json())
        ]);

        icd10ToIcd9 = icd10to9Data;
        icd9ToIcd10 = icd9to10Data;
        icd10Descriptions = descriptionsData;
        elixhauserData = elixhauserFile;
        charlsonIcd10 = charlson10Data;
        charlsonIcd9 = charlson9Data;

        console.log('Datos cargados correctamente');
        console.log('ICD10->ICD9:', Object.keys(icd10ToIcd9).length, 'códigos');
        console.log('ICD9->ICD10:', Object.keys(icd9ToIcd10).length, 'códigos');
        console.log('Descripciones ICD10:', Object.keys(icd10Descriptions).length);
        console.log('Elixhauser:', Object.keys(elixhauserData).length, 'códigos');
        console.log('Charlson ICD10:', Object.keys(charlsonIcd10).length);
        console.log('Charlson ICD9:', Object.keys(charlsonIcd9).length);

    } catch (error) {
        showError('Error al cargar los datos: ' + error.message);
        console.error('Error loading data:', error);
    } finally {
        loading.style.display = 'none';
    }
}

// Setup event listeners
function setupEventListeners() {
    const searchBtn = document.getElementById('searchBtn');
    const clearBtn = document.getElementById('clearBtn');
    const codeInput = document.getElementById('codeInput');

    searchBtn.addEventListener('click', () => searchCode());
    clearBtn.addEventListener('click', () => clearResults());
    
    codeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchCode();
    });
}

// Search for code
function searchCode() {
    const input = document.getElementById('codeInput').value.trim().toUpperCase();
    
    if (!input) {
        showError('Por favor, introduzca un código');
        return;
    }

    hideError();
    
    // Normalize code (remove dots and spaces)
    const normalizedCode = input.replace(/[.\s]/g, '');
    
    // Determine if it's ICD10 or ICD9
    const isIcd10 = detectCodeType(normalizedCode);
    
    // Perform search
    performSearch(normalizedCode, isIcd10);
    
    // Add to history
    addToHistory(input);
}

// Detect if code is ICD10 or ICD9
function detectCodeType(code) {
    // ICD-10 codes usually start with a letter
    // ICD-9 codes are usually all numeric or start with V or E
    if (/^[A-Z]/.test(code) && !/^[VE]\d/.test(code)) {
        return true; // ICD-10
    }
    return false; // ICD-9
}

// Perform the actual search
function performSearch(code, isIcd10) {
    console.log('Buscando código:', code, 'Es ICD10?', isIcd10);
    
    const resultsSection = document.getElementById('resultsSection');
    resultsSection.style.display = 'block';

    // Clear previous results
    document.getElementById('originalCodeInfo').innerHTML = '';
    document.getElementById('conversionInfo').innerHTML = '';
    document.getElementById('elixhauserInfo').innerHTML = '';
    document.getElementById('charlsonInfo').innerHTML = '';

    if (isIcd10) {
        searchIcd10Code(code);
    } else {
        searchIcd9Code(code);
    }
}

// Search ICD10 code
function searchIcd10Code(code) {
    // Display original code info
    displayOriginalCodeInfo(code, 'ICD-10-CM');
    
    // Find exact match or family
    let conversions = [];
    let exactMatch = icd10ToIcd9[code];
    
    if (exactMatch) {
        // Exact match
        conversions.push({ code, matches: exactMatch, exact: true });
    } else {
        // Search for family (e.g., E10 should find E10.*, E10xx, etc.)
        const familyCode = code.replace(/X/g, '');
        for (const [icd10Code, icd9Mappings] of Object.entries(icd10ToIcd9)) {
            if (icd10Code.startsWith(familyCode)) {
                conversions.push({ code: icd10Code, matches: icd9Mappings, exact: false });
            }
        }
    }
    
    if (conversions.length > 0) {
        displayConversions(conversions, 'ICD-9-CM');
        
        // Get unique ICD9 codes for Charlson
        const uniqueIcd9Codes = [...new Set(conversions.flatMap(c => c.matches.map(m => m.icd9)))];
        
        // Display Elixhauser for ICD10
        displayElixhauser(code, conversions.map(c => c.code));
        
        // Display Charlson (prefer ICD10, fallback to ICD9)
        displayCharlson([code], uniqueIcd9Codes);
    } else {
        document.getElementById('conversionInfo').innerHTML = '<p class="no-data">No se encontraron conversiones para este código</p>';
        displayElixhauser(code, []);
        displayCharlson([code], []);
    }
}

// Search ICD9 code
function searchIcd9Code(code) {
    // Display original code info
    displayOriginalCodeInfo(code, 'ICD-9-CM');
    
    // Find exact match or family
    let conversions = [];
    let exactMatch = icd9ToIcd10[code];
    
    if (exactMatch) {
        // Exact match
        conversions.push({ code, matches: exactMatch, exact: true });
    } else {
        // Search for family
        const familyCode = code.replace(/X/g, '');
        for (const [icd9Code, icd10Mappings] of Object.entries(icd9ToIcd10)) {
            if (icd9Code.startsWith(familyCode)) {
                conversions.push({ code: icd9Code, matches: icd10Mappings, exact: false });
            }
        }
    }
    
    if (conversions.length > 0) {
        displayConversions(conversions, 'ICD-10-CM');
        
        // Get unique ICD10 codes for analysis
        const uniqueIcd10Codes = [...new Set(conversions.flatMap(c => c.matches.map(m => m.icd10)))];
        
        // Display Elixhauser (only available for ICD10)
        displayElixhauser('', uniqueIcd10Codes);
        
        // Display Charlson
        displayCharlson(uniqueIcd10Codes, [code]);
    } else {
        document.getElementById('conversionInfo').innerHTML = '<p class="no-data">No se encontraron conversiones para este código</p>';
        displayElixhauser('', []);
        displayCharlson([], [code]);
    }
}

// Display original code information
function displayOriginalCodeInfo(code, codeType) {
    const container = document.getElementById('originalCodeInfo');
    
    let html = `
        <div>
            <span class="code-badge">${code}</span>
            <span style="color: var(--text-light);">${codeType}</span>
        </div>
    `;
    
    // Add description if ICD10
    if (codeType === 'ICD-10-CM') {
        const description = icd10Descriptions[code];
        if (description) {
            html += `<p class="description">${description}</p>`;
        }
    }
    
    container.innerHTML = html;
}

// Display conversions
function displayConversions(conversions, targetType) {
    const container = document.getElementById('conversionInfo');
    
    if (conversions.length === 0) {
        container.innerHTML = '<p class="no-data">No se encontraron conversiones</p>';
        return;
    }
    
    let html = '';
    
    if (conversions.length > 1) {
        html += `<p><strong>Se encontraron ${conversions.length} códigos en esta familia:</strong></p>`;
    }
    
    html += '<div class="conversion-list">';
    
    // Limit to first 50 results if too many
    const displayConversions = conversions.length > 50 ? conversions.slice(0, 50) : conversions;
    
    for (const conversion of displayConversions) {
        html += `<div class="conversion-item">`;
        html += `<div><span class="code-badge ${!conversion.exact ? 'code-family' : ''}">${conversion.code}</span></div>`;
        
        for (const match of conversion.matches) {
            const targetCode = match.icd9 || match.icd10;
            html += `<div style="margin-top: 8px; margin-left: 20px;">`;
            html += `→ <span class="code-badge">${targetCode}</span> <span style="color: var(--text-light);">${targetType}</span>`;
            
            if (match.approximate) {
                html += `<span class="approximate-badge">Aproximado</span>`;
            }
            
            html += `</div>`;
        }
        
        html += `</div>`;
    }
    
    html += '</div>';
    
    if (conversions.length > 50) {
        html += `<p class="warning-box">Mostrando los primeros 50 resultados de ${conversions.length} encontrados</p>`;
    }
    
    container.innerHTML = html;
}

// Display Elixhauser comorbidities
function displayElixhauser(originalCode, relatedCodes) {
    const container = document.getElementById('elixhauserInfo');
    
    const codesToCheck = [originalCode, ...relatedCodes].filter(c => c);
    let allComorbidities = new Set();
    let foundCodes = [];
    
    for (const code of codesToCheck) {
        if (elixhauserData[code]) {
            foundCodes.push(code);
            elixhauserData[code].comorbidities.forEach(c => allComorbidities.add(c));
        }
    }
    
    if (allComorbidities.size === 0) {
        container.innerHTML = '<p class="no-data">No se encontraron comorbilidades Elixhauser para este código</p>';
        return;
    }
    
    let html = `<p><strong>Encontradas ${allComorbidities.size} comorbilidades:</strong></p>`;
    html += '<div class="comorbidity-list">';
    
    for (const comorbidity of Array.from(allComorbidities).sort()) {
        html += `<span class="comorbidity-tag">${comorbidity}</span>`;
    }
    
    html += '</div>';
    
    if (foundCodes.length > 0) {
        html += `<p class="info-box" style="margin-top: 15px;">
            <strong>Códigos con comorbilidades Elixhauser:</strong> ${foundCodes.join(', ')}
        </p>`;
    }
    
    container.innerHTML = html;
}

// Display Charlson index
function displayCharlson(icd10Codes, icd9Codes) {
    const container = document.getElementById('charlsonInfo');
    
    let totalScore = 0;
    let conditions = [];
    let usedCodes = new Set();
    
    // Check ICD10 codes first (preferred)
    for (const code of icd10Codes) {
        // Check exact match
        if (charlsonIcd10[code]) {
            const data = charlsonIcd10[code];
            if (!conditions.find(c => c.condition === data.condition)) {
                conditions.push({
                    condition: data.condition,
                    score: data.score,
                    source: 'ICD-10',
                    code: code
                });
                usedCodes.add(code);
            }
        }
        
        // Check family matches
        for (const [charlsonCode, data] of Object.entries(charlsonIcd10)) {
            if (code.startsWith(charlsonCode) && !usedCodes.has(code)) {
                if (!conditions.find(c => c.condition === data.condition)) {
                    conditions.push({
                        condition: data.condition,
                        score: data.score,
                        source: 'ICD-10',
                        code: code
                    });
                    usedCodes.add(code);
                }
            }
        }
    }
    
    // Check ICD9 codes if not found in ICD10
    for (const code of icd9Codes) {
        // Check exact match
        if (charlsonIcd9[code]) {
            const data = charlsonIcd9[code];
            if (!conditions.find(c => c.condition === data.condition)) {
                conditions.push({
                    condition: data.condition,
                    score: data.score,
                    source: 'ICD-9',
                    code: code
                });
            }
        }
        
        // Check family matches
        for (const [charlsonCode, data] of Object.entries(charlsonIcd9)) {
            if (code.startsWith(charlsonCode)) {
                if (!conditions.find(c => c.condition === data.condition)) {
                    conditions.push({
                        condition: data.condition,
                        score: data.score,
                        source: 'ICD-9',
                        code: code
                    });
                }
            }
        }
    }
    
    // Calculate total score (apply hierarchy: higher scores override lower for same condition type)
    const conditionTypes = {};
    for (const cond of conditions) {
        const baseCondition = cond.condition.replace(/(with|without) .*/, '').trim();
        if (!conditionTypes[baseCondition] || conditionTypes[baseCondition].score < cond.score) {
            conditionTypes[baseCondition] = cond;
        }
    }
    
    const finalConditions = Object.values(conditionTypes);
    totalScore = finalConditions.reduce((sum, c) => sum + c.score, 0);
    
    if (finalConditions.length === 0) {
        container.innerHTML = '<p class="no-data">No se encontraron condiciones en el índice Charlson para este código</p>';
        return;
    }
    
    let html = `<div class="charlson-score">Score: ${totalScore}</div>`;
    html += `<p style="text-align: center; color: var(--text-light);">Basado en ${finalConditions.length} condición(es)</p>`;
    
    html += '<div class="charlson-details">';
    
    for (const cond of finalConditions.sort((a, b) => b.score - a.score)) {
        html += `
            <div class="charlson-condition">
                <div>
                    <strong>${cond.condition}</strong>
                    <span class="source-badge">${cond.source}</span>
                    <div style="font-size: 0.85rem; color: var(--text-light); margin-top: 4px;">
                        Código: ${cond.code}
                    </div>
                </div>
                <span class="condition-score">+${cond.score}</span>
            </div>
        `;
    }
    
    html += '</div>';
    
    html += `
        <div class="info-box" style="margin-top: 15px;">
            <strong>Nota:</strong> El índice Charlson busca primero en códigos ICD-10 y en su defecto en ICD-9. 
            Las puntuaciones van de 1 (menor gravedad) a 6 (mayor gravedad). 
            Se aplica jerarquía: condiciones más graves sobrescriben las menos graves del mismo tipo.
        </div>
    `;
    
    container.innerHTML = html;
}

// History management functions
function addToHistory(code) {
    // Remove if already exists
    searchHistory = searchHistory.filter(item => item !== code);
    
    // Add to beginning
    searchHistory.unshift(code);
    
    // Keep only last 5
    if (searchHistory.length > MAX_HISTORY) {
        searchHistory = searchHistory.slice(0, MAX_HISTORY);
    }
    
    // Save to localStorage
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    
    displayHistory();
}

function loadHistoryFromStorage() {
    const stored = localStorage.getItem('searchHistory');
    if (stored) {
        searchHistory = JSON.parse(stored);
    }
}

function displayHistory() {
    const historySection = document.getElementById('historySection');
    const historyList = document.getElementById('historyList');
    
    if (searchHistory.length === 0) {
        historySection.style.display = 'none';
        return;
    }
    
    historySection.style.display = 'block';
    
    let html = '';
    for (const code of searchHistory) {
        html += `<div class="history-item" onclick="searchFromHistory('${code}')">${code}</div>`;
    }
    
    historyList.innerHTML = html;
}

function searchFromHistory(code) {
    document.getElementById('codeInput').value = code;
    searchCode();
}

// Utility functions
function clearResults() {
    document.getElementById('codeInput').value = '';
    document.getElementById('resultsSection').style.display = 'none';
    hideError();
}

function showError(message) {
    const errorMsg = document.getElementById('errorMsg');
    errorMsg.textContent = message;
    errorMsg.style.display = 'block';
}

function hideError() {
    document.getElementById('errorMsg').style.display = 'none';
}

// Make searchFromHistory available globally
window.searchFromHistory = searchFromHistory;
