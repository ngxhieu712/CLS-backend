import mongoose, { Schema, Types } from 'mongoose';

// Bảng Bảng_đấu
export interface GroupDocument extends mongoose.Document {
    name: string;                      // Tên_bảng
    tournament: Types.ObjectId;        // Mã_giải
    createdAt?: Date;
    updatedAt?: Date;
}

const groupSchema = new Schema<GroupDocument>({
    name: { type: String, required: true, trim: true },
    tournament: { type: Schema.Types.ObjectId, ref: 'Tournament', required: true },
}, { timestamps: true, collection: 'Group' });

// Tên bảng không trùng trong cùng một giải
groupSchema.index({ tournament: 1, name: 1 }, { unique: true });

export const GroupModel = mongoose.model<GroupDocument>('Group', groupSchema);
