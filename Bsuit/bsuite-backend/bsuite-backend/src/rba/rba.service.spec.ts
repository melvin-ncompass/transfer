import { Test, TestingModule } from '@nestjs/testing';
import { RbaService } from './rba.service';

describe('RbaService', () => {
  let service: RbaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RbaService],
    }).compile();

    service = module.get<RbaService>(RbaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
