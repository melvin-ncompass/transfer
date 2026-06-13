import { baseApi } from "../../../../../api/base.api";

/* =========================
   COMMON TYPES
========================= */

type ID = number | string;

export type AnnouncementType = "post" | "poll" | "praise";

interface ApiResponse<T> {
    success: boolean;
    statusCode: number;
    timestamp: string;
    message: string;
    data: T;
}

interface Contact {
    id: number;
    name: string;
    lastName: string | null;
    email: string;
}

export interface Author {
    id: number;
    employeeId: string;
    nameAsPerPan: string | null;
    contact: Contact | null;
    gender: string;
    employeeType: string;
    dateOfJoining: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

interface Attachment {
    filename: string;
    path: string;
}

interface DeleteRequest {
    id: ID;
}

interface Like {
    id: number;
    likedBy: {
        id: number;
        employeeId: string;
    };
    createdAt: string;
    updatedAt: string;
}

/* =========================
   POSTS
========================= */

export interface CreatePostRequest {
    content: string;
    attachments?: File[];
}

interface Post {
    id?: number;
    content: string;
    author: Author;
    attachments: Attachment[];
    createdAt: string;
    updatedAt: string;
}

/* =========================
   POLLS
========================= */

interface PollVoter {
    id: number;
    employeeId: string;
}

interface PollVote {
    id: number;
    voter: PollVoter;
    createdAt: string;
}
export interface PollOption {
    id: number;
    option: string;
    voteCount: number;
    votes: PollVote[];
}

interface CreatePollOption {
    option: string;
}

export interface CreatePollRequest {
    question: string;
    options: CreatePollOption[];
    expiryDate: string;
    attachments?: File[];
    isAnonymous: boolean;
}

interface Poll {
    id?: number;
    question: string;
    expiryDate: string;
    isAnonymous: boolean;
    author: Author;
    attachments: Attachment[];
    createdAt: string;
}

/* =========================
   COMMENTS
========================= */

interface CommentEntity {
    id: number;
}

interface AnnouncementComment {
    id?: number;
    comment: string;
    post?: CommentEntity | null;
    poll?: CommentEntity | Poll | null;
    commentedBy: Partial<Author>;
    createdAt: string;
    updatedAt: string;
}

export interface FeedComment {
    id: number;
    comment: string;
    commentedBy: Partial<Author>;
    createdAt: string;
    updatedAt: string;
}

/* =========================
   MUTATION REQUESTS
========================= */

export interface VotePollRequest {
    id: ID;
    optionId: number;
}

export interface LikeAnnouncementRequest {
    type: AnnouncementType;
    id: ID;
}

export interface CommentAnnouncementRequest {
    type: AnnouncementType;
    id: ID;
    comment: string;
}

export interface DeleteCommentRequest {
    commentId: ID;
}

/* =========================
   FEED TYPES
========================= */

export interface FeedPost {
    id: number;
    content: string;
    author: Author;
    attachments: Attachment[] | null;
    comments: FeedComment[];
    createdAt: string;
    updatedAt: string;
    likesCount: number;
    commentsCount: number;
    feedType: "post";
    likes: Like[];
}

export interface FeedPoll {
    id: number;

    question: string;
    expiryDate: string;
    isAnonymous: boolean;

    author: Author;
    options: PollOption[];
    attachments: Attachment[] | null;
    comments: FeedComment[];
    createdAt: string;
    likesCount: number;
    commentsCount: number;
    feedType: "poll";
    likes: Like[];
}

export interface FeedQueryParams {
    page: number;
    limit: number;
}

export interface FeedPraise {
    id: number;
    praisedBy: Author;
    praisedTo: Author[];
    praise: string;
    badge: PraiseBadge | null;
    project?: { id: number; projectName: string } | null;
    attachments: Attachment[] | null;
    comments: FeedComment[];
    likes: Like[];
    createdAt: string;
    updatedAt: string;
    likesCount: number;
    commentsCount: number;
    feedType: "praise";
}

export type FeedItem = FeedPost | FeedPoll | FeedPraise;

/* =========================
   PRAISE
========================= */

export type PraiseBadge =
    | "top_performer"
    | "leadership_impact"
    | "team_player"
    | "high_five"
    | "rockstar_rookie"
    | "above_and_beyond"
    | "leaving_a_legacy";

export interface CreatePraiseRequest {
    employeeIds: number[];
    praise: string;
    badge?: PraiseBadge;
    projectId?: number;
    attachments?: File[];
}

export interface Praise {
    id: number;

    praisedBy: Author;
    praisedTo: Author[];

    praise: string;
    badge: PraiseBadge | null;

    project?: {
        id: number;
        projectName: string;
        billableHoursPerDay: number;
        isArchived: boolean;
    } | null;

    attachments: Attachment[];

