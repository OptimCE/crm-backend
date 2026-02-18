import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Community } from "../../communities/domain/community.models.js";

/**
 * Entity representing an allocation key.
 */
@Entity("allocation_key")
@Index("idx_key_community", ["community"])
export class AllocationKey {
  /**
   * Unique ID of the key.
   */
  @PrimaryGeneratedColumn("identity", { generatedIdentity: "ALWAYS" })
  id!: number;

  /**
   * Name of the key.
   */
  @Column({ type: "varchar", length: 255, nullable: false })
  name!: string;

  /**
   * Description of the key.
   */
  @Column({ type: "text", nullable: false })
  description!: string;

  @CreateDateColumn({ name: "created_at" })
  created_at!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at!: Date;

  /**
   * Community this key belongs to.
   */
  @ManyToOne(() => Community, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "id_community" })
  community!: Community;

  /**
   * Iterations associated with this key.
   */
  @OneToMany(() => Iteration, (iteration) => iteration.allocation_key)
  iterations!: Iteration[];
}

/**
 * Entity representing an iteration of the key distribution.
 */
@Entity("iteration")
@Index("idx_iteration_key", ["allocation_key"])
@Index("idx_iteration_community", ["community"])
export class Iteration {
  /**
   * Unique ID of the iteration.
   */
  @PrimaryGeneratedColumn("identity", { generatedIdentity: "ALWAYS" })
  id!: number;

  /**
   * Iteration number (sequence).
   */
  @Column({ type: "int", nullable: false })
  number!: number;

  /**
   * Energy allocated percentage for this iteration.
   */
  @Column({ name: "energy_allocated_percentage", type: "float", nullable: false })
  energy_allocated_percentage!: number;

  /**
   * key this iteration belongs to.
   */
  @ManyToOne(() => AllocationKey, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "id_key" })
  allocation_key!: AllocationKey;

  @CreateDateColumn({ name: "created_at" })
  created_at!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at!: Date;

  /**
   * Community context.
   */
  @ManyToOne(() => Community, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "id_community" })
  community!: Community;

  /**
   * Consumers in this iteration.
   */
  @OneToMany(() => Consumer, (consumer) => consumer.iteration)
  consumers!: Consumer[];
}

/**
 * Entity representing a consumer in the key distribution.
 */
@Entity("consumer")
@Index("idx_consumer_iteration", ["iteration"])
@Index("idx_consumer_community", ["community"])
export class Consumer {
  /**
   * Unique ID of the consumer.
   */
  @PrimaryGeneratedColumn("identity", { generatedIdentity: "ALWAYS" })
  id!: number;

  /**
   * Name of the consumer.
   */
  @Column({ type: "varchar", length: 255, nullable: false })
  name!: string;

  /**
   * Energy allocated to this consumer (-1 = PRORATA, otherwise percentage).
   */
  @Column({ name: "energy_allocated_percentage", type: "float", nullable: false })
  energy_allocated_percentage!: number;

  /**
   * Iteration this consumer belongs to.
   */
  @ManyToOne(() => Iteration, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "id_iteration" })
  iteration!: Iteration;

  @CreateDateColumn({ name: "created_at" })
  created_at!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at!: Date;

  /**
   * Community context.
   */
  @ManyToOne(() => Community, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "id_community" })
  community!: Community;
}
