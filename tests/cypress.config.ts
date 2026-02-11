import { defineConfig } from "cypress";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, ".env") });

export default defineConfig({
  e2e: {
    baseUrl:
      process.env.CYPRESS_BASE_URL ||
      process.env.BASE_URL ||
      "http://localhost:3000",
    specPattern: "**/*.cy.{js,ts,tsx}",
    supportFile: "support/e2e.ts",
    video: false,
  },
});
