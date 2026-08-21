/**
 * DAWAMI - Interactive Calendar, Heatmap & Timeline View Renderer
 */

class CalendarView {
  constructor(engine, onDayClickCallback) {
    this.engine = engine;
    this.onDayClick = onDayClickCallback;

    this.currentDate = new Date();
    this.viewYear = this.currentDate.getFullYear();
    this.viewMonth = this.currentDate.getMonth(); // 0-11
    this.currentView = 'month'; // 'month', 'year', 'shifts'
    this.selectedDateKey = null;

    this.monthNamesAr = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    this.monthNamesEn = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    this.weekdayNamesAr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    this.weekdayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    this.initDOMElements();
    this.bindEvents();
  }

  initDOMElements() {
    this.monthYearLabel = document.getElementById('calendar-month-year-label');
    this.daysGrid = document.getElementById('calendar-days-grid');
    this.yearMonthsGrid = document.getElementById('yearly-months-grid');
    this.yearLabel = document.getElementById('year-label');
    this.shiftsListContainer = document.getElementById('shifts-list-container');
    this.legendBar = document.getElementById('shift-legend-bar');

    this.btnPrev = document.getElementById('cal-btn-prev');
    this.btnNext = document.getElementById('cal-btn-next');
    this.btnToday = document.getElementById('cal-btn-today');

    this.btnYearPrev = document.getElementById('year-btn-prev');
    this.btnYearNext = document.getElementById('year-btn-next');

    this.viewTabs = document.querySelectorAll('.btn-tab');
    this.viewPanels = {
      month: document.getElementById('view-month-grid'),
      year: document.getElementById('view-year-grid'),
      shifts: document.getElementById('view-shifts-list')
    };
  }

