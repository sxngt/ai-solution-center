# Core Database Library

TypeORM 기반 데이터베이스 연결 및 공통 엔티티/리포지토리를 위한 공유 라이브러리입니다.

## 개요

이 라이브러리는 다음 기능을 제공합니다:
- PostgreSQL 데이터베이스 연결 설정
- 기본 엔티티 클래스 (BaseEntity)
- 확장 가능한 리포지토리 클래스 (BaseRepository)
- 소프트 삭제 (Soft Delete) 지원
- 벌크 작업 및 유틸리티 메소드

## 설치 및 설정

### 1. 의존성 추가

```bash
yarn add @ai-solution/core/database
```

### 2. 환경 변수 설정

`.env` 파일에 다음 변수들을 추가하세요:

```bash
# 데이터베이스 연결
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=developer
DATABASE_PASSWORD=dev123
DATABASE_NAME=ai_solution

# 데이터베이스 옵션
DATABASE_SYNCHRONIZE=true
DATABASE_LOGGING=true
DATABASE_MIGRATIONS_RUN=false
DATABASE_RETRY_ATTEMPTS=3
DATABASE_RETRY_DELAY=3000
DATABASE_MAX_QUERY_TIME=30000

# 환경 설정
NODE_ENV=development
```

### 3. 모듈 import

애플리케이션 모듈에서 DatabaseModule을 import합니다:

```typescript
import { Module } from '@nestjs/common';
import { DatabaseModule } from '@ai-solution/core/database';

@Module({
  imports: [
    DatabaseModule.forRoot(),
    // 다른 모듈들...
  ],
})
export class AppModule {}
```

### 4. 고급 설정 (forRootAsync 사용)

```typescript
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseModule } from '@ai-solution/core/database';

@Module({
  imports: [
    DatabaseModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        host: configService.get('CUSTOM_DB_HOST'),
        port: configService.get('CUSTOM_DB_PORT'),
        // 추가 설정...
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

## BaseEntity 사용법

### 1. 기본 엔티티 상속

```typescript
import { Entity, Column } from 'typeorm';
import { BaseEntity } from '@ai-solution/core/database';

@Entity('products')
export class Product extends BaseEntity {
  @Column()
  name!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ default: true })
  isActive!: boolean;
}
```

### 2. BaseEntity가 제공하는 필드

BaseEntity를 상속받으면 자동으로 다음 필드들이 추가됩니다:

```typescript
export abstract class BaseEntity {
  id!: string;                    // UUID 기본 키
  createdAt!: Date;              // 생성 일시
  updatedAt!: Date;              // 수정 일시
  deletedAt?: Date;              // 삭제 일시 (소프트 삭제)
}
```

## BaseRepository 사용법

### 1. 커스텀 리포지토리 생성

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from '@ai-solution/core/database';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductRepository extends BaseRepository<Product> {
  constructor(
    @InjectRepository(Product)
    repository: Repository<Product>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  // 커스텀 메소드 추가
  async findByPriceRange(minPrice: number, maxPrice: number): Promise<Product[]> {
    return this.find({
      where: {
        price: Between(minPrice, maxPrice),
        isActive: true,
      },
    });
  }

  async findActiveProducts(): Promise<Product[]> {
    return this.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }
}
```

### 2. 서비스에서 리포지토리 사용

```typescript
import { Injectable } from '@nestjs/common';
import { ProductRepository } from './product.repository';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductService {
  constructor(private readonly productRepository: ProductRepository) {}

  async createProduct(productData: {
    name: string;
    price: number;
    description?: string;
  }): Promise<Product> {
    return this.productRepository.createAndSave(productData);
  }

  async getProductById(id: string): Promise<Product> {
    return this.productRepository.findByIdOrFail(id);
  }

  async updateProduct(id: string, updateData: Partial<Product>): Promise<Product> {
    return this.productRepository.updateById(id, updateData);
  }

  async deleteProduct(id: string): Promise<void> {
    await this.productRepository.softDeleteById(id);
  }

  async restoreProduct(id: string): Promise<void> {
    await this.productRepository.restoreById(id);
  }

  async getAllProducts(includeDeleted = false): Promise<Product[]> {
    if (includeDeleted) {
      return this.productRepository.findWithDeleted();
    }
    return this.productRepository.find();
  }
}
```

