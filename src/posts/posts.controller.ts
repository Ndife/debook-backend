import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { MockAuthGuard } from '../common/guards/mock-auth.guard';
import { LikePostResponseDto } from './dto/like-post-response.dto';
import { Post as PostEntity } from './entities/post.entity';

@ApiTags('posts')
@Controller({
  path: 'posts',
  version: '1',
})
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(MockAuthGuard)
  @ApiOperation({ summary: 'Create a new post' })
  @ApiCreatedResponse({
    description: 'The post has been successfully created.',
    type: PostEntity,
  })
  @ApiHeader({
    name: 'x-user-id',
    description: 'Fake User ID for authentication',
    required: true,
    schema: { default: 'user-123' },
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid x-user-id header',
    schema: {
      example: {
        message: 'Missing or invalid x-user-id header',
        error: 'Unauthorized',
        statusCode: 401,
      },
    },
  })
  create(@Body() createPostDto: CreatePostDto) {
    return this.postsService.create(createPostDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all posts' })
  @ApiOkResponse({
    description: 'Return list of all posts',
    type: [PostEntity],
  })
  findAll() {
    return this.postsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific post' })
  @ApiOkResponse({ description: 'The post details', type: PostEntity })
  @ApiNotFoundResponse({ description: 'Post not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.postsService.findOne(id);
  }

  @Post(':id/like')
  @UseGuards(MockAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Like a post' })
  @ApiResponse({
    description: 'Post liked successfully',
    type: LikePostResponseDto,
  })
  @ApiHeader({
    name: 'x-user-id',
    description: 'Fake User ID for authentication',
    required: true,
    schema: { default: 'user-123' },
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid x-user-id header',
    schema: {
      example: {
        message: 'Missing or invalid x-user-id header',
        error: 'Unauthorized',
        statusCode: 401,
      },
    },
  })
  async likePost(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.postsService.likePost(id, req.user.id);
  }
}
