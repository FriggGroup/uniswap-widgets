import { Trans } from '@lingui/macro'
import { CurrencyAmount, Percent } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import useWrapCallback from 'hooks/swap/useWrapCallback'
import { useAddTransaction } from 'hooks/transactions'
import { useSetOldestValidBlock } from 'hooks/useIsValidBlock'
import useNativeCurrency from 'hooks/useNativeCurrency'
import { Spinner } from 'icons'
import { useUpdateAtom } from 'jotai/utils'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { TradeState } from 'state/routing/types'
import { displayTxHashAtom, Field } from 'state/swap'
import { TransactionType } from 'state/transactions'
import { useTheme } from 'styled-components/macro'
import invariant from 'tiny-invariant'
import { isAnimating } from 'utils/animations'

import { useBuySellCallback } from '../../../hooks/buy/useBuySellCallback'
import useBuySellInfo from '../../../hooks/buy/useBuySellInfo'
import ActionButton, { ActionButtonProps } from '../../ActionButton'
import Dialog from '../../Dialog'
import { BuySummaryDialog } from '../BuySummary'
import useApprovalData from '../SwapButton/useApprovalData'

interface BuyButtonProps {
  disabled?: boolean
  marketType: 'buy' | 'sell' | 'swap'
}

export default memo(function BuyButton({ disabled, marketType }: BuyButtonProps) {
  const { account, chainId } = useWeb3React()
  const {
    [Field.INPUT]: {
      currency: inputCurrency,
      amount: inputCurrencyAmount,
      balance: inputCurrencyBalance,
      usdc: inputUSDC,
    },
    [Field.OUTPUT]: { usdc: outputUSDC },
    trade,
  } = useBuySellInfo()

  const { type: wrapType, callback: wrapCallback, isWrap } = useWrapCallback()
  const { approvalAction, signatureData } = useApprovalData(
    trade.trade,
    // we set a 0% slippage to re-use the normal approval function
    {
      auto: false,
      allowed: new Percent(0, 1),
    },
    inputCurrencyAmount
  )
  const { callback: buySellCallback } = useBuySellCallback({
    investmentTrade: trade.trade,
    recipientAddressOrName: account ?? null,
    signatureData,
  })

  const [open, setOpen] = useState(false)
  // Close the review modal if there is no available trade.
  useEffect(() => setOpen((open) => (trade.trade ? open : false)), [trade.trade])
  // Close the review modal on chain change.
  useEffect(() => setOpen(false), [chainId])

  const addTransaction = useAddTransaction()
  const setDisplayTxHash = useUpdateAtom(displayTxHashAtom)
  const setOldestValidBlock = useSetOldestValidBlock()

  const [isPending, setIsPending] = useState(false)
  const native = useNativeCurrency()
  const onWrap = useCallback(async () => {
    setIsPending(true)
    try {
      const transaction = await wrapCallback?.()
      if (!transaction) return
      invariant(wrapType !== undefined)
      addTransaction({
        response: transaction,
        type: wrapType,
        currencyAmountRaw: transaction.value?.toString() ?? '0',
        chainId,
      })
      setDisplayTxHash(transaction.hash)
    } catch (e) {
      // TODO(zzmp): Surface errors from wrap.
      console.log(e)
    }

    // Only reset pending after any queued animations to avoid layout thrashing, because a
    // successful wrap will open the status dialog and immediately cover the button.
    const postWrap = () => {
      setIsPending(false)
      document.removeEventListener('animationend', postWrap)
    }
    if (isAnimating(document)) {
      document.addEventListener('animationend', postWrap)
    } else {
      postWrap()
    }
  }, [addTransaction, native, setDisplayTxHash, wrapCallback, wrapType])
  // Reset the pending state if user updates the swap.
  useEffect(() => setIsPending(false), [inputCurrencyAmount, trade])

  const onBuySell = useCallback(async () => {
    try {
      const transaction = await buySellCallback?.()
      if (!transaction) return
      invariant(trade.trade)
      addTransaction({
        type: trade.trade.investment.marketType === 'buy' ? TransactionType.BUY : TransactionType.SELL,
        response: transaction,
        tradeType: trade.trade.tradeType,
        inputCurrencyAmount: trade.trade.inputAmount,
        outputCurrencyAmount: trade.trade.outputAmount,
      })
      setDisplayTxHash(transaction.hash)

      // Set the block containing the response to the oldest valid block to ensure that the
      // completed trade's impact is reflected in future fetched trades.
      transaction.wait(1).then((receipt) => {
        setOldestValidBlock(receipt.blockNumber)
      })

      // Only reset open after any queued animations to avoid layout thrashing, because a
      // successful swap will open the status dialog and immediately cover the summary dialog.
      const postSwap = () => {
        setOpen(false)
        document.removeEventListener('animationend', postSwap)
      }
      if (isAnimating(document)) {
        document.addEventListener('animationend', postSwap)
      } else {
        postSwap()
      }
    } catch (e) {
      // TODO(zzmp): Surface errors from swap.
      console.log(e)
    }
  }, [addTransaction, setDisplayTxHash, setOldestValidBlock, buySellCallback, trade.trade])

  const disableSwap = useMemo(
    () =>
      disabled ||
      isWrap ||
      !chainId ||
      !(inputCurrencyAmount && inputCurrencyBalance) ||
      inputCurrencyBalance.lessThan(inputCurrencyAmount),
    [disabled, isWrap, chainId, inputCurrencyAmount, inputCurrencyBalance]
  )
  const actionProps = useMemo((): Partial<ActionButtonProps> | undefined => {
    if (disableSwap) {
      return { disabled: true }
    } else if (isWrap) {
      return approvalAction
        ? { action: approvalAction }
        : trade.state === TradeState.VALID
        ? { onClick: () => setOpen(true) }
        : { disabled: true }
    } else {
      return isPending
        ? { action: { message: <Trans>Confirm in your wallet</Trans>, icon: Spinner } }
        : { onClick: onWrap }
    }
  }, [approvalAction, disableSwap, isPending, isWrap, onWrap, trade.state])
  const Label = useCallback(() => {
    switch (wrapType) {
      case TransactionType.WRAP:
        return <Trans>Wrap {inputCurrency?.symbol}</Trans>
      case TransactionType.UNWRAP:
        return <Trans>Unwrap {inputCurrency?.symbol}</Trans>
      case undefined:
        return <Trans>Review swap</Trans>
      default:
        return marketType === 'buy' ? <Trans>Review buy</Trans> : <Trans>Review sell</Trans>
    }
  }, [inputCurrency?.symbol, marketType, wrapType])
  const onClose = useCallback(() => setOpen(false), [])

  const { tokenColorExtraction } = useTheme()
  return (
    <>
      <ActionButton color={tokenColorExtraction ? 'interactive' : 'accent'} {...actionProps}>
        <Label />
      </ActionButton>
      {open && trade.trade && (
        <Dialog color="dialog" onClose={onClose}>
          <BuySummaryDialog trade={trade.trade} inputUSDC={inputUSDC} outputUSDC={outputUSDC} onConfirm={onBuySell} />
        </Dialog>
      )}
    </>
  )
})
