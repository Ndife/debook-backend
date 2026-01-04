import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
  Index,
} from 'typeorm';

@Entity()
@Unique(['postId', 'userId']) // Prevents duplicate likes
export class PostLike {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  postId: string;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;
}
