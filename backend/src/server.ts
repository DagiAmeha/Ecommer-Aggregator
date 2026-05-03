import "dotenv/config";
import { app } from "./app";
import { initDb } from "./config/db";
import "./config/firebase";

const port = Number(process.env.PORT || 4000);

async function bootstrap(): Promise<void> {
  await initDb();

  app.listen(port, () => {
    console.log(`Backend API running on http://localhost:${port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start backend:", error);
  process.exit(1);
});