  bindEvents() {
    if (this.btnPrev) {
      this.btnPrev.addEventListener('click', () => {
        this.viewMonth--;
        if (this.viewMonth < 0) {
          this.viewMonth = 11;
          this.viewYear--;
        }
        this.render();
      });
    }

    if (this.btnNext) {
      this.btnNext.addEventListener('click', () => {
        this.viewMonth++;
        if (this.viewMonth > 11) {
          this.viewMonth = 0;
          this.viewYear++;
        }
        this.render();
      });
    }

    if (this.btnToday) {
      this.btnToday.addEventListener('click', () => {
        const today = new Date();
        this.viewYear = today.getFullYear();
        this.viewMonth = today.getMonth();
        this.render();
      });
    }

    if (this.btnYearPrev) {
      this.btnYearPrev.addEventListener('click', () => {
        this.viewYear--;
        this.renderYearView();
      });
    }

    if (this.btnYearNext) {
      this.btnYearNext.addEventListener('click', () => {
        this.viewYear++;
        this.renderYearView();
      });
    }

    this.viewTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const targetView = tab.getAttribute('data-view');
        this.switchView(targetView);
      });
    });
  }

  switchView(viewName) {
    this.currentView = viewName;
    this.viewTabs.forEach(t => {
      t.classList.toggle('active', t.getAttribute('data-view') === viewName);
    });

    Object.keys(this.viewPanels).forEach(k => {
      if (this.viewPanels[k]) {
        this.viewPanels[k].classList.toggle('active', k === viewName);
      }
    });

    this.render();
  }

  render() {
    this.renderLegend();
    if (this.currentView === 'month') {
      this.renderMonthView();
    } else if (this.currentView === 'year') {
      this.renderYearView();
    } else if (this.currentView === 'shifts') {
      this.renderShiftsListView();
    }
  }

  renderLegend() {
    if (!this.legendBar) return;
    const isAr = document.documentElement.getAttribute('lang') === 'ar';
    this.legendBar.innerHTML = `
      <div class="legend-item"><span class="legend-dot dot-work"></span> ${isAr ? 'دوام نهاري' : 'Day Shift'}</div>
      <div class="legend-item"><span class="legend-dot dot-duty24"></span> ${isAr ? 'استلام 24 ساعة' : '24h Duty'}</div>
      <div class="legend-item"><span class="legend-dot dot-eve"></span> ${isAr ? 'مسائي' : 'Evening'}</div>
      <div class="legend-item"><span class="legend-dot dot-night"></span> ${isAr ? 'ليلي' : 'Night'}</div>
      <div class="legend-item"><span class="legend-dot dot-off"></span> ${isAr ? 'راحة / إجازة' : 'Day Off'}</div>
      <div class="legend-item"><span class="legend-dot dot-leave"></span> ${isAr ? 'إجازة سنوية / مرضية' : 'Leave'}</div>
      <div class="legend-item"><span class="legend-dot dot-swap"></span> ${isAr ? 'تعديل مخصص / تبديل' : 'Override / Swap'}</div>
    `;
  }

  renderMonthView() {
    const isAr = document.documentElement.getAttribute('lang') === 'ar';
    const monthName = isAr ? this.monthNamesAr[this.viewMonth] : this.monthNamesEn[this.viewMonth];
    if (this.monthYearLabel) {
      this.monthYearLabel.textContent = `${monthName} ${this.viewYear}`;
    }

    if (!this.daysGrid) return;
    this.daysGrid.innerHTML = '';

    const firstDay = new Date(this.viewYear, this.viewMonth, 1);
    const lastDay = new Date(this.viewYear, this.viewMonth + 1, 0);
    const totalDays = lastDay.getDate();

    // Sunday index is 0, Sat is 6
    const startDayIndex = firstDay.getDay();

    const todayStr = this.engine.formatDateKey(new Date());

    // 1. Previous month trailing days
    const prevMonthLastDay = new Date(this.viewYear, this.viewMonth, 0).getDate();
    for (let i = startDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const dateObj = new Date(this.viewYear, this.viewMonth - 1, dayNum);
      const shift = this.engine.getShiftForDate(dateObj);
      const cell = this.createDayCell(dateObj, shift, true, todayStr);
      this.daysGrid.appendChild(cell);
    }

    // 2. Current month days
    for (let day = 1; day <= totalDays; day++) {
      const dateObj = new Date(this.viewYear, this.viewMonth, day);
      const shift = this.engine.getShiftForDate(dateObj);
      const cell = this.createDayCell(dateObj, shift, false, todayStr);
      this.daysGrid.appendChild(cell);
    }

    // 3. Next month leading days (fill up to 35 or 42 cells)
    const currentCellsCount = startDayIndex + totalDays;
    const remainingCells = currentCellsCount <= 35 ? 35 - currentCellsCount : 42 - currentCellsCount;
    for (let day = 1; day <= remainingCells; day++) {
      const dateObj = new Date(this.viewYear, this.viewMonth + 1, day);
      const shift = this.engine.getShiftForDate(dateObj);
      const cell = this.createDayCell(dateObj, shift, true, todayStr);
      this.daysGrid.appendChild(cell);
    }
  }

  createDayCell(dateObj, shift, isOtherMonth, todayStr) {
    const isAr = document.documentElement.getAttribute('lang') === 'ar';
    const dateKey = this.engine.formatDateKey(dateObj);
    const isToday = dateKey === todayStr;

    const cell = document.createElement('div');
    cell.className = `cal-day-cell ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'is-today' : ''}`;
    cell.setAttribute('data-date', dateKey);

    const shiftDisplayName = isAr ? shift.name : (shift.nameEn || shift.name);

    let overrideDotHtml = shift.isOverride ? `<span class="custom-override-dot" title="تعديل مخصص: ${shift.overrideNote || ''}"></span>` : '';
    let timeHintHtml = shift.startTime && shift.isWork ? `<span class="day-time-hint">${shift.startTime} - ${shift.endTime}</span>` : '';

    cell.innerHTML = `
      ${overrideDotHtml}
      <div class="day-header">
        <span class="day-num">${dateObj.getDate()}</span>
        ${isToday ? `<span class="day-badge-corner"><i class="fa-solid fa-circle-dot" style="color:var(--primary-500)"></i></span>` : ''}
      </div>
      <div class="day-shift-pill ${shift.colorClass}">
        <span>${shiftDisplayName}</span>
      </div>
      ${timeHintHtml}
    `;

    cell.addEventListener('click', () => {
      if (this.onDayClick) {
        this.onDayClick(dateKey, shift);
      }
    });

    return cell;
  }

  renderYearView() {
    if (this.yearLabel) {
      const isAr = document.documentElement.getAttribute('lang') === 'ar';
      this.yearLabel.textContent = isAr ? `عام ${this.viewYear}` : `Year ${this.viewYear}`;
    }

    if (!this.yearMonthsGrid) return;
    this.yearMonthsGrid.innerHTML = '';

    const isAr = document.documentElement.getAttribute('lang') === 'ar';

    for (let m = 0; m < 12; m++) {
      const monthCard = document.createElement('div');
      monthCard.className = 'mini-month-card glass-inner';

      const monthTitle = document.createElement('div');
      monthTitle.className = 'mini-month-title';
      monthTitle.textContent = isAr ? this.monthNamesAr[m] : this.monthNamesEn[m];
      monthCard.appendChild(monthTitle);

      const daysGrid = document.createElement('div');
      daysGrid.className = 'mini-days-grid';

      const firstDay = new Date(this.viewYear, m, 1);
      const totalDays = new Date(this.viewYear, m + 1, 0).getDate();
      const startDayIndex = firstDay.getDay();

      for (let i = 0; i < startDayIndex; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'mini-day-cell empty';
        daysGrid.appendChild(emptyCell);
      }

      for (let d = 1; d <= totalDays; d++) {
        const dObj = new Date(this.viewYear, m, d);
        const shift = this.engine.getShiftForDate(dObj);
        const dayCell = document.createElement('div');
        
        let statusClass = shift.isWork ? (shift.type === 'WORK_NIGHT' ? 'is-night' : 'is-work') : (shift.type === 'ANNUAL_LEAVE' ? 'is-leave' : 'is-off');
        dayCell.className = `mini-day-cell ${statusClass}`;
        dayCell.textContent = d;
        dayCell.title = `${this.engine.formatDateKey(dObj)}: ${isAr ? shift.name : shift.nameEn}`;

        dayCell.addEventListener('click', () => {
          this.viewMonth = m;
          this.switchView('month');
          if (this.onDayClick) {
            this.onDayClick(this.engine.formatDateKey(dObj), shift);
          }
        });

        daysGrid.appendChild(dayCell);
      }

      monthCard.appendChild(daysGrid);
      this.yearMonthsGrid.appendChild(monthCard);
    }
  }

  renderShiftsListView() {
    if (!this.shiftsListContainer) return;
    this.shiftsListContainer.innerHTML = '';

    const isAr = document.documentElement.getAttribute('lang') === 'ar';
    const startDate = new Date();

    for (let i = 0; i < 30; i++) {
      const dObj = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
      const shift = this.engine.getShiftForDate(dObj);
      const dateKey = this.engine.formatDateKey(dObj);

      const row = document.createElement('div');
      row.className = 'timeline-row glass-inner';

      const dayName = isAr ? this.weekdayNamesAr[dObj.getDay()] : this.weekdayNamesEn[dObj.getDay()];
      const monthName = isAr ? this.monthNamesAr[dObj.getMonth()] : this.monthNamesEn[dObj.getMonth()];
      const shiftName = isAr ? shift.name : (shift.nameEn || shift.name);

      let timeText = shift.isWork ? `${shift.startTime} - ${shift.endTime} (${shift.hours} ${isAr ? 'ساعات' : 'hours'})` : (isAr ? 'يوم راحة' : 'Rest day');
      if (shift.overrideNote) {
        timeText += ` • ${shift.overrideNote}`;
      }

      row.innerHTML = `
        <div class="timeline-date-block">
          <span class="timeline-day-num">${dObj.getDate()}</span>
          <div class="timeline-date-info">
            <h5>${dayName}، ${dObj.getDate()} ${monthName}</h5>
            <p>${timeText}</p>
          </div>
        </div>
        <div class="timeline-shift-meta">
          <span class="timeline-badge ${shift.colorClass}">${shiftName}</span>
          <i class="fa-solid fa-chevron-left" style="color:var(--text-subtle);font-size:12px;"></i>
        </div>
      `;

      row.addEventListener('click', () => {
        if (this.onDayClick) {
          this.onDayClick(dateKey, shift);
        }
      });

      this.shiftsListContainer.appendChild(row);
    }
  }
}

// Attach to window
window.CalendarView = CalendarView;
