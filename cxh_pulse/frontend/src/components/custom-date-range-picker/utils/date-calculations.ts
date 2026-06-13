export interface MonthOption {
    value: number;
    label: string;
}

export const MONTHS: MonthOption[] = [
    { value: 0, label: 'Jan' },
    { value: 1, label: 'Feb' },
    { value: 2, label: 'Mar' },
    { value: 3, label: 'Apr' },
    { value: 4, label: 'May' },
    { value: 5, label: 'Jun' },
    { value: 6, label: 'Jul' },
    { value: 7, label: 'Aug' },
    { value: 8, label: 'Sep' },
    { value: 9, label: 'Oct' },
    { value: 10, label: 'Nov' },
    { value: 11, label: 'Dec' },
];

export function calculateTotalMonths(
    minYear: number,
    maxYear: number,
    effectiveMinMonth: number,
    effectiveMaxMonth: number
): number {
    if (maxYear === minYear) {
        return effectiveMaxMonth - effectiveMinMonth + 1;
    }
    const firstYearMonths = 12 - effectiveMinMonth;
    const middleYears = Math.max(0, maxYear - minYear - 1);
    const middleYearMonths = middleYears * 12;
    const lastYearMonths = effectiveMaxMonth + 1;
    return firstYearMonths + middleYearMonths + lastYearMonths;
}

export function getMonthIndex(
    date: Date,
    minYear: number,
    maxYear: number,
    effectiveMinMonth: number,
    effectiveMaxMonth: number
): number {
    const year = date.getFullYear();
    const month = date.getMonth();

    if (year < minYear || year > maxYear) {
        return -1;
    }

    if (year === minYear) {
        if (month < effectiveMinMonth) return -1;
        return month - effectiveMinMonth;
    }

    if (year === maxYear) {
        if (month > effectiveMaxMonth) return -1;
        const firstYearMonths = 12 - effectiveMinMonth;
        const middleYears = Math.max(0, year - minYear - 1);
        const middleYearMonths = middleYears * 12;
        return firstYearMonths + middleYearMonths + month;
    }

    const firstYearMonths = 12 - effectiveMinMonth;
    const yearsBefore = year - minYear - 1;
    const middleYearMonths = yearsBefore * 12;
    return firstYearMonths + middleYearMonths + month;
}

export function getDateFromIndex(
    index: number,
    minYear: number,
    maxYear: number,
    effectiveMinMonth: number,
    effectiveMaxMonth: number,
    totalMonths: number
): Date {
    if (index < 0 || index >= totalMonths) {
        if (index < 0) {
            return new Date(minYear, effectiveMinMonth, 1);
        }
        return new Date(maxYear, effectiveMaxMonth, 1);
    }

    const firstYearMonths = 12 - effectiveMinMonth;
    if (index < firstYearMonths) {
        return new Date(minYear, effectiveMinMonth + index, 1);
    }

    const middleYears = Math.max(0, maxYear - minYear - 1);
    const middleYearMonths = middleYears * 12;
    const remainingAfterFirstYear = index - firstYearMonths;

    if (remainingAfterFirstYear < middleYearMonths) {
        const yearOffset = Math.floor(remainingAfterFirstYear / 12);
        const month = remainingAfterFirstYear % 12;
        return new Date(minYear + 1 + yearOffset, month, 1);
    }

    const lastYearIndex = remainingAfterFirstYear - middleYearMonths;
    if (lastYearIndex <= effectiveMaxMonth) {
        return new Date(maxYear, lastYearIndex, 1);
    }

    return new Date(maxYear, effectiveMaxMonth, 1);
}

export function formatDate(date: Date): string {
    return `${MONTHS[date.getMonth()].label} ${date.getFullYear()}`;
}

