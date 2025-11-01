import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    username: { type: String },
    position: {
        type: String,
        required: true
    },
    basePrice: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['unsold', 'sold', 'upcoming'],
        default: 'upcoming'
    },
    soldPrice: {
        type: Number
    },
    boughtBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    }
}, {
    timestamps: true
});

export default mongoose.model('Player', playerSchema);