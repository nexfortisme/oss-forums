export interface BaseComment {
  id: string
  author_id: string
  parent_id: string
  body: string
  created_at: string
  moderation_status: string
  moderation_reason: string
  moderated_by: string
  moderated_at: string
}

export interface PostComments extends BaseComment {
  post_id: string
}

export interface ProfileComments extends BaseComment {
  profile_user_id: string
}
