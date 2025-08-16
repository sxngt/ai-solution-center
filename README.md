# AI Solution Center

대학생을 위한 AI 기반 서비스 플랫폼 - Nx 모노레포 아키텍처

## 프로젝트 개요

AI Solution Center는 대학생들이 AI 기반 서비스를 쉽게 개발하고 배포할 수 있도록 설계된 모노레포 플랫폼입니다. 각 개발자가 독립적으로 서비스를 개발하면서도 공통 기능과 LLM 통합을 효율적으로 공유할 수 있습니다.

### 핵심 특징

- **모노레포 아키텍처**: Nx를 사용한 확장 가능한 구조
- **멀티 LLM 지원**: OpenAI, Claude, Ollama 등 다양한 LLM 프로바이더
- **통합 인증 시스템**: JWT 기반 보안 인증 및 권한 관리
- **자동화된 워크플로우**: 서비스 생성부터 배포까지 자동화
- **마이크로서비스 구조**: 독립적인 서비스 개발 및 배포

## 시작하기

### 필수 요구사항

- Node.js 18.0 이상
- Yarn 1.22 이상
- Docker 및 Docker Compose
- Git

### 초기 설정

```bash
# 1. 저장소 클론
git clone https://github.com/your-org/ai-solution-center.git
cd ai-solution-center

# 2. 의존성 설치
yarn install

# 3. 환경 변수 설정
cp .env.example .env
# .env 파일을 열어서 필요한 API 키 설정

# 4. Docker 서비스 시작 (PostgreSQL, Redis)
yarn docker:up

# 5. Core 라이브러리 빌드
yarn nx build core-llm
yarn nx build core-database
yarn nx build core-auth
```

### 첫 번째 서비스 생성

```bash
# 대화형 서비스 생성기 실행
yarn create:service

# 또는 명령줄로 직접 생성
yarn create:service [서비스명] [설명] [작성자] [LLM제공자] [포트]

# 예시
yarn create:service chat-service "AI 채팅 서비스" "개발팀" "openai" 3001
```

서비스 생성 시 입력 정보:
- **서비스명**: 영문 소문자와 하이픈만 사용 (예: chat-service)
- **설명**: 서비스에 대한 간단한 설명
- **작성자**: 개발자 또는 팀 이름
- **LLM 제공자**: openai, claude, ollama 중 선택
- **포트**: 서비스가 실행될 포트 번호 (1000-65535)

### 서비스 실행

```bash
# 생성한 서비스 실행
yarn nx serve [서비스명]

# 예시
yarn nx serve chat-service

# 서비스 접속 확인
curl http://localhost:3001/api/health
```

## 프로젝트 구조

```
ai-solution-center/
├── apps/
│   └── services/              # 개별 마이크로서비스
│       └── [service-name]/    # 각 서비스 디렉토리
│           ├── src/
│           │   ├── app/
│           │   │   ├── app.module.ts      # NestJS 모듈
│           │   │   ├── app.controller.ts  # API 엔드포인트
│           │   │   └── app.service.ts     # 비즈니스 로직
│           │   └── main.ts                # 진입점
│           └── project.json               # Nx 프로젝트 설정
├── libs/
│   └── core/                  # 공유 라이브러리
│       ├── llm/               # LLM 통합 모듈
│       ├── database/          # 데이터베이스 모듈
│       └── auth/              # 인증 모듈
├── tools/
│   └── scripts/               # 유틸리티 스크립트
│       └── create-service.js  # 서비스 생성기
└── docker/
    └── docker-compose.yml     # Docker 설정
```

## 개발 가이드

### 주요 명령어

#### 서비스 관리
```bash
# 새 서비스 생성
yarn create:service [서비스명]

# 서비스 실행
yarn nx serve [서비스명]

# 서비스 빌드
yarn nx build [서비스명]

# 서비스 테스트
yarn nx test [서비스명]

# 린트 검사
yarn nx lint [서비스명]
```

#### Docker 관리
```bash
# Docker 서비스 시작
yarn docker:up

# Docker 서비스 중지
yarn docker:down

# Docker 로그 확인
yarn docker:logs

# Docker 볼륨 정리
yarn docker:clean
```

#### 프로젝트 관리
```bash
# 의존성 그래프 확인
yarn nx graph

# 영향받은 프로젝트 테스트
yarn nx affected:test

# 영향받은 프로젝트 빌드
yarn nx affected:build

# Nx 캐시 초기화
yarn nx reset
```

### 환경 변수 설정

`.env` 파일에 다음 변수들을 설정해야 합니다:

