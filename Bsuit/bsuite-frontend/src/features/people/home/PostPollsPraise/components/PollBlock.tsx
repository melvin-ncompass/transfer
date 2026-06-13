import { useEffect, useState } from "react";
import { Box, Typography, LinearProgress } from "@mui/material";
import type { FeedPoll, PollOption } from "../api/announcements.api";
import { useVotePollMutation } from "../api/announcements.api";

interface PollBlockProps {
    poll: FeedPoll;
    currentUserId: number | null;
}

function PollBlock({ poll, currentUserId }: PollBlockProps) {
    const [votePoll] = useVotePollMutation();

    const findVotedOptionId = (optionList: PollOption[]): number | null => {
        if (!currentUserId) return null;
        for (const option of optionList) {
            const hasVoted = option.votes?.some((v) => v.voter.id === currentUserId);
            if (hasVoted) return option.id;
        }
        return null;
    };

    const [options, setOptions] = useState<PollOption[]>(poll.options);
    const [votedId, setVotedId] = useState<number | null>(() => findVotedOptionId(poll.options));
    const [voted, setVoted] = useState(() => findVotedOptionId(poll.options) !== null);

    const votesSignature = poll.options
        .map(o => `${o.id}:${o.votes?.map(v => v.voter.id).join("-")}`)
        .join(",");

    useEffect(() => {
        const nextVotedId = findVotedOptionId(poll.options);
        setOptions(poll.options);
        setVotedId(nextVotedId);
        setVoted(nextVotedId !== null);
    }, [poll.id]);

    useEffect(() => {
        const nextVotedId = findVotedOptionId(poll.options);
        setOptions(poll.options);

        if (nextVotedId !== null) {
            setVotedId(nextVotedId);
            setVoted(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [votesSignature, currentUserId]);

    const totalVotes = options.reduce((sum, o) => sum + o.voteCount, 0);
    const isPollEnded = new Date(poll.expiryDate) < new Date();
    const showResults = voted || isPollEnded;
    const canVote = !voted && !isPollEnded;

    const handleVote = async (optionId: number) => {
        if (!canVote) return;

        const prev = options;
        setOptions(options.map((o) =>
            o.id === optionId ? { ...o, voteCount: o.voteCount + 1 } : o
        ));
        setVotedId(optionId);
        setVoted(true);

        try {
            await votePoll({ id: poll.id, optionId }).unwrap();
        } catch {
            setOptions(prev);
            setVotedId(null);
            setVoted(false);
        }
    };

    const formattedEndDate = new Date(poll.expiryDate).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });


    return (
        <Box sx={{ mb: 2.5 }}>
            {options.map((option) => {
                const percentage = totalVotes > 0
                    ? Math.round((option.voteCount / totalVotes) * 100)
                    : 0;
                const isVotedOption = votedId === option.id;

                return (
                    <Box key={option.id} sx={{ mb: 1.5 }}>
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                mb: 0.5,
                            }}
                        >
                            <Typography
                                variant="body2"
                                onClick={() => handleVote(option.id)}
                                sx={{
                                    fontWeight: isVotedOption ? 600 : 400,
                                    color: isVotedOption ? "primary.main" : "text.primary",
                                    cursor: canVote ? "pointer" : "default",
                                    "&:hover": canVote ? { color: "primary.main" } : {},
                                }}
                            >
                                {option.option}
                            </Typography>
                            {showResults && (
                                <Typography variant="body2" color="text.secondary" sx={{ ml: 1, whiteSpace: "nowrap" }}>
                                    {percentage}% &nbsp;{option.voteCount} votes
                                </Typography>
                            )}
                        </Box>

                        {showResults ? (
                            <LinearProgress
                                variant="determinate"
                                value={percentage}
                                sx={{
                                    height: 10,
                                    borderRadius: 5,
                                    bgcolor: "action.hover",
                                    "& .MuiLinearProgress-bar": {
                                        borderRadius: 5,
                                        bgcolor: isVotedOption ? "primary.main" : "grey.400",
                                    },
                                }}
                            />
                        ) : (
                            <Box
                                onClick={() => handleVote(option.id)}
                                sx={{
                                    height: 10,
                                    borderRadius: 5,
                                    bgcolor: "action.hover",
                                    cursor: "pointer",
                                    transition: "background-color 0.2s",
                                    "&:hover": { bgcolor: "action.selected" },
                                }}
                            />
                        )}
                    </Box>
                );
            })}

            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mt: 2,
                    pt: 1.5,
                    borderTop: "1px solid",
                    borderColor: "divider",
                }}
            >
                <Typography variant="caption" color="text.secondary">
                    {isPollEnded
                        ? `Poll ended on ${formattedEndDate}`
                        : `Poll closes on ${formattedEndDate}`}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    {totalVotes} employees voted
                </Typography>
            </Box>
        </Box>
    );
}

export default PollBlock;