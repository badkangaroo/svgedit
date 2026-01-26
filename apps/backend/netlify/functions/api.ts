import awsLambdaFastify from "@fastify/aws-lambda";
import { buildApp } from "../../src/app";
import { getConfig } from "../../src/config";

const app = buildApp(getConfig());
const proxy = awsLambdaFastify(app);

export const handler = proxy;
