'use client'
import { useRef, useState } from 'react'
import { locationData, matchLocationFromGeo } from '@/lib/locationData'
import { US_STATE_CODE_TO_ZH, normalizeUsStateCode } from '@/lib/locationMeta'
import { MapPin, Navigation } from 'lucide-react'

interface Props {
  value: { state: string; city: string; area: string }
  onChange: (val: { state: string; city: string; area: string }) => void
}

export default function LocationPicker({ value, onChange }: Props) {
  const [detecting, setDetecting] = useState(false)
  const [geoMsg, setGeoMsg] = useState('')
  const [geoSuccess, setGeoSuccess] = useState(false)
  const [customCity, setCustomCity] = useState('')
  const [customArea, setCustomArea] = useState('')
  const submittedSuggestionKeys = useRef(new Set<string>())

  const selectedState = locationData.find(s => s.state === value.state)
  const selectedCity = selectedState?.cities.find(c => c.city === value.city)

  function handleState(state: string) {
    onChange({ state, city: '', area: '' })
  }

  function handleCity(city: string) {
    setCustomCity('')
    onChange({ ...value, city, area: '' })
  }

  function handleArea(area: string) {
    setCustomArea('')
    onChange({ ...value, area })
  }

  async function detectLocation() {
    if (!navigator.geolocation) {
      setGeoMsg('您的浏览器不支持定位，请手动选择')
      setGeoSuccess(false)
      return
    }
    setDetecting(true)
    setGeoMsg('')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            'https://nominatim.openstreetmap.org/reverse?lat=' + pos.coords.latitude +
            '&lon=' + pos.coords.longitude + '&format=json&addressdetails=1&accept-language=en'
          )
          const data = await res.json()
          const address = data.address || {}
          const countryCode = String(address.country_code || '').toUpperCase()
          if (countryCode && countryCode !== 'US') {
            setGeoMsg('当前位置不在美国境内，请手动选择或查看全美')
            setGeoSuccess(false)
            setDetecting(false)
            return
          }
          const stateCode = normalizeUsStateCode(address.state_code || address.state)
          const matched = stateCode ? US_STATE_CODE_TO_ZH[stateCode] : ''
          const city =
            address.city ||
            address.town ||
            address.village ||
            address.hamlet ||
            address.county ||
            ''
          if (matched) {
            const geoMatch = matchLocationFromGeo(matched, [
              address.neighbourhood,
              address.suburb,
              address.quarter,
              address.city_district,
              address.borough,
              address.city,
              address.town,
              address.village,
              address.county,
            ])
            onChange({ state: matched, city: geoMatch.city, area: geoMatch.area })
            const label = [stateCode, geoMatch.city || city, geoMatch.area].filter(Boolean).join(' · ')
            setGeoMsg(`已定位到大概区域：${label || matched}。位置不对可手动选择。`)
            setGeoSuccess(true)
          } else {
            setGeoMsg('未找到匹配地区，请手动选择或查看全美')
            setGeoSuccess(false)
          }
        } catch {
          setGeoMsg('定位解析失败，请手动选择')
          setGeoSuccess(false)
        }
        setDetecting(false)
      },
      () => {
        setGeoMsg('定位被拒绝，请手动选择地区')
        setGeoSuccess(false)
        setDetecting(false)
      },
      { timeout: 8000 }
    )
  }

  const sel = 'w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary'
  const input = 'w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary mt-2'

  async function submitLocationSuggestion(stateText: string, cityText: string) {
    const state = stateText.trim()
    const city = cityText.trim()
    if (!state || !city) return
    const key = `${state}::${city}`.toLowerCase()
    if (submittedSuggestionKeys.current.has(key)) return
    submittedSuggestionKeys.current.add(key)
    try {
      await fetch('/api/location/suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stateText: state, cityText: city }),
      })
    } catch {
      submittedSuggestionKeys.current.delete(key)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <button type="button" onClick={detectLocation} disabled={detecting}
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline disabled:opacity-50">
          <Navigation className="w-3 h-3" />
          {detecting ? '定位中...' : '自动定位到我所在的大概区域'}
        </button>
        {geoMsg && (
          <span className={'text-xs ' + (geoSuccess ? 'text-muted-foreground' : 'text-yellow-600')}>
            {geoMsg}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">州 <span className="text-destructive">*</span></label>
          <select
            value={value.state}
            onChange={(e) => handleState(e.target.value)}
            className={sel}
          >
            <option value="">选择州</option>
            {locationData.map((s) => (
              <option key={s.state} value={s.state}>
                {s.state}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">城市/都会区</label>
          <select value={value.city} onChange={e => handleCity(e.target.value)} className={sel}
            disabled={!value.state || value.state === '其他'}>
            <option value="">选择城市</option>
            {selectedState?.cities.map(c => (
              <option key={c.city} value={c.city}>{c.city}</option>
            ))}
            {value.state && value.state !== '其他' && <option value="其他">其他</option>}
          </select>
          {value.city === '其他' && (
            <input className={input} placeholder="请输入城市名" maxLength={50}
              value={customCity}
              onChange={e => setCustomCity(e.target.value)}
              onBlur={e => {
                const city = e.target.value.trim()
                if (city) {
                  onChange({ ...value, city, area: '' })
                  void submitLocationSuggestion(value.state, city)
                }
              }} />
          )}
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">区域</label>
          <select value={value.area} onChange={e => handleArea(e.target.value)} className={sel}
            disabled={!value.city || value.city === '其他'}>
            <option value="">选择区域</option>
            {selectedCity?.areas.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
            {value.city && value.city !== '其他' && <option value="其他">其他</option>}
          </select>
          {value.area === '其他' && (
            <input className={input} placeholder="请输入区域名" maxLength={50}
              value={customArea}
              onChange={e => setCustomArea(e.target.value)}
              onBlur={e => {
                const area = e.target.value.trim()
                if (area) {
                  onChange({ ...value, area })
                  void submitLocationSuggestion(value.state, value.city ? `${value.city} / ${area}` : area)
                }
              }} />
          )}
        </div>
      </div>

      {value.state && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {[value.state, value.city, value.area].filter(v => v && v !== '其他').join(' · ') ||
           [customCity, customArea].filter(Boolean).join(' · ') || value.state}
        </p>
      )}
    </div>
  )
}
