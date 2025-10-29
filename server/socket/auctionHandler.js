import AuctionState from '../models/AuctionState.model.js';
import Player from '../models/Player.model.js';
import Team from '../models/Team.model.js';

const auctionHandler = (io) => {
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        // Join global auction room
        socket.join('auctionRoom');

        // Send current state to newly connected user
        socket.on('auction:getState', async () => {
            try {
                console.log('Received auction:getState from:', socket.id);

                // Get auction state and populate manually
                let auctionState = await AuctionState.getSingleton();

                // Populate the auction state manually
                if (auctionState.currentPlayer) {
                    auctionState = await AuctionState.findById(auctionState._id)
                        .populate('currentPlayer')
                        .populate('highBidder')
                        .populate('passedTeams');
                }

                const teams = await Team.find().populate('owner');
                const players = await Player.find();

                const stateData = {
                    auctionState,
                    teams,
                    players
                };

                console.log('Sending auction:state to:', socket.id);
                socket.emit('auction:state', stateData);
            } catch (error) {
                console.error('Error fetching auction state:', error);
                socket.emit('auction:error', 'Failed to fetch auction state: ' + error.message);
            }
        });

        // Admin Events
        socket.on('admin:sendToBlock', async (data) => {
            try {
                const { playerId } = data;
                let auctionState = await AuctionState.getSingleton();

                const player = await Player.findById(playerId);
                if (!player) {
                    socket.emit('auction:error', 'Player not found');
                    return;
                }

                // Reset auction state for new player
                auctionState.currentPlayer = playerId;
                auctionState.currentBid = player.basePrice;
                auctionState.highBidder = null;
                auctionState.passedTeams = [];
                auctionState.bidHistory = []; // Clear bid history for new player
                auctionState.status = 'running';
                // Removed timerEndTime setting

                await auctionState.save();

                // Populate before sending
                auctionState = await AuctionState.findById(auctionState._id)
                    .populate('currentPlayer')
                    .populate('highBidder')
                    .populate('passedTeams');

                io.to('auctionRoom').emit('auction:newPlayer', auctionState);
            } catch (error) {
                console.error('Error sending player to block:', error);
                socket.emit('auction:error', 'Failed to send player to block: ' + error.message);
            }
        });

        socket.on('admin:finalizeBid', async () => {
            try {
                let auctionState = await AuctionState.getSingleton();

                if (!auctionState.currentPlayer || !auctionState.highBidder) {
                    socket.emit('auction:error', 'No active bid to finalize');
                    return;
                }

                // Populate to get player and team details
                auctionState = await AuctionState.findById(auctionState._id)
                    .populate('currentPlayer')
                    .populate('highBidder');

                const team = await Team.findById(auctionState.highBidder._id);
                const player = await Player.findById(auctionState.currentPlayer._id);

                // Update player status
                player.status = 'sold';
                player.soldPrice = auctionState.currentBid;
                player.boughtBy = auctionState.highBidder._id;
                await player.save();

                // Update team
                team.budget -= auctionState.currentBid;
                team.players.push(player._id);
                await team.save();

                // Store last action before clearing auction state
                auctionState.lastAction = {
                    type: 'sold',
                    playerId: player._id,
                    teamId: team._id,
                    amount: auctionState.currentBid,
                    timestamp: new Date()
                };

                // Clear auction block
                auctionState.currentPlayer = null;
                auctionState.currentBid = 0;
                auctionState.highBidder = null;
                auctionState.passedTeams = [];
                await auctionState.save();

                const updatedTeams = await Team.find().populate('owner');
                const updatedPlayers = await Player.find();

                io.to('auctionRoom').emit('auction:playerSold', {
                    player,
                    team,
                    soldPrice: auctionState.currentBid,
                    teams: updatedTeams,
                    players: updatedPlayers,
                    lastAction: auctionState.lastAction
                });
            } catch (error) {
                console.error('Error finalizing bid:', error);
                socket.emit('auction:error', 'Failed to finalize bid: ' + error.message);
            }
        });

        socket.on('admin:markUnsold', async () => {
            try {
                let auctionState = await AuctionState.getSingleton();

                if (!auctionState.currentPlayer) {
                    socket.emit('auction:error', 'No active player');
                    return;
                }

                // Server-side validation: Don't allow marking as unsold if there are bids
                if (auctionState.highBidder || (auctionState.bidHistory && auctionState.bidHistory.length > 0)) {
                    socket.emit('auction:error', 'Cannot mark player as unsold when there are active bids. Use finalize bid instead.');
                    return;
                }

                // Populate to get player details
                auctionState = await AuctionState.findById(auctionState._id)
                    .populate('currentPlayer');

                const player = await Player.findById(auctionState.currentPlayer._id);
                player.status = 'unsold';
                await player.save();

                // Store last action before clearing auction state
                auctionState.lastAction = {
                    type: 'unsold',
                    playerId: player._id,
                    timestamp: new Date()
                };

                // Clear auction block
                auctionState.currentPlayer = null;
                auctionState.currentBid = 0;
                auctionState.highBidder = null;
                auctionState.passedTeams = [];
                await auctionState.save();

                const updatedPlayers = await Player.find();

                io.to('auctionRoom').emit('auction:playerUnsold', {
                    player,
                    players: updatedPlayers,
                    lastAction: auctionState.lastAction
                });
            } catch (error) {
                console.error('Error marking player as unsold:', error);
                socket.emit('auction:error', 'Failed to mark player as unsold: ' + error.message);
            }
        });

        // Remove admin:pauseToggle event completely

        socket.on('user:placeBid', async (data) => {
            try {
                const { amount, teamId } = data;
                let auctionState = await AuctionState.getSingleton();

                if (auctionState.status !== 'running') {
                    socket.emit('auction:error', 'Auction is not running');
                    return;
                }

                const team = await Team.findById(teamId);
                if (!team) {
                    socket.emit('auction:error', 'Team not found');
                    return;
                }

                // Get current player to access base price
                const currentPlayer = await Player.findById(auctionState.currentPlayer);
                if (!currentPlayer) {
                    socket.emit('auction:error', 'Current player not found');
                    return;
                }

                // Special validation for first bid: allow bidding at base price
                const isFirstBid = auctionState.currentBid === currentPlayer.basePrice && auctionState.highBidder === null;

                // Validations
                if (!isFirstBid && amount <= auctionState.currentBid) {
                    socket.emit('auction:error', 'Bid must be higher than current bid');
                    return;
                }

                // For first bid, amount must be exactly base price
                if (isFirstBid && amount !== currentPlayer.basePrice) {
                    socket.emit('auction:error', `First bid must be exactly at base price: $${currentPlayer.basePrice.toLocaleString()}`);
                    return;
                }

                if (team.budget < amount) {
                    socket.emit('auction:error', 'Not enough budget');
                    return;
                }

                if (team.players.length >= 8) {
                    socket.emit('auction:error', 'Maximum player limit reached');
                    return;
                }

                // Check if team has passed - handle both populated and non-populated cases
                const hasPassed = auctionState.passedTeams.some(passedTeam =>
                    passedTeam._id ? passedTeam._id.toString() === teamId : passedTeam.toString() === teamId
                );

                if (hasPassed) {
                    socket.emit('auction:error', 'Your team has passed on this player and cannot bid');
                    return;
                }

                // Update auction state
                auctionState.currentBid = amount;
                auctionState.highBidder = teamId;

                // Add to bid history
                auctionState.bidHistory.push({
                    team: teamId,
                    amount,
                    timestamp: new Date()
                });

                await auctionState.save();

                // Populate before sending
                auctionState = await AuctionState.findById(auctionState._id)
                    .populate('currentPlayer')
                    .populate('highBidder')
                    .populate('passedTeams');

                io.to('auctionRoom').emit('auction:bidUpdate', auctionState);
            } catch (error) {
                console.error('Error placing bid:', error);
                socket.emit('auction:error', 'Failed to place bid: ' + error.message);
            }
        });

        socket.on('user:pass', async (teamId) => {
            try {
                const auctionState = await AuctionState.getSingleton();

                if (!auctionState.passedTeams.includes(teamId)) {
                    auctionState.passedTeams.push(teamId);
                    await auctionState.save();
                }

                // Populate before sending to get team details
                const populatedState = await AuctionState.findById(auctionState._id)
                    .populate('passedTeams')
                    .populate('currentPlayer')
                    .populate('highBidder');

                // Broadcast to ALL users in the auction room
                io.to('auctionRoom').emit('auction:passUpdate', populatedState);

                console.log(`Team ${teamId} passed on current player`);
            } catch (error) {
                console.error('Error passing:', error);
                socket.emit('auction:error', 'Failed to pass: ' + error.message);
            }
        });

        // Simple relist - just change status from unsold to upcoming
        socket.on('admin:relistPlayer', async (data) => {
            try {
                const { playerId } = data;
                const player = await Player.findById(playerId);

                if (!player) {
                    socket.emit('auction:error', 'Player not found');
                    return;
                }

                if (player.status !== 'unsold') {
                    socket.emit('auction:error', 'Player is not unsold');
                    return;
                }

                // Simply change status from unsold to upcoming
                player.status = 'upcoming';
                await player.save();

                const updatedPlayers = await Player.find();

                io.to('auctionRoom').emit('auction:playerRelisted', {
                    player,
                    players: updatedPlayers
                });

                console.log(`Relisted player: ${player.name} - Status changed to upcoming`);
            } catch (error) {
                console.error('Error relisting player:', error);
                socket.emit('auction:error', 'Failed to relist player: ' + error.message);
            }
        });

        socket.on('admin:createPlayer', async (data) => {
            try {
                const { name, position, basePrice } = data;
                const player = await Player.create({ name, position, basePrice, status: 'upcoming' });

                const updatedPlayers = await Player.find();

                io.to('auctionRoom').emit('auction:playerCreated', {
                    player,
                    players: updatedPlayers
                });

                console.log(`Created player: ${name}`);
            } catch (error) {
                console.error('Error creating player:', error);
                socket.emit('auction:error', 'Failed to create player: ' + error.message);
            }
        });

        socket.on('admin:updatePlayer', async (data) => {
            try {
                const { playerId, name, position, basePrice } = data;
                const player = await Player.findByIdAndUpdate(
                    playerId,
                    { name, position, basePrice },
                    { new: true }
                );

                if (!player) {
                    socket.emit('auction:error', 'Player not found');
                    return;
                }

                const updatedPlayers = await Player.find();

                io.to('auctionRoom').emit('auction:playerUpdated', {
                    player,
                    players: updatedPlayers
                });

                console.log(`Updated player: ${name}`);
            } catch (error) {
                console.error('Error updating player:', error);
                socket.emit('auction:error', 'Failed to update player: ' + error.message);
            }
        });

        socket.on('admin:deletePlayer', async (data) => {
            try {
                const { playerId } = data;
                const player = await Player.findById(playerId);

                if (!player) {
                    socket.emit('auction:error', 'Player not found');
                    return;
                }

                if (player.status === 'sold') {
                    socket.emit('auction:error', 'Cannot delete a sold player');
                    return;
                }

                await Player.findByIdAndDelete(playerId);

                const updatedPlayers = await Player.find();

                io.to('auctionRoom').emit('auction:playerDeleted', {
                    playerId,
                    players: updatedPlayers
                });

                console.log(`Deleted player: ${player.name}`);
            } catch (error) {
                console.error('Error deleting player:', error);
                socket.emit('auction:error', 'Failed to delete player: ' + error.message);
            }
        });

        // Team Management Events
        socket.on('admin:createTeam', async (data) => {
            try {
                const { name, budget } = data;

                // Create owner user
                const ownerPassword = await bcrypt.hash('password123', 12);
                const ownerUsername = `owner_${name.toLowerCase().replace(/\s+/g, '')}`;

                const ownerUser = await User.create({
                    username: ownerUsername,
                    password: ownerPassword,
                    role: 'owner'
                });

                // Create team
                const team = await Team.create({
                    name,
                    budget,
                    owner: ownerUser._id
                });

                // Update user with team reference
                ownerUser.team = team._id;
                await ownerUser.save();

                const updatedTeams = await Team.find().populate('owner');

                io.to('auctionRoom').emit('auction:teamCreated', {
                    team,
                    teams: updatedTeams
                });

                console.log(`Created team: ${name} with owner: ${ownerUsername}`);
            } catch (error) {
                console.error('Error creating team:', error);
                socket.emit('auction:error', 'Failed to create team: ' + error.message);
            }
        });

        socket.on('admin:updateTeam', async (data) => {
            try {
                const { teamId, name, budget } = data;
                const team = await Team.findByIdAndUpdate(
                    teamId,
                    { name, budget },
                    { new: true }
                ).populate('owner');

                if (!team) {
                    socket.emit('auction:error', 'Team not found');
                    return;
                }

                const updatedTeams = await Team.find().populate('owner');

                io.to('auctionRoom').emit('auction:teamUpdated', {
                    team,
                    teams: updatedTeams
                });

                console.log(`Updated team: ${name}`);
            } catch (error) {
                console.error('Error updating team:', error);
                socket.emit('auction:error', 'Failed to update team: ' + error.message);
            }
        });

        socket.on('admin:deleteTeam', async (data) => {
            try {
                const { teamId } = data;
                const team = await Team.findById(teamId).populate('owner');

                if (!team) {
                    socket.emit('auction:error', 'Team not found');
                    return;
                }

                // Delete the owner user
                await User.findByIdAndDelete(team.owner._id);

                // Delete the team
                await Team.findByIdAndDelete(teamId);

                const updatedTeams = await Team.find().populate('owner');

                io.to('auctionRoom').emit('auction:teamDeleted', {
                    teamId,
                    teams: updatedTeams
                });

                console.log(`Deleted team: ${team.name}`);
            } catch (error) {
                console.error('Error deleting team:', error);
                socket.emit('auction:error', 'Failed to delete team: ' + error.message);
            }
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });
};

export default auctionHandler;