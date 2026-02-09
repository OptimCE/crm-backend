import {
    Column,
    CreateDateColumn,
    Entity,
    Index, JoinColumn, ManyToOne,
    OneToMany, PrimaryColumn,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import { Role } from "../../../shared/dtos/role.js";
import { User } from "../../users/domain/user.models.js";

/**
 * Entity representing a Community.
 * Stores community details and links to members.
 */
@Entity('community')
export class Community {
    /**
     * Unique ID of the community.
     * Auto-generated identity column.
     */
    @PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' })
    id!: number;

    /**
     * Name of the community.
     * Must be unique.
     */
    @Column({ type: 'varchar', length: 255, unique: true })
    name!: string;

    /**
     * External Authentication ID for the community (e.g. from Keycloak/Auth0).
     */
    @Column({ name: 'auth_community_id', type: 'varchar', length: 255, unique: true, nullable: false })
    auth_community_id!: string;

    @CreateDateColumn({ name: 'created_at' })
    created_at!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updated_at!: Date;


    // Inverse side: One Community has many CommunityUser entries
    @OneToMany(() => CommunityUser, (communityUser) => communityUser.community)
    users!: CommunityUser[];
}

/**
 * Join table entity linking Users and Communities with a Role.
 * Represents a user's membership in a community.
 */
@Entity("community_user")
@Index("idx_community_user_community", ['id_community'])
@Index("idx_community_user_user", ['id_user'])
export class CommunityUser {

    /**
     * ID of the community. Part of the composite primary key.
     */
    // 1. Explicit ID Column (Foreign Key holder)
    // changed to 'int' to match Community.id
    @PrimaryColumn({ name: 'id_community', type: 'int' })
    id_community!: number;

    /**
     * ID of the user. Part of the composite primary key.
     */
    // 2. Explicit ID Column (Foreign Key holder)
    // changed to 'int' to match User.id
    @PrimaryColumn({ name: 'id_user', type: 'int' })
    id_user!: number;

    /**
     * Role of the user in this community.
     * e.g., ADMIN, MANAGER, MEMBER.
     */
    @Column({
        name: 'role',
        type: 'varchar',
        length: 50,
        nullable: false
    })
    role!: Role;

    // --- RELATIONSHIPS ---

    // 3. Many-to-One to Community
    @ManyToOne(() => Community, (community) => community.users, {
        onDelete: 'CASCADE' // Matches your SQL 'ON DELETE CASCADE'
    })
    @JoinColumn({ name: 'id_community' }) // Links this object to the 'id_community' column defined above
    community!: Community;

    // 4. Many-to-One to User
    @ManyToOne(() => User, (user) => user.memberships, {
        onDelete: 'CASCADE'
    })
    @JoinColumn({ name: 'id_user' }) // Links this object to the 'id_user' column defined above
    user!: User;
}

