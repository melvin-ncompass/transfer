import {
  EventSubscriber,
  EntitySubscriberInterface,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
  DataSource,
} from 'typeorm';
import { SysAuditLog, OperationType } from './entity/audit-log.entity';

@EventSubscriber()
export class AuditSubscriber implements EntitySubscriberInterface<any> {
  constructor(private dataSource: DataSource,) {
    this.dataSource.subscribers.push(this);
  }

  listenTo() {
    return Object; // Listen to all entities
  }

  async afterInsert(event: InsertEvent<any>) {
    if (event.metadata.tableName === 'audit_log') return;
    await event.manager.getRepository(SysAuditLog).save({
      entityName: event.metadata.tableName,
      entityId: event.entity.id,
      operationType: OperationType.INSERT,
      oldData: null,
      newData: event.entity,
      operationBy: event.queryRunner.data?.userId || null,
    });
  }

  async afterUpdate(event: UpdateEvent<any>) {
    if (event.metadata.tableName === 'audit_log') return;

    const hasChanges =
      event.updatedColumns.length > 0 || event.updatedRelations.length > 0;
    if (!hasChanges) return;

    await event.manager.getRepository(SysAuditLog).save({
      entityName: event.metadata.tableName,
      entityId: event.databaseEntity?.id,
      operationType: OperationType.UPDATE,
      oldData: event.databaseEntity,
      newData: event.entity,
      operationBy: event.queryRunner.data?.userId || null,
    });
  }

  async afterRemove(event: RemoveEvent<any>) {
    if (event.metadata.tableName === 'audit_log') return;
    await event.manager.getRepository(SysAuditLog).save({
      entityName: event.metadata.tableName,
      entityId: event.entity?.id,
      operationType: OperationType.DELETE,
      oldData: event.entity,
      newData: null,
      operationBy: event.queryRunner.data?.userId || null,
    });
  }

}
