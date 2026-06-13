import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const mockAppService = {
      getHello: jest.fn().mockReturnValue('Hello World!'),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        { provide: AppService, useValue: mockAppService },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return health check', () => {
      expect(appController.healthCheck()).toEqual({
        status: 'MCP Server is running',
        timestamp: expect.any(Date),
      });
    });
  });
});
