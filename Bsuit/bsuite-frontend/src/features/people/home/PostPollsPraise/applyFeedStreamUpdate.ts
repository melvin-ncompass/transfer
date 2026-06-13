import type { AppDispatch } from "../../../../store/store";
import {
    announcementsApi,
    type FeedItem,
    type FeedPoll,
    type FeedQueryParams,
} from "./api/announcements.api";
import { normalizeFeedAction, type FeedActivityPayload } from "./feedActivityBus";

const DEFAULT_FEED_QUERY: FeedQueryParams = { page: 1, limit: 10 };

type FeedEntityType = "post" | "poll" | "praise";
const FEED_ENTITY_TYPES: FeedEntityType[] = ["post", "poll", "praise"];

// ─── action parsing ───────────────────────────────────────────────────────────

/**
 * Normalise an action string into its dot-separated segments.
 * Handles both "post.like.added" and "post.liked" style patterns.
 */
function parseAction(payload: FeedActivityPayload): {
    entityType: FeedEntityType;
    verb: string;
    qualifier: string | null;
} | null {
    const raw = normalizeFeedAction(
        payload.action?.toLowerCase().trim() ?? ""
    );
    if (!raw) return null;

    const parts = raw.split(".");
    if (parts.length < 2) return null;

    const [entityType, ...rest] = parts;
    if (!FEED_ENTITY_TYPES.includes(entityType as FeedEntityType)) return null;

    // e.g. ["like", "added"] or ["liked"] or ["comment", "removed"]
    const verb = rest[0];
    const qualifier = rest[1] ?? null; // "added" | "removed" | null

    return { entityType: entityType as FeedEntityType, verb, qualifier };
}

/**
 * Resolve the entity ID from the payload.
 * Checks the typed nested fields first, then falls back to targetId / id.
 */
function resolveEntityId(
    payload: FeedActivityPayload,
    entityType: FeedEntityType,
): number | null {
    const nested =
        entityType === "post"
            ? payload.post?.id
            : entityType === "poll"
                ? payload.poll?.id
                : payload.praise?.id;

    const id =
        nested ??
        payload.targetId ??
        (typeof payload.id === "number" ? payload.id : undefined);

    return id ?? null;
}

// ─── cache helpers ────────────────────────────────────────────────────────────

function updateFeedCache(
    dispatch: AppDispatch,
    updater: (items: FeedItem[]) => FeedItem[],
) {
    dispatch(
        announcementsApi.util.updateQueryData(
            "getAnnouncementsFeed",
            DEFAULT_FEED_QUERY,
            (draft) => {
                if (!draft?.data) return;
                draft.data = updater(draft.data);
            },
        ),
    );
}

function mutateFeedItem(
    dispatch: AppDispatch,
    entityType: FeedEntityType,
    id: number,
    mutate: (item: FeedItem) => void,
) {
    dispatch(
        announcementsApi.util.updateQueryData(
            "getAnnouncementsFeed",
            DEFAULT_FEED_QUERY,
            (draft) => {
                if (!draft?.data) return;
                const item = draft.data.find(
                    (i) => i.feedType === entityType && i.id === id,
                );
                if (item) mutate(item);
            },
        ),
    );
}

// ─── individual updaters ──────────────────────────────────────────────────────

function handleDeleted(
    dispatch: AppDispatch,
    payload: FeedActivityPayload,
    entityType: FeedEntityType,
): boolean {
    const id = resolveEntityId(payload, entityType);
    if (id == null) return false;

    updateFeedCache(dispatch, (items) =>
        items.filter((item) => !(item.feedType === entityType && item.id === id)),
    );
    return true;
}

/**
 * Determine like delta from verb + qualifier.
 *
 * Supported patterns (defensive — handles both styles):
 *   post.like.added   → +1
 *   post.like.removed → -1
 *   post.liked        → +1
 *   post.unliked      → -1
 *   poll.like.added   → +1   (same for praise)
 */
function resolveLikeDelta(verb: string, qualifier: string | null): 1 | -1 | null {
    const isAdd =
        (verb === "like" && qualifier === "added") ||
        verb === "liked";
    const isRemove =
        (verb === "like" && qualifier === "removed") ||
        verb === "unliked";

    if (isAdd) return 1;
    if (isRemove) return -1;
    return null;
}

