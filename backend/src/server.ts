import app from "./app.js";
import { env } from "./lib/env.js";

const port = Number(env.PORT);

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
