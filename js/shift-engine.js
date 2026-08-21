/**
 * DAWAMI - Core Shift Calculation & Prediction Engine
 */

const SHIFT_TYPES = {
  WORK_DAY: {
    id: 'WORK_DAY',
    nameAr: 'وردية صباحية (8 ساعات)',
    nameEn: 'Day Shift (8h)',
    code: 'D',
    isWork: true,
    startTime: '08:00',
    endTime: '16:00',
    hours: 8,
    colorClass: 'pill-day',
    dotClass: 'dot-work'
  },
  WORK_EVENING: {
    id: 'WORK_EVENING',
    nameAr: 'وردية مسائية (8 ساعات)',
    nameEn: 'Evening Shift (8h)',
    code: 'E',
    isWork: true,
    startTime: '16:00',
    endTime: '00:00',
    hours: 8,
    colorClass: 'pill-eve',
    dotClass: 'dot-eve'
  },
  WORK_NIGHT: {
    id: 'WORK_NIGHT',
    nameAr: 'وردية ليلية (8 ساعات)',
    nameEn: 'Night Shift (8h)',
    code: 'N',
    isWork: true,
    startTime: '00:00',
    endTime: '08:00',
    hours: 8,
    colorClass: 'pill-night',
    dotClass: 'dot-night'
  },
  WORK_12H_DAY: {
    id: 'WORK_12H_DAY',
    nameAr: 'دوام 12 ساعة (نهار)',
    nameEn: '12-Hour Day Shift',
    code: '12D',
    isWork: true,
    startTime: '07:00',
    endTime: '19:00',
    hours: 12,
    colorClass: 'pill-day12',
    dotClass: 'dot-day12'
  },
  WORK_12H_NIGHT: {
    id: 'WORK_12H_NIGHT',
    nameAr: 'دوام 12 ساعة (ليل)',
    nameEn: '12-Hour Night Shift',
    code: '12N',
    isWork: true,
    startTime: '19:00',
    endTime: '07:00',
    hours: 12,
    colorClass: 'pill-night12',
    dotClass: 'dot-night12'
  },
  WORK_6H: {
    id: 'WORK_6H',
    nameAr: 'دوام 6 ساعات (جزئي/رمضان)',
    nameEn: '6-Hour Shift',
    code: '6H',
    isWork: true,
    startTime: '09:00',
    endTime: '15:00',
    hours: 6,
    colorClass: 'pill-work6',
    dotClass: 'dot-work'
  },
  OFF: {
    id: 'OFF',
    nameAr: 'راحة / إجازة',
    nameEn: 'Day Off / Rest',
    code: 'O',
    isWork: false,
    startTime: null,
    endTime: null,
    hours: 0,
    colorClass: 'pill-off',
    dotClass: 'dot-off'
  },
  ANNUAL_LEAVE: {
    id: 'ANNUAL_LEAVE',
    nameAr: 'إجازة سنوية / اعتيادية',
    nameEn: 'Annual Leave',
    code: 'L',
    isWork: false,
    startTime: null,
    endTime: null,
    hours: 0,
    colorClass: 'pill-leave',
    dotClass: 'dot-leave'
  },
  SICK_LEAVE: {
    id: 'SICK_LEAVE',
    nameAr: 'إجازة مرضية',
    nameEn: 'Sick Leave',
    code: 'S',
    isWork: false,
    startTime: null,
    endTime: null,
    hours: 0,
    colorClass: 'pill-leave',
    dotClass: 'dot-leave'
  },
  DUTY_24H: {
    id: 'DUTY_24H',
    nameAr: 'استلام كامل (24 ساعة)',
    nameEn: '24-Hour Duty',
    code: '24H',
    isWork: true,
    startTime: '08:00',
    endTime: '08:00',
    hours: 24,
    colorClass: 'pill-duty24',
    dotClass: 'dot-duty24'
  },
  OVERTIME: {
    id: 'OVERTIME',
    nameAr: 'تغطية إضافية (Overtime)',
    nameEn: 'Overtime Coverage',
    code: 'OT',
    isWork: true,
    startTime: '08:00',
    endTime: '16:00',
    hours: 8,
    colorClass: 'pill-overtime',
    dotClass: 'dot-swap'
  }
};

