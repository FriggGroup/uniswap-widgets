import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { useIsWrap } from 'hooks/swap/useWrapCallback'
import { useCurrencyBalances } from 'hooks/useCurrencyBalance'
import useUSDCPriceImpact, { PriceImpact } from 'hooks/useUSDCPriceImpact'
import { useAtomValue } from 'jotai/utils'
import { createContext, PropsWithChildren, useContext, useMemo } from 'react'
import { InvestmentTrade, TradeState } from 'state/routing/types'
import { Field, swapAtom } from 'state/swap'
import tryParseCurrencyAmount from 'utils/tryParseCurrencyAmount'

import { INVALID_TRADE } from '../routing/useRouterTrade'
import { useInvestment } from './useInvestment'

interface BuySellField {
  currency?: Currency
  amount?: CurrencyAmount<Currency>
  balance?: CurrencyAmount<Currency>
  usdc?: CurrencyAmount<Currency>
}

interface BuySellInfo {
  [Field.INPUT]: BuySellField
  [Field.OUTPUT]: BuySellField
  trade: {
    trade?: InvestmentTrade<Currency, Currency, TradeType>
    state: TradeState
  }
  impact?: PriceImpact
}

export type BuySellMarketType = 'buy' | 'sell'

// from the current swap inputs, compute the best trade and return it.
function useComputeBuySellInfo(marketType: BuySellMarketType): BuySellInfo {
  const isWrap = useIsWrap()
  const { independentField, amount, [Field.INPUT]: currencyIn, [Field.OUTPUT]: currencyOut } = useAtomValue(swapAtom)
  const isExactIn = independentField === Field.INPUT

  const parsedAmount = useMemo(
    () => tryParseCurrencyAmount(amount, (isExactIn ? currencyIn : currencyOut) ?? undefined),
    [amount, isExactIn, currencyIn, currencyOut]
  )
  const hasAmounts = currencyIn && currencyOut && parsedAmount && !isWrap
  const trade = useInvestment(
    isExactIn ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT,
    marketType,
    hasAmounts ? parsedAmount : undefined,
    hasAmounts ? (isExactIn ? currencyOut : currencyIn) : undefined
  )

  const amountIn = useMemo(
    () => (isWrap || isExactIn ? parsedAmount : trade.trade?.inputAmount),
    [isExactIn, isWrap, parsedAmount, trade.trade?.inputAmount]
  )
  const amountOut = useMemo(
    () => (isWrap || !isExactIn ? parsedAmount : trade.trade?.outputAmount),
    [isExactIn, isWrap, parsedAmount, trade.trade?.outputAmount]
  )

  const { account } = useWeb3React()
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

const DEFAULT_SWAP_INFO: BuySellInfo = {
  [Field.INPUT]: {},
  [Field.OUTPUT]: {},
  trade: INVALID_TRADE,
}

const BuySellInfoContext = createContext(DEFAULT_SWAP_INFO)

export function BuySellInfoProvider({
  children,
  disabled,
  marketType,
}: PropsWithChildren<{ disabled?: boolean; marketType: BuySellMarketType }>) {
  const buyInfo = useComputeBuySellInfo(marketType)
  if (disabled) {
    return <BuySellInfoContext.Provider value={DEFAULT_SWAP_INFO}>{children}</BuySellInfoContext.Provider>
  }
  return <BuySellInfoContext.Provider value={buyInfo}>{children}</BuySellInfoContext.Provider>
}

/** Requires that SwapInfoUpdater be installed in the DOM tree. **/
export default function useBuySellInfo(): BuySellInfo {
  return useContext(BuySellInfoContext)
}
