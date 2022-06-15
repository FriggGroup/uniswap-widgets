import { Trans } from '@lingui/macro'
import { SwapInfoProvider } from 'hooks/swap/useSwapInfo'
import useSyncConvenienceFee, { FeeOptions } from 'hooks/swap/useSyncConvenienceFee'
import useSyncTokenDefaults, { TokenDefaults } from 'hooks/swap/useSyncTokenDefaults'
import { usePendingTransactions } from 'hooks/transactions'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import useHasFocus from 'hooks/useHasFocus'
import useOnSupportedNetwork from 'hooks/useOnSupportedNetwork'
import { useAtom } from 'jotai'
import { useState } from 'react'
import { displayTxHashAtom } from 'state/swap'
import { SwapTransactionInfo, Transaction, TransactionType, WrapTransactionInfo } from 'state/transactions'

import { BuyInfoProvider } from '../../hooks/buy/useBuyInfo'
import Dialog from '../Dialog'
import Header from '../Header'
import { BoundaryProvider } from '../Popover'
import BuyButton from './BuyButton'
import BuyOutput from './BuyOutput'
import BuyToolbar from './BuyToolbar'
import Input from './Input'
import Output from './Output'
import ReverseButton from './ReverseButton'
import { StatusDialog } from './Status'
import BuyArrow from './SwapArrow'
import SwapButton from './SwapButton'
import Toolbar from './Toolbar'
import useValidate from './useValidate'
import Wallet from '../Wallet'
import Settings from './Settings'

function getTransactionFromMap(
  txs: { [hash: string]: Transaction },
  hash?: string
): Transaction<SwapTransactionInfo | WrapTransactionInfo> | undefined {
  if (hash) {
    const tx = txs[hash]
    if (tx?.info?.type === TransactionType.SWAP) {
      return tx as Transaction<SwapTransactionInfo>
    }
    if (tx?.info?.type === TransactionType.WRAP) {
      return tx as Transaction<WrapTransactionInfo>
    }
  }
  return
}

export interface SwapProps extends TokenDefaults, FeeOptions {
  onConnectWallet?: () => void
  marketType: 'buy' | 'swap' | 'sell'
}

export default function Swap({ marketType, ...props }: SwapProps) {
  useValidate(props)
  useSyncConvenienceFee(props)
  useSyncTokenDefaults(props)

  const { active, account } = useActiveWeb3React()
  const [wrapper, setWrapper] = useState<HTMLDivElement | null>(null)

  const [displayTxHash, setDisplayTxHash] = useAtom(displayTxHashAtom)
  const pendingTxs = usePendingTransactions()
  const displayTx = getTransactionFromMap(pendingTxs, displayTxHash)

  const onSupportedNetwork = useOnSupportedNetwork()
  const isDisabled = !(active && onSupportedNetwork)

  const focused = useHasFocus(wrapper)

  return (
    <>
      <Header title={<Trans>{marketType === 'swap' ? 'Swap' : 'Buy'}</Trans>}>
        <Wallet disabled={!active || Boolean(account)} onClick={props.onConnectWallet} />
        <Settings disabled={isDisabled} />
      </Header>
      {marketType === 'swap' ? (
        <div ref={setWrapper}>
          <BoundaryProvider value={wrapper}>
            <SwapInfoProvider disabled={isDisabled}>
              <Input disabled={isDisabled} focused={focused} />
              <ReverseButton disabled={isDisabled} />
              <Output disabled={isDisabled} focused={focused}>
                <Toolbar />
                <SwapButton disabled={isDisabled} />
              </Output>
            </SwapInfoProvider>
          </BoundaryProvider>
        </div>
      ) : (
        <div ref={setWrapper}>
          <BoundaryProvider value={wrapper}>
            <BuyInfoProvider disabled={isDisabled}>
              <Input disabled={isDisabled} focused={focused} fixed />
              <BuyArrow />
              <BuyOutput disabled={isDisabled} focused={focused} fixed>
                <BuyToolbar />
                <BuyButton disabled={isDisabled} />
              </BuyOutput>
            </BuyInfoProvider>
          </BoundaryProvider>
        </div>
      )}
      {displayTx && (
        <Dialog color="dialog">
          <StatusDialog tx={displayTx} onClose={() => setDisplayTxHash()} />
        </Dialog>
      )}
    </>
  )
}
