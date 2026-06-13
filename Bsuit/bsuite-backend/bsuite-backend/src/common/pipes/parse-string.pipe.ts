import { PipeTransform, BadRequestException } from '@nestjs/common';

export class ParseStringPipe implements PipeTransform {
  constructor(private readonly fieldName = 'Value') {} 

  transform(value: any) {
    if (value === undefined || value === null) {
      throw new BadRequestException(`${this.fieldName} is required`);
    }

    if (typeof value !== 'string') {
      throw new BadRequestException(`${this.fieldName} must be a string`);
    }

    const trimmed = value.trim();

    if (!trimmed.length) {
      throw new BadRequestException(`${this.fieldName} must not be empty`);
    }

    return trimmed;
  }
}
 