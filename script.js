// --- Configuration ---
const API_URL_HARDCODED = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent";
// !!! IMPORTANT: REPLACE THIS EMPTY STRING WITH YOUR ACTUAL API KEY !!!
const API_KEY_HARDCODED = ""; 

// --- Theme Presets ---
const THEME_PRESETS = {
    'deep-dark': { '--bg-primary': '#0a0b10', '--bg-secondary': '#242634', '--glass-border': 'rgba(144, 202, 249, 0.2)', '--text-color': '#e0e7ff', '--accent-primary': '#4f46e5', '--chat-user-bg': 'rgba(79, 70, 229, 0.5)', '--chat-gemini-bg': 'rgba(36, 38, 52, 0.5)' },
    'nebula': { '--bg-primary': '#19192C', '--bg-secondary': '#3A2E4F', '--glass-border': 'rgba(180, 150, 255, 0.3)', '--text-color': '#e6e0ff', '--accent-primary': '#8B5CF6', '--chat-user-bg': 'rgba(139, 92, 246, 0.4)', '--chat-gemini-bg': 'rgba(58, 46, 79, 0.5)' },
    'oceanic-dark': { '--bg-primary': '#0a0f12', '--bg-secondary': '#1d2a3d', '--glass-border': 'rgba(0, 255, 255, 0.2)', '--text-color': '#d9f7ff', '--accent-primary': '#06b6d4', '--chat-user-bg': 'rgba(6, 182, 212, 0.5)', '--chat-gemini-bg': 'rgba(29, 42, 61, 0.5)' },
    'forest-dark': { '--bg-primary': '#1a231a', '--bg-secondary': '#2e452e', '--glass-border': 'rgba(120, 250, 150, 0.3)', '--text-color': '#e0ffe0', '--accent-primary': '#34d399', '--chat-user-bg': 'rgba(52, 211, 153, 0.4)', '--chat-gemini-bg': 'rgba(46, 69, 46, 0.5)' },
    'crimson-dark': { '--bg-primary': '#100a0b', '--bg-secondary': '#342628', '--glass-border': 'rgba(255, 120, 120, 0.2)', '--text-color': '#ffe0e0', '--accent-primary': '#ef4444', '--chat-user-bg': 'rgba(239, 68, 68, 0.5)', '--chat-gemini-bg': 'rgba(52, 38, 40, 0.5)' }
};

// --- DOM Element References ---
const outputDiv = document.getElementById('chat-output');
const inputField = document.getElementById('prompt-input');
const sendButton = document.getElementById('send-button');
const loadingMessage = document.getElementById('loading-message');
const errorMessage = document.getElementById('error-message');
const shortcutsList = document.getElementById('shortcuts-list');
const addTileButton = document.getElementById('add-tile-button');
const editModeToggle = document.getElementById('edit-mode-toggle');
const controlsFooter = document.getElementById('controls-footer'); 

// Tile Edit Modal
const modal = document.getElementById('edit-modal'); 
const modalTitle = document.getElementById('modal-title');
const tileForm = document.getElementById('tile-form');
const saveTileBtn = document.getElementById('save-tile-btn'); 
const deleteTileButton = document.getElementById('delete-tile-button');
const cancelModal = document.getElementById('cancel-modal'); 
const tileColorInput = document.getElementById('tile-color'); 

// Settings DOM References
const settingsButton = document.getElementById('settings-button');
const settingsModal = document.getElementById('settings-modal');
const settingsForm = document.getElementById('settings-form');
const saveSettingsBtn = document.getElementById('save-settings-btn'); 
const cancelSettingsModal = document.getElementById('cancel-settings-modal');
const closeSettingsModalX = document.getElementById('close-settings-modal-x'); 
const maxRemembersInput = document.getElementById('max-remembers');
const contextSizeInput = document.getElementById('context-size');

const generalTabButton = document.getElementById('general-tab-button');
const memoriesTabButton = document.getElementById('memories-tab-button');
const visualsTabButton = document.getElementById('visuals-tab-button');
const generalTabContent = document.getElementById('general-tab');
const memoriesTabContent = document.getElementById('memories-tab');
const visualsTabContent = document.getElementById('visuals-tab');
const memoriesList = document.getElementById('memories-list');
const clearMemoriesButton = document.getElementById('clear-memories-button');

// API Configuration Inputs
const apiUrlInput = document.getElementById('api-url-input');
const apiKeyInput = document.getElementById('api-key-input');

