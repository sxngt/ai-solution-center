# 🚀 AI Solution Center

AI 혁신 솔루션센터 - 대학생들을 위한 AI 기반 서비스 플랫폼

[![CI Pipeline](https://github.com/your-org/ai-solution-center/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/ai-solution-center/actions/workflows/ci.yml)
[![Release Pipeline](https://github.com/your-org/ai-solution-center/actions/workflows/release.yml/badge.svg)](https://github.com/your-org/ai-solution-center/actions/workflows/release.yml)

## 📋 프로젝트 개요

AI Solution Center는 대학생들을 위한 혁신적인 AI 기반 서비스 플랫폼입니다. Nx 모노레포 구조를 사용하여 여러 개발자가 독립적으로 서비스를 개발하면서도 LLM 통합과 공통 기능을 공유할 수 있도록 설계되었습니다.

### 🎯 핵심 특징

- **🔧 모노레포 아키텍처**: Nx를 사용한 확장 가능한 모노레포 구조
- **🤖 멀티 LLM 지원**: OpenAI, Claude, Ollama 등 다양한 LLM 프로바이더 지원
- **🛡️ 통합 인증 시스템**: JWT 기반 보안 인증 및 권한 관리
- **🐳 컨테이너화**: Docker를 활용한 일관된 개발/배포 환경
- **⚡ 자동화**: 서비스 생성부터 배포까지 완전 자동화된 워크플로우
- **📊 확장성**: 마이크로서비스 아키텍처로 무한 확장 가능

## 🏗️ 기술 스택

### Core Technologies
- **🔷 Backend**: NestJS 11+, TypeScript 5+
- **📦 Monorepo**: Nx 21+
- **🗃️ Database**: PostgreSQL 15+ with TypeORM 0.3+
- **🗄️ Cache**: Redis 7+
- **🔐 Authentication**: JWT with Passport

### LLM Integration
- **🤖 OpenAI**: GPT-4, GPT-3.5 등 최신 GPT 모델
- **🧠 Anthropic Claude**: Claude-3.5-Sonnet 등 고성능 모델
- **🏠 Ollama**: 로컬 LLM 실행 (Llama, Mistral 등)

### DevOps & Tools
- **🐳 Containerization**: Docker & Docker Compose
- **🚀 CI/CD**: GitHub Actions
- **📏 Code Quality**: ESLint, Prettier, Husky
- **🧪 Testing**: Jest, Supertest
- **📊 Monitoring**: Winston Logging

## 🚀 빠른 시작

### 1. 사전 요구사항

- Node.js 18+ 
- Yarn 1.22+
- Docker & Docker Compose
- Git

### 2. 설치 및 설정

```bash
# 저장소 클론
git clone https://github.com/your-org/ai-solution-center.git
cd ai-solution-center

# 개발 환경 자동 설정
yarn setup:dev
```

이 명령어가 다음을 자동으로 수행합니다:
- 의존성 설치
- 환경 변수 설정
- Docker 서비스 시작 (PostgreSQL, Redis)
- Core 라이브러리 빌드

### 3. 첫 번째 서비스 생성

```bash
# 대화형 서비스 생성
yarn create:service

# 또는 명령줄로 직접 생성
yarn create:service my-chat-service "AI 채팅 서비스" "개발자명" openai 3001
```

### 4. 서비스 실행

```bash
# 생성한 서비스 실행
yarn nx serve my-chat-service

# 서비스 접속
curl http://localhost:3001/api/health
```

## 📁 프로젝트 구조

```
ai-solution-center/
├── 📁 apps/
│   └── 📁 services/           # 개별 마이크로서비스들
│       └── 📁 example-service/
├── 📁 libs/
│   ├── 📁 core/              # 핵심 공유 라이브러리
│   │   ├── 📁 llm/           # LLM 통합 클라이언트
│   │   ├── 📁 database/      # TypeORM 데이터베이스 모듈
│   │   └── 📁 auth/          # JWT 인증 모듈
│   ├── 📁 common/            # 공통 유틸리티
│   └── 📁 features/          # 선택적 기능 모듈
├── 📁 tools/
│   ├── 📁 generators/        # Nx 서비스 생성기
│   └── 📁 scripts/           # 유틸리티 스크립트
├── 📁 docker/
│   └── 📁 development/       # 개발용 Docker 설정
└── 📁 .github/
    └── 📁 workflows/         # CI/CD 파이프라인
```

## 🛠️ 주요 명령어

### 개발 명령어
```bash
# 새 서비스 생성
yarn create:service <service-name>

# 서비스 실행
yarn nx serve <service-name>

# 서비스 빌드
yarn nx build <service-name>

# 테스트 실행
yarn nx test <service-name>

# 모든 영향받은 프로젝트 테스트
yarn affected:test
```

### Docker 명령어
```bash
# 기본 서비스 시작 (PostgreSQL, Redis)
yarn docker:up

# 모든 서비스 중지
yarn docker:down

# 관리 도구 시작 (Adminer)
yarn docker:tools

# Ollama (로컬 LLM) 시작
yarn docker:ollama

# 로그 확인
yarn docker:logs
```

### 프로젝트 관리
```bash
# 프로젝트 의존성 그래프 보기
yarn graph

# 코드 포맷팅
yarn format

# 린팅
yarn lint

# 캐시 정리
yarn clean
```

## 🔧 환경 변수 설정

`.env.example`을 `.env`로 복사하고 필요한 값들을 설정하세요:

```bash
cp .env.example .env
```

### 🔑 필수 설정

```env
# LLM API 키 (최소 하나는 필수)
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-claude-key

# JWT 보안 키 (운영환경에서는 반드시 변경)
JWT_SECRET=your-super-secret-key

# 데이터베이스 (기본값 사용 가능)
DATABASE_PASSWORD=dev123
```

## 🏛️ 아키텍처

### Core Libraries

#### 🤖 LLM Module (`@ai-solution/core/llm`)
- 다중 LLM 프로바이더 지원
- 자동 폴백 및 재시도 로직
- 통합 인터페이스 제공

```typescript
// 사용 예시
import { LLMService } from '@ai-solution/core/llm';

const response = await llmService.generateCompletion([
  { role: 'user', content: 'Hello!' }
], { provider: 'openai' });
```

#### 🗃️ Database Module (`@ai-solution/core/database`)
- TypeORM 기반 PostgreSQL 연동
- BaseEntity 및 BaseRepository 제공
- 자동 마이그레이션 지원

#### 🔐 Auth Module (`@ai-solution/core/auth`)
- JWT 기반 인증/인가
- 역할 기반 접근 제어 (RBAC)
- Passport 전략 통합

### 서비스 템플릿

생성되는 각 서비스는 다음 구조를 가집니다:

```typescript
// 기본 컨트롤러 예시
@Controller()
export class AppController {
  @Post('chat')
  @UseGuards(JwtAuthGuard)
  async chat(@Body() request: ChatRequest, @CurrentUser() user: User) {
    return this.appService.generateResponse(request.message, user);
  }
}
```

## 🧪 테스팅

### 단위 테스트
```bash
# 특정 서비스 테스트
yarn nx test my-service

# 모든 영향받은 프로젝트 테스트
yarn affected:test

# 커버리지 포함 테스트
yarn nx test my-service --coverage
```

### E2E 테스트
```bash
# E2E 테스트 실행
yarn nx e2e my-service-e2e
```

## 🚀 배포

### Docker 빌드
```bash
# 서비스 빌드
yarn nx build my-service

# Docker 이미지 빌드
docker build -t my-service:latest -f apps/services/my-service/Dockerfile .
```

### CI/CD Pipeline

GitHub Actions를 통한 자동화된 파이프라인:

1. **PR 검증**: 린팅, 테스트, 빌드
2. **배포**: Docker 이미지 빌드 및 레지스트리 푸시
3. **릴리스**: Helm 차트 생성 및 배포

## 🤝 기여하기

### 개발 워크플로우

1. **이슈 생성**: 새로운 기능이나 버그 리포트
2. **브랜치 생성**: `feature/service-name` 또는 `fix/issue-description`
3. **개발**: 로컬에서 개발 및 테스트
4. **PR 생성**: 코드 리뷰 및 CI 검증
5. **병합**: 승인 후 main 브랜치에 병합

### 코딩 규칙

- **TypeScript**: 엄격한 타입 검사 활용
- **ESLint**: 코드 스타일 일관성 유지
- **Testing**: 80% 이상 테스트 커버리지 목표
- **Documentation**: README 및 JSDoc 작성

## 📚 추가 자료

### 공식 문서
- [NestJS 문서](https://docs.nestjs.com/)
- [Nx 문서](https://nx.dev/)
- [TypeORM 문서](https://typeorm.io/)

### LLM 프로바이더 문서
- [OpenAI API](https://platform.openai.com/docs)
- [Anthropic Claude API](https://docs.anthropic.com/)
- [Ollama 문서](https://ollama.ai/docs)

## 🆘 문제 해결

### 자주 발생하는 문제

**🔴 Docker 서비스가 시작되지 않는 경우:**
```bash
# Docker 데몬 확인
docker info

# 포트 충돌 확인
sudo lsof -i :5432
sudo lsof -i :6379

# 컨테이너 재시작
yarn docker:clean && yarn docker:up
```

**🔴 LLM API 연결 오류:**
```bash
# API 키 확인
echo $OPENAI_API_KEY

# 프로바이더 상태 확인
curl http://localhost:3000/api/providers
```

**🔴 Nx 빌드 오류:**
```bash
# 캐시 정리
yarn clean

# 의존성 재설치
rm -rf node_modules yarn.lock
yarn install
```

## 📞 지원

- **이슈 리포트**: [GitHub Issues](https://github.com/your-org/ai-solution-center/issues)
- **기능 요청**: [GitHub Discussions](https://github.com/your-org/ai-solution-center/discussions)
- **문서**: [프로젝트 위키](https://github.com/your-org/ai-solution-center/wiki)

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

---

<div align="center">
  <p><strong>🎓 AI Solution Center로 대학생들의 혁신적인 AI 서비스를 만들어보세요!</strong></p>
  <p>Made with ❤️ by AI Solution Team</p>
</div>