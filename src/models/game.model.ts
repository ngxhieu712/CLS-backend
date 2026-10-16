import mongoose, { Schema, Types } from 'mongoose';

// Bảng Ván_đấu (thực thể yếu của Trận_đấu, khóa ghép: match + gameNumber)
export interface IGame {
    match: Types.ObjectId;             // Mã_trận
    gameNumber: number;                // Số_thứ_tự_ván
    // THÊM so với lược đồ: đội thắng ván, cần để tính tỉ số và hiệu số ván
    winner: Types.ObjectId | null;
    createdAt?: Date;
    updatedAt?: Date;
}

const gameSchema = new Schema<IGame>({
    match: { type: Schema.Types.ObjectId, ref: 'Match', required: true },
    gameNumber: { type: Number, required: true, min: 1 },
    winner: { type: Schema.Types.ObjectId, ref: 'Team', default: null },
}, { timestamps: true, collection: 'Game' });

gameSchema.index({ match: 1, gameNumber: 1 }, { unique: true });

const Game = mongoose.model<IGame>('Game', gameSchema);

export default Game;
