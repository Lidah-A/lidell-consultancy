"use client"
import { useMemo, useState } from "react"

export const currencyOptions = [
  { code: 'USD', label: 'United States Dollar (USD)', symbol: '$' },
  { code: 'EUR', label: 'Euro (EUR)', symbol: '€' },
  { code: 'GBP', label: 'British Pound (GBP)', symbol: '£' },
  { code: 'TRY', label: 'Turkish Lira (TRY)', symbol: '₺' },
  { code: 'ZMW', label: 'Zambian Kwacha (ZMW)', symbol: 'ZK' },
  { code: 'ZAR', label: 'South African Rand (ZAR)', symbol: 'R' },
  { code: 'TZS', label: 'Tanzanian Shilling (TZS)', symbol: 'TSh' },
  { code: 'MWK', label: 'Malawian Kwacha (MWK)', symbol: 'MK' },
  { code: 'NAD', label: 'Namibian Dollar (NAD)', symbol: 'N$' },
  { code: 'BWP', label: 'Botswana Pula (BWP)', symbol: 'P' },
  { code: 'KES', label: 'Kenyan Shilling (KES)', symbol: 'KSh' },
  { code: 'UGX', label: 'Ugandan Shilling (UGX)', symbol: 'USh' },
  { code: 'RWF', label: 'Rwandan Franc (RWF)', symbol: 'RF' },
  { code: 'BIF', label: 'Burundian Franc (BIF)', symbol: 'FBu' },
  { code: 'CDF', label: 'Congolese Franc (CDF)', symbol: 'FC' },
  { code: 'NGN', label: 'Nigerian Naira (NGN)', symbol: '₦' },
  { code: 'GHS', label: 'Ghanaian Cedi (GHS)', symbol: 'GH₵' },
  { code: 'XOF', label: 'West African CFA Franc (XOF)', symbol: 'CFA' },
  { code: 'XAF', label: 'Central African CFA Franc (XAF)', symbol: 'FCFA' },
  { code: 'MAD', label: 'Moroccan Dirham (MAD)', symbol: 'د.م.' },
  { code: 'DZD', label: 'Algerian Dinar (DZD)', symbol: 'DA' },
  { code: 'TND', label: 'Tunisian Dinar (TND)', symbol: 'DT' },
  { code: 'EGP', label: 'Egyptian Pound (EGP)', symbol: 'E£' },
  { code: 'MZN', label: 'Mozambican Metical (MZN)', symbol: 'MT' },
  { code: 'SZL', label: 'Swazi Lilangeni (SZL)', symbol: 'E' },
  { code: 'LSL', label: 'Lesotho Loti (LSL)', symbol: 'L' },
  { code: 'SCR', label: 'Seychellois Rupee (SCR)', symbol: 'SR' },
  { code: 'MUR', label: 'Mauritian Rupee (MUR)', symbol: 'Rs' },
  { code: 'ETB', label: 'Ethiopian Birr (ETB)', symbol: 'Br' },
  { code: 'SOS', label: 'Somali Shilling (SOS)', symbol: 'Sh' },
  { code: 'DJF', label: 'Djiboutian Franc (DJF)', symbol: 'Fdj' },
  { code: 'AOA', label: 'Angolan Kwanza (AOA)', symbol: 'Kz' },
  { code: 'GMD', label: 'Gambian Dalasi (GMD)', symbol: 'D' },
] as const

export type CurrencyCode = (typeof currencyOptions)[number]['code']

type Props = { value: string, currency?: CurrencyCode }

export default function BudgetConverter({ value, currency = 'USD' }: Props) {
  const [rateUSDToEUR, setRateUSDToEUR] = useState(0.92)
  const [rateUSDToGBP, setRateUSDToGBP] = useState(0.78)
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(currency)

  const parsed = useMemo(() => {
    if (!value) return null
    // extract first number from string, allow ranges like 200-500
    const m = value.match(/\d+[\d,\.]*/)
    if (!m) return null
    const num = Number(m[0].replace(/,/g, ''))
    if (Number.isNaN(num)) return null
    return num
  }, [value])

  if (!parsed) return <div className="mt-2 text-sm text-gray-500">Enter a numeric budget to see conversions.</div>

  // normalize to USD first
  let usdAmount = parsed
  if (selectedCurrency === 'EUR') usdAmount = parsed / rateUSDToEUR
  if (selectedCurrency === 'GBP') usdAmount = parsed / rateUSDToGBP

  const eur = (usdAmount * rateUSDToEUR).toFixed(2)
  const gbp = (usdAmount * rateUSDToGBP).toFixed(2)
  const currentCurrency = currencyOptions.find((option) => option.code === selectedCurrency) ?? currencyOptions[0]

  return (
    <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
      <label className="block mb-3">
        <span className="text-xs text-gray-600">Choose currency</span>
        <select
          value={selectedCurrency}
          onChange={(e) => setSelectedCurrency(e.target.value as CurrencyCode)}
          className="mt-1 block w-full rounded-md border border-gray-200 bg-white p-2"
        >
          {currencyOptions.map((option) => (
            <option key={option.code} value={option.code}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="text-xs text-gray-600">Parsed amount ({currentCurrency.code})</div>
          <div className="font-medium">{currentCurrency.symbol}{parsed.toLocaleString()}</div>
        </div>
        <div className="w-1/3">
          <div className="text-xs text-gray-600">EUR (approx)</div>
          <div className="font-medium">€{eur}</div>
        </div>
        <div className="w-1/3">
          <div className="text-xs text-gray-600">GBP (approx)</div>
          <div className="font-medium">£{gbp}</div>
        </div>
      </div>

      <details className="mt-2 text-xs text-gray-600">
        <summary className="cursor-pointer">Adjust conversion rates</summary>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="text-xs">USD → EUR
            <input type="number" step="0.01" value={rateUSDToEUR} onChange={(e) => setRateUSDToEUR(Number(e.target.value))} className="mt-1 w-full p-1 border rounded" />
          </label>
          <label className="text-xs">USD → GBP
            <input type="number" step="0.01" value={rateUSDToGBP} onChange={(e) => setRateUSDToGBP(Number(e.target.value))} className="mt-1 w-full p-1 border rounded" />
          </label>
        </div>
      </details>
    </div>
  )
}
