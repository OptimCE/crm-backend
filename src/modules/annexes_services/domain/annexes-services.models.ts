import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";

/**
 * Entity representing a community's subscription state for a single annex feature.
 *
 * Rows are owned by the CRM backend: subscriptions are created and deactivated
 * through `POST /annexes-services/:feature/(un)subscribe`. Annex services
 * (e.g. allocation-key-generation) read this table to gate their feature
 * endpoints but never write to it.
 */
@Entity("community_subscription")
@Unique("uq_community_subscription_community_feature", ["id_community", "feature"])
@Index("idx_community_subscription_community", ["id_community"])
export class CommunitySubscription {
  @PrimaryGeneratedColumn("identity", { generatedIdentity: "ALWAYS" })
  id!: number;

  @Column({ name: "id_community", type: "int", nullable: false })
  id_community!: number;

  @Column({ name: "feature", type: "varchar", length: 64, nullable: false })
  feature!: string;

  @Column({ name: "is_active", type: "boolean", nullable: false, default: false })
  is_active!: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  created_at!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updated_at!: Date;
}
