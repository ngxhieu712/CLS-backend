import { Schema } from 'mongoose';
import { RecordingModel, type RecordingDocument } from './recording.model';

// Bảng Full_trận (con của Bản_ghi), video full up YouTube rồi dán link
export interface FullMatchDocument extends RecordingDocument {
    youtubeLink: string;               // Link_YouTube
    youtubeVideoId?: string;           // Mã_video_YouTube (tự tách từ link)
}

const fullMatchSchema = new Schema<FullMatchDocument>({
    youtubeLink: { type: String, required: true, trim: true },
    youtubeVideoId: { type: String },
});

// Tự tách mã video từ các dạng link: watch?v=, youtu.be/, embed/, shorts/, live/
fullMatchSchema.pre('validate', function () {
    const m = this.youtubeLink?.match(
        /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
    );
    if (m) {
        this.youtubeVideoId = m[1];
    } else {
        this.invalidate('youtubeLink', 'Link YouTube không hợp lệ');
    }
});

export const FullMatchModel = RecordingModel.discriminator<FullMatchDocument>('FullMatch', fullMatchSchema);
