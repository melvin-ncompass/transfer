import { Injectable, NotFoundException } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';

import { formatDateTime, toUTC } from '../shared/utils';

import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/auth/entities/user.entity';
import { Repository } from 'typeorm';

import { ActivityFilterDto } from './dto/activity-filter.dto';
import { Company } from 'src/company/entities/company.entity';
import { UserCompanyRelation } from 'src/company/entities/user-company-relation.entity';

@Injectable()
export class ActivityService {
    private client: Client;

    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @InjectRepository(Company)
        private readonly companyRepo: Repository<Company>,
        @InjectRepository(UserCompanyRelation)
        private readonly userCompanyRelationsRepo: Repository<UserCompanyRelation>,
    ) {
        this.client = new Client({
            node: process.env.ELASTIC_URL,
            auth: {
                username: String(process.env.ELASTIC_USERNAME),
                password: String(process.env.ELASTIC_PASSWORD),
            },
            tls: {
                rejectUnauthorized: false,
            },
            sniffOnStart: false,
            sniffOnConnectionFault: false,
            sniffInterval: false,
        });
    }

    private async findUserDisplayName(username: string) {
        const user = await this.userRepo.findOne({
            where: { username },
        });

        if (!user) {
            throw new NotFoundException("User not found")
        }

        return user.displayName;
    }

    async logActivity(activity: any) {
        return this.client.index({
            index: String(process.env.ELASTIC_ACTIVITY_INDEX),
            document: {
                timestamp: new Date().toISOString(),
                ...activity,
            },
        });
    }

    async getActivitiesWithFilters(filters: ActivityFilterDto, companyId: string) {
        const {
            page = 1,
            limit = 10,
            startTime,
            endTime,
            users,
            modules,
            features,
        } = filters;

        const from = (page - 1) * limit;

        const filterQuery: any[] = [];

        const startTimeUTC = startTime ? toUTC(startTime) : undefined;
        const endTimeUTC = endTime ? toUTC(endTime) : undefined;

        if (startTimeUTC || endTimeUTC) {
            const range: any = {};
            if (startTimeUTC) range.gte = startTimeUTC;
            if (endTimeUTC) range.lte = endTimeUTC;

            filterQuery.push({
                range: { timestamp: range },
            });
        }

        if (companyId) {
            filterQuery.push({
                term: {
                    'company_id.keyword': companyId,
                },
            });
        }

        if (users?.length) {
            filterQuery.push({
                terms: {
                    'username.keyword': users,
                },
            });
        }

        if (modules?.length) {
            filterQuery.push({
                terms: {
                    'change_of_data.module.keyword': modules,
                },
            });
        }

        if (features?.length) {
            filterQuery.push({
                terms: {
                    'change_of_data.feature.keyword': features,
                },
            });
        }

        const query =
            filterQuery.length > 0
                ? { bool: { filter: filterQuery } }
                : { match_all: {} };

        const { hits } = await this.client.search({
            index: String(process.env.ELASTIC_ACTIVITY_INDEX),
            from,
            size: limit,
            query,
            sort: [
                { "timestamp": { order: "desc" } },
                 { _id: { order: "desc" } } // document id
            ],
        });

        return Promise.all(
            hits.hits.map(async (hit: any) => {
                const source = hit._source ?? {};
                const change = source.change_of_data ?? {};
                return {
                    time: source.timestamp,
                    user: await this.findUserDisplayName(source.username),
                    username: source.username,
                    module: change.module,
                    feature: change.feature,
                    status: change.status,
                };
            }),
        );
    }

     async getAllActivitiesForReport(filters: ActivityFilterDto, companyId: string) {
        const {
            startTime,
            endTime,
            users,
            modules,
            features,
        } = filters;
        const filterQuery: any[] = [];

        const startTimeUTC = startTime ? toUTC(startTime) : undefined;
        const endTimeUTC = endTime ? toUTC(endTime) : undefined;

        if (startTimeUTC || endTimeUTC) {
            const range: any = {};
            if (startTimeUTC) range.gte = startTimeUTC;
            if (endTimeUTC) range.lte = endTimeUTC;
            filterQuery.push({ range: { timestamp: range } });
        }

        if (companyId) {
            filterQuery.push({
                term: { 'company_id.keyword': companyId },
            });
        }

        if (users?.length) {
            filterQuery.push({
                terms: { 'username.keyword': users },
            });
        }

        if (modules?.length) {
            filterQuery.push({
                terms: { 'change_of_data.module.keyword': modules },
            });
        }

        if (features?.length) {
            filterQuery.push({
                terms: { 'change_of_data.feature.keyword': features },
            });
        }

        const query =
            filterQuery.length > 0
                ? { bool: { filter: filterQuery } }
                : { match_all: {} };

        const pit = await this.client.openPointInTime({
            index: String(process.env.ELASTIC_ACTIVITY_INDEX),
            keep_alive: '2m',
        });

        const pitId = pit.id;

        const allResults: any[] = [];
        let searchAfter: any[] | undefined = undefined;

        try {
            while (true) {
                const response = await this.client.search({
                    size: 1000,
                    pit: {
                        id: pitId,
                        keep_alive: '2m',
                    },
                    query,
                    sort: [
                        { timestamp: 'desc' },
                        { _id: 'desc' }
                    ],
                    search_after: searchAfter,
                });

                const hits = response.hits.hits;

                if (hits.length === 0) break;

                for (const hit of hits) {
                    const source = hit._source ?? {};
                    const change = source.change_of_data ?? {};

                    allResults.push({
                        time: formatDateTime(source.timestamp),
                        user: await this.findUserDisplayName(source.username),
                        username: source.username,
                        module: change.module,
                        feature: change.feature,
                        status: change.status,
                    });
                }

                searchAfter = hits[hits.length - 1].sort;
            }
        } finally {
            await this.client.closePointInTime({
                id: pitId,
            });
        }
        return allResults;
    }

    async getAvailableModulesAndFeatures(companyId: string) {
        const filterQuery: any[] = [];

        if (companyId) {
            filterQuery.push({
                term: { 'company_id.keyword': companyId },
            });
        }

        const query ={ bool: { filter: filterQuery } }

        const response = await this.client.search({
            index: String(process.env.ELASTIC_ACTIVITY_INDEX),
            query,
            aggs: {
                modules: {
                    terms: {
                        field: 'change_of_data.module.keyword',
                        size: 100,
                    },
                },
                features: {
                    terms: {
                        field: 'change_of_data.feature.keyword',
                        size: 100,
                    },
                },
            },
        });

        const modules =
        ((response.aggregations?.modules as any)?.buckets as Array<{ key: string }>)?.map(b => b.key);
    const features =
        ((response.aggregations?.features as any)?.buckets as Array<{ key: string }>)?.map(b => b.key);

        return { modules, features };
    }

    async getUserDisplayNames(companyId: string) {
        const company = await this.companyRepo.findOne({
            where: {
                companyId
            }
        })
        const integerCompanyId = company?.id
        const relation = await this.userCompanyRelationsRepo.find({
            where: {
                company: { id: integerCompanyId },
            },
            relations: ["user"],
        });

        return relation.map(
            (relation) => `${relation.user.displayName} (${relation.user.username})`,
        );
    }
}
