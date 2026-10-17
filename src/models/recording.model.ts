import mongoose, { Schema, Types } from 'mongoose';

export const RECORDING_STATUSES = ['draft', 'published', 'hidden'] as const;
export type RecordingStatus = (typeof RECORDING_STATUSES)[number];

// Bảng Bản_ghi (cha). Hai loại con dùng discriminator, chung 1 collection:
//   highlight.model.ts (Highlight), fullMatch.model.ts (Full_trận)
export interface RecordingDocument extends mongoose.Document {
    status: RecordingStatus;           // Trạng_thái
    postedAt: Date | null;             // Ngày_đăng
    // Mã_trận và Mã_biên_tập_viên có ở cả 2 bảng con nên đặt ở cha
    match: Types.ObjectId;             // Mã_trận
    editor: Types.ObjectId;            // Mã_biên_tập_viên
    kind?: 'Highlight' | 'FullMatch';  // trường phân loại do Mongoose tự gán
    createdAt?: Date;
    updatedAt?: Date;
}

const recordingSchema = new Schema<RecordingDocument>({
    status: { type: String, enum: [...RECORDING_STATUSES], default: 'draft' },
    postedAt: { type: Date, default: null },
    match: { type: Schema.Types.ObjectId, ref: 'Match', required: true },
    editor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true, discriminatorKey: 'kind', collection: 'Recording' });

// Mỗi trận tối đa 1 highlight + 1 full (mỗi loại 1 bản ghi)
recordingSchema.index({ match: 1, kind: 1 }, { unique: true });

export const RecordingModel = mongoose.model<RecordingDocument>('Recording', recordingSchema);
