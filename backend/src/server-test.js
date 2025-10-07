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
// Test routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server running' });
});
app.get('/api/test', (req, res) => {
    res.json({ message: 'Test route working' });
});
app.get('/api/users/:id', (req, res) => {
    res.json({ message: 'User route', id: req.params.id });
});
app.listen(PORT, () => {
    console.log(`🚀 Test server running on port ${PORT}`);
});