// --- State Variables ---
let isEditMode = false;
let tilesData = [];
let remembers = []; 
let memoryUsage = {}; 
let chatHistory = []; 
let customThemes = {}; 
let settings = {
    apiUrl: API_URL_HARDCODED,
    apiKey: API_KEY_HARDCODED,
    maxRemembers: 3, 
    contextSize: 0, 
    autoMemoryCheckFrequency: 2, 
    chatTurnsSinceLastCheck: 0,
    activeTheme: 'deep-dark', 
    customColors: {}, 
};

// --- Constants ---
const defaultTiles = [
    { id: 1, name: "Netflix", url: "https://www.netflix.com", icon: "N", color: "#E50914" },
    { id: 2, name: "Google News", url: "https://news.google.com", icon: "G", color: "#4285F4" },
    { id: 3, name: "Documents", url: "https://docs.google.com", icon: "D", color: "#0F9D58" },
    { id: 4, name: "Code Hub", url: "https://github.com", icon: "GH", "color": "#8B5CF6" }
];

// --- Data Persistence (EXTENSION STORAGE METHOD) ---

// 1. Initialize logic
function loadState() {
    browser.storage.local.get(['savedState']).then((result) => {
        let loadedData;

        // Check if we have saved data
        if (result.savedState && Object.keys(result.savedState).length > 0) {
            loadedData = result.savedState;
            console.log("Loaded data from extension storage.");
        } 
        // Fallback to defaults
        else if (window.DEFAULT_DATA) {
            loadedData = window.DEFAULT_DATA;
            console.log("First run: Loaded defaults.");
        } 
        // Emergency Fallback (If defaults.js fails completely)
        else {
            console.error("Defaults not found! Using empty fallback.");
            loadedData = { tiles: [], settings: { activeTheme: 'deep-dark' } };
        }

        // Apply data to variables
        tilesData = loadedData.tiles || [];
        remembers = loadedData.remembers || [];
        customThemes = loadedData.customThemes || {};
        memoryUsage = loadedData.memoryUsage || {};
        
        if (loadedData.settings) {
            settings = { ...settings, ...loadedData.settings };
        }

        // Render UI
        renderTiles();
        renderMemoriesList();
        applyTheme();
    }).catch((error) => {
        console.error("Error loading settings:", error);
    });
}

function saveState() {
    const settingsToSave = { ...settings };
    // Remove temporary runtime variables
    delete settingsToSave.chatTurnsSinceLastCheck;

    const stateToSave = {
        tiles: tilesData,
        remembers: remembers,
        customThemes: customThemes,
        memoryUsage: memoryUsage,
        settings: settingsToSave
    };

    // Save to Firefox internal storage
    browser.storage.local.set({ savedState: stateToSave }).then(() => {
        console.log("Settings saved successfully to extension storage.");
        
        // Optional: show a small toast notification instead of an alert
        const btn = document.getElementById('save-settings-btn');
        if(btn) {
            const originalText = btn.textContent;
            btn.textContent = "Saved!";
            setTimeout(() => btn.textContent = originalText, 1500);
        }
    });
}


// --- Utility Functions ---

function rgbToHex(rgb) {
    if (rgb.startsWith('#')) return rgb;
    let parts = rgb.match(/\d+/g);
    if (!parts || parts.length < 3) return '#000000'; 
    let hex = '#';
    for (let i = 0; i < 3; i++) {
        let h = parseInt(parts[i]).toString(16);
        hex += (h.length === 1) ? '0' + h : h;
    }
    return hex.toUpperCase();
}

/**
 * IMPROVED MARKDOWN PARSER
 * Handles: Headers, Links, Lists (Ordered/Unordered), Bold, Italic, Code Blocks, Blockquotes, HR
 */
