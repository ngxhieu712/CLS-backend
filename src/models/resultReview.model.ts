import { Schema, Types } from 'mongoose';
import { MatchLogModel, type MatchLogDocument } from './matchLog.model';
import type { MatchScore } from './resultSubmission.model';

export const REVIEW_ACTIONS = ['confirm', 'edit', 'reopen'] as const;
export type ReviewAction = (typeof REVIEW_ACTIONS)[number];

// Bảng Duyệt_kết_quả (con của Nhật_ký) do Admin thực hiện
export interface ResultReviewDocument extends MatchLogDocument {
    action: ReviewAction;              // Hành_động (xác nhận / sửa / mở lại)
    oldValue?: Partial<MatchScore>;        // Giá_trị_cũ
    newValue?: Partial<MatchScore>;        // Giá_trị_mới
    reason: string;                    // Lý_do
    admin: Types.ObjectId;             // Mã_admin
}

const resultReviewSchema = new Schema<ResultReviewDocument>({
    action: { type: String, enum: [...REVIEW_ACTIONS], required: true },
    // Giá_trị_cũ / Giá_trị_mới: tỉ số trận trước và sau khi admin duyệt (cùng dạng với Kết_quả_gửi)
    oldValue: {
        teamA: { type: Number, min: 0 },
        teamB: { type: Number, min: 0 },
    },
    newValue: {
        teamA: { type: Number, min: 0 },
        teamB: { type: Number, min: 0 },
    },
    reason: { type: String, default: '' },
    admin: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});

export const ResultReviewModel = MatchLogModel.discriminator<ResultReviewDocument>('ResultReview', resultReviewSchema);
