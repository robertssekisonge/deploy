/**
 * Ugandan National Holidays Utility
 * Calculates school days by eliminating weekends and public holidays
 */

export interface UgandanHoliday {
  date: string; // YYYY-MM-DD format
  name: string;
  type: 'fixed' | 'variable';
  description: string;
}

// Ugandan Public Holidays 2025
export const UGANDAN_HOLIDAYS_2025: UgandanHoliday[] = [
  // Fixed holidays
  { date: '2025-01-01', name: 'New Year\'s Day', type: 'fixed', description: 'National holiday marking the start of the new year' },
  { date: '2025-01-26', name: 'NRM Liberation Day', type: 'fixed', description: 'Commemorates the National Resistance Movement\'s liberation struggle' },
  { date: '2025-02-16', name: 'Archbishop Janani Luwum Memorial Day', type: 'fixed', description: 'Honors Archbishop Janani Luwum, a martyr for human rights' },
  { date: '2025-03-08', name: 'International Women\'s Day', type: 'fixed', description: 'Celebrates women\'s achievements and rights' },
  { date: '2025-03-30', name: 'Eid al-Fitr', type: 'variable', description: 'Islamic holiday marking the end of Ramadan (dates may vary)' },
  { date: '2025-04-18', name: 'Good Friday', type: 'variable', description: 'Christian religious holiday marking Christ\'s crucifixion' },
  { date: '2025-04-21', name: 'Easter Monday', type: 'variable', description: 'Day after Easter Sunday' },
  { date: '2025-05-01', name: 'Labour Day', type: 'fixed', description: 'International Workers\' Day' },
  { date: '2025-06-03', name: 'Uganda Martyrs\' Day', type: 'fixed', description: 'Commemorates Ugandan Christian martyrs' },
  { date: '2025-06-06', name: 'Eid al-Adha', type: 'variable', description: 'Islamic holiday of sacrifice (dates may vary)' },
  { date: '2025-06-09', name: 'National Heroes\' Day', type: 'fixed', description: 'Honors national heroes' },
  { date: '2025-10-09', name: 'Independence Day', type: 'fixed', description: 'Uganda\'s Independence from Britain in 1962' },
  { date: '2025-12-25', name: 'Christmas Day', type: 'fixed', description: 'Christian celebration of Christ\'s birth' },
  { date: '2025-12-26', name: 'Boxing Day', type: 'fixed', description: 'Public holiday the day after Christmas' }
];

export interface SchoolDaysInfo {
  totalDaysInTerm: number;
  weekendDays: number;
  publicHolidayDays: number;
  schoolDays: number;
  holidays: UgandanHoliday[];
  termStart: Date;
  termEnd: Date;
  currentDayOfTerm: number;
  daysCompleted: number;
  daysRemaining: number;
}

/**
 * Calculate school days for a given term
 */
export function calculateSchoolDays(
  termStart: Date,
  termEnd: Date,
  year: number = new Date().getFullYear()
): SchoolDaysInfo {
  const holidays = UGANDAN_HOLIDAYS_2025.filter(holiday => 
    new Date(holiday.date).getFullYear() === year
  );

  let totalDaysInTerm = 0;
  let weekendDays = 0;
  let publicHolidayDays = 0;

  // Count total days in term
  for (let d = new Date(termStart); d <= termEnd; d.setDate(d.getDate() + 1)) {
    totalDaysInTerm++;

    const dayOfWeek = d.getDay();
    // Check if it's weekend (Saturday = 6, Sunday = 0)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekendDays++;
    } else {
      // Check if it's a public holiday (excluding weekends)
      const dateString = formatDateString(d);
      const isHoliday = holidays.some(holiday => holiday.date === dateString);
      if (isHoliday) {
        publicHolidayDays++;
      }
    }
  }

  const schoolDays = totalDaysInTerm - weekendDays - publicHolidayDays;

  // Calculate current progress
  const today = new Date();
  const currentDayOfTerm = today >= termStart && today <= termEnd ? Math.floor((today.getTime() - termStart.getTime()) / (1000 * 60 * 60 * 24)) + 1 : 0;
  
  let daysCompleted = 0;
  let daysRemaining = schoolDays;

  if (today >= termStart && today <= termEnd) {
    for (let d = new Date(termStart); d <= Math.min(today, termEnd); d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      const dateString = formatDateString(d);
      const isHoliday = holidays.some(holiday => holiday.date === dateString);
      
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !isHoliday) {
        daysCompleted++;
      }
    }
    daysRemaining = schoolDays - daysCompleted;
  }

  return {
    totalDaysInTerm,
    weekendDays,
    publicHolidayDays,
    schoolDays,
    holidays: holidays.filter(h => {
      const holidayDate = new Date(h.date);
      return holidayDate >= termStart && holidayDate <= termEnd;
    }),
    termStart,
    termEnd,
    currentDayOfTerm,
    daysCompleted,
    daysRemaining
  };
}

/**
 * Get term dates based on current term and year
 */
export function getTermDates(term: string, year: number): { start: Date; end: Date } {
  switch (term) {
    case 'Term 1':
      return {
        start: new Date(year, 0, 15), // January 15th
        end: new Date(year, 3, 30)    // April 30th
      };
    case 'Term 2':
      return {
        start: new Date(year, 4, 15), // May 15th
        end: new Date(year, 7, 30)    // August 30th
      };
    case 'Term 3':
      return {
        start: new Date(year, 8, 15), // September 15th
        end: new Date(year, 11, 30)   // December 30th
      };
    default:
      // Default to Term 1 dates
      return {
        start: new Date(year, 0, 15),
        end: new Date(year, 3, 30)
      };


  }
}

/**
 * Format date as YYYY-MM-DD string
 */
export function formatDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Format date for display (DD MMM YYYY)
 */
export function formatDateDisplay(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-GB', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });
}

/**
 * Check if a date is a school day (not weekend, not holiday)
 */
export function isSchoolDay(date: Date, year: number = 2025): boolean {
  const dayOfWeek = date.getDay();
  
  // Check for weekends
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false;
  }

  // Check for holidays
  const dateString = formatDateString(date);
  const holidays = UGANDAN_HOLIDAYS_2025.filter(holiday => 
    new Date(holiday.date).getFullYear() === year
  );
  
  return !holidays.some(holiday => holiday.date === dateString);
}

/**
 * Get all holidays for a specific year
 */
export function getHolidaysForYear(year: number): UgandanHoliday[] {
  return UGANDAN_HOLIDAYS_2025.filter(holiday => 
    new Date(holiday.date).getFullYear() === year
  );
}
