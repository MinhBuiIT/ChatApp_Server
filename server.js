import { config } from 'dotenv';
import httpServer from './src/app.js';

config();
const PORT = process.env.PORT || 3000;
const env = process.env.NODE_ENV;
const server = httpServer.listen(PORT, () => {
  console.log(`Server is running on ${PORT} in ${env} mode`);
});
