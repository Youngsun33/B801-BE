"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const system_1 = __importDefault(require("./routes/system"));
const stats_1 = __importDefault(require("./routes/stats"));
const admin_1 = __importDefault(require("./routes/admin"));
const story_1 = __importDefault(require("./routes/story"));
const inventory_1 = __importDefault(require("./routes/inventory"));
const shop_1 = __importDefault(require("./routes/shop"));
const raid_1 = __importDefault(require("./routes/raid"));
const bosses_1 = __importDefault(require("./routes/bosses"));
const leaderboards_1 = __importDefault(require("./routes/leaderboards"));
const abilities_1 = __importDefault(require("./routes/abilities"));
const storyAbilities_1 = __importDefault(require("./routes/storyAbilities"));
const storyItems_1 = __importDefault(require("./routes/storyItems"));
const checkpoints_1 = __importDefault(require("./routes/checkpoints"));
const mainStory_1 = __importDefault(require("./routes/mainStory"));
const investigation_1 = __importDefault(require("./routes/investigation"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production'
        ? ['https://b801-fe.azurewebsites.net', 'https://b801-frontend.azurewebsites.net']
        : 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
app.use('/api/auth', auth_1.default);
app.use('/api/users', users_1.default);
app.use('/api/users', stats_1.default);
app.use('/api/system', system_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/story', story_1.default);
app.use('/api/inventory', inventory_1.default);
app.use('/api/shop', shop_1.default);
app.use('/api/raid', raid_1.default);
app.use('/api/bosses', bosses_1.default);
app.use('/api/leaderboards', leaderboards_1.default);
app.use('/api/abilities', abilities_1.default);
app.use('/api/story-abilities', storyAbilities_1.default);
app.use('/api/story-items', storyItems_1.default);
app.use('/api/checkpoints', checkpoints_1.default);
app.use('/api/main-story', mainStory_1.default);
app.use('/api/investigation', investigation_1.default);
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        port: PORT,
        database: process.env.DATABASE_URL ? 'configured' : 'missing'
    });
});
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});
exports.default = app;
//# sourceMappingURL=app.js.map