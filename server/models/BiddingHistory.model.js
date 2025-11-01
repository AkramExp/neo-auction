import mongoose from 'mongoose';

const biddingHistorySchema = new mongoose.Schema({
    playerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player'
    },
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    amount: Number,
    status: {
        type: String,
        enum: ['unsold', 'sold', 'ongoing'],
        default: 'ongoing'
    }
}, { timestamps: true });

export default mongoose.model('BiddingHistory', biddingHistorySchema);