export const BOLD_OPEN = "{{b}}";
export const BOLD_CLOSE = "{{/b}}";

/** Wraps the description subject (employee name, config name, etc.) for bold rendering in the UI. */
export const boldSubject = (text: string): string =>
    `${BOLD_OPEN}${text}${BOLD_CLOSE}`;

/** Bold suffix for the description subject (department, template, employee name, etc.). */
export const subjectSuffix = (name: string | null | undefined): string =>
    name ? ` ${boldSubject(name)}` : "";

export const forEmployee = (name: string | null | undefined): string =>
    name ? ` for ${boldSubject(name)}` : "";

export const employeeSuffix = subjectSuffix;

export interface DescriptionSegment {
    text: string;
    bold?: boolean;
}

export const stripDescriptionMarkup = (text: string): string =>
    text.replace(/\{\{b\}\}/g, "").replace(/\{\{\/b\}\}/g, "");

export function parseDescriptionMarkup(text: string): DescriptionSegment[] {
    const parts: DescriptionSegment[] = [];
    const regex = /\{\{b\}\}([\s\S]*?)\{\{\/b\}\}/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push({ text: text.slice(lastIndex, match.index) });
        }
        parts.push({ text: match[1], bold: true });
        lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
        parts.push({ text: text.slice(lastIndex) });
    }

    if (parts.length === 0) {
        parts.push({ text });
    }

    return parts;
}

export function truncateDescriptionSegments(
    segments: DescriptionSegment[],
    maxLength: number,
): { segments: DescriptionSegment[]; truncated: boolean } {
    let length = 0;
    const result: DescriptionSegment[] = [];

    for (const segment of segments) {
        if (length >= maxLength) break;

        const remaining = maxLength - length;
        if (segment.text.length <= remaining) {
            result.push(segment);
            length += segment.text.length;
            continue;
        }

        result.push({ ...segment, text: segment.text.slice(0, remaining) });
        length = maxLength;
        return { segments: result, truncated: true };
    }

    const plain = segments.map((s) => s.text).join("");
    return { segments: result, truncated: length < plain.length };
}
