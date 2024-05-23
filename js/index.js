document.addEventListener('DOMContentLoaded', function() {
    const formRows = document.getElementById('form-rows');
    const textModal = document.getElementById('text-modal');
    const modalTextarea = document.getElementById('modal-textarea');
    const fileNameInput = document.getElementById('file-name');
    const sessionsContainer = document.getElementById('sessions-container');
    const sessionMenu = document.getElementById('session-menu');
    let currentTextInput = null;
    let currentSession = null;

    // Function to generate a unique session ID
    function generateSessionID() {
        console.log(`Se ha creado una nueva sesión llamada 'session_${new Date().getTime()}'.`)
        return `session_${new Date().getTime()}`;
    }

    // Function to save form state to localStorage
    function saveFormState() {
        if (!currentSession) {
            currentSession = generateSessionID();
            console.log(`Sesión actual: ${currentSession}.`)
        }

        const sessionName = fileNameInput.value || 'New book';
        const rows = formRows.querySelectorAll('.form-row');
        const formData = {
            sessionName: sessionName,
            fileName: fileNameInput.value,
            rows: []
        };

        rows.forEach(row => {
            const typeSelect = row.querySelector('.type-select').value;
            const indexInput = row.querySelector('.index-input').value;
            const textInput = row.querySelector('.text-input').value;

            formData.rows.push({
                type: typeSelect,
                index: indexInput,
                text: textInput
            });
        });

        localStorage.setItem(currentSession, JSON.stringify(formData));

        let sessions = JSON.parse(localStorage.getItem('sessions')) || [];
        if (!sessions.includes(currentSession)) {
            sessions.push(currentSession);
            localStorage.setItem('sessions', JSON.stringify(sessions));
            console.log(`La sesión '${currentSession}' se ha agregado a la lista de sesiones.`)
        }

        loadSessions();
    }

    // Function to load form state from localStorage
    function loadFormState(sessionKey) {
        console.log(`Cargando la sesión '${sessionKey}'.`);
        const formData = JSON.parse(localStorage.getItem(sessionKey)) || { fileName: '', rows: [] };
        formRows.innerHTML = '';
        fileNameInput.value = formData.fileName;
        formData.rows.forEach(data => {
            addRow(data.type, data.index, data.text);
        });
        currentSession = sessionKey;
        console.log(`La sesión actual después de cargar: ${currentSession}`);
    }
    

    // Function to load all sessions
    function loadSessions() {
        sessionsContainer.innerHTML = '';
        const sessions = JSON.parse(localStorage.getItem('sessions')) || [];
        sessions.forEach(sessionKey => {
            const sessionDiv = document.createElement('div');
            sessionDiv.classList.add('session-saved')
            const loadButton = document.createElement('button');
            const sessionData = JSON.parse(localStorage.getItem(sessionKey));
            loadButton.innerHTML = `<span>${sessionData.sessionName}</span>`;
            loadButton.addEventListener('click', () => {
                loadFormState(sessionKey);
                closeMenu();
            });
            
            const deleteButton = document.createElement('button');
            deleteButton.innerHTML = '<svg  xmlns="http://www.w3.org/2000/svg"  width="16"  height="16"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-x"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg>';
            deleteButton.addEventListener('click', () => {
                localStorage.removeItem(sessionKey);
                const updatedSessions = sessions.filter(session => session !== sessionKey);
                localStorage.setItem('sessions', JSON.stringify(updatedSessions));
                loadSessions();
            });

            sessionDiv.appendChild(loadButton);
            sessionDiv.appendChild(deleteButton);
            sessionsContainer.appendChild(sessionDiv);
        });

        console.log(`Todas las sesiones se han cargado.`)
    }

    // Function to open the modal
    function openModal(input) {
        currentTextInput = input;
        modalTextarea.value = input.value.replace(/\\n/g, '\n').replace(/\\"/g, '"'); // Reemplazar representaciones JSON con representaciones normales
        textModal.style.display = 'flex';
    }

    // Function to save text from modal
    function saveText() {
        if (currentTextInput) {
            let text = modalTextarea.value;
            text = text.replace(/"/g, '\\"'); // Escapar comillas
            text = text.replace(/\n/g, '\\n'); // Escapar saltos de línea
            currentTextInput.value = text;
            textModal.style.display = 'none';
            saveFormState();
        }
    }

    // Function to add a new row
    function addRow(type = 'Dialogo', index = 0, text = '') {
        const row = document.createElement('div');
        row.classList.add('form-row');
        row.innerHTML = `
            <div>
                <select class="type-select">
                    <option value="Dialogo">Diálogo</option>
                    <option value="Respuesta">Respuesta</option>
                    <option value="Sonido">Sonido</option>
                    <option value="SonidoLoop">Sonido Loop</option>
                    <option value="Musica">Música</option>
                    <option value="Modo">Modo</option>
                    <option value="Efecto">Efecto</option>
                </select>
            </div>
            <div><input type="number" class="index-input" value="${index}" min="0"></div>
            <div><input type="text" class="key-output" readonly></div>
            <div class="div-text-content"><input type="text" class="text-input" value="${text}" readonly></div>
            <div><button class="delete-row"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icon-tabler-outline icon-tabler-x"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M18 6l-12 12"/><path d="M6 6l12 12"/></svg></button></div>
        `;
        formRows.appendChild(row);

        const typeSelect = row.querySelector('.type-select');
        const indexInput = row.querySelector('.index-input');
        const textInput = row.querySelector('.text-input');
        const deleteButton = row.querySelector('.delete-row');

        typeSelect.value = type;
        typeSelect.addEventListener('change', updateKeys);
        indexInput.addEventListener('change', updateKeys);
        textInput.addEventListener('click', () => openModal(textInput));
        deleteButton.addEventListener('click', () => {
            formRows.removeChild(row);
            updateKeys();
        });

        updateKeys();
    }

    // Function to update keys
    function updateKeys() {
        let soundCounters = {};
        let soundLoopCounters = {};

        const rows = formRows.querySelectorAll('.form-row');

        rows.forEach(row => {
            const typeSelect = row.querySelector('.type-select').value;
            const indexInput = row.querySelector('.index-input').value;
            const keyOutput = row.querySelector('.key-output');

            let key;

            switch (typeSelect) {
                case 'Sonido':
                    if (!soundCounters[indexInput]) {
                        soundCounters[indexInput] = 0;
                    }
                    soundCounters[indexInput]++;
                    key = `S${indexInput}.${soundCounters[indexInput]}`;
                    break;
                case 'SonidoLoop':
                    if (!soundLoopCounters[indexInput]) {
                        soundLoopCounters[indexInput] = 0;
                    }
                    soundLoopCounters[indexInput]++;
                    key = `S${indexInput}.${soundLoopCounters[indexInput]}L`;
                    break;
                case 'Dialogo':
                    key = `D${indexInput}`;
                    break;
                case 'Respuesta':
                    key = `R${indexInput}`;
                    break;
                case 'Musica':
                    key = `MU${indexInput}`;
                    break;
                case 'Modo':
                    key = `MO${indexInput}`;
                    break;
                case 'Efecto':
                    key = `EF${indexInput}`;
                    break;
            }

            keyOutput.value = key;
        });
    }

    // Function to open the session menu
    function openMenu() {
        sessionMenu.classList.toggle('open');
        document.querySelector("#open-menu").classList.toggle('opened')
    }

    // Function to close the session menu
    function closeMenu() {
        sessionMenu.classList.remove('open');
    }

    // Event listener for adding a new row
    document.getElementById('add-row').addEventListener('click', () => addRow());

    // Event listener for making text bold
    document.getElementById('bold-button').addEventListener('click', () => {
        const start = modalTextarea.selectionStart;
        const end = modalTextarea.selectionEnd;
        const selectedText = modalTextarea.value.substring(start, end);
        const newText = `[b]${selectedText}[/b]`;
        modalTextarea.setRangeText(newText, start, end, 'end');
    });

    // Event listener for making text italic
    document.getElementById('italic-button').addEventListener('click', () => {
        const start = modalTextarea.selectionStart;
        const end = modalTextarea.selectionEnd;
        const selectedText = modalTextarea.value.substring(start, end);
        const newText = `[i]${selectedText}[/i]`;
        modalTextarea.setRangeText(newText, start, end, 'end');
    });
    
    // Event listener for saving text from modal
    document.getElementById('save-text').addEventListener('click', saveText);
        
    // Event listener for generating JSON
    document.getElementById('generate-json').addEventListener('click', () => {
        const rows = formRows.querySelectorAll('.form-row');
        const data = [];
    
        rows.forEach(row => {
            const typeSelect = row.querySelector('.type-select').value;
            const indexInput = row.querySelector('.index-input').value;
            const keyOutput = row.querySelector('.key-output').value;
            const textInput = row.querySelector('.text-input').value;
    
            // Reemplazar correctamente \\n con \n antes de generar el JSON
            const finalText = textInput.replace(/\\n/g, '\n').replace(/\\\"/g, '\"');;
    
            data.push({
                type: typeSelect,
                index: indexInput,
                key: keyOutput,
                text: finalText
            });
        });
    
        const fileName = document.getElementById('file-name').value || 'data';
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
    
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.json`;
        a.click();
        URL.revokeObjectURL(url);
    });
    
    // Event listener for creating a new session
    document.getElementById('new-session').addEventListener('click', () => {
        currentSession = null;
        formRows.innerHTML = '';
        fileNameInput.value = '';
        addRow();
    });
    
    // Event listener for clearing all sessions
    document.getElementById('clear-sessions').addEventListener('click', () => {
        const sessions = JSON.parse(localStorage.getItem('sessions')) || [];
        sessions.forEach(sessionKey => localStorage.removeItem(sessionKey));
        localStorage.removeItem('sessions');
        loadSessions();

        console.log(`Todas las sesiones han sido eliminadas`)
    });
    
    // Event listener for opening the session menu
    document.getElementById('open-menu').addEventListener('click', openMenu);
    
    // Event listener for closing the session menu
    document.getElementById('close-menu').addEventListener('click', closeMenu);
    
    // Event listener for changes in the file name input
    fileNameInput.addEventListener('input', saveFormState);
    
    // Load sessions and the last session on page load
    loadSessions();
    const lastSessionKey = (JSON.parse(localStorage.getItem('sessions')) || []).pop();
    if (lastSessionKey) {
        loadFormState(lastSessionKey);
    } else {
        addRow();
    }
});


