import { Currency, CurrencyAmount, Price, TradeType } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { InvestmentTrade, TradeState } from 'state/routing/types'

import { BuySellMarketType } from './buy/useBuySellInfo'
import { useSingleContractWithCallData } from './multicall'
import { useFriggRouterContract } from './useContract'

export function useClientSideInvestment<TTradeType extends TradeType>(
  tradeType: TTradeType,
  marketType: BuySellMarketType,
  amountSpecified?: CurrencyAmount<Currency>,
  otherCurrency?: Currency
): { state: TradeState; trade: InvestmentTrade<Currency, Currency, TTradeType> | undefined } {
  const [currencyIn, currencyOut] =
    tradeType === TradeType.EXACT_INPUT
      ? [amountSpecified?.currency, otherCurrency]
      : [otherCurrency, amountSpecified?.currency]

  // the contract where we get the price from
  const FriggRouterContract = useFriggRouterContract()

  const callData = useMemo(() => {
    if (!FriggRouterContract) return []
    const investmentCurrency = marketType === 'buy' ? currencyOut : currencyIn
    if (!investmentCurrency?.isToken) return []

    return [FriggRouterContract?.interface.encodeFunctionData('tokenData', [investmentCurrency.address])]
  }, [FriggRouterContract, currencyIn, currencyOut, marketType])

  const quotesResults = useSingleContractWithCallData(FriggRouterContract, callData)

  return useMemo(() => {
    if (
      !amountSpecified ||
      !currencyIn ||
      !currencyOut ||
      quotesResults.some(({ valid }) => !valid) ||
      // skip when tokens are the same
      (tradeType === TradeType.EXACT_INPUT
        ? amountSpecified.currency.equals(currencyOut)
        : amountSpecified.currency.equals(currencyIn))
    ) {
      return {
        state: TradeState.INVALID,
        trade: undefined,
      }
    }

    if (quotesResults.some(({ loading }) => loading)) {
      return {
        state: TradeState.LOADING,
        trade: undefined,
      }
    }

    const { price, amountIn, amountOut } = quotesResults.reduce(
      (
        currentBest: {
          price: Price<Currency, Currency> | null
          amountIn: CurrencyAmount<Currency> | null
          amountOut: CurrencyAmount<Currency> | null
        },
        { result },
        i
      ) => {
        if (
          !result ||
          (result.issuancePriceInUSDC?.toString() as unknown as string) === '0' ||
          (result.expiryPriceInUSDC?.toString() as unknown as string) === '0'
        )
          return currentBest

        const price =
          marketType === 'buy'
            ? new Price(currencyIn, currencyOut, result.issuancePriceInUSDC.toString(), 10 ** currencyOut.decimals)
            : new Price(
                currencyOut,
                currencyIn,
                result.expiryPriceInUSDC.toString(),
                10 ** currencyIn.decimals
              ).invert()

        if (tradeType === TradeType.EXACT_INPUT) {
          const amountOut = price.quote(amountSpecified)
          return {
            price,
            amountIn: amountSpecified,
            amountOut,
          }
        } else {
          const amountIn = price.invert().quote(amountSpecified)
          return {
            price: price.invert(),
            amountIn,
            amountOut: amountSpecified,
          }
        }

        return currentBest
      },
      {
        price: null,
        amountIn: null,
        amountOut: null,
      }
    )

    if (!price || !amountIn || !amountOut) {
      return {
        state: TradeState.INVALID,
        trade: undefined,
      }
    }

    return {
      state: TradeState.VALID,
      trade: new InvestmentTrade({
        investment: {
          price,
          inputAmount: amountIn,
          outputAmount: amountOut,
        },
        inputAmount: amountIn,
        outputAmount: amountOut,
        tradeType,
      }),
    }
  }, [amountSpecified, currencyIn, currencyOut, marketType, quotesResults, tradeType])
}
