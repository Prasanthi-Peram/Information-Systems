import { pool } from '@/lib/db'
import { DeviceTelemetry } from './api.service'

export class TelemetryService {
  static async getDeviceTelemetry(
    deviceId: number,
    limit: number = 100,
    offset: number = 0
  ) {
    try {
      const result = await pool.query(
        `SELECT * FROM device_telemetry 
         WHERE device_id = $1 
         ORDER BY time_stamp DESC 
         LIMIT $2 OFFSET $3`,
        [deviceId, limit, offset]
      )
      return result.rows
    } catch (error) {
      console.error('Error fetching device telemetry:', error)
      throw error
    }
  }

  static async getTelemetryByDateRange(
    deviceId: number,
    startDate: Date,
    endDate: Date
  ) {
    try {
      const result = await pool.query(
        `SELECT * FROM device_telemetry 
         WHERE device_id = $1 
         AND time_stamp BETWEEN $2 AND $3
         ORDER BY time_stamp ASC`,
        [deviceId, startDate, endDate]
      )
      return result.rows
    } catch (error) {
      console.error('Error fetching telemetry by date range:', error)
      throw error
    }
  }

  static async getLatestTelemetry(deviceId: number) {
    try {
      const result = await pool.query(
        `SELECT * FROM device_telemetry 
         WHERE device_id = $1 
         ORDER BY time_stamp DESC 
         LIMIT 1`,
        [deviceId]
      )
      return result.rows[0] || null
    } catch (error) {
      console.error('Error fetching latest telemetry:', error)
      throw error
    }
  }

  static async getAggregatedMetrics(
    deviceId: number,
    intervalMinutes: number = 60
  ) {
    try {
      const result = await pool.query(
        `SELECT 
          time_bucket(interval '${intervalMinutes} minutes', time_stamp) as bucket,
          AVG(current) as avg_current,
          AVG(voltage) as avg_voltage,
          AVG(power_factor) as avg_power_factor,
          AVG(real_power) as avg_real_power,
          AVG(room_temp) as avg_room_temp,
          AVG(external_temp) as avg_external_temp,
          AVG(humidity) as avg_humidity,
          SUM(unit_consumption) as total_consumption,
          MAX(current) as max_current,
          MIN(current) as min_current
         FROM device_telemetry 
         WHERE device_id = $1
         GROUP BY bucket
         ORDER BY bucket DESC`,
        [deviceId]
      )
      return result.rows
    } catch (error) {
      console.error('Error fetching aggregated metrics:', error)
      throw error
    }
  }

  static async getDeviceHealth(deviceId: number) {
    try {
      const result = await pool.query(
        `SELECT 
          COUNT(*) as total_records,
          COUNT(DISTINCT DATE(time_stamp)) as days_with_data,
          MAX(time_stamp) as last_update,
          AVG(current) as avg_current,
          AVG(voltage) as avg_voltage,
          AVG(real_power) as avg_real_power
         FROM device_telemetry 
         WHERE device_id = $1`,
        [deviceId]
      )
      return result.rows[0] || null
    } catch (error) {
      console.error('Error fetching device health:', error)
      throw error
    }
  }
}
