// import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
// import { DataSource, ILike, In, Repository } from 'typeorm';
// import { Shifts } from './entities/tenant.shifts.entity';
// import { CreateShiftDto } from './dto/create-shift.dto';
// import { ShiftVersions } from './entities/tenant.shift-versions.entity';
// import { UpdateShiftDto } from './dto/update-shift.dto';

// @Injectable()
// export class ShiftsService {

//     // IMPORTANT : Date and time save should be checked 
//     async createShift(
//         dataSource: DataSource,
//         createShiftDto: CreateShiftDto,
//     ) {
//       return dataSource.transaction(async manager => {
//         // Shift name uniqueness
//         const existingShift = await manager.findOne(Shifts, {
//             where: { shiftName: ILike(createShiftDto.shiftName) },
//         });

//         if (existingShift) {
//             throw new Error('Shift with this name already exists.');
//         }

//         // Only one default shift
//         if (createShiftDto.isDefault) {
//             const existingDefault = await manager.findOne(Shifts, {
//                 where: { isDefault: true },
//             });

//             if (existingDefault) {
//                 throw new Error('A default shift already exists.');
//             }
//         }

//         // Create Shift
//         const shift = manager.create(Shifts, {
//         shiftName: createShiftDto.shiftName,
//         isDefault: createShiftDto.isDefault ?? false,
//         });

//         await manager.save(shift);

//         // Create Shift Version
//         const shiftVersion = manager.create(ShiftVersions as any, {
//             shift: shift,
//             shiftType: createShiftDto.shiftType, 
//             workingDays: createShiftDto.workingDays,
//             grossHours: createShiftDto.grossHours ?? null,
//             shiftFromTime: createShiftDto.shiftFromTime ?? null,
//             shiftToTime: createShiftDto.shiftToTime ?? null,
//             breakDuration: createShiftDto.breakDuration ?? null,
//             effectiveFromDate: createShiftDto.effectiveFromDate ?? null,
//         });


//         await manager.save(shiftVersion);

//         return {
//             shift,
//             shiftVersion,
//         };
//       });
//     }

//     // async getShifts(
//     //     dataSource: DataSource,
//     //     id?: string, // optional shift id
//     // ) {
//     //     const shiftRepository = dataSource.getRepository(Shifts);

//     //     if (id) {
//     //         // Get single shift by id with its versions
//     //         const shift = await shiftRepository.findOne({
//     //             where: { id },
//     //             relations: ['shiftVersions'], 
//     //         });

//     //         if (!shift) {
//     //         throw new Error('Shift not found');
//     //         }

//     //         return shift;
//     //     } else {
//     //         // Get all shifts with their versions
//     //         const shifts = await shiftRepository.find({
//     //         relations: ['shiftVersions'],
//     //         order: { createdAt: 'DESC' },
//     //         });

//     //         return shifts;
//     //     }
//     // }

//     async getShifts(
//     dataSource: DataSource,
//     id?: string // optional shift id
//     ) {
//         const shiftRepository = dataSource.getRepository(Shifts);

//         // Use QueryBuilder to handle optional filtering in a single query
//         const query = shiftRepository
//             .createQueryBuilder('shift')
//             .leftJoinAndSelect('shift.shiftVersions', 'shiftVersion')
//             .orderBy('shift.createdAt', 'DESC');

//         // Apply filter if id is provided
//         if (id) {
//             query.andWhere('shift.id = :id', { id });
//         }

//         const shifts = await query.getMany();

//         // If id was provided but no record found, throw error
//         if (id && shifts.length === 0) {
//             throw new Error('Shift not found');
//         }

//         // Return single object if id was provided, else return array
//         return id ? shifts[0] : shifts;
//     }

//     async updateShift(
//         dataSource: DataSource,
//         id: number,
//         updateShiftDto: UpdateShiftDto,
//     ) {
//         return dataSource.transaction(async manager => {
//             // Fetch shift
//             const shift = await manager.findOne(Shifts, {
//                 where: { id },
//                 relations: ['shiftVersions'],
//             });

//             if (!shift) {
//                 throw new Error('Shift not found');
//             }

//             // Shift name uniqueness (if changed)
//             if (
//                 updateShiftDto.shiftName &&
//                 updateShiftDto.shiftName !== shift.shiftName
//             ) {
//                 const existingShift = await manager.findOne(Shifts, {
//                     where: { shiftName: ILike(updateShiftDto.shiftName) },
//                 });

//                 if (existingShift) {
//                     throw new Error('Shift with this name already exists.');
//                 }

//                 shift.shiftName = updateShiftDto.shiftName;
//             }

//             // Default shift constraint
//             if (updateShiftDto.isDefault === true && !shift.isDefault) {
//                 const existingDefault = await manager.findOne(Shifts, {
//                     where: { isDefault: true },
//                 });

//                 if (existingDefault) {
//                     throw new Error('A default shift already exists.');
//                 }

//                 shift.isDefault = true;
//             }

//             if (updateShiftDto.isDefault === false) {
//                 shift.isDefault = false;
//             }

//             // Save shift master
//             await manager.save(Shifts, shift);

//             const activeVersion = await manager.findOne(ShiftVersions, {
//                 where: {
//                     shift: { id: shift.id },
//                 },
//                 order: { createdAt: 'DESC' },
//             });

//             if (activeVersion) {
//                 await manager.softRemove(activeVersion);
//             }

//             // Create new shift version
//             const newVersion = manager.create(
//                 ShiftVersions as any,
//                 {
//                     shift: shift,
//                     shiftType: updateShiftDto.shiftType,
//                     workingDays: updateShiftDto.workingDays,
//                     grossHours: updateShiftDto.grossHours ?? null,
//                     shiftFromTime: updateShiftDto.shiftFromTime ?? null,
//                     shiftToTime: updateShiftDto.shiftToTime ?? null,
//                     breakDuration: updateShiftDto.breakDuration ?? null,
//                     effectiveFromDate: updateShiftDto.effectiveFromDate ?? null,
//                 }
//             );

//             await manager.save(newVersion);

//             return {
//                 shift,
//                 shiftVersion: newVersion,
//             };
//         });
//     }

//     async deleteShift(
//         dataSource: DataSource,
//         id: number,
//     ) {
//         return dataSource.transaction(async manager => {
//             const shift = await manager.findOne(Shifts, {
//                 where: { id: id },
//             });

//             if (!shift) {
//                 throw new Error('Shift not found');
//             }

//             await manager.remove(Shifts, shift);
//         });
//     }

// }
