import { Router } from 'express';
import {
	createComment,
	deleteComment,
	getAllComments,
	getCommentById,
	updateComment,
} from '../controller/comment.controller';

const router = Router();

router.get('/', getAllComments);

router.get('/:postId', getCommentById);

router.post('/', createComment);

router.put('/:postId', updateComment);

router.delete('/:postId', deleteComment);

export default router;
