import mongoose, { Schema, Types } from 'mongoose';

// Bảng Nhật_ký (cha). Hai loại con dùng discriminator, chung 1 collection:
//   resultSubmission.model.ts (Gửi_kết_quả), resultReview.model.ts (Duyệt_kết_quả)
export interface IMatchLog {
    occurredAt: Date;                  // Thời_điểm
    match: Types.ObjectId;             // Mã_trận
    kind?: 'ResultSubmission' | 'ResultReview'; // trường phân loại do Mongoose tự gán
    createdAt?: Date;
    updatedAt?: Date;
}

const matchLogSchema = new Schema<IMatchLog>({
    occurredAt: { type: Date, default: Date.now },
    match: { type: Schema.Types.ObjectId, ref: 'Match', required: true },
}, { timestamps: true, discriminatorKey: 'kind', collection: 'MatchLog' });

matchLogSchema.index({ match: 1, occurredAt: -1 });

const MatchLog = mongoose.model<IMatchLog>('MatchLog', matchLogSchema);

export default MatchLog;
