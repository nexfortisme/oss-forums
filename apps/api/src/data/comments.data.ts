import { PostComments } from "../../../shared/interfaces/comments.interface"
import { db } from "../persistance/database"

// Get By ID
export const getCommentById = (commentId: string): PostComments | null => {
  const comment = db.query('SELECT * FROM comments WHERE id = ? AND deleted = FALSE').get(commentId)
  if (!comment) {
    return null
  }
  return comment as PostComments
}

// Create
export const createPostComment = (comment: PostComments): PostComments | null => {
  const result = db.query(
    'INSERT INTO comments (id, post_id, author_id, parent_id, body, created_at) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(comment.id, comment.post_id, comment.author_id, comment.parent_id ?? null, comment.body, comment.created_at)
  if (result.changes === 0) {
    return null
  }
  return getCommentById(comment.id)
}

// Update
export const updatePostComment = (commentId: string, body: string): PostComments | null => {
  const result = db.query('UPDATE comments SET body = ? WHERE id = ? AND deleted = FALSE').run(body, commentId)
  if (result.changes === 0) {
    return null
  }
  return getCommentById(commentId)
}

// Soft Delete
export const deletePostComment = (commentId: string) => {
  return db.query('UPDATE comments SET deleted = TRUE, deleted_at = CURRENT_TIMESTAMP WHERE id = ?').run(commentId)
}

export const getPostComments = (postId: string) => {
  return db.query('SELECT * FROM comments WHERE post_id = ? AND deleted = FALSE ORDER BY created_at ASC').all(postId)
}