function processMarkdown(text) {
    if (!text) return ""; 
    let html = text;

    // 1. Headers (Handle ## and ###)
    html = html.replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold text-indigo-300 mt-3 mb-1">$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold text-indigo-400 mt-4 mb-2">$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-indigo-500 mt-4 mb-2">$1</h1>');

    // 2. Bold and Italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); 
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>'); 
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>'); 
    html = html.replace(/_(.*?)_/g, '<em>$1</em>'); 

    // 3. Links [Text](URL) - NEW SUPPORT
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-indigo-400 underline hover:text-indigo-300 transition">$1</a>');

    // 4. Lists
    // Unordered (* or -)
    html = html.replace(/^\s*[\*\-]\s+(.*$)/gm, '<li class="list-disc ml-4">$1</li>');
    // Ordered (1. 2. etc) - NEW SUPPORT
    html = html.replace(/^\s*\d+\.\s+(.*$)/gm, '<li class="list-decimal ml-4">$1</li>');

    // Wrap lists in <ul> container
    html = html.replace(/((?:<li.*<\/li>\n?)+)/g, '<ul class="pl-5 space-y-1 my-2">$1</ul>');

    // 5. Blockquotes
    html = html.replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-indigo-500 pl-4 italic my-2 text-gray-400">$1</blockquote>');

    // 6. Code Blocks
    html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-black/30 p-3 rounded-md overflow-x-auto my-2 font-mono text-sm border border-gray-700">$1</pre>');
    html = html.replace(/`([^`]+)`/g, '<code class="bg-black/30 px-1 rounded font-mono text-sm text-indigo-300">$1</code>');

    // 7. Horizontal Rule - NEW SUPPORT
    html = html.replace(/^---$/gm, '<hr class="border-gray-700 my-4">');

    // 8. Line Breaks
    html = html.replace(/\n/g, '<br>');
    html = html.replace(/(<\/h\d>|<\/ul>|<\/blockquote>|<\/pre>|<\/hr>)\s*<br>/g, '$1');

    return html;
}


// --- Theme Management ---

function applyTheme(profileKey = null, customColors = null) {
    let themeData = {};

    if (profileKey && THEME_PRESETS[profileKey]) {
        themeData = THEME_PRESETS[profileKey];
        settings.activeTheme = profileKey;
        // Reset custom colors to match preset
        Object.keys(settings.customColors).forEach(key => {
            settings.customColors[key] = themeData[key] || settings.customColors[key];
        });
    } else if (profileKey && customThemes[profileKey]) { 
        themeData = customThemes[profileKey];
        settings.activeTheme = profileKey;
        settings.customColors = themeData; 
    } else if (customColors) {
        themeData = customColors;
        settings.activeTheme = 'custom';
        Object.keys(themeData).forEach(key => {
            settings.customColors[key] = themeData[key];
        });
    } else if (settings.activeTheme === 'custom' && Object.keys(settings.customColors).length > 0) {
        themeData = settings.customColors;
    } else {
        const currentKey = settings.activeTheme;
        if (customThemes[currentKey]) themeData = customThemes[currentKey];
        else themeData = THEME_PRESETS[currentKey] || THEME_PRESETS['deep-dark'];
        settings.activeTheme = settings.activeTheme in THEME_PRESETS ? settings.activeTheme : 'deep-dark';
    }

    const root = document.documentElement;
    Object.keys(themeData).forEach(key => {
        root.style.setProperty(key, themeData[key]);
    });
}

// Renders the Custom Themes Tab in the Modal
function renderCustomThemesList() {
    const customThemesListElement = document.getElementById('custom-themes-list');
    if (!customThemesListElement) return;

    customThemesListElement.innerHTML = '';
    const themeKeys = Object.keys(customThemes);

    if (themeKeys.length === 0) {
        customThemesListElement.innerHTML = '<p class="text-gray-500 text-sm italic">No custom themes saved.</p>';
        return;
    }

    themeKeys.forEach(key => {
        const item = document.createElement('div');
        item.className = 'flex justify-between items-center p-2 border border-gray-700/50 rounded-md bg-gray-800/50 text-sm';
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = key;
        nameSpan.className = 'font-semibold text-gray-200';
        
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'flex space-x-2 items-center';

        // Apply Button
        const applyBtn = document.createElement('button');
        applyBtn.textContent = (settings.activeTheme === key) ? 'ACTIVE' : 'Apply';
        applyBtn.disabled = (settings.activeTheme === key);
        applyBtn.className = `px-3 py-1 text-xs rounded-lg transition ${
            (settings.activeTheme === key) ? 'bg-green-600/70 text-white cursor-default' : 'bg-indigo-700/50 text-white hover:bg-indigo-600/60'
        }`;
        applyBtn.onclick = () => {
            applyTheme(key);
            appendResponse('system', `**Visuals:** Applied custom theme: "${key}".`);
            saveState();
        };

        // Delete Button
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '&#x2715;';
        deleteBtn.title = `Delete theme: ${key}`;
        deleteBtn.className = 'p-1 text-red-400 hover:text-red-300 transition';
        deleteBtn.onclick = () => deleteCustomTheme(key);

        controlsDiv.appendChild(applyBtn);
        controlsDiv.appendChild(deleteBtn);
        item.appendChild(nameSpan);
        item.appendChild(controlsDiv);
        customThemesListElement.appendChild(item);
    });
}

function saveNewCustomTheme() {
    const themeName = document.getElementById('custom-theme-name').value.trim();
    if (!themeName) {
        alert("Please enter a name for your custom theme.");
        return;
    }
    if (themeName in THEME_PRESETS) {
        alert(`"${themeName}" is reserved for a preset theme. Please choose a different name.`);
        return;
    }

    const newColors = {
        '--bg-primary': document.getElementById('bg-primary-picker-custom').value,
        '--bg-secondary': document.getElementById('bg-secondary-picker-custom').value,
        '--accent-primary': document.getElementById('accent-primary-picker-custom').value,
        '--chat-user-bg': document.getElementById('chat-user-bg-picker-custom').value,
        '--text-color': document.getElementById('text-color-picker-custom').value,
    };
    
    customThemes[themeName] = newColors;
    applyTheme(themeName); 
    document.getElementById('custom-theme-name').value = '';
    
    saveState(); // Triggers file download
    renderCustomThemesList();
    appendResponse('system', `**Visuals:** Saved new custom theme: "${themeName}".`);
}

function deleteCustomTheme(key) {
    if (key in THEME_PRESETS) {
        alert("Cannot delete a default preset theme.");
        return;
    }
    if (confirm(`Are you sure you want to delete the custom theme "${key}"?`)) {
        delete customThemes[key];
        if (settings.activeTheme === key || settings.activeTheme === 'custom') {
            applyTheme('deep-dark');
        }
        saveState();
        renderCustomThemesList();
        appendResponse('system', `**Visuals:** Custom theme "${key}" has been deleted.`);
    }
}


// --- API Helper Functions ---

/** Handles API calling with exponential backoff for retries. */
async function fetchWithRetry(url, payload, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            // Handle Rate Limits (429) or Server Errors (5xx)
            if (response.status === 429 || response.status >= 500) {
                // FIX: If this is the LAST attempt, throw error immediately
                if (i === maxRetries - 1) {
                    const errorBody = await response.json().catch(() => ({}));
                    throw new Error(`API Error: ${response.status} - ${errorBody.error?.message || response.statusText}`);
                }

                const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(`API Error: ${response.status} - ${errorBody.error?.message || response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

/** Function to check if memory should be saved using a specialized API call. */
async function evaluateForMemory() {
    settings.chatTurnsSinceLastCheck++;
    if (settings.chatTurnsSinceLastCheck < settings.autoMemoryCheckFrequency) {
        return;
    }
    settings.chatTurnsSinceLastCheck = 0;

    if (chatHistory.length < 2) return; 

    const lastUser = chatHistory[chatHistory.length - 2].parts[0].text;
    const lastModel = chatHistory[chatHistory.length - 1].parts[0].text;

    const fullApiUrl = `${settings.apiUrl}?key=${settings.apiKey}`;
    const payload = {
        contents: [{
            role: "user",
            parts: [{ 
                text: `Analyze this conversation. If the user makes a clear, declarative, personal statement (like "I live in X" or "I am watching Y") that should be remembered, extract ONLY that statement. If none, respond with 'NONE'.\n\nUser: ${lastUser}\nModel: ${lastModel}`
            }]
        }],
        tools: [],
        systemInstruction: {
            parts: [{ text: "You are a specialized text extractor. Your only job is to return the precise memory statement or the word 'NONE'." }]
        }
    };

    try {
        const result = await fetchWithRetry(fullApiUrl, payload);
        const candidate = result.candidates?.[0];
        let memoryText = candidate?.content?.parts?.[0]?.text?.trim();

        if (memoryText && memoryText.toUpperCase() !== 'NONE') {
            handleAutoMemory(memoryText);
        }
    } catch (error) {
        console.error("Auto-memory evaluation failed:", error);
    }
}

function handleAutoMemory(memory) {
    const existingIndex = remembers.indexOf(memory);
    if (existingIndex !== -1) remembers.splice(existingIndex, 1);
    
    remembers.unshift(memory);
    memoryUsage[memory] = Date.now(); 

    if (remembers.length > settings.maxRemembers) { 
        const removedMemory = remembers.pop();
        delete memoryUsage[removedMemory];
        appendResponse('system', `**Auto-Memory:** Learned: "${memory}". (Discarded oldest memory due to limit.)`);
    } else {
         appendResponse('system', `**Auto-Memory:** Learned: "${memory}".`);
    }

    saveState(); // Saves new memory
}


// --- Rendering and Messaging Functions ---

function renderTiles() {
    shortcutsList.innerHTML = '';

    if (isEditMode) {
        controlsFooter.classList.add('controls-visible');
        controlsFooter.classList.remove('opacity-0', 'group-hover:opacity-100'); 
        settingsButton.classList.remove('hidden');
        addTileButton.classList.remove('hidden');
    } else {
        controlsFooter.classList.remove('controls-visible');
        controlsFooter.classList.add('opacity-0', 'group-hover:opacity-100'); 
        settingsButton.classList.add('hidden');
        addTileButton.classList.add('hidden');
    }

    tilesData.forEach(tile => {
        const tileElement = document.createElement('a');
        tileElement.href = isEditMode ? "#" : tile.url; 
        tileElement.className = `shortcut-tile mb-3 ${isEditMode ? 'cursor-pointer edit-active' : ''}`;
        
        if (isEditMode) {
            tileElement.onclick = (e) => {
                e.preventDefault();
                openTileModal('edit', tile); 
            };
        }

        tileElement.innerHTML = `
            <div class="tile-icon-display w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-base shadow-inner" style="background-color: ${tile.color};">
                ${tile.icon}
            </div>
            <p class="tile-name font-semibold">${tile.name}</p>
        `;
        shortcutsList.appendChild(tileElement);
    });

    editModeToggle.textContent = isEditMode ? "Done" : "Edit";
    editModeToggle.classList.toggle('bg-white/10', !isEditMode);
    editModeToggle.classList.toggle('bg-indigo-700/50', isEditMode); 
}

function appendResponse(sender, text) {
    const isUser = sender === 'user';
    const isSystem = sender === 'system';
    
    const role = isUser ? 'user' : 'model';
    const messagePart = { text: text.replace(/\*\*|__|\*|_/g, ' ').trim() }; 

    if (!isSystem) chatHistory.push({ role: role, parts: [messagePart] });
    
    const messageContainer = document.createElement('div');
    messageContainer.className = `flex ${isUser ? 'justify-end' : 'justify-start'}`;

    const messageBubble = document.createElement('div');
    const bubbleClasses = `max-w-xl p-3 rounded-xl backdrop-filter backdrop-blur-md border border-white/10 shadow-lg chat-output ${isUser ? 'bg-indigo-700/50 text-white' : 'bg-gray-800/50 text-gray-100'}`;
    messageBubble.className = bubbleClasses;

    if (!isUser) {
        const senderName = document.createElement('p');
        senderName.className = `font-semibold ${sender === 'gemini' ? 'text-indigo-400' : 'text-green-400'}`;
        senderName.textContent = sender === 'gemini' ? 'Gemini' : 'System';
        messageBubble.appendChild(senderName);
    }

    const content = document.createElement('div'); 
    content.innerHTML = processMarkdown(text); 
    
    messageBubble.appendChild(content);
    messageContainer.appendChild(messageBubble);
    outputDiv.appendChild(messageContainer);
    outputDiv.scrollTop = outputDiv.scrollHeight;
}


// --- Modal Handlers (Tiles) ---

function openTileModal(mode, tile = {}) { 
    modal.style.display = 'flex';
    
    if (mode === 'add') {
        modalTitle.textContent = "Add New Tile";
        tileForm.reset();
        deleteTileButton.classList.add('hidden');
        document.getElementById('tile-id').value = '';
        tileColorInput.value = '#8B5CF6'; 
    } else {
        modalTitle.textContent = "Edit Tile";
        document.getElementById('tile-name').value = tile.name || '';
        document.getElementById('tile-url').value = tile.url || '';
        document.getElementById('tile-icon').value = tile.icon || '';
        tileColorInput.value = tile.color || '#8B5CF6'; 
        document.getElementById('tile-id').value = tile.id || '';
        deleteTileButton.classList.remove('hidden');
    }
}

function closeTileModal() { 
    modal.style.display = 'none';
}

// --- Modal Handlers (Settings) ---

function openSettingsModal() {
    apiUrlInput.value = settings.apiUrl || "";
    apiKeyInput.value = settings.apiKey || "";
    maxRemembersInput.value = settings.maxRemembers;
    contextSizeInput.value = settings.contextSize;

    const lock1 = document.getElementById('api-url-locked-message');
    const lock2 = document.getElementById('api-key-locked-message');
    if (API_URL_HARDCODED && lock1) lock1.classList.remove('hidden');
    if (API_KEY_HARDCODED && lock2) lock2.classList.remove('hidden');

    switchSettingsTab('general-tab');
    settingsModal.style.display = 'flex';
}

function closeSettingsModal() {
    settingsModal.style.display = 'none';
}

function switchSettingsTab(tabId) {
    [generalTabContent, memoriesTabContent, visualsTabContent].forEach(el => el.classList.add('hidden'));
    document.getElementById(tabId).classList.remove('hidden');

    [generalTabButton, memoriesTabButton, visualsTabButton].forEach(btn => {
        const active = btn.dataset.tab === tabId;
        btn.classList.toggle('border-indigo-400', active);
        btn.classList.toggle('text-indigo-300', active);
        btn.classList.toggle('text-gray-400', !active);
        btn.classList.toggle('border-transparent', !active);
    });

    if (tabId === 'memories-tab') renderMemoriesList();
    if (tabId === 'visuals-tab') loadVisualsTab();
}

function renderMemoriesList() {
    memoriesList.innerHTML = '';
    if (remembers.length === 0) {
        memoriesList.innerHTML = '<p class="text-gray-500 text-sm italic">No active memories.</p>';
        return;
    }
    remembers.forEach((memory, index) => {
        const item = document.createElement('div');
        item.className = 'flex justify-between items-center p-3 border border-gray-700/50 rounded-md bg-gray-800/50 text-sm text-gray-200';
        item.innerHTML = `<span class="break-words pr-4"><span class="font-bold text-indigo-400">#${index + 1}:</span> ${processMarkdown(memory)}</span>`;
        
        const delBtn = document.createElement('button');
        delBtn.innerHTML = '&#x2715;';
        delBtn.className = 'text-red-400 hover:text-red-300';
        delBtn.onclick = () => {
            remembers.splice(index, 1);
            saveState();
            renderMemoriesList();
        };
        item.appendChild(delBtn);
        memoriesList.appendChild(item);
    });
}

function loadVisualsTab() {
    const visualsTab = document.getElementById('visuals-tab');
    
    if (!visualsTab.innerHTML.includes('visuals-content')) {
         visualsTab.innerHTML = `
            <div class="flex border-b border-gray-600 mb-4">
                <button class="visuals-tab-button px-4 py-2 text-sm font-medium border-b-2 border-indigo-400 text-indigo-300 transition duration-150" data-tab="visuals-presets">Theme Presets</button>
                <button class="visuals-tab-button px-4 py-2 text-sm font-medium border-b-2 border-transparent text-gray-400 transition duration-150" data-tab="visuals-custom">Custom Themes</button>
            </div>
            <div id="visuals-content"></div>
        `;
        
        const buttons = visualsTab.querySelectorAll('.visuals-tab-button');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                buttons.forEach(b => {
                    b.classList.remove('border-indigo-400', 'text-indigo-300');
                    b.classList.add('border-transparent', 'text-gray-400');
                });
                e.target.classList.add('border-indigo-400', 'text-indigo-300');
                e.target.classList.remove('border-transparent', 'text-gray-400');

                const visualsContent = document.getElementById('visuals-content');
                if (e.target.dataset.tab === 'visuals-presets') renderPresetsTab(visualsContent);
                else renderCustomizerTab(visualsContent);
            });
        });
    }
    renderPresetsTab(document.getElementById('visuals-content'));
}

