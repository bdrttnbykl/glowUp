'use client'

import { useDeferredValue, useState } from 'react'
import {
  DashboardMessage,
  DashboardPageHero,
  DashboardPageShell,
  DashboardSectionCard,
} from '@/app/_home/components/dashboard-page-shell'
import type { MergedCustomer } from '@/app/_home/types'
import { downloadPdfFile } from '@/app/_home/utils'

type CustomersPageProps = {
  customers: MergedCustomer[]
  message: string
  onEditCustomer: (customer: MergedCustomer) => void
  onOpenMessageModal: (customer: MergedCustomer) => void
  onOpenCustomerModal: () => void
  onRefreshCustomers: () => void
}

export function CustomersPage({
  customers,
  message,
  onEditCustomer,
  onOpenMessageModal,
  onOpenCustomerModal,
  onRefreshCustomers,
}: CustomersPageProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sourceFilter, setSourceFilter] = useState<'all' | MergedCustomer['source']>('all')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'name-asc'>('newest')
  const deferredSearchTerm = useDeferredValue(searchTerm)
  const normalizedSearchTerm = deferredSearchTerm.trim().toLocaleLowerCase('tr-TR')
  const filteredCustomers = [...customers]
    .filter((item) => {
      if (sourceFilter !== 'all' && item.source !== sourceFilter) {
        return false
      }

      if (!normalizedSearchTerm) {
        return true
      }

      const normalizedName = item.customer.toLocaleLowerCase('tr-TR')
      const normalizedEmail = (item.email || '').toLowerCase()
      const normalizedPhone = (item.phone || '').toLocaleLowerCase('tr-TR')

      return (
        normalizedName.includes(normalizedSearchTerm) ||
        normalizedEmail.includes(normalizedSearchTerm) ||
        normalizedPhone.includes(normalizedSearchTerm)
      )
    })
    .sort((left, right) => {
      if (sortOrder === 'name-asc') {
        return left.customer.localeCompare(right.customer, 'tr')
      }

      const leftTime = new Date(left.created_at).getTime()
      const rightTime = new Date(right.created_at).getTime()

      return sortOrder === 'oldest' ? leftTime - rightTime : rightTime - leftTime
    })

  const handleDownload = () => {
    const rows = [
      ['Musteri', 'Email', 'Telefon', 'Kaynak', 'Olusturulma'],
      ...filteredCustomers.map((item) => [
        item.customer,
        item.email || '',
        item.phone || '',
        item.source === 'manual'
          ? 'Manuel'
          : item.source === 'appointment'
            ? 'Randevu'
            : 'Manuel + Randevu',
        new Date(item.created_at).toLocaleDateString('tr-TR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
      ]),
    ]

    downloadPdfFile({
      filename: 'musteriler.pdf',
      rows,
      title: 'Musteri Listesi',
    })
  }

  return (
    <DashboardPageShell>
      <DashboardPageHero
        title={`Musteriler (${filteredCustomers.length})`}
        description="Randevulardan gelen ve manuel eklenen kayitlar burada birlesir. Arama, kaynak filtreleme ve disa aktarma ayni yuzeyden yonetilir."
        actions={
          <>
            <button
              type="button"
              onClick={onOpenCustomerModal}
              className="rounded-2xl bg-[#20a638] px-5 py-3 text-sm font-medium text-white"
            >
              Yeni musteri
            </button>
            <button
              type="button"
              onClick={onRefreshCustomers}
              className="rounded-2xl border border-[#c8d6e8] bg-white px-4 py-3 text-sm font-medium text-slate-600"
            >
              Yenile
            </button>
          </>
        }
      />

      <DashboardSectionCard>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="grid flex-1 gap-3 lg:grid-cols-[minmax(260px,1.6fr)_220px_220px]">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#537bb4]">
                Arama
              </p>
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Musteri veya telefon ara"
                className="w-full rounded-2xl border border-[#c8d6e8] bg-[#f8fbff] px-4 py-3 text-sm outline-none"
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#537bb4]">
                Kaynak
              </p>
              <select
                value={sourceFilter}
                onChange={(event) =>
                  setSourceFilter(event.target.value as 'all' | MergedCustomer['source'])
                }
                className="w-full rounded-2xl border border-[#c8d6e8] bg-[#f8fbff] px-4 py-3 text-sm outline-none"
              >
                <option value="all">Tum kaynaklar</option>
                <option value="manual">Sadece manuel</option>
                <option value="appointment">Sadece randevu</option>
                <option value="both">Manuel + randevu</option>
              </select>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#537bb4]">
                Siralama
              </p>
              <select
                value={sortOrder}
                onChange={(event) =>
                  setSortOrder(event.target.value as 'newest' | 'oldest' | 'name-asc')
                }
                className="w-full rounded-2xl border border-[#c8d6e8] bg-[#f8fbff] px-4 py-3 text-sm outline-none"
              >
                <option value="newest">En yeni</option>
                <option value="oldest">En eski</option>
                <option value="name-asc">Ada gore</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setSearchTerm('')
                setSourceFilter('all')
                setSortOrder('newest')
              }}
              className="rounded-2xl border border-[#c8d6e8] bg-white px-4 py-3 text-sm font-medium text-[#537bb4]"
            >
              Filtreleri sifirla
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="rounded-2xl bg-[#537bb4] px-4 py-3 text-sm font-medium text-white"
            >
              Indir
            </button>
          </div>
        </div>
      </DashboardSectionCard>

      <DashboardSectionCard className="overflow-hidden p-0">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full min-w-[900px] bg-white text-left">
            <thead className="border-b border-[#d7e0eb] bg-[#f6f9fd] text-[15px] uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th className="px-4 py-5 font-semibold">Musteri</th>
                <th className="px-4 py-5 font-semibold">Email</th>
                <th className="px-4 py-5 font-semibold">Telefon numarasi</th>
                <th className="px-4 py-5 font-semibold">Kaynak</th>
                <th className="px-4 py-5 font-semibold">Olusturulma</th>
                <th className="px-4 py-5 font-semibold text-right">Islem</th>
              </tr>
            </thead>
            <tbody className="text-[16px] text-slate-700">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center text-slate-400">
                    Aramana veya filtrene uyan musteri yok.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((item) => (
                  <tr key={`${item.source}-${item.id}`} className="border-b border-slate-100">
                    <td className="px-4 py-5 font-medium text-slate-800">{item.customer}</td>
                    <td className="px-4 py-5">{item.email || '-'}</td>
                    <td className="px-4 py-5">{item.phone || '-'}</td>
                    <td className="px-4 py-5">
                      {item.source === 'manual'
                        ? 'Manuel'
                        : item.source === 'appointment'
                          ? 'Randevu'
                          : 'Manuel + Randevu'}
                    </td>
                    <td className="px-4 py-5">
                      {new Date(item.created_at).toLocaleDateString('tr-TR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenMessageModal(item)}
                          className="rounded-xl border border-[#c8d6e8] bg-white px-4 py-3 text-sm font-medium text-[#0f766e]"
                        >
                          Mesaj gonder
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditCustomer(item)}
                          className="rounded-xl border border-[#c8d6e8] bg-white px-4 py-3 text-sm font-medium text-[#537bb4]"
                        >
                          Duzenle
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DashboardSectionCard>

      <DashboardMessage message={message} />
    </DashboardPageShell>
  )
}
