import { DynamicModule, Module, Global } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

export interface DatabaseModuleOptions {
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  synchronize?: boolean;
  logging?: boolean;
  [key: string]: any;
}

@Global()
@Module({})
export class DatabaseModule {
  static forRoot(options?: DatabaseModuleOptions): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        ConfigModule,
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
            const isProduction = configService.get('NODE_ENV') === 'production';
            
            return {
              type: 'postgres',
              host: configService.get<string>('DATABASE_HOST', 'localhost'),
              port: configService.get<number>('DATABASE_PORT', 5432),
              username: configService.get<string>('DATABASE_USER', 'developer'),
              password: configService.get<string>('DATABASE_PASSWORD', 'dev123'),
              database: configService.get<string>('DATABASE_NAME', 'ai_solution'),
              entities: [__dirname + '/../**/*.entity{.ts,.js}'],
              synchronize: !isProduction && configService.get<boolean>('DATABASE_SYNCHRONIZE', true),
              logging: !isProduction && configService.get<boolean>('DATABASE_LOGGING', true),
              ssl: isProduction ? { rejectUnauthorized: false } : false,
              migrations: [__dirname + '/migrations/*{.ts,.js}'],
              migrationsRun: configService.get<boolean>('DATABASE_MIGRATIONS_RUN', false),
              migrationsTableName: 'migrations',
              retryAttempts: configService.get<number>('DATABASE_RETRY_ATTEMPTS', 3),
              retryDelay: configService.get<number>('DATABASE_RETRY_DELAY', 3000),
              maxQueryExecutionTime: configService.get<number>('DATABASE_MAX_QUERY_TIME', 30000),
              ...options,
            };
          },
        }),
      ],
      exports: [TypeOrmModule],
    };
  }

  static forRootAsync(options: {
    imports?: any[];
    useFactory?: (
      ...args: any[]
    ) => Promise<DatabaseModuleOptions> | DatabaseModuleOptions;
    inject?: any[];
  }): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        ConfigModule,
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule, ...(options.imports || [])],
          inject: [ConfigService, ...(options.inject || [])],
          useFactory: async (
            configService: ConfigService,
            ...args: any[]
          ): Promise<TypeOrmModuleOptions> => {
            const customOptions = options.useFactory
              ? await options.useFactory(...args)
              : {};

            const isProduction = configService.get('NODE_ENV') === 'production';

            return {
              type: 'postgres',
              host: configService.get<string>('DATABASE_HOST', 'localhost'),
              port: configService.get<number>('DATABASE_PORT', 5432),
              username: configService.get<string>('DATABASE_USER', 'developer'),
              password: configService.get<string>('DATABASE_PASSWORD', 'dev123'),
              database: configService.get<string>('DATABASE_NAME', 'ai_solution'),
              entities: [__dirname + '/../**/*.entity{.ts,.js}'],
              synchronize: !isProduction && configService.get<boolean>('DATABASE_SYNCHRONIZE', true),
              logging: !isProduction && configService.get<boolean>('DATABASE_LOGGING', true),
              ssl: isProduction ? { rejectUnauthorized: false } : false,
              migrations: [__dirname + '/migrations/*{.ts,.js}'],
              migrationsRun: configService.get<boolean>('DATABASE_MIGRATIONS_RUN', false),
              migrationsTableName: 'migrations',
              retryAttempts: configService.get<number>('DATABASE_RETRY_ATTEMPTS', 3),
              retryDelay: configService.get<number>('DATABASE_RETRY_DELAY', 3000),
              maxQueryExecutionTime: configService.get<number>('DATABASE_MAX_QUERY_TIME', 30000),
              ...customOptions,
            };
          },
        }),
      ],
      exports: [TypeOrmModule],
    };
  }
}