import { Schema } from 'mongoose';
import Recording, { IRecording } from './recording.model.js';

// Bảng Highlight (con của Bản_ghi), video ~2 phút lưu trên Cloudinary
export interface IHighlight extends IRecording {
    cloudinaryId: string;              // Mã_Cloudinary (public_id)
    size: number;                      // Dung_lượng (byte)
    duration: number;                  // Thời_lượng (giây)
}

const highlightSchema = new Schema<IHighlight>({
    cloudinaryId: { type: String, required: true },
    size: { type: Number, required: true, min: 0 },
    duration: { type: Number, required: true, min: 0 },
});

const Highlight = Recording.discriminator<IHighlight>('Highlight', highlightSchema);

export default Highlight;
