import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Post } from './entities/post.entity';
import { PostLike } from './entities/post-like.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { LikeJobPayload } from './interfaces/like-job.interface';
import { LikePostResponseDto } from './dto/like-post-response.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
    @InjectRepository(PostLike)
    private readonly postLikesRepository: Repository<PostLike>,
    private readonly dataSource: DataSource,
    @InjectQueue('notifications') private notificationsQueue: Queue,
  ) {}

  create(createPostDto: CreatePostDto) {
    const post = this.postsRepository.create(createPostDto);
    return this.postsRepository.save(post);
  }

  findAll() {
    return this.postsRepository.find();
  }

  async findOne(id: string) {
    const post = await this.postsRepository.findOne({ where: { id } });
    if (!post) throw new NotFoundException(`Post not found`);
    return post;
  }

  async likePost(postId: string, userId: string): Promise<LikePostResponseDto> {
    const post = await this.postsRepository.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let updatedLikesCount: number;

    try {
      const newLike = this.postLikesRepository.create({ postId, userId });
      await queryRunner.manager.save(newLike);

      const result: { likesCount: number }[] = await queryRunner.manager.query(
        `UPDATE "post" SET "likesCount" = "likesCount" + 1 WHERE "id" = $1 RETURNING "likesCount"`,
        [postId],
      );

      updatedLikesCount = result[0].likesCount;

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if ((error as { code: string }).code === '23505') {
        throw new ConflictException('User already liked this post');
      }
      throw error;
    } finally {
      await queryRunner.release();
    }

    await this.notificationsQueue.add('post-liked', {
      postId,
      userId,
    } as LikeJobPayload);

    return { likesCount: updatedLikesCount };
  }
}
