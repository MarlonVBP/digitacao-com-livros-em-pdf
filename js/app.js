// Configuração Inicial do Worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

// --- VARIÁVEIS GLOBAIS DE ESTADO ---
let pdfDoc = null;
let currentPage = 1;
let totalPages = 1;
let originalText = "";
let currentIndex = 0;
let startTime = null;
let errors = 0;
let isTypingEnabled = false;
let accentPending = false; 
let isPredefinedMode = false;

// --- TEXTOS PRÉ-DEFINIDOS ---
const preDefTexts = {
    'historia': `A vila de Eldoria enfrentava a maior seca de sua história. O poço central havia secado completamente. Os moradores tentaram cavar mais fundo, mas encontraram apenas rocha maciça, e o racionamento rigoroso gerou desespero.\nDias se passaram com o calor aumentando e as esperanças diminuindo.\nAté que uma jovem construtora, observando as nuvens escuras sobre as montanhas, decidiu agir. Ela projetou e liderou a construção de um longo aqueduto de bambu.\nApós semanas de trabalho árduo e união da comunidade, a água fresca finalmente chegou à praça, resolvendo o problema e salvando a todos.`,
    'tecnico': `O desenvolvimento front-end moderno exige uma arquitetura sólida e escalável.\nFrameworks baseados em JavaScript facilitam a componentização da interface do usuário.\nAlém disso, o uso de utilitários de estilo permite que a aplicação seja construída de forma ágil.\nAo final, a otimização de performance e a responsividade devem ser sempre uma prioridade para garantir o sucesso.`,
    'motivacional': `O sucesso não é o final, e o fracasso não é fatal: o que realmente conta é a coragem para continuar.\nA jornada de mil milhas começa sempre com um único passo.\nNão tenha medo de desistir do que é bom para ir atrás do que é extraordinário.\nLembre-se de que a persistência é o único caminho verdadeiro para o êxito.`
};

// --- GERENCIADOR DE TEMAS ---
const themeSelector = document.getElementById('theme-selector');
const savedTheme = localStorage.getItem('pdfTyperTheme') || 'slate';
document.documentElement.setAttribute('data-theme', savedTheme);
if (themeSelector) themeSelector.value = savedTheme;

if (themeSelector) {
    themeSelector.addEventListener('change', (e) => {
        document.documentElement.setAttribute('data-theme', e.target.value);
        localStorage.setItem('pdfTyperTheme', e.target.value);
    });
}

// --- MAPEAMENTO DE ACENTOS (TECLADO VIRTUAL) ---
const accentMap = {
    'á':{key:'acute',base:'a',reqShift:false}, 'é':{key:'acute',base:'e',reqShift:false}, 'í':{key:'acute',base:'i',reqShift:false}, 'ó':{key:'acute',base:'o',reqShift:false}, 'ú':{key:'acute',base:'u',reqShift:false},
    'à':{key:'acute',base:'a',reqShift:true}, 'è':{key:'acute',base:'e',reqShift:true}, 'ì':{key:'acute',base:'i',reqShift:true}, 'ò':{key:'acute',base:'o',reqShift:true}, 'ù':{key:'acute',base:'u',reqShift:true},
    'ã':{key:'tilde',base:'a',reqShift:false}, 'õ':{key:'tilde',base:'o',reqShift:false}, 'ñ':{key:'tilde',base:'n',reqShift:false},
    'â':{key:'tilde',base:'a',reqShift:true}, 'ê':{key:'tilde',base:'e',reqShift:true}, 'î':{key:'tilde',base:'i',reqShift:true}, 'ô':{key:'tilde',base:'o',reqShift:true}, 'û':{key:'tilde',base:'u',reqShift:true}
};

// --- REFERÊNCIAS DO DOM ---
const uploadScreen = document.getElementById("upload-screen");
const loaderScreen = document.getElementById("loader-screen");
const pageContainer = document.getElementById("page-container");
const pageCard = document.getElementById("page-card");
const typingArea = document.getElementById("typing-area");
const nextPageOverlay = document.getElementById("next-page-overlay");
const statsCard = document.getElementById("stats-card");
const progressBar = document.getElementById("reading-progress");
const keyboardContainer = document.getElementById("virtual-keyboard-container");
const hiddenMobileInput = document.getElementById("mobile-hidden-input");

// --- CONTROLE DE FOCO (MOBILE) ---
pageContainer.addEventListener('click', () => {
    if (isTypingEnabled) {
        hiddenMobileInput.focus();
        hiddenMobileInput.value = ""; 
    }
});