## BaseRepository 메소드 레퍼런스

### 1. 조회 메소드

#### findByIdOrFail(id: string)
ID로 엔티티를 조회하며, 찾지 못하면 에러를 발생시킵니다.

```typescript
const product = await productRepository.findByIdOrFail('uuid-here');
```

#### findOneByOrFail(where: FindOptionsWhere<T>)
조건에 맞는 엔티티를 조회하며, 찾지 못하면 에러를 발생시킵니다.

```typescript
const product = await productRepository.findOneByOrFail({ name: 'iPhone' });
```

#### findWithDeleted(options?: FindManyOptions<T>)
소프트 삭제된 엔티티도 포함하여 조회합니다.

```typescript
const allProducts = await productRepository.findWithDeleted();
```

#### findOneWithDeleted(options: FindOneOptions<T>)
소프트 삭제된 엔티티도 포함하여 단일 엔티티를 조회합니다.

```typescript
const product = await productRepository.findOneWithDeleted({
  where: { id: 'uuid-here' }
});
```

### 2. 생성 메소드

#### createAndSave(entityData: DeepPartial<T>)
엔티티를 생성하고 즉시 저장합니다.

```typescript
const product = await productRepository.createAndSave({
  name: 'New Product',
  price: 99.99,
  description: 'Product description'
});
```

#### bulkCreate(entitiesData: DeepPartial<T>[])
여러 엔티티를 한 번에 생성하고 저장합니다.

```typescript
const products = await productRepository.bulkCreate([
  { name: 'Product 1', price: 10.00 },
  { name: 'Product 2', price: 20.00 },
  { name: 'Product 3', price: 30.00 }
]);
```

### 3. 수정 메소드

#### updateById(id: string, updateData: DeepPartial<T>)
ID로 엔티티를 찾아 업데이트합니다.

```typescript
const updatedProduct = await productRepository.updateById('uuid-here', {
  price: 199.99,
  description: 'Updated description'
});
```

### 4. 삭제 메소드

#### softDeleteById(id: string)
엔티티를 소프트 삭제합니다 (실제로는 deletedAt 필드만 설정).

```typescript
await productRepository.softDeleteById('uuid-here');
```

#### restoreById(id: string)
소프트 삭제된 엔티티를 복원합니다.

```typescript
await productRepository.restoreById('uuid-here');
```

### 5. 유틸리티 메소드

#### existsByWhere(where: FindOptionsWhere<T>)
조건에 맞는 엔티티가 존재하는지 확인합니다.

```typescript
const exists = await productRepository.existsByWhere({ name: 'iPhone' });
```

## 완전한 예제: 게시글 관리 시스템

### 1. 엔티티 정의

```typescript
// src/posts/entities/post.entity.ts
import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '@ai-solution/core/database';
import { User } from '@ai-solution/core/auth';

export enum PostStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

@Entity('posts')
export class Post extends BaseEntity {
  @Column()
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({
    type: 'enum',
    enum: PostStatus,
    default: PostStatus.DRAFT
  })
  status!: PostStatus;

  @Column({ default: 0 })
  viewCount!: number;

  @Column({ type: 'simple-array', nullable: true })
  tags?: string[];

  @ManyToOne(() => User, { eager: true })
  author!: User;

  @Column()
  authorId!: string;
}
```

### 2. 리포지토리 구현

