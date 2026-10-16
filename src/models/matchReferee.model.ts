import mongoose, { Schema, Types } from 'mongoose';

export const REFEREE_ROLES = ['main', 'assistant'] as const;
export type RefereeRole = (typeof REFEREE_ROLES)[number];

// Bảng Phân_công_trọng_tài (quan hệ N:M giữa Trọng tài và Trận, khóa ghép: match + referee)
export interface IMatchReferee {
    referee: Types.ObjectId;           // Mã_trọng_tài
    match: Types.ObjectId;             // Mã_trận
    role: RefereeRole;                 // Vai_trò_trong_trận
    createdAt?: Date;
    updatedAt?: Date;
}

const matchRefereeSchema = new Schema<IMatchReferee>({
    referee: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    match: { type: Schema.Types.ObjectId, ref: 'Match', required: true },
    role: { type: String, enum: [...REFEREE_ROLES], default: 'assistant' },
}, { timestamps: true, collection: 'MatchReferee' });

// Một trọng tài chỉ được phân công 1 lần cho mỗi trận
matchRefereeSchema.index({ match: 1, referee: 1 }, { unique: true });
// Mỗi trận có tối đa 1 trọng tài chính
matchRefereeSchema.index({ match: 1 }, { unique: true, partialFilterExpression: { role: 'main' } });
// Tra "trọng tài này phụ trách trận nào"
matchRefereeSchema.index({ referee: 1 });

const MatchReferee = mongoose.model<IMatchReferee>('MatchReferee', matchRefereeSchema);

export default MatchReferee;
