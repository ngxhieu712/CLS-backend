import { Schema } from 'mongoose';
import Recording, { IRecording } from './recording.model.js';

// Bảng Full_trận (con của Bản_ghi), video full up YouTube rồi dán link
export interface IFullMatch extends IRecording {
    youtubeLink: string;               // Link_YouTube
    youtubeVideoId?: string;           // Mã_video_YouTube (tự tách từ link)
}

const fullMatchSchema = new Schema<IFullMatch>({
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

const FullMatch = Recording.discriminator<IFullMatch>('FullMatch', fullMatchSchema);

export default FullMatch;
