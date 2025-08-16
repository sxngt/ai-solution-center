#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if inquirer and chalk are available, if not, provide fallback
let useInquirer = false;
let inquirer, chalk;

try {
  inquirer = require('inquirer');
  chalk = require('chalk');
  useInquirer = true;
} catch (error) {
  // Fallback for missing dependencies
  chalk = {
    blue: (text) => `\x1b[34m${text}\x1b[0m`,
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    cyan: (text) => `\x1b[36m${text}\x1b[0m`,
    gray: (text) => `\x1b[90m${text}\x1b[0m`,
  };
  console.log(chalk.yellow('⚠️  Enhanced dependencies not installed. Using command-line arguments mode.'));
}

async function createService() {
  console.log(chalk.blue('🚀 AI Solution Center - Service Generator\n'));

  let answers;

  if (useInquirer && process.argv.length <= 2) {
    // Interactive mode with inquirer
    answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'What is the name of the service?',
        validate: (input) => {
          if (!input) return 'Service name is required';
          if (!/^[a-z][a-z0-9-]*$/.test(input)) {
            return 'Service name must start with a letter and contain only lowercase letters, numbers, and hyphens';
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'description',
        message: 'What does this service do?',
        default: 'AI-powered service for university students',
      },
      {
        type: 'input',
        name: 'author',
        message: 'Who is the author of this service?',
        default: 'AI Solution Team',
      },
      {
        type: 'list',
        name: 'llmProvider',
        message: 'Which LLM provider would you like to use primarily?',
        choices: [
          { name: 'OpenAI (GPT models)', value: 'openai' },
          { name: 'Anthropic Claude', value: 'claude' },
          { name: 'Ollama (Local LLM)', value: 'ollama' },
        ],
        default: 'openai',
      },
      {
        type: 'number',
        name: 'port',
        message: 'Port number for the service:',
        default: 3000,
        validate: (input) => {
          if (input < 1000 || input > 65535) {
            return 'Port must be between 1000 and 65535';
          }
          return true;
        },
      },
    ]);
  } else {
    // Command-line arguments mode
    const args = process.argv.slice(2);
    const name = args[0];

    if (!name) {
      console.error(chalk.red('❌ Service name is required'));
      console.log(chalk.yellow('Usage: yarn create:service <service-name>'));
      process.exit(1);
    }

    answers = {
      name,
      description: args[1] || 'AI-powered service for university students',
      author: args[2] || 'AI Solution Team',
      llmProvider: args[3] || 'openai',
      port: parseInt(args[4]) || 3000,
    };
  }

  try {
    console.log(chalk.blue('\\n📦 Creating service...'));
    
    // Check if service already exists
    const servicePath = path.join(process.cwd(), 'apps', 'services', answers.name);
    if (fs.existsSync(servicePath)) {
      console.error(chalk.red(`❌ Service '${answers.name}' already exists`));
      process.exit(1);
    }

    // Run the Nx NestJS generator to create the service
    const generatorCommand = [
      'npx',
      'nx',
      'g',
      '@nx/nest:application',
      `--name=${answers.name}`,
      `--directory=apps/services/${answers.name}`,
    ].join(' ');

    console.log(chalk.gray(`Running: ${generatorCommand}`));
    execSync(generatorCommand, { stdio: 'inherit' });

    // Customize the generated service for AI chat functionality
    console.log(chalk.blue('\\n🔧 Customizing service for AI functionality...'));
    await customizeAIService(answers);

    console.log(chalk.green('\\n✅ Service created successfully!'));
    console.log(chalk.blue('\\n📋 Service Information:'));
    console.log(`   Name: ${chalk.cyan(answers.name)}`);
    console.log(`   Description: ${chalk.cyan(answers.description)}`);
    console.log(`   Author: ${chalk.cyan(answers.author)}`);
    console.log(`   LLM Provider: ${chalk.cyan(answers.llmProvider)}`);
    console.log(`   Port: ${chalk.cyan(answers.port)}`);

    console.log(chalk.blue('\\n🚀 Next Steps:'));
    console.log(`   1. Set up environment variables: ${chalk.yellow('cp .env.example .env')}`);
    console.log(`   2. Start Docker services: ${chalk.yellow('yarn docker:up')}`);
    console.log(`   3. Run the service: ${chalk.yellow(`yarn nx serve ${answers.name}`)}`);
    console.log(`   4. Visit: ${chalk.cyan(`http://localhost:${answers.port}/api`)}`);

    console.log(chalk.blue('\\n📁 Service Structure:'));
    console.log(`   ${chalk.gray('apps/services/')}${chalk.cyan(answers.name)}/`);
    console.log(`   ├── src/`);
    console.log(`   │   ├── app.module.ts`);
    console.log(`   │   ├── app.controller.ts`);
    console.log(`   │   ├── app.service.ts`);
    console.log(`   │   ├── main.ts`);
    console.log(`   │   └── config/`);
    console.log(`   ├── Dockerfile`);
    console.log(`   └── README.md`);

  } catch (error) {
    console.error(chalk.red('❌ Failed to create service:'));
    console.error(error.message);
    process.exit(1);
  }
}

