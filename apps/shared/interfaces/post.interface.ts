export interface Post {
  id: string;
  channel_id: string;
  author_id: string;
  title?: string;
  body: string;
  created_at: string;
  moderation_status?: string;
  moderation_reason?: string;
  moderated_by?: string;
  moderated_at?: string;
}
