(function() {
    'use strict';

    // Modern JavaScript utilities (ES2015+ standards)
    const NumberUtils = {
        parseInt: Number.parseInt,
        parseFloat: Number.parseFloat,
        isNaN: Number.isNaN,
        isFinite: Number.isFinite,
        isInteger: Number.isInteger
    };

    // Configuration
    const ARABIC_LETTERS = ['أ','ب','ت','ث','ج','ح','خ','د','ذ','ر','ز','س','ش','ص','ض','ط','ظ','ع','غ','ف','ق','ك','ل','م','ن','ه','و','ي'];
    const LETTERS_COUNT = 4; // Same as images app

    // DOM elements
    const leftGrid = document.getElementById('leftGrid');
    const rightGrid = document.getElementById('rightGrid');
    const svgLayer = document.getElementById('svgLayer');
    const modeIndicator = document.getElementById('modeIndicator');

    // State
    let leftLetters = [];
    let rightLetters = [];
    let connections = [];
    let deleteMode = false;
    let allowStart = true;
    let activeStart = null;
    let tempPath = null;
    let revealed = false;

    // Prevent default touch behaviors that cause scrolling
    document.addEventListener('touchmove', function(e) {
        if (e.touches.length > 1 || e.target.tagName === 'BUTTON') {
            e.preventDefault();
        }
    }, { passive: false });

    document.addEventListener('touchstart', function(e) {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });

    // Utility functions
    function randInt(max) {
        return Math.floor(Math.random() * max);
    }

    function pickRandomLetters(n) {
        const copy = ARABIC_LETTERS.slice();
        const out = [];
        for (let i = 0; i < n; i++) {
            const idx = randInt(copy.length);
            out.push(copy.splice(idx, 1)[0]);
        }
        return out;
    }

    function updateModeIndicator() {
        if (deleteMode) {
            modeIndicator.className = 'mode-indicator delete';
            modeIndicator.innerHTML = '<div class="mode-dot delete"></div><span>وضع الحذف</span>';
        } else {
            modeIndicator.className = 'mode-indicator normal';
            modeIndicator.innerHTML = '<div class="mode-dot normal"></div><span>وضع الربط</span>';
        }
    }

    function buildRound() {
        clearAll();

        // Get random letters
        leftLetters = pickRandomLetters(LETTERS_COUNT);

        // Create matching letters (shuffled version of left letters)
        rightLetters = [...leftLetters];
        for (let i = rightLetters.length - 1; i > 0; i--) {
            const j = randInt(i + 1);
            [rightLetters[i], rightLetters[j]] = [rightLetters[j], rightLetters[i]];
        }

        renderGrids();

        // Update lines after layout
        setTimeout(updateAllLinesPositions, 100);
    }

    function renderGrids() {
        // Clear grids
        leftGrid.innerHTML = '';
        rightGrid.innerHTML = '';
        svgLayer.innerHTML = '';

        // Create left letter cells
        leftLetters.forEach((letter, i) => {
            const div = document.createElement('div');
            div.className = 'cell no-select';
            div.dataset.index = i;
            div.dataset.letter = letter;
            div.dataset.side = 'left';

            const span = document.createElement('div');
            span.className = 'letter';
            span.textContent = letter;
            div.appendChild(span);

            leftGrid.appendChild(div);

            // Event listeners
            div.addEventListener('pointerdown', onLeftPointerDown, { passive: false });
            div.addEventListener('touchstart', (e) => {
                e.preventDefault();
                onLeftPointerDown(e);
            }, { passive: false });
        });

        // Create right letter cells
        rightLetters.forEach((letter, i) => {
            const div = document.createElement('div');
            div.className = 'cell no-select';
            div.dataset.index = i;
            div.dataset.letter = letter;
            div.dataset.side = 'right';

            const span = document.createElement('div');
            span.className = 'letter';
            span.textContent = letter;
            div.appendChild(span);

            rightGrid.appendChild(div);

            // Event listeners
            div.addEventListener('pointerup', onRightPointerUp, { passive: false });
            div.addEventListener('click', onRightClick, { passive: false });
            div.addEventListener('touchstart', (e) => {
                e.preventDefault();
                onRightPointerUp(e);
            }, { passive: false });
            div.addEventListener('touchend', (e) => e.preventDefault(), { passive: false });
        });

        updateModeIndicator();
    }

    // Event handlers
    function onLeftPointerDown(e) {
        if (!allowStart || deleteMode) return;

        e.preventDefault();
        const el = e.currentTarget;
        const idx = NumberUtils.parseInt(el.dataset.index, 10);

        clearTempStyles();
        el.classList.add('start');
        activeStart = { index: idx, el, side: 'left' };

        // Create temporary line
        tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const p = getCenterRelativeTo(svgLayer, el);
        tempPath.setAttribute('d', generateCurvePath(p.x, p.y, p.x, p.y));
        tempPath.setAttribute('stroke', '#3498db'); // Blue color for all lines
        tempPath.setAttribute('stroke-width', '4');
        tempPath.setAttribute('fill', 'none');
        tempPath.setAttribute('stroke-linecap', 'round');
        tempPath.setAttribute('opacity', '0.8');
        svgLayer.appendChild(tempPath);

        // Add global listeners for dragging
        window.addEventListener('pointermove', onPointerMove, { passive: false });
        window.addEventListener('pointerup', onGlobalPointerUp, { passive: false });
        window.addEventListener('touchend', onGlobalPointerUp, { passive: false });
        window.addEventListener('touchmove', onTouchMove, { passive: false });
    }

    function onPointerMove(e) {
        if (!activeStart || !tempPath) return;

        const startEl = activeStart.el;
        const p1 = getCenterRelativeTo(svgLayer, startEl);
        const svgRect = svgLayer.getBoundingClientRect();
        const x2 = e.clientX - svgRect.left;
        const y2 = e.clientY - svgRect.top;

        tempPath.setAttribute('d', generateCurvePath(p1.x, p1.y, x2, y2));
    }

    function onTouchMove(e) {
        if (!activeStart || !tempPath || e.touches.length !== 1) return;

        const touch = e.touches[0];
        const startEl = activeStart.el;
        const p1 = getCenterRelativeTo(svgLayer, startEl);
        const svgRect = svgLayer.getBoundingClientRect();
        const x2 = touch.clientX - svgRect.left;
        const y2 = touch.clientY - svgRect.top;

        tempPath.setAttribute('d', generateCurvePath(p1.x, p1.y, x2, y2));
        e.preventDefault();
    }

    function onGlobalPointerUp(e) {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onGlobalPointerUp);
        window.removeEventListener('touchend', onGlobalPointerUp);
        window.removeEventListener('touchmove', onTouchMove);

        // Find drop target
        let clientX, clientY;
        if (e.type.includes('touch')) {
            if (e.changedTouches.length === 0) return;
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const elAt = document.elementFromPoint(clientX, clientY);
        let target = elAt;

        while (target && target !== document.body) {
            if (target.classList && target.classList.contains('cell') && target !== activeStart.el) break;
            target = target.parentElement;
        }

        if (activeStart && target && target.classList && target.classList.contains('cell')) {
            const targetSide = target.dataset.side;
            const startSide = activeStart.side;

            // Only allow connections between opposite columns
            if (targetSide !== startSide) {
                const ri = NumberUtils.parseInt(target.dataset.index, 10);
                addConnection(activeStart.index, ri);
            }
        }

        cleanupTemp();
        e.preventDefault();
    }

    function onRightPointerUp(e) {
        e.preventDefault();
        const el = e.currentTarget;
        const idx = NumberUtils.parseInt(el.dataset.index, 10);

        if (!activeStart) return;

        addConnection(activeStart.index, idx);
        cleanupTemp();
    }

    function onRightClick(e) {
        e.preventDefault();
        const el = e.currentTarget;
        const idx = NumberUtils.parseInt(el.dataset.index, 10);

        if (!activeStart) return;

        addConnection(activeStart.index, idx);
        cleanupTemp();
    }

    // Connection functions
    function addConnection(leftIndex, rightIndex) {
        // Remove existing connections for same left or right
        const existingLeft = connections.find(c => c.leftIndex === leftIndex);
        if (existingLeft) removeConnection(existingLeft);

        const existingRight = connections.find(c => c.rightIndex === rightIndex);
        if (existingRight) removeConnection(existingRight);

        // Get elements
        const leftEl = leftGrid.querySelector(`[data-index='${leftIndex}']`);
        const rightEl = rightGrid.querySelector(`[data-index='${rightIndex}']`);

        if (!leftEl || !rightEl) return;

        // Create line (always blue)
        const line = createSvgLineBetween(leftEl, rightEl);
        connections.push({ leftIndex, rightIndex, line });

        // Mark as disabled
        leftEl.classList.add('disabled');
        rightEl.classList.add('disabled');
    }

function removeConnection(conn) {
    // Check if the line element still exists before trying to remove it
    if (conn.line && conn.line.parentNode === svgLayer) {
        svgLayer.removeChild(conn.line);
    }

    const leftEl = leftGrid.querySelector(`[data-index='${conn.leftIndex}']`);
    const rightEl = rightGrid.querySelector(`[data-index='${conn.rightIndex}']`);

    if (leftEl) leftEl.classList.remove('disabled');
    if (rightEl) rightEl.classList.remove('disabled');

    connections = connections.filter(c => c !== conn);
}

    function createSvgLineBetween(leftEl, rightEl) {
        const ptL = getCenterRelativeTo(svgLayer, leftEl);
        const ptR = getCenterRelativeTo(svgLayer, rightEl);

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const d = generateCurvePath(ptL.x, ptL.y, ptR.x, ptR.y);

        // Always use blue color for all connections
        path.setAttribute('d', d);
        path.setAttribute('stroke', '#3498db'); // Blue for all connections
        path.setAttribute('stroke-width', '4');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke-linecap', 'round');
        path.style.cursor = 'pointer';

        svgLayer.appendChild(path);

        // Click to delete when in delete mode
        path.addEventListener('click', function(ev) {
            ev.stopPropagation();
            if (!deleteMode) return;

            const conn = connections.find(c => c.line === path);
            if (conn) removeConnection(conn);
        });

        return path;
    }

    function generateCurvePath(x1, y1, x2, y2) {
        const dx = Math.abs(x2 - x1);
        const cx1 = x1 + (x2 > x1 ? dx * 0.25 : -dx * 0.25);
        const cx2 = x2 - (x2 > x1 ? dx * 0.25 : -dx * 0.25);
        return `M ${x1} ${y1} C ${cx1} ${y1} ${cx2} ${y2} ${x2} ${y2}`;
    }

    function getCenterRelativeTo(svgEl, node) {
        const svgRect = svgEl.getBoundingClientRect();
        const rect = node.getBoundingClientRect();

        // Using Number to ensure numeric operations
        const left = Number(rect.left);
        const top = Number(rect.top);
        const width = Number(rect.width);
        const height = Number(rect.height);
        const svgLeft = Number(svgRect.left);
        const svgTop = Number(svgRect.top);

        return {
            x: left + width / 2 - svgLeft,
            y: top + height / 2 - svgTop
        };
    }

    function updateAllLinesPositions() {
        connections.forEach(c => {
            const leftEl = leftGrid.querySelector(`[data-index='${c.leftIndex}']`);
            const rightEl = rightGrid.querySelector(`[data-index='${c.rightIndex}']`);
            if (!leftEl || !rightEl) return;

            const ptL = getCenterRelativeTo(svgLayer, leftEl);
            const ptR = getCenterRelativeTo(svgLayer, rightEl);
            c.line.setAttribute('d', generateCurvePath(ptL.x, ptL.y, ptR.x, ptR.y));
        });
    }

    function clearAll() {
        // Exit delete mode
        if (deleteMode) {
            exitDeleteMode();
        }

        // Remove all lines
        connections.forEach(c => {
            try {
                svgLayer.removeChild(c.line);
            } catch (e) {
                // Silent fail if element already removed
            }
        });
        connections = [];

        // Remove styles
        document.querySelectorAll('.cell.disabled, .cell.start').forEach(n => {
            n.classList.remove('disabled', 'start');
        });

        cleanupTemp();

        // Reset reveal state
        revealed = false;
        document.getElementById('revealBtn').textContent = 'إظهار';
    }

     function cleanupTemp() {
        if (tempPath && svgLayer.contains(tempPath)) {
            svgLayer.removeChild(tempPath);
        }
        tempPath = null;

        clearTempStyles();
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onGlobalPointerUp);
        window.removeEventListener('touchend', onGlobalPointerUp);
        window.removeEventListener('touchmove', onTouchMove);
        activeStart = null;
    }

    function clearTempStyles() {
        document.querySelectorAll('.cell.start').forEach(n => n.classList.remove('start'));
    }

    // Reveal answers
    function toggleReveal() {
        revealed = !revealed;
        const btn = document.getElementById('revealBtn');

        if (revealed) {
            clearAll();

            // Show all correct connections
            leftLetters.forEach((letter, li) => {
                const ri = rightLetters.findIndex(it => it === letter);
                if (ri >= 0) {
                    addConnection(li, ri);
                }
            });

            btn.textContent = 'إخفاء';
        } else {
            clearAll();
            btn.textContent = 'إظهار';
        }
    }

    // Delete mode
    const deleteBtn = document.getElementById('deleteBtn');
    function enterDeleteMode() {
        deleteMode = true;
        allowStart = false;
        deleteBtn.textContent = 'إيقاف';
        deleteBtn.classList.add('warning');
        document.querySelector('.overlay').style.pointerEvents = 'auto';
        updateModeIndicator();
    }

    function exitDeleteMode() {
        deleteMode = false;
        allowStart = true;
        deleteBtn.textContent = 'حذف خط';
        deleteBtn.classList.remove('warning');
        document.querySelector('.overlay').style.pointerEvents = 'none';
        updateModeIndicator();
    }

    // Instructions modal
    function showInstructions() {
        document.getElementById('instructions').style.display = 'block';
        document.getElementById('overlayBg').style.display = 'block';
    }

    function hideInstructions() {
        document.getElementById('instructions').style.display = 'none';
        document.getElementById('overlayBg').style.display = 'none';
    }

    // Initialize controls with passive false
    document.getElementById('newBtn').addEventListener('click', (e) => {
        e.preventDefault();
        buildRound();
    }, { passive: false });

    document.getElementById('clearBtn').addEventListener('click', (e) => {
        e.preventDefault();
        clearAll();
    }, { passive: false });

    document.getElementById('revealBtn').addEventListener('click', (e) => {
        e.preventDefault();
        toggleReveal();
    }, { passive: false });

    deleteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (deleteMode) {
            exitDeleteMode();
        } else {
            enterDeleteMode();
        }
    }, { passive: false });

    document.getElementById('helpBtn').addEventListener('click', (e) => {
        e.preventDefault();
        showInstructions();
    }, { passive: false });

    document.getElementById('closeInstructions').addEventListener('click', (e) => {
        e.preventDefault();
        hideInstructions();
    }, { passive: false });

    document.getElementById('overlayBg').addEventListener('click', (e) => {
        e.preventDefault();
        hideInstructions();
    }, { passive: false });

    // Handle resize
    let resizeTimeout = null;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(updateAllLinesPositions, 100);
    }, { passive: true });

    // Adjust overlay for current screen size
    function adjustOverlayPosition() {
        const overlay = document.querySelector('.overlay');
        const header = document.querySelector('.header');
        const footer = document.querySelector('.footer');
        const main = document.querySelector('.main');

        const headerHeight = header.offsetHeight;
        const footerHeight = footer.offsetHeight;
        const mainPadding = NumberUtils.parseInt(window.getComputedStyle(main).paddingTop, 10);

        overlay.style.top = `${headerHeight + mainPadding}px`;
        overlay.style.bottom = `${footerHeight + mainPadding}px`;
        overlay.style.left = `${mainPadding}px`;
        overlay.style.right = `${mainPadding}px`;
    }

    // Initial game
    buildRound();
    document.querySelector('.overlay').style.pointerEvents = 'none';
    adjustOverlayPosition();

    // Force recalculation on load and resize
    window.addEventListener('load', () => {
        adjustOverlayPosition();
        setTimeout(updateAllLinesPositions, 300);
    });

    window.addEventListener('resize', () => {
        adjustOverlayPosition();
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(updateAllLinesPositions, 100);
    }, { passive: true });

    // Show instructions on first load
    setTimeout(showInstructions, 500);
})();