import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Community } from "../../communities/domain/community.models.js";
import { User } from "../../users/domain/user.models.js";
import { Member } from "../../members/domain/member.models.js";
type MemberType = Member;
type UserType = User;
type CommunityType = Community;

/**
 * Entity representing an invitation for a user to become a manager (Gestionnaire).
 */
@Entity("gestionnaire_invitation")
@Index("idx_gestionnaire_invitation_user", ["user"])
@Index("idx_gestionnaire_invitation_community", ["community"])
export class GestionnaireInvitation {
  /**
   * Unique ID of the invitation.
   */
  @PrimaryGeneratedColumn("identity", { generatedIdentity: "ALWAYS" })
  id!: number;

  /**
   * Email of the invited user.
   */
  @Column({ name: "user_email", type: "text", nullable: false })
  userEmail!: string;

  /**
   * The user account linked to this invitation (if any).
   */
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "id_user" })
  user?: UserType | null;

  /**
   * The community the user is invited to manage.
   */
  @ManyToOne(() => Community, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "id_community" })
  community!: CommunityType;

  @CreateDateColumn({ name: "created_at" })
  created_at!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at!: Date;
}

/**
 * Entity representing an invitation for a user to become a member.
 */
@Entity("user_member_invitation")
@Index("idx_user_member_invitation_community", ["community"])
@Index("idx_user_member_invitation_user", ["user"])
@Index("idx_user_member_invitation_member", ["member"])
export class UserMemberInvitation {
  /**
   * Unique ID of the invitation.
   */
  @PrimaryGeneratedColumn("identity", { generatedIdentity: "ALWAYS" })
  id!: number;

  /**
   * The member profile linked to this invitation (if existing/created).
   */
  @ManyToOne(() => Member, { onDelete: "CASCADE", nullable: true })
  @JoinColumn({ name: "member_id" })
  member?: MemberType | null;

  /**
   * Name of the member (snapshot/metadata).
   */
  @Column({ name: "member_name", type: "text", nullable: true })
  memberName?: string | null;

  /**
   * Email of the invited user.
   */
  @Column({ name: "user_email", type: "text", nullable: false })
  userEmail!: string;

  /**
   * The user account linked to this invitation.
   */
  @ManyToOne(() => User, { onDelete: "CASCADE", nullable: true })
  @JoinColumn({ name: "id_user" })
  user?: UserType | null;

  /**
   * Whether the member details need to be encoded upon acceptance.
   */
  @Column({ name: "to_be_encoded", type: "boolean", nullable: false })
  toBeEncoded!: boolean;

  /**
   * The community the user is invited to join.
   */
  @ManyToOne(() => Community, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "id_community" })
  community!: CommunityType;

  @CreateDateColumn({ name: "created_at" })
  created_at!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at!: Date;
}
