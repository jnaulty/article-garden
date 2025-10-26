# 🚀 Quick Start Guide

**Get the Private Publishing Platform running in 5 minutes!**

---

## Option 1: Docker Compose (Recommended)

### Prerequisites
- Docker Desktop installed
- 10 GB free disk space

### Steps

```bash
# 1. Navigate to project directory
cd /path/to/article-garden

# 2. Start all services
docker-compose up -d

# 3. Check status (wait for services to be healthy)
docker-compose ps

# 4. Open your browser
open http://localhost:5173
```

**That's it!** The frontend is now running with a local Sui network.

### What's Running?

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | React dApp |
| **Sui RPC** | http://localhost:9000 | Local blockchain |
| **Faucet** | http://localhost:9123 | Get test SUI |

### Next Steps

1. **Install Sui Wallet** browser extension
2. **Switch to Localnet** in wallet settings
3. **Get test SUI:**
   ```bash
   curl -X POST http://localhost:9123/gas \
     -H "Content-Type: application/json" \
     -d '{"FixedAmountRequest": {"recipient": "YOUR_WALLET_ADDRESS"}}'
   ```
4. **Deploy contracts:**
   ```bash
   cd move
   sui client publish --gas-budget 500000000
   ```
5. **Update Package ID** in `private-publishing-dapp/src/networkConfig.ts`
6. **Restart frontend:**
   ```bash
   docker-compose restart frontend
   ```

---

## Option 2: Manual Setup

### Prerequisites
- Node.js 18+
- Sui CLI installed

### Steps

```bash
# 1. Install dependencies
cd private-publishing-dapp
npm install

# 2. Start Sui network (in separate terminal)
sui start --with-faucet

# 3. Deploy contracts (in another terminal)
cd move
sui client publish --gas-budget 500000000

# 4. Update networkConfig.ts with Package ID

# 5. Start frontend
cd ../private-publishing-dapp
npm run dev

# 6. Open browser
open http://localhost:5173
```

---

## Common Commands

### Docker

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Restart a service
docker-compose restart frontend

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Development

```bash
# Frontend dev server
cd private-publishing-dapp
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy Move contracts
cd move
sui client publish --gas-budget 500000000

# Run Move tests
sui move test
```

---

## Troubleshooting

### Docker Issues

**Services won't start:**
```bash
docker-compose down -v
docker-compose up -d
```

**Port conflicts:**
Edit `docker-compose.yml` and change ports.

### Can't connect wallet:

1. Install Sui Wallet extension
2. Switch to "Localnet"
3. Get test SUI from faucet
4. Refresh page

### Need Help?

See [SETUP.md](./SETUP.md) for detailed documentation.

---

**Ready to build!** 🎉
