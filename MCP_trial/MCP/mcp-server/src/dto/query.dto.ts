import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class QueryRequestDto {
    @IsString()
    @IsNotEmpty()
    query: string;

    @IsString()
    @IsOptional()
    sessionId?: string;

    @IsString()
    @IsOptional()
    userRole?: string; // RBAC context injected by API Gateway or Client JWT

    @IsObject()
    @IsOptional()
    config?: Record<string, any>;
}

export class AgentTraceDto {
    agentName: string;
    traceId: string;
    logs: string[];
    timestamp: Date;
}
