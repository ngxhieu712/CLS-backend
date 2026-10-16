import mongoose, { Schema, Types } from 'mongoose';

// Chưa đấu / Đang đấu / Trọng tài đã gửi / Admin xác nhận
export const MATCH_STATUSES = ['scheduled', 'live', 'submitted', 'confirmed'] as const;
export type MatchStatus = (typeof MATCH_STATUSES)[number];

// Bình thường / Xử thua / Bỏ cuộc
export const MATCH_END_TYPES = ['normal', 'forfeit', 'withdrawn'] as const;
export type MatchEndType = (typeof MATCH_END_TYPES)[number];

export type MatchSlot = 'A' | 'B';

// Bảng Trận_đấu
export interface IMatch {
    scheduledAt?: Date;                // Giờ_thi_đấu
    status: MatchStatus;               // Trạng_thái_trận
    endType: MatchEndType;             // Hình_thức_kết_thúc
    streamUrl: string;                 // Kênh_stream
    teamALabel: string;                // Nhãn_vị_trí_đội_A (vd "Nhất bảng A")
    teamBLabel: string;                // Nhãn_vị_trí_đội_B
    round: Types.ObjectId;             // Mã_vòng
    group: Types.ObjectId | null;      // Mã_bảng (chỉ vòng bảng)
    teamA: Types.ObjectId | null;      // Mã_đội_A (rỗng khi chưa biết đội)
    teamB: Types.ObjectId | null;      // Mã_đội_B
    winner: Types.ObjectId | null;     // Mã_đội_thắng
    nextMatch: Types.ObjectId | null;  // Mã_trận_tiếp_theo
    nextMatchSlot: MatchSlot | null;   // Đội thắng vào ô A hay B của trận tiếp theo
    createdAt?: Date;
    updatedAt?: Date;
}

const matchSchema = new Schema<IMatch>({
    scheduledAt: { type: Date },
    status: { type: String, enum: [...MATCH_STATUSES], default: 'scheduled' },
    endType: { type: String, enum: [...MATCH_END_TYPES], default: 'normal' },
    streamUrl: { type: String, default: '' },
    teamALabel: { type: String, default: '' },
    teamBLabel: { type: String, default: '' },
    round: { type: Schema.Types.ObjectId, ref: 'Round', required: true },
    group: { type: Schema.Types.ObjectId, ref: 'Group', default: null },
    teamA: { type: Schema.Types.ObjectId, ref: 'Team', default: null },
    teamB: { type: Schema.Types.ObjectId, ref: 'Team', default: null },
    winner: { type: Schema.Types.ObjectId, ref: 'Team', default: null },
    nextMatch: { type: Schema.Types.ObjectId, ref: 'Match', default: null },
    nextMatchSlot: { type: String, enum: ['A', 'B', null], default: null },
}, { timestamps: true, collection: 'Match' });

// Ràng buộc trong phạm vi 1 document (kiểm tra chéo collection để ở tầng service)
const sameId = (a: Types.ObjectId | null | undefined, b: Types.ObjectId | null | undefined): boolean =>
    !!a && !!b && a.equals(b);

matchSchema.pre('validate', function () {
    const { teamA, teamB, winner } = this;
    if (sameId(teamA, teamB)) {
        this.invalidate('teamB', 'Đội A và đội B phải khác nhau');
    }
    if (winner && !sameId(winner, teamA) && !sameId(winner, teamB)) {
        this.invalidate('winner', 'Đội thắng phải là đội A hoặc đội B');
    }
    if (this.status === 'confirmed' && !winner) {
        this.invalidate('winner', 'Trận đã xác nhận phải có đội thắng');
    }
    if (this.nextMatch && !this.nextMatchSlot) {
        this.invalidate('nextMatchSlot', 'Cần chỉ rõ ô A hoặc B của trận tiếp theo');
    }
});

matchSchema.index({ round: 1, scheduledAt: 1 });
matchSchema.index({ teamA: 1 });
matchSchema.index({ teamB: 1 });

const Match = mongoose.model<IMatch>('Match', matchSchema);

export default Match;
