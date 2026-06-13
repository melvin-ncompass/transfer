import { Box, Typography } from "@mui/material";
import { Tooltip } from "../../../../components/atom/tooltip";
import {
    parseDescriptionMarkup,
    stripDescriptionMarkup,
    truncateDescriptionSegments,
    type DescriptionSegment,
} from "./descriptionMarkup";

interface ActivityDescriptionTextProps {
    text: string;
    maxLength?: number;
}

function renderSegments(segments: DescriptionSegment[]) {
    return segments.map((segment, index) =>
        segment.bold ? (
            <Box
                key={index}
                component="span"
                sx={{ fontWeight: 600, color: "text.primary" }}
            >
                {segment.text}
            </Box>
        ) : (
            <Box key={index} component="span">
                {segment.text}
            </Box>
        ),
    );
}

export function ActivityDescriptionText({ text, maxLength = 60 }: ActivityDescriptionTextProps) {
    const segments = parseDescriptionMarkup(text);
    const plain = stripDescriptionMarkup(text);
    const { segments: displaySegments, truncated } = truncateDescriptionSegments(segments, maxLength);

    const content = (
        <Typography
            variant="body2"
            color="text.secondary"
            noWrap
            sx={{ fontSize: "0.8125rem", flexShrink: 1, minWidth: 0 }}
            component="span"
        >
            {renderSegments(truncated ? displaySegments : segments)}
            {truncated ? "…" : null}
        </Typography>
    );

    if (!truncated) {
        return content;
    }

    return (
        <Tooltip
            title={
                <Typography variant="body2" component="span" sx={{ fontSize: "0.8125rem" }}>
                    {renderSegments(segments)}
                </Typography>
            }
            arrow
            placement="top"
        >
            <Box
                component="span"
                sx={{
                    display: "inline-flex",
                    minWidth: 0,
                    overflow: "hidden",
                    cursor: "default",
                }}
                aria-label={plain}
            >
                {content}
            </Box>
        </Tooltip>
    );
}
