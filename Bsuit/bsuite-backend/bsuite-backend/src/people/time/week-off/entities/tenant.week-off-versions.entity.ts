// import {
//   Column,
//   Entity,
//   ManyToOne,
//   JoinColumn,
//   CreateDateColumn,
//   UpdateDateColumn,
//   DeleteDateColumn,
//   PrimaryGeneratedColumn,
// } from 'typeorm';

// @Entity('biz_people_week_off_versions')
// export class WeekOffVersion {
//   @PrimaryGeneratedColumn({ name: 'id'})
//   id: number;

//   @ManyToOne(() => ShiftVersion, { nullable: true })
//   @JoinColumn({ name: 'shift_version_id' })
//   shift_version: ShiftVersion;

//   @ManyToOne(() => WeekOffPolicy, { nullable: true })
//   @JoinColumn({ name: 'weekoff_id' })
//   weekoff: WeekOffPolicy;

//   @ManyToOne(() => CustomUser)
//   @JoinColumn({ name: 'user_id' })
//   user: CustomUser;

//   @Column({ type: 'date', nullable: true })
//   effective_from_date: string;

//   @Column({ type: 'date', nullable: true })
//   effective_to_date: string;

//   @CreateDateColumn({ name: 'created_at' })
//   createdAt: Date;

//   @UpdateDateColumn({ name: 'updated_at' })
//   updatedAt: Date;

//   @DeleteDateColumn({ name: 'deleted_at' })
//   deletedAt: Date | null;
// }