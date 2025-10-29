import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    budget: {
        type: Number,
        default: 3000000
    },
    players: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player'
    }]
});

export default mongoose.model('Team', teamSchema);