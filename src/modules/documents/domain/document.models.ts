import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Community } from "../../communities/domain/community.models.js";
import { Member } from "../../members/domain/member.models.js";

/**
 * Entity representing a Document.
 * Stores metadata about an uploaded file and links it to a member and community.
 */
@Entity("document")
@Index("document_member", ["member"])
@Index("idx_document_community", ["community"])
export class Document {
  /**
   * Unique ID of the document.
   */
  @PrimaryGeneratedColumn("identity", { generatedIdentity: "ALWAYS" })
  id!: number;

  /**
   * The member who uploaded the document.
   */
  @ManyToOne(() => Member, { onDelete: "CASCADE" })
  @JoinColumn({ name: "id_member" })
  member!: Member;

  /**
   * Original name of the file.
   */
  @Column({ name: "file_name", type: "varchar", length: 255 })
  file_name!: string;

  /**
   * URL or path to the file in the storage service.
   */
  @Column({ name: "file_url", type: "varchar", length: 255 })
  file_url!: string;

  /**
   * Size of the file in bytes.
   */
  @Column({ name: "file_size", type: "int" })
  file_size!: number;

  /**
   * MIME type of the file.
   */
  @Column({ name: "file_type", type: "varchar", length: 255 })
  file_type!: string;

  /**
   * Date when the file was uploaded.
   */
  @Column({ name: "upload_date", type: "date" })
  upload_date!: Date; // Date string in JS for 'date' type

  @CreateDateColumn({ name: "created_at" })
  created_at!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at!: Date;

  /**
   * The community this document belongs to.
   */
  @ManyToOne(() => Community, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "id_community" })
  community!: Community;
}
