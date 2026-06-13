import { ConflictException, Injectable } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';

@Injectable()
export class NotificationService {
    private client: Client;

    constructor() {
        this.client = new Client({
            node: process.env.ELASTIC_URL,
            auth: {
                username: String(process.env.ELASTIC_USERNAME),
                password: String(process.env.ELASTIC_PASSWORD),
            },
            tls: {
                rejectUnauthorized: false
            },
            sniffOnStart: false,
            sniffOnConnectionFault: false,
            sniffInterval: false,
        });
    }

    private groupNotifications(notifications: any[]) {
        const today: any[] = [];
        const yesterday: any[] = [];
        const older: any[] = [];

        const now = new Date();
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);

        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);

        for (const n of notifications) {
            const created = new Date(n.timestamp);

            if (created >= startOfToday) {
                today.push(n);
            } else if (created >= startOfYesterday) {
                yesterday.push(n);
            } else {
                older.push(n);
            }
        }

        return { today, yesterday, older };
    }


    async createNotifications(docs: any[]) {
        console.log("Entered notification")
        const body = docs.flatMap(doc => [
            { index: { _index: process.env.ELASTIC_NOTIFICATION_INDEX } },
            doc,
        ]);

        await this.client.bulk({ body, refresh: false });  // this prevents es from sorting immediately // sorting happens after a few milli-seconds
    }

    async getNotifications(
        username: string,
        companyId: string,
        cursor?: any[]
    ) {
        const limit = 10
        const response = await this.client.search({
            index: process.env.ELASTIC_NOTIFICATION_INDEX!,
            size: limit,
            query: {
                bool: {
                    must: [
                        { term: { "companyId.keyword": companyId } },
                        { term: { "username.keyword": username } }
                    ]
                }
            },
            sort: [
                { "timestamp": { order: "desc" } },
                { "reminderId": { order: "desc" } } // tie-breaker
            ],
            ...(cursor && { search_after: cursor }),
        });

        const hits = response.hits.hits;

        const notifications = hits.map(hit => ({
            id: hit._id,
            ...hit._source as any,
        }));

        const grouped = this.groupNotifications(notifications);

        const nextCursor =
            hits.length > 0 ? hits[hits.length - 1].sort : null;

        return {
            data: grouped,
            nextCursor,
            hasMore: hits.length === limit,
        };
    }

    async markReadByReminderId(documentId: string, isRead: boolean) {

        const getResponse = await this.client.get({
            index: process.env.ELASTIC_NOTIFICATION_INDEX!,
            id: documentId,
        });

        if (!getResponse.found) {
            throw new Error('Notification not found.');
        }

        const source = getResponse._source as {
            is_read: boolean;
        };

        const currentIsRead = source.is_read;


        if (currentIsRead === isRead) {
            throw new ConflictException("Can't update to same state.")
        }


        await this.client.update({
            index: process.env.ELASTIC_NOTIFICATION_INDEX!,
            id: documentId,
            doc: {
                is_read: isRead,
                read_at: isRead ? new Date().toISOString() : null,
            },
        });
        return
    }

    async getUnreadCount(username: string, companyId: string) {
        const result = await this.client.count({
            index: process.env.ELASTIC_NOTIFICATION_INDEX!,
            query: {
                bool: {
                    filter: [
                        { term: { "companyId.keyword": companyId } },
                        { term: { "username.keyword": username } },
                        { term: { is_read: false } }
                    ]
                }
            }
        });
        return result.count;
    }

}
