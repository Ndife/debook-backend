import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { PostJobPayload } from './interfaces/post-job.interface';
import { LikeJobPayload } from './interfaces/like-job.interface';
import { ViewJobPayload } from './interfaces/view-job.interface';

@Processor('posts-queue')
export class PostsProcessor extends WorkerHost {
  private readonly logger = new Logger(PostsProcessor.name);

  constructor(
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
  ) {
    super();
  }

  async process(job: Job<PostJobPayload>): Promise<void> {
    switch (job.name) {
      case 'post-liked':
        return this.handleLikeNotification(job as Job<LikeJobPayload>);
      case 'post-viewed':
        return this.handleViewIncrement(job as Job<ViewJobPayload>);
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async handleLikeNotification(
    job: Job<LikeJobPayload>,
  ): Promise<void> {
    this.logger.log(`Processing like notification for Post ${job.data.postId}`);

    // Simulating external service latency
    await new Promise((resolve) => setTimeout(resolve, 1000));

    this.logger.log(
      `Notification sent for Post ${job.data.postId} to User ${job.data.userId}`,
    );
  }

  private async handleViewIncrement(job: Job<ViewJobPayload>): Promise<void> {
    const { postId } = job.data;

    try {
      await this.postsRepository.increment({ id: postId }, 'viewsCount', 1);
    } catch (error) {
      this.logger.error(
        `Failed to increment view for Post ${postId}`,
        error instanceof Error ? error.stack : error,
      );
      throw error;
    }
  }
}
