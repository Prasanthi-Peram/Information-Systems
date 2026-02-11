'use client'

import { useEffect, useRef } from 'react'

export function useWebSocket(
  url: string,
  onMessage: (data: any) => void
) {
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Resolve the WebSocket URL based on current environment
    const wsUrl = url.startsWith('ws')
      ? url
      : `ws://${window.location.hostname}:8000${url}`

    console.log('Connecting to WebSocket:', wsUrl)

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('WebSocket connected')
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('WS payload:', data)
        onMessage(data)
      } catch (err) {
        console.error(' WS parse error', err)
      }
    }

    ws.onerror = (err) => {
      console.error(' WebSocket error', err)
    }

    ws.onclose = () => {
      console.warn('WebSocket closed')
    }

    return () => {
      ws.close()
    }
  }, [url, onMessage])
}