function renderPresetsTab(container) {
    container.innerHTML = `<div id="preset-list" class="space-y-2 max-h-64 overflow-y-auto p-2 bg-gray-900/50 border border-gray-700 rounded-md"></div>`;
    const list = container.querySelector('#preset-list');
    
    Object.keys(THEME_PRESETS).forEach(key => {
        const div = document.createElement('div');
        div.className = 'flex justify-between items-center p-3 rounded-md hover:bg-gray-700/50';
        div.innerHTML = `<span class="font-bold text-gray-200">${key}</span>`;
        
        const btn = document.createElement('button');
        btn.textContent = 'Apply';
        btn.className = 'px-3 py-1 text-xs rounded-lg bg-indigo-700/50 text-white hover:bg-indigo-600/60';
        btn.onclick = () => {
            applyTheme(key);
            saveState();
        };
        div.appendChild(btn);
        list.appendChild(div);
    });
}

function renderCustomizerTab(container) {
    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-4">
                <p class="font-semibold text-indigo-300">Create New Theme</p>
                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1"><label class="text-xs text-gray-400">Bg Primary</label><input type="color" id="bg-primary-picker-custom" class="w-full h-8 bg-transparent cursor-pointer"></div>
                    <div class="space-y-1"><label class="text-xs text-gray-400">Bg Secondary</label><input type="color" id="bg-secondary-picker-custom" class="w-full h-8 bg-transparent cursor-pointer"></div>
                    <div class="space-y-1"><label class="text-xs text-gray-400">Accent</label><input type="color" id="accent-primary-picker-custom" class="w-full h-8 bg-transparent cursor-pointer"></div>
                    <div class="space-y-1"><label class="text-xs text-gray-400">Chat Bubble</label><input type="color" id="chat-user-bg-picker-custom" class="w-full h-8 bg-transparent cursor-pointer"></div>
                    <div class="space-y-1"><label class="text-xs text-gray-400">Text Color</label><input type="color" id="text-color-picker-custom" class="w-full h-8 bg-transparent cursor-pointer"></div>
                </div>
                <div class="pt-2">
                    <input id="custom-theme-name" type="text" placeholder="Theme Name" class="w-full p-2 bg-gray-900 border border-gray-600 rounded text-white mb-2">
                    <button id="save-custom-theme-btn" class="w-full py-2 bg-green-600 text-white rounded hover:bg-green-500">Save & Apply</button>
                </div>
            </div>
            <div>
                <p class="font-semibold text-indigo-300 mb-2">Your Custom Themes</p>
                <div id="custom-themes-list" class="space-y-2 max-h-64 overflow-y-auto p-2 bg-gray-900/50 border border-gray-700 rounded-md"></div>
            </div>
        </div>
    `;
    
    document.getElementById('save-custom-theme-btn').addEventListener('click', saveNewCustomTheme);

    const root = document.documentElement;
    const styles = getComputedStyle(root);
    document.getElementById('bg-primary-picker-custom').value = rgbToHex(styles.getPropertyValue('--bg-primary').trim());
    document.getElementById('bg-secondary-picker-custom').value = rgbToHex(styles.getPropertyValue('--bg-secondary').trim());
    document.getElementById('accent-primary-picker-custom').value = rgbToHex(styles.getPropertyValue('--accent-primary').trim());
    document.getElementById('chat-user-bg-picker-custom').value = rgbToHex(styles.getPropertyValue('--chat-user-bg').trim());
    document.getElementById('text-color-picker-custom').value = rgbToHex(styles.getPropertyValue('--text-color').trim());

    renderCustomThemesList();
}


// --- Logic & Event Handlers ---

function toggleEditMode() {
    isEditMode = !isEditMode;
    renderTiles();
}

// Tile Form Submit
saveTileBtn.addEventListener('click', (e) => {
    const idInput = document.getElementById('tile-id');
    const isEditing = !!idInput.value;

    const newTile = {
        id: isEditing ? parseInt(idInput.value) : Date.now(),
        name: document.getElementById('tile-name').value.trim(),
        url: document.getElementById('tile-url').value.trim(),
        icon: document.getElementById('tile-icon').value.trim().toUpperCase(),
        color: tileColorInput.value
    };

    if (isEditing) tilesData = tilesData.map(t => t.id === newTile.id ? newTile : t);
    else tilesData.push(newTile);

    saveState();
    closeTileModal();
    renderTiles();
});

deleteTileButton.addEventListener('click', () => {
    const id = parseInt(document.getElementById('tile-id').value);
    tilesData = tilesData.filter(t => t.id !== id);
    saveState();
    closeTileModal();
    renderTiles();
});

// Settings Form Submit
saveSettingsBtn.addEventListener('click', () => {
    const newMaxRemembers = parseInt(maxRemembersInput.value);
    const newContextSize = parseInt(contextSizeInput.value);
    
    if (newMaxRemembers < 1 || newContextSize < 0) {
        alert("Invalid input values.");
        return;
    }
    
    settings.maxRemembers = newMaxRemembers;
    settings.contextSize = newContextSize;
    
    if (!API_URL_HARDCODED) settings.apiUrl = apiUrlInput.value.trim();
    if (!API_KEY_HARDCODED) settings.apiKey = apiKeyInput.value.trim();

    saveState();
    closeSettingsModal();
});

// Main Chat Logic
async function handleSend() {
    const rawInput = inputField.value.trim();
    if (!rawInput) return;

    if (!settings.apiKey) {
        alert("API Key missing.");
        return;
    }
    
    appendResponse('user', rawInput);
    inputField.value = '';
    sendButton.disabled = true;
    loadingMessage.classList.remove('hidden');

    if (rawInput.toLowerCase().startsWith('remember ')) {
        const memory = rawInput.substring(9).trim();
        remembers.unshift(memory);
        if (remembers.length > settings.maxRemembers) remembers.pop();
        appendResponse('system', `**Memory Saved:** "${memory}"`);
        saveState();
        sendButton.disabled = false;
        loadingMessage.classList.add('hidden');
        return;
    }

    const contextString = remembers.map(r => `[Memory: ${r}]`).join(' ');
    let contents = [];

    if (settings.contextSize > 0) {
        const startIndex = Math.max(0, chatHistory.length - (settings.contextSize * 2));
        contents = chatHistory.slice(startIndex);
    } else {
        contents = [{ role: 'user', parts: [{ text: rawInput }] }];
    }

    const lastMsgIndex = contents.length - 1;
    if (lastMsgIndex >= 0) {
        if (contents[lastMsgIndex].role !== 'user' || contents[lastMsgIndex].parts[0].text !== rawInput) {
             contents.push({ role: 'user', parts: [{ text: `Context: ${contextString}. User Query: ${rawInput}` }] });
        } else {
             contents[lastMsgIndex].parts[0].text = `Context: ${contextString}. User Query: ${rawInput}`;
        }
    } else {
         contents.push({ role: 'user', parts: [{ text: `Context: ${contextString}. User Query: ${rawInput}` }] });
    }

    const fullApiUrl = `${settings.apiUrl}?key=${settings.apiKey}`;
    
    // SYSTEM INSTRUCTION TO ALLOW LINKS
    const payload = {
        contents: contents,
        systemInstruction: {
            parts: [{ text: "You are a concise, knowledgeable digital assistant. You have full access to the internet context I provide. You CAN and SHOULD provide external links using standard Markdown syntax: [Link Text](URL). Respond to questions about current events, facts, or shows with a brief, clear, and single-turn answer." }]
        }
    };

    try {
        const response = await fetchWithRetry(fullApiUrl, payload);
        
        const answer = response.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
        appendResponse('gemini', answer);
        
        if (settings.autoMemoryCheckFrequency > 0) setTimeout(evaluateForMemory, 500);

    } catch (e) {
        console.error(e);
        appendResponse('system', `Error: ${e.message}`);
    } finally {
        sendButton.disabled = false;
        loadingMessage.classList.add('hidden');
        inputField.focus();
    }
}


// --- Init & Global Event Listeners ---

sendButton.addEventListener('click', handleSend);
addTileButton.addEventListener('click', () => openTileModal('add'));
editModeToggle.addEventListener('click', toggleEditMode);
settingsButton.addEventListener('click', openSettingsModal);
cancelModal.addEventListener('click', closeTileModal);
cancelSettingsModal.addEventListener('click', closeSettingsModal);
closeSettingsModalX.addEventListener('click', closeSettingsModal);
generalTabButton.addEventListener('click', () => switchSettingsTab('general-tab'));
memoriesTabButton.addEventListener('click', () => switchSettingsTab('memories-tab'));
visualsTabButton.addEventListener('click', () => switchSettingsTab('visuals-tab'));
clearMemoriesButton.addEventListener('click', () => { remembers=[]; saveState(); renderMemoriesList(); });

// *** GLOBAL KEYDOWN HANDLER ***
document.addEventListener('keydown', (e) => {
    const isTileModalOpen = modal.style.display === 'flex';
    const isSettingsModalOpen = settingsModal.style.display === 'flex';
    const isTypingField = document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA';

    // 1. Escape Closes Modals
    if (e.key === 'Escape') {
        if (isSettingsModalOpen) { closeSettingsModal(); return; }
        if (isTileModalOpen) { closeTileModal(); return; }
    }

    // 2. Global Enter (Send Message if no modal)
    if (e.key === 'Enter') {
        if (isTileModalOpen) { /* Let modal handle form submit */ return; }
        if (isSettingsModalOpen) { /* Let modal handle form submit */ return; }
        
        if (document.activeElement !== inputField) {
            e.preventDefault();
            handleSend();
        }
    }

    // 3. Type Anywhere to Focus
    if (!isTypingField && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        inputField.focus();
    }
});

inputField.addEventListener('keydown', (e) => { 
    if(e.key === 'Enter') {
        e.preventDefault();
        handleSend();
    }
});

window.onload = () => {
    loadState(); 
    document.getElementById('prompt-input').focus();
};