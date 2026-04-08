import type { Dispatch, SetStateAction } from 'react'
import {
  DashboardMessage,
  DashboardMetric,
  DashboardPageHero,
  DashboardPageShell,
  DashboardSectionCard,
} from '@/app/_home/components/dashboard-page-shell'
import { calendarViewOptions, weekDayLabels } from '@/app/_home/constants'
import type { CalendarAppointment } from '@/app/_home/types'
import { createDateFromIso, isPastAppointment } from '@/app/_home/utils'

type CalendarPageProps = {
  calendarRangeLabel: string
  calendarSlots: string[]
  calendarStaffFilter: string
  calendarStaffOptions: string[]
  calendarView: string
  currentMonthDate: Date
  dailyAppointments: CalendarAppointment[]
  isCalendarViewMenuOpen: boolean
  loading: boolean
  message: string
  monthAppointmentsByDate: Record<string, CalendarAppointment[]>
  monthGridDates: string[]
  onChangeCalendarView: (view: string) => void
  onGoToNextCalendarRange: () => void
  onGoToPreviousCalendarRange: () => void
  onOpenAppointmentModal: () => void
  onRefreshAppointments: () => void
  onSelectCalendarStaff: (value: string) => void
  onSelectToday: () => void
  onStartEditingNote: (item: CalendarAppointment) => void
  setIsCalendarViewMenuOpen: Dispatch<SetStateAction<boolean>>
  weekAppointmentsByDate: Record<string, CalendarAppointment[]>
  weekDates: string[]
}

