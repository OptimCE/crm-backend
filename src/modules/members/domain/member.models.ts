import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToOne,
    PrimaryColumn,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import { Community } from "../../communities/domain/community.models.js";
import { Address } from "../../../shared/address/address.models.js";
import { MemberStatus, MemberType } from "../shared/member.types.js";

interface IIndividual extends Individual { }
interface ICompany extends Company { }
type CommunityType = Community;


/**
 * Entity representing a generic member.
 * Base class for Individual and Company.
 */
@Entity('member')
@Index('idx_member_home_addr', ['home_address'])
@Index('idx_member_billing_addr', ['billing_address'])
@Index('idx_member_community', ['community'])
export class Member {
    /**
     * Unique ID of the member.
     */
    @PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' })
    id!: number;

    /**
     * Name of the member.
     */
    @Column({ type: 'varchar', length: 255 })
    name!: string;

    /**
     * Home address.
     */
    @ManyToOne(() => Address, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'id_home_address' })
    home_address!: Address;

    /**
     * Billing address.
     */
    @ManyToOne(() => Address, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'id_billing_address' })
    billing_address!: Address;

    /**
     * IBAN for payments.
     */
    @Column({ name: 'iban', type: 'varchar', length: 255 })
    IBAN!: string;

    /**
     * Member status (Active, Inactive, etc.).
     */
    @Column({ type: 'int', enum: MemberStatus })
    status!: MemberStatus;

    /**
     * Member type (Individual or Company).
     */
    @Column({ name: 'member_type', type: 'int', enum: MemberType })
    member_type!: MemberType;

    @CreateDateColumn({ name: 'created_at' })
    created_at!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updated_at!: Date;

    /**
     * Community associated with the member.
     */
    @ManyToOne(() => Community, { onDelete: 'CASCADE', nullable: false })
    @JoinColumn({ name: 'id_community' })
    community!: CommunityType;

    // Optional relations for "subclasses" (Individual/LegalEntity)
    /**
     * Optional details if member is an Individual.
     */
    @OneToOne(() => Individual, (ind) => ind.member)
    individual_details!: IIndividual;

    /**
     * Optional details if member is a Company.
     */
    @OneToOne(() => Company, (le) => le.member)
    company_details!: ICompany;
}

/**
 * Entity representing a Manager (e.g. guardian or company rep).
 */
@Entity('manager')
@Index('idx_manager_community', ['community'])
export class Manager {
    /**
     * Unique ID of the manager.
     */
    @PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' })
    id!: number;

    /**
     * National Registry Number.
     */
    @Column({ name: 'nrn', type: 'varchar', length: 255 })
    NRN!: string;

    /**
     * First name.
     */
    @Column({ type: 'varchar', length: 255 })
    name!: string;

    /**
     * Surname.
     */
    @Column({ type: 'varchar', length: 255 })
    surname!: string;

    /**
     * Email address.
     */
    @Column({ type: 'varchar', length: 255 })
    email!: string;

    /**
     * Phone number.
     */
    @Column({ name: 'phone_number', type: 'varchar', length: 255, nullable: true })
    phone_number?: string;

    @CreateDateColumn({ name: 'created_at' })
    created_at!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updated_at!: Date;

    /**
     * Community context.
     */
    @ManyToOne(() => Community, { onDelete: 'CASCADE', nullable: false })
    @JoinColumn({ name: 'id_community' })
    community!: CommunityType;
}

/**
 * Entity representing specific details for an Individual member.
 */
@Entity('individual')
@Index('idx_individual_manager', ['manager'])
export class Individual {
    /**
     * Shared Primary Key with Member.
     */
    @PrimaryColumn({ type: 'int' })
    id!: number;

    @OneToOne(() => Member, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'id' })
    member!: Member;

    /**
     * First name.
     */
    @Column({ name: 'first_name', type: 'varchar', length: 255 })
    first_name!: string;

    /**
     * National Registry Number.
     */
    @Column({ name: 'nrn', type: 'varchar', length: 255 })
    NRN!: string;

    /**
     * Contact email.
     */
    @Column({ type: 'varchar', length: 255 })
    email!: string;

    /**
     * Phone number.
     */
    @Column({ name: 'phone_number', type: 'varchar', length: 255, nullable: true })
    phone_number!: string | null;

    /**
     * Social rate flag.
     */
    @Column({ name: 'social_rate', type: 'boolean', nullable: false, default: false })
    social_rate!: boolean;

    /**
     * Associated Manager (optional).
     */
    @ManyToOne(() => Manager, { nullable: true })
    @JoinColumn({ name: 'id_manager' })
    manager!: Manager | null;
}

/**
 * Entity representing specific details for a Company member.
 */
@Entity('company')
@Index('idx_companies_manager', ['manager'])
export class Company {
    /**
     * Shared Primary Key with Member.
     */
    @PrimaryColumn({ type: 'int' })
    id!: number;

    /**
     * Link to base Member entity.
     */
    @OneToOne(() => Member, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'id' })
    member!: Member;

    /**
     * VAT Number.
     */
    @Column({ name: 'vat_number', type: 'varchar', length: 255 })
    vat_number!: string;

    /**
     * Associated Manager.
     */
    @ManyToOne(() => Manager)
    @JoinColumn({ name: 'id_manager' })
    manager!: Manager;
}
