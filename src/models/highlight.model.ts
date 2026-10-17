import { Schema } from 'mongoose';
import { RecordingModel, type RecordingDocument } from './recording.model';

// Bảng Highlight (con của Bản_ghi), video ~2 phút lưu trên Cloudinary
export interface HighlightDocument extends RecordingDocument {
    cloudinaryId: string;              // Mã_Cloudinary (public_id)
    size: number;                      // Dung_lượng (byte)
    duration: number;                  // Thời_lượng (giây)
}

const highlightSchema = new Schema<HighlightDocument>({
    cloudinaryId: { type: String, required: true },
    size: { type: Number, required: true, min: 0 },
    duration: { type: Number, required: true, min: 0 },
});

export const HighlightModel = RecordingModel.discriminator<HighlightDocument>('Highlight', highlightSchema);
