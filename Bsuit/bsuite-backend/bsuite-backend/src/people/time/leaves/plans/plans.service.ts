// import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { DataSource, In, Repository } from 'typeorm';
// import { LeavePlans } from './entities/tenant.leave-plans.entity';
// import { LeavePlanDetails } from './entities/tenant.leave-plan-details.entity';
// import { CreateLeavePlanDto } from './dto/create-leave-plan.dto';
// import { UpdateLeavePlanDto } from './dto/update-leave-plan.dto';

// @Injectable()
// export class LeavePlansService {

//     async createLeavePlan(
//       dataSource: DataSource,
//       createLeavePlanDto: CreateLeavePlanDto,
//     ) {
//       return dataSource.transaction(async manager => {
//         const leavePlanRepo = manager.getRepository(LeavePlans);
//         const leavePlanDetailRepo = manager.getRepository(LeavePlanDetails);
//         const leaveTypeRepo = manager.getRepository(LeaveType);

//         /* -------------------- VALIDATIONS -------------------- */

//         if (!createLeavePlanDto.leaves?.length) {
//         throw new BadRequestException(
//             'At least one leave must be added to a leave plan',
//         );
//         }

//         const existingPlan = await leavePlanRepo.findOne({
//           where: { name: createLeavePlanDto.name },
//         });

//         if (existingPlan) {
//         throw new BadRequestException(
//             'Leave plan with this name already exists',
//         );
//         }

//         /* -------------------- CREATE LEAVE PLAN -------------------- */

//         const leavePlan = leavePlanRepo.create({
//             name: createLeavePlanDto.name,
//             leaveCalendar: createLeavePlanDto.leaveCalendar,
//             calendarMonth: createLeavePlanDto.calendarMonth,
//         });

//         await leavePlanRepo.save(leavePlan);

//         /* -------------------- VALIDATE LEAVE TYPE IDS -------------------- */

//         // Remove duplicates (important)
//         const leaveTypeIds = [...new Set(createLeavePlanDto.leaves)];

//         const validLeaveTypes = await leaveTypeRepo.find({
//             where: { id: In(leaveTypeIds) },
//         });

//         if (validLeaveTypes.length !== leaveTypeIds.length) {
//             throw new BadRequestException('One or more leave types are invalid');
//         }

//         /* -------------------- CREATE LEAVE PLAN DETAILS -------------------- */

//         const planDetails = leaveTypeIds.map(leaveTypeId =>
//             leavePlanDetailRepo.create({
//                 leavePlan,
//                 leaveType: { id: leaveTypeId },
//             }),
//         );

//         await leavePlanDetailRepo.save(planDetails);

//         /* -------------------- RESPONSE -------------------- */

//         return {
//             data: {
//                 id: leavePlan.id,
//                 name: leavePlan.name,
//             },
//             change_of_data: {
//                 id: leavePlan.id,
//                 transactionTypeName: leavePlan.name,
//                 transactionTypeId: leavePlan.id,
//                 module: 'Leave',
//                 feature: 'Leave Plan',
//                 status: 'Create',
//             },
//         };
//       });
//     }

//     // async getLeavePlans(
//     // dataSource: DataSource,
//     // id?: string,
//     // ) {
//     // const leavePlanRepo = dataSource.getRepository(LeavePlans);

//     // if (id) {
//     //     const leavePlan = await leavePlanRepo.findOne({
//     //     where: { id },
//     //     relations: {
//     //         LeavePlanDetails: {
//     //         leaveType: true,
//     //         },
//     //     },
//     //     order: {
//     //         LeavePlanDetails: {
//     //         id: 'ASC',
//     //         },
//     //     },
//     //     });

//     //     if (!leavePlan) {
//     //     throw new NotFoundException('Leave plan not found');
//     //     }

//     //     return leavePlan;
//     // }

//     // // Fetch all leave plans
//     // return leavePlanRepo.find({
//     //     relations: {
//     //     LeavePlanDetails: {
//     //         leaveType: true,
//     //     },
//     //     },
//     //     order: {
//     //     createdAt: 'DESC',
//     //     LeavePlanDetails: {
//     //         id: 'ASC',
//     //     },
//     //     },
//     // });
//     // }

//     async getLeavePlans(
//     dataSource: DataSource,
//     id?: string,
//     ) {
//     const leavePlanRepo = dataSource.getRepository(LeavePlans);

//     const qb = leavePlanRepo
//         .createQueryBuilder('leavePlan')
//         .leftJoinAndSelect(
//         'leavePlan.LeavePlanDetails',
//         'leavePlanDetail',
//         )
//         .leftJoinAndSelect(
//         'leavePlanDetail.leaveType',
//         'leaveType',
//         )
//         .orderBy('leavePlan.createdAt', 'DESC')
//         .addOrderBy('leavePlanDetail.createdAt', 'ASC');