```typescript
// src/posts/repositories/post.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { BaseRepository } from '@ai-solution/core/database';
import { Post, PostStatus } from '../entities/post.entity';

@Injectable()
export class PostRepository extends BaseRepository<Post> {
  constructor(
    @InjectRepository(Post)
    repository: Repository<Post>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  async findPublishedPosts(): Promise<Post[]> {
    return this.find({
      where: { status: PostStatus.PUBLISHED },
      order: { createdAt: 'DESC' },
      relations: ['author'],
    });
  }

  async findByAuthor(authorId: string): Promise<Post[]> {
    return this.find({
      where: { authorId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByTag(tag: string): Promise<Post[]> {
    return this.createQueryBuilder('post')
      .where('post.tags @> ARRAY[:tag]', { tag })
      .andWhere('post.status = :status', { status: PostStatus.PUBLISHED })
      .leftJoinAndSelect('post.author', 'author')
      .orderBy('post.createdAt', 'DESC')
      .getMany();
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.increment({ id }, 'viewCount', 1);
  }

  async getPopularPosts(limit = 10): Promise<Post[]> {
    return this.find({
      where: { status: PostStatus.PUBLISHED },
      order: { viewCount: 'DESC' },
      take: limit,
      relations: ['author'],
    });
  }

  async searchPosts(searchTerm: string): Promise<Post[]> {
    return this.createQueryBuilder('post')
      .where('post.title ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orWhere('post.content ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .andWhere('post.status = :status', { status: PostStatus.PUBLISHED })
      .leftJoinAndSelect('post.author', 'author')
      .orderBy('post.createdAt', 'DESC')
      .getMany();
  }
}
```

### 3. 서비스 구현

```typescript
// src/posts/services/post.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PostRepository } from '../repositories/post.repository';
import { Post, PostStatus } from '../entities/post.entity';

export interface CreatePostDto {
  title: string;
  content: string;
  tags?: string[];
  status?: PostStatus;
}

export interface UpdatePostDto {
  title?: string;
  content?: string;
  tags?: string[];
  status?: PostStatus;
}

@Injectable()
export class PostService {
  constructor(private readonly postRepository: PostRepository) {}

  async createPost(authorId: string, createPostDto: CreatePostDto): Promise<Post> {
    return this.postRepository.createAndSave({
      ...createPostDto,
      authorId,
      viewCount: 0,
    });
  }

  async getPostById(id: string, incrementView = false): Promise<Post> {
    const post = await this.postRepository.findByIdOrFail(id);
    
    if (incrementView && post.status === PostStatus.PUBLISHED) {
      await this.postRepository.incrementViewCount(id);
      post.viewCount += 1;
    }
    
    return post;
  }

  async updatePost(
    id: string, 
    authorId: string, 
    updatePostDto: UpdatePostDto
  ): Promise<Post> {
    const post = await this.postRepository.findByIdOrFail(id);
    
    if (post.authorId !== authorId) {
      throw new ForbiddenException('게시글을 수정할 권한이 없습니다');
    }
    
    return this.postRepository.updateById(id, updatePostDto);
  }

  async deletePost(id: string, authorId: string): Promise<void> {
    const post = await this.postRepository.findByIdOrFail(id);
    
    if (post.authorId !== authorId) {
      throw new ForbiddenException('게시글을 삭제할 권한이 없습니다');
    }
    
    await this.postRepository.softDeleteById(id);
  }

  async getPublishedPosts(): Promise<Post[]> {
    return this.postRepository.findPublishedPosts();
  }

  async getMyPosts(authorId: string): Promise<Post[]> {
    return this.postRepository.findByAuthor(authorId);
  }

  async getPostsByTag(tag: string): Promise<Post[]> {
    return this.postRepository.findByTag(tag);
  }

  async getPopularPosts(limit = 10): Promise<Post[]> {
    return this.postRepository.getPopularPosts(limit);
  }

  async searchPosts(searchTerm: string): Promise<Post[]> {
    return this.postRepository.searchPosts(searchTerm);
  }

  async publishPost(id: string, authorId: string): Promise<Post> {
    return this.updatePost(id, authorId, { status: PostStatus.PUBLISHED });
  }

  async archivePost(id: string, authorId: string): Promise<Post> {
    return this.updatePost(id, authorId, { status: PostStatus.ARCHIVED });
  }
}
```

