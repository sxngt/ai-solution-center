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

    // Run the Nx generator
    const generatorCommand = [
      'yarn',
      'nx',
      'generate',
      './tools/generators/service',
      answers.name,
      `--description="${answers.description}"`,
      `--author="${answers.author}"`,
      `--llmProvider=${answers.llmProvider}`,
      `--port=${answers.port}`,
      '--no-interactive',
    ].join(' ');

    console.log(chalk.gray(`Running: ${generatorCommand}`));
    execSync(generatorCommand, { stdio: 'inherit' });

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

module.exports = { createService };