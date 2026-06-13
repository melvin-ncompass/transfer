import { Test, TestingModule } from '@nestjs/testing';
import { UncategorizedController } from './uncategorized.controller';
import { UncategorizedService } from './uncategorized.service';

describe('UncategorizedController', () => {
  let controller: UncategorizedController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UncategorizedController],
      providers: [UncategorizedService],
    }).compile();

    controller = module.get<UncategorizedController>(UncategorizedController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
