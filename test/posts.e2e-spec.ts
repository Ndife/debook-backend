import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PostsService } from './../src/posts/posts.service';

describe('PostsController (e2e)', () => {
  let app: INestApplication;

  const mockPostsService = {
    create: jest.fn().mockImplementation((dto) =>
      Promise.resolve({
        id: 'uuid-123',
        ...dto,
        likesCount: 0,
        createdAt: new Date(),
      }),
    ),
    findAll: jest.fn().mockResolvedValue([]),
    likePost: jest.fn().mockResolvedValue({ likesCount: 1 }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PostsService)
      .useValue(mockPostsService)
      .compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

    await app.init();
  });

  it('/posts (POST) - should create a post', () => {
    return request(app.getHttpServer())
      .post('/posts')
      .set('x-user-id', 'user-123')
      .send({ content: 'Hello E2E World' })
      .expect(201)
      .expect((res) => {
        const body = res.body as { id: string; content: string };
        expect(body.id).toBeDefined();
        expect(body.content).toEqual('Hello E2E World');
      });
  });

  it('/posts (POST) - should fail without auth header', () => {
    return request(app.getHttpServer())
      .post('/posts')
      .send({ content: 'I am anonymous' })
      .expect(401);
  });

  it('/posts (POST) - should fail validation on short content', () => {
    return request(app.getHttpServer())
      .post('/posts')
      .set('x-user-id', 'user-123')
      .send({ content: 'Hi' })
      .expect(400);
  });

  it('/posts/:id/like (POST) - should like a post', () => {
    return request(app.getHttpServer())
      .post('/posts/123e4567-e89b-12d3-a456-426614174000/like')
      .set('x-user-id', 'user-unique')
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual({ likesCount: 1 });
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
