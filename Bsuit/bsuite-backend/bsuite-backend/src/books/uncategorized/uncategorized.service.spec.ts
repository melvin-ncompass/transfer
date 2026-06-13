import { Test, TestingModule } from '@nestjs/testing';
import { UncategorizedService } from './uncategorized.service';

describe('UncategorizedService', () => {
  let service: UncategorizedService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UncategorizedService],
    }).compile();

    service = module.get<UncategorizedService>(UncategorizedService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
