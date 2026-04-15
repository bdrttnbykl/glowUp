'use client'

import { useEffect, useEffectEvent, useState } from 'react'
import {
  defaultAppointmentClosingDraft,
  defaultAppointmentDraft,
  defaultCustomerDraft,
  defaultPackageSaleDraft,
  defaultPackageSessionDraft,
  defaultProductDraft,
  monthLabels,
  serviceOptions,
  sidebarItems,
  weekDayLongLabels,
} from '@/app/_home/constants'
import { DashboardBreadcrumb } from '@/app/_home/components/dashboard-breadcrumb'
import { DashboardHeader } from '@/app/_home/components/dashboard-header'
import { DashboardSidebar } from '@/app/_home/components/dashboard-sidebar'
import { AccountSettingsModal } from '@/app/_home/modals/account-settings-modal'
import { AppointmentClosingModal } from '@/app/_home/modals/appointment-closing-modal'
import { AppointmentModal } from '@/app/_home/modals/appointment-modal'
import { CustomerModal } from '@/app/_home/modals/customer-modal'
import { MessageModal } from '@/app/_home/modals/message-modal'
import { PackageSaleModal } from '@/app/_home/modals/package-sale-modal'
import { PackageSessionModal } from '@/app/_home/modals/package-session-modal'
import { PersonnelDetailModal } from '@/app/_home/modals/personnel-detail-modal'
import { ProductHistoryModal } from '@/app/_home/modals/product-history-modal'
import { ProductModal } from '@/app/_home/modals/product-modal'
import { CalendarPage } from '@/app/_home/pages/calendar-page'
import { AccessManagementPage } from '@/app/_home/pages/access-management-page'
import { AppointmentsPage } from '@/app/_home/pages/appointments-page'
import { CashReportPage } from '@/app/_home/pages/cash-report-page'
import { CustomersPage } from '@/app/_home/pages/customers-page'
import { PackageSalesPage } from '@/app/_home/pages/package-sales-page'
import { PersonnelReportPage } from '@/app/_home/pages/personnel-report-page'
import { ProductsPage } from '@/app/_home/pages/products-page'
import { OverviewPage } from '@/app/_home/pages/overview-page'
import { SalesReportPage } from '@/app/_home/pages/sales-report-page'
import type {
  Appointment,
  AppointmentRow,
  AppointmentClosingDraft,
  AppointmentDraft,
  AuthMode,
  CalendarAppointment,
  CashReportPeriod,
  CashReportSection,
  Customer,
  CustomerDraft,
  ManagedInvite,
  ManagedUser,
  ManagedUserDetail,
  MessageChannel,
  MergedCustomer,
  PackageSale,
  PackageSaleDraft,
  PackageSaleRow,
  PackageSessionDraft,
  PersonnelCompensationRow,
  PersonnelDetailEntry,
  PersonnelReportRow,
  Product,
  ProductDraft,
  StaffMember,
  StaffCompensationSetting,
  UserRole,
  UserStatus,
} from '@/app/_home/types'
import {
  addDays,
  addMonths,
  createDateFromIso,
  downloadPdfFile,
  formatDisplayDate,
  formatCurrencyValue,
  formatDateIso,
  formatMonthRangeLabel,
  formatWeekRangeLabel,
  getMonthGridDates,
  getTimeSlotIndex,
  getTodayDateInputValue,
  getWeekDates,
  isCompletedAppointmentService,
  isDateWithinReportPeriod,
  parseCurrencyValue,
  shouldConsumeAppointmentPackageSession,
  normalizeAppointmentServiceStatus,
} from '@/app/_home/utils'
import { supabase } from '@/lib/supabase'

type NormalizedAppointmentProductSale = {
  id: number | null
  product: string
  price: string
  quantity: number
}

type StaffCompensationDraft = {
  bonusRate: string
  fixedSalary: string
}

const getPreferredMessageChannel = (
  customer?: Pick<MergedCustomer, 'email' | 'phone'> | null
): MessageChannel => {
  return customer?.phone?.trim() ? 'sms' : 'email'
}

const createDefaultMessageBody = (customerName: string) => {
  return `Merhaba ${customerName}, `
}

const defaultBrandName = 'glowUp'
const defaultBusinessName = 'Pera Beauty House'
const inviteCodeInputPattern = /[^a-z0-9]/gi

type RegisterStep = 'create-password' | 'verify-invite'

const normalizeInviteCodeInput = (value: string) =>
  value.replace(inviteCodeInputPattern, '').toUpperCase()

const hasMissingProfileStatusError = (message: string) =>
  message.toLowerCase().includes('status') && message.toLowerCase().includes('profiles')

const hasRecoveryParamsInUrl = () => {
  if (typeof window === 'undefined') {
    return false
  }

  const normalizedSearch = window.location.search.toLowerCase()
  const normalizedHash = window.location.hash.toLowerCase()

  return normalizedSearch.includes('type=recovery') || normalizedHash.includes('type=recovery')
}

const getReportPeriodStart = (period: CashReportPeriod, referenceDate = new Date()) => {
  const periodStart = new Date(referenceDate)
  periodStart.setHours(0, 0, 0, 0)

  if (period === 'Bu hafta') {
    const day = periodStart.getDay()
    const diff = day === 0 ? -6 : 1 - day
    periodStart.setDate(periodStart.getDate() + diff)
  } else if (period === 'Bu ay') {
    periodStart.setDate(1)
  } else {
    periodStart.setMonth(0, 1)
  }

  return periodStart
}

const createCustomerSalesKey = (customer: string | null) => {
  const normalizedCustomer = (customer || '').trim().toLocaleLowerCase('tr-TR')

  if (!normalizedCustomer) {
    return ''
  }

  return normalizedCustomer
}

const getPercentageDelta = (currentValue: number, previousValue: number) => {
  if (previousValue === 0) {
    return currentValue === 0 ? 0 : null
  }

  return ((currentValue - previousValue) / previousValue) * 100
}

type SalesTimelineEvent = {
  amount: number
  category: 'package' | 'product' | 'service'
  occurredAt: string
}

const addSalesTimelineAmount = (
  row: {
    packageRevenue: number
    productRevenue: number
    serviceRevenue: number
    totalRevenue: number
  },
  category: SalesTimelineEvent['category'],
  amount: number
) => {
  row.totalRevenue += amount

  if (category === 'service') {
    row.serviceRevenue += amount
    return
  }

  if (category === 'product') {
    row.productRevenue += amount
    return
  }

  row.packageRevenue += amount
}

const createSalesTimelineRows = (
  period: CashReportPeriod,
  events: readonly SalesTimelineEvent[],
  referenceDate = new Date()
) => {
  const periodStart = getReportPeriodStart(period, referenceDate)
  const rows: Array<{
    label: string
    packageRevenue: number
    productRevenue: number
    serviceRevenue: number
    shortLabel: string
    totalRevenue: number
  }> = []
  const rowLookup = new Map<string, (typeof rows)[number]>()

  if (period === 'Bu yil') {
    for (let monthIndex = 0; monthIndex <= referenceDate.getMonth(); monthIndex += 1) {
      const row = {
        label: monthLabels[monthIndex],
        shortLabel: monthLabels[monthIndex].slice(0, 3),
        serviceRevenue: 0,
        productRevenue: 0,
        packageRevenue: 0,
        totalRevenue: 0,
      }
      const key = `${referenceDate.getFullYear()}-${monthIndex}`
      rows.push(row)
      rowLookup.set(key, row)
    }

    events.forEach((item) => {
      const date = new Date(item.occurredAt)

      if (Number.isNaN(date.getTime())) {
        return
      }

      if (date.getTime() < periodStart.getTime() || date.getTime() > referenceDate.getTime()) {
        return
      }

      const row = rowLookup.get(`${date.getFullYear()}-${date.getMonth()}`)

      if (!row) {
        return
      }

      addSalesTimelineAmount(row, item.category, item.amount)
    })

    return rows
  }

  const cursor = new Date(periodStart)

  while (cursor.getTime() <= referenceDate.getTime()) {
    const row = {
      label: `${cursor.getDate()} ${monthLabels[cursor.getMonth()]} ${weekDayLongLabels[(cursor.getDay() + 6) % 7]}`,
      shortLabel: `${cursor.getDate()} ${monthLabels[cursor.getMonth()].slice(0, 3)}`,
      serviceRevenue: 0,
      productRevenue: 0,
      packageRevenue: 0,
      totalRevenue: 0,
    }
    const key = formatDateIso(cursor)
    rows.push(row)
    rowLookup.set(key, row)
    cursor.setDate(cursor.getDate() + 1)
  }

  events.forEach((item) => {
    const date = new Date(item.occurredAt)

    if (Number.isNaN(date.getTime())) {
      return
    }

    if (date.getTime() < periodStart.getTime() || date.getTime() > referenceDate.getTime()) {
      return
    }

    const row = rowLookup.get(formatDateIso(date))

    if (!row) {
      return
    }

    addSalesTimelineAmount(row, item.category, item.amount)
  })

  return rows
}

