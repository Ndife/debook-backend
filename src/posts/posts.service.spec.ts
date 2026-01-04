import { Test, TestingModule } from '@nestjs/testing';
import { PostsService } from './posts.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { PostLike } from './entities/post-like.entity';
import { DataSource } from 'typeorm';
import { getQueueToken } from '@nestjs/bullmq';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('PostsService', () => {
  let service: PostsService;

  const mockPostsRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockLikesRepository = {
    create: jest.fn(),
  };

  const mockQueue = {
    add: jest.fn(),
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      save: jest.fn(),
      query: jest.fn(), // Mocking raw SQL query for 'RETURNING' clause
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
        { provide: getQueueToken('notifications'), useValue: mockQueue },
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
      // Arrange
      mockPostsRepository.findOne.mockResolvedValue({ id: postId });
      mockQueryRunner.manager.query.mockResolvedValue([{ likesCount: 10 }]);

      // Act
      const result = await service.likePost(postId, userId);

      // Assert
      expect(result).toEqual({ likesCount: 10 });

      expect(mockDataSource.createQueryRunner).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.manager.save).toHaveBeenCalled();
      expect(mockQueryRunner.manager.query).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();

      expect(mockQueue.add).toHaveBeenCalledWith('post-liked', {
        postId,
        userId,
      });
    });

    it('should throw NotFoundException if post does not exist', async () => {
      // Arrange
      mockPostsRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.likePost(postId, userId)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockDataSource.createQueryRunner).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if user already liked the post', async () => {
      // Arrange
      mockPostsRepository.findOne.mockResolvedValue({ id: postId });
      const duplicateError = { code: '23505' }; // Postgres unique violation code
      mockQueryRunner.manager.save.mockRejectedValue(duplicateError);

      // Act & Assert
      await expect(service.likePost(postId, userId)).rejects.toThrow(
        ConflictException,
      );

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });
});
