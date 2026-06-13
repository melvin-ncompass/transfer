import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum OperationType {
  INSERT = 'INSERT',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

@Entity({ name: 'sys_audit_log' })
@Index(['entityName', 'entityId'])
export class SysAuditLog {
  @PrimaryGeneratedColumn('uuid',{name:'id'})
  id: number;

  @Index()
  @Column({name:'entity_name'})
  entityName: string;

  @Index()
  @Column({name:'entity_id'})
  entityId: number;

  @Column({ type: 'enum', enum: OperationType, name:'operation_type' })
  operationType: OperationType;

  @Column({ type: 'jsonb', nullable: true, name:'old_data' })
  oldData: any;

  @Column({ type: 'jsonb', nullable: true, name:'new_data' })
  newData: any;

  @Index()
  @Column({ nullable: true , name:'operation_by'})
  operationBy: number;

  @CreateDateColumn({ name: 'operation_at' })
  operationAt: Date;
}
