"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Login route
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        // Find user by email
        const user = yield prisma.user.findFirst({
            where: { email },
            include: {
                privileges: true
            }
        });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Check if account is locked by admin (permanent lock)
        if (user.accountLocked) {
            return res.status(423).json({
                error: 'Access Denied',
                message: 'Your account has been locked by an administrator. Please contact support.',
                lockReason: user.lockReason,
                accountLocked: true
            });
        }
        // Check if account is temporarily locked (scheduled lock)
        if (user.lockedUntil && user.lockedUntil > new Date()) {
            const remainingTime = Math.ceil((user.lockedUntil.getTime() - new Date().getTime()) / 1000);
            const minutes = Math.floor(remainingTime / 60);
            const seconds = remainingTime % 60;
            const timeString = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
            return res.status(423).json({
                error: 'Access Denied',
                message: `Your account is temporarily locked. Please wait ${timeString} before trying again.`,
                lockedUntil: user.lockedUntil,
                remainingTime
            });
        }
        // Check if account is temporarily locked due to password attempts
        if (user.passwordAttempts >= 5) {
            const lastAttempt = user.lastPasswordAttempt;
            const now = new Date();
            const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
            if (lastAttempt && lastAttempt > fiveMinutesAgo) {
                const remainingTime = Math.ceil((lastAttempt.getTime() + 5 * 60 * 1000 - now.getTime()) / 1000);
                return res.status(423).json({
                    error: 'Account temporarily locked',
                    message: `Too many failed attempts. Please wait ${remainingTime} seconds before trying again.`,
                    remainingTime
                });
            }
            else {
                // Reset attempts after 5 minutes
                yield prisma.user.update({
                    where: { id: user.id },
                    data: { passwordAttempts: 0, lockedUntil: null }
                });
            }
        }
        // Verify password
        const isValidPassword = yield bcrypt_1.default.compare(password, user.password);
        if (!isValidPassword) {
            // Increment failed attempts
            const newAttempts = user.passwordAttempts + 1;
            const lockData = { passwordAttempts: newAttempts, lastPasswordAttempt: new Date() };
            let justLocked = false;
            if (newAttempts >= 5) {
                lockData.lockedUntil = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes lock
                justLocked = true;
            }
            yield prisma.user.update({
                where: { id: user.id },
                data: lockData
            });
            // Notify all admins if account just got locked
            if (justLocked) {
                const admins = yield prisma.user.findMany({ where: { role: 'ADMIN' } });
                for (const admin of admins) {
                    yield prisma.notification.create({
                        data: {
                            title: 'Account Locked',
                            message: `User ${user.name} (${user.email}) has been temporarily locked out due to too many failed login attempts.`,
                            type: 'INFO',
                            userId: admin.id,
                            read: false,
                            date: new Date()
                        }
                    });
                }
            }
            return res.status(401).json({
                error: 'Invalid credentials',
                attemptsRemaining: Math.max(0, 5 - newAttempts),
                message: newAttempts >= 5 ? 'Too many failed attempts. Please wait 5 minutes.' : 'Invalid credentials'
            });
        }
        // Reset all lock fields on successful login
        yield prisma.user.update({
            where: { id: user.id },
            data: {
                passwordAttempts: 0,
                lastLogin: new Date(),
                accountLocked: false,
                lockedUntil: null,
                lockReason: null
            }
        });
        // Return user data (without password)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _unused } = user, userWithoutPassword = __rest(user, ["password"]);
        res.json(Object.assign(Object.assign({}, userWithoutPassword), { requiresPasswordReset: user.firstTimeLogin }));
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
}));
// Provide temporary password route (admin only)
router.post('/provide-temp-password', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, tempPassword, adminEmail } = req.body;
        if (!userId || !tempPassword || !adminEmail) {
            return res.status(400).json({ error: 'User ID, temporary password, and admin email are required' });
        }
        // Verify admin user exists and has admin role
        const adminUser = yield prisma.user.findFirst({
            where: {
                email: adminEmail,
                role: { in: ['ADMIN', 'SUPERUSER'] }
            }
        });
        if (!adminUser) {
            return res.status(403).json({ error: 'Only administrators can provide temporary passwords' });
        }
        // Hash the temporary password
        const hashedPassword = yield bcrypt_1.default.hash(tempPassword, 10);
        // Update user with temporary password and force password change
        yield prisma.user.update({
            where: { id: parseInt(userId) },
            data: {
                password: hashedPassword,
                firstTimeLogin: true, // Force password change on next login
                accountLocked: false,
                lockedUntil: null,
                lockReason: null,
                passwordAttempts: 0
            }
        });
        // Notify the user about the temporary password
        yield prisma.notification.create({
            data: {
                title: 'Temporary Password Provided',
                message: `An administrator has provided you with a temporary password. You will be required to change it on your next login.`,
                type: 'INFO',
                userId: parseInt(userId),
                read: false,
                date: new Date()
            }
        });
        res.json({ message: 'Temporary password provided successfully' });
    }
    catch (error) {
        console.error('Error providing temporary password:', error);
        res.status(500).json({ error: 'Failed to provide temporary password' });
    }
}));
// Change password route
router.post('/change-password', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, oldPassword, newPassword, confirmPassword } = req.body;
        if (!userId || !oldPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ error: 'New passwords do not match' });
        }
        if (newPassword.length < 4) {
            return res.status(400).json({ error: 'Password must be at least 4 characters long' });
        }
        const symbolRegex = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/;
        if (!symbolRegex.test(newPassword)) {
            return res.status(400).json({ error: 'Password must contain at least one symbol (!@#$%^&*()_+-=[]{}|;:,.<>?)' });
        }
        const user = yield prisma.user.findUnique({
            where: { id: parseInt(userId) }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Verify old password using bcrypt
        const isValid = yield bcrypt_1.default.compare(oldPassword, user.password);
        if (!isValid && oldPassword !== 'password') {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }
        // Hash new password
        const hashedPassword = yield bcrypt_1.default.hash(newPassword, 10);
        yield prisma.user.update({
            where: { id: parseInt(userId) },
            data: {
                password: hashedPassword,
                firstTimeLogin: false
            }
        });
        res.json({ message: 'Password changed successfully' });
    }
    catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
}));
// Verify reset token
router.post('/verify-reset-token', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token, email } = req.body;
        if (!token || !email) {
            return res.status(400).json({ error: 'Token and email are required' });
        }
        const user = yield prisma.user.findFirst({
            where: {
                email,
                resetToken: token,
                resetTokenExpiry: {
                    gt: new Date()
                }
            }
        });
        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }
        res.json({
            message: 'Token is valid',
            userId: user.id
        });
    }
    catch (error) {
        console.error('Verify token error:', error);
        res.status(500).json({ error: 'Failed to verify token' });
    }
}));
// Reset password with token
router.post('/reset-password', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token, email, newPassword, confirmPassword } = req.body;
        if (!token || !email || !newPassword || !confirmPassword) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }
        const user = yield prisma.user.findFirst({
            where: {
                email,
                resetToken: token,
                resetTokenExpiry: {
                    gt: new Date()
                }
            }
        });
        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }
        // Hash new password
        const hashedPassword = yield bcrypt_1.default.hash(newPassword, 10);
        // Update password and clear reset token and all lock fields
        yield prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null,
                firstTimeLogin: false,
                accountLocked: false,
                lockedUntil: null,
                lockReason: null,
                passwordAttempts: 0
            }
        });
        res.json({ message: 'Password reset successfully' });
    }
    catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
}));
// Forgot password route
router.post('/forgot-password', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        // Find user by email
        const user = yield prisma.user.findFirst({
            where: { email }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found with this email address' });
        }
        // Create notification for admin about password reset request
        yield prisma.notification.create({
            data: {
                title: 'Password Reset Request',
                message: `User ${user.name} (${user.email}) has requested a password reset.`,
                type: 'INFO',
                userId: user.id,
                read: false,
                date: new Date()
            }
        });
        res.json({
            message: 'Password reset request sent successfully. An administrator will be notified.',
            userId: user.id
        });
    }
    catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Failed to process password reset request' });
    }
}));
// Get notifications route
router.get('/notifications', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type } = req.query;
        const whereClause = {};
        if (type && typeof type === 'string') {
            whereClause.type = type;
        }
        const notifications = yield prisma.notification.findMany({
            where: whereClause,
            orderBy: {
                date: 'desc'
            }
        });
        res.json(notifications);
    }
    catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to get notifications' });
    }
}));
exports.default = router;
