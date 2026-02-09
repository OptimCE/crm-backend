import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import { Community } from "../../modules/communities/domain/community.models.js";
type CommunityType = Community;
/**
 * Entity representing a physical address.
 */
@Entity('address')
export class Address {
    @PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' })
    id!: number;

    @Column({ type: 'varchar', length: 255 })
    street!: string;

    @Column({ type: 'int' })
    number!: number;

    @Column({ type: 'varchar', length: 255 })
    postcode!: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    supplement?: string;

    @Column({ type: 'varchar', length: 255 })
    city!: string;

    @CreateDateColumn({ name: 'created_at' })
    created_at!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updated_at!: Date;
}