```env
# LLM API 키 (최소 하나는 필수)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
OLLAMA_BASE_URL=http://localhost:11434

# 데이터베이스
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=dev123
DATABASE_NAME=ai_solution_center

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=7d

# 서버 설정
NODE_ENV=development
```

## API 엔드포인트

생성된 각 서비스는 다음과 같은 기본 엔드포인트를 제공합니다:

| 메소드 | 경로 | 설명 |
|--------|------|------|
| GET | /api | 서비스 정보 |
| GET | /api/health | 헬스 체크 |
| POST | /api/chat | AI 채팅 요청 |
| GET | /api/providers | 사용 가능한 LLM 프로바이더 |

### 요청 예시

```bash
# 헬스 체크
curl http://localhost:3001/api/health

# AI 채팅 요청
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "안녕하세요!",
    "provider": "openai"
  }'

# 프로바이더 확인
curl http://localhost:3001/api/providers
```

## 아키텍처 설명

### 마이크로서비스 구조

각 서비스는 독립적인 NestJS 애플리케이션으로 구성되며, 개별 포트에서 실행됩니다:

- **독립적 배포**: 각 서비스를 개별적으로 배포 가능
- **기술 스택 자유도**: 서비스별로 다른 기술 스택 적용 가능
- **장애 격리**: 한 서비스의 장애가 다른 서비스에 영향 없음
- **확장성**: 서비스별로 독립적인 스케일링 가능

### Core 라이브러리

#### LLM Module (@ai-solution/core/llm)
다중 LLM 프로바이더를 통합 관리하는 모듈:
- OpenAI, Claude, Ollama 지원
- 자동 폴백 및 재시도 로직
- 통합 인터페이스 제공

#### Database Module (@ai-solution/core/database)
TypeORM 기반 데이터베이스 관리:
- PostgreSQL 연동
- BaseEntity 및 Repository 패턴
- 마이그레이션 지원

#### Auth Module (@ai-solution/core/auth)
JWT 기반 인증/인가:
- 토큰 생성 및 검증
- 역할 기반 접근 제어
- Passport 전략 통합

## 문제 해결

### 자주 발생하는 문제

#### TypeScript 빌드 오류
```bash
# Core 라이브러리 재빌드
yarn nx build core-llm
yarn nx build core-database
yarn nx build core-auth

# 캐시 초기화
yarn nx reset
```

#### Docker 연결 오류
```bash
# Docker 상태 확인
docker ps

# 포트 충돌 확인
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis

# Docker 재시작
yarn docker:down
yarn docker:clean
yarn docker:up
```

#### 서비스 실행 오류
```bash
# 의존성 재설치
rm -rf node_modules
yarn install

# 서비스 재빌드
yarn nx build [서비스명] --skip-nx-cache
```

## 프로덕션 배포

### Docker 이미지 빌드

```bash
# 서비스 빌드
yarn nx build [서비스명]

# Docker 이미지 생성
docker build -t [서비스명]:latest \
  -f apps/services/[서비스명]/Dockerfile .

# 이미지 실행
docker run -p 3000:3000 \
  --env-file .env.production \
  [서비스명]:latest
```

### 환경별 설정

프로덕션 환경에서는 다음 사항을 반드시 변경하세요:
- JWT_SECRET: 강력한 랜덤 문자열 사용
- DATABASE_PASSWORD: 복잡한 패스워드 설정
- NODE_ENV: production으로 설정
- LLM API 키: 프로덕션용 키 사용

## 기여 가이드

### 브랜치 전략

- `main`: 프로덕션 배포 브랜치
- `develop`: 개발 통합 브랜치
- `feature/[기능명]`: 새 기능 개발
- `fix/[이슈번호]`: 버그 수정

### 코드 스타일

- TypeScript 엄격 모드 사용
- ESLint 규칙 준수
- Prettier 포맷팅 적용
- 의미 있는 커밋 메시지 작성

### 테스트 작성

- 단위 테스트: 비즈니스 로직 검증
- 통합 테스트: API 엔드포인트 검증
- E2E 테스트: 전체 워크플로우 검증
- 최소 80% 코드 커버리지 유지

## 추가 리소스

### 공식 문서
- [NestJS Documentation](https://docs.nestjs.com/)
- [Nx Documentation](https://nx.dev/)
- [TypeORM Documentation](https://typeorm.io/)

### LLM 프로바이더
- [OpenAI API Reference](https://platform.openai.com/docs)
- [Anthropic Claude API](https://docs.anthropic.com/)
- [Ollama Documentation](https://ollama.ai/docs)

## 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일 참조

---

AI Solution Center - 대학생을 위한 AI 서비스 플랫폼