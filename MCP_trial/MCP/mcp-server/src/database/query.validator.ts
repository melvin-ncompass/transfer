import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class QueryValidator {
    private readonly logger = new Logger(QueryValidator.name);

    // Blacklist of destructive commands
    private readonly BLOCK_PATTERNS = [
        /\bDROP\b/i,
        /\bDELETE\b/i,
        /\bUPDATE\b/i,
        /\bINSERT\b/i,
        /\bTRUNCATE\b/i,
        /\bALTER\b/i,
        /\bGRANT\b/i,
        /\bREVOKE\b/i,
        /\bEXECUTE\b/i,
        /;\s*(?:DROP|DELETE|UPDATE|INSERT|TRUNCATE|ALTER|GRANT|REVOKE|EXECUTE)\b/i, // Catch chained destructive commands
    ];

    // Whitelist to ensure it mainly starts with SELECT or WITH
    private readonly REQUIRED_PATTERNS = [
        /^\s*(?:SELECT|WITH)\b/i,
    ];

    /**
     * Validates a SQL query string against strict read-only rules.
     * Throws an error if the query is deemed unsafe.
     * @param sql The raw generated SQL string
     */
    validate(sql: string): true {
        this.logger.debug(`Validating SQL: ${sql}`);

        // 1. Must start with a required SELECT/WITH pattern
        const startsSafely = this.REQUIRED_PATTERNS.some(regex => regex.test(sql));
        if (!startsSafely) {
            this.logger.error(`Validation Failed: Query does not start with SELECT or WITH.`);
            throw new Error('UNSAFE_QUERY_ERROR: Only SELECT or WITH statements are allowed.');
        }

        // 2. Must NOT contain blocked commands
        for (const regex of this.BLOCK_PATTERNS) {
            if (regex.test(sql)) {
                this.logger.error(`Validation Failed: Unsafe command detected matching ${regex.source}`);
                throw new Error(`UNSAFE_QUERY_ERROR: Destructive operations are strictly prohibited.`);
            }
        }

        // Passed all checks
        return true;
    }
}
