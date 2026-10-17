import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export const USER_ROLES = ['admin', 'teamManager', 'referee', 'editor'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ['pending', 'active', 'locked', 'rejected'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

// Bảng Tài_khoản
export interface UserDocument extends mongoose.Document {
    fullName: string;                  // Họ_tên
    email: string;                     // Email_đăng_nhập
    password?: string;                 // Mật_khẩu (băm); tài khoản Google có thể chưa có
    googleId?: string;                 // "sub" của Google
    status: UserStatus;                // Trạng_thái
    role: UserRole;                    // Vai_trò
    createdAt?: Date;
    updatedAt?: Date;
    comparePassword(plainPassword: string): Promise<boolean>;
}

/** Trường không bao giờ được rời server. Bị loại khỏi mọi phản hồi JSON. */
export const PRIVATE_USER_FIELDS = ['password', '__v'] as const;

const userSchema = new Schema<UserDocument>({
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Mật khẩu chỉ bắt buộc khi tài khoản chưa có googleId
    password: { type: String, select: false, required: function (this: UserDocument) { return !this.googleId; } },
    googleId: { type: String, unique: true, sparse: true },
    // pending = chờ admin duyệt, rejected = bị từ chối (đăng nhập được nhưng chỉ vào trang hồ sơ đội
    // để xem trạng thái / sửa và nộp lại); locked = bị khóa, không đăng nhập được
    status: { type: String, enum: [...USER_STATUSES], default: 'active' },
    role: { type: String, enum: [...USER_ROLES], required: true },
}, {
    timestamps: true,
    collection: 'User',
    toJSON: {
        transform: (_doc, ret: Record<string, unknown>) => {
            for (const field of PRIVATE_USER_FIELDS) delete ret[field];
            return ret;
        },
    },
});

// Băm mật khẩu mỗi khi mật khẩu được tạo/đổi.
// Khi đăng ký qua OTP, mật khẩu đã được băm sẵn trong Otp.passwordHash:
// gán user.$locals.passwordHashed = true trước khi save để không băm lần hai.
userSchema.pre('save', async function () {
    if (!this.isModified('password') || this.$locals.passwordHashed) return;
    this.password = await bcrypt.hash(this.password as string, 10);
});

// Dùng khi đăng nhập: User.findOne({ email }).select('+password')
userSchema.methods.comparePassword = function (plainPassword: string): Promise<boolean> {
    if (!this.password) return Promise.resolve(false); // chưa có mật khẩu (tài khoản Google) hoặc chưa select
    return bcrypt.compare(plainPassword, this.password);
};

export const UserModel = mongoose.model<UserDocument>('User', userSchema);
