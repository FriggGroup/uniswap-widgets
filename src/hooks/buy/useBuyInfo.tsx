import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useCurrencyBalances } from 'hooks/useCurrencyBalance'
import useUSDCPriceImpact, { PriceImpact } from 'hooks/useUSDCPriceImpact'
import { useAtomValue } from 'jotai/utils'
import { createContext, PropsWithChildren, useContext, useMemo } from 'react'
import { InvestmentTrade, TradeState } from 'state/routing/types'
import { Field, swapAtom } from 'state/swap'
import tryParseCurrencyAmount from 'utils/tryParseCurrencyAmount'

import { INVALID_TRADE } from '../swap/useBestTrade'
import useWrapCallback, { WrapType } from '../swap/useWrapCallback'
import { useInvestment } from './useInvestment'

interface BuyField {
  currency?: Currency
  amount?: CurrencyAmount<Currency>
  balance?: CurrencyAmount<Currency>
  usdc?: CurrencyAmount<Currency>
}

interface BuyInfo {
  [Field.INPUT]: BuyField
  [Field.OUTPUT]: BuyField
  trade: {
    trade?: InvestmentTrade<Currency, Currency, TradeType>
    state: TradeState
  }
  impact?: PriceImpact
}

// from the current swap inputs, compute the best trade and return it.
function useComputeBuyInfo(): BuyInfo {
  const { type: wrapType } = useWrapCallback()
  const isWrapping = wrapType === WrapType.WRAP || wrapType === WrapType.UNWRAP
  const { independentField, amount, [Field.INPUT]: currencyIn, [Field.OUTPUT]: currencyOut } = useAtomValue(swapAtom)
  const isExactIn = independentField === Field.INPUT

  const parsedAmount = useMemo(
    () => tryParseCurrencyAmount(amount, (isExactIn ? currencyIn : currencyOut) ?? undefined),
    [amount, isExactIn, currencyIn, currencyOut]
  )
  const hasAmounts = currencyIn && currencyOut && parsedAmount && !isWrapping
  const trade = useInvestment(
    isExactIn ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT,
    hasAmounts ? parsedAmount : undefined,
    hasAmounts ? (isExactIn ? currencyOut : currencyIn) : undefined
  )

  const amountIn = useMemo(
    () => (isWrapping || isExactIn ? parsedAmount : trade.trade?.inputAmount),
    [isExactIn, isWrapping, parsedAmount, trade.trade?.inputAmount]
  )
  const amountOut = useMemo(
    () => (isWrapping || !isExactIn ? parsedAmount : trade.trade?.outputAmount),
    [isExactIn, isWrapping, parsedAmount, trade.trade?.outputAmount]
  )

  const { account } = useActiveWeb3React()
  const [balanceIn, balanceOut] = useCurrencyBalances(
    account,
    useMemo(() => [currencyIn, currencyOut], [currencyIn, currencyOut])
  )

  const { inputUSDC, outputUSDC, impact } = useUSDCPriceImpact(trade.trade?.inputAmount, trade.trade?.outputAmount)

  return useMemo(
    () => ({
      [Field.INPUT]: {
        currency: currencyIn,
        amount: amountIn,
        balance: balanceIn,
        usdc: inputUSDC,
      },
      [Field.OUTPUT]: {
        currency: currencyOut,
        amount: amountOut,
        balance: balanceOut,
        usdc: outputUSDC,
      },
      trade,
      impact,
    }),
    [amountIn, amountOut, balanceIn, balanceOut, currencyIn, currencyOut, impact, inputUSDC, outputUSDC, trade]
  )
}

const DEFAULT_SWAP_INFO: BuyInfo = {
  [Field.INPUT]: {},
  [Field.OUTPUT]: {},
  trade: INVALID_TRADE,
}

const BuyInfoContext = createContext(DEFAULT_SWAP_INFO)

export function BuyInfoProvider({ children, disabled }: PropsWithChildren<{ disabled?: boolean }>) {
  const buyInfo = useComputeBuyInfo()
  if (disabled) {
    return <BuyInfoContext.Provider value={DEFAULT_SWAP_INFO}>{children}</BuyInfoContext.Provider>
  }
  return <BuyInfoContext.Provider value={buyInfo}>{children}</BuyInfoContext.Provider>
}

/** Requires that SwapInfoUpdater be installed in the DOM tree. **/
export default function useBuyInfo(): BuyInfo {
  return useContext(BuyInfoContext)
}
