import { EachIntentTrendResponseDto, IntentPriorityFrequencyResponseDto, IntentRelativeIntensityResponseDto, RiskTreeResponseDto } from "src/visualizationV1/dto/visualization-swagger-response.dto";

export const PromptsSwagger = {
  RISK_TREE_MAP: {
    summary: 'Fetch risk tree map',
    description: 'Fetches aggregated intent counts grouped by risk category, priority level, and intent',
    tags: ['Business/Dashboard/Prompts'],
    bearerAuth: true,
    responses: [
      {
        status: 200,
        description: 'Fetched risk tree map successfully',
        dataType: RiskTreeResponseDto,
        isArray: true
      },
      {
        status: 403,
        description: 'Unauthorized',
      },
    ],
  },

  EACH_INTENT_TREND: {
    summary: 'Fetch prompts each intent trend data',
    description: 'Retrieves monthly trend data for each prompt intent, aggregated over time and optionally filtered by ward, subcounty, category, and date range.',
    tags: ['Business/Dashboard/Prompts'],
    bearerAuth: true,
    responses: [
      {
        status: 200,
        description: 'Prompts each intent trend data fetched successfully',
        dataType: EachIntentTrendResponseDto,
        isArray: true
      },
      {
        status: 403,
        description: 'Unauthorized',
      },
    ],
  },

  INTENT_RELATIVE_INTENSITY: {
    summary: 'Fetch prompts intent relative intensity data',
    description: 'Returns relative intent intensity percentages across temperature bins, with optional temporal and location-based filters.',
    tags: ['Business/Dashboard/Prompts'],
    bearerAuth: true,
    responses: [
      {
        status: 200,
        description: 'Prompts intent relative intensity data fetched successfully',
        dataType: IntentRelativeIntensityResponseDto,
        isArray: true
      },
      {
        status: 403,
        description: 'Unauthorized',
      },
    ],
  },

  INTENT_PRIORITY_FREQUENCY: {
    summary: 'Fetch prompts intent priority frequency data',
    description: 'Returns priority-level frequency ratios across temperature bins, with optional temporal, geographic, and category filters.',
    tags: ['Business/Dashboard/Prompts'],
    bearerAuth: true,

    responses: [
      {
        status: 200,
        description: 'Prompts intent priority frequency data fetched successfully',
        dataType: IntentPriorityFrequencyResponseDto,
        isArray: true
      },
      {
        status: 403,
        description: 'Unauthorized',
      },
    ],
  },




}
