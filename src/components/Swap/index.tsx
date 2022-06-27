import { Trans } from '@lingui/macro'
import { SwapInfoProvider } from 'hooks/swap/useSwapInfo'
import useSyncConvenienceFee, { FeeOptions } from 'hooks/swap/useSyncConvenienceFee'
import useSyncTokenDefaults, { TokenDefaults } from 'hooks/swap/useSyncTokenDefaults'
import { usePendingTransactions } from 'hooks/transactions'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import useHasFocus from 'hooks/useHasFocus'
import useOnSupportedNetwork from 'hooks/useOnSupportedNetwork'
import { useAtom } from 'jotai'
import { useMemo, useState } from 'react'
import { displayTxHashAtom } from 'state/swap'
import { SwapTransactionInfo, Transaction, TransactionType, WrapTransactionInfo } from 'state/transactions'
import { ThemedText } from 'theme'

import { BuyInfoProvider } from '../../hooks/buy/useBuyInfo'
import Dialog from '../Dialog'
import Header from '../Header'
import { BoundaryProvider } from '../Popover'
import Rule from '../Rule'
import TextHeader from '../TextHeader'
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

export interface SwapProps extends TokenDefaults, FeeOptions {
  onConnectWallet?: () => void
  marketType: 'buy' | 'swap' | 'sell'
  title?: string
  subtitle?: string
}

export default function Swap({ marketType, title, subtitle, ...props }: SwapProps) {
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

  const renderDifferentText = useMemo(() => {
    switch (marketType) {
      case 'buy':
        return (
          <TextHeader>
            <ThemedText.H2 fontWeight={500}>{title ? title : <Trans>Primary buyers</Trans>}</ThemedText.H2>
            <ThemedText.H2 orbikular>{subtitle ? subtitle : <Trans>Be the first!</Trans>}</ThemedText.H2>
          </TextHeader>
        )
      case 'sell':
        return (
          <TextHeader>
            <ThemedText.H2 fontWeight={500}>{title ? title : <Trans>Sell market</Trans>}</ThemedText.H2>
            <ThemedText.H2 orbikular>{subtitle ? subtitle : <Trans>Claim your profits!</Trans>}</ThemedText.H2>
          </TextHeader>
        )
      case 'swap':
        return (
          <TextHeader>
            <ThemedText.H2 fontWeight={500}>{title ? title : <Trans>Swap tokens</Trans>}</ThemedText.H2>
            <ThemedText.H2 orbikular>{subtitle ? subtitle : <Trans>Swap for fun!</Trans>}</ThemedText.H2>
          </TextHeader>
        )
    }
  }, [marketType, subtitle, title])

  return (
    <>
      <Wallet disabled={!active || Boolean(account)} onClick={props.onConnectWallet} />
      {marketType === 'swap' && true && (
        <Header>
          <Settings disabled={isDisabled} />
        </Header>
      )}
      {renderDifferentText}
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
            <BuyInfoProvider disabled={isDisabled}>
              <Rule padded />
              <Input disabled={isDisabled} focused={focused} fixed />
              <Rule padded />
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
