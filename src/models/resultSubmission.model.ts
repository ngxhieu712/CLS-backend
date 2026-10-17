import { Schema, Types } from 'mongoose';
import { MatchLogModel, type MatchLogDocument } from './matchLog.model';

// Tỉ số trận: số ván thắng của mỗi đội
export interface MatchScore {
    teamA: number;
    teamB: number;
}

// Bảng Gửi_kết_quả (con của Nhật_ký) do Trọng tài thực hiện
export interface ResultSubmissionDocument extends MatchLogDocument {
    submittedResult: MatchScore;           // Kết_quả_gửi: tỉ số trọng tài gửi cho admin
    referee: Types.ObjectId;           // Mã_trọng_tài
}

const resultSubmissionSchema = new Schema<ResultSubmissionDocument>({
    submittedResult: {
        teamA: { type: Number, required: true, min: 0 },
        teamB: { type: Number, required: true, min: 0 },
    },
    referee: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});

export const ResultSubmissionModel = MatchLogModel.discriminator<ResultSubmissionDocument>('ResultSubmission', resultSubmissionSchema);