function handleLike(
    dispatch: AppDispatch,
    payload: FeedActivityPayload,
    entityType: FeedEntityType,
    verb: string,
    qualifier: string | null,
): boolean {
    const delta = resolveLikeDelta(verb, qualifier);
    if (delta == null) return false;

    const id = resolveEntityId(payload, entityType);
    if (id == null) return false;

    mutateFeedItem(dispatch, entityType, id, (item) => {
        item.likesCount = Math.max(0, (item.likesCount ?? 0) + delta);
    });
    return true;
}

/**
 * Determine comment delta from verb + qualifier.
 *
 * Supported patterns:
 *   post.comment.added   → +1
 *   post.comment.removed → -1
 *   post.commented       → +1
 */
function resolveCommentDelta(verb: string, qualifier: string | null): 1 | -1 | null {
    const isAdd =
        (verb === "comment" && (qualifier === "added" || qualifier === null)) ||
        verb === "commented";
    const isRemove =
        (verb === "comment" && qualifier === "removed") ||
        verb === "uncommented";

    if (isAdd) return 1;
    if (isRemove) return -1;
    return null;
}

function handleComment(
    dispatch: AppDispatch,
    payload: FeedActivityPayload,
    entityType: FeedEntityType,
    verb: string,
    qualifier: string | null,
): boolean {
    const delta = resolveCommentDelta(verb, qualifier);
    if (delta == null) return false;

    const id = resolveEntityId(payload, entityType);
    if (id == null) return false;

    mutateFeedItem(dispatch, entityType, id, (item) => {
        item.commentsCount = Math.max(0, (item.commentsCount ?? 0) + delta);
    });
    return true;
}

/**
 * Poll vote: stream sends absolute voteCount + optionId.
 * Find the poll item, find the matching option, set its voteCount directly.
 *
 * Supported patterns:
 *   poll.voted
 *   poll.vote.added
 *   poll.vote
 */
function handlePollVote(
    dispatch: AppDispatch,
    payload: FeedActivityPayload,
    verb: string,
): boolean {
    const isVoteAction =
        verb === "voted" ||
        verb === "vote";

    if (!isVoteAction) return false;

    const pollId = resolveEntityId(payload, "poll");
    if (pollId == null) return false;

    const { optionId, voteCount } = payload;
    if (optionId == null || voteCount == null) return false;

    dispatch(
        announcementsApi.util.updateQueryData(
            "getAnnouncementsFeed",
            DEFAULT_FEED_QUERY,
            (draft) => {
                if (!draft?.data) return;
                const item = draft.data.find(
                    (i) => i.feedType === "poll" && i.id === pollId,
                ) as FeedPoll | undefined;

                if (!item?.options) return;

                const option = item.options.find((o) => o.id === optionId);
                if (option) {
                    option.voteCount = voteCount;
                }
            },
        ),
    );
    return true;
}

// ─── main export ──────────────────────────────────────────────────────────────

/**
 * Apply a stream payload to the RTK feed cache surgically.
 *
 * Handles:
 *  - Deletions:         post/poll/praise.deleted
 *  - Likes:             post/poll/praise.like.added|removed  OR  .liked|unliked
 *  - Comments:          post/poll/praise.comment.added|removed  OR  .commented
 *  - Poll votes:        poll.voted  OR  poll.vote.added
 *
 * @returns true  → cache updated, no refetch needed
 *          false → unrecognised event, caller should refetch
 */
export function applyAnnouncementsStreamToCache(
    dispatch: AppDispatch,
    payload: FeedActivityPayload,
): boolean {
    const parsed = parseAction(payload);
    if (!parsed) return false;

    const { entityType, verb, qualifier } = parsed;

    // ── deletions ──
    if (verb === "deleted") {
        return handleDeleted(dispatch, payload, entityType);
    }

    // ── likes ──
    if (verb === "like" || verb === "liked" || verb === "unliked") {
        return handleLike(dispatch, payload, entityType, verb, qualifier);
    }

    // ── comments ──
    if (verb === "comment" || verb === "commented" || verb === "uncommented") {
        return handleComment(dispatch, payload, entityType, verb, qualifier);
    }

    // ── poll votes ──
    if (entityType === "poll" && (verb === "voted" || verb === "vote")) {
        return handlePollVote(dispatch, payload, verb);
    }

    return false;
}