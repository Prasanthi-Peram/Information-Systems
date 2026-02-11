import { pool } from '@/lib/db'

export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
  role?: string
  campus_id?: string
  created_at?: string
}

export class UserService {
  static async getUserById(userId: string): Promise<User | null> {
    try {
      const result = await pool.query(
        `SELECT id, email, name, avatar, role, campus_id, created_at 
         FROM users WHERE id = $1`,
        [userId]
      )
      return result.rows[0] || null
    } catch (error) {
      console.error('Error fetching user:', error)
      throw error
    }
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const result = await pool.query(
        `SELECT id, email, name, avatar, role, campus_id, created_at 
         FROM users WHERE email = $1`,
        [email]
      )
      return result.rows[0] || null
    } catch (error) {
      console.error('Error fetching user by email:', error)
      throw error
    }
  }

  static async getAllUsers(limit: number = 100, offset: number = 0): Promise<User[]> {
    try {
      const result = await pool.query(
        `SELECT id, email, name, avatar, role, campus_id, created_at 
         FROM users 
         ORDER BY created_at DESC 
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      )
      return result.rows
    } catch (error) {
      console.error('Error fetching users:', error)
      throw error
    }
  }

  static async getUsersByRole(role: string): Promise<User[]> {
    try {
      const result = await pool.query(
        `SELECT id, email, name, avatar, role, campus_id, created_at 
         FROM users WHERE role = $1 
         ORDER BY created_at DESC`,
        [role]
      )
      return result.rows
    } catch (error) {
      console.error('Error fetching users by role:', error)
      throw error
    }
  }

  static async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    const fields = []
    const values = []
    let paramCount = 1

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'created_at' && value !== undefined) {
        fields.push(`${key} = $${paramCount}`)
        values.push(value)
        paramCount++
      }
    })

    if (fields.length === 0) return this.getUserById(userId)

    values.push(userId)

    try {
      const result = await pool.query(
        `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING id, email, name, avatar, role, campus_id, created_at`,
        values
      )
      return result.rows[0] || null
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  }

  static async getUserCount(): Promise<number> {
    try {
      const result = await pool.query('SELECT COUNT(*) as count FROM users')
      return parseInt(result.rows[0].count)
    } catch (error) {
      console.error('Error getting user count:', error)
      throw error
    }
  }
}
