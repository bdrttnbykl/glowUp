'use client'

import { useEffect, useEffectEvent, useState } from 'react'
import {
  defaultAppointmentClosingDraft,
  defaultAppointmentDraft,
  defaultCustomerDraft,
  defaultPackageSaleDraft,
  defaultPackageSessionDraft,
  defaultProductDraft,
  staffOptions,
  weekDayLongLabels,
} from '@/app/_home/constants'
import { DashboardBreadcrumb } from '@/app/_home/components/dashboard-breadcrumb'
import { DashboardHeader } from '@/app/_home/components/dashboard-header'
import { DashboardSidebar } from '@/app/_home/components/dashboard-sidebar'
import { AppointmentClosingModal } from '@/app/_home/modals/appointment-closing-modal'
import { AppointmentModal } from '@/app/_home/modals/appointment-modal'
import { CustomerModal } from '@/app/_home/modals/customer-modal'
import { PackageSaleModal } from '@/app/_home/modals/package-sale-modal'
import { PackageSessionModal } from '@/app/_home/modals/package-session-modal'
import { ProductModal } from '@/app/_home/modals/product-modal'
import { CalendarPage } from '@/app/_home/pages/calendar-page'
import { AppointmentsPage } from '@/app/_home/pages/appointments-page'
import { CashReportPage } from '@/app/_home/pages/cash-report-page'
import { CustomersPage } from '@/app/_home/pages/customers-page'
import { PackageSalesPage } from '@/app/_home/pages/package-sales-page'
import { PersonnelReportPage } from '@/app/_home/pages/personnel-report-page'
import { ProductsPage } from '@/app/_home/pages/products-page'
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
  formatMonthRangeLabel,
  formatWeekRangeLabel,
  getMonthGridDates,
  getTimeSlotIndex,
  getTodayDateInputValue,
  getWeekDates,
  isDateWithinReportPeriod,
  parseCurrencyValue,
} from '@/app/_home/utils'
import { supabase } from '@/lib/supabase'

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

const createCustomerSalesKey = (customer: string | null, phone: string | null) => {
  const normalizedCustomer = (customer || '').trim().toLocaleLowerCase('tr-TR')
  const normalizedPhone = (phone || '').replace(/\D/g, '')

  if (!normalizedCustomer) {
    return ''
  }

  return `${normalizedCustomer}::${normalizedPhone}`
}

const getPercentageDelta = (currentValue: number, previousValue: number) => {
  if (previousValue === 0) {
    return currentValue === 0 ? 0 : null
  }

  return ((currentValue - previousValue) / previousValue) * 100
}

