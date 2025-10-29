import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import Team from '../models/Team.model.js';

export const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username }).populate('team');
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
                team: user.team
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};