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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// force-create-admin.cjs
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const email = 'superadmin@school.com';
        const password = 'superadmin123';
        const name = 'Super Admin';
        const hash = yield bcrypt_1.default.hash(password, 10);
        const existing = yield prisma.user.findUnique({ where: { email } });
        if (existing) {
            yield prisma.user.update({
                where: { email },
                data: {
                    password: hash,
                    accountLocked: false,
                    lockReason: null,
                    passwordAttempts: 0,
                    lastPasswordAttempt: null,
      status: 'ACTIVE',
                    role: 'ADMIN',
                    name
                }
            });
            console.log('✅ Existing admin updated:', email);
        }
        else {
            yield prisma.user.create({
                data: {
                    email,
                    password: hash,
                    name,
                    role: 'ADMIN',
      status: 'ACTIVE',
                    accountLocked: false
                }
            });
            console.log('✅ New admin created:', email);
        }
        yield prisma.$disconnect();
    });
}
main().catch(e => { console.error(e); prisma.$disconnect(); });
