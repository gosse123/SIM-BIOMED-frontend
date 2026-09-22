interface Tab {
  key: string
  label: string
  count?: number
}

interface NavigationTabsProps {
  tabs: Tab[]
  currentTab: string
  onChange: (key: string) => void
}

export default function NavigationTabs({ tabs, currentTab, onChange }: NavigationTabsProps) {
  return (
    <div className="border-b border-slate-200">
      <nav className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Sections équipement">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={currentTab === tab.key}
            onClick={() => onChange(tab.key)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              currentTab === tab.key
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-2 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  )
}
