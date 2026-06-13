import { Test, TestingModule } from '@nestjs/testing';
import { RbaController } from './rba.controller';
import { RbaService } from './rba.service';

describe('RbaController', () => {
  let controller: RbaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RbaController],
      providers: [RbaService],
    }).compile();

    controller = module.get<RbaController>(RbaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
