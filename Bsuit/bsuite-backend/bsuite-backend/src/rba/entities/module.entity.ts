import { Entity, Column, PrimaryGeneratedColumn, Unique, OneToMany, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Permission } from './permission.entity';
import { BsuiteApps } from 'src/common/enum/bsuite-apps.enum';
import { Exclude } from 'class-transformer';

@Entity({ name: 'modules' })
@Unique(['moduleName', 'app'])
export class Module {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'module_name', length: 100 })
    moduleName: string;

    @Column({
        name: 'app',
        type: 'enum',
        enum: BsuiteApps
    })
    app: BsuiteApps;

    @ManyToOne(() => Module, (module) => module.children, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'parent_module_id' })
    parentModule: Module | null;

    @OneToMany(() => Module, (module) => module.parentModule)
    children: Module[];

    @OneToMany(() => Permission, (permission) => permission.module)
    permissions: Permission[];

    @Exclude()
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date

    @Exclude()
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date
}
