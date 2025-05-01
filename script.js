document.addEventListener('DOMContentLoaded', () => {
    const monthYearElement = document.getElementById('month-year');
    const calendarBody = document.getElementById('calendar-body');
    const prevMonthButton = document.getElementById('prev-month');
    const nextMonthButton = document.getElementById('next-month');
    const attilaCountElement = document.getElementById('attila-count');
    const johannaCountElement = document.getElementById('johanna-count');
    const modal = document.getElementById('color-picker-modal');
    const modalDateDisplay = document.getElementById('modal-date-display');
    const closeModalButton = document.getElementById('close-modal');
    const colorButtons = modal.querySelectorAll('.color-btn[data-color]');
    const calendarContainer = document.querySelector('.calendar-container'); // For swipe

    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    let selectedDateElement = null; // To keep track of which TD was clicked
    let touchStartX = 0; // For swipe detection
    let touchEndX = 0; // For swipe detection

    // --- Data Storage ---
    // Use localStorage to persist colors
    // Format: { "YYYY-MM": { "DD": "colorName", ... }, ... }
    let calendarColors = JSON.parse(localStorage.getItem('calendarColors')) || {};

    function saveData() {
        localStorage.setItem('calendarColors', JSON.stringify(calendarColors));
    }

    function getMonthKey(year, month) {
        // MM is 0-indexed month + 1, padded with 0 if needed
        return `${year}-${String(month + 1).padStart(2, '0')}`;
    }

    function getDayKey(day) {
        return String(day).padStart(2, '0');
    }

    // --- Calendar Rendering ---
    function renderCalendar(year, month) {
        calendarBody.innerHTML = ''; // Clear previous month

        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Sun, 1=Mon,...
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
        const todayDate = today.getDate();

        // Update header
        const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });
        monthYearElement.textContent = `${monthName} ${year}`;

        let date = 1;
        for (let i = 0; i < 6; i++) { // Max 6 rows
            const row = document.createElement('tr');
            let cellsAdded = 0;

            for (let j = 0; j < 7; j++) { // 7 days a week
                const cell = document.createElement('td');
                const dayKey = getDayKey(date);
                const monthKey = getMonthKey(year, month);

                if (i === 0 && j < firstDayOfMonth) {
                    // Empty cells before the 1st day
                    cell.classList.add('empty');
                } else if (date > daysInMonth) {
                    // Empty cells after the last day
                    cell.classList.add('empty');
                } else {
                    // Date cells
                    const dateNumberSpan = document.createElement('span');
                    dateNumberSpan.classList.add('date-number');
                    dateNumberSpan.textContent = date;
                    cell.appendChild(dateNumberSpan);

                    cell.dataset.date = `${year}-${String(month + 1).padStart(2, '0')}-${dayKey}`; // YYYY-MM-DD

                    // Highlight today
                    if (isCurrentMonth && date === todayDate) {
                        cell.classList.add('today');
                    }

                    // Apply saved color
                    const savedColor = calendarColors[monthKey]?.[dayKey];
                    if (savedColor) {
                        cell.classList.add(`color-${savedColor}`);
                    }

                    // Add click listener
                    cell.addEventListener('click', handleDateClick);

                    date++;
                    cellsAdded++;
                }
                row.appendChild(cell);
            }

            if (cellsAdded > 0 || date <= daysInMonth) { // Only add row if it has dates or is needed for future dates
                 calendarBody.appendChild(row);
            } else {
                break; // Stop adding rows if no more dates and no cells added
            }

             if (date > daysInMonth && i < 5) { // Optimization: break if dates are finished before the 6th row
                 break;
            }
        }
        updateCounters(year, month);
    }

    // --- Event Handlers ---
    function handleDateClick(event) {
        const targetCell = event.currentTarget;
        if (targetCell.classList.contains('empty')) return; // Ignore clicks on empty cells

        selectedDateElement = targetCell;
        const dateStr = selectedDateElement.dataset.date; // YYYY-MM-DD
        const [year, month, day] = dateStr.split('-').map(Number);
        modalDateDisplay.textContent = `${new Date(year, month - 1, day).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
        modal.style.display = 'flex'; // Show modal (use flex for centering)
    }

    function handleColorSelection(event) {
        if (!selectedDateElement) return;

        const color = event.currentTarget.dataset.color; // 'attila', 'johanna', or 'blank'
        const dateStr = selectedDateElement.dataset.date; // YYYY-MM-DD
        const [year, monthNum, dayNum] = dateStr.split('-'); // Note: monthNum is 1-based string here
        const monthIndex = parseInt(monthNum, 10) - 1; // Convert to 0-based index for logic
        const monthKey = getMonthKey(year, monthIndex);
        const dayKey = dayNum; // Already padded 'DD' string

        // Update internal data store
        if (!calendarColors[monthKey]) {
            calendarColors[monthKey] = {};
        }

        // Remove previous color class
        selectedDateElement.classList.remove('color-attila', 'color-johanna');

        if (color === 'blank') {
            delete calendarColors[monthKey][dayKey]; // Remove color from data
            // Check if month object is now empty
             if (Object.keys(calendarColors[monthKey]).length === 0) {
                delete calendarColors[monthKey];
            }
        } else {
            calendarColors[monthKey][dayKey] = color;
            selectedDateElement.classList.add(`color-${color}`); // Apply new color class
        }

        saveData(); // Save changes to localStorage
        updateCounters(parseInt(year, 10), monthIndex); // Update counters for the current view
        closeModal();
    }

    function closeModal() {
        modal.style.display = 'none';
        selectedDateElement = null;
    }

    function updateCounters(year, month) {
        const monthKey = getMonthKey(year, month);
        const monthData = calendarColors[monthKey] || {};
        let attilaCount = 0;
        let johannaCount = 0;

        for (const day in monthData) {
            if (monthData[day] === 'attila') {
                attilaCount++;
            } else if (monthData[day] === 'johanna') {
                johannaCount++;
            }
        }

        attilaCountElement.textContent = attilaCount;
        johannaCountElement.textContent = johannaCount;
    }

    // --- Navigation ---
    function changeMonth(offset) {
        currentMonth += offset;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        } else if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar(currentYear, currentMonth);
    }

    // --- Swipe Handling ---
    function handleTouchStart(event) {
        // Use changedTouches for better compatibility
        touchStartX = event.changedTouches[0].screenX;
    }

    function handleTouchEnd(event) {
        touchEndX = event.changedTouches[0].screenX;
        handleSwipeGesture();
    }

    function handleSwipeGesture() {
        const difference = touchStartX - touchEndX;
        const threshold = 50; // Min pixels to swipe

        if (Math.abs(difference) > threshold) {
            if (difference > 0) {
                // Swiped Left (Next Month)
                changeMonth(1);
            } else {
                // Swiped Right (Previous Month)
                changeMonth(-1);
            }
        }
        // Reset coordinates
        touchStartX = 0;
        touchEndX = 0;
    }

    // --- Initial Setup ---
    prevMonthButton.addEventListener('click', () => changeMonth(-1));
    nextMonthButton.addEventListener('click', () => changeMonth(1));
    closeModalButton.addEventListener('click', closeModal);
    colorButtons.forEach(button => button.addEventListener('click', handleColorSelection));

    // Add swipe listeners to the container
    calendarContainer.addEventListener('touchstart', handleTouchStart, false);
    calendarContainer.addEventListener('touchend', handleTouchEnd, false);

    // Close modal if clicking outside the content
    modal.addEventListener('click', (event) => {
        if (event.target === modal) { // Check if the click is on the modal background itself
            closeModal();
        }
    });


    renderCalendar(currentYear, currentMonth); // Initial render
});