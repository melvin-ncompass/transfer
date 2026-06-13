import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, ILike, Not } from 'typeorm';
import { CreateEarningsDto } from './dto/create-earnings.dto';
import { UpdateEarningsDto } from './dto/update-earnings.dto';
import { CalculationType, Earnings } from './entities/tenant-earnings.entity';

@Injectable()
export class EarningsService {
  constructor(
  ) { }
  async createEarning(
    dataSource: DataSource,
    createEarningsDto: CreateEarningsDto) {

    const earningsRepo = dataSource.getRepository(Earnings);
    const existingEarning = await earningsRepo.findOne({
      where: {
        earningName: ILike(createEarningsDto.earningName)
      },

    });

    if (existingEarning) {
      throw new ConflictException(
        `Earning name ${createEarningsDto.earningName} already exists.`,
      );
    }
    if (!createEarningsDto.amount) {
      throw new ConflictException(`Amount for Earning name ${createEarningsDto.earningName} missing`)
    }

    let baseEarning: any;
    if (createEarningsDto.calculationType == CalculationType.PERCENTAGE) {
      if (!createEarningsDto.percentageOf) {
        throw new BadRequestException(`Base earning to calculate amount from is missing`)
      }
      if (createEarningsDto.amount < 0 || createEarningsDto.amount > 100) {
        throw new ConflictException(`Percentage amount should be between 0 and 100`)
      }
      baseEarning = await this.findEarningById(dataSource, createEarningsDto.percentageOf)
      // const baseEarning = await earningsRepo.findOne({
      //   where: {
      //     id: createEarningsDto.percentageOf
      //   },
      // });

      if (!baseEarning) {
        throw new NotFoundException(`The base earning ID ${createEarningsDto.percentageOf} does not exist`)
      }
    }

    const earning = earningsRepo.create({
      ...createEarningsDto,
      percentageOf: baseEarning
    });
    const saved = await earningsRepo.save(earning);

    return {
      data: saved,
      change_of_data: {
        id: saved.id,
        earningName: saved.earningName,
        module: "Payroll",
        feature: "Earning",
        status: "Create",
      },
    };
  }
  async findEarnings(dataSource: DataSource) {
    const earningsRepo = dataSource.getRepository(Earnings);
    const existingEarnings = await earningsRepo.find({
      relations:{
        percentageOf:true
      }
    });
    return existingEarnings;
  }

  async findEarningById(dataSource: DataSource, id: number) {
    const earningsRepo = dataSource.getRepository(Earnings);
    const existingEarning = await earningsRepo.findOne({
      where: { id },
      relations:{
        percentageOf:true
      }
    });
    if (!existingEarning) {
      throw new NotFoundException(
        `Earning does not exists.`,
      );
    }
    return existingEarning;
  }

  async updateEarning(dataSource: DataSource, id: number, updateEarningsDto: UpdateEarningsDto) {
    const earningsRepo = dataSource.getRepository(Earnings);

    const existingEarning = await this.findEarningById(dataSource, id);

    if (!existingEarning.isEditable) {
      throw new ConflictException(`Earning cannot be edited`)
    }
    if (updateEarningsDto.earningName) {
      const exists = await earningsRepo.findOne({
        where: {
          earningName: ILike(updateEarningsDto.earningName),
          id: Not(existingEarning.id),
        },
      });
      if (exists) {
        throw new ConflictException(`Earning name ${updateEarningsDto.earningName} already exists`)
      }
    }
    if (updateEarningsDto.amount == 0) {
      throw new ConflictException(`Amount for Earning name ${updateEarningsDto.earningName} cannot be 0`)
    }

    updateEarningsDto.amount = updateEarningsDto.amount ?? existingEarning.amount;

    if (updateEarningsDto.calculationType == CalculationType.AMOUNT) {
      updateEarningsDto.percentageOf = null as any;
    }
    else {
      if (updateEarningsDto.amount < 0 || updateEarningsDto.amount > 100) {
        throw new ConflictException(`Percentage amount should be between 0 and 100`)
      }
      let baseEarning: any;
      if (updateEarningsDto.percentageOf) {

        baseEarning = await earningsRepo.findOne({
          where: {
            id: updateEarningsDto.percentageOf
          },
        });
        if (!baseEarning) {
          throw new NotFoundException(`The earning ${updateEarningsDto.percentageOf} to calculate amount from does not exist`)
        }
      }
      updateEarningsDto.percentageOf = baseEarning ?? existingEarning.percentageOf;

      if (!updateEarningsDto.percentageOf) {
        throw new ConflictException(`Earning to calaculate percentage from cannot be empty`)
      }
    }
    Object.assign(existingEarning, updateEarningsDto);
    const updatedEarning = await earningsRepo.save(existingEarning);
    return {
      data: updatedEarning,
      change_of_data: {
        id: updatedEarning.id,
        earningName: updatedEarning.earningName,
        module: "Payroll",
        feature: "Earning",
        status: "Update",
      },
    };
  }


  async deleteEarning(dataSource: DataSource, id: number) {
    const earningsRepo = dataSource.getRepository(Earnings);

    const existingEarning = await this.findEarningById(dataSource, id)

    if (!existingEarning.isEditable) {
      throw new ConflictException(`Earning cannot be deleted`)
    }
    await earningsRepo.remove(existingEarning);
    return {
      change_of_data: {
        id: existingEarning.id,
        designationName: existingEarning.earningName,
        module: "Payroll",
        feature: "Earning",
        status: "Delete",
      },
    };
  }
}
