"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Simple routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server running' });
});
app.get('/api/test', (req, res) => {
    res.json({ message: 'Test route working' });
});
app.post('/api/auth/login', (req, res) => {
    res.json({ message: 'Login route working' });
});
app.listen(PORT, () => {
    console.log(`🚀 Minimal server running on port ${PORT}`);
});
