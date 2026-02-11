import { NextRequest, NextResponse } from 'next/server'
import { withAuth, handleError } from '@/server/middleware/auth'
import { pool } from '@/lib/db'

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') || 'summary'
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    switch (reportType) {
      case 'device_performance':
        return getDevicePerformance(startDate, endDate)
      case 'energy_consumption':
        return getEnergyConsumption(startDate, endDate)
      case 'anomalies':
        return getAnomalies(startDate, endDate)
      case 'maintenance_status':
        return getMaintenanceStatus()
      case 'summary':
      default:
        return getSummary(startDate, endDate)
    }
  } catch (error) {
    return handleError(error)
  }
})

async function getSummary(startDate?: string | null, endDate?: string | null) {
  const result = await pool.query(
    `SELECT 
      COUNT(DISTINCT device_id) as total_devices,
      COUNT(*) as total_readings,
      AVG(real_power) as avg_power,
      MAX(current) as max_current,
      MIN(voltage) as min_voltage
     FROM device_telemetry 
     ${startDate && endDate ? 'WHERE time_stamp BETWEEN $1 AND $2' : 'WHERE time_stamp > now() - interval \'30 days\''}`,
    startDate && endDate ? [startDate, endDate] : []
  )

  return NextResponse.json({
    status: 'success',
    type: 'summary',
    data: result.rows[0],
  })
}

async function getDevicePerformance(startDate?: string | null, endDate?: string | null) {
  const result = await pool.query(
    `SELECT 
      device_id,
      COUNT(*) as reading_count,
      AVG(current) as avg_current,
      AVG(voltage) as avg_voltage,
      AVG(real_power) as avg_real_power,
      MAX(current) as max_current,
      MAX(voltage) as max_voltage,
      MAX(real_power) as max_real_power,
      MAX(time_stamp) as last_reading
     FROM device_telemetry
     ${startDate && endDate ? 'WHERE time_stamp BETWEEN $1 AND $2' : 'WHERE time_stamp > now() - interval \'30 days\''}
     GROUP BY device_id
     ORDER BY last_reading DESC`,
    startDate && endDate ? [startDate, endDate] : []
  )

  return NextResponse.json({
    status: 'success',
    type: 'device_performance',
    data: result.rows,
  })
}

async function getEnergyConsumption(startDate?: string | null, endDate?: string | null) {
  const result = await pool.query(
    `SELECT 
      device_id,
      DATE(time_stamp) as consumption_date,
      SUM(unit_consumption) as daily_consumption,
      AVG(real_power) as avg_power
     FROM device_telemetry
     ${startDate && endDate ? 'WHERE time_stamp BETWEEN $1 AND $2' : 'WHERE time_stamp > now() - interval \'30 days\''}
     GROUP BY device_id, DATE(time_stamp)
     ORDER BY consumption_date DESC, device_id`,
    startDate && endDate ? [startDate, endDate] : []
  )

  return NextResponse.json({
    status: 'success',
    type: 'energy_consumption',
    data: result.rows,
  })
}

async function getAnomalies(startDate?: string | null, endDate?: string | null) {
  const result = await pool.query(
    `SELECT 
      time_stamp,
      device_id,
      current,
      voltage,
      power_factor,
      real_power,
      CASE 
        WHEN current > 100 OR current < 0.1 THEN 'High/Low Current'
        WHEN voltage > 250 OR voltage < 200 THEN 'Voltage Out of Range'
        WHEN power_factor < 0.8 THEN 'Low Power Factor'
        WHEN real_power > 50 THEN 'High Power Consumption'
        ELSE NULL
      END as anomaly_type
     FROM device_telemetry
     ${startDate && endDate ? 'WHERE time_stamp BETWEEN $1 AND $2' : 'WHERE time_stamp > now() - interval \'7 days\''}
     HAVING anomaly_type IS NOT NULL
     ORDER BY time_stamp DESC
     LIMIT 100`,
    startDate && endDate ? [startDate, endDate] : []
  )

  return NextResponse.json({
    status: 'success',
    type: 'anomalies',
    data: result.rows,
  })
}

async function getMaintenanceStatus() {
  const result = await pool.query(
    `SELECT 
      status,
      COUNT(*) as count,
      AVG(EXTRACT(EPOCH FROM (completed_date - scheduled_date))/3600) as avg_hours_to_complete
     FROM maintenance_records
     GROUP BY status`
  )

  return NextResponse.json({
    status: 'success',
    type: 'maintenance_status',
    data: result.rows,
  })
}
