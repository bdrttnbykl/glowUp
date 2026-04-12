export type AuthMode = 'login' | 'register'

export type UserRole = 'member' | 'owner'
export type UserStatus = 'active' | 'inactive'

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
  service_status: string | null
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
  email: string | null
  phone: string | null
  source: 'manual' | 'appointment'
  created_at: string
}

export type CustomerDraft = {
  customer: string
  email: string
  phone: string
}

export type Product = {
  id: number
  product: string
  item_type: string | null
  transaction_type: string | null
  appointment_id: number | null
  quantity: number | null
  counterparty: string | null
  category: string | null
  cost_price: string | null
  price: string | null
  stock: string | null
  created_at: string
}

export type ProductDraft = {
  product: string
  itemType: 'Urun' | 'Hizmet'
  transactionType: string
  counterparty: string
  category: string
  costPrice: string
  price: string
  stock: string
  quantity: string
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
}

export type PackageSessionDraft = {
  staff: string
  date: string
  time: string
}

export type AppointmentClosingDraft = {
  attendanceStatus: string
  serviceStatus: string
  paymentMethod: string
  collectedAmount: string
  productSales: AppointmentClosingProductDraft[]
}

export type AppointmentClosingProductDraft = {
  id: number | null
  product: string
  price: string
  quantity: string
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
  email: string | null
  phone: string | null
  source: 'manual' | 'appointment' | 'both'
  created_at: string
}

export type MessageChannel = 'sms' | 'email'

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

export type StaffCompensationSetting = {
  id: number
  user_id: string
  staff_name: string
  fixed_salary: number | string | null
  bonus_rate: number | string | null
  created_at: string
  updated_at: string
}

export type PersonnelCompensationRow = PersonnelReportRow & {
  bonusAmount: number
  bonusRate: number
  earnedAmount: number
  fixedSalary: number
}

export type PersonnelDetailEntry = {
  amount: number
  customer: string
  kind: 'Hizmet' | 'Paket'
  label: string
  occurredAt: string
  paymentMethod: string | null
  phone: string | null
}

export type InviteStatus = 'expired' | 'pending' | 'revoked' | 'used'

export type ManagedUser = {
  createdAt: string
  email: string
  id: string
  invitedByEmail: string | null
  role: UserRole
  status: UserStatus
}

export type ManagedInvite = {
  codeHint: string
  createdAt: string
  createdByEmail: string | null
  email: string
  expiresAt: string
  id: number
  status: InviteStatus
  usedAt: string | null
  usedByEmail: string | null
}
