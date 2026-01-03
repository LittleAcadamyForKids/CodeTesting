# Arabic Letters Matching Game

لعبة مطابقة الحروف العربية

## Description
An interactive educational game where players match Arabic letters between two columns. The game features touch-friendly controls, smooth line drawing, and a clean Arabic RTL interface.

## Features
- **Touch-Friendly**: Works perfectly on mobile, tablet, and desktop devices
- **Bidirectional Drawing**: Draw connections from left to right or right to left
- **Multiple Modes**:
  - Connect Mode: Draw lines between matching letters
  - Delete Mode: Remove lines by clicking on them
- **Game Controls**:
  - "جديد" (New): Generate new random letters
  - "مسح" (Clear): Remove all connections
  - "إظهار" (Reveal): Show all correct connections
  - "حذف خط" (Delete Line): Toggle delete mode
  - "مساعدة" (Help): Show instructions
- **Responsive Design**: Adapts to different screen sizes
- **No-Scroll Interface**: Prevents unwanted scrolling on mobile devices

## Technologies Used
- **HTML5**: Semantic structure with RTL Arabic layout
- **CSS3**: Flexbox for layout, responsive design, gradient backgrounds
- **JavaScript**:
  - SVG for line drawing
  - Pointer Events API for touch/mouse interaction
  - Event-driven architecture

## How to Run
1. Clone or download the repository
2. Ensure all files are in the same directory:
   - `index.html`
   - `style.css`
   - `script.js`
3. Open `index.html` in a modern web browser
4. No server required - works locally

## Game Rules
1. Connect each letter in the left column with its matching letter in the right column
2. All connections are drawn with blue curved lines
3. Each letter can only have one connection
4. In delete mode, click on any line to remove it

## Browser Compatibility
- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

## Responsive Breakpoints
- **Desktop**: Full layout with all controls visible
- **Tablet (≤768px)**: Title hidden, simplified controls
- **Mobile (≤576px)**: Single-row controls, optimized spacing
- **Landscape/Short Screens**: Compact layout, hidden footer

## License
Free for educational use

## Author
Arabic Educational Games Project
Detailed Explanation of the Drawing Mechanism
1. SVG (Scaled Vector Graphics)

The game uses SVG for drawing lines because:

    Vector-based: Lines remain crisp at any resolution

    DOM-based: Can be manipulated with JavaScript like HTML elements

    Lightweight: Efficient for simple shapes like lines

2. SVG Structure in HTML
html

<div class="overlay">
    <svg id="svgLayer"></svg>
</div>

    overlay: Positioned absolutely over the game area

    svgLayer: The SVG container where all lines are drawn

3. Line Drawing Process
A. Path Creation (SVG Path Element)
javascript

function createSvgLineBetween(leftEl, rightEl) {
    const ptL = getCenterRelativeTo(svgLayer, leftEl);
    const ptR = getCenterRelativeTo(svgLayer, rightEl);

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const d = generateCurvePath(ptL.x, ptL.y, ptR.x, ptR.y);

    path.setAttribute('d', d);  // Path data
    path.setAttribute('stroke', '#3498db');  // Blue color
    path.setAttribute('stroke-width', '4');  // Line thickness
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-linecap', 'round');  // Rounded ends

    svgLayer.appendChild(path);
    return path;
}

B. Bezier Curve Path Generation
javascript

function generateCurvePath(x1, y1, x2, y2) {
    const dx = Math.abs(x2 - x1);
    const cx1 = x1 + (x2 > x1 ? dx * 0.25 : -dx * 0.25);
    const cx2 = x2 - (x2 > x1 ? dx * 0.25 : -dx * 0.25);
    return `M ${x1} ${y1} C ${cx1} ${y1} ${cx2} ${y2} ${x2} ${y2}`;
}

    M: Move to starting point (x1, y1)

    C: Cubic Bezier curve with:

        Control point 1: (cx1, y1) - 25% of the horizontal distance from start

        Control point 2: (cx2, y2) - 25% of the horizontal distance from end

        End point: (x2, y2)

