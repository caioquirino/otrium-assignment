import serverlessExpress from '@codegenie/serverless-express'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app/app.module' // Import your NestJS AppModule
import { ExpressAdapter } from '@nestjs/platform-express'
import type { Context, APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import express from 'express'

let serverlessExpressInstance: (_event: APIGatewayProxyEventV2, _context: Context) => Promise<APIGatewayProxyResultV2>

function asyncTask(): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => resolve('connected to database'), 1000)
  })
}

async function setup(): Promise<
  (_event: APIGatewayProxyEventV2, _context: Context) => Promise<APIGatewayProxyResultV2>
> {
  if (serverlessExpressInstance !== undefined) return serverlessExpressInstance

  const asyncValue = await asyncTask()
  console.log(asyncValue)

  const expressApp = express()
  const nestApp = await NestFactory.create(AppModule, new ExpressAdapter(expressApp))
  await nestApp.init()

  serverlessExpressInstance = serverlessExpress({ app: expressApp }) as unknown as (
    _event: APIGatewayProxyEventV2,
    _context: Context,
  ) => Promise<APIGatewayProxyResultV2>
  return serverlessExpressInstance
}

const handler = async (event: APIGatewayProxyEventV2, context: Context): Promise<APIGatewayProxyResultV2> =>
  (await setup())(event, context)

export { handler }
