const pool = require('./database');

const initDatabase = async () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS complaints (
            id SERIAL PRIMARY KEY,
            complaint_id VARCHAR(20) UNIQUE NOT NULL,
            name VARCHAR(255) NOT NULL,
            phone VARCHAR(20) NOT NULL,
            email VARCHAR(255),
            area VARCHAR(255) NOT NULL,
            city VARCHAR(255) NOT NULL,
            landmark VARCHAR(255),
            issue_type VARCHAR(100) NOT NULL,
            description TEXT NOT NULL,
            severity VARCHAR(20) DEFAULT 'medium',
            image_url VARCHAR(500),
            latitude DECIMAL(10, 8),
            longitude DECIMAL(11, 8),
            status VARCHAR(50) DEFAULT 'Pending',
            department VARCHAR(100) DEFAULT 'General Administration',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
        CREATE INDEX IF NOT EXISTS idx_complaints_department ON complaints(department);
        CREATE INDEX IF NOT EXISTS idx_complaints_complaint_id ON complaints(complaint_id);
    `;

    try {
        await pool.query(createTableQuery);
        console.log('Complaints table created successfully');
    } catch (err) {
        console.error('Error creating complaints table:', err);
        throw err;
    }
};

// Run if called directly
if (require.main === module) {
    initDatabase()
        .then(() => {
            console.log('Database initialization complete');
            process.exit(0);
        })
        .catch((err) => {
            console.error('Database initialization failed:', err);
            process.exit(1);
        });
}

module.exports = initDatabase;