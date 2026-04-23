'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { readLocationPref, writeLocationPref } from '@/lib/locationPrefs'
import type { LocationPref } from '@/lib/locationTypes'
import { labelForSelection } from '@/lib/locationMeta'
import { Button } from '@/components/ui/button'
import LocationPicker from '@/components/LocationPicker'
import { MapPin, X } from 'lucide-react'

type Ctx = {
  pref: LocationPref | null
  ready: boolean
  openPicker: () => void
}

const SiteLocationContext = createContext<Ctx | null>(null)

export function useSiteLocation() {
  const v = useContext(SiteLocationContext)
  if (!v) throw new Error('useSiteLocation must be used within SiteLocationProvider')
  return v
}

function buildPref(loc: { state: string; city: string; area: string }): LocationPref | null {
  if (!loc.state) return null
  const stateZh = loc.state
  if (!loc.city) {
    return {
      scope: 'state',
      stateZh,
      label: labelForSelection({ scope: 'state', stateZh }),
    }
  }
  return {
    scope: 'metro',
    stateZh,
    cityZh: loc.city,
    areaZh: loc.area || undefined,
    label: labelForSelection({
      scope: 'metro',
      stateZh,
      cityZh: loc.city,
      areaZh: loc.area || undefined,
    }),
  }
}

export function SiteLocationProvider({ children }: { children: React.ReactNode }) {
  const [pref, setPref] = useState<LocationPref | null>(null)
  const [ready, setReady] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [mandatory, setMandatory] = useState(false)
  const [failureHint, setFailureHint] = useState<string | null>(null)
  const [draft, setDraft] = useState({ state: '', city: '', area: '' })

  useEffect(() => {
    const existing = readLocationPref()
    if (existing) {
      setPref(existing)
      setReady(true)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const r = await fetch('/api/location/guess')
        const d = (await r.json()) as {
          ok?: boolean
          pref?: LocationPref
          reason?: string
          hint?: string
          label?: string
        }
        if (cancelled) return
        if (d.ok && d.pref) {
          writeLocationPref(d.pref)
          setPref(d.pref)
        } else {
          let msg = '定位失败，请手动选择你当前的城市（或查看全美）'
          if (typeof d.hint === 'string' && d.hint.trim()) msg = d.hint.trim()
          else if (d.reason === 'unsupported_state' && d.label) {
            msg = `当前网络位置接近「${d.label}」；该州暂未在站内开通，请手动选择已开通的州或「查看全美」。`
          } else if (d.reason === 'not_us_or_fail') {
            msg = '当前网络不在美国境内或无法识别，请手动选择地区或「查看全美」。'
          }
          setFailureHint(msg)
          setMandatory(true)
          setModalOpen(true)
        }
      } catch {
        if (!cancelled) {
          setFailureHint('定位失败，请手动选择你当前的城市（或查看全美）')
          setMandatory(true)
          setModalOpen(true)
        }
      } finally {
        if (!cancelled) setReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const persist = useCallback((p: LocationPref) => {
    writeLocationPref(p)
    setPref(p)
    setModalOpen(false)
    setMandatory(false)
    setFailureHint(null)
  }, [])

  const openPicker = useCallback(() => {
    setMandatory(false)
    setFailureHint(null)
    setDraft({ state: '', city: '', area: '' })
    setModalOpen(true)
  }, [])

  function saveNationwide() {
    persist({ scope: 'nationwide', label: '全美' })
  }

  function saveManual() {
    const p = buildPref(draft)
    if (!p) {
      alert('请选择州，或点击「查看全美」')
      return
    }
    persist(p)
  }

  const ctx = useMemo(
    () => ({ pref, ready, openPicker }),
    [pref, ready, openPicker],
  )

  return (
    <SiteLocationContext.Provider value={ctx}>
      {children}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
          onClick={() => {
            if (!mandatory) setModalOpen(false)
          }}
        >
          <div
            className="bg-card border rounded-xl shadow-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2 mb-4">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  {mandatory ? '选择地区' : '切换城市'}
                </h2>
                {failureHint && (
                  <p className="text-sm text-amber-800 mt-2 leading-relaxed">{failureHint}</p>
                )}
              </div>
              {!mandatory && (
                <button
                  type="button"
                  className="p-1 rounded-md hover:bg-muted"
                  onClick={() => setModalOpen(false)}
                  aria-label="关闭"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <div className="space-y-4">
              <Button type="button" className="w-full" onClick={saveNationwide}>
                查看全美
              </Button>
              <p className="text-xs text-muted-foreground">
                或手动选择州 / 城市 / 区域（与发帖页一致）
              </p>
              <LocationPicker value={draft} onChange={setDraft} />
              <div className="flex justify-end gap-2 pt-2">
                {!mandatory && (
                  <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                    取消
                  </Button>
                )}
                <Button type="button" onClick={saveManual}>
                  确认选择
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SiteLocationContext.Provider>
  )
}
