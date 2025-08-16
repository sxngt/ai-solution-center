# Core Auth Library

JWT 기반 인증 및 권한 관리를 위한 공유 라이브러리입니다.

## 개요

이 라이브러리는 다음 기능을 제공합니다:
- JWT 토큰 기반 인증
- 사용자 등록 및 로그인
- 역할 기반 접근 제어 (RBAC)
- 패스워드 암호화 (bcrypt)
- 인증 가드 및 데코레이터

## 설치 및 설정

### 1. 의존성 추가

```bash
yarn add @ai-solution/core/auth
```

### 2. 환경 변수 설정

`.env` 파일에 다음 변수들을 추가하세요:

```bash
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=1d
DATABASE_URL=postgresql://user:password@localhost:5432/database
```

### 3. 모듈 import

애플리케이션 모듈에서 AuthModule을 import합니다:

```typescript
import { Module } from '@nestjs/common';
import { AuthModule } from '@ai-solution/core/auth';

@Module({
  imports: [
    AuthModule,
    // 다른 모듈들...
  ],
})
export class AppModule {}
```

## 기본 사용법

### 1. 회원가입 API 구현

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService, RegisterDto } from '@ai-solution/core/auth';

@Controller('auth')
export class UserController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: { email: string; password: string }) {
    return this.authService.login(loginDto.email, loginDto.password);
  }
}
```

### 2. 보호된 라우트 설정

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, Roles } from '@ai-solution/core/auth';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  
  @Get('profile')
  getProfile(@CurrentUser() user: any) {
    return { user };
  }

  @Get('admin-only')
  @Roles('admin')
  adminOnlyEndpoint() {
    return { message: '관리자만 접근 가능합니다' };
  }
}
```

### 3. 공개 API 설정

```typescript
import { Controller, Get } from '@nestjs/common';
import { Public } from '@ai-solution/core/auth';

@Controller('public')
export class PublicController {
  
  @Get('health')
  @Public()
  healthCheck() {
    return { status: 'OK' };
  }
}
```

## 상세 API 가이드

### AuthService 메소드

#### register(registerDto: RegisterDto)
새로운 사용자를 등록합니다.

**매개변수:**
```typescript
interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}
```

**반환값:**
```typescript
{
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  };
  token: string;
}
```

#### login(email: string, password: string)
사용자 로그인을 처리합니다.

**반환값:**
```typescript
{
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  };
  token: string;
}
```

#### findUserById(id: string)
ID로 사용자를 조회합니다.

**반환값:** `User | null`

### 사용자 역할 (UserRole)

```typescript
enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator'
}
```

### 가드 (Guards)

#### JwtAuthGuard
JWT 토큰을 검증하는 가드입니다.

```typescript
@UseGuards(JwtAuthGuard)
@Get('protected')
protectedRoute() {
  return { message: '인증된 사용자만 접근 가능' };
}
```

