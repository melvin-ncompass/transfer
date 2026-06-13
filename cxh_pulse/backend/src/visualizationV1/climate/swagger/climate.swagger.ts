import { MonthlyRainfallResponseDto, MonthlyTemperatureResponseDto } from '../../dto/visualization-swagger-response.dto';
import { PromptsFilterDto } from '../../dto/visualization.dto';

export const ClimateSwagger = {
  MONTHLY_TEMPERATURE: {
    summary: 'Fetch monthly temperature',
    description:
      'Returns monthly average temperature values (°C) with optional date and location filters.',
    tags: ['Business/Dashboard/Climate'],
    bearerAuth: true,
    query: [
      {
        name: 'filters',
        type: PromptsFilterDto,
      },
    ],
    responses: [
      {
        status: 200,
        description: 'Fetched monthly temperature successfully',
        dataType: MonthlyTemperatureResponseDto,
        isArray: true,
      },
      {
        status: 403,
        description: 'Unauthorized',
      },
    ],
  },

  MONTHLY_RAINFALL: {
    summary: 'Fetch monthly rainfall',
    description: 'Returns monthly average rainfall with optional date and location filters.',
    tags: ['Business/Dashboard/Climate'],
    bearerAuth: true,
    responses: [
      {
        status: 200,
        description: 'Fetched monthly rainfall successfully',
        dataType: MonthlyRainfallResponseDto,
        isArray: true
      },
      {
        status: 403,
        description: 'Unauthorized',
      },
    ],
  }
};
