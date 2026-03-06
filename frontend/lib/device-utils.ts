// Utility functions for working with device data, used by both the
// individual device page and the maintenance list export handler.

export interface DeviceData {
  deviceId: string
  location: string
  status: string
  temperature: number
  current: number
  voltage: number
  hoursToday: number
  totalHoursOperated: number
  performance: number
  condition: string
  conditionColor: string
  humidity: number
  powerConsumption: number
  lastService: string
  nextServiceDue: string
  warrantyStatus: string
}

// Returns a mock device data object. In a real app this would fetch from an API.
export function getMockDeviceData(deviceId: string, room: string): DeviceData {
  const performance = 95
  const condition = performance >= 90 ? 'Good' : performance >= 70 ? 'Fair' : 'Poor'
  const conditionColor =
    performance >= 90 ? 'text-green-500' :
    performance >= 70 ? 'text-yellow-500' :
    'text-red-500'

  return {
    deviceId,
    location: room || 'Conference Room A',
    status: 'ON',
    temperature: 22.5,
    current: 8.5,
    voltage: 230,
    hoursToday: 6.5,
    totalHoursOperated: 1245.5,
    performance,
    condition,
    conditionColor,
    humidity: 55,
    powerConsumption: 2.4,
    lastService: '15 days ago',
    nextServiceDue: '75 days',
    warrantyStatus: 'Active',
  }
}

import { downloadPdfReport } from './pdf-utils'

export function exportDeviceReport(deviceData: DeviceData) {
  const dateStr = new Date().toISOString().split('T')[0]
  downloadPdfReport(
    `${deviceData.deviceId}_report_${dateStr}.pdf`,
    `Device Report - ${deviceData.deviceId}`,
    [
      {
        title: 'Device Info',
        lines: [
          `Device ID: ${deviceData.deviceId}`,
          `Location: ${deviceData.location}`,
          `Room: ${deviceData.location}`,
        ],
      },
      {
        title: 'Current Status',
        lines: [
          `Status: ${deviceData.status}`,
          `Performance: ${deviceData.performance}%`,
          `Condition: ${deviceData.condition}`,
          `Runtime Today: ${deviceData.hoursToday} hours`,
          `Total Hours Operated: ${deviceData.totalHoursOperated}h`,
        ],
      },
      {
        title: 'Environment & Electrical',
        lines: [
          `Temperature: ${deviceData.temperature}°C`,
          `Humidity: ${deviceData.humidity}%`,
          `Current: ${deviceData.current}A`,
          `Voltage: ${deviceData.voltage}V`,
          `Power Consumption: ${deviceData.powerConsumption} kW`,
        ],
      },
      {
        title: 'Maintenance',
        lines: [
          `Last Service: ${deviceData.lastService}`,
          `Next Service Due: ${deviceData.nextServiceDue}`,
          `Warranty Status: ${deviceData.warrantyStatus}`,
        ],
      },
    ]
  )
}