export default function Home() {
  const [overviewPersonnelPeriod, setOverviewPersonnelPeriod] = useState<'Bugun' | 'Bu hafta' | 'Bu ay'>(
    'Bu ay'
  )
  const [mode, setMode] = useState<AuthMode>('login')
  const [registerStep, setRegisterStep] = useState<RegisterStep>('verify-invite')
  const [activeSection, setActiveSection] = useState('Randevular')
  const [calendarView, setCalendarView] = useState('Gunluk gorunum')
  const [calendarDate, setCalendarDate] = useState(getTodayDateInputValue())
  const [calendarStaffFilter, setCalendarStaffFilter] = useState('Tum personeller')
  const [cashReportPeriod, setCashReportPeriod] = useState<CashReportPeriod>('Bu ay')
  const [cashReportStartDate, setCashReportStartDate] = useState('')
  const [cashReportEndDate, setCashReportEndDate] = useState('')
  const [personnelReportStartDate, setPersonnelReportStartDate] = useState('')
  const [personnelReportEndDate, setPersonnelReportEndDate] = useState('')
  const [salesReportTarget, setSalesReportTarget] = useState('100000')
  const [isReportMenuOpen, setIsReportMenuOpen] = useState(false)
  const [openCashReportSections, setOpenCashReportSections] = useState<string[]>([
    'total',
    'income',
  ])
  const [isCalendarViewMenuOpen, setIsCalendarViewMenuOpen] = useState(false)
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false)
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false)
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isPackageSaleModalOpen, setIsPackageSaleModalOpen] = useState(false)
  const [isPackageSessionModalOpen, setIsPackageSessionModalOpen] = useState(false)
  const [isAppointmentClosingModalOpen, setIsAppointmentClosingModalOpen] = useState(false)
  const [isPersonnelDetailModalOpen, setIsPersonnelDetailModalOpen] = useState(false)
  const [isProductHistoryModalOpen, setIsProductHistoryModalOpen] = useState(false)
  const [isAccountSettingsModalOpen, setIsAccountSettingsModalOpen] = useState(false)
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false)
  const [isPasswordRecoveryMode, setIsPasswordRecoveryMode] = useState(false)
  const [userId, setUserId] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userRole, setUserRole] = useState<UserRole>('member')
  const [brandName, setBrandName] = useState(defaultBrandName)
  const [businessName, setBusinessName] = useState(defaultBusinessName)
  const [accountBrandNameDraft, setAccountBrandNameDraft] = useState(defaultBrandName)
  const [accountBusinessNameDraft, setAccountBusinessNameDraft] = useState(defaultBusinessName)
  const [inviteEmailDraft, setInviteEmailDraft] = useState('')
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([])
  const [managedInvites, setManagedInvites] = useState<ManagedInvite[]>([])
  const [activeManagedUserId, setActiveManagedUserId] = useState<string | null>(null)
  const [activeManagedUserDetail, setActiveManagedUserDetail] = useState<ManagedUserDetail | null>(null)
  const [isManagedUserDetailLoading, setIsManagedUserDetailLoading] = useState(false)
  const [lastCreatedInvite, setLastCreatedInvite] = useState<{
    code: string
    email: string
    expiresAt: string
    id: number
  } | null>(null)
  const [appointmentDraft, setAppointmentDraft] = useState<AppointmentDraft>(
    defaultAppointmentDraft
  )
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [packageSales, setPackageSales] = useState<PackageSale[]>([])
  const [staffCompensationSettings, setStaffCompensationSettings] = useState<
    StaffCompensationSetting[]
  >([])
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [staffCompensationDrafts, setStaffCompensationDrafts] = useState<
    Record<string, StaffCompensationDraft>
  >({})
  const [staffDraft, setStaffDraft] = useState('')
  const [staffServiceDraft, setStaffServiceDraft] = useState<string[]>([])
  const [editingStaffMemberId, setEditingStaffMemberId] = useState<number | null>(null)
  const [isStaffCreatePanelOpen, setIsStaffCreatePanelOpen] = useState(false)
  const [customerDraft, setCustomerDraft] = useState<CustomerDraft>(defaultCustomerDraft)
  const [editingCustomerId, setEditingCustomerId] = useState<number | null>(null)
  const [productDraft, setProductDraft] = useState<ProductDraft>(defaultProductDraft)
  const [editingProductId, setEditingProductId] = useState<number | null>(null)
  const [packageSaleDraft, setPackageSaleDraft] = useState<PackageSaleDraft>(
    defaultPackageSaleDraft
  )
  const [packageSessionDraft, setPackageSessionDraft] = useState<PackageSessionDraft>(
    defaultPackageSessionDraft
  )
  const [activePackageSaleId, setActivePackageSaleId] = useState<number | null>(null)
  const [activePersonnelName, setActivePersonnelName] = useState<string | null>(null)
  const [activeProductName, setActiveProductName] = useState<string | null>(null)
  const [activeMessageCustomer, setActiveMessageCustomer] = useState<MergedCustomer | null>(null)
  const [closingAppointmentId, setClosingAppointmentId] = useState<number | null>(null)
  const [editingAppointmentId, setEditingAppointmentId] = useState<number | null>(null)
  const [appointmentClosingDraft, setAppointmentClosingDraft] = useState<AppointmentClosingDraft>(
    defaultAppointmentClosingDraft
  )
  const [loading, setLoading] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [isAccessLoading, setIsAccessLoading] = useState(false)
  const [isCreatingInvite, setIsCreatingInvite] = useState(false)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
  const [revokingInviteId, setRevokingInviteId] = useState<number | null>(null)
  const [messageChannel, setMessageChannel] = useState<MessageChannel>('sms')
  const [messageBody, setMessageBody] = useState('')
  const [messageSubject, setMessageSubject] = useState('')
  const [message, setMessage] = useState('')
  const [savingCompensationStaff, setSavingCompensationStaff] = useState<string | null>(null)
  const [creatingStaff, setCreatingStaff] = useState(false)
  const [deletingStaffId, setDeletingStaffId] = useState<number | null>(null)
  const [sendingMessage, setSendingMessage] = useState(false)

  const handlePlaceholderAction = (label: string) => {
    if (label === 'Ayar') {
      setIsAccountSettingsModalOpen(true)
      setMessage('')
      return
    }

    setMessage(`${label} ozelligi hazirlaniyor.`)
  }

  const resetStaffEditor = () => {
    setStaffDraft('')
    setStaffServiceDraft([])
    setEditingStaffMemberId(null)
    setIsStaffCreatePanelOpen(false)
  }

  const openAccountSettingsModal = () => {
    setAccountBrandNameDraft(brandName)
    setAccountBusinessNameDraft(businessName)
    resetStaffEditor()
    setIsAccountSettingsModalOpen(true)
    setMessage('')
  }

  const closeAccountSettingsModal = () => {
    setAccountBrandNameDraft(brandName)
    setAccountBusinessNameDraft(businessName)
    resetStaffEditor()
    setIsAccountSettingsModalOpen(false)
  }

  const toggleStaffCreatePanel = () => {
    if (isStaffCreatePanelOpen) {
      resetStaffEditor()
      return
    }

    setStaffDraft('')
    setStaffServiceDraft([])
    setEditingStaffMemberId(null)
    setIsStaffCreatePanelOpen(true)
  }

  const startEditingStaffMember = (staffId: number) => {
    const targetStaff = staffMembers.find((item) => item.id === staffId)

    if (!targetStaff) {
      setMessage('Duzenlenecek personel bulunamadi.')
      return
    }

    setEditingStaffMemberId(staffId)
    setStaffDraft(targetStaff.name)
    setStaffServiceDraft(targetStaff.services || [])
    setIsStaffCreatePanelOpen(true)
    setMessage('')
  }

  const handleSectionChange = (section: string) => {
    setActiveSection(section)
    if (section !== 'Raporlar') {
      setIsReportMenuOpen(false)
    }
    setMessage(
      section === 'Ozet' ||
        section === 'Randevular' ||
        section === 'Randevu takvimi' ||
        section === 'Urun ve hizmet' ||
        section === 'Paket satislari' ||
        section === 'Musteriler' ||
        section === 'Kullanicilar'
        ? ''
        : `${section} bolumu hazirlaniyor.`
    )
  }

  const handleReportMenuToggle = () => {
    setIsReportMenuOpen((current) => !current)
    setActiveSection('Raporlar')
    setMessage('Raporlar bolumu hazirlaniyor.')
  }

  const handleReportSectionChange = (section: string) => {
    setActiveSection(section)
    setIsReportMenuOpen(true)
    setMessage(
      section === 'Kasa raporu' || section === 'Personel raporu'
        || section === 'Satis raporlari'
        ? ''
        : `${section} hazirlaniyor.`
    )
  }

  const handleQuickActionSectionSelect = (section: string) => {
    setIsQuickActionsOpen(false)
    setActiveSection(section)
    setMessage('')
  }

  const openAppointmentModal = () => {
    setActiveSection('Randevular')
    setIsQuickActionsOpen(false)
    setEditingAppointmentId(null)
    setAppointmentDraft((current) => ({
      ...defaultAppointmentDraft,
      date: current.date || calendarDate || getTodayDateInputValue(),
      creator: current.creator || userEmail,
    }))
    setMessage('')
    setIsAppointmentModalOpen(true)
  }

  const closeAppointmentModal = () => {
    setEditingAppointmentId(null)
    setAppointmentDraft(defaultAppointmentDraft)
    setIsAppointmentModalOpen(false)
  }

  const openCustomerModal = (customer?: MergedCustomer) => {
    setActiveSection('Musteriler')
    setIsQuickActionsOpen(false)
    const matchedCustomer =
      customer && customer.source === 'appointment'
        ? customers.find(
            (item) =>
              item.customer.trim().toLocaleLowerCase('tr-TR') ===
                customer.customer.trim().toLocaleLowerCase('tr-TR') &&
              (item.phone || '').trim() === (customer.phone || '').trim()
          )
        : null
    setEditingCustomerId(matchedCustomer?.id || (customer?.source === 'appointment' ? null : customer?.id || null))
    setCustomerDraft(
      customer
        ? {
            customer: customer.customer,
            email: (customer.email || '').trim(),
            phone: (customer.phone || '').trim(),
          }
        : defaultCustomerDraft
    )
    setMessage('')
    setIsCustomerModalOpen(true)
  }

  const closeCustomerModal = () => {
    setEditingCustomerId(null)
    setCustomerDraft(defaultCustomerDraft)
    setIsCustomerModalOpen(false)
  }

  const openMessageModal = (customer: MergedCustomer) => {
    const nextChannel = getPreferredMessageChannel(customer)

    setActiveSection('Musteriler')
    setActiveMessageCustomer(customer)
    setMessageChannel(nextChannel)
    setMessageBody(createDefaultMessageBody(customer.customer))
    setMessageSubject(`${businessName} bildirimi`)
    setMessage('')
    setIsMessageModalOpen(true)
  }

  const closeMessageModal = () => {
    setActiveMessageCustomer(null)
    setMessageChannel('sms')
    setMessageBody('')
    setMessageSubject('')
    setIsMessageModalOpen(false)
  }

  const openProductModal = (product?: Product) => {
    setActiveSection('Urun ve hizmet')
    setIsQuickActionsOpen(false)
    setEditingProductId(product?.id || null)
    setProductDraft(
      product
        ? {
            product: product.product || '',
            itemType: product.item_type === 'Hizmet' ? 'Hizmet' : 'Urun',
            transactionType: product.transaction_type || 'Alis',
            counterparty: product.counterparty || '',
            category: product.category || '',
            costPrice: product.cost_price || '',
            price: product.price || '',
            stock: product.stock || '',
            quantity: product.quantity ? `${product.quantity}` : '',
          }
        : defaultProductDraft
    )
    setMessage('')
    setIsProductModalOpen(true)
  }

  const closeProductModal = () => {
    setEditingProductId(null)
    setProductDraft(defaultProductDraft)
    setIsProductModalOpen(false)
  }

  const openPackageSaleModal = () => {
    setActiveSection('Paket satislari')
    setIsQuickActionsOpen(false)
    setPackageSaleDraft(defaultPackageSaleDraft)
    setMessage('')
    setIsPackageSaleModalOpen(true)
  }

  const closePackageSaleModal = () => {
    setIsPackageSaleModalOpen(false)
  }

  const openPackageSessionModal = (item: PackageSaleRow) => {
    const openAppointment = appointments.find(
      (appointment) => appointment.package_sale_id === item.id && !appointment.closed_at
    )

    if (openAppointment) {
      setMessage('Bu paketin acik seansi zaten var. Onu duzenleyebilirsin.')
      startEditingNote(openAppointment)
      return
    }

    if (item.remaining_sessions === 0) {
      setMessage('Bu pakette kullanilacak seans kalmadi.')
      return
    }

    setActivePackageSaleId(item.id)
    setPackageSessionDraft({
      ...defaultPackageSessionDraft,
      date: calendarDate || getTodayDateInputValue(),
    })
    setMessage('')
    setIsPackageSessionModalOpen(true)
  }

  const closePackageSessionModal = () => {
    setActivePackageSaleId(null)
    setPackageSessionDraft(defaultPackageSessionDraft)
    setIsPackageSessionModalOpen(false)
  }

  const openAppointmentClosingModal = (item: Appointment) => {
    const linkedProductSales = products.filter(
      (product) =>
        product.appointment_id === item.id &&
        product.item_type === 'Urun' &&
        product.transaction_type === 'Satis'
    )

    setClosingAppointmentId(item.id)
    setAppointmentClosingDraft({
      attendanceStatus: item.attendance_status || 'Geldi',
      serviceStatus: normalizeAppointmentServiceStatus(item.attendance_status, item.service_status),
      paymentMethod: item.package_sale_id ? '' : item.payment_method || 'Nakit',
      collectedAmount: item.package_sale_id ? '' : item.collected_amount || item.total_price || '',
      productSales: linkedProductSales.map((product) => ({
        id: product.id,
        product: product.product,
        price: product.price || '',
        quantity: `${product.quantity || 1}`,
      })),
    })
    setMessage('')
    setIsAppointmentClosingModalOpen(true)
  }

  const closeAppointmentClosingModal = () => {
    setClosingAppointmentId(null)
    setAppointmentClosingDraft(defaultAppointmentClosingDraft)
    setIsAppointmentClosingModalOpen(false)
  }

  const openPersonnelDetailModal = (staffName: string) => {
    setActivePersonnelName(staffName)
    setMessage('')
    setIsPersonnelDetailModalOpen(true)
  }

  const closePersonnelDetailModal = () => {
    setActivePersonnelName(null)
    setIsPersonnelDetailModalOpen(false)
  }

  const openProductHistoryModal = (productName: string) => {
    setActiveProductName(productName)
    setMessage('')
    setIsProductHistoryModalOpen(true)
  }

  const closeProductHistoryModal = () => {
    setActiveProductName(null)
    setIsProductHistoryModalOpen(false)
  }

  const clearAuthCredentials = () => {
    setPassword('')
    setPasswordConfirm('')
  }

  const resetRegisterFlow = () => {
    setInviteCode('')
    clearAuthCredentials()
    setRegisterStep('verify-invite')
  }

  const closeForgotPasswordMode = () => {
    setIsForgotPasswordMode(false)
    clearAuthCredentials()
  }

  const openForgotPasswordMode = () => {
    setMode('login')
    setIsForgotPasswordMode(true)
    setIsPasswordRecoveryMode(false)
    resetRegisterFlow()
    setMessage('')
  }

  const closePasswordRecoveryMode = () => {
    setIsPasswordRecoveryMode(false)
    setIsForgotPasswordMode(false)
    clearAuthCredentials()

    if (typeof window !== 'undefined') {
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }

  const resetAccessManagement = () => {
    setManagedUsers([])
    setManagedInvites([])
    setActiveManagedUserId(null)
    setActiveManagedUserDetail(null)
    setIsManagedUserDetailLoading(false)
    setInviteEmailDraft('')
    setLastCreatedInvite(null)
    setDeletingUserId(null)
    setUpdatingUserId(null)
    setRevokingInviteId(null)
    setIsCreatingInvite(false)
    setIsAccessLoading(false)
  }

  const clearAuthenticatedState = () => {
    setUserId('')
    setUserEmail('')
    setUserRole('member')
    setIsForgotPasswordMode(false)
    setIsPasswordRecoveryMode(false)
    setBrandName(defaultBrandName)
    setBusinessName(defaultBusinessName)
    setAccountBrandNameDraft(defaultBrandName)
    setAccountBusinessNameDraft(defaultBusinessName)
    setAppointments([])
    setCustomers([])
    setProducts([])
    setPackageSales([])
    setStaffCompensationSettings([])
    setStaffCompensationDrafts({})
    resetAccessManagement()
  }

  const signOutInactiveAccount = async () => {
    clearAuthenticatedState()
    await supabase.auth.signOut({ scope: 'local' })
    setMessage('Bu hesap pasife alindi. Owner ile iletisime gec.')
  }

  const getAccessToken = async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error || !session?.access_token) {
      throw new Error('Oturum bulunamadi. Tekrar giris yap.')
    }

    return session.access_token
  }

  const loadUserProfile = async (nextUserId: string) => {
    let { data, error } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('id', nextUserId)
      .maybeSingle()

    if (error && hasMissingProfileStatusError(error.message)) {
      const fallbackResult = await supabase
        .from('profiles')
        .select('role')
        .eq('id', nextUserId)
        .maybeSingle()

      data = fallbackResult.data
        ? {
            ...fallbackResult.data,
            status: 'active',
          }
        : null
      error = fallbackResult.error
    }

    if (error) {
      setUserRole('member')
      setMessage(
        error.message.includes('profiles') ? 'Erisim migrationlarini calistir.' : error.message
      )
      return null
    }

    const nextRole = data?.role === 'owner' ? 'owner' : 'member'
    const nextStatus = data?.status === 'inactive' ? 'inactive' : 'active'

    setUserRole(nextRole)

    return {
      role: nextRole,
      status: nextStatus,
    }
  }

  const loadAccessManagement = async () => {
    if (userRole !== 'owner') {
      resetAccessManagement()
      return
    }

    setIsAccessLoading(true)

    try {
      const accessToken = await getAccessToken()
      const response = await fetch('/api/owner/access', {
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      const payload = (await response.json()) as {
        error?: string
        invites?: ManagedInvite[]
        users?: ManagedUser[]
      }

      if (!response.ok) {
        throw new Error(payload.error || 'Erisim verileri yuklenemedi.')
      }

      setManagedUsers(payload.users || [])
      setManagedInvites(payload.invites || [])
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erisim verileri yuklenemedi.')
    } finally {
      setIsAccessLoading(false)
    }
  }

  const closeManagedUserDetail = () => {
    setActiveManagedUserId(null)
    setActiveManagedUserDetail(null)
    setIsManagedUserDetailLoading(false)
  }

  const loadManagedUserDetail = async (targetUser: ManagedUser) => {
    setActiveManagedUserId(targetUser.id)
    setActiveManagedUserDetail(null)
    setIsManagedUserDetailLoading(true)

    try {
      const accessToken = await getAccessToken()
      const response = await fetch(`/api/owner/access/users/${targetUser.id}`, {
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      const payload = (await response.json()) as {
        detail?: ManagedUserDetail
        error?: string
      }

      if (!response.ok || !payload.detail) {
        throw new Error(payload.error || 'Kullanici detayi yuklenemedi.')
      }

      setActiveManagedUserDetail(payload.detail)
    } catch (error) {
      setActiveManagedUserId(null)
      setActiveManagedUserDetail(null)
      setMessage(error instanceof Error ? error.message : 'Kullanici detayi yuklenemedi.')
    } finally {
      setIsManagedUserDetailLoading(false)
    }
  }

  const syncUserProfile = useEffectEvent(async (nextUserId: string) => {
    const profile = await loadUserProfile(nextUserId)

    if (profile?.status === 'inactive') {
      await signOutInactiveAccount()
    }
  })

  const syncAccessManagement = useEffectEvent(async () => {
    await loadAccessManagement()
  })

  const checkUser = async () => {
    const { data, error } = await supabase.auth.getUser()

    if (error || !data.user) {
      clearAuthenticatedState()
      resetRegisterFlow()
      return false
    }

    setUserId(data.user.id)
    setUserEmail(data.user.email || '')
    const profile = await loadUserProfile(data.user.id)

    if (profile?.status === 'inactive') {
      await signOutInactiveAccount()
      return false
    }

    setBrandName(
      typeof data.user.user_metadata?.brand_name === 'string' &&
        data.user.user_metadata.brand_name.trim()
        ? data.user.user_metadata.brand_name.trim()
        : defaultBrandName
    )
    setBusinessName(
      typeof data.user.user_metadata?.business_name === 'string' &&
        data.user.user_metadata.business_name.trim()
        ? data.user.user_metadata.business_name.trim()
        : defaultBusinessName
    )
    setAccountBrandNameDraft(
      typeof data.user.user_metadata?.brand_name === 'string' &&
        data.user.user_metadata.brand_name.trim()
        ? data.user.user_metadata.brand_name.trim()
        : defaultBrandName
    )
    setAccountBusinessNameDraft(
      typeof data.user.user_metadata?.business_name === 'string' &&
        data.user.user_metadata.business_name.trim()
        ? data.user.user_metadata.business_name.trim()
        : defaultBusinessName
    )

    return true
  }

  const getAppointments = async () => {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('id', { ascending: false })

    if (error) {
      setMessage(error.message)
      return
    }

    setAppointments((data as Appointment[]) || [])
  }

  const getCustomers = async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('id', { ascending: false })

    if (error) {
      setMessage(error.message)
      return
    }

    setCustomers((data as Customer[]) || [])
  }

  const getProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('id', { ascending: false })

    if (error) {
      setMessage(error.message)
      return
    }

    setProducts((data as Product[]) || [])
  }

  const getPackageSales = async () => {
    const { data, error } = await supabase
      .from('package_sales')
      .select('*')
      .order('id', { ascending: false })

    if (error) {
      setMessage(
        error.message.includes('package_sales')
          ? 'Package sales migrationlarini calistir.'
          : error.message
      )
      return
    }

    setPackageSales((data as PackageSale[]) || [])
  }

  const getStaffCompensationSettings = async () => {
    const { data, error } = await supabase
      .from('staff_compensation_settings')
      .select('*')
      .order('staff_name', { ascending: true })

    if (error) {
      setMessage(
        error.message.includes('staff_compensation_settings')
          ? 'Maas ayari migrationini calistir.'
          : error.message
      )
      return
    }

    const nextSettings = (data as StaffCompensationSetting[]) || []

    setStaffCompensationSettings(nextSettings)
    setStaffCompensationDrafts(
      nextSettings.reduce<Record<string, StaffCompensationDraft>>((result, item) => {
        result[item.staff_name] = {
          bonusRate:
            item.bonus_rate == null || Number(item.bonus_rate) === 0
              ? ''
              : `${Number(item.bonus_rate)}`,
          fixedSalary:
            item.fixed_salary == null || Number(item.fixed_salary) === 0
              ? ''
              : `${Number(item.fixed_salary)}`,
        }
        return result
      }, {})
    )
  }

  const getStaffMembers = async () => {
    const { data, error } = await supabase
      .from('staff_members')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      setMessage(
        error.message.includes('staff_members')
          ? 'Personel migrationini calistir.'
          : error.message
      )
      return
    }

    setStaffMembers((data as StaffMember[]) || [])
  }

  const loadAppointments = useEffectEvent(async () => {
    await getAppointments()
  })

  const loadCustomers = useEffectEvent(async () => {
    await getCustomers()
  })

  const loadProducts = useEffectEvent(async () => {
    await getProducts()
  })

  const loadPackageSales = useEffectEvent(async () => {
    await getPackageSales()
  })

  const loadStaffCompensationSettings = useEffectEvent(async () => {
    await getStaffCompensationSettings()
  })

  const loadStaffMembers = useEffectEvent(async () => {
    await getStaffMembers()
  })

  const verifyInviteForRegistration = async () => {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/auth/verify-invite', {
        body: JSON.stringify({
          email,
          inviteCode,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })
      const payload = (await response.json()) as { email?: string; error?: string }

      if (!response.ok) {
        throw new Error(payload.error || 'Davet kodu dogrulanamadi.')
      }

      setEmail(payload.email || email.trim().toLowerCase())
      setRegisterStep('create-password')
      setMessage('Davet kodu dogrulandi. Simdi sifreni olustur.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Davet kodu dogrulanamadi.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    if (registerStep === 'verify-invite') {
      await verifyInviteForRegistration()
      return
    }

    if (password.trim().length < 8) {
      setMessage('Sifre en az 8 karakter olmali.')
      return
    }

    if (password !== passwordConfirm) {
      setMessage('Sifre tekrar alani eslesmiyor.')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/auth/register-with-invite', {
        body: JSON.stringify({
          email,
          inviteCode,
          password,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })
      const payload = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(payload.error || 'Kayit tamamlanamadi.')
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (error) {
        throw new Error(error.message)
      }

      const isActive = await checkUser()

      if (!isActive) {
        return
      }

      await getAppointments()
      await getCustomers()
      await getProducts()
      await getPackageSales()
      await getStaffCompensationSettings()
      resetRegisterFlow()
      closeForgotPasswordMode()
      setMessage('Kayit ve giris tamamlandi.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Kayit tamamlanamadi.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPasswordRequest = async () => {
    const trimmedEmail = email.trim().toLowerCase()

    if (!trimmedEmail) {
      setMessage('Sifirlama maili icin email gir.')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const redirectTo =
        typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : undefined
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo,
      })

      if (error) {
        throw new Error(error.message)
      }

      setMessage('Sifre yenileme linki email adresine gonderildi.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Sifirlama maili gonderilemedi.')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordRecoveryReset = async () => {
    if (password.trim().length < 8) {
      setMessage('Sifre en az 8 karakter olmali.')
      return
    }

    if (password !== passwordConfirm) {
      setMessage('Sifre tekrar alani eslesmiyor.')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      })

      if (error) {
        throw new Error(error.message)
      }

      await supabase.auth.signOut({ scope: 'local' })
      clearAuthenticatedState()
      closePasswordRecoveryMode()
      setMode('login')
      setMessage('Sifren guncellendi. Yeni sifren ile giris yapabilirsin.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Sifre guncellenemedi.')
    } finally {
      setLoading(false)
    }
  }

  const cancelPasswordRecoveryFlow = async () => {
    setLoading(true)

    try {
      await supabase.auth.signOut({ scope: 'local' })
      clearAuthenticatedState()
      closePasswordRecoveryMode()
      setMode('login')
      setMessage('')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(
        error.message.toLowerCase().includes('banned')
          ? 'Bu hesap pasife alindi. Owner ile iletisime gec.'
          : error.message
      )
      setLoading(false)
      return
    }

    const isActive = await checkUser()

    if (!isActive) {
      setLoading(false)
      return
    }

    await getAppointments()
    await getCustomers()
    await getProducts()
    await getPackageSales()
    await getStaffMembers()
    await getStaffCompensationSettings()
    closeForgotPasswordMode()
    setMessage('Giris basarili.')
    setLoading(false)
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    setLoading(true)
    setMessage('')
    setEmail('')
    resetRegisterFlow()
    setUserId('')
    setUserEmail('')
    setUserRole('member')
    setBrandName(defaultBrandName)
    setBusinessName(defaultBusinessName)
    setAccountBrandNameDraft(defaultBrandName)
    setAccountBusinessNameDraft(defaultBusinessName)
    setAppointmentDraft(defaultAppointmentDraft)
    setAppointments([])
    setCustomers([])
    setProducts([])
    setPackageSales([])
    setStaffMembers([])
    resetStaffEditor()
    setStaffCompensationSettings([])
    setStaffCompensationDrafts({})
    resetAccessManagement()
    setCustomerDraft(defaultCustomerDraft)
    setEditingCustomerId(null)
    setProductDraft(defaultProductDraft)
    setEditingProductId(null)
    setPackageSaleDraft(defaultPackageSaleDraft)
    setEditingAppointmentId(null)
    setIsAccountSettingsModalOpen(false)

    const { error } = await supabase.auth.signOut({ scope: 'local' })

    if (error) {
      setMessage(error.message)
      await checkUser()
      await getAppointments()
      await getCustomers()
      await getProducts()
      await getPackageSales()
      await getStaffMembers()
      await getStaffCompensationSettings()
      setLoggingOut(false)
      setLoading(false)
      return
    }

    setLoggingOut(false)
    setLoading(false)
  }

  const createInviteCode = async () => {
    const trimmedInviteEmail = inviteEmailDraft.trim().toLowerCase()

    if (!trimmedInviteEmail) {
      setMessage('Davet olusturmak icin email gir.')
      return
    }

    setIsCreatingInvite(true)
    setMessage('')

    try {
      const accessToken = await getAccessToken()
      const response = await fetch('/api/owner/access', {
        body: JSON.stringify({
          email: trimmedInviteEmail,
        }),
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })
      const payload = (await response.json()) as {
        code?: string
        error?: string
        invite?: ManagedInvite
      }

      if (!response.ok || !payload.code || !payload.invite) {
        throw new Error(payload.error || 'Davet kodu olusturulamadi.')
      }

      setLastCreatedInvite({
        code: payload.code,
        email: payload.invite.email,
        expiresAt: payload.invite.expiresAt,
        id: payload.invite.id,
      })
      setInviteEmailDraft('')
      await loadAccessManagement()
      setMessage(`Davet kodu hazir: ${payload.invite.email}`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Davet kodu olusturulamadi.')
    } finally {
      setIsCreatingInvite(false)
    }
  }

  const revokeInviteCode = async (inviteId: number) => {
    setRevokingInviteId(inviteId)
    setMessage('')

    try {
      const accessToken = await getAccessToken()
      const response = await fetch(`/api/owner/access/${inviteId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        method: 'DELETE',
      })
      const payload = (await response.json()) as {
        error?: string
        invite?: ManagedInvite
      }

      if (!response.ok) {
        throw new Error(payload.error || 'Davet kodu iptal edilemedi.')
      }

      setManagedInvites((current) =>
        current.map((invite) => {
          if (invite.id !== inviteId) {
            return invite
          }

          if (!payload.invite) {
            return {
              ...invite,
              status: 'revoked',
            }
          }

          return {
            ...invite,
            ...payload.invite,
          }
        })
      )
      await loadAccessManagement()
      setLastCreatedInvite((current) => (current?.id === inviteId ? null : current))
      setMessage('Davet kodu iptal edildi.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Davet kodu iptal edilemedi.')
    } finally {
      setRevokingInviteId(null)
    }
  }

  const deleteManagedUser = async (targetUser: ManagedUser) => {
    if (
      !window.confirm(
        `${targetUser.email} hesabi silinsin mi? Bu islem kullaniciya bagli tum verileri kalici olarak siler.`
      )
    ) {
      return
    }

    setDeletingUserId(targetUser.id)
    setMessage('')

    try {
      const accessToken = await getAccessToken()
      const response = await fetch(`/api/owner/access/users/${targetUser.id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        method: 'DELETE',
      })
      const payload = (await response.json()) as { email?: string; error?: string }

      if (!response.ok) {
        throw new Error(payload.error || 'Kullanici silinemedi.')
      }

      await loadAccessManagement()
      setActiveManagedUserDetail((current) => (current?.id === targetUser.id ? null : current))
      setActiveManagedUserId((current) => (current === targetUser.id ? null : current))
      setMessage(`${payload.email || targetUser.email} hesabi silindi.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Kullanici silinemedi.')
    } finally {
      setDeletingUserId(null)
    }
  }

  const setManagedUserStatus = async (targetUser: ManagedUser, nextStatus: UserStatus) => {
    const actionLabel = nextStatus === 'inactive' ? 'pasife al' : 'yeniden aktif et'

    if (
      !window.confirm(`${targetUser.email} hesabi ${actionLabel}ilsin mi?`)
    ) {
      return
    }

    setUpdatingUserId(targetUser.id)
    setMessage('')

    try {
      const accessToken = await getAccessToken()
      const response = await fetch(`/api/owner/access/users/${targetUser.id}`, {
        body: JSON.stringify({
          status: nextStatus,
        }),
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
      })
      const payload = (await response.json()) as { email?: string; error?: string; status?: UserStatus }

      if (!response.ok) {
        throw new Error(payload.error || 'Kullanici durumu guncellenemedi.')
      }

      await loadAccessManagement()
      setActiveManagedUserDetail((current) =>
        current?.id === targetUser.id
          ? {
              ...current,
              status: payload.status || nextStatus,
            }
          : current
      )
      setMessage(
        `${payload.email || targetUser.email} hesabi ${
          payload.status === 'inactive' ? 'pasife alindi.' : 'yeniden aktive edildi.'
        }`
      )
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Kullanici durumu guncellenemedi.')
    } finally {
      setUpdatingUserId(null)
    }
  }

  const saveAccountSettings = async () => {
    const trimmedBrandName = accountBrandNameDraft.trim()
    const trimmedBusinessName = accountBusinessNameDraft.trim()

    if (!trimmedBrandName) {
      setMessage('Marka adini gir.')
      return
    }

    if (!trimmedBusinessName) {
      setMessage('Isletme adini gir.')
      return
    }

    setLoading(true)
    setMessage('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setMessage('Aktif oturum bulunamadi. Tekrar giris yap.')
      setLoading(false)
      return
    }

    const { data, error } = await supabase.auth.updateUser({
      data: {
        ...user.user_metadata,
        brand_name: trimmedBrandName,
        business_name: trimmedBusinessName,
      },
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    setBrandName(
      typeof data.user?.user_metadata?.brand_name === 'string' &&
        data.user.user_metadata.brand_name.trim()
        ? data.user.user_metadata.brand_name.trim()
        : trimmedBrandName
    )
    setBusinessName(
      typeof data.user?.user_metadata?.business_name === 'string' &&
        data.user.user_metadata.business_name.trim()
        ? data.user.user_metadata.business_name.trim()
        : trimmedBusinessName
    )
    setAccountBrandNameDraft(
      typeof data.user?.user_metadata?.brand_name === 'string' &&
        data.user.user_metadata.brand_name.trim()
        ? data.user.user_metadata.brand_name.trim()
        : trimmedBrandName
    )
    setAccountBusinessNameDraft(
      typeof data.user?.user_metadata?.business_name === 'string' &&
        data.user.user_metadata.business_name.trim()
        ? data.user.user_metadata.business_name.trim()
        : trimmedBusinessName
    )
    setIsAccountSettingsModalOpen(false)
    setMessage('Hesap ayarlari guncellendi.')
    setLoading(false)
  }

  const saveStaffMember = async () => {
    const trimmedStaffName = staffDraft.trim()
    const editingStaffMember =
      editingStaffMemberId == null
        ? null
        : staffMembers.find((item) => item.id === editingStaffMemberId) || null

    if (!trimmedStaffName) {
      setMessage('Personel adini gir.')
      return
    }

    if (staffServiceDraft.length === 0) {
      setMessage('Personelin verdigi en az bir hizmet sec.')
      return
    }

    setCreatingStaff(true)
    setMessage('')

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('Aktif oturum bulunamadi. Tekrar giris yap.')
      }

      if (editingStaffMemberId != null && !editingStaffMember) {
        throw new Error('Duzenlenecek personel bulunamadi.')
      }

      const normalizedServices = Array.from(new Set(staffServiceDraft))

      const { error } =
        editingStaffMember == null
          ? await supabase.from('staff_members').insert([
              {
                user_id: user.id,
                name: trimmedStaffName,
                services: normalizedServices,
              },
            ])
          : await supabase
              .from('staff_members')
              .update({
                name: trimmedStaffName,
                services: normalizedServices,
              })
              .eq('id', editingStaffMember.id)

      if (error) {
        const normalizedError = error.message.toLowerCase()

        if (normalizedError.includes('duplicate') || normalizedError.includes('unique')) {
          throw new Error('Bu personel zaten ekli.')
        }

        throw new Error(
          error.message.includes('staff_members')
            ? 'Personel migrationini calistir.'
            : error.message
        )
      }

      if (editingStaffMember && editingStaffMember.name !== trimmedStaffName) {
        const { error: compensationUpdateError } = await supabase
          .from('staff_compensation_settings')
          .update({ staff_name: trimmedStaffName })
          .eq('user_id', user.id)
          .eq('staff_name', editingStaffMember.name)

        if (
          compensationUpdateError &&
          !compensationUpdateError.message.includes('staff_compensation_settings')
        ) {
          throw new Error(compensationUpdateError.message)
        }

        setStaffCompensationSettings((current) =>
          current.map((item) =>
            item.staff_name === editingStaffMember.name
              ? {
                  ...item,
                  staff_name: trimmedStaffName,
                }
              : item
          )
        )
        setStaffCompensationDrafts((current) => {
          if (!current[editingStaffMember.name]) {
            return current
          }

          const nextDrafts = { ...current }
          nextDrafts[trimmedStaffName] = current[editingStaffMember.name]
          delete nextDrafts[editingStaffMember.name]
          return nextDrafts
        })
        setAppointmentDraft((current) =>
          current.staff === editingStaffMember.name
            ? {
                ...current,
                staff: trimmedStaffName,
              }
            : current
        )
        setPackageSessionDraft((current) =>
          current.staff === editingStaffMember.name
            ? {
                ...current,
                staff: trimmedStaffName,
              }
            : current
        )
        setCalendarStaffFilter((current) =>
          current === editingStaffMember.name ? trimmedStaffName : current
        )
        setActivePersonnelName((current) =>
          current === editingStaffMember.name ? trimmedStaffName : current
        )
      }

      resetStaffEditor()
      await getStaffMembers()
      setMessage(
        editingStaffMember
          ? `${trimmedStaffName} guncellendi.`
          : `${trimmedStaffName} eklendi.`
      )
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : editingStaffMember
            ? 'Personel guncellenemedi.'
            : 'Personel eklenemedi.'
      )
    } finally {
      setCreatingStaff(false)
    }
  }

  const toggleStaffServiceDraft = (serviceLabel: string) => {
    setStaffServiceDraft((current) =>
      current.includes(serviceLabel)
        ? current.filter((item) => item !== serviceLabel)
        : [...current, serviceLabel]
    )
  }

  const removeStaffMember = async (staffId: number) => {
    const targetStaff = staffMembers.find((item) => item.id === staffId)

    if (!targetStaff) {
      setMessage('Silinecek personel bulunamadi.')
      return
    }

    const shouldDelete = window.confirm(
      `${targetStaff.name} aktif listeden kaldirilsin mi? Eski kayitlar silinmeyecek.`
    )

    if (!shouldDelete) {
      return
    }

    setDeletingStaffId(staffId)
    setMessage('')

    try {
      const { error } = await supabase.from('staff_members').delete().eq('id', staffId)

      if (error) {
        throw new Error(
          error.message.includes('staff_members')
            ? 'Personel migrationini calistir.'
            : error.message
        )
      }

      if (appointmentDraft.staff === targetStaff.name) {
        setAppointmentDraft((current) => ({
          ...current,
          staff: '',
        }))
      }

      if (packageSessionDraft.staff === targetStaff.name) {
        setPackageSessionDraft((current) => ({
          ...current,
          staff: '',
        }))
      }

      await getStaffMembers()
      setMessage(`${targetStaff.name} aktif listeden cikarildi.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Personel cikarilamadi.')
    } finally {
      setDeletingStaffId(null)
    }
  }

  const handleCompensationDraftChange = (
    staffName: string,
    field: keyof StaffCompensationDraft,
    value: string
  ) => {
    const normalizedValue = value.replace(',', '.').replace(/[^\d.]/g, '')

    setStaffCompensationDrafts((current) => ({
      ...current,
      [staffName]: {
        ...current[staffName],
        bonusRate: current[staffName]?.bonusRate || '',
        fixedSalary: current[staffName]?.fixedSalary || '',
        [field]: normalizedValue,
      },
    }))
  }

  const saveStaffCompensation = async (staffName: string) => {
    const draft = staffCompensationDrafts[staffName] || {
      bonusRate: '',
      fixedSalary: '',
    }
    const fixedSalaryValue = Number.parseFloat(draft.fixedSalary || '0')
    const bonusRateValue = Number.parseFloat(draft.bonusRate || '0')

    if (Number.isNaN(fixedSalaryValue) || fixedSalaryValue < 0) {
      setMessage('Sabit maas negatif olamaz.')
      return
    }

    if (Number.isNaN(bonusRateValue) || bonusRateValue < 0) {
      setMessage('Prim orani negatif olamaz.')
      return
    }

    setSavingCompensationStaff(staffName)
    setMessage('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setMessage('Aktif oturum bulunamadi. Tekrar giris yap.')
      setSavingCompensationStaff(null)
      return
    }

    const payload = {
      bonus_rate: bonusRateValue,
      fixed_salary: fixedSalaryValue,
      staff_name: staffName,
      user_id: user.id,
    }

    const { error } = await supabase
      .from('staff_compensation_settings')
      .upsert(payload, { onConflict: 'user_id,staff_name' })

    if (error) {
      setMessage(
        error.message.includes('staff_compensation_settings')
          ? 'Maas ayari migrationini calistir.'
          : error.message
      )
      setSavingCompensationStaff(null)
      return
    }

    await getStaffCompensationSettings()
    setMessage(`${staffName} icin maas ayari kaydedildi.`)
    setSavingCompensationStaff(null)
  }

  const saveAppointment = async () => {
    const trimmedService = appointmentDraft.service.trim()
    const today = getTodayDateInputValue()
    const isEditingAppointment = editingAppointmentId !== null

    if (!trimmedService) {
      setMessage('En azindan hizmet alanini gir.')
      return
    }

    if (!appointmentDraft.staff.trim()) {
      setMessage('Hizmet veren sec.')
      return
    }

    if (!isEditingAppointment && appointmentDraft.date && appointmentDraft.date < today) {
      setMessage('Gecmis tarihli randevu olusturamazsin.')
      return
    }

    setLoading(true)
    setMessage('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setMessage('Aktif oturum bulunamadi. Tekrar giris yap.')
      setLoading(false)
      return
    }

    const appointmentPayload = {
      customer: appointmentDraft.customer.trim() || null,
      phone: appointmentDraft.phone.trim() || null,
      service: trimmedService,
      staff: appointmentDraft.staff.trim(),
      date: appointmentDraft.date || null,
      time: appointmentDraft.time || null,
      status: appointmentDraft.status || 'Taslak',
      total_price: appointmentDraft.totalPrice.trim() || null,
      creator: appointmentDraft.creator.trim() || userEmail || user.email || null,
    }
    const { error } = isEditingAppointment
      ? await supabase
          .from('appointments')
          .update(appointmentPayload)
          .eq('id', editingAppointmentId)
          .eq('user_id', user.id)
      : await supabase.from('appointments').insert([
          {
            user_id: user.id,
            ...appointmentPayload,
          },
        ])

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    closeAppointmentModal()
    setMessage(isEditingAppointment ? 'Randevu guncellendi.' : 'Randevu eklendi.')
    await getAppointments()
    setLoading(false)
  }

  const saveCustomer = async () => {
    const trimmedCustomer = customerDraft.customer.trim()
    const trimmedEmail = customerDraft.email.trim().toLowerCase() || null
    const normalizedPhone = customerDraft.phone.trim() || null

    if (!trimmedCustomer) {
      setMessage('Musteri adini gir.')
      return
    }

    setLoading(true)
    setMessage('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setMessage('Aktif oturum bulunamadi. Tekrar giris yap.')
      setLoading(false)
      return
    }

    const { error } = editingCustomerId
      ? await supabase
          .from('customers')
          .update({
            customer: trimmedCustomer,
            email: trimmedEmail,
            phone: normalizedPhone,
          })
          .eq('id', editingCustomerId)
          .eq('user_id', user.id)
      : await supabase.from('customers').insert([
          {
            user_id: user.id,
            customer: trimmedCustomer,
            email: trimmedEmail,
            phone: normalizedPhone,
          },
        ])

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    setMessage(editingCustomerId ? 'Musteri guncellendi.' : 'Musteri eklendi.')
    closeCustomerModal()
    await getCustomers()
    setLoading(false)
  }

  const sendCustomerMessage = async () => {
    if (!activeMessageCustomer) {
      setMessage('Mesaj gonderilecek musteri secilmedi.')
      return
    }

    const trimmedBody = messageBody.trim()
    const trimmedSubject = messageSubject.trim()

    if (!trimmedBody) {
      setMessage('Mesaj icerigini yaz.')
      return
    }

    if (messageChannel === 'sms' && !activeMessageCustomer.phone?.trim()) {
      setMessage('Bu musteride telefon numarasi yok.')
      return
    }

    if (messageChannel === 'email' && !activeMessageCustomer.email?.trim()) {
      setMessage('Bu musteride email adresi yok.')
      return
    }

    if (messageChannel === 'email' && !trimmedSubject) {
      setMessage('Email konusu gir.')
      return
    }

    setSendingMessage(true)
    setMessage('')

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel: messageChannel,
          customerName: activeMessageCustomer.customer,
          email: activeMessageCustomer.email,
          phone: activeMessageCustomer.phone,
          subject: trimmedSubject,
          text: trimmedBody,
        }),
      })

      const payload = (await response.json().catch(() => null)) as { error?: string } | null

      if (!response.ok) {
        setMessage(payload?.error || 'Mesaj gonderilemedi.')
        setSendingMessage(false)
        return
      }

      setMessage(
        messageChannel === 'sms' ? 'SMS gonderildi.' : 'Email gonderildi.'
      )
      closeMessageModal()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Mesaj gonderilemedi.')
    } finally {
      setSendingMessage(false)
    }
  }

  const addProduct = async () => {
    const trimmedProduct = productDraft.product.trim()
    const isService = productDraft.itemType === 'Hizmet'
    const isSale = productDraft.transactionType === 'Satis'
    const normalizedQuantity =
      !isService && isSale ? Number.parseInt(productDraft.quantity.trim(), 10) : null

    if (!trimmedProduct) {
      setMessage(isService ? 'Hizmet adini gir.' : 'Urun adini gir.')
      return
    }

    if (isService && isSale && !productDraft.price.trim()) {
      setMessage('Hizmet satis fiyatini gir.')
      return
    }

    if (isService && !isSale && !productDraft.costPrice.trim()) {
      setMessage('Hizmet alis maliyetini gir.')
      return
    }

    if (!isService && isSale && !productDraft.price.trim()) {
      setMessage('Urun satis fiyatini gir.')
      return
    }

    if (!isService && isSale && (!Number.isFinite(normalizedQuantity) || (normalizedQuantity || 0) < 1)) {
      setMessage('Urun satis adedi en az 1 olmali.')
      return
    }

    setLoading(true)
    setMessage('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setMessage('Aktif oturum bulunamadi. Tekrar giris yap.')
      setLoading(false)
      return
    }

    const productPayload = {
      product: trimmedProduct,
      item_type: productDraft.itemType,
      transaction_type: productDraft.transactionType.trim() || 'Alis',
      counterparty: productDraft.counterparty.trim() || null,
      category: productDraft.category.trim() || null,
      cost_price: isService && isSale ? null : productDraft.costPrice.trim() || null,
      price: isService && !isSale ? null : productDraft.price.trim() || null,
      quantity: !isService && isSale ? normalizedQuantity : null,
      stock: isService || isSale ? null : productDraft.stock.trim() || null,
    }

    const currentProduct = editingProductId
      ? products.find((item) => item.id === editingProductId) || null
      : null
    const { error } = editingProductId
      ? await supabase
          .from('products')
          .update({
            ...productPayload,
            appointment_id: currentProduct?.appointment_id ?? null,
          })
          .eq('id', editingProductId)
          .eq('user_id', user.id)
      : await supabase.from('products').insert([
          {
            user_id: user.id,
            ...productPayload,
          },
        ])

    if (error) {
      setMessage(
        error.message.includes('cost_price') ||
          error.message.includes('item_type') ||
          error.message.includes('transaction_type') ||
          error.message.includes('counterparty') ||
          error.message.includes('quantity')
          ? 'Products tablosu guncel degil. urun migrationlarini calistir.'
          : error.message
      )
      setLoading(false)
      return
    }

    closeProductModal()
    setMessage(
      editingProductId
        ? isService
          ? 'Hizmet guncellendi.'
          : 'Urun guncellendi.'
        : isService
          ? 'Hizmet eklendi.'
          : 'Urun eklendi.'
    )
    await getProducts()
    setLoading(false)
  }

  const deleteProduct = async (productId: number) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('user_id', userId)

    if (error) {
      setMessage(error.message)
      return
    }

    if (editingProductId === productId) {
      closeProductModal()
    }

    setMessage('Urun silindi.')
    await getProducts()
  }

  const addPackageSale = async () => {
    const trimmedCustomer = packageSaleDraft.customer.trim()
    const trimmedPackageName = packageSaleDraft.packageName.trim()
    const totalSessions = Number.parseInt(packageSaleDraft.totalSessions, 10)

    if (!trimmedCustomer) {
      setMessage('Musteri adini gir.')
      return
    }

    if (!trimmedPackageName) {
      setMessage('Paket adini gir.')
      return
    }

    if (!Number.isFinite(totalSessions) || totalSessions < 1) {
      setMessage('Toplam seans en az 1 olmali.')
      return
    }

    setLoading(true)
    setMessage('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setMessage('Aktif oturum bulunamadi. Tekrar giris yap.')
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('package_sales')
      .insert([
        {
          user_id: user.id,
          customer: trimmedCustomer,
          phone: packageSaleDraft.phone.trim() || null,
          package_name: trimmedPackageName,
          session_type: packageSaleDraft.sessionType.trim() || 'Lazer',
          total_sessions: totalSessions,
          used_sessions: 0,
          price: packageSaleDraft.price.trim() || null,
          payment_method: 'Nakit',
        },
      ])
      .select('*')
      .single()

    if (error || !data) {
      setMessage(
        error?.message.includes('package_sales')
          ? 'Package sales migrationlarini calistir.'
          : error?.message || 'Paket satisi kaydedilemedi.'
      )
      setLoading(false)
      return
    }

    setPackageSaleDraft(defaultPackageSaleDraft)
    setMessage('Paket olusturuldu. Seansi paket sahibi uzerinden manuel ekleyebilirsin.')
    setIsPackageSaleModalOpen(false)
    await getPackageSales()
    setLoading(false)
  }

  const addPackageSession = async () => {
    if (!activePackageSaleId) {
      return
    }

    const selectedPackageSale = packageSales.find((item) => item.id === activePackageSaleId)
    const today = getTodayDateInputValue()

    if (!selectedPackageSale) {
      setMessage('Paket kaydi bulunamadi.')
      return
    }

    const hasOpenAppointment = appointments.some(
      (item) => item.package_sale_id === selectedPackageSale.id && !item.closed_at
    )

    if (selectedPackageSale.used_sessions >= selectedPackageSale.total_sessions) {
      setMessage('Bu pakette kalan seans yok.')
      return
    }

    if (hasOpenAppointment) {
      setMessage('Bu paket icin zaten acik bir seans randevusu var.')
      return
    }

    if (!packageSessionDraft.staff.trim()) {
      setMessage('Hizmet veren sec.')
      return
    }

    if (!packageSessionDraft.date) {
      setMessage('Seans tarihini sec.')
      return
    }

    if (packageSessionDraft.date < today) {
      setMessage('Gecmis tarihli seans olusturamazsin.')
      return
    }

    if (!packageSessionDraft.time) {
      setMessage('Seans saatini sec.')
      return
    }

    setLoading(true)
    setMessage('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setMessage('Aktif oturum bulunamadi. Tekrar giris yap.')
      setLoading(false)
      return
    }

    const nextSessionNumber = Math.min(
      selectedPackageSale.used_sessions + 1,
      selectedPackageSale.total_sessions
    )
    const { error } = await supabase.from('appointments').insert([
      {
        user_id: user.id,
        customer: selectedPackageSale.customer,
        phone: selectedPackageSale.phone,
        service: `${selectedPackageSale.package_name} / ${selectedPackageSale.session_type} / ${nextSessionNumber}. seans`,
        staff: packageSessionDraft.staff.trim(),
        date: packageSessionDraft.date,
        time: packageSessionDraft.time,
        status: 'Onayli',
        total_price: null,
        creator: userEmail || user.email || null,
        package_sale_id: selectedPackageSale.id,
        package_session_number: nextSessionNumber,
      },
    ])

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    closePackageSessionModal()
    setMessage('Pakete yeni seans randevusu eklendi.')
    await getAppointments()
    await getPackageSales()
    setLoading(false)
  }

  const closeAppointment = async () => {
    if (!closingAppointmentId) {
      return
    }

    const appointment = appointments.find((item) => item.id === closingAppointmentId)
    const parseStockValue = (value: string | null) => {
      const normalized = (value || '').replace(/[^\d-]/g, '')
      const parsed = Number.parseInt(normalized, 10)
      return Number.isFinite(parsed) ? parsed : 0
    }
    const existingLinkedProductSales = products.filter(
      (product) =>
        product.appointment_id === closingAppointmentId &&
        product.item_type === 'Urun' &&
        product.transaction_type === 'Satis'
    )
    const normalizedProductSales: NormalizedAppointmentProductSale[] = []

    if (appointmentClosingDraft.attendanceStatus === 'Geldi') {
      for (const item of appointmentClosingDraft.productSales) {
        const productLabel = item.product.trim()
        const price = item.price.trim()
        const quantityText = item.quantity.trim()

        if (!productLabel && !price && !quantityText) {
          continue
        }

        const quantity = Number.parseInt(quantityText, 10)

        if (!productLabel || !price || !Number.isFinite(quantity) || quantity < 1) {
          setMessage('Urun satirlarinda urun, adet ve satis tutari zorunlu.')
          return
        }

        normalizedProductSales.push({
          id: item.id,
          product: productLabel,
          price,
          quantity,
        })
      }
    }
    const inventoryProductsByName = products.reduce<Record<string, Product>>((result, product) => {
      if (
        product.item_type !== 'Urun' ||
        product.appointment_id != null ||
        !(product.stock || '').trim()
      ) {
        return result
      }

      const key = product.product.trim().toLocaleLowerCase('tr-TR')

      if (!key) {
        return result
      }

      if (!result[key] || new Date(product.created_at).getTime() > new Date(result[key].created_at).getTime()) {
        result[key] = product
      }

      return result
    }, {})
    const desiredQuantityByProduct = normalizedProductSales.reduce<Record<string, number>>(
      (result, item) => {
        const key = item.product.toLocaleLowerCase('tr-TR')
        result[key] = (result[key] || 0) + item.quantity
        return result
      },
      {}
    )
    const existingQuantityByProduct = existingLinkedProductSales.reduce<Record<string, number>>(
      (result, item) => {
        const key = item.product.trim().toLocaleLowerCase('tr-TR')
        result[key] = (result[key] || 0) + (item.quantity || 1)
        return result
      },
      {}
    )
    const stockAdjustmentByProduct = Object.keys({
      ...existingQuantityByProduct,
      ...desiredQuantityByProduct,
    }).reduce<Record<string, number>>((result, key) => {
      const desiredQuantity =
        appointmentClosingDraft.attendanceStatus === 'Geldi' ? desiredQuantityByProduct[key] || 0 : 0
      const existingQuantity = existingQuantityByProduct[key] || 0
      result[key] = desiredQuantity - existingQuantity
      return result
    }, {})

    for (const [productKey, quantityDelta] of Object.entries(stockAdjustmentByProduct)) {
      if (quantityDelta <= 0) {
        continue
      }

      const inventoryProduct = inventoryProductsByName[productKey]

      if (!inventoryProduct) {
        setMessage('Secilen urun icin stok karti bulunamadi.')
        return
      }

      if (parseStockValue(inventoryProduct.stock) < quantityDelta) {
        setMessage(`${inventoryProduct.product} icin yeterli stok yok.`)
        return
      }
    }

    const normalizedServiceStatus =
      appointmentClosingDraft.attendanceStatus === 'Geldi'
        ? normalizeAppointmentServiceStatus(
            appointmentClosingDraft.attendanceStatus,
            appointmentClosingDraft.serviceStatus
          )
        : 'Yapilmadi'
    const isPackageSessionAppointment = !!appointment?.package_sale_id
    const paymentMethod =
      appointmentClosingDraft.attendanceStatus === 'Geldi' && !isPackageSessionAppointment
        ? appointmentClosingDraft.paymentMethod
        : null
    const collectedAmount =
      appointmentClosingDraft.attendanceStatus === 'Geldi' && !isPackageSessionAppointment
        ? appointmentClosingDraft.collectedAmount.trim() || null
        : null
    const shouldConsumePackageSession =
      !!appointment?.package_sale_id &&
      shouldConsumeAppointmentPackageSession(
        appointmentClosingDraft.attendanceStatus,
        normalizedServiceStatus
      )
    const hadConsumedPackageSession = !!appointment?.package_session_consumed_at
    const packageSessionConsumedAt =
      shouldConsumePackageSession && !hadConsumedPackageSession
        ? new Date().toISOString()
        : shouldConsumePackageSession
          ? appointment?.package_session_consumed_at || new Date().toISOString()
          : null

    setLoading(true)
    setMessage('')

    const { error } = await supabase
      .from('appointments')
      .update({
        attendance_status: appointmentClosingDraft.attendanceStatus,
        service_status: normalizedServiceStatus,
        payment_method: paymentMethod,
        collected_amount: collectedAmount,
        closed_at: new Date().toISOString(),
        package_session_consumed_at: packageSessionConsumedAt,
      })
      .eq('id', closingAppointmentId)
      .eq('user_id', userId)

    if (error) {
      setMessage(
        error.message.includes('service_status')
          ? 'Appointments service status migrationini calistir.'
          : error.message
      )
      setLoading(false)
      return
    }

    if (appointment?.package_sale_id && shouldConsumePackageSession !== hadConsumedPackageSession) {
      const packageSale = packageSales.find((item) => item.id === appointment.package_sale_id)

      if (packageSale) {
        const { error: packageError } = await supabase
          .from('package_sales')
          .update({
            used_sessions: shouldConsumePackageSession
              ? Math.min(packageSale.total_sessions, packageSale.used_sessions + 1)
              : Math.max(packageSale.used_sessions - 1, 0),
          })
          .eq('id', packageSale.id)
          .eq('user_id', userId)

        if (packageError) {
          setMessage(packageError.message)
          setLoading(false)
          return
        }
      }
    }

    if (appointmentClosingDraft.attendanceStatus === 'Geldi') {
      for (const item of normalizedProductSales) {
        const sourceProduct = inventoryProductsByName[item.product.toLocaleLowerCase('tr-TR')]

        const productSalePayload = {
          appointment_id: closingAppointmentId,
          product: item.product,
          item_type: 'Urun',
          transaction_type: 'Satis',
          counterparty: appointment?.customer || appointment?.phone || null,
          category: sourceProduct?.category || null,
          cost_price: null,
          price: item.price,
          stock: null,
          quantity: item.quantity,
        }

        const { error: productSaleError } = item.id
          ? await supabase
              .from('products')
              .update(productSalePayload)
              .eq('id', item.id)
              .eq('user_id', userId)
          : await supabase.from('products').insert([
              {
                user_id: userId,
                ...productSalePayload,
              },
            ])

        if (productSaleError) {
          setMessage(
            productSaleError.message.includes('appointment_id')
              ? 'Randevu urun satisi icin products appointment migrationini calistir.'
              : productSaleError.message
          )
          setLoading(false)
          return
        }
      }

      for (const [productKey, quantityDelta] of Object.entries(stockAdjustmentByProduct)) {
        if (quantityDelta === 0) {
          continue
        }

        const inventoryProduct = inventoryProductsByName[productKey]

        if (!inventoryProduct) {
          continue
        }

        const nextStock = parseStockValue(inventoryProduct.stock) - quantityDelta
        const { error: stockUpdateError } = await supabase
          .from('products')
          .update({ stock: `${nextStock}` })
          .eq('id', inventoryProduct.id)
          .eq('user_id', userId)

        if (stockUpdateError) {
          setMessage(stockUpdateError.message)
          setLoading(false)
          return
        }
      }

      const removedProductSaleIds = existingLinkedProductSales
        .filter((product) => !normalizedProductSales.some((item) => item.id === product.id))
        .map((product) => product.id)

      if (removedProductSaleIds.length > 0) {
        const { error: deleteProductSalesError } = await supabase
          .from('products')
          .delete()
          .in('id', removedProductSaleIds)
          .eq('user_id', userId)

        if (deleteProductSalesError) {
          setMessage(deleteProductSalesError.message)
          setLoading(false)
          return
        }
      }
    } else if (existingLinkedProductSales.length > 0) {
      for (const [productKey, quantityDelta] of Object.entries(stockAdjustmentByProduct)) {
        if (quantityDelta === 0) {
          continue
        }

        const inventoryProduct = inventoryProductsByName[productKey]

        if (!inventoryProduct) {
          continue
        }

        const nextStock = parseStockValue(inventoryProduct.stock) - quantityDelta
        const { error: stockUpdateError } = await supabase
          .from('products')
          .update({ stock: `${nextStock}` })
          .eq('id', inventoryProduct.id)
          .eq('user_id', userId)

        if (stockUpdateError) {
          setMessage(stockUpdateError.message)
          setLoading(false)
          return
        }
      }

      const { error: deleteProductSalesError } = await supabase
        .from('products')
        .delete()
        .in('id', existingLinkedProductSales.map((product) => product.id))
        .eq('user_id', userId)

      if (deleteProductSalesError) {
        setMessage(deleteProductSalesError.message)
        setLoading(false)
        return
      }
    }

    setMessage('Randevu sonucu kaydedildi.')
    closeAppointmentClosingModal()
    await getAppointments()
    await getProducts()
    await getPackageSales()
    setLoading(false)
  }

  const startEditingNote = (item: Appointment) => {
    setActiveSection('Randevular')
    setIsQuickActionsOpen(false)
    setEditingAppointmentId(item.id)
    setAppointmentDraft({
      customer: item.customer || '',
      phone: item.phone || '',
      service: item.service,
      staff: item.staff || '',
      date: item.date || '',
      time: item.time || '',
      status: item.status || 'Taslak',
      totalPrice: item.total_price || '',
      creator: item.creator || userEmail,
    })
    setMessage('')
    setIsAppointmentModalOpen(true)
  }

  const deleteNote = async (noteId: number) => {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', noteId)
      .eq('user_id', userId)

    if (error) {
      setMessage(error.message)
      return
    }

    if (editingAppointmentId === noteId) {
      setEditingAppointmentId(null)
      setAppointmentDraft(defaultAppointmentDraft)
    }

    setMessage('Plan silindi.')
    await getAppointments()
  }

  useEffect(() => {
    let isMounted = true

    const applySession = (session: Awaited<
      ReturnType<typeof supabase.auth.getSession>
    >['data']['session']) => {
      if (!isMounted || !session?.user) {
        setUserId('')
        setUserEmail('')
        setUserRole('member')
        setAppointments([])
        setCustomers([])
        setProducts([])
        setPackageSales([])
        setStaffMembers([])
        resetStaffEditor()
        setStaffCompensationSettings([])
        setStaffCompensationDrafts({})
        setInviteCode('')
        clearAuthCredentials()
        setRegisterStep('verify-invite')
        resetAccessManagement()
        return
      }

      setUserId(session.user.id)
      setUserEmail(session.user.email || '')
    }

    const loadInitialUser = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        setMessage('Oturum kontrolu yapilamadi. Giris yapmayi tekrar dene.')
        applySession(null)
        return
      }

      if (data.session?.user && hasRecoveryParamsInUrl()) {
        setIsPasswordRecoveryMode(true)
        setMode('login')
        setEmail(data.session.user.email || '')
        clearAuthCredentials()
        setMessage('Email dogrulandi. Yeni sifreni belirle.')
      }

      applySession(data.session)
    }

    void loadInitialUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecoveryMode(true)
        setIsForgotPasswordMode(false)
        setMode('login')
        setEmail(session?.user.email || '')
        clearAuthCredentials()
        setMessage('Email dogrulandi. Yeni sifreni belirle.')
      } else if (event === 'SIGNED_OUT') {
        setIsPasswordRecoveryMode(false)
      }

      applySession(session)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!userId || isPasswordRecoveryMode) {
      return
    }

    void syncUserProfile(userId)
    void loadAppointments()
    void loadCustomers()
    void loadProducts()
    void loadPackageSales()
    void loadStaffMembers()
    void loadStaffCompensationSettings()
  }, [isPasswordRecoveryMode, userId])

  useEffect(() => {
    if (!userId || userRole !== 'owner') {
      resetAccessManagement()
      return
    }

    void syncAccessManagement()
  }, [userId, userRole])

  useEffect(() => {
    if (activeSection === 'Kullanicilar' && userRole !== 'owner') {
      setActiveSection('Ozet')
    }
  }, [activeSection, userRole])

  if (userEmail && !loggingOut && !isPasswordRecoveryMode) {
    const hasCustomCashRange = !!cashReportStartDate || !!cashReportEndDate
    const isWithinCashReportRange = (dateValue: string | null) => {
      if (!dateValue) {
        return false
      }

      if (!hasCustomCashRange) {
        return isDateWithinReportPeriod(dateValue, cashReportPeriod)
      }

      const targetDate = new Date(dateValue)

      if (Number.isNaN(targetDate.getTime())) {
        return false
      }

      if (cashReportStartDate) {
        const startDate = createDateFromIso(cashReportStartDate)
        startDate.setHours(0, 0, 0, 0)

        if (targetDate.getTime() < startDate.getTime()) {
          return false
        }
      }

      if (cashReportEndDate) {
        const endDate = createDateFromIso(cashReportEndDate)
        endDate.setHours(23, 59, 59, 999)

        if (targetDate.getTime() > endDate.getTime()) {
          return false
        }
      }

      return true
    }
    const cashReportPeriodLabel = hasCustomCashRange
      ? `${cashReportStartDate || 'Baslangic'} - ${cashReportEndDate || 'Bitis'}`
      : cashReportPeriod
    const hasCustomPersonnelRange = !!personnelReportStartDate || !!personnelReportEndDate
    const isWithinPersonnelReportRange = (dateValue: string | null) => {
      if (!dateValue) {
        return false
      }

      if (!hasCustomPersonnelRange) {
        return isDateWithinReportPeriod(dateValue, cashReportPeriod)
      }

      const targetDate = new Date(dateValue)

      if (Number.isNaN(targetDate.getTime())) {
        return false
      }

      if (personnelReportStartDate) {
        const startDate = createDateFromIso(personnelReportStartDate)
        startDate.setHours(0, 0, 0, 0)

        if (targetDate.getTime() < startDate.getTime()) {
          return false
        }
      }

      if (personnelReportEndDate) {
        const endDate = createDateFromIso(personnelReportEndDate)
        endDate.setHours(23, 59, 59, 999)

        if (targetDate.getTime() > endDate.getTime()) {
          return false
        }
      }

      return true
    }
    const personnelReportPeriodLabel = hasCustomPersonnelRange
      ? `${personnelReportStartDate || 'Baslangic'} - ${personnelReportEndDate || 'Bitis'}`
      : cashReportPeriod
    const appointmentRows: AppointmentRow[] = appointments.map((item) => {
      const createdAt = new Date(item.created_at)

      return {
        ...item,
        createdLabel: createdAt.toLocaleDateString('tr-TR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        }),
        createdTime: createdAt.toLocaleTimeString('tr-TR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      }
    })
    const activeStaffOptions = staffMembers.map((item) => item.name)
    const calendarSlots = Array.from({ length: 12 }, (_, index) => {
      const hour = 13 + Math.floor((index + 1) / 2)
      const minute = index % 2 === 0 ? '00' : '30'
      return `${hour.toString().padStart(2, '0')}:${minute}`
    })
    const calendarItems: CalendarAppointment[] = appointmentRows
      .filter((item) => item.date)
      .map((item) => ({
        ...item,
        calendarDate: item.date || '',
        slotIndex: getTimeSlotIndex(item.time),
      }))
      .sort((left, right) => {
        if (left.calendarDate !== right.calendarDate) {
          return left.calendarDate.localeCompare(right.calendarDate)
        }

        return (left.time || '').localeCompare(right.time || '')
      })
    const filteredCalendarItems = calendarItems.filter(
      (item) =>
        calendarStaffFilter === 'Tum personeller' ||
        (item.staff || '').trim() === calendarStaffFilter
    )
    const dailyAppointments = filteredCalendarItems.filter(
      (item) => item.calendarDate === calendarDate && item.slotIndex >= 0
    )
    const weekDates = getWeekDates(calendarDate)
    const weekAppointmentsByDate = weekDates.reduce<Record<string, typeof filteredCalendarItems>>(
      (result, date) => {
        result[date] = filteredCalendarItems.filter((item) => item.calendarDate === date)
        return result
      },
      {}
    )
    const monthGridDates = getMonthGridDates(calendarDate)
    const monthAppointmentsByDate = monthGridDates.reduce<
      Record<string, typeof filteredCalendarItems>
    >((result, date) => {
      result[date] = filteredCalendarItems.filter((item) => item.calendarDate === date)
      return result
    }, {})
    const currentMonthDate = createDateFromIso(calendarDate)
    const closedAppointmentsForCashReport = appointmentRows.filter(
      (item) =>
        !!item.closed_at &&
        isCompletedAppointmentService(item.attendance_status, item.service_status) &&
        isWithinCashReportRange(item.closed_at)
    )
    const packageSalesForCashReport = packageSales.filter((item) =>
      isWithinCashReportRange(item.created_at)
    )
    const closedAppointmentsForReport = appointmentRows.filter(
      (item) =>
        !!item.closed_at &&
        isCompletedAppointmentService(item.attendance_status, item.service_status) &&
        isDateWithinReportPeriod(item.closed_at, cashReportPeriod)
    )
    const packageSalesForReport = packageSales.filter((item) =>
      isDateWithinReportPeriod(item.created_at, cashReportPeriod)
    )
    const productSalesForReport = products.filter(
      (item) =>
        item.item_type === 'Urun' &&
        item.transaction_type === 'Satis' &&
        isDateWithinReportPeriod(item.created_at, cashReportPeriod)
    )
    const currentPeriodStart = getReportPeriodStart(cashReportPeriod)
    const previousPeriodReference = new Date(currentPeriodStart.getTime() - 1)
    const closedAppointmentsForPreviousPeriod = appointmentRows.filter(
      (item) =>
        !!item.closed_at &&
        isCompletedAppointmentService(item.attendance_status, item.service_status) &&
        isDateWithinReportPeriod(item.closed_at, cashReportPeriod, previousPeriodReference)
    )
    const packageSalesForPreviousPeriod = packageSales.filter((item) =>
      isDateWithinReportPeriod(item.created_at, cashReportPeriod, previousPeriodReference)
    )
    const productSalesForPreviousPeriod = products.filter(
      (item) =>
        item.item_type === 'Urun' &&
        item.transaction_type === 'Satis' &&
        isDateWithinReportPeriod(item.created_at, cashReportPeriod, previousPeriodReference)
    )
    const appointmentCashTotals = {
      nakit: 0,
      krediKarti: 0,
      havale: 0,
      onlineOdeme: 0,
      diger: 0,
    }
    const cashReportAppointmentIncomeTotal = closedAppointmentsForCashReport.reduce((total, item) => {
      const amount = parseCurrencyValue(item.collected_amount || item.total_price)

      if ((item.payment_method || '') === 'Nakit') {
        appointmentCashTotals.nakit += amount
      } else if ((item.payment_method || '') === 'Kredi karti') {
        appointmentCashTotals.krediKarti += amount
      } else if ((item.payment_method || '') === 'Havale') {
        appointmentCashTotals.havale += amount
      } else if ((item.payment_method || '') === 'Online odeme') {
        appointmentCashTotals.onlineOdeme += amount
      } else {
        appointmentCashTotals.diger += amount
      }

      return total + amount
    }, 0)
    const cashReportPackageSalesTotal = packageSalesForCashReport.reduce(
      (total, item) => total + parseCurrencyValue(item.price),
      0
    )
    const appointmentIncomeTotal = closedAppointmentsForReport.reduce(
      (total, item) => total + parseCurrencyValue(item.collected_amount || item.total_price),
      0
    )
    const packageSalesTotal = packageSalesForReport.reduce(
      (total, item) => total + parseCurrencyValue(item.price),
      0
    )
    const productSalesTotal = productSalesForReport.reduce(
      (total, item) => total + parseCurrencyValue(item.price),
      0
    )
    const previousAppointmentIncomeTotal = closedAppointmentsForPreviousPeriod.reduce(
      (total, item) => total + parseCurrencyValue(item.collected_amount || item.total_price),
      0
    )
    const previousPackageSalesTotal = packageSalesForPreviousPeriod.reduce(
      (total, item) => total + parseCurrencyValue(item.price),
      0
    )
    const previousProductSalesTotal = productSalesForPreviousPeriod.reduce(
      (total, item) => total + parseCurrencyValue(item.price),
      0
    )
    const cashReportComputedSections: CashReportSection[] = [
      {
        key: 'total',
        label: 'Toplam',
        value: formatCurrencyValue(cashReportAppointmentIncomeTotal + cashReportPackageSalesTotal),
        items: [
          ['Randevu gelirleri', formatCurrencyValue(cashReportAppointmentIncomeTotal)],
          ['Paket satislari', formatCurrencyValue(cashReportPackageSalesTotal)],
          ['Genel toplam', formatCurrencyValue(cashReportAppointmentIncomeTotal + cashReportPackageSalesTotal)],
        ],
      },
      {
        key: 'income',
        label: 'Gelirler toplami',
        value: formatCurrencyValue(cashReportAppointmentIncomeTotal + cashReportPackageSalesTotal),
        items: [
          ['Nakit', formatCurrencyValue(appointmentCashTotals.nakit)],
          ['Kredi karti', formatCurrencyValue(appointmentCashTotals.krediKarti)],
          ['Havale', formatCurrencyValue(appointmentCashTotals.havale)],
          ['Online odeme', formatCurrencyValue(appointmentCashTotals.onlineOdeme)],
          ['Diger', formatCurrencyValue(appointmentCashTotals.diger)],
          ['Paket satislari', formatCurrencyValue(cashReportPackageSalesTotal)],
        ],
      },
      {
        key: 'expense',
        label: 'Masraflar toplami',
        value: formatCurrencyValue(0),
        items: [],
      },
    ]
    const packageSaleStaffLookup = appointmentRows.reduce<Record<number, string>>((result, item) => {
      if (!item.package_sale_id || item.package_session_number !== 1 || !item.staff?.trim()) {
        return result
      }

      if (!result[item.package_sale_id]) {
        result[item.package_sale_id] = item.staff.trim()
      }

      return result
    }, {})
    const packageSaleCreatorLookup = appointmentRows.reduce<Record<number, string>>(
      (result, item) => {
        if (!item.package_sale_id || item.package_session_number !== 1 || !item.creator?.trim()) {
          return result
        }

        if (!result[item.package_sale_id]) {
          result[item.package_sale_id] = item.creator.trim()
        }

        return result
      },
      {}
    )
    const allKnownStaffOptions = Array.from(
      new Set(
        [
          ...activeStaffOptions,
          ...appointmentRows.map((item) => item.staff?.trim() || '').filter(Boolean),
          ...packageSales
            .map((item) => packageSaleStaffLookup[item.id]?.trim() || '')
            .filter(Boolean),
        ].sort((left, right) => left.localeCompare(right, 'tr'))
      )
    )
    const todayIso = getTodayDateInputValue()
    const buildPersonnelRows = (isWithinPersonnelPeriod: (dateValue: string | null) => boolean) => {
      const rowsByStaff = activeStaffOptions.reduce<Record<string, PersonnelReportRow>>((result, staffName) => {
        result[staffName] = {
          staff: staffName,
          completedAppointments: 0,
          appointmentRevenue: 0,
          packageSales: 0,
          packageRevenue: 0,
          totalTransactions: 0,
          totalRevenue: 0,
        }
        return result
      }, {})

      const ensureRow = (staffName: string) => {
        const normalizedStaffName = staffName.trim() || 'Atanmamis'

        if (!rowsByStaff[normalizedStaffName]) {
          rowsByStaff[normalizedStaffName] = {
            staff: normalizedStaffName,
            completedAppointments: 0,
            appointmentRevenue: 0,
            packageSales: 0,
            packageRevenue: 0,
            totalTransactions: 0,
            totalRevenue: 0,
          }
        }

        return rowsByStaff[normalizedStaffName]
      }

      appointmentRows
        .filter(
          (item) =>
            !!item.closed_at &&
            isCompletedAppointmentService(item.attendance_status, item.service_status) &&
            isWithinPersonnelPeriod(item.closed_at)
        )
        .forEach((item) => {
          const row = ensureRow(item.staff || 'Atanmamis')
          row.completedAppointments += 1
          row.appointmentRevenue += parseCurrencyValue(item.collected_amount || item.total_price)
          row.totalTransactions = row.completedAppointments + row.packageSales
          row.totalRevenue = row.appointmentRevenue + row.packageRevenue
        })

      packageSales
        .filter((item) => isWithinPersonnelPeriod(item.created_at))
        .forEach((item) => {
          const row = ensureRow(packageSaleStaffLookup[item.id] || 'Atanmamis')
          row.packageSales += 1
          row.packageRevenue += parseCurrencyValue(item.price)
          row.totalTransactions = row.completedAppointments + row.packageSales
          row.totalRevenue = row.appointmentRevenue + row.packageRevenue
        })

      return Object.values(rowsByStaff).sort((left, right) => {
        if (right.totalRevenue !== left.totalRevenue) {
          return right.totalRevenue - left.totalRevenue
        }

        if (right.totalTransactions !== left.totalTransactions) {
          return right.totalTransactions - left.totalTransactions
        }

        return left.staff.localeCompare(right.staff, 'tr-TR')
      })
    }
    const buildPersonnelRowsForPeriod = (period: 'Bugun' | CashReportPeriod) =>
      buildPersonnelRows((dateValue) => {
        if (!dateValue) {
          return false
        }

        if (period === 'Bugun') {
          const date = new Date(dateValue)

          if (Number.isNaN(date.getTime())) {
            return false
          }

          return formatDateIso(date) === todayIso
        }

        return isDateWithinReportPeriod(dateValue, period)
      })
    const personnelReportRows = buildPersonnelRows(isWithinPersonnelReportRange)
    const staffCompensationSettingsByStaff = staffCompensationSettings.reduce<
      Record<string, StaffCompensationSetting>
    >((result, item) => {
      result[item.staff_name] = item
      return result
    }, {})
    const personnelCompensationRows: PersonnelCompensationRow[] = personnelReportRows.map((item) => {
      const setting = staffCompensationSettingsByStaff[item.staff]
      const draft = staffCompensationDrafts[item.staff]
      const fixedSalary = Number.parseFloat(
        draft?.fixedSalary || `${Number(setting?.fixed_salary || 0)}`
      )
      const bonusRate = Number.parseFloat(
        draft?.bonusRate || `${Number(setting?.bonus_rate || 0)}`
      )
      const normalizedFixedSalary = Number.isFinite(fixedSalary) ? fixedSalary : 0
      const normalizedBonusRate = Number.isFinite(bonusRate) ? bonusRate : 0
      const bonusAmount = (item.totalRevenue * normalizedBonusRate) / 100

      return {
        ...item,
        bonusAmount,
        bonusRate: normalizedBonusRate,
        earnedAmount: normalizedFixedSalary + bonusAmount,
        fixedSalary: normalizedFixedSalary,
      }
    })
    const closedAppointmentsForPersonnelReport = appointmentRows.filter(
      (item) =>
        !!item.closed_at &&
        isCompletedAppointmentService(item.attendance_status, item.service_status) &&
        isWithinPersonnelReportRange(item.closed_at)
    )
    const packageSalesForPersonnelReport = packageSales.filter((item) =>
      isWithinPersonnelReportRange(item.created_at)
    )
    const paidAppointmentSalesForReport = closedAppointmentsForPersonnelReport
      .map((item) => ({
        amount: parseCurrencyValue(item.collected_amount || item.total_price),
        creator: item.creator?.trim() || 'Atanmamis',
        customer: item.customer,
        occurredAt: item.closed_at || item.created_at,
        paymentMethod: item.payment_method?.trim() || 'Belirtilmedi',
        phone: item.phone,
        service: item.service.trim() || 'Belirtilmeyen hizmet',
      }))
      .filter((item) => item.amount > 0)
    const paidPackageSalesForReport = packageSalesForPersonnelReport
      .map((item) => ({
        amount: parseCurrencyValue(item.price),
        creator: packageSaleCreatorLookup[item.id] || 'Atanmamis',
        customer: item.customer,
        occurredAt: item.created_at,
        packageLabel: `${item.package_name} / ${item.session_type}`,
        paymentMethod: item.payment_method?.trim() || 'Nakit',
        phone: item.phone,
        staff: packageSaleStaffLookup[item.id] || 'Atanmamis',
      }))
      .filter((item) => item.amount > 0)
    const personnelDetailEntriesByStaff = [
      ...closedAppointmentsForPersonnelReport
        .map<PersonnelDetailEntry | null>((item) => {
          const staffName = item.staff?.trim() || 'Atanmamis'
          const amount = parseCurrencyValue(item.collected_amount || item.total_price)

          if (amount <= 0) {
            return null
          }

          return {
            amount,
            customer: item.customer?.trim() || 'Belirtilmeyen musteri',
            kind: 'Hizmet',
            label: item.service.trim() || 'Belirtilmeyen hizmet',
            occurredAt: item.closed_at || item.created_at,
            paymentMethod: item.payment_method?.trim() || null,
            phone: item.phone || null,
            staff: staffName,
          }
        })
        .filter((item): item is PersonnelDetailEntry & { staff: string } => item !== null),
      ...paidPackageSalesForReport.map((item) => ({
        amount: item.amount,
        customer: item.customer?.trim() || 'Belirtilmeyen musteri',
        kind: 'Paket' as const,
        label: item.packageLabel,
        occurredAt: item.occurredAt,
        paymentMethod: item.paymentMethod || null,
        phone: item.phone || null,
        staff: item.staff || 'Atanmamis',
      })),
    ].reduce<Record<string, PersonnelDetailEntry[]>>((result, item) => {
      if (!result[item.staff]) {
        result[item.staff] = []
      }

      result[item.staff].push({
        amount: item.amount,
        customer: item.customer,
        kind: item.kind,
        label: item.label,
        occurredAt: item.occurredAt,
        paymentMethod: item.paymentMethod,
        phone: item.phone,
      })

      return result
    }, {})
    Object.values(personnelDetailEntriesByStaff).forEach((entries) => {
      entries.sort(
        (left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime()
      )
    })
    const paidProductSalesForReport = productSalesForReport
      .map((item) => ({
        amount: parseCurrencyValue(item.price),
        category: item.category?.trim() || 'Kategorisiz',
        occurredAt: item.created_at,
        product: item.product.trim() || 'Isimsiz urun',
      }))
      .filter((item) => item.amount > 0)
    const previousPaidAppointmentSales = closedAppointmentsForPreviousPeriod
      .map((item) => parseCurrencyValue(item.collected_amount || item.total_price))
      .filter((amount) => amount > 0)
    const previousPaidPackageSales = packageSalesForPreviousPeriod
      .map((item) => parseCurrencyValue(item.price))
      .filter((amount) => amount > 0)
    const previousPaidProductSales = productSalesForPreviousPeriod
      .map((item) => parseCurrencyValue(item.price))
      .filter((amount) => amount > 0)
    const totalSalesRevenue = appointmentIncomeTotal + packageSalesTotal + productSalesTotal
    const previousTotalSalesRevenue =
      previousAppointmentIncomeTotal + previousPackageSalesTotal + previousProductSalesTotal
    const totalSalesCount =
      paidAppointmentSalesForReport.length +
      paidPackageSalesForReport.length +
      paidProductSalesForReport.length
    const previousTotalSalesCount =
      previousPaidAppointmentSales.length +
      previousPaidPackageSales.length +
      previousPaidProductSales.length
    const averageBasketValue = totalSalesCount > 0 ? totalSalesRevenue / totalSalesCount : 0
    const previousAverageBasketValue =
      previousTotalSalesCount > 0 ? previousTotalSalesRevenue / previousTotalSalesCount : 0
    const serviceRows = Object.values(
      paidAppointmentSalesForReport.reduce<
        Record<
          string,
          {
            averageTicket: number
            count: number
            revenue: number
            service: string
          }
        >
      >((result, item) => {
        if (!result[item.service]) {
          result[item.service] = {
            service: item.service,
            count: 0,
            revenue: 0,
            averageTicket: 0,
          }
        }

        result[item.service].count += 1
        result[item.service].revenue += item.amount
        result[item.service].averageTicket =
          result[item.service].revenue / result[item.service].count

        return result
      }, {})
    ).sort((left, right) => right.revenue - left.revenue)
    const packageRows = Object.values(
      paidPackageSalesForReport.reduce<
        Record<
          string,
          {
            averageTicket: number
            count: number
            packageLabel: string
            revenue: number
          }
        >
      >((result, item) => {
        if (!result[item.packageLabel]) {
          result[item.packageLabel] = {
            packageLabel: item.packageLabel,
            count: 0,
            revenue: 0,
            averageTicket: 0,
          }
        }

        result[item.packageLabel].count += 1
        result[item.packageLabel].revenue += item.amount
        result[item.packageLabel].averageTicket =
          result[item.packageLabel].revenue / result[item.packageLabel].count

        return result
      }, {})
    ).sort((left, right) => right.revenue - left.revenue)
    const paymentRows = Object.values(
      [...paidAppointmentSalesForReport, ...paidPackageSalesForReport].reduce<
        Record<
          string,
          {
            amount: number
            count: number
            method: string
            share: number
          }
        >
      >((result, item) => {
        if (!result[item.paymentMethod]) {
          result[item.paymentMethod] = {
            method: item.paymentMethod,
            count: 0,
            amount: 0,
            share: 0,
          }
        }

        result[item.paymentMethod].count += 1
        result[item.paymentMethod].amount += item.amount

        return result
      }, {})
    )
    const paymentTrackedRevenue = paymentRows.reduce((sum, item) => sum + item.amount, 0)
    paymentRows.forEach((item) => {
      item.share = paymentTrackedRevenue > 0 ? (item.amount / paymentTrackedRevenue) * 100 : 0
    })
    paymentRows.sort((left, right) => right.amount - left.amount)
    const salesTimelineEvents: SalesTimelineEvent[] = [
      ...paidAppointmentSalesForReport.map((item) => ({
        amount: item.amount,
        occurredAt: item.occurredAt,
        category: 'service' as const,
      })),
      ...paidPackageSalesForReport.map((item) => ({
        amount: item.amount,
        occurredAt: item.occurredAt,
        category: 'package' as const,
      })),
      ...paidProductSalesForReport.map((item) => ({
        amount: item.amount,
        occurredAt: item.occurredAt,
        category: 'product' as const,
      })),
    ]
    const salesActivityEvents = salesTimelineEvents.map((item) => ({
      amount: item.amount,
      occurredAt: item.occurredAt,
    }))
    const salesTimelineRows = createSalesTimelineRows(cashReportPeriod, salesTimelineEvents)
    const dayRows = weekDayLongLabels.map((label) => ({
      label,
      transactions: 0,
      revenue: 0,
    }))
    const hourRowsMap = Array.from({ length: 24 }, (_, hour) => ({
      label: `${hour.toString().padStart(2, '0')}:00`,
      transactions: 0,
      revenue: 0,
    }))
    salesActivityEvents.forEach((item) => {
      const date = new Date(item.occurredAt)

      if (Number.isNaN(date.getTime())) {
        return
      }

      const dayLabel = weekDayLongLabels[(date.getDay() + 6) % 7]
      const dayRow = dayRows.find((current) => current.label === dayLabel)

      if (dayRow) {
        dayRow.transactions += 1
        dayRow.revenue += item.amount
      }

      const hourRow = hourRowsMap[date.getHours()]

      if (hourRow) {
        hourRow.transactions += 1
        hourRow.revenue += item.amount
      }
    })
    const hourRows = hourRowsMap
      .filter((item) => item.transactions > 0)
      .sort((left, right) => {
        if (right.revenue !== left.revenue) {
          return right.revenue - left.revenue
        }

        return right.transactions - left.transactions
      })
      .slice(0, 8)
    const allCustomerSalesHistory = [
      ...appointmentRows
        .filter(
          (item) =>
            !!item.closed_at &&
            isCompletedAppointmentService(item.attendance_status, item.service_status) &&
            parseCurrencyValue(item.collected_amount || item.total_price) > 0
        )
        .map((item) => ({
          customerKey: createCustomerSalesKey(item.customer),
          occurredAt: item.closed_at || item.created_at,
        })),
      ...packageSales
        .filter((item) => parseCurrencyValue(item.price) > 0)
        .map((item) => ({
          customerKey: createCustomerSalesKey(item.customer),
          occurredAt: item.created_at,
        })),
    ]
      .filter((item) => item.customerKey)
      .sort(
        (left, right) =>
          new Date(left.occurredAt).getTime() - new Date(right.occurredAt).getTime()
      )
    const firstCustomerSaleMap = allCustomerSalesHistory.reduce<Record<string, string>>(
      (result, item) => {
        if (!result[item.customerKey]) {
          result[item.customerKey] = item.occurredAt
        }

        return result
      },
      {}
    )
    const customerSegmentAccumulator = {
      yeni: {
        label: 'Yeni musteri',
        customerCount: 0,
        transactions: 0,
        revenue: 0,
        share: 0,
      },
      mevcut: {
        label: 'Mevcut musteri',
        customerCount: 0,
        transactions: 0,
        revenue: 0,
        share: 0,
      },
    }
    const newCustomerSet = new Set<string>()
    const existingCustomerSet = new Set<string>()
    ;[
      ...paidAppointmentSalesForReport.map((item) => ({
        amount: item.amount,
        customerKey: createCustomerSalesKey(item.customer),
      })),
      ...paidPackageSalesForReport.map((item) => ({
        amount: item.amount,
        customerKey: createCustomerSalesKey(item.customer),
      })),
    ]
      .filter((item) => item.customerKey)
      .forEach((item) => {
        const firstSaleDate = firstCustomerSaleMap[item.customerKey]
        const segmentKey =
          firstSaleDate && isDateWithinReportPeriod(firstSaleDate, cashReportPeriod)
            ? 'yeni'
            : 'mevcut'
        const bucket = customerSegmentAccumulator[segmentKey]

        bucket.transactions += 1
        bucket.revenue += item.amount

        if (segmentKey === 'yeni') {
          newCustomerSet.add(item.customerKey)
        } else {
          existingCustomerSet.add(item.customerKey)
        }
      })
    customerSegmentAccumulator.yeni.customerCount = newCustomerSet.size
    customerSegmentAccumulator.mevcut.customerCount = existingCustomerSet.size
    const customerSegmentRows = Object.values(customerSegmentAccumulator)
    const trackedCustomerRevenue = customerSegmentRows.reduce((sum, item) => sum + item.revenue, 0)
    customerSegmentRows.forEach((item) => {
      item.share = trackedCustomerRevenue > 0 ? (item.revenue / trackedCustomerRevenue) * 100 : 0
    })
    const productRows = Object.values(
      paidProductSalesForReport.reduce<
        Record<
          string,
          {
            averagePrice: number
            category: string
            count: number
            product: string
            revenue: number
          }
        >
      >((result, item) => {
        const key = `${item.product}::${item.category}`

        if (!result[key]) {
          result[key] = {
            product: item.product,
            category: item.category,
            count: 0,
            revenue: 0,
            averagePrice: 0,
          }
        }

        result[key].count += 1
        result[key].revenue += item.amount
        result[key].averagePrice = result[key].revenue / result[key].count

        return result
      }, {})
    ).sort((left, right) => right.revenue - left.revenue)
    const creatorRows = Object.values(
      [
        ...paidAppointmentSalesForReport.map((item) => ({
          appointments: 1,
          creator: item.creator,
          packages: 0,
          revenue: item.amount,
        })),
        ...paidPackageSalesForReport.map((item) => ({
          appointments: 0,
          creator: item.creator,
          packages: 1,
          revenue: item.amount,
        })),
      ].reduce<
        Record<
          string,
          {
            appointments: number
            creator: string
            packages: number
            revenue: number
          }
        >
      >((result, item) => {
        if (!result[item.creator]) {
          result[item.creator] = {
            creator: item.creator,
            appointments: 0,
            packages: 0,
            revenue: 0,
          }
        }

        result[item.creator].appointments += item.appointments
        result[item.creator].packages += item.packages
        result[item.creator].revenue += item.revenue

        return result
      }, {})
    ).sort((left, right) => right.revenue - left.revenue)
    const salesReportComparisonCards = [
      {
        label: 'Toplam ciro',
        currentValue: totalSalesRevenue,
        previousValue: previousTotalSalesRevenue,
        deltaRatio: getPercentageDelta(totalSalesRevenue, previousTotalSalesRevenue),
        type: 'currency' as const,
      },
      {
        label: 'Satis adedi',
        currentValue: totalSalesCount,
        previousValue: previousTotalSalesCount,
        deltaRatio: getPercentageDelta(totalSalesCount, previousTotalSalesCount),
        type: 'count' as const,
      },
      {
        label: 'Ortalama sepet',
        currentValue: averageBasketValue,
        previousValue: previousAverageBasketValue,
        deltaRatio: getPercentageDelta(averageBasketValue, previousAverageBasketValue),
        type: 'currency' as const,
      },
    ]
    const salesReportTargetValue = parseCurrencyValue(salesReportTarget)
    const targetProgress =
      salesReportTargetValue > 0 ? (totalSalesRevenue / salesReportTargetValue) * 100 : 0
    const targetRemaining =
      salesReportTargetValue > totalSalesRevenue
        ? salesReportTargetValue - totalSalesRevenue
        : 0
    const salesReportTotals = {
      totalRevenue: totalSalesRevenue,
      totalTransactions: totalSalesCount,
      averageBasket: averageBasketValue,
      serviceRevenue: appointmentIncomeTotal,
      packageRevenue: packageSalesTotal,
      productRevenue: productSalesTotal,
      topServiceLabel: serviceRows[0]?.service || 'Veri yok',
      activePersonnelCount: personnelReportRows.filter((item) => item.totalTransactions > 0).length,
      paymentTrackedRevenue,
      untrackedPaymentRevenue: productSalesTotal,
      targetProgress,
      targetRemaining,
    }
    const packageSaleRows: PackageSaleRow[] = packageSales.map((item) => ({
      ...item,
      remaining_sessions: Math.max(item.total_sessions - item.used_sessions, 0),
      has_open_appointment: appointmentRows.some(
        (appointment) =>
          appointment.package_sale_id === item.id &&
          !appointment.closed_at &&
          (appointment.package_session_number || 0) > item.used_sessions
      ),
    }))
    const activePackageSale =
      packageSaleRows.find((item) => item.id === activePackageSaleId) || null
    const appointmentCustomers = appointmentRows
      .filter((item) => item.customer)
      .map((item, index) => ({
        id: Number(`9${index}`),
        customer: item.customer || '',
        email: null,
        phone: item.phone || null,
        source: 'appointment' as const,
        created_at: item.created_at,
      }))
    const mergedCustomers = [...customers, ...appointmentCustomers].reduce<MergedCustomer[]>(
      (result, item) => {
        const normalizedName = item.customer.trim().toLocaleLowerCase('tr-TR')
        const existingCustomer = result.find(
          (current) => current.customer.trim().toLocaleLowerCase('tr-TR') === normalizedName
        )

        if (!item.customer.trim()) {
          return result
        }

        if (!existingCustomer) {
          result.push(item)
          return result
        }

        if (existingCustomer.source !== item.source) {
          existingCustomer.source = 'both'
        }

        if (!existingCustomer.phone && item.phone) {
          existingCustomer.phone = item.phone
        }

        if (!existingCustomer.email && item.email) {
          existingCustomer.email = item.email
        }

        return result
      },
      []
    )
    const appointmentClosingProductOptions = Object.values(
      products
        .filter(
          (item) =>
            item.item_type === 'Urun' &&
            item.appointment_id == null &&
            !!(item.stock || '').trim()
        )
        .reduce<
          Record<
            string,
            {
              availableStock: number
              category: string | null
              created_at: string
              defaultPrice: string
              label: string
              stockProductId: number
              value: string
            }
          >
        >((result, item) => {
          const key = item.product.trim().toLocaleLowerCase('tr-TR')

          if (!key) {
            return result
          }

          const candidate = {
            availableStock: Number.parseInt((item.stock || '0').replace(/[^\d-]/g, ''), 10) || 0,
            category: item.category?.trim() || null,
            created_at: item.created_at,
            defaultPrice: item.price || '',
            label: item.category?.trim() ? `${item.product} / ${item.category}` : item.product,
            stockProductId: item.id,
            value: item.product,
          }

          if (!result[key] || new Date(candidate.created_at).getTime() > new Date(result[key].created_at).getTime()) {
            result[key] = candidate
          }

          return result
        }, {})
    )
      .sort((left, right) => left.label.localeCompare(right.label, 'tr-TR'))
    const activeProductHistoryEntries = activeProductName
      ? [...products]
          .filter(
            (item) =>
              item.product.trim().toLocaleLowerCase('tr-TR') ===
              activeProductName.trim().toLocaleLowerCase('tr-TR')
          )
          .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
      : []
    const overviewToday = getTodayDateInputValue()
    const overviewUpcomingAppointments = appointmentRows
      .filter((item) => !item.closed_at && !!item.date && item.date >= overviewToday)
      .sort((left, right) => {
        const leftKey = `${left.date || ''} ${left.time || '99:99'}`
        const rightKey = `${right.date || ''} ${right.time || '99:99'}`
        return leftKey.localeCompare(rightKey, 'tr-TR')
      })
      .slice(0, 6)
    const dashboardOverviewTotals = {
      openAppointments: appointmentRows.filter((item) => !item.closed_at).length,
      todayAppointments: appointmentRows.filter((item) => item.date === overviewToday).length,
      totalCustomers: mergedCustomers.length,
      activePackages: packageSaleRows.filter((item) => item.remaining_sessions > 0).length,
      monthlyRevenue: appointmentIncomeTotal + packageSalesTotal + productSalesTotal,
      serviceRevenue: appointmentIncomeTotal,
      packageRevenue: packageSalesTotal,
      productRevenue: productSalesTotal,
    }
    const overviewTopServiceRows = serviceRows.slice(0, 4)
    const overviewTopPersonnelRows = buildPersonnelRowsForPeriod(overviewPersonnelPeriod).slice(0, 5)
    const activePersonnelDetailRow =
      personnelReportRows.find((item) => item.staff === activePersonnelName) || null
    const activePersonnelDetailEntries = activePersonnelName
      ? personnelDetailEntriesByStaff[activePersonnelName] || []
      : []
    const calendarRangeLabel =
      calendarView === 'Haftalik gorunum'
        ? formatWeekRangeLabel(calendarDate)
        : calendarView === 'Aylik gorunum'
        ? formatMonthRangeLabel(calendarDate)
          : formatDisplayDate(calendarDate)

    const downloadPersonnelPayrollPdf = async (staffName: string) => {
      const row = personnelCompensationRows.find((item) => item.staff === staffName)

      if (!row) {
        setMessage('Personel bordrosu icin satir bulunamadi.')
        return
      }

      const reportLabel = personnelReportPeriodLabel
      const rows = [
        ['Alan', 'Deger'],
        ['Donem', reportLabel],
        ['Personel', row.staff],
        ['Hizmet adedi', `${row.completedAppointments}`],
        ['Paket satisi', `${row.packageSales}`],
        ['Hak edis baz', formatCurrencyValue(row.totalRevenue)],
        ['Sabit maas', formatCurrencyValue(row.fixedSalary)],
        ['Prim orani', `%${row.bonusRate.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}`],
        ['Prim tutari', formatCurrencyValue(row.bonusAmount)],
        ['Toplam hak edis', formatCurrencyValue(row.earnedAmount)],
      ]

      await downloadPdfFile({
        filename: `${row.staff.toLocaleLowerCase('tr-TR').replace(/\s+/g, '-')}-bordro.pdf`,
        rows,
        title: `Personel Bordrosu - ${row.staff}`,
      })
    }

    const handleCalendarViewChange = (view: string) => {
      setCalendarView(view)
      setIsCalendarViewMenuOpen(false)
      setMessage(
        view === 'Gunluk gorunum' || view === 'Haftalik gorunum' || view === 'Aylik gorunum'
          ? ''
          : `${view} ozelligi hazirlaniyor.`
      )
    }

    const toggleCashReportSection = (key: string) => {
      setOpenCashReportSections((current) =>
        current.includes(key)
          ? current.filter((item) => item !== key)
          : [...current, key]
      )
    }

    const goToPreviousCalendarRange = () => {
      setCalendarDate((current) =>
        calendarView === 'Haftalik gorunum'
          ? addDays(current, -7)
          : calendarView === 'Aylik gorunum'
            ? addMonths(current, -1)
            : addDays(current, -1)
      )
    }

    const goToNextCalendarRange = () => {
      setCalendarDate((current) =>
        calendarView === 'Haftalik gorunum'
          ? addDays(current, 7)
          : calendarView === 'Aylik gorunum'
            ? addMonths(current, 1)
            : addDays(current, 1)
      )
    }
    const dashboardSidebarItems =
      userRole === 'owner'
        ? [...sidebarItems, { label: 'Kullanicilar', icon: 'users' }]
        : sidebarItems

    return (
      <main className="min-h-screen min-w-[1280px] bg-[linear-gradient(180deg,#f7f9fc_0%,#eef3f8_54%,#e8eef5_100%)] text-slate-900">
        <DashboardSidebar
          activeSection={activeSection}
          isReportMenuOpen={isReportMenuOpen}
          items={dashboardSidebarItems}
          loading={loading}
          onLogout={handleLogout}
          onSelectReportSection={handleReportSectionChange}
          onSelectSection={handleSectionChange}
          onToggleReportMenu={handleReportMenuToggle}
        />

        <section className="min-w-0 overflow-x-hidden">
          <DashboardHeader
            brandName={brandName}
            businessName={businessName}
            isQuickActionsOpen={isQuickActionsOpen}
            onOpenAppointmentModal={openAppointmentModal}
            onOpenAccountSettings={openAccountSettingsModal}
            onOpenCustomerModal={openCustomerModal}
            onOpenPackageSaleModal={openPackageSaleModal}
            onOpenProductModal={openProductModal}
            onPlaceholderAction={handlePlaceholderAction}
            onQuickActionSectionSelect={handleQuickActionSectionSelect}
            onToggleQuickActions={() => setIsQuickActionsOpen((current) => !current)}
            userEmail={userEmail}
          />

          <DashboardBreadcrumb activeSection={activeSection} />

          <div className="px-5 py-6 md:px-6">
              {activeSection === 'Ozet' ? (
                <OverviewPage
                  message={message}
                  onChangePersonnelPeriod={setOverviewPersonnelPeriod}
                  personnelPeriod={overviewPersonnelPeriod}
                  topPersonnelRows={overviewTopPersonnelRows}
                  topServiceRows={overviewTopServiceRows}
                  totals={dashboardOverviewTotals}
                  upcomingAppointments={overviewUpcomingAppointments}
                />
              ) : activeSection === 'Randevu takvimi' ? (
                <CalendarPage
                  calendarRangeLabel={calendarRangeLabel}
                  calendarSlots={calendarSlots}
                  calendarStaffFilter={calendarStaffFilter}
                  calendarStaffOptions={['Tum personeller', ...allKnownStaffOptions]}
                  calendarView={calendarView}
                  currentMonthDate={currentMonthDate}
                  dailyAppointments={dailyAppointments}
                  isCalendarViewMenuOpen={isCalendarViewMenuOpen}
                  loading={loading}
                  message={message}
                  monthAppointmentsByDate={monthAppointmentsByDate}
                  monthGridDates={monthGridDates}
                  onChangeCalendarView={handleCalendarViewChange}
                  onGoToNextCalendarRange={goToNextCalendarRange}
                  onGoToPreviousCalendarRange={goToPreviousCalendarRange}
                  onOpenAppointmentModal={openAppointmentModal}
                  onRefreshAppointments={() => void getAppointments()}
                  onSelectCalendarStaff={setCalendarStaffFilter}
                  onSelectToday={() => setCalendarDate(getTodayDateInputValue())}
                  onStartEditingNote={startEditingNote}
                  setIsCalendarViewMenuOpen={setIsCalendarViewMenuOpen}
                  weekAppointmentsByDate={weekAppointmentsByDate}
                  weekDates={weekDates}
                />
              ) : activeSection === 'Musteriler' ? (
                <CustomersPage
                  customers={mergedCustomers}
                  message={message}
                  onEditCustomer={openCustomerModal}
                  onOpenMessageModal={openMessageModal}
                  onOpenCustomerModal={openCustomerModal}
                  onRefreshCustomers={() => void getCustomers()}
                />
              ) : activeSection === 'Kullanicilar' && userRole === 'owner' ? (
                <AccessManagementPage
                  activeUserDetail={activeManagedUserDetail}
                  activeUserDetailId={activeManagedUserId}
                  currentUserId={userId}
                  deletingUserId={deletingUserId}
                  inviteEmail={inviteEmailDraft}
                  invites={managedInvites}
                  isCreatingInvite={isCreatingInvite}
                  isLoading={isAccessLoading}
                  isUserDetailLoading={isManagedUserDetailLoading}
                  lastCreatedInvite={lastCreatedInvite}
                  message={message}
                  onCloseUserDetail={closeManagedUserDetail}
                  onCreateInvite={() => void createInviteCode()}
                  onDeleteUser={(user) => void deleteManagedUser(user)}
                  onInviteEmailChange={setInviteEmailDraft}
                  onRefresh={() => void loadAccessManagement()}
                  onRevokeInvite={(inviteId) => void revokeInviteCode(inviteId)}
                  onSelectUser={(user) => void loadManagedUserDetail(user)}
                  onUpdateUserStatus={(user, nextStatus) =>
                    void setManagedUserStatus(user, nextStatus)
                  }
                  revokingInviteId={revokingInviteId}
                  updatingUserId={updatingUserId}
                  users={managedUsers}
                />
              ) : activeSection === 'Kasa raporu' ? (
                <CashReportPage
                  message={message}
                  onEndDateChange={setCashReportEndDate}
                  onPeriodChange={setCashReportPeriod}
                  onStartDateChange={setCashReportStartDate}
                  onToggleSection={toggleCashReportSection}
                  openCashReportSections={openCashReportSections}
                  period={cashReportPeriod}
                  rangeEndDate={cashReportEndDate}
                  rangeStartDate={cashReportStartDate}
                  reportLabel={cashReportPeriodLabel}
                  sections={cashReportComputedSections as readonly CashReportSection[]}
                />
              ) : activeSection === 'Personel raporu' ? (
                <PersonnelReportPage
                  compensationDrafts={staffCompensationDrafts}
                  isSavingCompensationFor={savingCompensationStaff}
                  message={message}
                  onCompensationDraftChange={handleCompensationDraftChange}
                  onDownloadPayrollPdf={downloadPersonnelPayrollPdf}
                  onEndDateChange={setPersonnelReportEndDate}
                  onOpenPersonnelDetail={openPersonnelDetailModal}
                  onPeriodChange={setCashReportPeriod}
                  onRefreshReport={() => {
                    void getAppointments()
                    void getPackageSales()
                    void getStaffCompensationSettings()
                  }}
                  onSaveCompensation={saveStaffCompensation}
                  onStartDateChange={setPersonnelReportStartDate}
                  period={cashReportPeriod}
                  rangeEndDate={personnelReportEndDate}
                  rangeStartDate={personnelReportStartDate}
                  rows={personnelCompensationRows as readonly PersonnelCompensationRow[]}
                  staffMembers={staffMembers.map((item) => ({
                    name: item.name,
                    services: item.services || [],
                  }))}
                />
              ) : activeSection === 'Satis raporlari' ? (
                <SalesReportPage
                  comparisonCards={salesReportComparisonCards}
                  creatorRows={creatorRows}
                  customerSegmentRows={customerSegmentRows}
                  dayRows={dayRows}
                  hourRows={hourRows}
                  message={message}
                  onPeriodChange={setCashReportPeriod}
                  onRefreshReport={() => {
                    void getAppointments()
                    void getPackageSales()
                    void getProducts()
                  }}
                  onTargetChange={setSalesReportTarget}
                  packageRows={packageRows}
                  paymentRows={paymentRows}
                  period={cashReportPeriod}
                  personnelRows={personnelReportRows}
                  productRows={productRows}
                  salesTimelineRows={salesTimelineRows}
                  serviceRows={serviceRows}
                  targetValue={salesReportTarget}
                  targetValueNumeric={salesReportTargetValue}
                  totals={salesReportTotals}
                />
              ) : activeSection === 'Paket satislari' ? (
                <PackageSalesPage
                  message={message}
                  onOpenPackageSessionModal={openPackageSessionModal}
                  onOpenPackageSaleModal={openPackageSaleModal}
                  onRefreshPackageSales={() => void getPackageSales()}
                  packageSales={packageSaleRows}
                />
              ) : activeSection === 'Urun ve hizmet' ? (
                <ProductsPage
                  message={message}
                  onDeleteProduct={deleteProduct}
                  onEditProduct={openProductModal}
                  onOpenProductHistory={openProductHistoryModal}
                  onOpenProductModal={openProductModal}
                  onRefreshProducts={() => void getProducts()}
                  products={products}
                />
              ) : (
                <AppointmentsPage
                  appointmentRows={appointmentRows}
                  message={message}
                  onDeleteNote={deleteNote}
                  onOpenAppointmentClosingModal={openAppointmentClosingModal}
                  onPlaceholderAction={handlePlaceholderAction}
                  onRefreshAppointments={() => void getAppointments()}
                  onStartEditingNote={startEditingNote}
                />
              )}

              <AppointmentModal
                draft={appointmentDraft}
                isEditing={editingAppointmentId !== null}
                isOpen={isAppointmentModalOpen}
                loading={loading}
                onClose={closeAppointmentModal}
                onDraftChange={setAppointmentDraft}
                staffMembers={staffMembers.map((item) => ({
                  name: item.name,
                  services: item.services || [],
                }))}
                onSubmit={saveAppointment}
              />

              <CustomerModal
                draft={customerDraft}
                isEditing={editingCustomerId !== null}
                isOpen={isCustomerModalOpen}
                loading={loading}
                onClose={closeCustomerModal}
                onDraftChange={setCustomerDraft}
                onSubmit={saveCustomer}
              />

              <MessageModal
                body={messageBody}
                channel={messageChannel}
                isOpen={isMessageModalOpen}
                loading={sendingMessage}
                onBodyChange={setMessageBody}
                onChannelChange={setMessageChannel}
                onClose={closeMessageModal}
                onSubmit={sendCustomerMessage}
                onSubjectChange={setMessageSubject}
                recipient={activeMessageCustomer}
                subject={messageSubject}
              />

              <ProductModal
                draft={productDraft}
                isEditing={editingProductId !== null}
                isOpen={isProductModalOpen}
                loading={loading}
                onClose={closeProductModal}
                onDraftChange={setProductDraft}
                onSubmit={addProduct}
              />

              <PackageSaleModal
                draft={packageSaleDraft}
                isOpen={isPackageSaleModalOpen}
                loading={loading}
                onClose={closePackageSaleModal}
                onDraftChange={setPackageSaleDraft}
                onSubmit={addPackageSale}
              />

              <PackageSessionModal
                draft={packageSessionDraft}
                isOpen={isPackageSessionModalOpen}
                loading={loading}
                onClose={closePackageSessionModal}
                onDraftChange={setPackageSessionDraft}
                staffOptions={activeStaffOptions}
                onSubmit={addPackageSession}
                packageSale={activePackageSale}
              />

              <AppointmentClosingModal
                draft={appointmentClosingDraft}
                isPackageSession={
                  !!appointments.find((item) => item.id === closingAppointmentId)?.package_sale_id
                }
                isOpen={isAppointmentClosingModalOpen}
                loading={loading}
                onClose={closeAppointmentClosingModal}
                onDraftChange={setAppointmentClosingDraft}
                productOptions={appointmentClosingProductOptions}
                onSubmit={closeAppointment}
              />

              <PersonnelDetailModal
                entries={activePersonnelDetailEntries}
                isOpen={isPersonnelDetailModalOpen}
                onClose={closePersonnelDetailModal}
                period={personnelReportPeriodLabel}
                staffRow={activePersonnelDetailRow}
              />

              <ProductHistoryModal
                entries={activeProductHistoryEntries}
                isOpen={isProductHistoryModalOpen}
                onClose={closeProductHistoryModal}
                productName={activeProductName}
              />

              <AccountSettingsModal
                brandName={accountBrandNameDraft}
                businessName={accountBusinessNameDraft}
                deletingStaffId={deletingStaffId}
                editingStaffMemberId={editingStaffMemberId}
                email={userEmail}
                isOpen={isAccountSettingsModalOpen}
                isCreatingStaff={creatingStaff}
                isStaffCreatePanelOpen={isStaffCreatePanelOpen}
                loading={loading}
                onBrandNameChange={setAccountBrandNameDraft}
                onBusinessNameChange={setAccountBusinessNameDraft}
                onCancelStaffEdit={resetStaffEditor}
                onClose={closeAccountSettingsModal}
                onEditStaff={startEditingStaffMember}
                onRemoveStaff={removeStaffMember}
                onSaveStaff={saveStaffMember}
                onStaffServiceToggle={toggleStaffServiceDraft}
                onStaffDraftChange={setStaffDraft}
                onToggleStaffCreatePanel={toggleStaffCreatePanel}
                onSubmit={saveAccountSettings}
                serviceOptions={serviceOptions.map((item) => item.label)}
                staffDraft={staffDraft}
                staffMembers={staffMembers.map((item) => ({
                  id: item.id,
                  name: item.name,
                  services: item.services || [],
                }))}
                staffServiceDraft={staffServiceDraft}
              />
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#bcece6_0%,transparent_28%),linear-gradient(135deg,#103d47_0%,#1b7e84_46%,#ff8c66_100%)] px-4 text-[#20403d]">
      <div className="w-full max-w-md rounded-[30px] border border-white/45 bg-[linear-gradient(180deg,rgba(255,255,255,0.9)_0%,rgba(248,253,252,0.86)_100%)] p-8 shadow-[0_30px_80px_rgba(17,73,79,0.22)] backdrop-blur-xl">
        <div className="mb-8 text-center">
          <p className="mb-2 text-sm uppercase tracking-[0.3em] text-[#15928a]">
            glowUp
          </p>
          <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[#154c57]">Hos geldin</h1>
          <p className="mt-2 text-sm text-[#6b817d]">
            {isPasswordRecoveryMode
              ? 'Email linki dogrulandi. Simdi yeni sifreni belirle'
              : isForgotPasswordMode
                ? 'Email adresini gir, sifre yenileme linki gonderelim'
                : mode === 'login'
              ? 'Email ve sifren ile giris yap'
              : registerStep === 'verify-invite'
                ? 'Email ve tek kullanimlik davet kodunu dogrula'
                : 'Davet onaylandi. Simdi sifreni olustur'}
          </p>
        </div>

        {!isPasswordRecoveryMode && (
          <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-[#edf7f5] p-1">
            <button
              onClick={() => {
                setMode('login')
                closeForgotPasswordMode()
                resetRegisterFlow()
                setMessage('')
              }}
              className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                mode === 'login' && !isForgotPasswordMode
                  ? 'bg-[linear-gradient(135deg,#15928a_0%,#46c4b4_100%)] text-white'
                  : 'text-[#78908c] hover:bg-white'
              }`}
            >
              Giris Yap
            </button>
            <button
              onClick={() => {
                setMode('register')
                closeForgotPasswordMode()
                resetRegisterFlow()
                setMessage('')
              }}
              className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                mode === 'register'
                  ? 'bg-[linear-gradient(135deg,#ff8c66_0%,#ffb06a_100%)] text-white'
                  : 'text-[#78908c] hover:bg-white'
              }`}
            >
              Kayit Ol
            </button>
          </div>
        )}

        <div className="space-y-4">
          <input
            type="email"
            placeholder={isForgotPasswordMode ? 'Kayitli email adresin' : 'Email adresin'}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            readOnly={
              isPasswordRecoveryMode || (mode === 'register' && registerStep === 'create-password')
            }
            className={`w-full rounded-2xl border border-[#d7e8e3] bg-white px-4 py-3 text-[#34504c] outline-none placeholder:text-[#97aba7] ${
              isPasswordRecoveryMode || (mode === 'register' && registerStep === 'create-password')
                ? 'opacity-80'
                : ''
            }`.trim()}
          />

          {mode === 'register' && !isForgotPasswordMode && !isPasswordRecoveryMode && (
            <input
              type="text"
              placeholder="Davet kodun"
              value={inviteCode}
              onChange={(event) => setInviteCode(normalizeInviteCodeInput(event.target.value))}
              readOnly={registerStep === 'create-password'}
              className={`w-full rounded-2xl border border-[#d7e8e3] bg-white px-4 py-3 text-[#34504c] outline-none placeholder:text-[#97aba7] ${
                registerStep === 'create-password' ? 'opacity-80' : ''
              }`.trim()}
            />
          )}

          {((mode === 'login' && !isForgotPasswordMode) ||
            registerStep === 'create-password' ||
            isPasswordRecoveryMode) && (
            <input
              type="password"
              placeholder={
                isPasswordRecoveryMode
                  ? 'Yeni sifren'
                  : mode === 'login'
                    ? 'Sifren'
                    : 'Yeni sifren'
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-[#d7e8e3] bg-white px-4 py-3 text-[#34504c] outline-none placeholder:text-[#97aba7]"
            />
          )}

          {((mode === 'register' && registerStep === 'create-password') || isPasswordRecoveryMode) && (
            <input
              type="password"
              placeholder="Sifre tekrar"
              value={passwordConfirm}
              onChange={(event) => setPasswordConfirm(event.target.value)}
              className="w-full rounded-2xl border border-[#d7e8e3] bg-white px-4 py-3 text-[#34504c] outline-none placeholder:text-[#97aba7]"
            />
          )}

          {isForgotPasswordMode && (
            <div className="rounded-2xl border border-[#d7e8e3] bg-[#f4fbfa] px-4 py-3 text-sm text-[#64807b]">
              Gonderilen linke tikladiginda bu ekrana donup yeni sifreni belirleyeceksin.
            </div>
          )}

          {mode === 'register' && registerStep === 'create-password' && (
            <div className="rounded-2xl border border-[#ffd4c5] bg-[#fff4ef] px-4 py-3 text-sm text-[#c45a3c]">
              Davet kodu ve email eslesti. Bu hesap icin ilk sifreyi simdi olusturuyorsun.
            </div>
          )}

          {isPasswordRecoveryMode && (
            <div className="rounded-2xl border border-[#ffd4c5] bg-[#fff4ef] px-4 py-3 text-sm text-[#c45a3c]">
              Link gecerli. Yeni sifreni kaydedince guvenlik icin oturum kapatilacak.
            </div>
          )}

          <button
            onClick={
              isPasswordRecoveryMode
                ? handlePasswordRecoveryReset
                : isForgotPasswordMode
                  ? handleForgotPasswordRequest
                  : mode === 'login'
                    ? handleLogin
                    : handleRegister
            }
            disabled={loading}
            className="w-full rounded-2xl bg-[linear-gradient(135deg,#15928a_0%,#46c4b4_100%)] px-4 py-3 font-medium text-white shadow-[0_12px_24px_rgba(21,146,138,0.2)] disabled:opacity-50"
          >
            {loading
              ? 'Bekle...'
              : isPasswordRecoveryMode
                ? 'Sifreyi guncelle'
                : isForgotPasswordMode
                  ? 'Sifirlama linki gonder'
                  : mode === 'login'
                ? 'Giris Yap'
                : registerStep === 'verify-invite'
                  ? 'Kodu dogrula'
                  : 'Hesap olustur'}
          </button>

          {!isPasswordRecoveryMode && mode === 'login' && !isForgotPasswordMode && (
            <button
              type="button"
              onClick={openForgotPasswordMode}
              className="w-full text-sm text-[#6b817d] underline underline-offset-4"
            >
              Sifremi unuttum
            </button>
          )}

          {!isPasswordRecoveryMode && isForgotPasswordMode && (
            <button
              type="button"
              onClick={() => {
                closeForgotPasswordMode()
                setMessage('')
              }}
              className="w-full text-sm text-[#6b817d] underline underline-offset-4"
            >
              Giris ekranina don
            </button>
          )}

          {isPasswordRecoveryMode && (
            <button
              type="button"
              onClick={() => void cancelPasswordRecoveryFlow()}
              className="w-full text-sm text-[#6b817d] underline underline-offset-4"
            >
              Iptal et
            </button>
          )}
        </div>

        {message && (
          <div className="mt-5 rounded-2xl border border-[#d7e8e3] bg-[#f4fbfa] px-4 py-3 text-sm text-[#5e7470]">
            {message}
          </div>
        )}
      </div>
    </main>
  )
}
