import { buildApp } from "./app";
import { getConfig } from "./config";

const config = getConfig();
const app = buildApp(config);

const start = async (): Promise<void> => {
  try {
    await app.listen({ port: config.port, host: "0.0.0.0" });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

void start();