This creates a smooth, curved line instead of a straight one.
C. Coordinate Calculation
javascript

function getCenterRelativeTo(svgEl, node) {
    const svgRect = svgEl.getBoundingClientRect();
    const rect = node.getBoundingClientRect();
    return {
        x: rect.left + rect.width/2 - svgRect.left,
        y: rect.top + rect.height/2 - svgRect.top
    };
}

Calculates the center point of a cell relative to the SVG container's coordinate system.
4. Interactive Drawing Flow
A. Starting a Connection

    User touches/clicks on a letter cell

    Event handler (onCellPointerDown) creates:

        Visual feedback (blue border on cell)

        Temporary SVG path that follows the pointer

        Global event listeners for movement

B. Dragging the Line

    As pointer moves (onPointerMove/onTouchMove):

        Continuously update the temporary path's endpoint

        Formula: tempPath.setAttribute('d', generateCurvePath(startX, startY, currentX, currentY))

C. Completing a Connection

    User releases pointer over a target cell

    System calculates final connection:

        Removes temporary path

        Creates permanent SVG path between the two cells

        Stores connection in connections array

        Marks both cells as disabled

5. Event Handling System
Multiple Input Methods
javascript

// For mouse and modern touch devices
div.addEventListener('pointerdown', onCellPointerDown, { passive: false });
div.addEventListener('pointerup', onCellPointerUp, { passive: false });

// For legacy touch support
div.addEventListener('touchstart', (e) => {
    e.preventDefault();
    onCellPointerDown(e);
}, { passive: false });
div.addEventListener('touchend', (e) => {
    e.preventDefault();
    onCellPointerUp(e);
}, { passive: false });

Preventing Default Behaviors
javascript

document.addEventListener('touchmove', function(e) {
    if (e.touches.length > 1 || e.target.tagName === 'BUTTON') {
        e.preventDefault();  // Prevent scrolling/zooming
    }
}, { passive: false });

6. State Management
Connection Storage
javascript

let connections = [];  // Array of connection objects

// Each connection contains:
{
    leftIndex: 0,      // Index in left column
    rightIndex: 2,     // Index in right column
    line: svgPath      // Reference to the SVG path element
}

Temporary Drawing State
javascript

let activeStart = null;  // Currently active starting cell
let tempPath = null;     // Temporary SVG path during dragging
let deleteMode = false;  // Whether in delete mode

7. Responsive Line Updates
Window Resize Handling
javascript

window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(updateAllLinesPositions, 100);
});

function updateAllLinesPositions() {
    connections.forEach(c => {
        // Recalculate and update all line positions
        const ptL = getCenterRelativeTo(svgLayer, leftEl);
        const ptR = getCenterRelativeTo(svgLayer, rightEl);
        c.line.setAttribute('d', generateCurvePath(ptL.x, ptL.y, ptR.x, ptR.y));
    });
}

8. Key Technical Features

    Bidirectional Connections: Can start from either left or right column

    One-to-One Mapping: Each letter can only connect to one match

    Smooth Animations: CSS transitions for visual feedback

    Memory Management: Proper cleanup of event listeners and DOM elements

    Cross-Platform: Works on touch, mouse, and pen input devices

    Accessibility: RTL support for Arabic, clear visual feedback

9. CSS Overlay System
css

.overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;  /* Lines don't block clicks on cells */
    z-index: 5;
}

    Lines are drawn above cells but don't interfere with clicks

    In delete mode: pointer-events: auto allows clicking on lines

10. Performance Optimizations

    Debounced Resize: Prevents excessive recalculations during window resize

    Event Delegation: Uses direct event handlers instead of delegation for simplicity

    DOM Reuse: Reuses SVG path elements instead of recreating

    Minimal Repaints: Only updates necessary DOM elements

This drawing system creates a smooth, responsive experience that works across all modern devices while maintaining clean, maintainable code.