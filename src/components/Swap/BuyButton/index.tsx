import { Trans } from '@lingui/macro'
import { Percent } from '@uniswap/sdk-core'
import useWrapCallback, { WrapType } from 'hooks/swap/useWrapCallback'
import { useAddTransaction } from 'hooks/transactions'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useSetOldestValidBlock } from 'hooks/useIsValidBlock'
import { Spinner } from 'icons'
import { useUpdateAtom } from 'jotai/utils'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { TradeState } from 'state/routing/types'
import { displayTxHashAtom, Field } from 'state/swap'
import { TransactionType } from 'state/transactions'
import { useTheme } from 'styled-components/macro'
import invariant from 'tiny-invariant'
import { isAnimating } from 'utils/animations'

import { useBuyCallback } from '../../../hooks/buy/useBuyCallback'
import useBuyInfo from '../../../hooks/buy/useBuyInfo'
import ActionButton, { ActionButtonProps } from '../../ActionButton'
import Dialog from '../../Dialog'
import { BuySummaryDialog } from '../BuySummary'
import useApprovalData from '../SwapButton/useApprovalData'

interface BuyButtonProps {
  disabled?: boolean
}

export default memo(function BuyButton({ disabled }: BuyButtonProps) {
  const { account, chainId } = useActiveWeb3React()
  const {
    [Field.INPUT]: {
      currency: inputCurrency,
      amount: inputCurrencyAmount,
      balance: inputCurrencyBalance,
      usdc: inputUSDC,
    },
    [Field.OUTPUT]: { amount: outputCurrencyAmount, usdc: outputUSDC },
    trade,
  } = useBuyInfo()

  console.log(
    'hallo',
    inputCurrency,
    inputCurrencyAmount?.toFixed(),
    inputCurrencyBalance?.toFixed(),
    inputUSDC?.toFixed(),
    outputCurrencyAmount?.toFixed(),
    outputUSDC?.toFixed()
  )

  const { type: wrapType, callback: wrapCallback } = useWrapCallback()
  const { approvalAction, signatureData } = useApprovalData(
    trade.trade,
    // we set a 0% slippage to re-use the normal approval function
    {
      auto: false,
      allowed: new Percent(0, 1),
    },
    inputCurrencyAmount
  )
  const { callback: buyCallback } = useBuyCallback({
    buyAmount: outputCurrencyAmount,
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
  const onWrap = useCallback(async () => {
    setIsPending(true)
    try {
      const transaction = await wrapCallback?.()
      if (!transaction) return
      addTransaction({
        response: transaction,
        type: TransactionType.WRAP,
        unwrapped: wrapType === WrapType.UNWRAP,
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
  }, [addTransaction, chainId, setDisplayTxHash, wrapCallback, wrapType])
  // Reset the pending state if user updates the swap.
  useEffect(() => setIsPending(false), [inputCurrencyAmount, trade])

  const onSwap = useCallback(async () => {
    try {
      const transaction = await buyCallback?.()
      if (!transaction) return
      invariant(trade.trade)
      addTransaction({
        response: transaction,
        type: TransactionType.BUY,
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
  }, [addTransaction, setDisplayTxHash, setOldestValidBlock, buyCallback, trade.trade])

  const disableSwap = useMemo(
    () =>
      disabled ||
      !chainId ||
      (wrapType === WrapType.NONE && !trade) ||
      !(inputCurrencyAmount && inputCurrencyBalance) ||
      inputCurrencyBalance.lessThan(inputCurrencyAmount),
    [disabled, chainId, wrapType, trade, inputCurrencyAmount, inputCurrencyBalance]
  )
  const actionProps = useMemo((): Partial<ActionButtonProps> | undefined => {
    if (disableSwap) {
      return { disabled: true }
    } else if (wrapType === WrapType.NONE) {
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
  }, [approvalAction, disableSwap, isPending, onWrap, trade.state, wrapType])
  const Label = useCallback(() => {
    switch (wrapType) {
      case WrapType.UNWRAP:
        return <Trans>Unwrap {inputCurrency?.symbol}</Trans>
      case WrapType.WRAP:
        return <Trans>Wrap {inputCurrency?.symbol}</Trans>
      case WrapType.NONE:
      default:
        return <Trans>Review buy</Trans>
    }
  }, [inputCurrency?.symbol, wrapType])
  const onClose = useCallback(() => setOpen(false), [])

  const { tokenColorExtraction } = useTheme()
  return (
    <>
      <ActionButton color={tokenColorExtraction ? 'interactive' : 'accent'} {...actionProps}>
        <Label />
      </ActionButton>
      {open && trade.trade && (
        <Dialog color="dialog" onClose={onClose}>
          <BuySummaryDialog trade={trade.trade} inputUSDC={inputUSDC} outputUSDC={outputUSDC} onConfirm={onSwap} />
        </Dialog>
      )}
    </>
  )
})