#### RolesGuard
사용자 역할을 검증하는 가드입니다.

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'moderator')
@Get('admin')
adminRoute() {
  return { message: '관리자만 접근 가능' };
}
```

### 데코레이터 (Decorators)

#### @CurrentUser()
현재 인증된 사용자 정보를 가져옵니다.

```typescript
@Get('me')
@UseGuards(JwtAuthGuard)
getCurrentUser(@CurrentUser() user: any) {
  return user;
}
```

#### @Public()
JWT 인증을 우회하여 공개 API로 만듭니다.

```typescript
@Get('public')
@Public()
publicEndpoint() {
  return { message: '누구나 접근 가능' };
}
```

#### @Roles()
특정 역할의 사용자만 접근을 허용합니다.

```typescript
@Post('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
createUser(@Body() createUserDto: any) {
  // 관리자만 접근 가능
}
```

## 완전한 예제: 회원가입 기능

### 1. 컨트롤러 구현

```typescript
// src/auth/auth.controller.ts
import { 
  Controller, 
  Post, 
  Body, 
  HttpCode, 
  HttpStatus,
  ValidationPipe
} from '@nestjs/common';
import { 
  AuthService, 
  RegisterDto, 
  LoginDto,
  Public 
} from '@ai-solution/core/auth';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body(ValidationPipe) registerDto: RegisterDto) {
    try {
      const result = await this.authService.register(registerDto);
      return {
        success: true,
        message: '회원가입이 완료되었습니다.',
        data: result
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body(ValidationPipe) loginDto: LoginDto) {
    try {
      const result = await this.authService.login(
        loginDto.email, 
        loginDto.password
      );
      return {
        success: true,
        message: '로그인 성공',
        data: result
      };
    } catch (error) {
      return {
        success: false,
        message: '로그인 실패: ' + error.message
      };
    }
  }
}
```

### 2. 사용자 관리 컨트롤러

```typescript
// src/users/users.controller.ts
import { 
  Controller, 
  Get, 
  UseGuards, 
  Patch, 
  Body 
} from '@nestjs/common';
import { 
  JwtAuthGuard, 
  RolesGuard, 
  CurrentUser, 
  Roles 
} from '@ai-solution/core/auth';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  
  @Get('profile')
  getProfile(@CurrentUser() user: any) {
    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    };
  }

  @Patch('profile')
  updateProfile(
    @CurrentUser() user: any,
    @Body() updateData: { firstName?: string; lastName?: string }
  ) {
    // 프로필 업데이트 로직
    return {
      success: true,
      message: '프로필이 업데이트되었습니다.'
    };
  }

  @Get('all')
  @UseGuards(RolesGuard)
  @Roles('admin')
  getAllUsers() {
    // 모든 사용자 조회 (관리자만)
    return {
      success: true,
      data: []
    };
  }
}
```

### 3. 프론트엔드 연동 예시

```typescript
// 회원가입 API 호출
const registerUser = async (userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) => {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  
  const result = await response.json();
  
  if (result.success) {
    // 토큰 저장
    localStorage.setItem('token', result.data.token);
    return result.data.user;
  } else {
    throw new Error(result.message);
  }
};

// 로그인 API 호출
const loginUser = async (email: string, password: string) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  
  const result = await response.json();
  
  if (result.success) {
    localStorage.setItem('token', result.data.token);
    return result.data.user;
  } else {
    throw new Error(result.message);
  }
};

// 인증이 필요한 API 호출
const getProfile = async () => {
  const token = localStorage.getItem('token');
  
  const response = await fetch('/api/users/profile', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  return response.json();
};
```

## 에러 처리

일반적인 에러 상황과 처리 방법:

### 1. 중복 이메일 에러
```typescript
// 409 Conflict
{
  success: false,
  message: "이미 사용 중인 이메일입니다."
}
```

### 2. 로그인 실패
```typescript
// 401 Unauthorized
{
  success: false,
  message: "이메일 또는 비밀번호가 올바르지 않습니다."
}
```

### 3. 토큰 만료
```typescript
// 401 Unauthorized
{
  success: false,
  message: "토큰이 만료되었습니다."
}
```

### 4. 권한 부족
```typescript
// 403 Forbidden
{
  success: false,
  message: "접근 권한이 없습니다."
}
```

## 추가 설정

### 1. 토큰 만료 시간 설정
```typescript
// auth.module.ts에서 설정
JwtModule.register({
  secret: process.env.JWT_SECRET,
  signOptions: { expiresIn: '24h' }, // 24시간
})
```

### 2. 비밀번호 정책 설정
```typescript
// validation pipe 설정
@IsStrongPassword({
  minLength: 8,
  minLowercase: 1,
  minUppercase: 1,
  minNumbers: 1,
  minSymbols: 1,
})
password: string;
```

### 3. 전역 가드 설정
```typescript
// main.ts에서 전역 가드 설정
app.useGlobalGuards(new JwtAuthGuard());
```

이 가이드를 통해 core-auth 라이브러리를 사용하여 완전한 인증 시스템을 구현할 수 있습니다.