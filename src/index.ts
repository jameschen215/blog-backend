import 'dotenv/config';
import express from 'express';
import passport from 'passport';

import authRoutes from './routes/auth.routes.js';
import postRoutes from './routes/post.routes.js';
import { jwtStrategy } from './config/passport.config.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure passport
passport.use(jwtStrategy);

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
// app.use('/api/comments', commentRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ message: 'Resource not found' });
});

// Start server
const port = process.env.PORT || '8000';
app.listen(port, () => {
  console.log('Server is running on '.concat(port));
});
