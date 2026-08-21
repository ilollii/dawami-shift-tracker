/**
 * DAWAMI - Statistics, Metrics & Smart Leave/Breaks Planner
 */

class StatsManager {
  constructor(engine) {
    this.engine = engine;
    this.initDOMElements();
  }

  initDOMElements() {
    this.statWorkDays = document.getElementById('stat-month-work-days');
    this.statOffDays = document.getElementById('stat-month-off-days');
    this.statWorkHours = document.getElementById('stat-month-work-hours');
    this.statNextOffStreak = document.getElementById('stat-next-off-streak');
    this.statNextOffUnit = document.getElementById('stat-next-off-unit');

    // Smart Leave / Break Planner Elements
    this.nextBreakDuration = document.getElementById('planner-next-break-duration');
    this.nextBreakDates = document.getElementById('planner-next-break-dates');
    this.smartLeaveTip = document.getElementById('planner-smart-tip');
  }

  /**
   * Update top metrics bar and smart breaks planner for the given month/year
   */
  updateMetrics(year, month) {
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    let workDaysCount = 0;
    let offDaysCount = 0;
    let totalWorkHours = 0;

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dObj = new Date(year, month, day);
      const shift = this.engine.getShiftForDate(dObj);

      if (shift.isWork) {
        workDaysCount++;
        totalWorkHours += (shift.hours || 8);
      } else {
        offDaysCount++;
      }
    }

    const nextStreak = this.engine.getNextOffStreak(new Date());

    if (this.statWorkDays) this.statWorkDays.textContent = workDaysCount;
    if (this.statOffDays) this.statOffDays.textContent = offDaysCount;
    if (this.statWorkHours) this.statWorkHours.textContent = Math.round(totalWorkHours);
    if (this.statNextOffStreak) this.statNextOffStreak.textContent = nextStreak;

    this.updateSmartBreaksPlanner();
  }

  /**
   * Calculate next multi-day off period and smart leave tips
   */
  updateSmartBreaksPlanner() {
    const now = new Date();
    const isAr = document.documentElement.getAttribute('lang') === 'ar';
    const dayNames = isAr ? ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'] : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = isAr ? [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ] : [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    // 1. Find upcoming continuous off period
    let firstOffDate = null;
    let breakLength = 0;

    for (let i = 0; i < 60; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      const shift = this.engine.getShiftForDate(d);

      if (!shift.isWork) {
        if (!firstOffDate) firstOffDate = d;
        breakLength++;
      } else if (firstOffDate) {
        // Break ended
        break;
      }
    }

    if (this.nextBreakDuration && this.nextBreakDates) {
      if (firstOffDate) {
        const daysWord = isAr ? (breakLength === 1 ? 'يوم واحد' : (breakLength === 2 ? 'يومان' : `${breakLength} أيام`)) : `${breakLength} days`;
        this.nextBreakDuration.textContent = daysWord;
        this.nextBreakDates.textContent = `${isAr ? 'تبدأ' : 'Starts'}: ${dayNames[firstOffDate.getDay()]}، ${firstOffDate.getDate()} ${monthNames[firstOffDate.getMonth()]}`;
      } else {
        this.nextBreakDuration.textContent = isAr ? 'لا توجد قريباً' : 'None upcoming';
        this.nextBreakDates.textContent = '-';
      }
    }

    // 2. Smart Leave Recommendation (find an isolated work day between off days)
    if (this.smartLeaveTip) {
      let foundTip = false;
      for (let i = 1; i < 30; i++) {
        const dPrev = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i - 1);
        const dCurr = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
        const dNext = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i + 1);

        const sPrev = this.engine.getShiftForDate(dPrev);
        const sCurr = this.engine.getShiftForDate(dCurr);
        const sNext = this.engine.getShiftForDate(dNext);

        // If today is work day but yesterday and tomorrow are off: bridge day!
        if (sCurr.isWork && !sPrev.isWork && !sNext.isWork) {
          const dayName = dayNames[dCurr.getDay()];
          const dateStr = `${dCurr.getDate()} ${monthNames[dCurr.getMonth()]}`;
          if (isAr) {
            this.smartLeaveTip.innerHTML = `إذا أخذت إجازة يوم <strong>${dayName} (${dateStr})</strong>، ستحصل على فترة راحة متصلة وممتدة برصيد يوم واحد فقط! ✨`;
          } else {
            this.smartLeaveTip.innerHTML = `Taking leave on <strong>${dayName} (${dateStr})</strong> connects your off-days into a long continuous vacation! ✨`;
          }
          foundTip = true;
          break;
        }
      }

      if (!foundTip) {
        if (isAr) {
          this.smartLeaveTip.innerHTML = `يمكنك التخطيط لإجازاتك القادمة ومزامنة مواعيدها مباشرة مع تقويم هاتفك بسهولة!`;
        } else {
          this.smartLeaveTip.innerHTML = `Plan your upcoming leaves and sync your shifts directly to your phone calendar!`;
        }
      }
    }
  }
}

// Attach to window
window.StatsManager = StatsManager;
