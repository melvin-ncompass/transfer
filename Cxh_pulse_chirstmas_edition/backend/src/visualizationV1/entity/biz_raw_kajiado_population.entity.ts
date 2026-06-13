import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'biz_raw_kajiado_population' }) // Replace with actual table name
export class BizRawKajiadoPopulation {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'raw_ward' })
  rawWard: string;

  @Column({ name: 'raw_subcounty' })
  rawSubcounty: string;

  @Column({ name: 'raw_county' })
  rawCounty: string;

  @Column({ name: 'raw_month', type: 'int' })
  rawMonth: number;

  @Column({ name: 'raw_year', type: 'int' })
  rawYear: number;

  @Column({ name: 'raw_population', type: 'int' })
  rawPopulation: number;
}