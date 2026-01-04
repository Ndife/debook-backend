import { Test, TestingModule } from '@nestjs/testing';
import { PostsService } from './posts.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { PostLike } from './entities/post-like.entity';
import { DataSource } from 'typeorm';
import { getQueueToken } from '@nestjs/bullmq';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PostgresErrorCode } from '../common/constants/postgres-errors';

describe('PostsService', () => {
  let service: PostsService;

  const mockPostsRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockLikesRepository = {
    create: jest.fn(),
  };

  const mockQueue = {
    add: jest.fn().mockResolvedValue(true),
  };

  const mockQueryBuilder = {
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({ raw: [{ likesCount: 10 }] }),
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      save: jest.fn(),
      query: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    },
  };

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: getRepositoryToken(Post), useValue: mockPostsRepository },
        {
          provide: getRepositoryToken(PostLike),
          useValue: mockLikesRepository,
        },
        { provide: getQueueToken('posts-queue'), useValue: mockQueue },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('likePost', () => {
    const postId = 'post-123';
    const userId = 'user-123';

    it('should successfully like a post and return updated count', async () => {
      const result = await service.likePost(postId, userId);

      expect(result).toEqual({ likesCount: 10 });

      expect(mockDataSource.createQueryRunner).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockLikesRepository.create).toHaveBeenCalledWith({
        postId,
        userId,
      });
      expect(mockQueryRunner.manager.save).toHaveBeenCalled();

      expect(mockQueryRunner.manager.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(Post);
      expect(mockQueryBuilder.execute).toHaveBeenCalled();

      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();

      expect(mockQueue.add).toHaveBeenCalledWith('post-liked', {
        postId,
        userId,
      });
    });

    it('should throw NotFoundException if post (ForeignKeyViolation) does not exist within transaction', async () => {
      const fkError = { code: PostgresErrorCode.ForeignKeyViolation };
      mockQueryRunner.manager.save.mockRejectedValue(fkError);

      await expect(service.likePost(postId, userId)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should throw ConflictException if user already liked the post (UniqueViolation)', async () => {
      const duplicateError = { code: PostgresErrorCode.UniqueViolation };
      mockQueryRunner.manager.save.mockRejectedValue(duplicateError);

      await expect(service.likePost(postId, userId)).rejects.toThrow(
        ConflictException,
      );

      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should throw original error if unknown error occurs', async () => {
      const unknownError = new Error('Database went boom');
      mockQueryRunner.manager.save.mockRejectedValue(unknownError);

      await expect(service.likePost(postId, userId)).rejects.toThrow(
        'Database went boom',
      );

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should find a post and add a view event to the queue', async () => {
      const postId = '123';
      const mockPost = { id: postId, title: 'Test Post' } as unknown as Post;
      mockPostsRepository.findOne.mockResolvedValue(mockPost);

      const result = await service.findOne(postId);

      expect(result).toEqual(mockPost);
      expect(mockPostsRepository.findOne).toHaveBeenCalledWith({
        where: { id: postId },
      });

      expect(mockQueue.add).toHaveBeenCalledWith('post-viewed', { postId });
    });

    it('should throw NotFoundException if post not found', async () => {
      mockPostsRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);

      expect(mockQueue.add).toHaveBeenCalledWith('post-viewed', {
        postId: '999',
      });
    });
  });
});