    createdAt: string;
    updatedAt: string;
}

/* =========================
   API
========================= */

export const announcementsApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        postAnnouncement: builder.mutation<ApiResponse<Post>, CreatePostRequest>({
            query: ({ content, attachments }) => {
                const formData = new FormData();

                formData.append("content", content);
                attachments?.forEach((file) => formData.append("attachments", file));
                return { url: "/announcements/post", method: "POST", body: formData };
            },

            invalidatesTags: ["Announcements", "Dashboard"],
        }),

        createPoll: builder.mutation<ApiResponse<Poll>, CreatePollRequest>({
            query: ({ question, options, expiryDate, attachments, isAnonymous }) => {
                const formData = new FormData();

                formData.append("question", question);
                formData.append("options", JSON.stringify(options));
                formData.append("expiryDate", expiryDate);
                formData.append("isAnonymous", String(isAnonymous));
                attachments?.forEach((file) => formData.append("attachments", file));
                return { url: "/announcements/poll", method: "POST", body: formData };
            },

            invalidatesTags: ["Announcements", "Dashboard"],
        }),

        votePoll: builder.mutation<ApiResponse<{ success: boolean }>, VotePollRequest>({
            query: ({ id, optionId }) => ({
                url: `/announcements/poll/${id}/vote`,
                method: "POST",
                body: { optionId },
            }),

            // invalidatesTags: ["Announcements", "Dashboard"],
        }),

        likeAnnouncement: builder.mutation<ApiResponse<{ liked: boolean }>, LikeAnnouncementRequest>({
            query: ({ type, id }) => ({
                url: `/announcements/like/${type}/${id}`,
                method: "POST",
            }),

            // invalidatesTags: ["Announcements", "Dashboard"],
        }),

        commentAnnouncement: builder.mutation<ApiResponse<AnnouncementComment>, CommentAnnouncementRequest>({
            query: ({ type, id, comment }) => ({
                url: `/announcements/comment/${type}/${id}`,
                method: "POST",
                body: { comment },
            }),

            // invalidatesTags: ["Announcements", "Dashboard"],
        }),

        deleteComment: builder.mutation<ApiResponse<AnnouncementComment>, DeleteCommentRequest>({
            query: ({ commentId }) => ({
                url: `/announcements/comment/${commentId}`,
                method: "DELETE",
            }),

            invalidatesTags: ["Announcements", "Dashboard"],
        }),

        deletePost: builder.mutation<ApiResponse<Post>, DeleteRequest>({
            query: ({ id }) => ({
                url: `/announcements/post/${id}`,
                method: "DELETE",
            }),

            invalidatesTags: ["Announcements", "Dashboard"],
        }),

        deletePoll: builder.mutation<ApiResponse<Poll>, DeleteRequest>({
            query: ({ id }) => ({
                url: `/announcements/poll/${id}`,
                method: "DELETE",
            }),

            invalidatesTags: ["Announcements", "Dashboard"],
        }),

        getAnnouncementsFeed: builder.query<ApiResponse<FeedItem[]>, FeedQueryParams>({
            query: ({ page, limit }) => ({
                url: `/announcements/feed?page=${page}&limit=${limit}`,
                method: "GET",
            }),
            serializeQueryArgs: ({ endpointName }) => endpointName,
            merge: (currentCache, newItems, { arg }) => {
                if (arg.page === 1 || !currentCache.data || currentCache.data.length === 0) {
                    currentCache.data = newItems.data;
                } else {
                    currentCache.data.push(...newItems.data);
                }
            },
            forceRefetch: () => true,
            providesTags: ["Announcements"],
        }),

        getPraises: builder.query<ApiResponse<Praise[]>, void>({
            query: () => ({
                url: "/announcements/praise",
                method: "GET",
            }),

            providesTags: ["Announcements"],
        }),

        createPraise: builder.mutation<ApiResponse<Praise>, CreatePraiseRequest>({
            query: ({
                employeeIds,
                praise,
                badge,
                projectId,
                attachments,
            }) => {
                const formData = new FormData();

                formData.append("employeeIds", JSON.stringify(employeeIds));
                formData.append("praise", praise);

                if (badge) {
                    formData.append("badge", badge);
                }

                if (projectId) {
                    formData.append("projectId", String(projectId));
                }

                attachments?.forEach((file) =>
                    formData.append("attachments", file)
                );

                return {
                    url: "/announcements/praise",
                    method: "POST",
                    body: formData,
                };
            },

            invalidatesTags: ["Announcements", "Dashboard"],
        }),

        deletePraise: builder.mutation<ApiResponse<null>, DeleteRequest>({
            query: ({ id }) => ({
                url: `/announcements/praise/${id}`,
                method: "DELETE",
            }),

            invalidatesTags: ["Announcements", "Dashboard"],
        }),
    }),
});

export const {
    useGetAnnouncementsFeedQuery,
    usePostAnnouncementMutation,
    useCreatePollMutation,
    useVotePollMutation,
    useLikeAnnouncementMutation,
    useCommentAnnouncementMutation,
    useDeleteCommentMutation,
    useDeletePostMutation,
    useDeletePollMutation,
    useGetPraisesQuery,
    useCreatePraiseMutation,
    useDeletePraiseMutation,
} = announcementsApi;