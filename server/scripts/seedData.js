import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.model.js';
import Team from '../models/Team.model.js';
import Player from '../models/Player.model.js';
import AuctionState from '../models/AuctionState.model.js'
dotenv.config();

const initializeAuctionState = async () => {
    let auctionState = await AuctionState.findOne();

    if (!auctionState) {
        auctionState = await AuctionState.create({
            status: 'pending',
            currentBid: 0,
            bidHistory: [],
            passedTeams: []
        });
        console.log('Created initial auction state');
    } else {
        console.log('Auction state already exists');
    }
};

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Clear existing data
        await User.deleteMany({});
        await Team.deleteMany({});
        await Player.deleteMany({});

        // Create admin user
        const adminPassword = await bcrypt.hash('admin123', 12);
        const adminUser = await User.create({
            username: 'admin',
            password: adminPassword,
            role: 'admin'
        });

        // Create teams and owners
        const teamsData = [
            { name: 'Team Alpha', owner: 'owner1' },
            { name: 'Team Beta', owner: 'owner2' },
            { name: 'Team Gamma', owner: 'owner3' },
            { name: 'Team Delta', owner: 'owner4' },
            { name: 'Team Epsilon', owner: 'owner5' },
            { name: 'Team Zeta', owner: 'owner6' }
        ];

        const createdTeams = [];

        for (const teamData of teamsData) {
            const ownerPassword = await bcrypt.hash('owner123', 12);
            const ownerUser = await User.create({
                username: teamData.owner,
                password: ownerPassword,
                role: 'owner'
            });

            const team = await Team.create({
                name: teamData.name,
                owner: ownerUser._id,
                budget: 3000000
            });

            ownerUser.team = team._id;
            await ownerUser.save();

            createdTeams.push(team);
        }

        // Create players
        const playersData = [
            { name: 'John Smith', position: 'QB', basePrice: 2000000 },
            { name: 'Mike Johnson', position: 'RB', basePrice: 250000 },
            { name: 'Chris Davis', position: 'WR', basePrice: 200000 },
            { name: 'David Wilson', position: 'TE', basePrice: 250000 },
            { name: 'James Brown', position: 'OL', basePrice: 200000 },
            { name: 'Robert Taylor', position: 'DL', basePrice: 200000 },
            { name: 'Michael Clark', position: 'LB', basePrice: 250000 },
            { name: 'Daniel White', position: 'DB', basePrice: 300000 },
            { name: 'Paul Anderson', position: 'QB', basePrice: 450000 },
            { name: 'Kevin Martin', position: 'RB', basePrice: 100000 }
        ];

        await Player.insertMany(playersData);

        console.log('Database seeded successfully!');
        console.log('Admin login: admin / admin123');
        console.log('Team owner logins: owner1-owner6 / owner123');

        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

initializeAuctionState();
seedData();