// --- CONTROLE DO TECLADO GUIA ---
const btnToggleKeyboard = document.getElementById("btn-toggle-keyboard");
if (btnToggleKeyboard) {
    btnToggleKeyboard.addEventListener("click", () => {
        const body = document.body;
        body.classList.toggle('keyboard-open');
        
        if (keyboardContainer.classList.contains('translate-y-full')) {
            keyboardContainer.classList.remove('translate-y-full');
            keyboardContainer.classList.add('translate-y-0');
            updateVirtualKeyboardHighlight();
        } else {
            keyboardContainer.classList.add('translate-y-full');
            keyboardContainer.classList.remove('translate-y-0');
        }
    });
}

function updateVirtualKeyboardHighlight() {
    if (window.innerWidth < 768) return; 
    document.querySelectorAll('.vk-key').forEach(key => key.classList.remove('active-target'));
    if (keyboardContainer.classList.contains('translate-y-full')) return;

    const spans = document.querySelectorAll("#typing-area span");
    if (currentIndex >= spans.length) return;
    const currentSpan = spans[currentIndex];
    
    if (currentSpan.dataset.enter === "true") {
        const keyEl = document.querySelector(`.vk-key[data-key="enter"]`);
        if (keyEl) keyEl.classList.add('active-target');
        return;
    }

    let targetChar = currentSpan.innerText;
    let lowerChar = targetChar.toLowerCase();

    if (accentMap[lowerChar]) {
        const mapping = accentMap[lowerChar];
        if (!accentPending) {
            const keyEl = document.querySelector(`.vk-key[data-key="${mapping.key}"]`);
            if (keyEl) keyEl.classList.add('active-target');
            if (mapping.reqShift || targetChar !== lowerChar) {
                document.querySelectorAll('.vk-key[data-key="shift"]').forEach(k => k.classList.add('active-target'));
            }
        } else {
            const baseEl = document.querySelector(`.vk-key[data-key="${mapping.base}"]`);
            if (baseEl) baseEl.classList.add('active-target');
            if (targetChar !== lowerChar) {
                document.querySelectorAll('.vk-key[data-key="shift"]').forEach(k => k.classList.add('active-target'));
            }
        }
    } else {
        let keyToFind = lowerChar;
        if (targetChar === ' ') keyToFind = 'space';
        
        const keyEl = document.querySelector(`.vk-key[data-key="${keyToFind}"]`);
        if (keyEl) keyEl.classList.add('active-target');
        if (targetChar !== targetChar.toLowerCase() && targetChar.match(/[A-ZÇ]/)) {
             document.querySelectorAll('.vk-key[data-key="shift"]').forEach(k => k.classList.add('active-target'));
        }
    }
}

// --- INÍCIO RÁPIDO (MODO TREINO) ---
window.startPredefined = function(type) {
    isPredefinedMode = true;
    pdfDoc = null;
    totalPages = 1;
    currentPage = 1;

    uploadScreen.classList.add("opacity-0");
    setTimeout(() => uploadScreen.classList.add("hidden"), 500);

    document.getElementById("loading-page-num").innerText = "Selecionado";
    document.getElementById("page-display").innerText = `1 / 1`;
    progressBar.style.width = "0%";
    
    document.getElementById("btn-prev-page").classList.add("hidden");
    document.getElementById("btn-skip-current-page").classList.add("hidden");

    prepareGame(preDefTexts[type]);
};

// --- UPLOAD PDF ---
const fileInput = document.getElementById("file-input");
if (fileInput) {
    fileInput.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        isPredefinedMode = false;
        const userStartPage = parseInt(document.getElementById("start-page-input").value) || 1;
        uploadScreen.classList.add("opacity-0");
        setTimeout(() => uploadScreen.classList.add("hidden"), 500);

        try {
            const arrayBuffer = await file.arrayBuffer();
            pdfDoc = await pdfjsLib.getDocument(arrayBuffer).promise;
            totalPages = pdfDoc.numPages;

            document.getElementById("btn-prev-page").classList.remove("hidden");
            document.getElementById("btn-skip-current-page").classList.remove("hidden");

            currentPage = userStartPage;
            if (currentPage < 1) currentPage = 1;
            if (currentPage > totalPages) {
                alert(`O documento só tem ${totalPages} páginas. Começando na última.`);
                currentPage = totalPages;
            }
            loadPage(currentPage);
        } catch(err) {
            alert("Erro ao ler PDF: " + err.message);
            location.reload();
        }
    });
}