const PRESETS = [
  {
    id: 'preset_weekly_sa',
    nameAr: 'دوام أسبوعي رسمي (الأحد - الخميس)',
    nameEn: 'Standard Weekly (Sun - Thu)',
    type: 'weekly',
    workDays: [0, 1, 2, 3, 4], // 0=Sun, 4=Thu
    startTime: '08:00',
    endTime: '16:00',
    descAr: '5 أيام عمل ويومان عطلة (الجمعة والسبت) - المتبع في الدوائر الحكومية والشركات',
    descEn: '5 days work and 2 days off (Fri & Sat)'
  },
  {
    id: 'preset_24_48',
    nameAr: 'نظام 24 / 48 (استلام 24 ساعة / يومين راحة)',
    nameEn: '24 / 48 Shift (24h Duty / 2 Off)',
    type: 'rotation',
    pattern: ['24H', 'O', 'O'],
    shiftConfigs: {
      '24H': SHIFT_TYPES.DUTY_24H,
      'O': SHIFT_TYPES.OFF
    },
    descAr: 'استلام 24 ساعة متبوعاً بيومين راحة - شائع في القطاع العسكري، الدفاع المدني، الأمن، والطوارئ',
    descEn: '24h duty followed by 2 days off'
  },
  {
    id: 'preset_24_72',
    nameAr: 'نظام 24 / 72 (استلام 24 ساعة / 3 أيام راحة)',
    nameEn: '24 / 72 Shift (24h Duty / 3 Off)',
    type: 'rotation',
    pattern: ['24H', 'O', 'O', 'O'],
    shiftConfigs: {
      '24H': SHIFT_TYPES.DUTY_24H,
      'O': SHIFT_TYPES.OFF
    },
    descAr: 'استلام يوم كامل 24 ساعة يليه 3 أيام راحة متتالية',
    descEn: '24 hours duty followed by 3 days off'
  },
  {
    id: 'preset_24_24',
    nameAr: 'نظام 24 / 24 (استلام يوم كامل / يوم راحة - يوم بيوم)',
    nameEn: '24 / 24 Shift (24h On / 24h Off)',
    type: 'rotation',
    pattern: ['24H', 'O'],
    shiftConfigs: {
      '24H': SHIFT_TYPES.DUTY_24H,
      'O': SHIFT_TYPES.OFF
    },
    descAr: 'مناوبة 24 ساعة تليها 24 ساعة راحة بالتناوب المستمر',
    descEn: '24h on, 24h off rotation'
  },
  {
    id: 'preset_12h_222',
    nameAr: 'نظام 12 ساعة (2 نهار / 2 ليل / 2 راحة)',
    nameEn: '12h Shift (2 Day / 2 Night / 2 Off)',
    type: 'rotation',
    pattern: ['D', 'D', 'N', 'N', 'O', 'O'],
    shiftConfigs: {
      'D': { ...SHIFT_TYPES.WORK_DAY, nameAr: 'صباحي 12 ساعة', hours: 12, startTime: '07:00', endTime: '19:00' },
      'N': { ...SHIFT_TYPES.WORK_NIGHT, nameAr: 'ليلي 12 ساعة', hours: 12, startTime: '19:00', endTime: '07:00' },
      'O': SHIFT_TYPES.OFF
    },
    descAr: 'شائع في قطاعات التمريض، المصانع، ومراكز العمليات',
    descEn: '2 Days (12h), 2 Nights (12h), 2 Off'
  },
  {
    id: 'preset_12h_224',
    nameAr: 'نظام 12 ساعة المريح (2 نهار / 2 ليل / 4 راحة)',
    nameEn: '12h Shift (2 Day / 2 Night / 4 Off)',
    type: 'rotation',
    pattern: ['D', 'D', 'N', 'N', 'O', 'O', 'O', 'O'],
    shiftConfigs: {
      'D': { ...SHIFT_TYPES.WORK_DAY, nameAr: 'صباحي 12 ساعة', hours: 12, startTime: '07:00', endTime: '19:00' },
      'N': { ...SHIFT_TYPES.WORK_NIGHT, nameAr: 'ليلي 12 ساعة', hours: 12, startTime: '19:00', endTime: '07:00' },
      'O': SHIFT_TYPES.OFF
    },
    descAr: '4 أيام عمل و 4 أيام راحة بنظام 12 ساعة',
    descEn: '4 on, 4 off with 12h shifts'
  },
  {
    id: 'preset_7_7',
    nameAr: 'أسبوع بأسبوع (7 دوام / 7 راحة)',
    nameEn: '7 On / 7 Off (Week On / Week Off)',
    type: 'rotation',
    pattern: ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'O', 'O', 'O', 'O', 'O', 'O', 'O'],
    shiftConfigs: {
      'D': { ...SHIFT_TYPES.WORK_DAY, nameAr: 'دوام موقع 12 ساعة', hours: 12, startTime: '06:00', endTime: '18:00' },
      'O': SHIFT_TYPES.OFF
    },
    descAr: 'النظام الأشهر في شركات النفط، التعدين، والمشاريع الإنشائية النائية',
    descEn: 'Common in Oil & Gas and remote engineering sites'
  },
  {
    id: 'preset_14_14',
    nameAr: 'نظام 14 / 14 (أسبوعين دوام / أسبوعين راحة)',
    nameEn: '14 On / 14 Off',
    type: 'rotation',
    pattern: [
      'D','D','D','D','D','D','D','D','D','D','D','D','D','D',
      'O','O','O','O','O','O','O','O','O','O','O','O','O','O'
    ],
    shiftConfigs: {
      'D': { ...SHIFT_TYPES.WORK_DAY, nameAr: 'دوام موقع 12 ساعة', hours: 12, startTime: '06:00', endTime: '18:00' },
      'O': SHIFT_TYPES.OFF
    },
    descAr: 'المعتمد في منصات الحفر البحرية والمناطق البعيدة',
    descEn: '14 consecutive working days followed by 14 days off'
  },
  {
    id: 'preset_4_4',
    nameAr: 'نظام 4 / 4 (4 دوام / 4 راحة)',
    nameEn: '4 On / 4 Off',
    type: 'rotation',
    pattern: ['D', 'D', 'D', 'D', 'O', 'O', 'O', 'O'],
    shiftConfigs: {
      'D': { ...SHIFT_TYPES.WORK_DAY, nameAr: 'دوام 12 ساعة', hours: 12, startTime: '07:00', endTime: '19:00' },
      'O': SHIFT_TYPES.OFF
    },
    descAr: 'تناوب مريح بـ 4 أيام متتالية عمل و 4 أيام راحة',
    descEn: '4 days on, 4 days off'
  },
  {
    id: 'preset_3_rot',
    nameAr: 'الورديات الثلاثية المتتابعة (نهار / مساء / ليل / راحة)',
    nameEn: '3-Shift Continuous (Day / Eve / Night / Off)',
    type: 'rotation',
    pattern: ['D', 'E', 'N', 'O'],
    shiftConfigs: {
      'D': SHIFT_TYPES.WORK_DAY,
      'E': SHIFT_TYPES.WORK_EVENING,
      'N': SHIFT_TYPES.WORK_NIGHT,
      'O': SHIFT_TYPES.OFF
    },
    descAr: 'تغطية مستمرة على مدار الساعة بنظام 8 ساعات لكل وردية',
    descEn: 'Continuous 24/7 8-hour shift coverage'
  }
];

