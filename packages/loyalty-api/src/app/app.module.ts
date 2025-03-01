import { Global, Module } from '@nestjs/common'
import { GetUserPointsUseCase } from './use-cases/get-user-points.use-case'
import { OtriumAssignmentSharedModule, SharedModuleOptions } from '@otrium-assignment/shared'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { LoyaltyController } from './presentation/loyalty.controller'
import { DevtoolsModule } from '@nestjs/devtools-integration'
import { ConfigurableModuleClass } from '@nestjs/common/cache/cache.module-definition'

@Global()
@Module({
  controllers: [LoyaltyController],
  providers: [GetUserPointsUseCase],
  imports: [
    DevtoolsModule.register({
      http: true,
    }),
    ConfigModule.forRoot({
      envFilePath: ['.env', '.env.dev', '.env.prod'],
      isGlobal: true,
    }),
    OtriumAssignmentSharedModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService): Promise<SharedModuleOptions> => ({
        dynamoDBModuleOptions: {
          loyalty: {
            tableName: configService.getOrThrow<string>('dynamodb_loyalty_tableName'),
          },
          awsConfig: {
            region: configService.getOrThrow<string>('aws_region'),
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [OtriumAssignmentSharedModule],
})
export class AppModule extends ConfigurableModuleClass {}