document.getElementById("btn-change-pdf").addEventListener("click", () => {
    if(confirm("Deseja voltar ao início? O seu progresso atual será perdido.")) location.reload(); 
});

// --- LEITURA DO PDF (OCR) ---
async function loadPage(pageNum) {
    if(isPredefinedMode) return; 

    isTypingEnabled = false;
    loaderScreen.classList.remove("hidden");
    pageContainer.classList.add("hidden");
    pageCard.classList.remove("exiting", "exiting-reverse", "visible");
    
    nextPageOverlay.classList.remove("opacity-100", "pointer-events-auto");
    nextPageOverlay.classList.add("opacity-0", "pointer-events-none");
    statsCard.classList.remove("scale-100");
    statsCard.classList.add("scale-90");

    document.getElementById("loading-page-num").innerText = pageNum;
    document.getElementById("page-display").innerText = `${pageNum} / ${totalPages}`;
    progressBar.style.width = "0%";
    document.getElementById("wpm-display").innerText = "0";
    document.getElementById("acc-display").innerText = "100";

    try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport: viewport }).promise;

        const worker = await Tesseract.createWorker("por");
        const { data } = await worker.recognize(canvas);
        await worker.terminate();

        if (data.text.trim().length < 5) {
            alert("Página vazia ou ilegível. Tentando próxima...");
            if (currentPage < totalPages) {
                currentPage++;
                loadPage(currentPage);
                return;
            }
        }
        prepareGame(data.text);
    } catch (err) {
        alert("Erro no processo: " + err.message);
        location.reload();
    }
}

function cleanText(text) {
    let t = text.replace(/\|/g, "I").replace(/([a-z])-\n([a-z])/g, "$1$2");
    const keepAccents = document.getElementById("chk-accents").checked;
    const keepPunctuation = document.getElementById("chk-punctuation").checked;
    const keepNumbers = document.getElementById("chk-numbers").checked;

    if (!keepAccents) t = t.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (!keepPunctuation) t = t.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()"'\[\]“”‘’]/g, "");
    if (!keepNumbers) t = t.replace(/[0-9]/g, "");

    return t.replace(/[^\S\r\n]+/g, ' ').trim();
}

// --- RENDERIZAÇÃO ---
function prepareGame(rawText) {
    originalText = cleanText(rawText);
    currentIndex = 0;
    errors = 0;
    startTime = null;
    accentPending = false; 
    typingArea.innerHTML = "";
    const lines = originalText.split("\n");

    lines.forEach((line) => {
        line = line.trim();
        if (line === "") return;
        const div = document.createElement("div");
        div.className = "line-block";

        line.split("").forEach((char) => {
            const span = document.createElement("span");
            span.innerText = char;
            span.className = "pending transition-colors duration-200";
            div.appendChild(span);
        });

        const enterSpan = document.createElement("span");
        enterSpan.innerText = "↵";
        enterSpan.className = "pending text-slate-500 opacity-40 ml-1 font-mono";
        enterSpan.dataset.enter = "true";
        div.appendChild(enterSpan);
        
        typingArea.appendChild(div);
    });

    loaderScreen.classList.add("hidden");
    pageContainer.classList.remove("hidden");
    document.getElementById("stats-container").classList.remove("opacity-0");

    setTimeout(() => {
        pageCard.classList.add("visible");
        hiddenMobileInput.focus(); 
    }, 50);
    
    updateCursor();
    isTypingEnabled = true;
}

// --- NÚCLEO DA LÓGICA DE DIGITAÇÃO ---
function processGameInput(keyString) {
    if (!isTypingEnabled) return;
    
    if (!startTime) startTime = new Date();

    const spans = document.querySelectorAll("#typing-area span");
    if (currentIndex >= spans.length) return; 

    if (keyString === 'Backspace') {
        if (currentIndex > 0) {
            spans[currentIndex].className = "pending transition-colors duration-200";
            currentIndex--;
            spans[currentIndex].className = "pending transition-colors duration-200";
            accentPending = false; 
            updateCursor();
            updateStats();
        }
        return;
    }

    const targetSpan = spans[currentIndex];
    const isEnterRequired = targetSpan.dataset.enter === "true";
    let isMatch = false;
    
    if (isEnterRequired) {
        isMatch = (keyString === 'Enter');
    } else {
        const targetChar = targetSpan.innerText;
        const requireStrictCase = document.getElementById("chk-case") ? document.getElementById("chk-case").checked : false;
        if (requireStrictCase) {
            isMatch = (keyString === targetChar);
        } else {
            isMatch = (keyString.toLowerCase() === targetChar.toLowerCase());
        }
    }

    if (isMatch) {
        spans[currentIndex].className = "correct";
        accentPending = false;
    } else {
        spans[currentIndex].className = "incorrect";
        errors++;
        accentPending = false; 
    }

    currentIndex++;
    updateCursor();
    updateStats();

    if(spans.length > 0){
        const progress = (currentIndex / spans.length) * 100;
        progressBar.style.width = `${progress}%`;
    }

    if (currentIndex >= spans.length) finishPage();
}

