import { CopernicusPredictionResponseDto, GetIndicatorsResponseDto, KhisPredictionResponseDto } from "../../dto/visualization-swagger-response.dto";

export const ForecastSwagger = {
  KHIS_PREDICTION: {
    summary: 'Fetch Khis prediction data',
    description: 'Returns predicted KHIS indicator values with confidence intervals for a selected indicator and date range.',
    tags: ['Business/Dashboard/Forecast'],
    bearerAuth: true,
    responses: [
      {
        status: 200,
        description: 'Khis prediction data fetched successfully',
        dataType: KhisPredictionResponseDto,
        isArray: true
      },
      {
        status: 403,
        description: 'Unauthorized',
      },
    ],
  },

  COPERNICUS_PREDICTION: {
    summary: 'Fetch Copernicus prediction data ',
    description: 'Returns monthly historical and projected Copernicus climate data, including temperature and precipitation values.',
    tags: ['Business/Dashboard/Forecast'],
    bearerAuth: true,
    responses: [
      {
        status: 200,
        description: 'Copernicus prediction data fetched successfully',
        dataType: CopernicusPredictionResponseDto,
        isArray: true
      },
      {
        status: 403,
        description: 'Unauthorized',
      },
    ],
  },

  GET_INDICATORS: {
    summary: 'Fetch indicators',
    description: 'Fetch all indicator names and their ids',
    tags: ['Business/Dashboard/Forecast'],
    bearerAuth: true,
    responses: [
      {
        status: 200,
        description: 'Prediction indicators list fetched successfully',
        dataType: GetIndicatorsResponseDto,
        isArray: true
      },
      {
        status: 403,
        description: 'Unauthorized',
      },
    ],
  }
}