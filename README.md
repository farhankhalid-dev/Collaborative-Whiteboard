# Simple LAN Whiteboard

A real-time collaborative whiteboard with just pencil, eraser, and cursor tracking with usernames. Perfect for LAN environments.

## Features

- ✏️ **Pencil tool** - Draw with black lines
- 🧹 **Eraser tool** - Erase drawings
- 👥 **Real-time cursors** - See other users' cursors with their usernames
- 🔄 **Real-time sync** - All drawing actions sync instantly
- 🌐 **Public room** - Everyone joins the same whiteboard
- 📱 **Mobile friendly** - Works on tablets and phones
- 🚀 **No installation** - Just open in browser

## Quick Setup

### Method 1: Node.js (Recommended)

1. **Download the project:**
   ```bash
   git clone [repository-url]
   cd simple-lan-whiteboard
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

4. **Access the whiteboard:**
   - Server: `http://localhost:3000`
   - LAN devices: `http://[YOUR_IP]:3000`

### Method 2: Quick Download & Run

1. Create a new folder for your project
2. Create these files in the folder:
   - `server.js` (copy from Server artifact)
   - `package.json` (copy from Package artifact)
   - Create `public/` folder
   - `public/index.html` (copy from Client artifact)

3. Run:
   ```bash
   npm install
   npm start
   ```

## File Structure

```
simple-lan-whiteboard/
├── server.js          # Node.js server with Socket.io
├── package.json       # Dependencies
└── public/
    └── index.html     # Client-side application
```

## How to Use

1. **Start the server** on one computer in your LAN
2. **Find your IP address:**
   - Windows: `ipconfig`
   - Mac/Linux: `ifconfig` or `ip addr`
3. **Share the URL** `http://[YOUR_IP]:3000` with others on the LAN
4. **Enter username** and start drawing!

## Controls

- **Left click + drag** - Draw with pencil
- **Select eraser** - Switch to eraser mode
- **Clear All button** - Clear the entire board (affects all users)
- **Username field** - Change your display name

## Technical Details

- **Backend:** Node.js + Express + Socket.io
- **Frontend:** Pure HTML5 Canvas + JavaScript
- **Real-time:** WebSocket connections
- **No database** - Everything in memory (resets on server restart)

## Network Requirements

- All devices must be on the same LAN/WiFi network
- Server device needs Node.js installed
- Client devices just need a modern web browser

## Customization

The code is simple and well-commented. You can easily modify:

- **Colors:** Change `strokeStyle` in the drawing functions
- **Line width:** Modify `lineWidth` and `eraserWidth` variables
- **UI:** Edit the CSS in `index.html`
- **Port:** Change `PORT` in `server.js`

## Troubleshooting

- **Can't connect from other devices:** Check firewall settings
- **Port already in use:** Change the PORT in server.js
- **Drawing lag:** Reduce the emit frequency in cursor-move event
- **Mobile touch issues:** The touch events are already handled

## License

MIT License - Feel free to modify and use!