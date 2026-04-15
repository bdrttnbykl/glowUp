import type {
  AppointmentClosingDraft,
  AppointmentDraft,
  CustomerDraft,
  PackageSaleDraft,
  PackageSessionDraft,
  ProductDraft,
} from './types'

export const defaultAppointmentDraft: AppointmentDraft = {
  customer: '',
  phone: '',
  service: '',
  staff: '',
  date: '',
  time: '',
  status: 'Taslak',
  totalPrice: '',
  creator: '',
}

export const defaultCustomerDraft: CustomerDraft = {
  customer: '',
  email: '',
  phone: '',
}

export const defaultProductDraft: ProductDraft = {
  product: '',
  itemType: 'Urun',
  transactionType: 'Alis',
  counterparty: '',
  category: '',
  costPrice: '',
  price: '',
  stock: '',
  quantity: '',
}

export const defaultPackageSaleDraft: PackageSaleDraft = {
  customer: '',
  phone: '',
  packageName: '',
  sessionType: 'Lazer',
  totalSessions: '8',
  price: '',
}

export const defaultPackageSessionDraft: PackageSessionDraft = {
  staff: '',
  date: '',
  time: '',
}

export const defaultAppointmentClosingDraft: AppointmentClosingDraft = {
  attendanceStatus: 'Geldi',
  serviceStatus: 'Yapildi',
  paymentMethod: 'Nakit',
  collectedAmount: '',
  productSales: [],
}

export const serviceOptions = [
  { label: 'Ayak Bakimi', price: '750 TL' },
  { label: 'El Bakimi', price: '500 TL' },
  { label: 'Manikur', price: '400 TL' },
  { label: 'Pedikur', price: '450 TL' },
  { label: 'Kalici Oje', price: '650 TL' },
  { label: 'Nail Art', price: '900 TL' },
  { label: 'Cilt Bakimi', price: '1200 TL' },
]

export const packageSessionTypeOptions = [
  'Lazer',
  'Cilt Bakimi',
  'Bolgesel Incelme',
  'Ayak Bakimi',
  'El Bakimi',
]

export const sidebarItems = [
  { label: 'Ozet', icon: 'home' },
  { label: 'Randevu takvimi', icon: 'calendar' },
  { label: 'Randevular', icon: 'clock' },
  { label: 'Adisyonlar', icon: 'list' },
  { label: 'Musteriler', icon: 'users' },
  { label: 'Urun ve hizmet', icon: 'tag' },
  { label: 'Paket satislari', icon: 'grid' },
  { label: 'Raporlar', icon: 'report' },
]

export const reportSidebarItems = [
  { label: 'Kasa raporu', icon: 'pos' },
  { label: 'Personel raporu', icon: 'users' },
  { label: 'Satis raporlari', icon: 'grid' },
]

export const cashReportSections = [
  {
    key: 'total',
    label: 'Toplam',
    value: '0,00 TL',
    items: [
      ['Nakit Toplam', '0,00 TL'],
      ['Kredi karti Toplam', '0,00 TL'],
      ['Havale Toplam', '0,00 TL'],
      ['Online odeme Toplam', '0,00 TL'],
      ['Diger Toplam', '0,00 TL'],
    ],
  },
  {
    key: 'income',
    label: 'Gelirler toplami',
    value: '0,00 TL',
    items: [
      ['Kredi karti', '0,00 TL'],
      ['Nakit', '0,00 TL'],
      ['Havale', '0,00 TL'],
      ['Online odeme', '0,00 TL'],
      ['Diger', '0,00 TL'],
    ],
  },
  {
    key: 'expense',
    label: 'Masraflar toplami',
    value: '0,00 TL',
    items: [],
  },
] as const

export const calendarViewOptions = [
  'Gunluk gorunum',
  'Haftalik gorunum',
  'Aylik gorunum',
  'Liste gorunumu',
  'Yatay gorunum',
]

export const quickActionItems = [
  { label: 'Yeni randevu', icon: 'calendar', section: 'Randevular' },
  { label: 'Yeni adisyon', icon: 'list' },
  { label: 'Yeni musteri', icon: 'users' },
  { label: 'Yeni urun / hizmet ekle', icon: 'tag' },
  { label: 'Yeni urun satisi', icon: 'tag' },
  { label: 'Yeni paket satisi', icon: 'grid' },
  { label: 'Yeni alacak', icon: 'pos' },
  { label: 'Yeni borc', icon: 'more' },
]

export const weekDayLabels = ['Pzt', 'Sal', 'Car', 'Per', 'Cum', 'Cmt', 'Paz']

export const weekDayLongLabels = [
  'Pazartesi',
  'Sali',
  'Carsamba',
  'Persembe',
  'Cuma',
  'Cumartesi',
  'Pazar',
]

export const monthLabels = [
  'Ocak',
  'Subat',
  'Mart',
  'Nisan',
  'Mayis',
  'Haziran',
  'Temmuz',
  'Agustos',
  'Eylul',
  'Ekim',
  'Kasim',
  'Aralik',
]