//     // Apply filter only if id is provided
//     if (id) {
//         qb.andWhere('leavePlan.id = :id', { id });
//     }

//     const result = id ? await qb.getOne() : await qb.getMany();

//     if (id && !result) {
//         throw new NotFoundException('Leave plan not found');
//     }

//     return result;
//     }

//     async updateLeavePlan(
//       dataSource: DataSource,
//       id: string,
//       updateLeavePlanDto: UpdateLeavePlanDto,
//     ) {
//     return dataSource.transaction(async manager => {
//         const leaveTypeRepo = manager.getRepository(LeaveType);
//         const leavePlanRepo = manager.getRepository(LeavePlans);
//         const planDetailRepo = manager.getRepository(LeavePlanDetails);

//         /* -------------------- FETCH PLAN -------------------- */

//         const plan = await leavePlanRepo.findOne({
//             where: { id },
//             relations: ['LeavePlanDetails', 'LeavePlanDetails.leaveType'],
//         });

//         if (!plan) {
//             throw new NotFoundException('Leave plan not found');
//         }

//         /* -------------------- VALIDATION -------------------- */

//         const incomingLeaveIds = updateLeavePlanDto.leaves ?? [];

//         if (!incomingLeaveIds.length) {
//             throw new BadRequestException(
//                 'At least one leave must be present in a leave plan',
//             );
//         }

//         /* -------------------- UPDATE PLAN FIELDS -------------------- */

//         plan.name = updateLeavePlanDto.name ?? plan.name;
//         plan.leaveCalendar =
//         updateLeavePlanDto.leaveCalendar ?? plan.leaveCalendar;
//         plan.calendarMonth =
//         updateLeavePlanDto.calendarMonth ?? plan.calendarMonth;

//         await leavePlanRepo.save(plan);

//         /* -------------------- VALIDATE LEAVE TYPE IDS -------------------- */

//         const validLeaveTypes = await leaveTypeRepo.find({
//         where: { id: In(incomingLeaveIds) },
//         });

//         if (validLeaveTypes.length !== incomingLeaveIds.length) {
//             throw new BadRequestException('One or more leave types are invalid');
//         }

//         const validLeaveMap = new Map(
//             validLeaveTypes.map(lt => [lt.id, lt]),
//         );

//         /* -------------------- EXISTING DETAILS MAP -------------------- */

//         const existingMap = new Map(
//             plan.LeavePlanDetails.map(d => [d.leaveType.id, d]),
//         );

//         /* -------------------- UPSERT DETAILS -------------------- */

//         const detailsToCreate: LeavePlanDetails[] = [];

//         for (const leaveTypeId of incomingLeaveIds) {
//         if (!existingMap.has(leaveTypeId)) {
//             detailsToCreate.push(
//                 planDetailRepo.create({
//                     leavePlan: plan,
//                     leaveType: validLeaveMap.get(leaveTypeId)!,
//                 }),
//             );
//         }
//         }

//         if (detailsToCreate.length) {
//          await planDetailRepo.save(detailsToCreate);
//         }

//         /* -------------------- DELETE REMOVED LEAVES -------------------- */

//         const incomingSet = new Set(incomingLeaveIds);

//         const toDelete = plan.LeavePlanDetails.filter(
//             d => !incomingSet.has(d.leaveType.id),
//         );

//         if (toDelete.length) {
//             await planDetailRepo.delete(toDelete.map(d => d.id));
//         }

//         /* -------------------- RETURN UPDATED PLAN -------------------- */

//         return leavePlanRepo.findOne({
//             where: { id },
//             relations: ['LeavePlanDetails', 'LeavePlanDetails.leaveType'],
//         });
//       });
//     }

//     async deleteLeavePlan(
//     dataSource: DataSource,
//     id: string,
//     ) {
//     return dataSource.transaction(async manager => {
//         const leavePlanRepo = manager.getRepository(LeavePlans);

//         const leavePlan = await leavePlanRepo.findOne({
//         where: { id },
//         });

//         if (!leavePlan) {
//         throw new NotFoundException('Leave Plan not found');
//         }

//         await leavePlanRepo.delete(id);

//         return {
//         data: {
//             id: leavePlan.id,
//         },
//         message: 'Leave Plan deleted successfully',
//         change_of_data: {
//             id: leavePlan.id,
//             transactionTypeName: leavePlan.name,
//             transactionTypeId: leavePlan.id,
//             module: 'Leave',
//             feature: 'Leave Plan',
//             status: 'Delete',
//         },
//         };
//     });
//     }
    
// }