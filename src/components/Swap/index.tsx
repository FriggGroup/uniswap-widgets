import { JsonRpcProvider } from '@ethersproject/providers'
import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { Provider as Eip1193Provider } from '@web3-react/types'
import Wallet from 'components/ConnectWallet'
import Rule from 'components/Rule'
import { SwapInfoProvider } from 'hooks/swap/useSwapInfo'
import useSyncController, { SwapController, SwapSettingsController } from 'hooks/swap/useSyncController'
import useSyncConvenienceFee, { FeeOptions } from 'hooks/swap/useSyncConvenienceFee'
import useSyncSwapEventHandlers, { SwapEventHandlers } from 'hooks/swap/useSyncSwapEventHandlers'
import useSyncTokenDefaults, { TokenDefaults } from 'hooks/swap/useSyncTokenDefaults'
import { usePendingTransactions } from 'hooks/transactions'
import useHasFocus from 'hooks/useHasFocus'
import useOnSupportedNetwork from 'hooks/useOnSupportedNetwork'
import useSyncWidgetEventHandlers, { WidgetEventHandlers } from 'hooks/useSyncWidgetEventHandlers'
import { useAtom } from 'jotai'
import { useMemo, useState } from 'react'
import { displayTxHashAtom, Field } from 'state/swap'
import { SwapTransactionInfo, Transaction, TransactionType, WrapTransactionInfo } from 'state/transactions'
import { ThemedText } from 'theme'

import { BuySellInfoProvider } from '../../hooks/buy/useBuySellInfo'
import Dialog from '../Dialog'
import Header from '../Header'
import { BoundaryProvider } from '../Popover'
import TextHeader from '../TextHeader'
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

// SwapProps also currently includes props needed for wallet connection,
// since the wallet connection component exists within the Swap component.
// This includes useSyncWidgetEventHandlers.
// TODO(zzmp): refactor WalletConnection outside of Swap component
export interface SwapProps extends FeeOptions, TokenDefaults, SwapEventHandlers, WidgetEventHandlers {
  hideConnectionUI?: boolean
  provider?: Eip1193Provider | JsonRpcProvider
  routerUrl?: string
  settings?: SwapSettingsController
  value?: SwapController

  // frigg custom props
  marketType?: MarketType
  closeDialogWidget: () => void
  title?: string
  subtitle?: string
}

export default function Swap({ marketType = 'buy', title, subtitle, closeDialogWidget, ...props }: SwapProps) {
  useValidate(props)
  useSyncController(props)
  useSyncConvenienceFee(props as FeeOptions)
  useSyncSwapEventHandlers(props as SwapEventHandlers)
  useSyncTokenDefaults(props as TokenDefaults)
  useSyncWidgetEventHandlers(props as WidgetEventHandlers)

  const { isActive } = useWeb3React()
  const [wrapper, setWrapper] = useState<HTMLDivElement | null>(null)

  const [displayTxHash, setDisplayTxHash] = useAtom(displayTxHashAtom)
  const pendingTxs = usePendingTransactions()
  const displayTx = getTransactionFromMap(pendingTxs, displayTxHash)

  const onSupportedNetwork = useOnSupportedNetwork()
  const isDisabled = !(isActive && onSupportedNetwork)

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
      <Wallet disabled={props.hideConnectionUI} />
      {marketType === 'swap' && true && (
        <Header>
          <Settings disabled={isDisabled} />
        </Header>
      )}
      {renderDifferentText}
      {marketType === 'swap' ? (
        <div ref={setWrapper}>
          <BoundaryProvider value={wrapper}>
            <SwapInfoProvider disabled={isDisabled} routerUrl={props.routerUrl}>
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
                <BuyButton marketType={marketType} disabled={isDisabled} />
              </BuyOutput>
            </BuySellInfoProvider>
          </BoundaryProvider>
        </div>
      )}
      {displayTx && (
        <Dialog color="dialog">
          <StatusDialog
            tx={displayTx}
            onClose={() => {
              closeDialogWidget()
              setDisplayTxHash()
            }}
          />
        </Dialog>
      )}
    </>
  )
}
