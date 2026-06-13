// import {
//   Body,
//   Controller,
//   Delete,
//   Get,
//   Param,
//   Patch,
//   Post,
//   Put,
//   UseGuards,
// } from '@nestjs/common';
// import { DataSource } from 'typeorm';
// import { JwtAuthGuard } from 'src/common/guard/jwt.auth.guard';
// import { CompanyGuard } from 'src/common/guard/company.guard';
// import { CompanyDB } from 'src/common/decorators/get-db.decorator';
// import { ShiftsService } from 'src/people/time/shifts/shifts.service'
// import { CreateShiftDto } from './dto/create-shift.dto';
// import { UpdateShiftDto } from './dto/update-shift.dto';

// @Controller('shifts')
// @UseGuards(JwtAuthGuard, CompanyGuard)
// export class ShiftsController {

//   constructor(private readonly ShiftsService: ShiftsService) {}

//   @Post()
//   async createShift(
//     @CompanyDB() dataSource: DataSource,
//     @Body() createShiftDto : CreateShiftDto
//   ) {
//     const createdLeavePlan = 
//       await this.ShiftsService.createShift(dataSource,createShiftDto);
    
//     return { 
//       data: createdLeavePlan, 
//       message: "Created Shift" 
//     };
//   }

//   @Get()
//   async getShifts(
//     @CompanyDB() dataSource: DataSource,
//   ) {
//     const shifts =
//       await this.ShiftsService.getShifts(dataSource);

//     return {
//       data: shifts,
//       message: 'Fetched all Shifts',
//     };
//   }

//   @Get(':id')
//   async getShift(
//     @CompanyDB() dataSource: DataSource,
//     @Param('id') id: string,
//   ) {
//     const shift =
//       await this.ShiftsService.getShifts(dataSource, id);

//     return {
//       data: shift,
//       message: 'Fetched Shift',
//     };
//   }

//   @Put(':id')
//   async updateShift(
//     @CompanyDB() dataSource: DataSource,
//     @Param('id') id: string,
//     @Body() updateShiftDto : UpdateShiftDto
//   ) {
//     const updatedShift = 
//       await this.ShiftsService.updateShift(dataSource,+id,updateShiftDto);
    
//     return { 
//       data: updatedShift, 
//       message: "Updated Shift" 
//     };
//   }

//   @Delete(':id')
//   async deleteShift(
//     @CompanyDB() dataSource: DataSource,
//     @Param('id') id: string
//   ) {
//     const deletedShift = 
//       await this.ShiftsService.deleteShift(dataSource,+id);
    
//     return { 
//       data: deletedShift, 
//       message: "Deleted Shift" 
//     };
//   }
// }