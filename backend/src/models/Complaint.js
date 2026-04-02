const pool = require('../config/database');
const { generateComplaintId } = require('../utils/generateId');
const { routeToDepartment } = require('../utils/departmentRouter');

class Complaint {
    /**
     * Create a new complaint
     * @param {Object} complaintData - Complaint data
     * @returns {Object} Created complaint
     */
    static async create(complaintData) {
        const {
            name,
            phone,
            email,
            area,
            city,
            landmark,
            issueType,
            description,
            severity = 'medium',
            imageUrl,
            latitude,
            longitude
        } = complaintData;

        const complaintId = generateComplaintId();
        const department = routeToDepartment(issueType);

        const query = `
            INSERT INTO complaints (
                complaint_id, name, phone, email, area, city, landmark,
                issue_type, description, severity, image_url,
                latitude, longitude, department, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'Pending')
            RETURNING *
        `;

        const values = [
            complaintId, name, phone, email, area, city, landmark,
            issueType, description, severity, imageUrl,
            latitude, longitude, department
        ];

        const result = await pool.query(query, values);
        return result.rows[0];
    }

    /**
     * Find complaint by complaint_id
     * @param {string} complaintId - The complaint ID (e.g., CIV-123456)
     * @returns {Object|null} Complaint data or null
     */
    static async findByComplaintId(complaintId) {
        const query = 'SELECT * FROM complaints WHERE complaint_id = $1';
        const result = await pool.query(query, [complaintId]);
        return result.rows[0] || null;
    }

    /**
     * Find complaint by internal id
     * @param {number} id - The internal database ID
     * @returns {Object|null} Complaint data or null
     */
    static async findById(id) {
        const query = 'SELECT * FROM complaints WHERE id = $1';
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    }

    /**
     * Get all complaints with optional filters
     * @param {Object} filters - Optional filters (status, department)
     * @returns {Array} List of complaints
     */
    static async findAll(filters = {}) {
        let query = 'SELECT * FROM complaints';
        const values = [];
        const conditions = [];

        if (filters.status) {
            conditions.push(`status = $${values.length + 1}`);
            values.push(filters.status);
        }

        if (filters.department) {
            conditions.push(`department = $${values.length + 1}`);
            values.push(filters.department);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY created_at DESC';

        const result = await pool.query(query, values);
        return result.rows;
    }

    /**
     * Update complaint status
     * @param {number} id - Complaint internal ID
     * @param {string} status - New status (Pending, In Progress, Resolved)
     * @returns {Object} Updated complaint
     */
    static async updateStatus(id, status) {
        const validStatuses = ['Pending', 'In Progress', 'Resolved'];

        if (!validStatuses.includes(status)) {
            throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }

        const query = `
            UPDATE complaints
            SET status = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
        `;

        const result = await pool.query(query, [status, id]);
        return result.rows[0] || null;
    }

    /**
     * Assign complaint to department
     * @param {number} id - Complaint internal ID
     * @param {string} department - Department name
     * @returns {Object} Updated complaint
     */
    static async assignToDepartment(id, department) {
        const query = `
            UPDATE complaints
            SET department = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
        `;

        const result = await pool.query(query, [department, id]);
        return result.rows[0] || null;
    }

    /**
     * Auto-assign to department based on issue type
     * @param {number} id - Complaint internal ID
     * @param {string} issueType - Type of issue
     * @returns {Object} Updated complaint
     */
    static async autoAssignToDepartment(id, issueType) {
        const department = routeToDepartment(issueType);
        return this.assignToDepartment(id, department);
    }

    /**
     * Delete complaint
     * @param {number} id - Complaint internal ID
     * @returns {boolean} Success status
     */
    static async delete(id) {
        const query = 'DELETE FROM complaints WHERE id = $1 RETURNING id';
        const result = await pool.query(query, [id]);
        return result.rowCount > 0;
    }
}

module.exports = Complaint;
