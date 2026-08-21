/**
 * DAWAMI - Main Application Controller & UI Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. App State & Storage Keys
  const STORAGE_KEY_CONFIG = 'dawami_shift_config_v2';
  const STORAGE_KEY_OVERRIDES = 'dawami_shift_overrides_v2';
  const STORAGE_KEY_THEME = 'dawami_theme_pref';
  const STORAGE_KEY_LANG = 'dawami_lang_pref';
  const STORAGE_KEY_USER_NAME = 'dawami_user_name_v2';

  let config = loadSavedConfig();
  let overrides = loadSavedOverrides();
  let userName = loadSavedUserName();

  // 2. Instantiate Core Engines
  const engine = new ShiftEngine(config, overrides);
  const exporter = new Exporter(engine);
  const statsManager = new StatsManager(engine);
  
  let selectedDayDateKey = null;
  let customPatternDraft = config.custom ? [...(config.custom.pattern || ['D', 'D', 'N', 'N', 'O', 'O'])] : ['D', 'D', 'N', 'N', 'O', 'O'];

  // 3. Instantiate Calendar View
  const calendarView = new CalendarView(engine, (dateKey, shift) => {
    openDayDetailsModal(dateKey, shift);
  });

  // 4. Initialize UI & Bind Events
  initTheme();
  initLanguage();
  initPresetCards();
  initCustomPatternBuilder();
  updateUserDisplay();
  bindAppEvents();
  refreshAllViews();
  startCountdownLoop();

  // Auto prompt for name if first visit
  if (!userName) {
    setTimeout(() => {
      openModal('modal-user-registration');
    }, 1200);
  }

  // ==========================================
  // Core Functions & View Refreshers
  // ==========================================

  function refreshAllViews() {
    engine.config = config;
    engine.overrides = overrides;

    updateHeaderBadge();
    updateHeroTodayCard();
    calendarView.render();
    statsManager.updateMetrics(calendarView.viewYear, calendarView.viewMonth);
  }

  function updateHeaderBadge() {
    const badge = document.getElementById('current-system-badge');
    if (!badge) return;

    const isAr = document.documentElement.getAttribute('lang') === 'ar';

    if (config.type === 'weekly') {
      badge.textContent = isAr ? 'دوام أسبوعي ثابت' : 'Weekly Fixed';
    } else if (config.type === 'preset') {
      const p = PRESETS.find(item => item.id === config.presetId);
      badge.textContent = p ? (isAr ? p.nameAr : p.nameEn) : 'نظام تناوبي';
    } else if (config.type === 'custom') {
      badge.textContent = config.custom.name || (isAr ? 'نمط مخصص' : 'Custom');
    }
  }

  function updateHeroTodayCard() {
    const now = new Date();
    const todayShift = engine.getShiftForDate(now);
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const tomorrowShift = engine.getShiftForDate(tomorrow);

    const isAr = document.documentElement.getAttribute('lang') === 'ar';

    // Hero date tag
    const heroDateTag = document.getElementById('hero-today-date');
    if (heroDateTag) {
      const dayNames = isAr ? ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'] : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const monthNames = isAr ? calendarView.monthNamesAr : calendarView.monthNamesEn;
      heroDateTag.textContent = `${isAr ? 'اليوم' : 'Today'}: ${dayNames[now.getDay()]}، ${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;
    }

    // Avatar & Headline
    const avatar = document.getElementById('today-status-avatar');
    const avatarIcon = document.getElementById('today-status-icon');
    const headline = document.getElementById('hero-status-headline');
    const statusPill = document.getElementById('hero-status-pill');
    const shiftNamePill = document.getElementById('hero-shift-name');
    const shiftHoursVal = document.getElementById('hero-shift-hours');
    const tomorrowStatusVal = document.getElementById('hero-tomorrow-status');

    if (avatar) {
      avatar.className = 'status-avatar pulse-effect';
      if (!todayShift.isWork) {
        avatar.classList.add('status-off');
        if (avatarIcon) avatarIcon.className = 'fa-solid fa-bed';
      } else if (todayShift.type === 'DUTY_24H') {
        avatar.classList.add('status-duty24');
        if (avatarIcon) avatarIcon.className = 'fa-solid fa-shield-halved';
      } else if (todayShift.type === 'WORK_NIGHT') {
        avatar.classList.add('status-night');
        if (avatarIcon) avatarIcon.className = 'fa-solid fa-moon';
      } else {
        if (avatarIcon) avatarIcon.className = 'fa-solid fa-briefcase';
      }
    }

    if (headline) {
      if (todayShift.isWork) {
        headline.textContent = isAr ? 'نعم، أنت مداوم اليوم 💼' : 'Yes, you are on duty today! 💼';
      } else {
        headline.textContent = isAr ? 'اليوم يوم راحة وإجازة! 🎉' : 'Today is a day off! 🎉';
      }
    }

    if (statusPill) {
      statusPill.className = `main-status-badge ${todayShift.isWork ? 'badge-work' : 'badge-off'}`;
      statusPill.textContent = todayShift.isWork ? (isAr ? 'يوم عمل' : 'On Duty') : (isAr ? 'يوم راحة' : 'Day Off');
    }

    if (shiftNamePill) {
      shiftNamePill.textContent = isAr ? todayShift.name : (todayShift.nameEn || todayShift.name);
    }

    if (shiftHoursVal) {
      if (todayShift.isWork && todayShift.startTime) {
        shiftHoursVal.textContent = `${todayShift.startTime} - ${todayShift.endTime} (${todayShift.hours} ${isAr ? 'ساعات' : 'hours'})`;
      } else {
        shiftHoursVal.textContent = isAr ? 'لا يوجد دوام رسمي اليوم' : 'No duty scheduled for today';
      }
    }

    if (tomorrowStatusVal) {
      tomorrowStatusVal.textContent = isAr ? tomorrowShift.name : (tomorrowShift.nameEn || tomorrowShift.name);
    }
  }

  // ==========================================
  // Live Countdown Loop
  // ==========================================

  function startCountdownLoop() {
    function tick() {
      const now = new Date();
      const isAr = document.documentElement.getAttribute('lang') === 'ar';

      // Find the next upcoming event
      let targetTime = null;
      let targetTitle = '';
      let targetDateDesc = '';

      const todayShift = engine.getShiftForDate(now);

      if (todayShift.isWork && todayShift.startTime) {
        const [sH, sM] = todayShift.startTime.split(':').map(Number);
        const [eH, eM] = todayShift.endTime.split(':').map(Number);

        const startObj = new Date(now.getFullYear(), now.getMonth(), now.getDate(), sH, sM, 0);
        let endObj = new Date(now.getFullYear(), now.getMonth(), now.getDate(), eH, eM, 0);
        if (eH < sH || (eH === sH && eM <= sM)) {
          endObj.setDate(endObj.getDate() + 1); // spans to next day
        }

        if (now < startObj) {
          targetTime = startObj;
          targetTitle = isAr ? 'المتبقي على بداية الدوام اليوم:' : 'Time until shift starts:';
          targetDateDesc = `${isAr ? 'اليوم' : 'Today'} ${todayShift.startTime}`;
        } else if (now >= startObj && now < endObj) {
          targetTime = endObj;
          targetTitle = isAr ? 'المتبقي على انتهاء الدوام:' : 'Time until shift ends:';
          targetDateDesc = `${isAr ? 'الانتهاء' : 'Ending at'} ${todayShift.endTime}`;
        }
      }

      // If no active shift today or shift has already passed, look for the next work shift in the future
      if (!targetTime) {
        for (let i = 1; i <= 60; i++) {
          const futureDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
          const futureShift = engine.getShiftForDate(futureDate);
          if (futureShift.isWork) {
            const [sH, sM] = (futureShift.startTime || '08:00').split(':').map(Number);
            targetTime = new Date(futureDate.getFullYear(), futureDate.getMonth(), futureDate.getDate(), sH, sM, 0);
            targetTitle = isAr ? 'المتبقي على الدوام القادم:' : 'Time to next shift:';
            const dayNames = isAr ? ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            targetDateDesc = `${dayNames[futureDate.getDay()]} (${futureShift.name}) ${futureShift.startTime || '08:00'}`;
            break;
          }
        }
      }

      const countdownTitle = document.getElementById('countdown-title');
      const countdownTargetDate = document.getElementById('countdown-target-date');

      if (countdownTitle) countdownTitle.textContent = targetTitle;
      if (countdownTargetDate) countdownTargetDate.textContent = targetDateDesc;

      if (targetTime) {
        const diffMs = targetTime.getTime() - now.getTime();
        if (diffMs > 0) {
          const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
          const mins = Math.floor((diffMs / (1000 * 60)) % 60);
          const secs = Math.floor((diffMs / 1000) % 60);

          document.getElementById('timer-days').textContent = String(days).padStart(2, '0');
          document.getElementById('timer-hours').textContent = String(hours).padStart(2, '0');
          document.getElementById('timer-mins').textContent = String(mins).padStart(2, '0');
          document.getElementById('timer-secs').textContent = String(secs).padStart(2, '0');
        } else {
          document.getElementById('timer-days').textContent = '00';
          document.getElementById('timer-hours').textContent = '00';
          document.getElementById('timer-mins').textContent = '00';
          document.getElementById('timer-secs').textContent = '00';
        }
      }
    }

    tick();
    setInterval(tick, 1000);
  }

  // ==========================================
  // Presets & Custom Pattern Management
  // ==========================================

  function initPresetCards() {
    const container = document.getElementById('preset-cards-container');
    if (!container) return;

    container.innerHTML = '';
    const isAr = document.documentElement.getAttribute('lang') === 'ar';

    PRESETS.forEach(preset => {
      const card = document.createElement('div');
      const isActive = config.type === 'preset' && config.presetId === preset.id;
      card.className = `preset-item-card ${isActive ? 'active' : ''}`;
      card.setAttribute('data-preset-id', preset.id);

      card.innerHTML = `
        <div class="preset-item-title">
          <span>${isAr ? preset.nameAr : preset.nameEn}</span>
          ${isActive ? '<i class="fa-solid fa-circle-check" style="color:var(--primary-500)"></i>' : ''}
        </div>
        <div class="preset-item-desc">${isAr ? preset.descAr : preset.descEn}</div>
      `;

      card.addEventListener('click', () => {
        document.querySelectorAll('.preset-item-card').forEach(c => {
          c.classList.remove('active');
          const checkIcon = c.querySelector('.fa-circle-check');
          if (checkIcon) checkIcon.remove();
        });

        card.classList.add('active');
        card.querySelector('.preset-item-title').innerHTML += ' <i class="fa-solid fa-circle-check" style="color:var(--primary-500)"></i>';
        
        // Update anchor select options based on this preset
        populatePresetStartShiftSelect(preset);
      });

      container.appendChild(card);
    });

    const activePreset = PRESETS.find(p => p.id === (config.presetId || 'preset_weekly_sa')) || PRESETS[0];
    populatePresetStartShiftSelect(activePreset);

    // Set anchor date input
    const anchorInput = document.getElementById('preset-start-date');
    if (anchorInput) {
      anchorInput.value = config.anchorDate || engine.formatDateKey(new Date());
    }
  }

  function populatePresetStartShiftSelect(preset) {
    const select = document.getElementById('preset-start-shift-select');
    if (!select) return;
    select.innerHTML = '';

    const isAr = document.documentElement.getAttribute('lang') === 'ar';

    if (preset.pattern) {
      preset.pattern.forEach((code, idx) => {
        const conf = preset.shiftConfigs[code] || SHIFT_TYPES.OFF;
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = `${isAr ? 'اليوم' : 'Day'} ${idx + 1}: ${isAr ? conf.nameAr : conf.nameEn} (${code})`;
        select.appendChild(opt);
      });
    } else {
      const opt = document.createElement('option');
      opt.value = 0;
      opt.textContent = isAr ? 'دوام عادي' : 'Standard Shift';
      select.appendChild(opt);
    }
  }

  function initCustomPatternBuilder() {
    renderCustomPatternStrip();

    // Custom add chip buttons
    document.querySelectorAll('.add-shift-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-type');
        customPatternDraft.push(type);
        renderCustomPatternStrip();
      });
    });

    const customDateInput = document.getElementById('custom-start-date');
    if (customDateInput) {
      customDateInput.value = (config.custom && config.custom.anchorDate) || engine.formatDateKey(new Date());
    }

    const customNameInput = document.getElementById('custom-system-name');
    if (customNameInput && config.custom) {
      customNameInput.value = config.custom.name || 'ورديتي المخصصة';
    }
  }

  function renderCustomPatternStrip() {
    const strip = document.getElementById('custom-pattern-strip');
    const lenLabel = document.getElementById('custom-pattern-length');
    if (!strip) return;

    strip.innerHTML = '';
    const isAr = document.documentElement.getAttribute('lang') === 'ar';

    if (lenLabel) lenLabel.textContent = customPatternDraft.length;

    if (customPatternDraft.length === 0) {
      strip.innerHTML = `<span style="color:var(--text-muted);font-size:12px;">${isAr ? 'أضف أيام الوردية والراحة لتكوين النمط' : 'Add shifts and off-days to build sequence'}</span>`;
      return;
    }

    const typeLabels = {
      '24H': isAr ? 'استلام 24س' : '24h Duty',
      'D': isAr ? 'صباحي' : 'Day',
      'E': isAr ? 'مسائي' : 'Evening',
      'N': isAr ? 'ليلي' : 'Night',
      'O': isAr ? 'راحة' : 'Off'
    };

    customPatternDraft.forEach((code, index) => {
      const item = document.createElement('div');
      item.className = `strip-item type-${code}`;
      item.innerHTML = `
        <span>${index + 1}. ${typeLabels[code] || code}</span>
        <button type="button" class="btn-remove-step" data-index="${index}" title="حذف">&times;</button>
      `;

      item.querySelector('.btn-remove-step').addEventListener('click', (e) => {
        e.stopPropagation();
        customPatternDraft.splice(index, 1);
        renderCustomPatternStrip();
      });

      strip.appendChild(item);
    });
  }

  // ==========================================
  // Modals & User Actions Handlers
  // ==========================================

  function bindAppEvents() {
    // Open Settings Modal
    const btnOpenSettings = document.getElementById('btn-open-settings');
    const btnQuickSettings = document.getElementById('btn-quick-settings');
    if (btnOpenSettings) btnOpenSettings.addEventListener('click', () => openModal('modal-settings'));
    if (btnQuickSettings) btnQuickSettings.addEventListener('click', () => openModal('modal-settings'));

    // Open Export Modal
    const btnExportMenu = document.getElementById('btn-export-menu');
    if (btnExportMenu) btnExportMenu.addEventListener('click', () => openModal('modal-export'));

    // Modal Close Buttons
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-close');
        closeModal(modalId);
      });
    });

    // Close on backdrop click
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          backdrop.classList.remove('active');
        }
      });
    });

    // Settings Tabs Navigation
    document.querySelectorAll('.setting-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.setting-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.setting-tab-content').forEach(c => c.classList.remove('active'));

        tab.classList.add('active');
        const targetId = tab.getAttribute('data-tab');
        const targetContent = document.getElementById(targetId);
        if (targetContent) targetContent.classList.add('active');
      });
    });

    // Save Settings Button
    const btnSaveSettings = document.getElementById('btn-save-settings');
    if (btnSaveSettings) {
      btnSaveSettings.addEventListener('click', () => {
        saveSettingsForm();
      });
    }

    // Future Date Inspector
    const btnRunCheck = document.getElementById('btn-run-check');
    const checkTargetDate = document.getElementById('check-target-date');
    if (checkTargetDate) {
      checkTargetDate.value = engine.formatDateKey(new Date());
    }

    if (btnRunCheck && checkTargetDate) {
      btnRunCheck.addEventListener('click', () => {
        runFutureDateCheck(checkTargetDate.value);
      });
    }

    // Quick Shift Swap button in sidebar
    const btnQuickSwap = document.getElementById('btn-quick-swap');
    if (btnQuickSwap) {
      btnQuickSwap.addEventListener('click', () => {
        const todayStr = engine.formatDateKey(new Date());
        openDayDetailsModal(todayStr, engine.getShiftForDate(new Date()));
      });
    }

    // Print Button
    const btnPrintSchedule = document.getElementById('btn-print-schedule');
    const exportBtnPrint = document.getElementById('export-btn-print');
    if (btnPrintSchedule) btnPrintSchedule.addEventListener('click', () => window.print());
    if (exportBtnPrint) exportBtnPrint.addEventListener('click', () => window.print());

    // ICS Download
    const exportBtnIcs = document.getElementById('export-btn-ics');
    if (exportBtnIcs) {
      exportBtnIcs.addEventListener('click', () => {
        exporter.exportToICS();
        showToast('تم تصدير ملف التقويم (.ics) بنجاح!', 'success');
        closeModal('modal-export');
      });
    }

    // JSON Backup Download
    const btnDownloadBackup = document.getElementById('btn-download-backup');
    if (btnDownloadBackup) {
      btnDownloadBackup.addEventListener('click', (e) => {
        e.stopPropagation();
        exporter.exportBackupJSON(config, overrides);
        showToast('تم حفظ النسخة الاحتياطية بنجاح!', 'success');
      });
    }

    // JSON Restore
    const inputImport = document.getElementById('input-import-backup');
    if (inputImport) {
      inputImport.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target.result);
            if (data.config) {
              config = data.config;
              overrides = data.overrides || {};
              saveConfigToStorage();
              saveOverridesToStorage();
              refreshAllViews();
              showToast('تم استعادة البيانات والجدول بنجاح!', 'success');
              closeModal('modal-export');
            } else {
              showToast('الملف غير صالح أو غير متوافق!', 'error');
            }
          } catch (err) {
            showToast('حدث خطأ أثناء قراءة ملف النسخة الاحتياطية', 'error');
          }
        };
        reader.readAsText(file);
      });
    }

    // Day Override Save & Reset
    const btnSaveDayOverride = document.getElementById('btn-save-day-override');
    const btnResetDayOverride = document.getElementById('btn-reset-day-override');

    if (btnSaveDayOverride) {
      btnSaveDayOverride.addEventListener('click', () => {
        if (!selectedDayDateKey) return;
        const overrideType = document.getElementById('day-override-type').value;
        const overrideNote = document.getElementById('day-override-note').value;

        if (overrideType === 'DEFAULT') {
          delete overrides[selectedDayDateKey];
        } else {
          overrides[selectedDayDateKey] = {
            type: overrideType,
            note: overrideNote
          };
        }

        saveOverridesToStorage();
        refreshAllViews();
        closeModal('modal-day-details');
        showToast('تم تحديث وحفظ تفاصيل هذا اليوم بنجاح!', 'success');
      });
    }

    // User Profile / Name Registration Modal events
    const btnUserProfile = document.getElementById('btn-user-profile');
    const btnSaveUserName = document.getElementById('btn-save-user-name');
    const inputRegisterName = document.getElementById('input-register-name');

    if (btnUserProfile) {
      btnUserProfile.addEventListener('click', () => {
        if (inputRegisterName) {
          inputRegisterName.value = userName || '';
        }
        openModal('modal-user-registration');
        setTimeout(() => {
          if (inputRegisterName) inputRegisterName.focus();
        }, 100);
      });
    }

    if (btnSaveUserName) {
      btnSaveUserName.addEventListener('click', () => {
        const val = inputRegisterName ? inputRegisterName.value.trim() : '';
        if (!val) {
          showToast('يرجى كتابة اسمك لحفظه وتخصيص الجدول', 'error');
          if (inputRegisterName) inputRegisterName.focus();
          return;
        }
        saveUserName(val);
        closeModal('modal-user-registration');
        showToast(`أهلاً بك يا ${val}! تم تخصيص جدول دوامك بنجاح ✨`, 'success');
      });
    }

    if (btnResetDayOverride) {
      btnResetDayOverride.addEventListener('click', () => {
        if (!selectedDayDateKey) return;
        delete overrides[selectedDayDateKey];
        saveOverridesToStorage();
        refreshAllViews();
        closeModal('modal-day-details');
        showToast('تمت استعادة الجدول الأصلي لهذا اليوم', 'info');
      });
    }
  }

  function saveSettingsForm() {
    const activeTab = document.querySelector('.setting-tab.active');
    const tabId = activeTab ? activeTab.getAttribute('data-tab') : 'tab-presets';

    if (tabId === 'tab-presets') {
      const activeCard = document.querySelector('.preset-item-card.active');
      const presetId = activeCard ? activeCard.getAttribute('data-preset-id') : 'preset_weekly_sa';
      const anchorDate = document.getElementById('preset-start-date').value || engine.formatDateKey(new Date());
      const startShiftOffset = parseInt(document.getElementById('preset-start-shift-select').value) || 0;

      // Adjust anchor date backwards if user picked a specific starting shift in cycle
      const anchorDateObj = engine.parseDateKey(anchorDate);
      anchorDateObj.setDate(anchorDateObj.getDate() - startShiftOffset);

      config = {
        ...config,
        type: 'preset',
        presetId: presetId,
        anchorDate: engine.formatDateKey(anchorDateObj)
      };

    } else if (tabId === 'tab-weekly') {
      const checkedDays = [];
      for (let i = 0; i < 7; i++) {
        const chk = document.getElementById(`chk-day-${i}`);
        if (chk && chk.checked) checkedDays.push(i);
      }

      const startTime = document.getElementById('weekly-start-time').value || '08:00';
      const endTime = document.getElementById('weekly-end-time').value || '16:00';
      const title = document.getElementById('weekly-shift-title').value || 'دوام رسمي';

      config = {
        ...config,
        type: 'weekly',
        weekly: {
          workDays: checkedDays,
          startTime,
          endTime,
          title
        }
      };

    } else if (tabId === 'tab-custom') {
      if (customPatternDraft.length === 0) {
        showToast('يرجى إضافة يوم واحد على الأقل في نمط الدورة!', 'error');
        return;
      }

      const anchorDate = document.getElementById('custom-start-date').value || engine.formatDateKey(new Date());
      const name = document.getElementById('custom-system-name').value || 'ورديتي المخصصة';

      config = {
        ...config,
        type: 'custom',
        custom: {
          name,
          pattern: [...customPatternDraft],
          anchorDate,
          shiftConfigs: {
            '24H': SHIFT_TYPES.DUTY_24H,
            'D': SHIFT_TYPES.WORK_DAY,
            'E': SHIFT_TYPES.WORK_EVENING,
            'N': SHIFT_TYPES.WORK_NIGHT,
            'O': SHIFT_TYPES.OFF
          }
        }
      };
    }

    saveConfigToStorage();
    refreshAllViews();
    closeModal('modal-settings');
    showToast('تم تطبيق وحفظ نظام الدوام بنجاح!', 'success');
  }

  function openDayDetailsModal(dateKey, shift) {
    selectedDayDateKey = dateKey;
    const isAr = document.documentElement.getAttribute('lang') === 'ar';

    const dateObj = engine.parseDateKey(dateKey);
    const dayNames = isAr ? ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'] : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = isAr ? calendarView.monthNamesAr : calendarView.monthNamesEn;

    document.getElementById('modal-day-title').textContent = `${isAr ? 'تفاصيل اليوم' : 'Day Details'}: ${dayNames[dateObj.getDay()]}، ${dateObj.getDate()} ${monthNames[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
    document.getElementById('modal-day-shift-title').textContent = isAr ? shift.name : (shift.nameEn || shift.name);

    const timesP = document.getElementById('modal-day-shift-times');
    if (shift.isWork && shift.startTime) {
      timesP.textContent = `${isAr ? 'من' : 'From'} ${shift.startTime} ${isAr ? 'إلى' : 'to'} ${shift.endTime} (${shift.hours} ${isAr ? 'ساعات' : 'hours'})`;
    } else {
      timesP.textContent = isAr ? 'يوم راحة وإجازة رسمية' : 'Official Day Off & Rest';
    }

    const typeTag = document.getElementById('modal-day-type-tag');
    typeTag.textContent = shift.isWork ? (isAr ? 'دوام عمل' : 'Work') : (isAr ? 'راحة' : 'Off');

    // Populate Override fields
    const overrideSelect = document.getElementById('day-override-type');
    const overrideNote = document.getElementById('day-override-note');

    if (overrides[dateKey]) {
      overrideSelect.value = overrides[dateKey].type;
      overrideNote.value = overrides[dateKey].note || '';
    } else {
      overrideSelect.value = 'DEFAULT';
      overrideNote.value = '';
    }

    openModal('modal-day-details');
  }

  function runFutureDateCheck(dateStr) {
    if (!dateStr) return;
    const isAr = document.documentElement.getAttribute('lang') === 'ar';
    const dateObj = engine.parseDateKey(dateStr);
    const shift = engine.getShiftForDate(dateObj);

    const resultBox = document.getElementById('check-result-box');
    const resultIcon = document.getElementById('check-result-icon');
    const resultTitle = document.getElementById('check-result-title');
    const resultDesc = document.getElementById('check-result-desc');

    resultBox.classList.remove('hidden');

    if (shift.isWork) {
      resultBox.className = 'check-result-box is-work';
      resultIcon.innerHTML = '<i class="fa-solid fa-briefcase"></i>';
      resultTitle.textContent = isAr ? `نعم، أنت مداوم (${shift.name})` : `Yes, on duty (${shift.nameEn || shift.name})`;
      resultDesc.textContent = `${isAr ? 'ساعات الدوام المقررة' : 'Shift hours'}: ${shift.startTime} - ${shift.endTime} (${shift.hours} ${isAr ? 'ساعات' : 'hrs'})`;
    } else {
      resultBox.className = 'check-result-box is-off';
      resultIcon.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
      resultTitle.textContent = isAr ? 'يوم راحة وإجازة 🎉' : 'Day Off / Rest 🎉';
      resultDesc.textContent = isAr ? 'ليس لديك أي دوام مقرر في هذا التاريخ، يمكنك الاستمتاع بيومك!' : 'No shift scheduled on this date. Enjoy your day!';
    }
  }

  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  }

  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-triangle-exclamation';

    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // ==========================================
  // Theme & Language Settings
  // ==========================================

  function initTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEY_THEME) || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const btnTheme = document.getElementById('btn-toggle-theme');
    if (btnTheme) {
      btnTheme.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem(STORAGE_KEY_THEME, next);
      });
    }
  }

  function initLanguage() {
    const savedLang = localStorage.getItem(STORAGE_KEY_LANG) || 'ar';
    setLanguage(savedLang);

    const btnLang = document.getElementById('btn-toggle-lang');
    if (btnLang) {
      btnLang.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('lang');
        const next = current === 'ar' ? 'en' : 'ar';
        setLanguage(next);
        localStorage.setItem(STORAGE_KEY_LANG, next);
        refreshAllViews();
      });
    }
  }

  function setLanguage(lang) {
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

    const langBtnText = document.querySelector('#btn-toggle-lang .lang-text');
    if (langBtnText) {
      langBtnText.textContent = lang === 'ar' ? 'EN' : 'عربي';
    }

    const weekdaysHeader = document.getElementById('calendar-weekdays-header');
    if (weekdaysHeader) {
      const days = lang === 'ar' ? ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      weekdaysHeader.innerHTML = days.map(d => `<span>${d}</span>`).join('');
    }

    const subTitle = document.getElementById('app-subtitle-text');
    if (subTitle) {
      subTitle.textContent = lang === 'ar' ? 'حاسبة وجدول الورديات وأيام الراحة' : 'Shift & Duty Roster Calculator';
    }
  }

  // ==========================================
  // Storage Helpers
  // ==========================================

  function loadSavedConfig() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    // Default preset is Saudi standard weekly Sun-Thu or 24/48
    return {
      type: 'preset',
      presetId: 'preset_weekly_sa',
      anchorDate: '2026-08-01',
      weekly: {
        workDays: [0, 1, 2, 3, 4],
        startTime: '08:00',
        endTime: '16:00',
        title: 'دوام رسمي'
      },
      custom: {
        name: 'ورديتي المخصصة',
        pattern: ['D', 'D', 'N', 'N', 'O', 'O'],
        anchorDate: '2026-08-01'
      }
    };
  }

  function saveConfigToStorage() {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  }

  function loadSavedOverrides() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_OVERRIDES);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  }

  function saveOverridesToStorage() {
    localStorage.setItem(STORAGE_KEY_OVERRIDES, JSON.stringify(overrides));
  }

  function loadSavedUserName() {
    try {
      return localStorage.getItem(STORAGE_KEY_USER_NAME) || '';
    } catch (e) {
      return '';
    }
  }

  function saveUserName(name) {
    userName = (name || '').trim();
    if (userName) {
      localStorage.setItem(STORAGE_KEY_USER_NAME, userName);
    } else {
      localStorage.removeItem(STORAGE_KEY_USER_NAME);
    }
    updateUserDisplay();
  }

  function updateUserDisplay() {
    const isAr = document.documentElement.getAttribute('lang') === 'ar';
    const headerDisplay = document.getElementById('header-user-display-name');
    const heroGreeting = document.getElementById('hero-user-greeting');
    const heroNameText = document.getElementById('hero-user-name-text');

    if (headerDisplay) {
      if (userName) {
        headerDisplay.textContent = userName;
      } else {
        headerDisplay.textContent = isAr ? 'تسجيل الاسم' : 'Sign in Name';
      }
    }

    if (heroGreeting && heroNameText) {
      if (userName) {
        heroNameText.textContent = isAr ? `جدول ${userName}` : `${userName}'s Schedule`;
        heroGreeting.style.display = 'inline-flex';
      } else {
        heroGreeting.style.display = 'none';
      }
    }
  }
});
