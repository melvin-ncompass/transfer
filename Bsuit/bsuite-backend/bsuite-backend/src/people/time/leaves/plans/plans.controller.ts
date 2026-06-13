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
// import { LeavePlansService } from 'src/people/time/leaves/plans/plans.service'
// import { CreateLeavePlanDto } from './dto/create-leave-plan.dto';
// import { UpdateLeavePlanDto } from './dto/update-leave-plan.dto';

// @Controller('leave-plans')
// @UseGuards(JwtAuthGuard, CompanyGuard)
// export class LeavePlansController {

//   constructor(private readonly LeavePlansService: LeavePlansService) {}
  

//   @Post()
//   async createLeavePlan(
//     @CompanyDB() dataSource: DataSource,
//     @Body() createLeavePlanDto : CreateLeavePlanDto
//   ) {
//     const createdLeavePlan = 
//       await this.LeavePlansService.createLeavePlan(dataSource,createLeavePlanDto);
    
//     return { 
//       data: createdLeavePlan, 
//       message: "Created Leave Plan" 
//     };
//   }

//   @Get()
//   async getLeavePlans(
//     @CompanyDB() dataSource: DataSource,
//   ) {
//     const leavePlans =
//       await this.LeavePlansService.getLeavePlans(dataSource);

//     return {
//       data: leavePlans,
//       message: 'Fetched all Leave Plans',
//     };
//   }

//   @Get(':id')
//   async getLeavePlan(
//     @CompanyDB() dataSource: DataSource,
//     @Param('id') id: string,
//   ) {
//     const leavePlan =
//       await this.LeavePlansService.getLeavePlans(dataSource, id);

//     return {
//       data: leavePlan,
//       message: 'Fetched Leave Plan',
//     };
//   }


//   @Put(':id')
//   async updateLeavePlan(
//     @CompanyDB() dataSource: DataSource,
//     @Param('id') id: string, 
//     @Body() updateLeavePlanDto: UpdateLeavePlanDto
//   ) {
//     const updatedLeavePlan = 
//       await this.LeavePlansService.updateLeavePlan(dataSource,id, updateLeavePlanDto);
    
//     return { 
//       data: updatedLeavePlan, 
//       message: "Updated Leave Plan" 
//     };
//   }

//   @Delete(':id')
//   async deleteLeavePlan(
//     @CompanyDB() dataSource: DataSource,
//     @Param('id') id: string
//   ) {
//     const deletedLeavePlan = 
//       await this.LeavePlansService.deleteLeavePlan(dataSource,id);
    
//     return { 
//       data: deletedLeavePlan, 
//       message: "Deleted Leave Plan" 
//     };
//   }
// }