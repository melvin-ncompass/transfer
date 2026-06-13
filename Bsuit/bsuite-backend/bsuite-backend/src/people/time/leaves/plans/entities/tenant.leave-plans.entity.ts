// import {
//   Entity,
//   Column,
//   OneToMany,
//   CreateDateColumn,
//   UpdateDateColumn,
//   PrimaryGeneratedColumn,
// } from 'typeorm';
// import { LeavePlanDetails } from './tenant.leave-plan-details.entity';

// @Entity('biz_people_leave_plans')
// export class LeavePlans {
//   @PrimaryGeneratedColumn( { name: 'id' } )
//   id: number;

//   @Column({ name: 'name', unique: true, length: 150 })
//   name: string;

//   @Column({ name: 'leave_calendar', length: 150 })
//   leaveCalendar: string;

//   @Column({ name: 'calendar_month', type: 'date', nullable: true })
//   calendarMonth?: Date;

//   @OneToMany(
//     () => LeavePlanDetails,
//     detail => detail.leavePlan,
//     { cascade: true },
//   )
//   LeavePlanDetails: LeavePlanDetails[];

//   @CreateDateColumn({ name: 'created_at' })
//   createdAt: Date;

//   @UpdateDateColumn({ name: 'updated_at' })
//   updatedAt: Date;
// }
