import { Schema, Types } from 'mongoose';
import MatchLog, { IMatchLog } from './matchLog.model.js';

// Tỉ số trận: số ván thắng của mỗi đội
export interface IScore {
    teamA: number;
    teamB: number;
}

// Bảng Gửi_kết_quả (con của Nhật_ký) do Trọng tài thực hiện
export interface IResultSubmission extends IMatchLog {
    submittedResult: IScore;           // Kết_quả_gửi: tỉ số trọng tài gửi cho admin
    referee: Types.ObjectId;           // Mã_trọng_tài
}

const resultSubmissionSchema = new Schema<IResultSubmission>({
    submittedResult: {
        teamA: { type: Number, required: true, min: 0 },
        teamB: { type: Number, required: true, min: 0 },
    },
    referee: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});

const ResultSubmission = MatchLog.discriminator<IResultSubmission>('ResultSubmission', resultSubmissionSchema);

export default ResultSubmission;
