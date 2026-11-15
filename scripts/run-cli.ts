import { runModule } from "./run";

const file = process.argv[2];
if (!file) {
  console.error("ใช้งาน: run-cli.ts <ไฟล์>");
  process.exitCode = 1;
} else {
  try {
    await runModule(file);
  } catch (error) {
    if (error instanceof Error && error.name === "EnvError") {
      console.error(error.message);
      process.exitCode = 1;
    } else {
      throw error;
    }
  }
}
