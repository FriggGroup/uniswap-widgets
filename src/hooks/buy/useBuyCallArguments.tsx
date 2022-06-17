import { BigNumber } from '@ethersproject/bignumber'
import { Trade } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { toHex, Trade as V3Trade } from '@uniswap/v3-sdk'
import { useMemo } from 'react'

import { AddressMap } from '../../constants/addresses'
import { constructSameAddressMap } from '../../utils/constructSameAddressMap'
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

  // todo improve to have a sort of router Contract
  // todo use chain id
  const erc20ContractAddress = '0x1380DB7316f60d4e2A4E6Ca30E0B668a747E567b'
  const erc20ContractAddressMap: AddressMap = constructSameAddressMap(erc20ContractAddress)
  const FriggErc20Contract = useFriggErc20TokenContract(erc20ContractAddressMap)

  return useMemo(() => {
    if (!buyAmount || !recipient || !account || !chainId || !FriggErc20Contract) return []

    const calldata = FriggErc20Contract.interface.encodeFunctionData('buyATTWithUSDC', [
      BigNumber.from(buyAmount.quotient.toString()),
    ])

    return [
      {
        address: erc20ContractAddress,
        calldata,
        value: toHex(0),
      },
    ]
  }, [buyAmount, recipient, account, chainId, FriggErc20Contract])
}
