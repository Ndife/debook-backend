import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PostsService } from './../src/posts/posts.service';

describe('PostsController (e2e)', () => {
  let app: INestApplication;

  // Mock the Service (so we don't need a real DB connection for this test)
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

    // crucial: apply the same pipes as main.ts
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

    await app.init();
  });

  it('/posts (POST) - should create a post', () => {
    return request(app.getHttpServer())
      .post('/posts')
      .set('x-user-id', 'user-123') // Pass the Guard
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
      .expect(401); // Guard Check
  });

  it('/posts (POST) - should fail validation on short content', () => {
    return request(app.getHttpServer())
      .post('/posts')
      .set('x-user-id', 'user-123')
      .send({ content: 'Hi' }) // Too short
      .expect(400); // Validation Pipe Check
  });

  afterAll(async () => {
    await app.close();
  });
});
