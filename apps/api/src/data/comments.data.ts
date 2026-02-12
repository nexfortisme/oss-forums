import { PostComments } from "../../../shared/interfaces/comments.interface"
import {db} from "../persistance/database"


// Create
export const createPostComment = async (comment: PostComments) => {
    const newComment = await db.query('INSERT INTO comments (id, post_id, author_id, parent_id, body, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(comment.id, comment.post_id, comment.author_id, comment.parent_id, comment.body, comment.created_at)
    return newComment
}

export const deletePostComment = async (commentId: string) => {
    const comment = await db.query('UPDATE comments SET deleted = TRUE, deleted_at = CURRENT_TIMESTAMP WHERE id = ?').run(commentId)
    return comment
}

export const getPostComments = async (postId: string) => {
    const comments = await db.query('SELECT * FROM comments WHERE post_id = ? AND deleted = FALSE ORDER BY created_at ASC').all(postId)
    return comments
}

