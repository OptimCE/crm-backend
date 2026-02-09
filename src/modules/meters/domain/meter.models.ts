import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryColumn,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import { Community } from "../../communities/domain/community.models.js";
import { Member } from "../../members/domain/member.models.js";
import { SharingOperation } from "../../sharing_operations/domain/sharing_operation.models.js";
import { Address } from "../../../shared/address/address.models.js";
import {
    ClientType,
    InjectionStatus,
    MeterDataStatus,
    MeterRate,
    ProductionChain,
    ReadingFrequency,
    TarifGroup
} from "../shared/meter.types.js";

/**
 * Entity representing a physical meter.
 * Identified by unique EAN code.
 */
@Entity('meter')
@Index('idx_meters_address', ['address'])
@Index('idx_meter_community', ['community'])
export class Meter {
    /**
     * EAN Code (Primary Key).
     */
    @PrimaryColumn({ name: 'ean', type: 'varchar' })
    EAN!: string;

    /**
     * Physical meter number.
     */
    @Column({ name: 'meter_number', type: 'varchar', length: 255 })
    meter_number!: string;

    /**
     * Address of the meter.
     */
    @ManyToOne(() => Address)
    @JoinColumn({ name: 'id_address' })
    address!: Address;

    /**
     * Tariff group (e.g. MONO_HOURLY).
     */
    @Column({ name: 'tarif_group', type: 'int', enum: TarifGroup })
    tarif_group!: TarifGroup;

    /**
     * Number of phases.
     */
    @Column({ name: 'phases_number', type: 'int' })
    phases_number!: number;

    /**
     * Reading frequency (Quarter-hourly, Yearly, etc.).
     */
    @Column({ name: 'reading_frequency', type: 'int', enum: ReadingFrequency })
    reading_frequency!: ReadingFrequency;

    @CreateDateColumn({ name: 'created_at' })
    created_at!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updated_at!: Date;

    /**
     * Community context.
     */
    @ManyToOne(() => Community, { onDelete: 'CASCADE', nullable: false })
    @JoinColumn({ name: 'id_community' })
    community!: Community;

    /**
     * Historical data configurations for this meter.
     */
    @OneToMany(() => MeterData, (meterData) => meterData.meter)
    meter_data!: MeterData[];
}


/**
 * Entity representing the configuration and status of a meter for a specific time range.
 */
@Entity('meter_data')
@Index('idx_meter_data_meter', ['meter'])
@Index('idx_meter_data_sharing_operation', ['sharing_operation'])
@Index('idx_meter_data_member', ['member'])
@Index('idx_meter_data_community', ['community'])
export class MeterData {
    /**
     * Unique ID.
     */
    @PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' })
    id!: number;

    /**
     * Description or label.
     */
    @Column({ type: 'text', nullable: true })
    description!: string | null;

    /**
     * Associated physical meter.
     */
    @ManyToOne(() => Meter, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'ean' })
    meter!: Meter;

    /**
     * Meter status (Active, Inactive, etc.).
     */
    @Column({ type: 'int', enum: MeterDataStatus })
    status!: MeterDataStatus;

    /**
     * Sampling power.
     */
    @Column({ name: 'sampling_power', type: 'float', nullable: true })
    sampling_power!: number | null;

    /**
     * Amperage.
     */
    @Column({ type: 'float', nullable: true })
    amperage!: number | null;

    /**
     * Rate (Single, Double, etc.).
     */
    @Column({ type: 'int', enum: MeterRate })
    rate!: MeterRate;

    /**
     * Client type.
     */
    @Column({ name: 'client_type', type: 'int', enum: ClientType })
    client_type!: ClientType;

    /**
     * Member associated with the meter (holder).
     */
    @ManyToOne(() => Member, { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: 'id_member' })
    member!: Member | null;

    /**
     * Start date of this configuration.
     */
    @Column({ name: 'start_date', type: 'date' })
    start_date!: string;

    /**
     * End date of this configuration.
     */
    @Column({ name: 'end_date', type: 'date', nullable: true })
    end_date!: string | null;

    /**
     * Injection status.
     */
    @Column({ name: 'injection_status', type: 'int', nullable: true, enum: InjectionStatus })
    injection_status!: InjectionStatus | null;

    /**
     * Production chain type.
     */
    @Column({ name: 'production_chain', type: 'int', nullable: true, enum: ProductionChain })
    production_chain!: ProductionChain | null;

    /**
     * Total generating capacity.
     */
    @Column({ name: 'total_generating_capacity', type: 'float', nullable: true })
    total_generating_capacity!: number | null;

    /**
     * GRD (DSO) identifier.
     */
    @Column({ type: 'varchar', length: 255, nullable: true })
    grd!: string | null;

    /**
     * Associated sharing operation details.
     */
    @ManyToOne(() => SharingOperation, { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: 'id_sharing_operation' })
    sharing_operation!: SharingOperation | null;

    @CreateDateColumn({ name: 'created_at' })
    created_at!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updated_at!: Date;

    @ManyToOne(() => Community, { onDelete: 'CASCADE', nullable: false })
    @JoinColumn({ name: 'id_community' })
    community!: Community;
}

/**
 * Entity representing meter consumption/injection data point.
 */
@Entity('meter_consumption')
@Index('idx_meter_consumption_meter', ['meter'])
@Index('idx_meter_consumption_sharing_operation', ['sharing_operation'])
@Index('idx_meter_consumption_community', ['community'])
export class MeterConsumption {
    @PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' })
    id!: number;

    /**
     * Associated meter.
     */
    @ManyToOne(() => Meter, { onDelete: 'CASCADE', nullable: false })
    @JoinColumn({ name: 'ean' })
    meter!: Meter | null;

    /**
     * Associated sharing operation during this consumption.
     */
    @ManyToOne(() => SharingOperation, { nullable: true })
    @JoinColumn({ name: 'id_sharing_operation' })
    sharing_operation!: SharingOperation | null;

    /**
     * Timestamp of reading.
     */
    @Column({ type: 'timestamptz' })
    timestamp!: Date;

    /**
     * Gross consumption.
     */
    @Column({ type: 'float', nullable: true })
    gross!: number | null;

    /**
     * Net consumption.
     */
    @Column({ type: 'float', nullable: true })
    net!: number | null;

    /**
     * Shared consumption.
     */
    @Column({ type: 'float', nullable: true })
    shared!: number | null;

    /**
     * Gross injection.
     */
    @Column({ name: 'inj_gross', type: 'float', nullable: true })
    inj_gross!: number | null;

    /**
     * Shared injection.
     */
    @Column({ name: 'inj_shared', type: 'float', nullable: true })
    inj_shared!: number | null;

    /**
     * Net injection.
     */
    @Column({ name: 'inj_net', type: 'float', nullable: true })
    inj_net!: number | null;

    @CreateDateColumn({ name: 'created_at' })
    created_at!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updated_at!: Date;

    @ManyToOne(() => Community, { onDelete: 'CASCADE', nullable: false })
    @JoinColumn({ name: 'id_community' })
    community!: Community;
}