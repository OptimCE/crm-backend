import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { User } from "../../users/domain/user.models.js";
import type { OnboardingOutcome } from "../shared/onboarding.tours.js";

/**
 * The answer a user gave to an onboarding tour offer. No row = never offered;
 * any row = already offered, whatever its outcome.
 */
@Entity("user_onboarding")
export class UserOnboarding {
  @PrimaryColumn({ name: "id_user", type: "int" })
  id_user!: number;

  @PrimaryColumn({ name: "tour_key", type: "varchar", length: 64 })
  tour_key!: string;

  @Column({ name: "outcome", type: "varchar", length: 16 })
  outcome!: OnboardingOutcome;

  /** The tour's content hash when the frontend knew it, so a rewritten tour can be offered again later. */
  @Column({ name: "tour_version", type: "varchar", length: 128, nullable: true })
  tour_version!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  created_at!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updated_at!: Date;

  @ManyToOne(() => User, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "id_user" })
  user!: User;
}
