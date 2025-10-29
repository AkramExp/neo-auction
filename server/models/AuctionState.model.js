import mongoose from 'mongoose';

const auctionStateSchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ['pending', 'running', 'completed'],
        default: 'pending'
    },
    currentPlayer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player'
    },
    currentBid: {
        type: Number,
        default: 0
    },
    highBidder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    bidHistory: [{
        team: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Team'
        },
        amount: Number,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    passedTeams: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    }],
    // Add lastAction field to track recent results
    lastAction: {
        type: {
            type: String,
            enum: ['sold', 'unsold']
        },
        playerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Player'
        },
        teamId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Team'
        },
        amount: Number,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }
});

// Ensure only one document exists
auctionStateSchema.statics.getSingleton = async function () {
    let state = await this.findOne();
    if (!state) {
        state = await this.create({});
    }
    return state;
};

export default mongoose.model('AuctionState', auctionStateSchema);