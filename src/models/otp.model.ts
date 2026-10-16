import mongoose, { Schema, Model } from 'mongoose';
import crypto from 'crypto';

export const OTP_PURPOSES = ['register', 'resetPassword'] as const;
export type OtpPurpose = (typeof OTP_PURPOSES)[number];

export const OTP_TTL_MS = 5 * 60 * 1000;      // hết hạn sau 5 phút
export const OTP_RESEND_MS = 60 * 1000;       // gửi lại cách nhau tối thiểu 60 giây
export const OTP_MAX_ATTEMPTS = 5;            // sai tối đa 5 lần

// Thông tin đội nộp cùng lúc đăng ký; sau khi OTP đúng sẽ tạo Team ở trạng thái chờ duyệt
export interface IOtpTeamInfo {
    name?: string;
    tag?: string;
    logo?: string;
    description?: string;
    organization?: string;
    contactEmail?: string;
    contactPhone?: string;
}

// Mã OTP gửi qua Gmail, dùng cho đăng ký (xác thực email) và quên mật khẩu.
// Mỗi (email, purpose) chỉ có 1 bản ghi: gửi mã mới thì ghi đè, mã cũ mất hiệu lực.
export interface IOtp {
    email: string;
    purpose: OtpPurpose;
    codeHash: string;                  // mã OTP đã băm, không lưu chữ thường
    fullName?: string;                 // dữ liệu đăng ký tạm (purpose = 'register')
    passwordHash?: string;             // mật khẩu đã băm bcrypt
    teamInfo?: IOtpTeamInfo;
    attempts: number;                  // số lần nhập sai (service hủy mã khi >= OTP_MAX_ATTEMPTS)
    lastSentAt: Date;                  // để chặn gửi lại trong 60 giây
    expiresAt: Date;                   // MongoDB tự xóa khi hết hạn (TTL index)
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IOtpMethods {
    matches(code: string): boolean;
}

export interface OtpModel extends Model<IOtp, {}, IOtpMethods> {
    generateCode(): string;
    hashCode(email: string, code: string): string;
}

// Băm mã (HMAC với khóa bí mật OTP_SECRET trong .env, gắn với email để mã không dùng chéo)
function hashOtpCode(email: string, code: string): string {
    const secret = process.env.OTP_SECRET || 'dev-only-secret';
    return crypto.createHmac('sha256', secret).update(`${email.toLowerCase()}:${code}`).digest('hex');
}

const otpSchema = new Schema<IOtp, OtpModel, IOtpMethods>({
    email: { type: String, required: true, lowercase: true, trim: true },
    purpose: { type: String, enum: [...OTP_PURPOSES], required: true },
    codeHash: { type: String, required: true },
    fullName: { type: String, trim: true },
    passwordHash: { type: String },
    teamInfo: {
        name: { type: String, trim: true },
        tag: { type: String, trim: true },
        logo: { type: String },
        description: { type: String },
        organization: { type: String },
        contactEmail: { type: String, lowercase: true, trim: true },
        contactPhone: { type: String, trim: true },
    },
    attempts: { type: Number, default: 0 },
    lastSentAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
}, { timestamps: true, collection: 'Otp' });

// Đăng ký bắt buộc đủ thông tin tài khoản và thông tin đội tối thiểu
otpSchema.pre('validate', function () {
    if (this.purpose !== 'register') return;
    const required: [string, unknown][] = [
        ['fullName', this.fullName],
        ['passwordHash', this.passwordHash],
        ['teamInfo.name', this.teamInfo?.name],
        ['teamInfo.tag', this.teamInfo?.tag],
        ['teamInfo.contactEmail', this.teamInfo?.contactEmail],
        ['teamInfo.contactPhone', this.teamInfo?.contactPhone],
    ];
    for (const [path, value] of required) {
        if (!value) this.invalidate(path, `${path} là bắt buộc khi đăng ký`);
    }
});

otpSchema.index({ email: 1, purpose: 1 }, { unique: true });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Sinh mã 6 chữ số bằng nguồn ngẫu nhiên an toàn
otpSchema.static('generateCode', function (): string {
    return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
});

otpSchema.static('hashCode', hashOtpCode);

// So sánh mã người dùng nhập với mã đã băm (chống timing attack)
otpSchema.method('matches', function (code: string): boolean {
    const expected = Buffer.from(this.codeHash, 'hex');
    const actual = Buffer.from(hashOtpCode(this.email, String(code)), 'hex');
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
});

const Otp = mongoose.model<IOtp, OtpModel>('Otp', otpSchema);

export default Otp;