export function CalendarPage({
  calendarRangeLabel,
  calendarSlots,
  calendarStaffFilter,
  calendarStaffOptions,
  calendarView,
  currentMonthDate,
  dailyAppointments,
  isCalendarViewMenuOpen,
  loading,
  message,
  monthAppointmentsByDate,
  monthGridDates,
  onChangeCalendarView,
  onGoToNextCalendarRange,
  onGoToPreviousCalendarRange,
  onOpenAppointmentModal,
  onRefreshAppointments,
  onSelectCalendarStaff,
  onSelectToday,
  onStartEditingNote,
  setIsCalendarViewMenuOpen,
  weekAppointmentsByDate,
  weekDates,
}: CalendarPageProps) {
  return (
    <DashboardPageShell>
      <DashboardPageHero
        title="Randevu takvimi"
        description="Gunluk, haftalik ve aylik planlari tek takvim yuzeyinde takip et. Ustten araligi degistir, gorunumu sec ve yeni randevuyu hizlica olustur."
        actions={
          <>
            <button
              type="button"
              onClick={onRefreshAppointments}
              className="rounded-2xl border border-[#c8d6e8] bg-white px-4 py-3 text-sm font-medium text-slate-600"
            >
              Yenile
            </button>
            <button
              type="button"
              onClick={onOpenAppointmentModal}
              disabled={loading}
              className="rounded-2xl bg-[#20a638] px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
            >
              + Yeni randevu
            </button>
          </>
        }
        stats={
          <>
            <DashboardMetric label="Gorunum" value={calendarView} />
            <DashboardMetric label="Aralik" value={calendarRangeLabel} tone="emerald" />
            <DashboardMetric label="Gunluk plan" value={`${dailyAppointments.length}`} tone="amber" />
          </>
        }
      />

      <DashboardSectionCard>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onGoToPreviousCalendarRange}
              className="rounded-2xl border border-[#c8d6e8] bg-white px-4 py-3 text-lg text-slate-500"
            >
              {'<'}
            </button>
            <button
              type="button"
              onClick={() => setIsCalendarViewMenuOpen(false)}
              className="min-w-[340px] rounded-2xl border border-[#c8d6e8] bg-[#f8fbff] px-6 py-3 text-center text-xl text-slate-700"
            >
              {calendarRangeLabel}
            </button>
            <button
              type="button"
              onClick={onGoToNextCalendarRange}
              className="rounded-2xl border border-[#c8d6e8] bg-white px-4 py-3 text-lg text-slate-500"
            >
              {'>'}
            </button>
            <button
              type="button"
              onClick={onSelectToday}
              className="rounded-2xl border border-[#c8d6e8] bg-white px-5 py-3 text-base text-slate-700"
            >
              Bugun
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={calendarStaffFilter}
              onChange={(event) => onSelectCalendarStaff(event.target.value)}
              className="rounded-2xl border border-[#c8d6e8] bg-white px-5 py-3 text-base text-slate-700 outline-none"
            >
              {calendarStaffOptions.map((staffOption) => (
                <option key={staffOption} value={staffOption}>
                  {staffOption}
                </option>
              ))}
            </select>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsCalendarViewMenuOpen((current) => !current)}
                className="flex items-center gap-3 rounded-2xl border border-[#c8d6e8] bg-white px-5 py-3 text-base text-slate-700"
              >
                <span>{calendarView}</span>
                <span className="text-base text-slate-500">o</span>
              </button>

              {isCalendarViewMenuOpen && (
                <div className="absolute left-0 top-[calc(100%+8px)] z-20 w-[230px] overflow-hidden rounded-2xl border border-[#c8d6e8] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.18)]">
                  {calendarViewOptions.map((view) => {
                    const active = view === calendarView

                    return (
                      <button
                        key={view}
                        type="button"
                        onClick={() => onChangeCalendarView(view)}
                        className={`block w-full px-6 py-4 text-left text-[16px] ${
                          active
                            ? 'bg-[#6f93c1] text-white'
                            : 'bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {view}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardSectionCard>

      {calendarView === 'Gunluk gorunum' && (
        <div className="overflow-hidden rounded-[20px] border border-[#d2dce9] bg-white shadow-[0_12px_28px_rgba(24,39,75,0.07)]">
          <div className="grid grid-cols-[54px_minmax(0,1fr)_42px]">
            <div className="border-r border-slate-300 bg-[#f5f7fb]" />
            <div className="bg-[linear-gradient(135deg,#315b90_0%,#6f93c1_100%)] py-3 text-center text-xl font-semibold text-white">
              {calendarStaffFilter}
            </div>
            <div className="border-l border-slate-300 bg-[#edf3fb]" />
          </div>

          <div className="grid max-h-[630px] grid-cols-[54px_minmax(0,1fr)_42px] overflow-y-auto">
            <div className="border-r border-slate-300 bg-[#f4f7fb]">
              {calendarSlots.map((slot) => (
                <div
                  key={slot}
                  className="flex h-[72px] items-start justify-center border-b border-slate-300 px-1 py-4 text-[18px] text-slate-500"
                >
                  {slot}
                </div>
              ))}
            </div>

            <div className="relative bg-[linear-gradient(180deg,#fdfefe_0%,#f7faff_100%)]">
              {calendarSlots.map((slot, index) => (
                <div key={slot} className="relative h-[72px] border-b border-[#dde5ef]">
                  {index === 3 && (
                    <div className="absolute inset-x-0 top-0 border-t border-dashed border-rose-300" />
                  )}
                </div>
              ))}

              <div className="absolute left-5 top-3 rounded-full border border-[#d4dfed] bg-white/95 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#537bb4] shadow-sm">
                Gunluk akis
              </div>

              {dailyAppointments.map((item) => (
                <div
                  key={item.id}
                  className={`absolute left-5 right-5 overflow-hidden rounded-2xl border p-4 shadow-[0_12px_28px_rgba(38,56,88,0.14)] ${
                    isPastAppointment(item.date, item.time)
                      ? 'border-[#e4b7c2] bg-[linear-gradient(135deg,#fff7f8_0%,#fff0f4_100%)]'
                      : 'border-[#c7d5e6] bg-[linear-gradient(135deg,#ffffff_0%,#f5f9ff_100%)]'
                  }`}
                  style={{
                    top: `${76 + item.slotIndex * 72}px`,
                    minHeight: '68px',
                  }}
                >
                  {isPastAppointment(item.date, item.time) && (
                    <>
                      <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t-2 border-rose-300/90" />
                    </>
                  )}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="inline-flex rounded-full bg-[#edf4ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#537bb4]">
                        {item.time || 'Saat yok'}
                      </p>
                      <p className="mt-3 text-lg font-semibold text-slate-800">
                        {item.customer || item.service}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.service} / {item.staff || 'Personel yok'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onStartEditingNote(item)}
                      className="rounded-xl border border-[#c8d6e8] bg-white px-3 py-2 text-xs font-medium text-[#537bb4]"
                    >
                      Duzenle
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-l border-slate-300 bg-[#edf3fb]">
              {calendarSlots.map((slot) => (
                <div key={slot} className="h-[72px] border-b border-[#d9e3ef]" />
              ))}
            </div>
          </div>
        </div>
      )}

      {calendarView === 'Haftalik gorunum' && (
        <div className="overflow-hidden rounded-[20px] border border-[#d2dce9] bg-white shadow-[0_12px_28px_rgba(24,39,75,0.07)]">
          <div className="grid grid-cols-[54px_repeat(7,minmax(170px,1fr))] border-b border-slate-300 bg-[#f5f7fb]">
            <div />
            {weekDates.map((date) => {
              const dateObject = createDateFromIso(date)
              return (
                <div
                  key={date}
                  className="border-l border-slate-300 py-3 text-center text-[18px] font-semibold text-[#537bb4]"
                >
                  {`${dateObject.getDate()}/${`${dateObject.getMonth() + 1}`.padStart(2, '0')} ${weekDayLabels[(dateObject.getDay() + 6) % 7]}`}
                </div>
              )
            })}
          </div>

          <div className="grid max-h-[630px] grid-cols-[54px_repeat(7,minmax(170px,1fr))] overflow-auto">
            <div className="border-r border-slate-300 bg-[#f4f7fb]">
              {calendarSlots.map((slot, index) => (
                <div
                  key={slot}
                  className="relative flex h-[72px] items-start justify-center border-b border-slate-300 px-1 py-4 text-[18px] text-slate-500"
                >
                  {slot}
                  {index === 3 && (
                    <div className="absolute left-0 top-0 h-0 w-0 border-y-[8px] border-r-[8px] border-y-transparent border-r-red-500" />
                  )}
                </div>
              ))}
            </div>

            {weekDates.map((date) => {
              const dayAppointments = weekAppointmentsByDate[date]

              return (
                <div key={date} className="relative border-l border-slate-300 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)]">
                  {calendarSlots.map((slot, index) => (
                    <div key={slot} className="relative h-[72px] border-b border-slate-200">
                      {index === 3 && (
                        <div className="absolute inset-x-0 top-0 border-t border-red-500" />
                      )}
                    </div>
                  ))}

                  {dayAppointments.map((item) => (
                    <div
                      key={item.id}
                      className={`absolute left-1.5 right-1.5 overflow-hidden rounded-xl border px-2 py-2 shadow-sm ${
                        isPastAppointment(item.date, item.time)
                          ? 'border-[#e4b7c2] bg-[#fff4f6] text-rose-700'
                          : 'border-[#c7d5e6] bg-[#edf4ff] text-[#35588a]'
                      }`}
                      style={{
                        top: `${28 + Math.max(item.slotIndex, 0) * 72}px`,
                        minHeight: '52px',
                      }}
                    >
                      {isPastAppointment(item.date, item.time) && (
                        <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t-2 border-rose-300/90" />
                      )}
                      <p className="text-[14px] leading-tight font-semibold">
                        {item.time || '00:00'} {item.customer || item.service}
                      </p>
                      <p className="mt-1 text-[12px] leading-tight opacity-80">
                        {item.service} / {item.staff || 'Personel yok'}
                      </p>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {calendarView === 'Aylik gorunum' && (
        <div className="overflow-hidden rounded-[20px] border border-[#d2dce9] bg-white shadow-[0_12px_28px_rgba(24,39,75,0.07)]">
          <div className="grid grid-cols-7 border-b border-slate-300 bg-[#f5f7fb]">
            {weekDayLabels.map((label) => (
              <div
                key={label}
                className="border-r border-slate-300 py-3 text-center text-[18px] font-semibold text-[#537bb4] last:border-r-0"
              >
                {label}
              </div>
            ))}
          </div>

          <div className="grid max-h-[630px] grid-cols-7 overflow-y-auto">
            {monthGridDates.map((date) => {
              const dateObject = createDateFromIso(date)
              const dayAppointments = monthAppointmentsByDate[date]
              const isCurrentMonth = dateObject.getMonth() === currentMonthDate.getMonth()

              return (
                <div
                  key={date}
                  className={`min-h-[156px] border-r border-b border-slate-300 px-1 py-1 last:border-r-0 ${
                    isCurrentMonth ? 'bg-white' : 'bg-[#f7f8fb]'
                  }`}
                >
                  <div className="mb-2 flex justify-end text-[18px] text-[#6a8fc1]">
                    {dateObject.getDate()}
                  </div>

                  <div className="space-y-1">
                    {dayAppointments.length === 0 && !isCurrentMonth ? (
                      <div className="rounded-lg border border-[#d8e2ee] bg-[#f8fbff] px-2 py-1 text-[13px] text-slate-500">
                        0:00 Kapali saat
                      </div>
                    ) : null}

                    {dayAppointments.map((item) => (
                      <div
                        key={item.id}
                        className={`relative overflow-hidden rounded-lg border px-2 py-1 text-[12px] ${
                          isPastAppointment(item.date, item.time)
                            ? 'border-[#e4b7c2] bg-[#fff4f6] text-rose-700'
                            : 'border-[#c7d5e6] bg-[#edf4ff] text-[#35588a]'
                        }`}
                      >
                        {isPastAppointment(item.date, item.time) && (
                          <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t-2 border-rose-300/90" />
                        )}
                        <span className="font-semibold">{item.time || '00:00'}</span>{' '}
                        {item.customer || item.service} {item.service}{' '}
                        {item.staff ? `/ ${item.staff}` : ''}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <DashboardMessage message={message} />
    </DashboardPageShell>
  )
}
