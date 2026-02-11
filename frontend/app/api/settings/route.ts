import { NextRequest, NextResponse } from 'next/server'
import { withAuth, handleError } from '@/server/middleware/auth'
import { pool } from '@/lib/db'

interface AppSettings {
  key: string
  value: string
  type: 'string' | 'number' | 'boolean' | 'json'
}

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    let query = `SELECT key, value, type FROM app_settings`
    const params: any[] = []

    if (key) {
      query += ` WHERE key = $1`
      params.push(key)
    }

    const result = await pool.query(query, params)

    if (key && result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Setting not found' },
        { status: 404 }
      )
    }

    const settings: any = {}
    result.rows.forEach((row: any) => {
      let value = row.value
      if (row.type === 'boolean') {
        value = value === 'true'
      } else if (row.type === 'number') {
        value = parseFloat(value)
      } else if (row.type === 'json') {
        value = JSON.parse(value)
      }
      settings[row.key] = value
    })

    return NextResponse.json({
      status: 'success',
      data: key ? settings[key] : settings,
    })
  } catch (error) {
    return handleError(error)
  }
})

export const PUT = withAuth(async (request: NextRequest) => {
  try {
    const body: AppSettings = await request.json()
    const { key, value, type = 'string' } = body

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: 'key and value are required' },
        { status: 400 }
      )
    }

    const result = await pool.query(
      `INSERT INTO app_settings (key, value, type, updated_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (key)
       DO UPDATE SET value = $2, type = $3, updated_at = now()
       RETURNING *`,
      [key, String(value), type]
    )

    return NextResponse.json({
      status: 'success',
      data: result.rows[0],
    })
  } catch (error) {
    return handleError(error)
  }
})
