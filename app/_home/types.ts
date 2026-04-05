export type AuthMode = 'login' | 'register'

export type Appointment = {
  id: number
  customer: string | null
  phone: string | null
  service: string
  staff: string | null
  date: string | null
  time: string | null
  status: string | null
  total_price: string | null
  creator: string | null
  attendance_status: string | null
  payment_method: string | null
  collected_amount: string | null
  closed_at: string | null
  package_sale_id: number | null
  package_session_number: number | null
  package_session_consumed_at: string | null
  created_at: string
}

export type AppointmentDraft = {
  customer: string
  phone: string
  service: string
  staff: string
  date: string
  time: string
  status: string
  totalPrice: string
  creator: string
}

export type Customer = {
  id: number
  customer: string
  phone: string | null
  source: 'manual' | 'appointment'
  created_at: string
}

export type CustomerDraft = {
  customer: string
  phone: string
}

export type Product = {
  id: number
  product: string
  transaction_type: string | null
  counterparty: string | null
  category: string | null
  cost_price: string | null
  price: string | null
  stock: string | null
  created_at: string
}

export type ProductDraft = {
  product: string
  transactionType: string
  counterparty: string
  category: string
  costPrice: string
  price: string
  stock: string
}

export type PackageSale = {
  id: number
  customer: string
  phone: string | null
  package_name: string
  session_type: string
  total_sessions: number
  used_sessions: number
  price: string | null
  payment_method: string | null
  created_at: string
}

export type PackageSaleDraft = {
  customer: string
  phone: string
  packageName: string
  sessionType: string
  totalSessions: string
  price: string
  staff: string
  firstSessionDate: string
  firstSessionTime: string
}

export type PackageSessionDraft = {
  staff: string
  date: string
  time: string
}

export type AppointmentClosingDraft = {
  attendanceStatus: string
  paymentMethod: string
  collectedAmount: string
}

export type AppointmentRow = Appointment & {
  createdLabel: string
  createdTime: string
}

export type CalendarAppointment = AppointmentRow & {
  calendarDate: string
  slotIndex: number
}

export type MergedCustomer = {
  id: number
  customer: string
  phone: string | null
  source: 'manual' | 'appointment' | 'both'
  created_at: string
}

export type CashReportSection = {
  key: string
  label: string
  value: string
  items: readonly (readonly [string, string])[]
}

export type CashReportPeriod = 'Bu hafta' | 'Bu ay' | 'Bu yil'

export type PackageSaleRow = PackageSale & {
  remaining_sessions: number
  has_open_appointment: boolean
}

export type PersonnelReportRow = {
  staff: string
  completedAppointments: number
  appointmentRevenue: number
  packageSales: number
  packageRevenue: number
  totalTransactions: number
  totalRevenue: number
}