### 4. 컨트롤러 구현

```typescript
// src/posts/controllers/post.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard, CurrentUser } from '@ai-solution/core/auth';
import { PostService, CreatePostDto, UpdatePostDto } from '../services/post.service';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get()
  async getPosts(@Query('tag') tag?: string, @Query('search') search?: string) {
    if (tag) {
      return this.postService.getPostsByTag(tag);
    }
    if (search) {
      return this.postService.searchPosts(search);
    }
    return this.postService.getPublishedPosts();
  }

  @Get('popular')
  async getPopularPosts(@Query('limit') limit?: number) {
    return this.postService.getPopularPosts(limit);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyPosts(@CurrentUser() user: any) {
    return this.postService.getMyPosts(user.id);
  }

  @Get(':id')
  async getPost(@Param('id') id: string) {
    return this.postService.getPostById(id, true);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createPost(
    @CurrentUser() user: any,
    @Body() createPostDto: CreatePostDto,
  ) {
    return this.postService.createPost(user.id, createPostDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updatePost(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postService.updatePost(id, user.id, updatePostDto);
  }

  @Put(':id/publish')
  @UseGuards(JwtAuthGuard)
  async publishPost(@Param('id') id: string, @CurrentUser() user: any) {
    return this.postService.publishPost(id, user.id);
  }

  @Put(':id/archive')
  @UseGuards(JwtAuthGuard)
  async archivePost(@Param('id') id: string, @CurrentUser() user: any) {
    return this.postService.archivePost(id, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deletePost(@Param('id') id: string, @CurrentUser() user: any) {
    await this.postService.deletePost(id, user.id);
    return { message: '게시글이 삭제되었습니다' };
  }
}
```

## 마이그레이션 관리

### 1. 마이그레이션 생성

```bash
# 새 마이그레이션 생성
yarn typeorm migration:generate -n CreatePostTable

# 빈 마이그레이션 생성
yarn typeorm migration:create -n AddIndexesToPosts
```

### 2. 마이그레이션 실행

```bash
# 마이그레이션 실행
yarn typeorm migration:run

# 마이그레이션 되돌리기
yarn typeorm migration:revert
```

### 3. 마이그레이션 파일 예시

```typescript
// src/migrations/1640000000000-CreatePostTable.ts
import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class CreatePostTable1640000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'posts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'content',
            type: 'text',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['draft', 'published', 'archived'],
            default: "'draft'",
          },
          // 기타 필드들...
        ],
      }),
    );

    await queryRunner.createIndex(
      'posts',
      new Index('IDX_POST_STATUS', ['status']),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('posts');
  }
}
```

## 성능 최적화 팁

### 1. 인덱스 추가

```typescript
@Entity('posts')
@Index(['status', 'createdAt'])
@Index(['authorId'])
export class Post extends BaseEntity {
  // 엔티티 정의...
}
```

### 2. 쿼리 최적화

```typescript
// 좋은 예: 필요한 필드만 선택
async findPostTitles(): Promise<{ id: string; title: string }[]> {
  return this.createQueryBuilder('post')
    .select(['post.id', 'post.title'])
    .where('post.status = :status', { status: PostStatus.PUBLISHED })
    .getMany();
}

// 좋은 예: 페이지네이션
async findPostsPaginated(page: number, limit: number): Promise<Post[]> {
  return this.find({
    skip: (page - 1) * limit,
    take: limit,
    order: { createdAt: 'DESC' },
  });
}
```

### 3. 트랜잭션 사용

```typescript
async createPostWithStats(authorId: string, postData: CreatePostDto): Promise<Post> {
  return this.manager.transaction(async (manager) => {
    const post = await manager.save(Post, { ...postData, authorId });
    
    // 통계 업데이트
    await manager.increment(UserStats, { userId: authorId }, 'postCount', 1);
    
    return post;
  });
}
```

이 가이드를 통해 core-database 라이브러리를 사용하여 효율적인 데이터베이스 작업을 수행할 수 있습니다.