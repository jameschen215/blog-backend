import { Router } from 'express';
import {
	createPost,
	deletePost,
	getAllPosts,
	getPostById,
	updatePost,
} from '../controller/post.controller';

const router = Router();

router.get('/', getAllPosts);

router.get('/:postId', getPostById);

router.post('/', createPost);

router.put('/:postId', updatePost);

router.delete('/:postId', deletePost);

export default router;
