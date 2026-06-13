import { useEffect, useRef } from "react";

/**
 * notification-v2/stream carries two kinds of events:
 *
 * 1. Inbox notifications (leave, approvals, etc.)
 *    - Have `subject`, `feature`, often nested `notification`
 *    - No `payloadType` (e.g. leave_request)
 *
 * 2. Home feed / Recent Activity (post, poll, praise, likes, comments, votes, deletes)
 *    - Always `payloadType: "announcements"`
 *    - `action` e.g. post.like.added, post.comment.added, poll.voted, post.deleted
 */

export interface FeedActivityPayload {
    companyId?: string;
    users?: unknown;
    payloadType?: string;
    type?: string;
    action?: string;
    targetId?: number;
    userId?: number;
    id?: number | string;
    optionId?: number;
    voteCount?: number;
    post?: { id: number };
    poll?: { id: number };
    praise?: { id: number };
    feature?: string;
    message?: string;
    subject?: string;
    count?: number;
    redirection_id?: number | string | null;
    notification?: {
        feature?: string;
        subject?: string;
    };
}

type FeedActivityListener = (payload: FeedActivityPayload) => void;

const listeners = new Set<FeedActivityListener>();

export const ANNOUNCEMENTS_PAYLOAD_TYPE = "announcements";

// ─── known feed action verbs ──────────────────────────────────────────────────

/**
 * All second-segment verbs that belong to the feed.
 * Covers both "post.like.added" style and "post.liked" style.
 */
const FEED_ACTION_VERBS = new Set([
    "deleted",
    "like",
    "liked",
    "unliked",
    "comment",
    "commented",
    "uncommented",
    "voted",
    "vote",
]);

const CONCAT_ACTION_RE = /^(post|poll|praise)(like|comment)(\..*)?$/;

export function normalizeFeedAction(raw: string): string {
    const m = raw.match(CONCAT_ACTION_RE);
    if (!m) return raw;
    const [, entity, verb, rest = ""] = m;
    return `${entity}.${verb}${rest}`;
}

// ─── pub/sub ──────────────────────────────────────────────────────────────────

/** Subscribe to home feed activity events from notification-v2/stream. */
export function subscribeFeedActivity(listener: FeedActivityListener): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

export function emitFeedActivity(payload: FeedActivityPayload): void {
    listeners.forEach((listener) => listener(payload));
}

// ─── filters ──────────────────────────────────────────────────────────────────

export function isAnnouncementsStreamPayload(payload: FeedActivityPayload): boolean {
    return payload.payloadType?.toLowerCase() === ANNOUNCEMENTS_PAYLOAD_TYPE;
}

/**
 * Returns true when the payload is a feed interaction event that
 * applyAnnouncementsStreamToCache knows how to handle.
 *
 * Guards:
 *  - Must be payloadType "announcements"
 *  - Not a heartbeat / ping
 *  - Not a bare count-update (those come from inbox, not feed)
 *  - action must have a recognised verb segment
 */
export function isFeedActivityEvent(payload: FeedActivityPayload): boolean {
    if (payload.type === "heartbeat" || payload.type === "ping") return false;
    if (typeof payload.count === "number") return false;
    if (!isAnnouncementsStreamPayload(payload)) return false;

    const action = payload.action?.toLowerCase().trim();
    if (!action) return false;

    const normalized = normalizeFeedAction(action);
    const parts = normalized.split(".");
    if (parts.length < 2) return false;

    const verb = parts[1];
    return FEED_ACTION_VERBS.has(verb);
}

// ─── hook ─────────────────────────────────────────────────────────────────────

/** React hook — run callback when notification stream reports a feed activity event. */
export function useFeedActivityRefresh(
    onActivity: (payload: FeedActivityPayload) => void,
): void {
    const onActivityRef = useRef(onActivity);
    onActivityRef.current = onActivity;

    useEffect(() => {
        return subscribeFeedActivity((payload) => {
            if (!isFeedActivityEvent(payload)) return;
            onActivityRef.current(payload);
        });
    }, []);
}