class ShiftEngine {
  constructor(config = null, overrides = {}) {
    this.config = config || this.getDefaultConfig();
    this.overrides = overrides || {};
  }

  getDefaultConfig() {
    return {
      type: 'preset', // 'weekly', 'preset', 'custom'
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
        anchorDate: '2026-08-01',
        shiftConfigs: {
          'D': SHIFT_TYPES.WORK_DAY,
          'E': SHIFT_TYPES.WORK_EVENING,
          'N': SHIFT_TYPES.WORK_NIGHT,
          'O': SHIFT_TYPES.OFF
        }
      }
    };
  }

  /**
   * Normalize date to YYYY-MM-DD string at midnight UTC/local
   */
  formatDateKey(date) {
    if (typeof date === 'string') return date.slice(0, 10);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  parseDateKey(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d, 0, 0, 0);
  }

  /**
   * Calculate shift details for any given date
   */
  getShiftForDate(date) {
    const dateObj = typeof date === 'string' ? this.parseDateKey(date) : new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dateKey = this.formatDateKey(dateObj);

    // 1. Check for manual overrides / shift swaps
    if (this.overrides[dateKey]) {
      const ov = this.overrides[dateKey];
      if (ov.type !== 'DEFAULT') {
        const baseShift = SHIFT_TYPES[ov.type] || SHIFT_TYPES.OFF;
        return {
          dateKey,
          dateObj,
          type: ov.type,
          name: ov.type === 'OFF' ? 'راحة (معدلة)' : baseShift.nameAr,
          nameEn: baseShift.nameEn,
          isWork: baseShift.isWork,
          startTime: baseShift.startTime,
          endTime: baseShift.endTime,
          hours: baseShift.hours,
          colorClass: baseShift.colorClass,
          dotClass: baseShift.dotClass,
          isOverride: true,
          overrideNote: ov.note || ''
        };
      }
    }

    // 2. Weekly Fixed Schedule
    if (this.config.type === 'weekly') {
      const dayOfWeek = dateObj.getDay(); // 0=Sun .. 6=Sat
      const isWork = this.config.weekly.workDays.includes(dayOfWeek);

      if (isWork) {
        return {
          dateKey,
          dateObj,
          type: 'WORK_DAY',
          name: this.config.weekly.title || 'دوام رسمي',
          nameEn: 'Regular Work',
          isWork: true,
          startTime: this.config.weekly.startTime || '08:00',
          endTime: this.config.weekly.endTime || '16:00',
          hours: this.calcHours(this.config.weekly.startTime, this.config.weekly.endTime) || 8,
          colorClass: 'pill-work',
          dotClass: 'dot-work',
          isOverride: false,
          overrideNote: ''
        };
      } else {
        return {
          dateKey,
          dateObj,
          type: 'OFF',
          name: 'عطلة أسبوعية',
          nameEn: 'Weekend Off',
          isWork: false,
          startTime: null,
          endTime: null,
          hours: 0,
          colorClass: 'pill-off',
          dotClass: 'dot-off',
          isOverride: false,
          overrideNote: ''
        };
      }
    }

    // 3. Preset Rotation
    if (this.config.type === 'preset') {
      const preset = PRESETS.find(p => p.id === this.config.presetId) || PRESETS[0];
      if (preset.type === 'weekly') {
        const dayOfWeek = dateObj.getDay();
        const isWork = preset.workDays.includes(dayOfWeek);
        return isWork ? {
          dateKey,
          dateObj,
          type: 'WORK_DAY',
          name: 'دوام رسمي',
          nameEn: 'Work Day',
          isWork: true,
          startTime: preset.startTime,
          endTime: preset.endTime,
          hours: 8,
          colorClass: 'pill-work',
          dotClass: 'dot-work',
          isOverride: false,
          overrideNote: ''
        } : {
          dateKey,
          dateObj,
          type: 'OFF',
          name: 'عطلة أسبوعية',
          nameEn: 'Weekend Off',
          isWork: false,
          startTime: null,
          endTime: null,
          hours: 0,
          colorClass: 'pill-off',
          dotClass: 'dot-off',
          isOverride: false,
          overrideNote: ''
        };
      }

      const anchor = this.parseDateKey(this.config.anchorDate || '2026-08-01');
      const diffTime = dateObj.getTime() - anchor.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      const patternLen = preset.pattern.length;
      const patternIndex = ((diffDays % patternLen) + patternLen) % patternLen;
      const shiftCode = preset.pattern[patternIndex];
      const shiftConf = preset.shiftConfigs[shiftCode] || SHIFT_TYPES.OFF;

      return {
        dateKey,
        dateObj,
        type: shiftConf.id,
        code: shiftCode,
        name: shiftConf.nameAr,
        nameEn: shiftConf.nameEn,
        isWork: shiftConf.isWork,
        startTime: shiftConf.startTime,
        endTime: shiftConf.endTime,
        hours: shiftConf.hours || (shiftConf.isWork ? 8 : 0),
        colorClass: shiftConf.colorClass,
        dotClass: shiftConf.dotClass,
        patternIndex,
        isOverride: false,
        overrideNote: ''
      };
    }

    // 4. Custom Rotation Pattern
    if (this.config.type === 'custom') {
      const custom = this.config.custom;
      const pattern = custom.pattern && custom.pattern.length > 0 ? custom.pattern : ['D', 'O'];
      const anchor = this.parseDateKey(custom.anchorDate || '2026-08-01');
      const diffTime = dateObj.getTime() - anchor.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      const patternLen = pattern.length;
      const patternIndex = ((diffDays % patternLen) + patternLen) % patternLen;
      const rawItem = pattern[patternIndex];

      const defaultShiftMapping = {
        '24H': SHIFT_TYPES.DUTY_24H,
        '24': SHIFT_TYPES.DUTY_24H,
        'F': SHIFT_TYPES.DUTY_24H,
        '12D': SHIFT_TYPES.WORK_12H_DAY,
        '12N': SHIFT_TYPES.WORK_12H_NIGHT,
        '12': SHIFT_TYPES.WORK_12H_DAY,
        '8D': SHIFT_TYPES.WORK_DAY,
        '8E': SHIFT_TYPES.WORK_EVENING,
        '8N': SHIFT_TYPES.WORK_NIGHT,
        '6H': SHIFT_TYPES.WORK_6H,
        '6': SHIFT_TYPES.WORK_6H,
        'D': SHIFT_TYPES.WORK_DAY,
        'E': SHIFT_TYPES.WORK_EVENING,
        'N': SHIFT_TYPES.WORK_NIGHT,
        'O': SHIFT_TYPES.OFF,
        'L': SHIFT_TYPES.ANNUAL_LEAVE,
        'S': SHIFT_TYPES.SICK_LEAVE,
        'OT': SHIFT_TYPES.OVERTIME
      };

      let shiftConf;
      let shiftCode;

      if (typeof rawItem === 'object' && rawItem !== null) {
        shiftCode = rawItem.code || rawItem.type || 'D';
        const baseConf = SHIFT_TYPES[rawItem.type] || defaultShiftMapping[shiftCode] || (rawItem.isWork ? SHIFT_TYPES.WORK_DAY : SHIFT_TYPES.OFF);
        
        let calculatedHours = rawItem.hours;
        if (calculatedHours === undefined && rawItem.startTime && rawItem.endTime) {
          calculatedHours = this.calcHours(rawItem.startTime, rawItem.endTime);
        }

        shiftConf = {
          ...baseConf,
          ...rawItem,
          id: rawItem.type || baseConf.id,
          nameAr: rawItem.title || rawItem.nameAr || baseConf.nameAr,
          nameEn: rawItem.nameEn || baseConf.nameEn,
          startTime: rawItem.startTime !== undefined ? rawItem.startTime : baseConf.startTime,
          endTime: rawItem.endTime !== undefined ? rawItem.endTime : baseConf.endTime,
          hours: calculatedHours !== undefined ? calculatedHours : (baseConf.hours || (baseConf.isWork ? 8 : 0)),
          isWork: rawItem.isWork !== undefined ? rawItem.isWork : baseConf.isWork,
          colorClass: rawItem.colorClass || baseConf.colorClass || (rawItem.isWork ? 'pill-work' : 'pill-off'),
          dotClass: rawItem.dotClass || baseConf.dotClass || (rawItem.isWork ? 'dot-work' : 'dot-off')
        };
      } else {
        shiftCode = rawItem;
        shiftConf = (custom.shiftConfigs && custom.shiftConfigs[shiftCode]) || defaultShiftMapping[shiftCode] || SHIFT_TYPES.OFF;
      }

      return {
        dateKey,
        dateObj,
        type: shiftConf.id,
        code: shiftCode,
        name: shiftConf.nameAr,
        nameEn: shiftConf.nameEn,
        isWork: shiftConf.isWork,
        startTime: shiftConf.startTime,
        endTime: shiftConf.endTime,
        hours: shiftConf.hours || (shiftConf.isWork ? 8 : 0),
        colorClass: shiftConf.colorClass,
        dotClass: shiftConf.dotClass,
        patternIndex,
        isOverride: false,
        overrideNote: ''
      };
    }

    return {
      dateKey,
      dateObj,
      type: 'OFF',
      name: 'راحة',
      nameEn: 'Off',
      isWork: false,
      hours: 0,
      colorClass: 'pill-off',
      dotClass: 'dot-off',
      isOverride: false,
      overrideNote: ''
    };
  }

  calcHours(start, end) {
    if (!start || !end) return 0;
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    let diff = (eH + eM / 60) - (sH + sM / 60);
    if (diff <= 0) diff += 24; // spans midnight
    return Math.round(diff * 10) / 10;
  }

  /**
   * Find next work event or shift completion
   */
  getNextEventInfo(now = new Date()) {
    const todayShift = this.getShiftForDate(now);
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const tomorrowShift = this.getShiftForDate(tomorrow);

    // Look ahead up to 60 days to find next work shift
    let nextWorkDate = null;
    let nextWorkShift = null;

    for (let i = 0; i <= 60; i++) {
      const futureDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      const shift = this.getShiftForDate(futureDate);
      if (shift.isWork) {
        // If today is work, check if shift has not passed yet or if tomorrow is work
        if (i === 0) {
          nextWorkDate = futureDate;
          nextWorkShift = shift;
          break;
        } else {
          nextWorkDate = futureDate;
          nextWorkShift = shift;
          break;
        }
      }
    }

    return {
      todayShift,
      tomorrowShift,
      nextWorkDate,
      nextWorkShift
    };
  }

  /**
   * Calculate the length of the nearest consecutive days off streak starting on or after today
   */
  getNextOffStreak(startDate = new Date()) {
    let streak = 0;
    let foundFirstOff = false;

    for (let i = 0; i < 90; i++) {
      const d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
      const shift = this.getShiftForDate(d);
      if (!shift.isWork) {
        foundFirstOff = true;
        streak++;
      } else if (foundFirstOff) {
        // streak finished
        break;
      }
    }
    return streak;
  }
}

// Attach to window
window.ShiftEngine = ShiftEngine;
window.SHIFT_TYPES = SHIFT_TYPES;
window.PRESETS = PRESETS;
