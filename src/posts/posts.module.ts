import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { PostsProcessor } from './posts.processor';
import { Post } from './entities/post.entity';
import { PostLike } from './entities/post-like.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, PostLike]),
    BullModule.registerQueue({
      name: 'posts-queue',
    }),
  ],
  controllers: [PostsController],
  providers: [PostsService, PostsProcessor],
})
export class PostsModule {}
