import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { LikeJobPayload } from './interfaces/like-job.interface';

@Processor('notifications')
export class PostsProcessor extends WorkerHost {
  private readonly logger = new Logger(PostsProcessor.name);

  async process(job: Job<LikeJobPayload>): Promise<void> {
    this.logger.log(
      `Processing like notification for Post ${job.data.postId}...`,
    );

    await new Promise((resolve) => setTimeout(resolve, 3000));

    this.logger.log(
      `Notification sent! User ${job.data.userId} liked Post ${job.data.postId}`,
    );
  }
}
