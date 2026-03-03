import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { createPostComment, deletePostComment, updatePostComment } from "../data/comments.data";
import { getCurrentUserId } from "../auth/user.auth";
import { commentOwnershipMiddleware } from "./middleware/comment-ownership.middleware";
import type { PostComments } from "../../../shared/interfaces/comments.interface";

const commentsController = new Hono();

/*
  POST /      -> Create Comment — auth required
  PUT /:id    -> Edit Comment   — auth required + ownership
  DELETE /:id -> Delete Comment — auth required + ownership
*/

// -------- Create Comment -- Auth Required --------
commentsController.post(
  '/',
  jwt({ secret: Bun.env.JWT_SECRET as string, alg: 'HS256' }),
  async (c) => {
    const requestBody = await c.req.json()

    const currentUserId = await getCurrentUserId(c)
    if (!currentUserId) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const comment: PostComments = {
      id: Bun.randomUUIDv7(),
      post_id: requestBody.post_id,
      author_id: currentUserId,
      parent_id: requestBody.parent_id ?? null,
      body: requestBody.body,
      created_at: new Date().toISOString(),
      moderation_status: '',
      moderation_reason: '',
      moderated_by: '',
      moderated_at: '',
    }

    if (!comment.post_id || !comment.body) {
      return c.json({ error: 'post_id and body are required' }, 400)
    }

    const created = createPostComment(comment)
    if (!created) {
      return c.json({ error: 'Failed to create comment' }, 500)
    }
    return c.json(created)
  },
)

// -------- Edit Comment -- Auth Required + Ownership --------
commentsController.put(
  '/:id',
  jwt({ secret: Bun.env.JWT_SECRET as string, alg: 'HS256' }),
  commentOwnershipMiddleware,
  async (c) => {
    const commentId = c.req.param('id')
    const { body } = await c.req.json()
    if (!body) {
      return c.json({ error: 'Body is required' }, 400)
    }
    const updated = updatePostComment(commentId, body)
    if (!updated) {
      return c.json({ error: 'Comment not found or failed to update' }, 404)
    }
    return c.json(updated)
  },
)

// -------- Delete Comment -- Auth Required + Ownership --------
commentsController.delete(
  '/:id',
  jwt({ secret: Bun.env.JWT_SECRET as string, alg: 'HS256' }),
  commentOwnershipMiddleware,
  async (c) => {
    const commentId = c.req.param('id')
    const deleted = deletePostComment(commentId)
    return c.json(deleted)
  },
)

export default commentsController;
