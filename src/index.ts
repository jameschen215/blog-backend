import 'dotenv/config';
import express from 'express';
import authRoutes from './routes/auth.routes.js';
import postRoutes from './routes/post.routes.js';
import commentRoutes from './routes/comment.routes.js';

const app = express();

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);

// 404 handler
app.use((req, res, next) => {
	res.status(404).json({ message: 'Resource not found' });
});

// Start server
const port = process.env.PORT || '8000';
app.listen(port, () => {
	console.log('Server is running on '.concat(port));
});
