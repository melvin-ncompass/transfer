import { Test, TestingModule } from '@nestjs/testing';
import { TransactService } from './transact.service';

describe('TransactService', () => {
  let service: TransactService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransactService],
    }).compile();

    service = module.get<TransactService>(TransactService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
