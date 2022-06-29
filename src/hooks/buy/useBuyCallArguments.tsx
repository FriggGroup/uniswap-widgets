import { BigNumber } from '@ethersproject/bignumber'
import { Trade } from '@uniswap/router-sdk'
import { Currency, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { toHex, Trade as V3Trade } from '@uniswap/v3-sdk'
import { useMemo } from 'react'

import { InvestmentTrade } from '../../state/routing/types'
import useActiveWeb3React from '../useActiveWeb3React'
import { useFriggRouterContract } from '../useContract'
import useENS from '../useENS'
import { SignatureData } from '../useERC20Permit'

export type AnyTrade =
  | V2Trade<Currency, Currency, TradeType>
  | V3Trade<Currency, Currency, TradeType>
  | Trade<Currency, Currency, TradeType>

interface BuyCall {
  address: string
  calldata: string
  value: string
}

export function useBuyCallArguments(
  investmentTrade: InvestmentTrade<Currency, Currency, TradeType> | undefined,
  recipientAddressOrName: string | null | undefined,
  signatureData: SignatureData | null | undefined
): BuyCall[] {
  const { account, chainId } = useActiveWeb3React()

  const { address: recipientAddress } = useENS(recipientAddressOrName)
  const recipient = recipientAddressOrName === null ? account : recipientAddress

  const friggRouterContract = useFriggRouterContract()

  return useMemo(() => {
    if (!investmentTrade || !recipient || !account || !chainId || !friggRouterContract) return []
    if (!investmentTrade.inputAmount.currency?.isToken || !investmentTrade.outputAmount.currency?.isToken) return []

    const calldata =
      investmentTrade.investment.marketType === 'buy'
        ? friggRouterContract.interface.encodeFunctionData('buy', [
            // function buy(address friggTokenAddress, uint256 inputTokenAmount) external
            investmentTrade.outputAmount.currency.address,
            BigNumber.from(investmentTrade.inputAmount.quotient.toString()),
          ])
        : friggRouterContract.interface.encodeFunctionData('sell', [
            // function sell(address friggTokenAddress, uint256 inputFriggTokenAmount) external
            investmentTrade.inputAmount.currency.address,
            BigNumber.from(investmentTrade.inputAmount.quotient.toString()),
          ])

    return [
      {
        address: friggRouterContract.address,
        calldata,
        value: toHex(0),
      },
    ]
  }, [investmentTrade, recipient, account, chainId, friggRouterContract])
}
