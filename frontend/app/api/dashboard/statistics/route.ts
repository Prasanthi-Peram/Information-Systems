import { NextRequest, NextResponse } from 'next/server'
import { withAuth, handleError } from '@/server/middleware/auth'
import { pool } from '@/lib/db'

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    // Get statistics for the dashboard
    const stats = await pool.query(
      `SELECT 
        COUNT(DISTINCT device_id) as total_devices,
        COUNT(*) as total_readings,
        MAX(time_stamp) as last_update,
        AVG(current) as avg_current,
        AVG(voltage) as avg_voltage,
        AVG(real_power) as avg_real_power,
        SUM(unit_consumption) as total_consumption
       FROM device_telemetry 
       ${startDate && endDate ? 
         `WHERE time_stamp BETWEEN $1 AND $2` : 
         'WHERE time_stamp > now() - interval \'7 days\''}`,
      startDate && endDate ? [startDate, endDate] : []
    )

    const deviceHealth = await pool.query(
      `SELECT 
        device_id,
        COUNT(*) as reading_count,
        MAX(time_stamp) as last_reading
       FROM device_telemetry 
       ${startDate && endDate ? 
         `WHERE time_stamp BETWEEN $1 AND $2` : 
         'WHERE time_stamp > now() - interval \'7 days\''}
       GROUP BY device_id
       ORDER BY last_reading DESC`,
      startDate && endDate ? [startDate, endDate] : []
    )

    return NextResponse.json({
      status: 'success',
      data: {
        overview: stats.rows[0],
        devices: deviceHealth.rows,
      },
    })
  } catch (error) {
    return handleError(error)
  }
})
