import Player from '../models/Player.model.js';
import Team from '../models/Team.model.js';

export const getPlayers = async (req, res) => {
    try {
        const players = await Player.find();
        res.json(players);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch players' });
    }
};

export const createPlayer = async (req, res) => {
    try {
        const { name, position, basePrice } = req.body;
        const player = await Player.create({ name, position, basePrice });
        res.status(201).json(player);
    } catch (error) {
        res.status(500).json({ message: 'Failed to create player' });
    }
};

export const updatePlayer = async (req, res) => {
    try {
        const { id } = req.params;
        const player = await Player.findByIdAndUpdate(id, req.body, { new: true });
        res.json(player);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update player' });
    }
};

export const deletePlayer = async (req, res) => {
    try {
        const { id } = req.params;
        await Player.findByIdAndDelete(id);
        res.json({ message: 'Player deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete player' });
    }
};

export const getReport = async (req, res) => {
    try {
        const soldPlayers = await Player.find({ status: 'sold' })
            .populate('boughtBy')
            .sort({ soldPrice: -1 });

        res.json(soldPlayers);
    } catch (error) {
        res.status(500).json({ message: 'Failed to generate report' });
    }
};