// Install inquirer if needed
function installInquirer() {
  try {
    console.log(chalk.blue('📦 Installing inquirer for interactive mode...'));
    execSync('yarn add -D inquirer chalk', { stdio: 'inherit' });
    console.log(chalk.green('✅ Dependencies installed. Please run the command again.'));
  } catch (error) {
    console.error(chalk.red('❌ Failed to install dependencies. Using command-line mode.'));
  }
}

// Check dependencies and run
async function main() {
  if (!useInquirer && process.argv.length <= 2) {
    console.log(chalk.yellow('🔧 Enhanced interactive mode requires additional dependencies.'));
    console.log(chalk.blue('Install them? (Recommended)'));
    
    try {
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      readline.question('Install inquirer for better experience? (y/N): ', (answer) => {
        readline.close();
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          installInquirer();
        } else {
          console.log(chalk.yellow('Using basic mode. Usage: yarn create:service <name> [description] [author] [llmProvider] [port]'));
        }
      });
    } catch (error) {
      console.log(chalk.yellow('Using basic mode. Usage: yarn create:service <name> [description] [author] [llmProvider] [port]'));
    }
  } else {
    await createService();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

// Function to customize the generated service for AI functionality
async function customizeAIService(answers) {
  const servicePath = path.join(process.cwd(), 'apps', 'services', answers.name);
  
  // Update app.module.ts to include LLMModule
  const moduleFilePath = path.join(servicePath, 'src', 'app', 'app.module.ts');
  if (fs.existsSync(moduleFilePath)) {
    const moduleTemplate = `import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LLMModule } from '@ai-solution/core/llm';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LLMModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
`;
    fs.writeFileSync(moduleFilePath, moduleTemplate);
    console.log(chalk.gray(`   ✓ Updated app.module.ts with LLM integration`));
  }

  // Update app.service.ts with AI chat functionality
  const serviceFilePath = path.join(servicePath, 'src', 'app', 'app.service.ts');
  if (fs.existsSync(serviceFilePath)) {
    const serviceTemplate = `import { Injectable } from '@nestjs/common';
import { LLMService } from '@ai-solution/core/llm';

export interface ChatRequest {
  message: string;
  provider?: 'openai' | 'claude' | 'ollama';
}

export interface ChatResponse {
  response: string;
  provider: string;
  timestamp: Date;
}

@Injectable()
export class AppService {
  constructor(private readonly llmService: LLMService) {}

  async generateChatResponse(request: ChatRequest): Promise<ChatResponse> {
    try {
      const response = await this.llmService.generateCompletion(
        [
          {
            role: 'system',
            content: '당신은 도움이 되는 AI 어시스턴트입니다. 사용자의 질문에 정확하고 유용한 답변을 제공하세요.'
          },
          {
            role: 'user',
            content: request.message
          }
        ],
        {
          provider: request.provider || '${answers.llmProvider}',
          maxTokens: 500,
          temperature: 0.7
        }
      );

      return {
        response: response.content,
        provider: response.provider,
        timestamp: new Date()
      };
    } catch (error) {
      // 실제 LLM 연동이 실패하면 모의 응답 반환
      const mockResponses = [
        "안녕하세요! AI 챗봇입니다. 무엇을 도와드릴까요?",
        "흥미로운 질문이네요! 더 자세히 설명해주시겠어요?",
        "정말 좋은 질문입니다! 이것에 대해 함께 알아보겠습니다."
      ];
      
      const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
      
      return {
        response: \`\${randomResponse}\\n\\n(모의 모드 - 원본 메시지: "\${request.message}")\`,
        provider: 'mock',
        timestamp: new Date()
      };
    }
  }

  async getAvailableProviders() {
    try {
      const providers = await this.llmService.getAvailableProviders();
      return {
        providers,
        total: providers.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        providers: ['mock'],
        total: 1,
        status: 'LLM integration pending - using mock mode',
        timestamp: new Date().toISOString()
      };
    }
  }

  getData(): { message: string } {
    return { message: \`Welcome to ${answers.name}! This service is powered by ${answers.llmProvider.toUpperCase()} LLM.\` };
  }
}
`;
    fs.writeFileSync(serviceFilePath, serviceTemplate);
    console.log(chalk.gray(`   ✓ Updated app.service.ts with AI chat functionality`));
  }

  // Update app.controller.ts with chat endpoints
  const controllerFilePath = path.join(servicePath, 'src', 'app', 'app.controller.ts');
  if (fs.existsSync(controllerFilePath)) {
    const controllerTemplate = `import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';

export interface ChatRequest {
  message: string;
  provider?: 'openai' | 'claude' | 'ollama';
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @Get('health')
  getHealth() {
    return { 
      status: 'ok', 
      service: '${answers.name}',
      description: '${answers.description}',
      author: '${answers.author}',
      port: ${answers.port},
      timestamp: new Date().toISOString()
    };
  }

  @Post('chat')
  async chat(@Body() request: ChatRequest) {
    return this.appService.generateChatResponse(request);
  }

  @Get('providers')
  async getProviders() {
    return this.appService.getAvailableProviders();
  }
}
`;
    fs.writeFileSync(controllerFilePath, controllerTemplate);
    console.log(chalk.gray(`   ✓ Updated app.controller.ts with AI chat endpoints`));
  }

  // Update main.ts with custom port
  const mainFilePath = path.join(servicePath, 'src', 'main.ts');
  if (fs.existsSync(mainFilePath)) {
    const mainTemplate = `/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  const port = process.env.PORT || ${answers.port};
  await app.listen(port);
  Logger.log(
    \`🚀 ${answers.name} is running on: http://localhost:\${port}/\${globalPrefix}\`
  );
}

bootstrap();
`;
    fs.writeFileSync(mainFilePath, mainTemplate);
    console.log(chalk.gray(`   ✓ Updated main.ts with custom port (${answers.port})`));
  }

  // Create a simple README for the service
  const readmeFilePath = path.join(servicePath, 'README.md');
  const readmeTemplate = `# ${answers.name}

${answers.description}

**Author:** ${answers.author}  
**Primary LLM Provider:** ${answers.llmProvider.toUpperCase()}  
**Port:** ${answers.port}

## API Endpoints

- \`GET /api\` - Service information
- \`GET /api/health\` - Health check
- \`POST /api/chat\` - AI chat endpoint
- \`GET /api/providers\` - Available LLM providers

## Usage

\`\`\`bash
# Start the service
yarn nx serve ${answers.name}

# Test the chat endpoint
curl -X POST http://localhost:${answers.port}/api/chat \\
  -H "Content-Type: application/json" \\
  -d '{"message": "안녕하세요!", "provider": "${answers.llmProvider}"}'
\`\`\`

## Environment Variables

Make sure to set up your LLM provider API keys in \`.env\`:

\`\`\`bash
# OpenAI
OPENAI_API_KEY=your_openai_key

# Anthropic Claude  
ANTHROPIC_API_KEY=your_claude_key

# Ollama (local)
OLLAMA_BASE_URL=http://localhost:11434
\`\`\`
`;
  fs.writeFileSync(readmeFilePath, readmeTemplate);
  console.log(chalk.gray(`   ✓ Created README.md with service documentation`));
}

module.exports = { createService };