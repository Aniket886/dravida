const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

let db = null;
const dbPath = path.join(__dirname, 'lms.db');

async function getDb() {
    if (db) return db;

    const SQL = await initSqlJs();

    // Load existing database or create new one
    if (fs.existsSync(dbPath)) {
        const buffer = fs.readFileSync(dbPath);
        db = new SQL.Database(buffer);
    } else {
        db = new SQL.Database();
    }

    return db;
}

function saveDb() {
    if (db) {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(dbPath, buffer);
    }
}

function closeDb() {
    if (db) {
        saveDb();
        db.close();
        db = null;
    }
}

// Helper to run queries and return results
function runQuery(sql, params = []) {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const results = [];
    while (stmt.step()) {
        results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
}

// Helper to run a single statement
function runStatement(sql, params = []) {
    db.run(sql, params);
    saveDb();
    return {
        changes: db.getRowsModified(),
        lastInsertRowid: runQuery('SELECT last_insert_rowid() as id')[0]?.id
    };
}

// Synchronous getter for routes (use after initialization)
function getDatabase() {
    if (!db) {
        throw new Error('Database not initialized. Call getDb() first.');
    }
    return {
        prepare: (sql) => {
            return {
                get: (...params) => {
                    const stmt = db.prepare(sql);
                    if (params.length > 0) {
                        stmt.bind(params);
                    }
                    const result = stmt.step() ? stmt.getAsObject() : null;
                    stmt.free();
                    return result;
                },
                all: (...params) => {
                    const stmt = db.prepare(sql);
                    if (params.length > 0) {
                        stmt.bind(params);
                    }
                    const results = [];
                    while (stmt.step()) {
                        results.push(stmt.getAsObject());
                    }
                    stmt.free();
                    return results;
                },
                run: (...params) => {
                    try {
                        const stmt = db.prepare(sql);
                        if (params.length > 0) {
                            stmt.bind(params);
                        }
                        stmt.step();
                        stmt.free();
                        saveDb();
                        return { changes: db.getRowsModified() };
                    } catch (error) {
                        console.error('Database run error:', error);
                        throw error;
                    }
                }
            };
        }
    };
}

module.exports = { getDb, saveDb, closeDb, runQuery, runStatement, getDatabase };
