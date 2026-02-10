export interface AdminQueue {
    id: string;
    item_type: string;
    item_id: string;
    reporter_id: string;
    reason: string;
    status: string;
    created_at: string;
    resolved_by?: string;
    resolved_at?: string;
}
