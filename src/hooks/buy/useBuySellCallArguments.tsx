import { BigNumber } from '@ethersproject/bignumber'
import { Currency, TradeType } from '@uniswap/sdk-core'
import { toHex } from '@uniswap/v3-sdk'
import { useWeb3React } from '@web3-react/core'
import { hexlify } from 'ethers/lib/utils'
import { useAtom } from 'jotai'
import { useMemo } from 'react'
import { queryFeeAtom } from 'state/swap'

import { InvestmentTrade } from '../../state/routing/types'
import { useFriggRouterContract } from '../useContract'
import useENS from '../useENS'
import { SignatureData } from '../useERC20Permit'

interface BuySellCall {
  address: string
  calldata: string
  value: string
}

export function useBuySellCallArguments(
  investmentTrade: InvestmentTrade<Currency, Currency, TradeType> | undefined,
  recipientAddressOrName: string | null | undefined,
  signatureData: SignatureData | null | undefined
): BuySellCall[] {
  const { account, chainId } = useWeb3React()
  const [queryFee] = useAtom(queryFeeAtom)

  console.log(queryFee)

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
        value: toHex(hexlify(queryFee || 0)),
      },
    ]
  }, [investmentTrade, recipient, account, chainId, friggRouterContract, queryFee])
}