hiddenMobileInput.addEventListener("keydown", (e) => {
    if (!isTypingEnabled) return;

    if (e.key === 'Dead' || e.key === '´' || e.key === '`' || e.key === '~' || e.key === '^') {
        accentPending = true;
        updateVirtualKeyboardHighlight();
        return;
    }

    if (e.key === 'Shift') return; 

    if (e.key === 'Backspace') {
        processGameInput('Backspace');
    } else if (e.key === 'Enter') {
        e.preventDefault(); 
        processGameInput('Enter');
    }
});

hiddenMobileInput.addEventListener("input", (e) => {
    if (!isTypingEnabled) return;
    
    if (e.inputType === 'insertLineBreak' || e.inputType === 'deleteContentBackward') {
        hiddenMobileInput.value = "";
        return;
    }

    const val = hiddenMobileInput.value;
    if (val) {
        for (let i = 0; i < val.length; i++) {
            if (val[i] !== '\n') processGameInput(val[i]);
        }
    }
    hiddenMobileInput.value = ""; 
});

window.addEventListener("keydown", (e) => {
    if (isTypingEnabled && document.activeElement !== hiddenMobileInput) {
        hiddenMobileInput.focus();
    }
});

function updateCursor() {
    const spans = document.querySelectorAll("#typing-area span");
    document.querySelectorAll(".cursor").forEach((c) => c.classList.remove("cursor"));
    
    if (spans[currentIndex]) {
        spans[currentIndex].classList.add("cursor");
        spans[currentIndex].scrollIntoView({ behavior: "smooth", block: "center" });
    }
    updateVirtualKeyboardHighlight();
}

function updateStats() {
    const time = (new Date() - startTime) / 1000 / 60;
    if (time > 0 && currentIndex > 0) {
        const wpm = Math.round(currentIndex / 5 / time);
        const acc = Math.max(0, Math.round(((currentIndex - errors) / currentIndex) * 100));
        
        document.getElementById("wpm-display").innerText = wpm;
        document.getElementById("acc-display").innerText = acc;
        document.getElementById("final-wpm").innerText = wpm;
        document.getElementById("final-acc").innerText = acc;
    }
}

// --- FINALIZAÇÃO E TRANSIÇÕES ---
function finishPage() {
    isTypingEnabled = false;
    hiddenMobileInput.blur(); 
    nextPageOverlay.classList.remove("opacity-0", "pointer-events-none");
    nextPageOverlay.classList.add("opacity-100", "pointer-events-auto");
    setTimeout(() => statsCard.classList.remove("scale-90"), 100);
    setTimeout(() => statsCard.classList.add("scale-100"), 100);
}

function advanceToNextPage() {
    if(isPredefinedMode) {
        location.reload(); 
        return;
    }
    if (currentPage < totalPages) {
        isTypingEnabled = false;
        pageCard.classList.remove("visible");
        pageCard.classList.add("exiting");
        setTimeout(() => {
            currentPage++;
            loadPage(currentPage);
        }, 500);
    } else {
        alert("Chegou à última página do livro!");
    }
}

function returnToPreviousPage() {
    if(isPredefinedMode) return;
    if (currentPage > 1) {
        isTypingEnabled = false;
        pageCard.classList.remove("visible");
        pageCard.classList.add("exiting-reverse");
        setTimeout(() => {
            currentPage--;
            loadPage(currentPage);
        }, 500);
    } else {
        alert("Você já está na primeira página deste documento!");
    }
}

document.getElementById("btn-next-page").addEventListener("click", advanceToNextPage);

document.getElementById("btn-skip-current-page").addEventListener("click", () => {
    if (currentIndex > 50) {
        if(confirm("Deseja pular esta página sem terminar? O progresso desta folha será perdido.")) advanceToNextPage();
    } else {
        advanceToNextPage();
    }
});

document.getElementById("btn-prev-page").addEventListener("click", () => {
    if (currentIndex > 50) {
        if(confirm("Deseja voltar para a página anterior? O progresso desta folha atual será perdido.")) returnToPreviousPage();
    } else {
        returnToPreviousPage();
    }
});