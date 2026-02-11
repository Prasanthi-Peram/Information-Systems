import { NextRequest, NextResponse } from 'next/server'
import { withAuth, handleError } from '@/server/middleware/auth'
import { pool } from '@/lib/db'

interface MaintenanceRecord {
  id?: string
  device_id: number
  description: string
  status: 'pending' | 'in-progress' | 'completed'
  scheduled_date?: string
  completed_date?: string
  technician_id?: string
  notes?: string
}

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get('device_id')
    const status = searchParams.get('status')

    let query = `SELECT * FROM maintenance_records`
    const params: any[] = []

    if (deviceId) {
      query += ` WHERE device_id = $${params.length + 1}`
      params.push(parseInt(deviceId))
    }

    if (status) {
      query += params.length > 0 ? ` AND status = $${params.length + 1}` : ` WHERE status = $${params.length + 1}`
      params.push(status)
    }

    query += ` ORDER BY scheduled_date DESC`

    const result = await pool.query(query, params)

    return NextResponse.json({
      status: 'success',
      data: result.rows,
      count: result.rows.length,
    })
  } catch (error) {
    return handleError(error)
  }
})

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const body: MaintenanceRecord = await request.json()
    const userId = (request as any).userId

    const {
      device_id,
      description,
      status = 'pending',
      scheduled_date,
      notes,
    } = body

    if (!device_id || !description) {
      return NextResponse.json(
        { error: 'device_id and description are required' },
        { status: 400 }
      )
    }

    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    const result = await pool.query(
      `INSERT INTO maintenance_records 
       (id, device_id, description, status, scheduled_date, technician_id, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [id, device_id, description, status, scheduled_date, userId, notes, now]
    )

    return NextResponse.json(
      {
        status: 'success',
        data: result.rows[0],
      },
      { status: 201 }
    )
  } catch (error) {
    return handleError(error)
  }
})

export const PUT = withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      )
    }

    const fields: string[] = []
    const values: any[] = []
    let paramCount = 1

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'created_at') {
        fields.push(`${key} = $${paramCount}`)
        values.push(value)
        paramCount++
      }
    })

    values.push(id)

    const result = await pool.query(
      `UPDATE maintenance_records SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Maintenance record not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      status: 'success',
      data: result.rows[0],
    })
  } catch (error) {
    return handleError(error)
  }
})
