import { DynamicModule, Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

export interface AuthModuleOptions {
  secret?: string;
  expiresIn?: string;
  refreshExpiresIn?: string;
}

@Global()
@Module({})
export class AuthModule {
  static forRoot(options?: AuthModuleOptions): DynamicModule {
    return {
      module: AuthModule,
      imports: [
        ConfigModule,
        PassportModule,
        TypeOrmModule.forFeature([User]),
        JwtModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            secret:
              options?.secret ||
              configService.get<string>('JWT_SECRET') ||
              'your-secret-key',
            signOptions: {
              expiresIn:
                options?.expiresIn ||
                configService.get<string>('JWT_EXPIRES_IN') ||
                '1h',
            },
          }),
        }),
      ],
      providers: [
        AuthService,
        JwtStrategy,
        LocalStrategy,
        JwtAuthGuard,
        RolesGuard,
        {
          provide: 'AUTH_OPTIONS',
          useValue: options || {},
        },
      ],
      exports: [
        AuthService,
        JwtAuthGuard,
        RolesGuard,
        TypeOrmModule,
      ],
    };
  }

  static forRootAsync(options: {
    imports?: any[];
    useFactory?: (
      ...args: any[]
    ) => Promise<AuthModuleOptions> | AuthModuleOptions;
    inject?: any[];
  }): DynamicModule {
    return {
      module: AuthModule,
      imports: [
        ConfigModule,
        PassportModule,
        TypeOrmModule.forFeature([User]),
        JwtModule.registerAsync({
          imports: [ConfigModule, ...(options.imports || [])],
          inject: [ConfigService, ...(options.inject || [])],
          useFactory: async (
            configService: ConfigService,
            ...args: any[]
          ) => {
            const moduleOptions = options.useFactory
              ? await options.useFactory(...args)
              : {};

            return {
              secret:
                moduleOptions.secret ||
                configService.get<string>('JWT_SECRET') ||
                'your-secret-key',
              signOptions: {
                expiresIn:
                  moduleOptions.expiresIn ||
                  configService.get<string>('JWT_EXPIRES_IN') ||
                  '1h',
              },
            };
          },
        }),
      ],
      providers: [
        AuthService,
        JwtStrategy,
        LocalStrategy,
        JwtAuthGuard,
        RolesGuard,
        {
          provide: 'AUTH_OPTIONS',
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
      ],
      exports: [
        AuthService,
        JwtAuthGuard,
        RolesGuard,
        TypeOrmModule,
      ],
    };
  }
}