# School Battle Royale 🏫⚔️

A fast-paced multiplayer 3D browser game built with Three.js, Socket.IO, and Express. Battle it out in a dynamic school setting with multiple game modes and progression systems.

## Features

### Gameplay
- **Solo & Duo Modes**: Play alone or team up with a friend
- **3D School Map**: Fully rendered school environment with interactive elements
- **Player Movement**: Smooth WASD controls with sprinting and jumping
- **Combat System**: Fast-paced battles with visual feedback
- **XP System**: Earn experience through various activities
- **Loot System**: Find and collect items throughout the map

### Activities
- **Basketball Challenge**: Score hoops for XP rewards
- **Book Collection**: Collect books for XP
- **Mirror Customization Area**: Personalize your character
- **Quest Board**: Complete objectives for rewards

### Visual Style
- **Neon Dark-Bright Theme**: Eye-catching neon aesthetics
- **Blue/Red Lighting**: Dynamic lighting system
- **Clean HUD**: Minimalist interface design
- **Victory Screen**: Celebratory A+ grade display

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript
- **3D Graphics**: Three.js
- **Backend**: Node.js, Express.js
- **Real-time Communication**: Socket.IO
- **Browser**: Works on all modern browsers (Chrome, Firefox, Safari, Edge)

## Installation

```bash
# Clone the repository
git clone https://github.com/bashanthonisen3/school-battle-royale.git
cd school-battle-royale

# Install dependencies
npm install

# Start the server
npm start

# For development (with auto-reload)
npm run dev
```

## Getting Started

1. Open your browser and navigate to `http://localhost:3000`
2. Choose your game mode (Solo or Duo)
3. Create or join a match
4. Use WASD to move, Space to jump, Shift to sprint
5. Collect items and complete activities
6. Last player/team standing wins!

## Controls

| Key | Action |
|-----|--------|
| W | Move Forward |
| A | Move Left |
| S | Move Backward |
| D | Move Right |
| Space | Jump |
| Shift | Sprint |
| Mouse | Look Around |
| Click | Shoot/Attack |
| E | Interact (Loot, Quests) |

## Game Modes

### Solo Mode
- Battle against up to 50 other players
- Last person standing wins
- Earn solo XP and achievements

### Duo Mode
- Team up with a friend
- Collaborate to eliminate other teams
- Shared XP and rewards

## XP & Progression

- **Movement**: Small XP for exploring
- **Looting**: Medium XP for collecting items
- **Basketball**: Large XP for successful shots
- **Quests**: Bonus XP for completing objectives
- **Victories**: Maximum XP for winning matches

## Project Structure

```
school-battle-royale/
├── client/
│   ├── index.html          # Game canvas & UI
│   ├── style.css           # Neon dark theme styles
│   ├── game.js             # Three.js scene & game logic
│   └── assets/             # Game assets (models, textures)
├── server/
│   ├── server.js           # Express server setup
│   └── multiplayer.js      # Socket.IO game logic
├── package.json            # Dependencies
└── README.md               # This file
```

## Performance Optimization

- **Modular Code**: Separated concerns for maintainability
- **Level of Detail (LOD)**: Dynamic rendering optimization
- **Efficient Networking**: Batched socket updates
- **Asset Optimization**: Compressed textures and models
- **Scalable Architecture**: Ready for horizontal scaling

## Features Coming Soon

- [ ] Power-ups and special abilities
- [ ] Ranked matchmaking
- [ ] Seasonal cosmetics
- [ ] In-game voice chat
- [ ] Mobile app version
- [ ] Console game export

## Contributing

Contributions are welcome! Feel free to open issues and submit pull requests.

## License

MIT License - See LICENSE file for details

## Contact

Created by [@bashanthonisen3](https://github.com/bashanthonisen3)
