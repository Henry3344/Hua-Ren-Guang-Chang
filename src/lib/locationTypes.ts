export type LocationPref =
  | { scope: 'nationwide'; label: string }
  | { scope: 'state'; stateZh: string; label: string; stateCode?: string; cityEn?: string }
  | {
      scope: 'metro'
      stateZh: string
      cityZh: string
      areaZh?: string
      label: string
      stateCode?: string
      cityEn?: string
    }
