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
  staffOptions,
  weekDayLongLabels,
} from '@/app/_home/constants'
import { DashboardBreadcrumb } from '@/app/_home/components/dashboard-breadcrumb'
import { DashboardHeader } from '@/app/_home/components/dashboard-header'
import { DashboardSidebar } from '@/app/_home/components/dashboard-sidebar'
import { AccountSettingsModal } from '@/app/_home/modals/account-settings-modal'
import { AppointmentClosingModal } from '@/app/_home/modals/appointment-closing-modal'
import { AppointmentModal } from '@/app/_home/modals/appointment-modal'
import { CustomerModal } from '@/app/_home/modals/customer-modal'
import { PackageSaleModal } from '@/app/_home/modals/package-sale-modal'
import { PackageSessionModal } from '@/app/_home/modals/package-session-modal'
import { PersonnelDetailModal } from '@/app/_home/modals/personnel-detail-modal'
import { ProductHistoryModal } from '@/app/_home/modals/product-history-modal'
import { ProductModal } from '@/app/_home/modals/product-modal'
import { CalendarPage } from '@/app/_home/pages/calendar-page'
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
  MergedCustomer,
  PackageSale,
  PackageSaleDraft,
  PackageSaleRow,
  PackageSessionDraft,
  PersonnelDetailEntry,
  PersonnelReportRow,
  Product,
  ProductDraft,
} from '@/app/_home/types'
import {
  addDays,
  addMonths,
  createDateFromIso,
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

const defaultBrandName = 'glowUp'
const defaultBusinessName = 'Pera Beauty House'

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
  const [activeSection, setActiveSection] = useState('Randevular')
  const [calendarView, setCalendarView] = useState('Gunluk gorunum')
  const [calendarDate, setCalendarDate] = useState(getTodayDateInputValue())
  const [calendarStaffFilter, setCalendarStaffFilter] = useState('Tum personeller')
  const [cashReportPeriod, setCashReportPeriod] = useState<CashReportPeriod>('Bu ay')
  const [salesReportTarget, setSalesReportTarget] = useState('100000')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
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
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [userId, setUserId] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [brandName, setBrandName] = useState(defaultBrandName)
  const [businessName, setBusinessName] = useState(defaultBusinessName)
  const [accountBrandNameDraft, setAccountBrandNameDraft] = useState(defaultBrandName)
  const [accountBusinessNameDraft, setAccountBusinessNameDraft] = useState(defaultBusinessName)
  const [appointmentDraft, setAppointmentDraft] = useState<AppointmentDraft>(
    defaultAppointmentDraft
  )
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [packageSales, setPackageSales] = useState<PackageSale[]>([])
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
  const [closingAppointmentId, setClosingAppointmentId] = useState<number | null>(null)
  const [editingAppointmentId, setEditingAppointmentId] = useState<number | null>(null)
  const [appointmentClosingDraft, setAppointmentClosingDraft] = useState<AppointmentClosingDraft>(
    defaultAppointmentClosingDraft
  )
  const [loading, setLoading] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [message, setMessage] = useState('')

  const handlePlaceholderAction = (label: string) => {
    if (label === 'Ayar') {
      setIsAccountSettingsModalOpen(true)
      setMessage('')
      return
    }

    setMessage(`${label} ozelligi hazirlaniyor.`)
  }

  const openAccountSettingsModal = () => {
    setAccountBrandNameDraft(brandName)
    setAccountBusinessNameDraft(businessName)
    setIsAccountSettingsModalOpen(true)
    setMessage('')
  }

  const closeAccountSettingsModal = () => {
    setAccountBrandNameDraft(brandName)
    setAccountBusinessNameDraft(businessName)
    setIsAccountSettingsModalOpen(false)
  }

  const handleSectionChange = (section: string) => {
    setIsSidebarOpen(false)
    setActiveSection(section)
    if (section !== 'Raporlar') {
      setIsReportMenuOpen(false)
    }
    setMessage(
      section === 'Ozet' ||
        section === 'Randevular' ||
        section === 'Randevu takvimi' ||
        section === 'Urun ve hizmet' ||
        section === 'Paket satislari'
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
    setIsSidebarOpen(false)
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

  const checkUser = async () => {
    const { data, error } = await supabase.auth.getUser()

    if (error || !data.user) {
      setUserId('')
      setUserEmail('')
      setBrandName(defaultBrandName)
      setBusinessName(defaultBusinessName)
      setAccountBrandNameDraft(defaultBrandName)
      setAccountBusinessNameDraft(defaultBusinessName)
      setAppointments([])
      setCustomers([])
      setProducts([])
      setPackageSales([])
      return
    }

    setUserId(data.user.id)
    setUserEmail(data.user.email || '')
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

  const handleRegister = async () => {
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    setMessage('Kayit basarili. Gerekirse email onayini kontrol et.')
    setLoading(false)
  }

  const handleLogin = async () => {
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    await checkUser()
    await getAppointments()
    await getCustomers()
    await getProducts()
    await getPackageSales()
    setMessage('Giris basarili.')
    setLoading(false)
  }

  const handleLogout = async () => {
    setIsSidebarOpen(false)
    setLoggingOut(true)
    setLoading(true)
    setMessage('')
    setEmail('')
    setPassword('')
    setUserId('')
    setUserEmail('')
    setBrandName(defaultBrandName)
    setBusinessName(defaultBusinessName)
    setAccountBrandNameDraft(defaultBrandName)
    setAccountBusinessNameDraft(defaultBusinessName)
    setAppointmentDraft(defaultAppointmentDraft)
    setAppointments([])
    setCustomers([])
    setProducts([])
    setPackageSales([])
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
      setLoggingOut(false)
      setLoading(false)
      return
    }

    setLoggingOut(false)
    setLoading(false)
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
            phone: normalizedPhone,
          })
          .eq('id', editingCustomerId)
          .eq('user_id', user.id)
      : await supabase.from('customers').insert([
          {
            user_id: user.id,
            customer: trimmedCustomer,
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
        setAppointments([])
        setCustomers([])
        setProducts([])
        setPackageSales([])
        return
      }

      setUserId(session.user.id)
      setUserEmail(session.user.email || '')
    }

    const loadInitialUser = async () => {
      await supabase.auth.signOut({ scope: 'local' })

      const { data, error } = await supabase.auth.getSession()

      if (error) {
        setMessage('Oturum kontrolu yapilamadi. Giris yapmayi tekrar dene.')
        applySession(null)
        return
      }

      applySession(data.session)
    }

    void loadInitialUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!userId) {
      return
    }

    void loadAppointments()
    void loadCustomers()
    void loadProducts()
    void loadPackageSales()
  }, [userId])

  if (userEmail && !loggingOut) {
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
    const appointmentIncomeTotal = closedAppointmentsForReport.reduce((total, item) => {
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
        value: formatCurrencyValue(appointmentIncomeTotal + packageSalesTotal),
        items: [
          ['Randevu gelirleri', formatCurrencyValue(appointmentIncomeTotal)],
          ['Paket satislari', formatCurrencyValue(packageSalesTotal)],
          ['Genel toplam', formatCurrencyValue(appointmentIncomeTotal + packageSalesTotal)],
        ],
      },
      {
        key: 'income',
        label: 'Gelirler toplami',
        value: formatCurrencyValue(appointmentIncomeTotal + packageSalesTotal),
        items: [
          ['Nakit', formatCurrencyValue(appointmentCashTotals.nakit)],
          ['Kredi karti', formatCurrencyValue(appointmentCashTotals.krediKarti)],
          ['Havale', formatCurrencyValue(appointmentCashTotals.havale)],
          ['Online odeme', formatCurrencyValue(appointmentCashTotals.onlineOdeme)],
          ['Diger', formatCurrencyValue(appointmentCashTotals.diger)],
          ['Paket satislari', formatCurrencyValue(packageSalesTotal)],
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
    const todayIso = getTodayDateInputValue()
    const buildPersonnelRowsForPeriod = (period: 'Bugun' | CashReportPeriod) => {
      const rowsByStaff = staffOptions.reduce<Record<string, PersonnelReportRow>>((result, staffName) => {
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

      const isWithinPersonnelPeriod = (dateValue: string | null) => {
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
    const personnelReportRows = buildPersonnelRowsForPeriod(cashReportPeriod)
    const paidAppointmentSalesForReport = closedAppointmentsForReport
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
    const paidPackageSalesForReport = packageSalesForReport
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
      ...closedAppointmentsForReport
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

      return result
    }, [])
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

    return (
      <main className="min-h-screen overflow-x-hidden bg-[#dfe3ec] text-slate-900">
        <div className="flex min-h-screen overflow-x-hidden">
          <DashboardSidebar
            activeSection={activeSection}
            isOpen={isSidebarOpen}
            isReportMenuOpen={isReportMenuOpen}
            loading={loading}
            onClose={() => setIsSidebarOpen(false)}
            onLogout={handleLogout}
            onSelectReportSection={handleReportSectionChange}
            onSelectSection={handleSectionChange}
            onToggleReportMenu={handleReportMenuToggle}
          />

          <section className="min-w-0 flex-1 overflow-x-hidden lg:pl-[300px]">
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
              onToggleSidebar={() => setIsSidebarOpen((current) => !current)}
              onToggleQuickActions={() => setIsQuickActionsOpen((current) => !current)}
              userEmail={userEmail}
            />

            <DashboardBreadcrumb activeSection={activeSection} />

            <div className="px-4 py-5 md:px-6">
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
                  calendarStaffOptions={['Tum personeller', ...staffOptions]}
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
                  onOpenCustomerModal={openCustomerModal}
                  onRefreshCustomers={() => void getCustomers()}
                />
              ) : activeSection === 'Kasa raporu' ? (
                <CashReportPage
                  message={message}
                  onPeriodChange={setCashReportPeriod}
                  onToggleSection={toggleCashReportSection}
                  openCashReportSections={openCashReportSections}
                  period={cashReportPeriod}
                  sections={cashReportComputedSections as readonly CashReportSection[]}
                />
              ) : activeSection === 'Personel raporu' ? (
                <PersonnelReportPage
                  message={message}
                  onOpenPersonnelDetail={openPersonnelDetailModal}
                  onPeriodChange={setCashReportPeriod}
                  onRefreshReport={() => {
                    void getAppointments()
                    void getPackageSales()
                  }}
                  period={cashReportPeriod}
                  rows={personnelReportRows as readonly PersonnelReportRow[]}
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
                period={cashReportPeriod}
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
                email={userEmail}
                isOpen={isAccountSettingsModalOpen}
                loading={loading}
                onBrandNameChange={setAccountBrandNameDraft}
                onBusinessNameChange={setAccountBusinessNameDraft}
                onClose={closeAccountSettingsModal}
                onSubmit={saveAccountSettings}
              />
            </div>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#242738_0%,#5c3a3d_42%,#c68b61_100%)] px-4 text-white">
      <div className="w-full max-w-md rounded-[30px] border border-white/10 bg-black/35 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div className="mb-8 text-center">
          <p className="mb-2 text-sm uppercase tracking-[0.3em] text-lime-300">
            glowUp
          </p>
          <h1 className="text-4xl font-semibold tracking-[-0.04em]">Hos geldin</h1>
          <p className="mt-2 text-sm text-white/70">Giris yap veya hesap olustur</p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-white/5 p-1">
          <button
            onClick={() => setMode('login')}
            className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
              mode === 'login'
                ? 'bg-lime-300 text-slate-950'
                : 'text-white/70 hover:bg-white/5'
            }`}
          >
            Giris Yap
          </button>
          <button
            onClick={() => setMode('register')}
            className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
              mode === 'register'
                ? 'bg-lime-300 text-slate-950'
                : 'text-white/70 hover:bg-white/5'
            }`}
          >
            Kayit Ol
          </button>
        </div>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email adresin"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/40"
          />
          <input
            type="password"
            placeholder="Sifren"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/40"
          />
          <button
            onClick={mode === 'login' ? handleLogin : handleRegister}
            disabled={loading}
            className="w-full rounded-2xl bg-lime-300 px-4 py-3 font-medium text-slate-950 disabled:opacity-50"
          >
            {loading ? 'Bekle...' : mode === 'login' ? 'Giris Yap' : 'Kayit Ol'}
          </button>
        </div>

        {message && (
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
            {message}
          </div>
        )}
      </div>
    </main>
  )
}
