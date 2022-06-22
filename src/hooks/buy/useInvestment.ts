import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { InvestmentTrade, TradeState } from 'state/routing/types'

import { useClientSideInvestment } from '../useClientSideInvestment'
import { BuySellMarketType } from './useBuySellInfo'

export const INVALID_TRADE = { state: TradeState.INVALID, trade: undefined }

/**
 * Returns the best v2+v3 trade for a desired swap.
 * @param tradeType whether the swap is an exact in/out
 * @param amountSpecified the exact amount to swap in/out
 * @param otherCurrency the desired output/payment currency
 * @param marketType
 */
export function useInvestment(
  tradeType: TradeType,
  marketType: BuySellMarketType,
  amountSpecified?: CurrencyAmount<Currency>,
  otherCurrency?: Currency
): {
  state: TradeState
  trade: InvestmentTrade<Currency, Currency, TradeType> | undefined
} {
  const tradeObject = useClientSideInvestment(tradeType, marketType, amountSpecified, otherCurrency)

  // this leads to an infinite loop
  // const lastTrade = useLast(tradeObject.trade, Boolean) ?? undefined

  // Return the last trade while syncing/loading to avoid jank from clearing the last trade while loading.
  // If the trade is unsettled and not stale, return the last trade as a placeholder during settling.
  return useMemo(() => {
    const { state, trade } = tradeObject
    // If the trade is in a settled state, return it.
    if (state === TradeState.INVALID) return INVALID_TRADE
    if ((state !== TradeState.LOADING && state !== TradeState.SYNCING) || trade) return tradeObject

    // const [currencyIn, currencyOut] =
    //   tradeType === TradeType.EXACT_INPUT
    //     ? [amountSpecified?.currency, otherCurrency]
    //     : [otherCurrency, amountSpecified?.currency]

    // // If the trade currencies have switched, consider it stale - do not return the last trade.
    // const isStale =
    //   (currencyIn && !lastTrade?.inputAmount?.currency.equals(currencyIn)) ||
    //   (currencyOut && !lastTrade?.outputAmount?.currency.equals(currencyOut))
    // if (isStale) return tradeObject

    return { state, trade }
  }, [tradeObject])
}
