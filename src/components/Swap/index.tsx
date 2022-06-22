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

import { BuySellInfoProvider } from '../../hooks/buy/useBuySellInfo'
import Dialog from '../Dialog'
import Header from '../Header'
import { BoundaryProvider } from '../Popover'
import Rule from '../Rule'
import Wallet from '../Wallet'
import BuyButton from './BuyButton'
import BuyOutput from './BuyOutput'
import BuyToolbar from './BuyToolbar'
import Input from './Input'
import Output from './Output'
import ReverseButton from './ReverseButton'
import Settings from './Settings'
import { StatusDialog } from './Status'
import BuyArrow from './SwapArrow'
import SwapButton from './SwapButton'
import Toolbar from './Toolbar'
import useValidate from './useValidate'

function getTransactionFromMap(
  txs: { [hash: string]: Transaction },
  hash?: string
): Transaction<SwapTransactionInfo | WrapTransactionInfo> | undefined {
  if (hash) {
    const tx = txs[hash]
    if (
      tx?.info?.type === TransactionType.SWAP ||
      tx?.info?.type === TransactionType.BUY ||
      tx?.info?.type === TransactionType.SELL
    ) {
      return tx as Transaction<SwapTransactionInfo>
    }
    if (tx?.info?.type === TransactionType.WRAP) {
      return tx as Transaction<WrapTransactionInfo>
    }
  }
  return
}

export type MarketType = 'buy' | 'swap' | 'sell'

export interface SwapProps extends TokenDefaults, FeeOptions {
  onConnectWallet?: () => void
  marketType: MarketType
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
      <Header title={<Trans>{marketType === 'swap' ? 'Swap' : marketType === 'buy' ? 'Buy' : 'Sell'}</Trans>}>
        <Wallet disabled={!active || Boolean(account)} onClick={props.onConnectWallet} />
        {marketType === 'swap' && <Settings disabled={isDisabled} />}
      </Header>
      {marketType === 'swap' ? (
        <div ref={setWrapper}>
          <BoundaryProvider value={wrapper}>
            <SwapInfoProvider disabled={isDisabled}>
              <Rule padded />
              <Input disabled={isDisabled} focused={focused} />
              <Rule padded />
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
            <BuySellInfoProvider disabled={isDisabled} marketType={marketType}>
              <Rule padded />
              <Input disabled={isDisabled} focused={focused} fixed />
              <Rule padded />
              <BuyArrow />
              <BuyOutput disabled={isDisabled} focused={focused} fixed>
                <BuyToolbar />
                <BuyButton disabled={isDisabled} />
              </BuyOutput>
            </BuySellInfoProvider>
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
