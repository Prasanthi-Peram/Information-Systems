// Service for communicating with FastAPI backend
const API_URL = process.env.API_URL || 'http://localhost:8000'
const API_WS_URL = process.env.API_WS_URL || 'ws://localhost:8000'

export interface DeviceTelemetry {
  time_stamp: string
  device_id: number
  current?: number
  voltage?: number
  power_factor?: number
  real_power?: number
  room_temp?: number
  external_temp?: number
  humidity?: number
  unit_consumption?: number
}

export interface ApiResponse<T> {
  status: 'success' | 'error'
  data?: T
  message?: string
}

export class ApiService {
  static async makeRequest<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${API_URL}${endpoint}`

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data as T
    } catch (error) {
      console.error('API Service Error:', error)
      throw error
    }
  }

  static async getHealth(): Promise<{ status: string }> {
    return this.makeRequest('/') as Promise<{ status: string }>
  }

  static createWebSocket(onMessage?: (data: any) => void, onError?: (error: any) => void) {
    const ws = new WebSocket(API_WS_URL + '/ws')

    ws.onopen = () => {
      console.log('WebSocket connected')
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        onMessage?.(data)
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      onError?.(error)
    }

    ws.onclose = () => {
      console.log('WebSocket disconnected')
    }

    return ws
  }

  static sendDeviceTelemetry(ws: WebSocket, telemetry: DeviceTelemetry): Promise<void> {
    return new Promise((resolve, reject) => {
      if (ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket is not connected'))
        return
      }

      ws.send(JSON.stringify(telemetry))
      resolve()
    })
  }
}
