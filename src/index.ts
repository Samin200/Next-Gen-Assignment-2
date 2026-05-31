import { env } from "./config/env.js";
import { createApp } from "./app.js";

const app = createApp();

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[devpulse] API listening on http://localhost:${env.PORT}`);
});

export default app;
