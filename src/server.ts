import app from './app';
import { validateEnv } from './config/env.config';

const env = validateEnv();
const PORT = env.PORT;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${env.NODE_ENV}`);
});
