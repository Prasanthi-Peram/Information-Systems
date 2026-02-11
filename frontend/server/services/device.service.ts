import { pool } from '@/lib/db'

export interface Device {
  id: number
  name?: string
  location?: string
  type?: string
  room_id?: string
  status?: string
  created_at?: string
  updated_at?: string
}

export class DeviceService {
  static async getDeviceById(deviceId: number): Promise<Device | null> {
    try {
      const result = await pool.query(
        `SELECT id, name, location, type, room_id, status, created_at, updated_at 
         FROM devices WHERE id = $1`,
        [deviceId]
      )
      return result.rows[0] || null
    } catch (error) {
      console.error('Error fetching device:', error)
      // Return null instead of throwing to avoid breaking calls
      return null
    }
  }

  static async getAllDevices(limit: number = 100, offset: number = 0): Promise<Device[]> {
    try {
      const result = await pool.query(
        `SELECT id, name, location, type, room_id, status, created_at, updated_at 
         FROM devices 
         ORDER BY created_at DESC 
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      )
      return result.rows
    } catch (error) {
      console.error('Error fetching devices:', error)
      return []
    }
  }

  static async getDevicesByRoom(roomId: string): Promise<Device[]> {
    try {
      const result = await pool.query(
        `SELECT id, name, location, type, room_id, status, created_at, updated_at 
         FROM devices WHERE room_id = $1 
         ORDER BY created_at DESC`,
        [roomId]
      )
      return result.rows
    } catch (error) {
      console.error('Error fetching devices by room:', error)
      return []
    }
  }

  static async getDevicesByStatus(status: string): Promise<Device[]> {
    try {
      const result = await pool.query(
        `SELECT id, name, location, type, room_id, status, created_at, updated_at 
         FROM devices WHERE status = $1 
         ORDER BY created_at DESC`,
        [status]
      )
      return result.rows
    } catch (error) {
      console.error('Error fetching devices by status:', error)
      return []
    }
  }

  static async createDevice(device: Omit<Device, 'id' | 'created_at' | 'updated_at'>): Promise<Device | null> {
    try {
      const now = new Date().toISOString()
      const result = await pool.query(
        `INSERT INTO devices (name, location, type, room_id, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, name, location, type, room_id, status, created_at, updated_at`,
        [device.name, device.location, device.type, device.room_id, device.status || 'active', now, now]
      )
      return result.rows[0] || null
    } catch (error) {
      console.error('Error creating device:', error)
      throw error
    }
  }

  static async updateDevice(deviceId: number, updates: Partial<Device>): Promise<Device | null> {
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

    if (fields.length === 0) return this.getDeviceById(deviceId)

    fields.push(`updated_at = $${paramCount}`)
    values.push(new Date().toISOString())
    paramCount++

    values.push(deviceId)

    try {
      const result = await pool.query(
        `UPDATE devices SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING id, name, location, type, room_id, status, created_at, updated_at`,
        values
      )
      return result.rows[0] || null
    } catch (error) {
      console.error('Error updating device:', error)
      throw error
    }
  }

  static async deleteDevice(deviceId: number): Promise<boolean> {
    try {
      const result = await pool.query('DELETE FROM devices WHERE id = $1', [deviceId])
      return result.rowCount > 0
    } catch (error) {
      console.error('Error deleting device:', error)
      throw error
    }
  }

  static async getDeviceCount(): Promise<number> {
    try {
      const result = await pool.query('SELECT COUNT(*) as count FROM devices')
      return parseInt(result.rows[0]?.count || '0')
    } catch (error) {
      console.error('Error getting device count:', error)
      return 0
    }
  }
}
