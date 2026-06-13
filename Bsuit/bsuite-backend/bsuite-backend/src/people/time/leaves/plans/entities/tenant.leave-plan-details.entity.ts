// import {
//   Unique,
//   Entity,
//   ManyToOne,
//   JoinColumn,
//   CreateDateColumn,
//   UpdateDateColumn,
//   DeleteDateColumn,
//   PrimaryGeneratedColumn,
// } from 'typeorm';
// import { LeavePlans } from './tenant.leave-plans.entity';
// import { LeaveType } from './leave-data.entity';

// @Entity('biz_people_leave_plan_details')
// // @Unique(['leavePlan', 'leaveType'])
// export class LeavePlanDetails {
//   @PrimaryGeneratedColumn( { name: 'id' } )
//   id: number;

//   @ManyToOne(() => LeavePlans, plan => plan.LeavePlanDetails, {
//     onDelete: 'RESTRICT',
//   })
//   @JoinColumn({ name: 'leave_plan_id' })
//   leavePlan: LeavePlans;

//   @ManyToOne(() => LeaveType, {
//     onDelete: 'RESTRICT',
//   })
//   @JoinColumn({ name: 'leave_type_id' })
//   leaveType: LeaveType;

//   @CreateDateColumn({ name: 'created_at' })
//   createdAt: Date;

//   @UpdateDateColumn({ name: 'updated_at' })
//   updatedAt: Date;

//   @DeleteDateColumn({ name: 'deleted_at' })
//   deletedAt: Date | null;
// }
