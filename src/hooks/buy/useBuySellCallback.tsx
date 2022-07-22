// eslint-disable-next-line no-restricted-imports
import { TransactionResponse } from '@ethersproject/providers'
import { Trans } from '@lingui/macro'
import { Currency, TradeType } from '@uniswap/sdk-core'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import useENS from 'hooks/useENS'
import { SignatureData } from 'hooks/useERC20Permit'
import { ReactNode, useMemo } from 'react'

import { InvestmentTrade } from '../../state/routing/types'
import useSendSwapTransaction from '../swap/useSendSwapTransaction'
import { useBuySellCallArguments } from './useBuySellCallArguments'

export enum BuyCallbackState {
  INVALID,
  LOADING,
  VALID,
}

interface UseBuySellCallbackReturns {
  state: BuyCallbackState
  callback?: () => Promise<TransactionResponse>
  error?: ReactNode
}
interface UseBuyCallbackArgs {
  investmentTrade: InvestmentTrade<Currency, Currency, TradeType> | undefined
  recipientAddressOrName: string | null | undefined // the ENS name or address of the recipient of the trade, or null if swap should be returned to sender
  signatureData: SignatureData | null | undefined
}

// returns a function that will execute a swap, if the parameters are all valid
// and the user has approved the slippage adjusted input amount for the trade
export function useBuySellCallback({
  investmentTrade,
  recipientAddressOrName,
  signatureData,
}: UseBuyCallbackArgs): UseBuySellCallbackReturns {
  const { account, chainId, library } = useActiveWeb3React()

  const buySellCalls = useBuySellCallArguments(investmentTrade, recipientAddressOrName, signatureData)
  const { callback } = useSendSwapTransaction(account, chainId, library, investmentTrade, buySellCalls)

  const { address: recipientAddress } = useENS(recipientAddressOrName)
  const recipient = recipientAddressOrName === null ? account : recipientAddress

  return useMemo(() => {
    if (!library || !account || !chainId || !callback) {
      return { state: BuyCallbackState.INVALID, error: <Trans>Missing dependencies</Trans> }
    }
    if (!recipient) {
      if (recipientAddressOrName !== null) {
        return { state: BuyCallbackState.INVALID, error: <Trans>Invalid recipient</Trans> }
      } else {
        return { state: BuyCallbackState.LOADING }
      }
    }

    return {
      state: BuyCallbackState.VALID,
      callback: async () => callback(),
    }
  }, [library, account, chainId, callback, recipient, recipientAddressOrName])
}
