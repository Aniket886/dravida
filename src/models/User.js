import { getCollection } from '../lib/mongodb';
import bcrypt from 'bcryptjs';

export async function createUser(userData) {
    const users = await getCollection('users');

    // Check if user already exists
    const existingUser = await users.findOne({ email: userData.email });
    if (existingUser) {
        throw new Error('User already exists');
    }

    // Hash password if provided
    let hashedPassword = null;
    if (userData.password) {
        hashedPassword = await bcrypt.hash(userData.password, 10);
    }

    const newUser = {
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        phone: userData.phone || '',
        role: userData.role || 'student',
        avatar: userData.avatar || '',
        authProvider: userData.authProvider || 'email', // 'email' or 'google'
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const result = await users.insertOne(newUser);

    return {
        id: result.insertedId.toString(),
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        avatar: newUser.avatar
    };
}

export async function findUserByEmail(email) {
    const users = await getCollection('users');
    return users.findOne({ email });
}

export async function findUserById(id) {
    const users = await getCollection('users');
    const { ObjectId } = await import('mongodb');
    return users.findOne({ _id: new ObjectId(id) });
}

export async function verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
}

export async function updateUser(id, updates) {
    const users = await getCollection('users');
    const { ObjectId } = await import('mongodb');

    const result = await users.updateOne(
        { _id: new ObjectId(id) },
        {
            $set: {
                ...updates,
                updatedAt: new Date()
            }
        }
    );

    return result.modifiedCount > 0;
}

export async function getAllUsers(options = {}) {
    const users = await getCollection('users');
    const { page = 1, limit = 10, search = '', role = null } = options;

    let query = {};

    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ];
    }

    if (role) {
        query.role = role;
    }

    const skip = (page - 1) * limit;

    const [usersList, total] = await Promise.all([
        users.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }).toArray(),
        users.countDocuments(query)
    ]);

    return {
        users: usersList.map(u => ({
            id: u._id.toString(),
            name: u.name,
            email: u.email,
            phone: u.phone,
            role: u.role,
            avatar: u.avatar,
            createdAt: u.createdAt
        })),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

export async function countUsers(role = null) {
    const users = await getCollection('users');
    const query = role ? { role } : {};
    return users.countDocuments(query);
}
