import { Trade } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, Percent, Price, Token, TradeType } from '@uniswap/sdk-core'
import { Route as V2Route } from '@uniswap/v2-sdk'
import { Route as V3Route } from '@uniswap/v3-sdk'

export enum TradeState {
  LOADING,
  INVALID,
  NO_ROUTE_FOUND,
  VALID,
  SYNCING,
}

// from https://github.com/Uniswap/routing-api/blob/main/lib/handlers/schema.ts

export type TokenInRoute = Pick<Token, 'address' | 'chainId' | 'symbol' | 'decimals'>

export type V3PoolInRoute = {
  type: 'v3-pool'
  tokenIn: TokenInRoute
  tokenOut: TokenInRoute
  sqrtRatioX96: string
  liquidity: string
  tickCurrent: string
  fee: string
  amountIn?: string
  amountOut?: string

  // not used in the interface
  address?: string
}

export type V2Reserve = {
  token: TokenInRoute
  quotient: string
}

export type V2PoolInRoute = {
  type: 'v2-pool'
  tokenIn: TokenInRoute
  tokenOut: TokenInRoute
  reserve0: V2Reserve
  reserve1: V2Reserve
  amountIn?: string
  amountOut?: string

  // not used in the interface
  // avoid returning it from the client-side smart-order-router
  address?: string
}

export interface GetQuoteResult {
  quoteId?: string
  blockNumber: string
  amount: string
  amountDecimals: string
  gasPriceWei: string
  gasUseEstimate: string
  gasUseEstimateQuote: string
  gasUseEstimateQuoteDecimals: string
  gasUseEstimateUSD: string
  methodParameters?: { calldata: string; value: string }
  quote: string
  quoteDecimals: string
  quoteGasAdjusted: string
  quoteGasAdjustedDecimals: string
  route: Array<V3PoolInRoute[] | V2PoolInRoute[]>
  routeString: string
}

export class InterfaceTrade<
  TInput extends Currency,
  TOutput extends Currency,
  TTradeType extends TradeType
> extends Trade<TInput, TOutput, TTradeType> {
  gasUseEstimateUSD: CurrencyAmount<Token> | null | undefined

  constructor({
    gasUseEstimateUSD,
    ...routes
  }: {
    gasUseEstimateUSD?: CurrencyAmount<Token> | undefined | null
    v2Routes: {
      routev2: V2Route<TInput, TOutput>
      inputAmount: CurrencyAmount<TInput>
      outputAmount: CurrencyAmount<TOutput>
    }[]
    v3Routes: {
      routev3: V3Route<TInput, TOutput>
      inputAmount: CurrencyAmount<TInput>
      outputAmount: CurrencyAmount<TOutput>
    }[]
    tradeType: TTradeType
  }) {
    super(routes)
    this.gasUseEstimateUSD = gasUseEstimateUSD
  }
}

export class InvestmentTrade<TInput extends Currency, TOutput extends Currency, TTradeType extends TradeType> {
  gasUseEstimateUSD: CurrencyAmount<Token> | null | undefined
  tradeType: TTradeType
  outputAmount: CurrencyAmount<TOutput>
  inputAmount: CurrencyAmount<TInput>
  investment: {
    price: Price<TInput, TOutput>
    inputAmount: CurrencyAmount<TInput>
    outputAmount: CurrencyAmount<TOutput>
  }

  get executionPrice(): Price<TInput, TOutput> {
    return new Price(
      this.inputAmount.currency,
      this.outputAmount.currency,
      this.inputAmount.quotient,
      this.outputAmount.quotient
    )
  }

  maximumAmountIn(slippageTolerance: Percent, amountIn?: CurrencyAmount<TInput>): CurrencyAmount<TInput> {
    return this.inputAmount
  }

  constructor({
    gasUseEstimateUSD,
    tradeType,
    outputAmount,
    inputAmount,
    investment,
  }: {
    gasUseEstimateUSD?: CurrencyAmount<Token> | undefined | null
    investment: {
      price: Price<TInput, TOutput>
      inputAmount: CurrencyAmount<TInput>
      outputAmount: CurrencyAmount<TOutput>
    }
    outputAmount: CurrencyAmount<TOutput>
    inputAmount: CurrencyAmount<TInput>
    tradeType: TTradeType
  }) {
    this.gasUseEstimateUSD = gasUseEstimateUSD
    this.investment = investment
    this.inputAmount = inputAmount
    this.outputAmount = outputAmount
    this.tradeType = tradeType
  }
}
