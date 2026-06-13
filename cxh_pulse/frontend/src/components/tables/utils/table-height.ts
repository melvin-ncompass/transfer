export function calculateTableMaxHeight(
    slicedLength: number,
    renderExpandedRow: ((row: any) => React.ReactNode) | undefined,
    expandedRowsSize: number,
    notFound: boolean,
    isEmpty: boolean
): string {
    const headerHeight = 56;
    const rowHeight = 68;

    if (notFound || isEmpty) {
        return '68';
    }

    let calculatedHeight = headerHeight + (slicedLength * rowHeight);

    if (renderExpandedRow && expandedRowsSize > 0) {
        const expandedContentHeight = expandedRowsSize * 150;
        calculatedHeight += expandedContentHeight;
    }

    return `${Math.min(calculatedHeight, 600)}px`;
}

export function shouldEnableScrolling(
    slicedLength: number,
    renderExpandedRow: ((row: any) => React.ReactNode) | undefined,
    expandedRowsSize: number,
    notFound: boolean,
    isEmpty: boolean
): boolean {
    if (notFound || isEmpty) {
        return false;
    }

    if (slicedLength === 0) {
        return false;
    }

    if (renderExpandedRow && expandedRowsSize > 0) {
        return true;
    }

    const headerHeight = 56;
    const rowHeight = 68;
    const calculatedHeight = headerHeight + (slicedLength * rowHeight);
    return calculatedHeight > 600;
}

