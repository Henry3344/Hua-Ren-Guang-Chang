'use client'
import { useState } from 'react'
import { locationData } from '@/lib/locationData'
import { Loader2, MapPin, Navigation } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  value: { state: string; city: string; area: string }
  onChange: (val: { state: string; city: string; area: string }) => void
}

export default function LocationPicker({ value, onChange }: Props) {
  const [detecting, setDetecting] = useState(false)
  const [geoMsg, setGeoMsg] = useState('')
  const [geoSuccess, setGeoSuccess] = useState(false)
  const [customState, setCustomState] = useState('')
  const [customCity, setCustomCity] = useState('')
  const [customArea, setCustomArea] = useState('')
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [fbState, setFbState] = useState('')
  const [fbCity, setFbCity] = useState('')
  const [fbBusy, setFbBusy] = useState(false)

  const selectedState = locationData.find(s => s.state === value.state)
  const selectedCity = selectedState?.cities.find(c => c.city === value.city)

  function handleState(state: string) {
    if (state === '__feedback__') {
      setFeedbackOpen(true)
      setCustomState('')
      onChange({ state: '', city: '', area: '' })
      return
    }
    setFeedbackOpen(false)
    setCustomState('')
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
            '&lon=' + pos.coords.longitude + '&format=json&accept-language=zh'
          )
          const data = await res.json()
          const stateEn = data.address?.state || ''
          const stateMap: Record<string, string> = {
            'New York': '纽约州', 'New Jersey': '新泽西州',
            'California': '加利福尼亚州', 'Texas': '德克萨斯州',
            'Washington': '华盛顿州', 'Nevada': '内华达州',
            'North Carolina': '北卡罗来纳州', 'Illinois': '伊利诺伊州',
            'Georgia': '佐治亚州', 'Massachusetts': '马萨诸塞州',
          }
          const matched = stateMap[stateEn]
          if (matched) {
            onChange({ state: matched, city: '', area: '' })
            setGeoMsg('位置不对？可以手动选择。')
            setGeoSuccess(true)
          } else {
            setGeoMsg('未找到匹配地区，请手动选择')
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
  const inputFlat = 'w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary'

  async function submitMissingFeedback() {
    const a = fbState.trim()
    const b = fbCity.trim()
    if (!a || !b) {
      alert('请填写州与城市')
      return
    }
    setFbBusy(true)
    try {
      const r = await fetch('/api/location/suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stateText: a, cityText: b }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) {
        alert(d.error || '提交失败')
        return
      }
      alert('已收到，我们会尽快更新列表，感谢反馈')
      setFeedbackOpen(false)
      setFbState('')
      setFbCity('')
    } finally {
      setFbBusy(false)
    }
  }

  const stateSelectValue = feedbackOpen ? '__feedback__' : value.state

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <button type="button" onClick={detectLocation} disabled={detecting}
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline disabled:opacity-50">
          <Navigation className="w-3 h-3" />
          {detecting ? '定位中...' : '自动定位到我的州'}
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
            value={stateSelectValue}
            onChange={(e) => handleState(e.target.value)}
            className={sel}
          >
            <option value="">选择州</option>
            {locationData.map((s) => (
              <option key={s.state} value={s.state}>
                {s.state}
              </option>
            ))}
            <option value="其他">其他州</option>
            <option value="__feedback__">
              没有你所在的州？请输入你的州与城市，我们会尽快更新我们的列表
            </option>
          </select>
          {value.state === '其他' && (
            <input className={input} placeholder="请输入州名" maxLength={50}
              value={customState}
              onChange={e => setCustomState(e.target.value)}
              onBlur={e => { if (e.target.value) onChange({ state: e.target.value, city: '', area: '' }) }} />
          )}
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
              onBlur={e => { if (e.target.value) onChange({ ...value, city: e.target.value, area: '' }) }} />
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
              onBlur={e => { if (e.target.value) onChange({ ...value, area: e.target.value }) }} />
          )}
        </div>
      </div>

      {feedbackOpen && (
        <div className="rounded-lg border border-dashed bg-muted/30 p-3 space-y-2">
          <p className="text-xs font-medium text-foreground">补充你所在的州与城市</p>
          <input
            className={inputFlat}
            placeholder="州 / State"
            maxLength={200}
            value={fbState}
            onChange={(e) => setFbState(e.target.value)}
          />
          <input
            className={inputFlat}
            placeholder="城市 / City"
            maxLength={200}
            value={fbCity}
            onChange={(e) => setFbCity(e.target.value)}
          />
          <Button
            type="button"
            size="sm"
            className="w-full"
            disabled={fbBusy}
            onClick={submitMissingFeedback}
          >
            {fbBusy && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
            提交反馈
          </Button>
        </div>
      )}

      {value.state && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {[value.state, value.city, value.area].filter(v => v && v !== '其他').join(' · ') ||
           [customState, customCity, customArea].filter(Boolean).join(' · ') || value.state}
        </p>
      )}
    </div>
  )
}
