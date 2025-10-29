import express from 'express';
import { getPlayers, createPlayer, updatePlayer, deletePlayer, getReport } from '../controllers/admin.controller.js';

const router = express.Router();

router.get('/players', getPlayers);
router.post('/players', createPlayer);
router.put('/players/:id', updatePlayer);
router.delete('/players/:id', deletePlayer);
router.get('/report/sold-players', getReport);

export default router;