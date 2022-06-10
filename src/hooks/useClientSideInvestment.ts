import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { InvestmentTrade, TradeState } from 'state/routing/types'

import { AddressMap } from '../constants/addresses'
import { constructSameAddressMap } from '../utils/constructSameAddressMap'
import { useSingleContractWithCallData } from './multicall'
import { useFriggErc20TokenContract } from './useContract'

export function useClientSideInvestment<TTradeType extends TradeType>(
  tradeType: TTradeType,
  amountSpecified?: CurrencyAmount<Currency>,
  otherCurrency?: Currency
): { state: TradeState; trade: InvestmentTrade<Currency, Currency, TTradeType> | undefined } {
  const [currencyIn, currencyOut] =
    tradeType === TradeType.EXACT_INPUT
      ? [amountSpecified?.currency, otherCurrency]
      : [otherCurrency, amountSpecified?.currency]

  // the contract where we get the price from
  const erc20ContractAddress = '0x1380DB7316f60d4e2A4E6Ca30E0B668a747E567b'
  const erc20ContractAddressMap: AddressMap = constructSameAddressMap(erc20ContractAddress)
  const FriggErc20Contract = useFriggErc20TokenContract(erc20ContractAddressMap)

  const callData = useMemo(() => {
    if (!FriggErc20Contract) return []
    return [FriggErc20Contract?.interface.encodeFunctionData('issuancePriceInUSDC', [])]
  }, [FriggErc20Contract])

  const quotesResults = useSingleContractWithCallData(FriggErc20Contract, callData)

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

    const { issuancePrice, amountIn, amountOut } = quotesResults.reduce(
      (
        currentBest: {
          issuancePrice: CurrencyAmount<Currency> | null
          amountIn: CurrencyAmount<Currency> | null
          amountOut: CurrencyAmount<Currency> | null
        },
        { result },
        i
      ) => {
        if (!result) return currentBest

        console.log('amountSpecified', amountSpecified)

        const issuancePrice = CurrencyAmount.fromRawAmount(currencyIn, result[0].toString()).divide(
          10 ** currencyIn.decimals
        )
        if (tradeType === TradeType.EXACT_INPUT) {
          const amountOut = amountSpecified.divide(issuancePrice)
          return {
            issuancePrice,
            amountIn: amountSpecified,
            amountOut,
          }
        } else {
          const amountIn = amountSpecified.multiply(issuancePrice)
          return {
            issuancePrice: CurrencyAmount.fromRawAmount(currencyIn, 1).divide(issuancePrice),
            amountIn,
            amountOut: amountSpecified,
          }
        }

        return currentBest
      },
      {
        issuancePrice: null,
        amountIn: null,
        amountOut: null,
      }
    )

    if (!issuancePrice || !amountIn || !amountOut) {
      return {
        state: TradeState.INVALID,
        trade: undefined,
      }
    }

    return {
      state: TradeState.VALID,
      trade: new InvestmentTrade({
        investment: {
          issuancePrice,
          inputAmount: amountIn,
          outputAmount: amountOut,
        },
        inputAmount: amountIn,
        outputAmount: amountOut,
        tradeType,
      }),
    }
  }, [amountSpecified, currencyIn, currencyOut, quotesResults, tradeType])
}
