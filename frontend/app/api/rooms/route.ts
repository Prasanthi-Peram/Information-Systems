import { NextRequest, NextResponse } from 'next/server'
import { withAuth, handleError } from '@/server/middleware/auth'
import { pool } from '@/lib/db'

interface Room {
  id?: string
  name: string
  location?: string
  floor?: string
  building?: string
  capacity?: number
  created_at?: string
}

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const building = searchParams.get('building')
    const floor = searchParams.get('floor')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = `SELECT * FROM rooms`
    const params: any[] = []

    if (building) {
      query += ` WHERE building = $${params.length + 1}`
      params.push(building)
    }

    if (floor) {
      query += params.length > 0 ? ` AND floor = $${params.length + 1}` : ` WHERE floor = $${params.length + 1}`
      params.push(floor)
    }

    query += ` ORDER BY floor, name LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)

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
    const body: Room = await request.json()

    if (!body.name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      )
    }

    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    const result = await pool.query(
      `INSERT INTO rooms (id, name, location, floor, building, capacity, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, body.name, body.location || null, body.floor || null, body.building || null, body.capacity || null, now]
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
