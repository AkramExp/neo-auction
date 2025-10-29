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
                budget: 25000
            });

            ownerUser.team = team._id;
            await ownerUser.save();

            createdTeams.push(team);
        }

        // Create players
        const playersData = [
            { name: 'Aarav Patel', position: 'QB', basePrice: 1500 },
            { name: 'Rohan Mehta', position: 'RB', basePrice: 500 },
            { name: 'Vikram Singh', position: 'WR', basePrice: 2000 },
            { name: 'Karan Sharma', position: 'TE', basePrice: 1000 },
            { name: 'Dev Malhotra', position: 'OL', basePrice: 1500 },
            { name: 'Amit Kumar', position: 'DL', basePrice: 1000 },
            { name: 'Nikhil Bansal', position: 'LB', basePrice: 500 },
            { name: 'Arjun Nair', position: 'DB', basePrice: 1500 },
            { name: 'Manav Joshi', position: 'QB', basePrice: 2000 },
            { name: 'Sahil Khanna', position: 'RB', basePrice: 1000 },
            { name: 'Tushar Kapoor', position: 'WR', basePrice: 500 },
            { name: 'Rahul Verma', position: 'TE', basePrice: 2000 },
            { name: 'Ankit Sinha', position: 'OL', basePrice: 1500 },
            { name: 'Ritesh Iyer', position: 'DL', basePrice: 1000 },
            { name: 'Neel Raj', position: 'LB', basePrice: 2000 },
            { name: 'Ishan Gupta', position: 'DB', basePrice: 500 },
            { name: 'Yash Tiwari', position: 'QB', basePrice: 1500 },
            { name: 'Ravi Chawla', position: 'RB', basePrice: 2000 },
            { name: 'Sameer Desai', position: 'WR', basePrice: 1000 },
            { name: 'Pranav Reddy', position: 'TE', basePrice: 500 },
            { name: 'Kunal Jain', position: 'OL', basePrice: 1500 },
            { name: 'Harsh Goel', position: 'DL', basePrice: 2000 },
            { name: 'Mitesh Agarwal', position: 'LB', basePrice: 1000 },
            { name: 'Aditya Rao', position: 'DB', basePrice: 1500 },
            { name: 'Rajeev Menon', position: 'QB', basePrice: 2000 },
            { name: 'Tanmay Dutta', position: 'RB', basePrice: 1000 },
            { name: 'Deepak Pillai', position: 'WR', basePrice: 500 },
            { name: 'Sandeep Ghosh', position: 'TE', basePrice: 1500 },
            { name: 'Mohit Das', position: 'OL', basePrice: 2000 },
            { name: 'Parth Sharma', position: 'DL', basePrice: 500 }
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