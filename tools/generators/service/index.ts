import {
  Tree,
  formatFiles,
  installPackagesTask,
  names,
  offsetFromRoot,
  generateFiles,
  joinPathFragments,
  updateJson,
  readJson,
} from '@nx/devkit';
import { applicationGenerator } from '@nx/nest';

interface ServiceGeneratorSchema {
  name: string;
  directory?: string;
  tags?: string;
  description?: string;
  author?: string;
  llmProvider?: 'openai' | 'claude' | 'ollama';
  port?: number;
}

export default async function (tree: Tree, options: ServiceGeneratorSchema) {
  const projectName = names(options.name).fileName;
  const projectRoot = joinPathFragments('apps', 'services', projectName);
  const className = names(options.name).className;
  const propertyName = names(options.name).propertyName;

  // Generate NestJS application
  await applicationGenerator(tree, {
    name: options.name,
    directory: 'services',
    projectNameAndRootFormat: 'as-provided',
    tags: options.tags || 'scope:service',
    strict: true,
    skipFormat: true,
    skipPackageJson: true,
  });

  // Generate additional files from templates
  generateFiles(
    tree,
    joinPathFragments(__dirname, 'files'),
    projectRoot,
    {
      ...options,
      ...names(options.name),
      projectName,
      className,
      propertyName,
      offsetFromRoot: offsetFromRoot(projectRoot),
      template: '',
      port: options.port || 3000,
      description: options.description || `AI Solution Service - ${className}`,
      author: options.author || 'AI Solution Team',
      llmProvider: options.llmProvider || 'openai',
    }
  );

  // Update project.json to include proper targets
  const projectJsonPath = joinPathFragments(projectRoot, 'project.json');
  updateJson(tree, projectJsonPath, (json) => {
    json.targets = {
      ...json.targets,
      serve: {
        executor: '@nx/nest:serve',
        options: {
          buildTarget: `${projectName}:build`,
        },
        configurations: {
          development: {
            buildTarget: `${projectName}:build:development`,
          },
          production: {
            buildTarget: `${projectName}:build:production`,
          },
        },
      },
    };
    return json;
  });

  // Update workspace.json to include the new project
  const workspaceJson = readJson(tree, 'workspace.json');
  if (workspaceJson) {
    updateJson(tree, 'workspace.json', (json) => {
      json.projects = json.projects || {};
      json.projects[projectName] = projectRoot;
      return json;
    });
  }

  await formatFiles(tree);
  return () => {
    installPackagesTask(tree);
  };
}