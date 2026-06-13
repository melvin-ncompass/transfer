import type { DataTableColumn } from '../../../types';

export function sortRows<Row>(
    rows: Row[],
    orderBy: string,
    order: 'asc' | 'desc',
    columns: DataTableColumn[],
    sortFn?: (a: Row, b: Row, orderBy: string, order: 'asc' | 'desc') => number,
    renderCells?: (row: Row) => React.ReactNode[]
): Row[] {
    if (!orderBy) return rows;

    return [...rows].sort((a, b) => {
        if (sortFn) {
            return sortFn(a, b, orderBy, order);
        }

        let aValue: string | number;
        let bValue: string | number;

        const column = columns.find((col) => col.id === orderBy);
        if (column?.valueGetter) {
            aValue = column.valueGetter(a);
            bValue = column.valueGetter(b);
        } else if (renderCells) {
            const aCells = renderCells(a);
            const bCells = renderCells(b);
            const colIndex = columns.findIndex((col) => col.id === orderBy);
            aValue = aCells[colIndex] as string | number;
            bValue = bCells[colIndex] as string | number;
        } else {
            return 0;
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }

        const aNum = typeof aValue === 'number' ? aValue : parseFloat(String(aValue));
        const bNum = typeof bValue === 'number' ? bValue : parseFloat(String(bValue));

        if (isNaN(aNum) || isNaN(bNum)) {
            return order === 'asc'
                ? String(aValue).localeCompare(String(bValue))
                : String(bValue).localeCompare(String(aValue));
        }

        return order === 'asc' ? aNum - bNum : bNum - aNum;
    });
}

