import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import systemRoutes from './routes/system';
import statsRoutes from './routes/stats';
import adminRoutes from './routes/admin';
import storyRoutes from './routes/story';
import inventoryRoutes from './routes/inventory';
import shopRoutes from './routes/shop';
import raidRoutes from './routes/raid';
import bossRoutes from './routes/bosses';
import leaderboardRoutes from './routes/leaderboards';
import abilityRoutes from './routes/abilities';
import storyAbilityRoutes from './routes/storyAbilities';
import storyItemRoutes from './routes/storyItems';
import checkpointRoutes from './routes/checkpoints';
import mainStoryRoutes from './routes/mainStory';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/users', statsRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/story', storyRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/raid', raidRoutes);
app.use('/api/bosses', bossRoutes);
app.use('/api/leaderboards', leaderboardRoutes);
app.use('/api/abilities', abilityRoutes);
app.use('/api/story-abilities', storyAbilityRoutes);
app.use('/api/story-items', storyItemRoutes);
app.use('/api/checkpoints', checkpointRoutes);
app.use('/api/main-story', mainStoryRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
