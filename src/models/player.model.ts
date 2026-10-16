import mongoose, { Schema, Types } from 'mongoose';

export const PLAYER_STATUSES = ['starter', 'substitute'] as const;
export type PlayerStatus = (typeof PLAYER_STATUSES)[number];

// Bảng Tuyển_thủ
export interface IPlayer {
    nickname: string;                  // Nickname
    fullName?: string;                 // Họ_tên (nội bộ)
    avatar: string;                    // Ảnh_đại_diện (URL)
    position?: string;                 // Vị_trí_chơi
    inGameId?: string;                 // ID_trong_game
    status: PlayerStatus;              // Trạng_thái (chính thức / dự bị)
    team: Types.ObjectId;              // Mã_đội
    createdAt?: Date;
    updatedAt?: Date;
}

const playerSchema = new Schema<IPlayer>({
    nickname: { type: String, required: true, trim: true },
    fullName: { type: String, trim: true },
    avatar: { type: String, default: '' },
    position: { type: String, trim: true },
    inGameId: { type: String, trim: true },
    status: { type: String, enum: [...PLAYER_STATUSES], default: 'starter' },
    team: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
}, { timestamps: true, collection: 'Player' });

playerSchema.index({ team: 1 });

const Player = mongoose.model<IPlayer>('Player', playerSchema);

export default Player;
