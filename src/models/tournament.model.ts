import mongoose, { Schema } from 'mongoose';

export const TOURNAMENT_STATUSES = ['draft', 'registration', 'groupStage', 'playoff', 'finished'] as const;
export type TournamentStatus = (typeof TOURNAMENT_STATUSES)[number];

// Bảng Giải_đấu
export interface ITournament {
    name: string;                      // Tên_giải
    description: string;               // Mô_tả
    banner: string;                    // Logo_banner (URL ảnh)
    startDate?: Date;                  // Ngày_bắt_đầu
    endDate?: Date;                    // Ngày_kết_thúc
    status: TournamentStatus;          // Trạng_thái_giải
    advancingPerGroup: number;         // Số_đội_đi_tiếp_mỗi_bảng
    winPoints: number;                 // Điểm_thắng
    losePoints: number;                // Điểm_thua
    createdAt?: Date;
    updatedAt?: Date;
}

const tournamentSchema = new Schema<ITournament>({
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    banner: { type: String, default: '' },
    startDate: { type: Date },
    endDate: { type: Date },
    status: { type: String, enum: [...TOURNAMENT_STATUSES], default: 'draft' },
    advancingPerGroup: { type: Number, required: true, default: 2, min: 1 },
    winPoints: { type: Number, default: 3 },
    losePoints: { type: Number, default: 0 },
    // Bỏ Mã_tài_khoản: web hiện chỉ phục vụ 1 giải, sẽ thêm khi mở rộng nhiều giải
}, { timestamps: true, collection: 'Tournament' });

const Tournament = mongoose.model<ITournament>('Tournament', tournamentSchema);

export default Tournament;
