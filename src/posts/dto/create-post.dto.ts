import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform, TransformFnParams } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({
    example: 'This is my first viral post!',
    description: 'The content of the post (5-500 chars)',
  })
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : (value as unknown),
  )
  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'Post content is too short (min 5 chars)' })
  @MaxLength(500, { message: 'Post content is too long (max 500 chars)' })
  content: string;
}
