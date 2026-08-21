/**
 * DAWAMI - Exporter & Calendar Sync Module (.ICS, PDF/Print, JSON Backup)
 */

class Exporter {
  constructor(engine) {
    this.engine = engine;
  }

  /**
   * Generate iCalendar (.ics) format string for the next 90 days of work shifts
   */
  generateICS(daysCount = 90) {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Dawami//Work Shift Tracker//AR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:جدول دوامي (Dawami Schedule)',
      'X-WR-TIMEZONE:Asia/Riyadh'
    ];

    const startDate = new Date();

    for (let i = 0; i < daysCount; i++) {
      const d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
      const shift = this.engine.getShiftForDate(d);

      if (shift.isWork) {
        const dateKey = this.engine.formatDateKey(d).replace(/-/g, '');
        const uid = `dawami-${dateKey}-${Math.random().toString(36).substring(2, 9)}@dawami.app`;

        const startParts = (shift.startTime || '08:00').split(':');
        const endParts = (shift.endTime || '16:00').split(':');

        const sHour = startParts[0].padStart(2, '0');
        const sMin = startParts[1].padStart(2, '0');
        const eHour = endParts[0].padStart(2, '0');
        const eMin = endParts[1].padStart(2, '0');

        const dtStart = `${dateKey}T${sHour}${sMin}00`;
        let dtEnd = `${dateKey}T${eHour}${eMin}00`;

        // If end time is earlier or equal to start time, it spans into the next day
        if (parseInt(eHour) < parseInt(sHour) || (parseInt(eHour) === parseInt(sHour) && parseInt(eMin) <= parseInt(sMin))) {
          const nextDay = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
          const nextDateKey = this.engine.formatDateKey(nextDay).replace(/-/g, '');
          dtEnd = `${nextDateKey}T${eHour}${eMin}00`;
        }

        const summary = `${shift.name} - دوامي`;
        const description = `ساعات العمل: ${shift.startTime} إلى ${shift.endTime}\\nملاحظات: ${shift.overrideNote || 'دوام منتظم'}`;

        lines.push('BEGIN:VEVENT');
        lines.push(`UID:${uid}`);
        lines.push(`DTSTAMP:${this.formatICSDate(new Date())}`);
        lines.push(`DTSTART:${dtStart}`);
        lines.push(`DTEND:${dtEnd}`);
        lines.push(`SUMMARY:${summary}`);
        lines.push(`DESCRIPTION:${description}`);
        // Reminder Alarm 1 hour before
        lines.push('BEGIN:VALARM');
        lines.push('ACTION:DISPLAY');
        lines.push('DESCRIPTION:تذكير بموعد الدوام');
        lines.push('TRIGGER:-PT60M');
        lines.push('END:VALARM');
        lines.push('END:VEVENT');
      }
    }

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  formatICSDate(date) {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    const h = String(date.getUTCHours()).padStart(2, '0');
    const min = String(date.getUTCMinutes()).padStart(2, '0');
    const s = String(date.getUTCSeconds()).padStart(2, '0');
    return `${y}${m}${d}T${h}${min}${s}Z`;
  }

  /**
   * Trigger direct file download
   */
  downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Export schedule as .ics file
   */
  exportToICS() {
    const icsContent = this.generateICS(90);
    const fileName = `dawami-schedule-${this.engine.formatDateKey(new Date())}.ics`;
    this.downloadFile(icsContent, fileName, 'text/calendar;charset=utf-8');
  }

  /**
   * Export all data as JSON Backup
   */
  exportBackupJSON(config, overrides) {
    const backupData = {
      app: 'Dawami',
      version: '2.0',
      exportedAt: new Date().toISOString(),
      config,
      overrides
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const fileName = `dawami-backup-${this.engine.formatDateKey(new Date())}.json`;
    this.downloadFile(jsonStr, fileName, 'application/json;charset=utf-8');
  }
}

// Attach to window
window.Exporter = Exporter;
