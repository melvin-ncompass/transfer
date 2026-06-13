import { Test, TestingModule } from '@nestjs/testing';
import { TransactController } from './transact.controller';
import { TransactService } from './transact.service';

describe('TransactController', () => {
  let controller: TransactController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactController],
      providers: [TransactService],
    }).compile();

    controller = module.get<TransactController>(TransactController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
