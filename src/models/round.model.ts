import mongoose, { Schema, Types } from 'mongoose';

export const ROUND_TYPES = ['group', 'knockout'] as const;
export type RoundType = (typeof ROUND_TYPES)[number];

// Bảng Vòng_đấu
export interface RoundDocument extends mongoose.Document {
    name: string;                      // Tên_vòng
    type: RoundType;                   // Loại_vòng (vòng bảng / loại trực tiếp)
    order: number;                     // Thứ_tự_vòng
    maxGames: number;                  // Số_ván_tối_đa (BO1/BO3/BO5...)
    tournament: Types.ObjectId;        // Mã_giải
    createdAt?: Date;
    updatedAt?: Date;
}

const roundSchema = new Schema<RoundDocument>({
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: [...ROUND_TYPES], required: true },
    order: { type: Number, required: true, min: 1 },
    maxGames: { type: Number, required: true, min: 1 },
    tournament: { type: Schema.Types.ObjectId, ref: 'Tournament', required: true },
}, { timestamps: true, collection: 'Round' });

// Thứ tự vòng không trùng trong cùng một giải
roundSchema.index({ tournament: 1, order: 1 }, { unique: true });

export const RoundModel = mongoose.model<RoundDocument>('Round', roundSchema);
