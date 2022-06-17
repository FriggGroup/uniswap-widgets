import { BigNumber } from '@ethersproject/bignumber'
import { Trade } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, Rounding, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { toHex, Trade as V3Trade } from '@uniswap/v3-sdk'
import { useMemo } from 'react'

import useActiveWeb3React from '../useActiveWeb3React'
import { useFriggErc20TokenContract } from '../useContract'
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
  buyAmount: CurrencyAmount<Currency> | undefined,
  recipientAddressOrName: string | null | undefined,
  signatureData: SignatureData | null | undefined
): BuyCall[] {
  const { account, chainId } = useActiveWeb3React()

  const { address: recipientAddress } = useENS(recipientAddressOrName)
  const recipient = recipientAddressOrName === null ? account : recipientAddress

  const FriggErc20Contract = useFriggErc20TokenContract()

  return useMemo(() => {
    if (!buyAmount || !recipient || !account || !chainId || !FriggErc20Contract) return []

    const calldata = FriggErc20Contract.interface.encodeFunctionData('buyATTWithUSDC', [
      // todo 10 ** 18
      // BigNumber.from(buyAmount.quotient.toString()),
      BigNumber.from(buyAmount.toFixed(0, undefined, Rounding.ROUND_DOWN)),
    ])

    return [
      {
        address: FriggErc20Contract.address,
        calldata,
        value: toHex(0),
      },
    ]
  }, [buyAmount, recipient, account, chainId, FriggErc20Contract])
}
