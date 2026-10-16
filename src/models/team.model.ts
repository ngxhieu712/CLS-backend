import mongoose, { Schema, Types } from 'mongoose';

export const TEAM_PROFILE_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type TeamProfileStatus = (typeof TEAM_PROFILE_STATUSES)[number];

// Bảng Đội
export interface ITeam {
    name: string;                      // Tên_đội
    tag: string;                       // Tag
    logo: string;                      // Logo (URL)
    description: string;               // Giới_thiệu_ngắn
    organization: string;              // Tổ_chức_trưởng_đại_diện
    contactEmail: string;              // Email_liên_hệ
    contactPhone: string;              // SĐT_liên_hệ
    registeredAt: Date;                // Ngày_đăng_ký
    profileStatus: TeamProfileStatus;  // Trạng_thái_hồ_sơ
    rejectReason: string;              // Lý do admin từ chối hồ sơ (không bắt buộc)
    manager: Types.ObjectId;           // Mã_quản_lý
    tournament: Types.ObjectId;        // Mã_giải
    group: Types.ObjectId | null;      // Mã_bảng (rỗng đến khi xếp bảng)
    createdAt?: Date;
    updatedAt?: Date;
}

const teamSchema = new Schema<ITeam>({
    name: { type: String, required: true, trim: true },
    tag: { type: String, required: true, trim: true },
    logo: { type: String, default: '' },
    description: { type: String, default: '' },
    organization: { type: String, default: '' },
    contactEmail: { type: String, required: true, lowercase: true, trim: true },
    contactPhone: { type: String, required: true, trim: true },
    registeredAt: { type: Date, default: Date.now },
    profileStatus: { type: String, enum: [...TEAM_PROFILE_STATUSES], default: 'pending' },
    rejectReason: { type: String, default: '' },
    manager: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tournament: { type: Schema.Types.ObjectId, ref: 'Tournament', required: true },
    group: { type: Schema.Types.ObjectId, ref: 'Group', default: null },
}, { timestamps: true, collection: 'Team' });

// 1 người quản lý chỉ quản lý 1 đội; tên và tag không trùng trong cùng giải
teamSchema.index({ manager: 1 }, { unique: true });
teamSchema.index({ tournament: 1, name: 1 }, { unique: true });
teamSchema.index({ tournament: 1, tag: 1 }, { unique: true });

const Team = mongoose.model<ITeam>('Team', teamSchema);

export default Team;
