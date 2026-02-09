import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne, OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import { CommunityUser } from "../../communities/domain/community.models.js";
import { Member } from "../../members/domain/member.models.js";
import { Address } from "../../../shared/address/address.models.js";
type CommunityUserType = CommunityUser;
type MemberType = Member;
type AddressType = Address;

/**
 * Entity representing a system user.
 * Authenticated via external IAM.
 */
@Entity('user') // Quoted in SQL because 'user' is reserved
@Index('idx_home_addr_user', ['homeAddress'])
@Index('idx_billing_addr_user', ['billingAddress'])
export class User {
    @PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' })
    id!: number;

    /**
     * User's email address (unique).
     */
    @Column({ type: 'text', unique: true })
    email!: string;

    @Column({ name: 'first_name', type: 'text', nullable: true })
    firstName?: string | null;

    @Column({ name: 'last_name', type: 'text', nullable: true })
    lastName?: string | null;

    @Column({ name: 'nrn', type: 'text', nullable: true })
    NRN?: string | null;

    @Column({ name: 'phone_number', type: 'text', nullable: true })
    phoneNumber?: string | null;

    @Column({ name: 'iban', type: 'text', nullable: true })
    iban!: string | null;

    @ManyToOne(() => Address)
    @JoinColumn({ name: 'id_home_address' })
    homeAddress?: AddressType;

    @ManyToOne(() => Address)
    @JoinColumn({ name: 'id_billing_address' })
    billingAddress?: AddressType;

    @CreateDateColumn({ name: 'created_at' })
    created_at!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updated_at!: Date;

    /**
     * External Authentication ID (from IAM service).
     */
    @Column({ name: 'auth_user_id', type: 'varchar', length: 255, unique: true, nullable: false })
    auth_user_id!: string;
    // Inverse side: One User has many CommunityUser entries (memberships)
    @OneToMany(() => CommunityUser, (communityUser) => communityUser.user)
    memberships!: CommunityUserType[];
}

/**
 * Join entity linking a User to a Member (if applicable).
 */
@Entity('user_member_link')
@Index('idx_user_member_link_user', ['user'])
@Index('idx_user_member_link_member', ['member'])
export class UserMemberLink {
    @PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' })
    id!: number;

    @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'id_user' })
    user!: User;

    @ManyToOne(() => Member, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'id_member' })
    member!: MemberType;

    @CreateDateColumn({ name: 'created_at' })
    created_at!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updated_at!: Date;
}

