import { DynamicModule, Module, Provider } from '@nestjs/common'
import { DynamoDBLoyaltyUserRepository } from './domain/loyalty-user.repository.js'
import { DynamoDBClient, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { Type } from '@nestjs/common/interfaces/type.interface'
import { ForwardReference } from '@nestjs/common/interfaces/modules/forward-reference.interface'
import { InjectionToken } from '@nestjs/common/interfaces/modules/injection-token.interface'
import { OptionalFactoryDependency } from '@nestjs/common/interfaces/modules/optional-factory-dependency.interface'
import { PointCalculatorService } from './utils/point-calculator.service'

export type DynamoDbModuleOptions = {
  loyalty: {
    tableName: string
  }
  awsConfig: DynamoDBClientConfig
}

export type SharedModuleOptions = {
  dynamoDBModuleOptions: DynamoDbModuleOptions
}

export interface SharedModuleAsyncOptions {
  imports?: Array<Type<any> | DynamicModule | Promise<DynamicModule> | ForwardReference>
  useFactory: (..._args: any[]) => Promise<SharedModuleOptions> | SharedModuleOptions
  inject?: Array<InjectionToken | OptionalFactoryDependency>
}

const createDynamoDBProviders = (): Provider[] => [
  // Removed options parameter
  {
    provide: 'DYNAMODB_CLIENT',
    useFactory: (resolvedOptions: DynamoDbModuleOptions) => {
      const dynamoDBClient = new DynamoDBClient(resolvedOptions.awsConfig)
      const marshallOptions = {
        convertEmptyValues: false,
        removeUndefinedValues: true,
        convertClassInstanceToMap: false,
      }
      const unmarshallOptions = {
        wrapNumbers: false,
      }
      const translateConfig = { marshallOptions, unmarshallOptions }
      return DynamoDBDocumentClient.from(dynamoDBClient, translateConfig)
    },
    inject: ['DYNAMODB_CONFIG_OPTIONS'],
  },
  {
    provide: 'LOYALTY_TABLE_NAME',
    useFactory: (resolvedOptions: DynamoDbModuleOptions) => {
      return resolvedOptions.loyalty.tableName
    },
    inject: ['DYNAMODB_CONFIG_OPTIONS'],
  },
]

@Module({
  providers: [DynamoDBLoyaltyUserRepository, PointCalculatorService],
  exports: [DynamoDBLoyaltyUserRepository, PointCalculatorService],
})
export class OtriumAssignmentSharedModule {
  static register(options: SharedModuleOptions): DynamicModule {
    return {
      module: OtriumAssignmentSharedModule,
      providers: [
        {
          provide: 'DYNAMODB_CONFIG_OPTIONS',
          useValue: options.dynamoDBModuleOptions,
        },
        ...createDynamoDBProviders(), // Call without arguments
        DynamoDBLoyaltyUserRepository,
        PointCalculatorService,
      ],
      exports: [DynamoDBLoyaltyUserRepository, 'DYNAMODB_CLIENT', 'LOYALTY_TABLE_NAME', PointCalculatorService],
    }
  }

  static registerAsync(options: SharedModuleAsyncOptions): DynamicModule {
    return {
      module: OtriumAssignmentSharedModule,
      imports: options.imports || [],
      providers: [
        ...this.createAsyncOptionsProvider(options),
        ...createDynamoDBProviders(), // Call without arguments
        DynamoDBLoyaltyUserRepository,
        PointCalculatorService,
      ],
      exports: [DynamoDBLoyaltyUserRepository, 'DYNAMODB_CLIENT', 'LOYALTY_TABLE_NAME', PointCalculatorService],
    }
  }

  private static createAsyncOptionsProvider(options: SharedModuleAsyncOptions): Provider[] {
    return [
      {
        provide: 'DYNAMODB_CONFIG_OPTIONS',
        useFactory: async (...args: any[]) => {
          const sharedOptions = await options.useFactory(...args)
          return sharedOptions.dynamoDBModuleOptions
        },
        inject: options.inject || [],
      },
    ]
  }
}
