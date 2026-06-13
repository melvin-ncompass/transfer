import { ApiProperty } from '@nestjs/swagger';

export class EnabledMethodsDto {
  @ApiProperty({ example: ['google', 'questions'], isArray: true })
  methods: string[];
}