export default function Home() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [activeSection, setActiveSection] = useState('Randevular')
  const [calendarView, setCalendarView] = useState('Gunluk gorunum')
  const [calendarDate, setCalendarDate] = useState(getTodayDateInputValue())
  const [cashReportPeriod, setCashReportPeriod] = useState<CashReportPeriod>('Bu ay')
  const [salesReportTarget, setSalesReportTarget] = useState('100000')
  const [isReportMenuOpen, setIsReportMenuOpen] = useState(true)
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
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [userId, setUserId] = useState('')
  const [userEmail, setUserEmail] = useState('')
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
  const [packageSaleDraft, setPackageSaleDraft] = useState<PackageSaleDraft>(
    defaultPackageSaleDraft
  )
  const [packageSessionDraft, setPackageSessionDraft] = useState<PackageSessionDraft>(
    defaultPackageSessionDraft
  )
  const [activePackageSaleId, setActivePackageSaleId] = useState<number | null>(null)
  const [closingAppointmentId, setClosingAppointmentId] = useState<number | null>(null)
  const [appointmentClosingDraft, setAppointmentClosingDraft] = useState<AppointmentClosingDraft>(
    defaultAppointmentClosingDraft
  )
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [message, setMessage] = useState('')

  const handlePlaceholderAction = (label: string) => {
    setMessage(`${label} ozelligi hazirlaniyor.`)
  }

  const handleSectionChange = (section: string) => {
    setActiveSection(section)
    setMessage(
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
    setActiveSection(section)
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
    setAppointmentDraft((current) => ({
      ...defaultAppointmentDraft,
      date: current.date || calendarDate || getTodayDateInputValue(),
      creator: current.creator || userEmail,
    }))
    setMessage('')
    setIsAppointmentModalOpen(true)
  }

  const closeAppointmentModal = () => {
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

  const openProductModal = () => {
    setActiveSection('Urun ve hizmet')
    setIsQuickActionsOpen(false)
    setProductDraft(defaultProductDraft)
    setMessage('')
    setIsProductModalOpen(true)
  }

  const closeProductModal = () => {
    setIsProductModalOpen(false)
  }

  const openPackageSaleModal = () => {
    setActiveSection('Paket satislari')
    setIsQuickActionsOpen(false)
    setPackageSaleDraft({
      ...defaultPackageSaleDraft,
      staff: '',
      firstSessionDate: calendarDate || getTodayDateInputValue(),
    })
    setMessage('')
    setIsPackageSaleModalOpen(true)
  }

  const closePackageSaleModal = () => {
    setIsPackageSaleModalOpen(false)
  }

  const openPackageSessionModal = (item: PackageSaleRow) => {
    if (item.remaining_sessions === 0) {
      setMessage('Bu pakette kullanilacak seans kalmadi.')
      return
    }

    if (item.has_open_appointment) {
      setMessage('Bu paket icin zaten acik bir seans randevusu var.')
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
    setClosingAppointmentId(item.id)
    setAppointmentClosingDraft({
      attendanceStatus: item.attendance_status || 'Geldi',
      paymentMethod: item.payment_method || 'Nakit',
      collectedAmount: item.collected_amount || item.total_price || '',
    })
    setMessage('')
    setIsAppointmentClosingModalOpen(true)
  }

  const closeAppointmentClosingModal = () => {
    setClosingAppointmentId(null)
    setAppointmentClosingDraft(defaultAppointmentClosingDraft)
    setIsAppointmentClosingModalOpen(false)
  }

  const checkUser = async () => {
    const { data, error } = await supabase.auth.getUser()

    if (error || !data.user) {
      setUserId('')
      setUserEmail('')
      setAppointments([])
      setCustomers([])
      setProducts([])
      setPackageSales([])
      return
    }

    setUserId(data.user.id)
    setUserEmail(data.user.email || '')
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
    setLoggingOut(true)
    setLoading(true)
    setMessage('')
    setEmail('')
    setPassword('')
    setUserId('')
    setUserEmail('')
    setAppointmentDraft(defaultAppointmentDraft)
    setAppointments([])
    setCustomers([])
    setProducts([])
    setPackageSales([])
    setCustomerDraft(defaultCustomerDraft)
    setEditingCustomerId(null)
    setProductDraft(defaultProductDraft)
    setPackageSaleDraft(defaultPackageSaleDraft)
    setEditingNoteId(null)
    setEditingContent('')

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

  const addNote = async () => {
    const trimmedService = appointmentDraft.service.trim()
    const today = getTodayDateInputValue()

    if (!trimmedService) {
      setMessage('En azindan hizmet alanini gir.')
      return
    }

    if (!appointmentDraft.staff.trim()) {
      setMessage('Hizmet veren sec.')
      return
    }

    if (appointmentDraft.date && appointmentDraft.date < today) {
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

    const { error } = await supabase.from('appointments').insert([
      {
        user_id: user.id,
        customer: appointmentDraft.customer.trim() || null,
        phone: appointmentDraft.phone.trim() || null,
        service: trimmedService,
        staff: appointmentDraft.staff.trim(),
        date: appointmentDraft.date || null,
        time: appointmentDraft.time || null,
        status: appointmentDraft.status || 'Taslak',
        total_price: appointmentDraft.totalPrice.trim() || null,
        creator: appointmentDraft.creator.trim() || userEmail || user.email || null,
      },
    ])

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    setAppointmentDraft(defaultAppointmentDraft)
    setMessage('Randevu eklendi.')
    setIsAppointmentModalOpen(false)
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

    if (!trimmedProduct) {
      setMessage('Urun adini gir.')
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

    const { error } = await supabase.from('products').insert([
      {
        user_id: user.id,
        product: trimmedProduct,
        transaction_type: productDraft.transactionType.trim() || 'Alis',
        counterparty: productDraft.counterparty.trim() || null,
        category: productDraft.category.trim() || null,
        cost_price: productDraft.costPrice.trim() || null,
        price: productDraft.price.trim() || null,
        stock: productDraft.stock.trim() || null,
      },
    ])

    if (error) {
      setMessage(
        error.message.includes('cost_price') ||
          error.message.includes('transaction_type') ||
          error.message.includes('counterparty')
          ? 'Products tablosu guncel degil. urun migrationlarini calistir.'
          : error.message
      )
      setLoading(false)
      return
    }

    setProductDraft(defaultProductDraft)
    setMessage('Urun eklendi.')
    setIsProductModalOpen(false)
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

    setMessage('Urun silindi.')
    await getProducts()
  }

  const addPackageSale = async () => {
    const trimmedCustomer = packageSaleDraft.customer.trim()
    const trimmedPackageName = packageSaleDraft.packageName.trim()
    const totalSessions = Number.parseInt(packageSaleDraft.totalSessions, 10)
    const today = getTodayDateInputValue()

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

    if (!packageSaleDraft.staff.trim()) {
      setMessage('Ilk seans hizmet veren kisiyi sec.')
      return
    }

    if (!packageSaleDraft.firstSessionDate) {
      setMessage('Ilk seans tarihini sec.')
      return
    }

    if (packageSaleDraft.firstSessionDate < today) {
      setMessage('Gecmis tarihli ilk seans olusturamazsin.')
      return
    }

    if (!packageSaleDraft.firstSessionTime) {
      setMessage('Ilk seans saatini sec.')
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

    const { error: appointmentError } = await supabase.from('appointments').insert([
      {
        user_id: user.id,
        customer: trimmedCustomer,
        phone: packageSaleDraft.phone.trim() || null,
        service: `${trimmedPackageName} / ${packageSaleDraft.sessionType} / 1. seans`,
        staff: packageSaleDraft.staff.trim(),
        date: packageSaleDraft.firstSessionDate,
        time: packageSaleDraft.firstSessionTime,
        status: 'Onayli',
        total_price: null,
        creator: userEmail || user.email || null,
        package_sale_id: data.id,
        package_session_number: 1,
      },
    ])

    if (appointmentError) {
      await supabase.from('package_sales').delete().eq('id', data.id).eq('user_id', user.id)
      setMessage(
        appointmentError.message.includes('package_sale_id')
          ? 'Appointments package migrationlarini calistir.'
          : appointmentError.message
      )
      setLoading(false)
      return
    }

    setPackageSaleDraft(defaultPackageSaleDraft)
    setMessage('Paket ve ilk seans randevusu olusturuldu.')
    setIsPackageSaleModalOpen(false)
    await getPackageSales()
    await getAppointments()
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

    const paymentMethod =
      appointmentClosingDraft.attendanceStatus === 'Gelmedi'
        ? null
        : appointmentClosingDraft.paymentMethod
    const collectedAmount =
      appointmentClosingDraft.attendanceStatus === 'Gelmedi'
        ? null
        : appointmentClosingDraft.collectedAmount.trim() || null
    const shouldConsumePackageSession =
      appointmentClosingDraft.attendanceStatus === 'Geldi' &&
      !!appointment?.package_sale_id &&
      !appointment.package_session_consumed_at

    setLoading(true)
    setMessage('')

    const { error } = await supabase
      .from('appointments')
      .update({
        attendance_status: appointmentClosingDraft.attendanceStatus,
        payment_method: paymentMethod,
        collected_amount: collectedAmount,
        closed_at: new Date().toISOString(),
        package_session_consumed_at: shouldConsumePackageSession
          ? new Date().toISOString()
          : appointment?.package_session_consumed_at || null,
      })
      .eq('id', closingAppointmentId)
      .eq('user_id', userId)

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    if (shouldConsumePackageSession && appointment?.package_sale_id) {
      const packageSale = packageSales.find((item) => item.id === appointment.package_sale_id)

      if (packageSale) {
        const { error: packageError } = await supabase
          .from('package_sales')
          .update({
            used_sessions: Math.min(packageSale.total_sessions, packageSale.used_sessions + 1),
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

    setMessage('Randevu sonucu kaydedildi.')
    closeAppointmentClosingModal()
    await getAppointments()
    await getPackageSales()
    setLoading(false)
  }

  const startEditingNote = (item: Appointment) => {
    setEditingNoteId(item.id)
    setEditingContent(item.service)
    setMessage('')
  }

  const cancelEditingNote = () => {
    setEditingNoteId(null)
    setEditingContent('')
  }

  const updateNote = async (noteId: number) => {
    const trimmedContent = editingContent.trim()

    if (!trimmedContent) {
      setMessage('Plan bos olamaz.')
      return
    }

    const { error } = await supabase
      .from('appointments')
      .update({ service: trimmedContent })
      .eq('id', noteId)
      .eq('user_id', userId)

    if (error) {
      setMessage(error.message)
      return
    }

    setEditingNoteId(null)
    setEditingContent('')
    setMessage('Plan guncellendi.')
    await getAppointments()
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

    if (editingNoteId === noteId) {
      setEditingNoteId(null)
      setEditingContent('')
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
    const dailyAppointments = calendarItems.filter(
      (item) => item.calendarDate === calendarDate && item.slotIndex >= 0
    )
    const weekDates = getWeekDates(calendarDate)
    const weekAppointmentsByDate = weekDates.reduce<Record<string, typeof calendarItems>>(
      (result, date) => {
        result[date] = calendarItems.filter((item) => item.calendarDate === date)
        return result
      },
      {}
    )
    const monthGridDates = getMonthGridDates(calendarDate)
    const monthAppointmentsByDate = monthGridDates.reduce<
      Record<string, typeof calendarItems>
    >((result, date) => {
      result[date] = calendarItems.filter((item) => item.calendarDate === date)
      return result
    }, {})
    const currentMonthDate = createDateFromIso(calendarDate)
    const closedAppointmentsForReport = appointmentRows.filter(
      (item) =>
        !!item.closed_at &&
        item.attendance_status !== 'Gelmedi' &&
        isDateWithinReportPeriod(item.closed_at, cashReportPeriod)
    )
    const packageSalesForReport = packageSales.filter((item) =>
      isDateWithinReportPeriod(item.created_at, cashReportPeriod)
    )
    const productSalesForReport = products.filter(
      (item) =>
        item.transaction_type === 'Satis' &&
        isDateWithinReportPeriod(item.created_at, cashReportPeriod)
    )
    const currentPeriodStart = getReportPeriodStart(cashReportPeriod)
    const previousPeriodReference = new Date(currentPeriodStart.getTime() - 1)
    const closedAppointmentsForPreviousPeriod = appointmentRows.filter(
      (item) =>
        !!item.closed_at &&
        item.attendance_status !== 'Gelmedi' &&
        isDateWithinReportPeriod(item.closed_at, cashReportPeriod, previousPeriodReference)
    )
    const packageSalesForPreviousPeriod = packageSales.filter((item) =>
      isDateWithinReportPeriod(item.created_at, cashReportPeriod, previousPeriodReference)
    )
    const productSalesForPreviousPeriod = products.filter(
      (item) =>
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
    const initialPersonnelRows = staffOptions.reduce<Record<string, PersonnelReportRow>>(
      (result, staffName) => {
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
      },
      {}
    )
    const ensurePersonnelRow = (staffName: string) => {
      const normalizedStaffName = staffName.trim() || 'Atanmamis'

      if (!initialPersonnelRows[normalizedStaffName]) {
        initialPersonnelRows[normalizedStaffName] = {
          staff: normalizedStaffName,
          completedAppointments: 0,
          appointmentRevenue: 0,
          packageSales: 0,
          packageRevenue: 0,
          totalTransactions: 0,
          totalRevenue: 0,
        }
      }

      return initialPersonnelRows[normalizedStaffName]
    }
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

    closedAppointmentsForReport.forEach((item) => {
      const row = ensurePersonnelRow(item.staff || 'Atanmamis')
      row.completedAppointments += 1
      row.appointmentRevenue += parseCurrencyValue(item.collected_amount || item.total_price)
      row.totalTransactions = row.completedAppointments + row.packageSales
      row.totalRevenue = row.appointmentRevenue + row.packageRevenue
    })

    packageSalesForReport.forEach((item) => {
      const row = ensurePersonnelRow(packageSaleStaffLookup[item.id] || 'Atanmamis')
      row.packageSales += 1
      row.packageRevenue += parseCurrencyValue(item.price)
      row.totalTransactions = row.completedAppointments + row.packageSales
      row.totalRevenue = row.appointmentRevenue + row.packageRevenue
    })

    const personnelReportRows = Object.values(initialPersonnelRows).sort((left, right) => {
      if (right.totalRevenue !== left.totalRevenue) {
        return right.totalRevenue - left.totalRevenue
      }

      if (right.totalTransactions !== left.totalTransactions) {
        return right.totalTransactions - left.totalTransactions
      }

      return left.staff.localeCompare(right.staff, 'tr-TR')
    })
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
    const salesActivityEvents = [
      ...paidAppointmentSalesForReport.map((item) => ({
        amount: item.amount,
        occurredAt: item.occurredAt,
      })),
      ...paidPackageSalesForReport.map((item) => ({
        amount: item.amount,
        occurredAt: item.occurredAt,
      })),
      ...paidProductSalesForReport.map((item) => ({
        amount: item.amount,
        occurredAt: item.occurredAt,
      })),
    ]
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
            item.attendance_status !== 'Gelmedi' &&
            parseCurrencyValue(item.collected_amount || item.total_price) > 0
        )
        .map((item) => ({
          customerKey: createCustomerSalesKey(item.customer, item.phone),
          occurredAt: item.closed_at || item.created_at,
        })),
      ...packageSales
        .filter((item) => parseCurrencyValue(item.price) > 0)
        .map((item) => ({
          customerKey: createCustomerSalesKey(item.customer, item.phone),
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
        customerKey: createCustomerSalesKey(item.customer, item.phone),
      })),
      ...paidPackageSalesForReport.map((item) => ({
        amount: item.amount,
        customerKey: createCustomerSalesKey(item.customer, item.phone),
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
      const normalizedPhone = (item.phone || '').trim()
      const existingCustomer = result.find(
        (current) =>
          current.customer.trim().toLocaleLowerCase('tr-TR') === normalizedName &&
          (current.phone || '').trim() === normalizedPhone
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
            isReportMenuOpen={isReportMenuOpen}
            loading={loading}
            onLogout={handleLogout}
            onSelectReportSection={handleReportSectionChange}
            onSelectSection={handleSectionChange}
            onToggleReportMenu={handleReportMenuToggle}
          />

          <section className="min-w-0 flex-1 overflow-x-hidden">
            <DashboardHeader
              isQuickActionsOpen={isQuickActionsOpen}
              onOpenAppointmentModal={openAppointmentModal}
              onOpenCustomerModal={openCustomerModal}
              onOpenPackageSaleModal={openPackageSaleModal}
              onOpenProductModal={openProductModal}
              onPlaceholderAction={handlePlaceholderAction}
              onQuickActionSectionSelect={handleQuickActionSectionSelect}
              onToggleQuickActions={() => setIsQuickActionsOpen((current) => !current)}
              userEmail={userEmail}
            />

            <DashboardBreadcrumb activeSection={activeSection} />

            <div className="px-4 py-5 md:px-6">
              {activeSection === 'Randevu takvimi' ? (
                <CalendarPage
                  calendarRangeLabel={calendarRangeLabel}
                  calendarSlots={calendarSlots}
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
                  onPlaceholderAction={handlePlaceholderAction}
                  onRefreshAppointments={() => void getAppointments()}
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
                  onPlaceholderAction={handlePlaceholderAction}
                  onToggleSection={toggleCashReportSection}
                  openCashReportSections={openCashReportSections}
                  period={cashReportPeriod}
                  sections={cashReportComputedSections as readonly CashReportSection[]}
                />
              ) : activeSection === 'Personel raporu' ? (
                <PersonnelReportPage
                  message={message}
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
                  onOpenProductModal={openProductModal}
                  onRefreshProducts={() => void getProducts()}
                  products={products}
                />
              ) : (
                <AppointmentsPage
                  appointmentRows={appointmentRows}
                  editingContent={editingContent}
                  editingNoteId={editingNoteId}
                  message={message}
                  onCancelEditingNote={cancelEditingNote}
                  onChangeEditingContent={setEditingContent}
                  onDeleteNote={deleteNote}
                  onOpenAppointmentClosingModal={openAppointmentClosingModal}
                  onPlaceholderAction={handlePlaceholderAction}
                  onRefreshAppointments={() => void getAppointments()}
                  onStartEditingNote={startEditingNote}
                  onUpdateNote={updateNote}
                />
              )}

              <AppointmentModal
                draft={appointmentDraft}
                isOpen={isAppointmentModalOpen}
                loading={loading}
                onClose={closeAppointmentModal}
                onDraftChange={setAppointmentDraft}
                onSubmit={addNote}
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
                isOpen={isAppointmentClosingModalOpen}
                loading={loading}
                onClose={closeAppointmentClosingModal}
                onDraftChange={setAppointmentClosingDraft}
                onSubmit={closeAppointment}
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
