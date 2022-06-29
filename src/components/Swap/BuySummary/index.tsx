import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import ActionButton, { Action } from 'components/ActionButton'
import Column from 'components/Column'
import { Header } from 'components/Dialog'
import { Spinner } from 'icons'
import { useCallback, useMemo, useState } from 'react'
import styled from 'styled-components/macro'

import { InvestmentTrade } from '../../../state/routing/types'
import BuyPrice from '../Price'
import BuySummary from './BuySummary'

export default BuySummary

const Content = styled(Column)``
const Heading = styled(Column)``
const Footing = styled(Column)``
const Body = styled(Column)`
  height: calc(100% - 2.5em);

  ${Content}, ${Heading} {
    flex-grow: 1;
    transition: flex-grow 0.25s;
  }

  ${Footing} {
    max-height: 3em;
    opacity: 1;
    transition: max-height 0.25s, margin-bottom 0.25s, opacity 0.15s 0.1s;
  }
`

function ConfirmButton({ onConfirm, isBuy }: { onConfirm: () => Promise<void>; isBuy: boolean }) {
  const [isPending, setIsPending] = useState(false)
  const onClick = useCallback(async () => {
    setIsPending(true)
    await onConfirm()
    setIsPending(false)
  }, [onConfirm])

  const action = useMemo((): Action | undefined => {
    if (isPending) {
      return { message: <Trans>Confirm in your wallet</Trans>, icon: Spinner }
    }
    return
  }, [isPending])

  return (
    <ActionButton onClick={onClick} action={action}>
      {isBuy ? <Trans>Confirm buy</Trans> : <Trans>Confirm sell</Trans>}
    </ActionButton>
  )
}

interface SummaryDialogProps {
  trade: InvestmentTrade<Currency, Currency, TradeType>
  inputUSDC?: CurrencyAmount<Currency>
  outputUSDC?: CurrencyAmount<Currency>
  onConfirm: () => Promise<void>
}

export function BuySummaryDialog({ trade, inputUSDC, outputUSDC, onConfirm }: SummaryDialogProps) {
  const { inputAmount, outputAmount } = trade

  return (
    <>
      <Header
        title={trade.investment.marketType === 'buy' ? <Trans>Buy summary</Trans> : <Trans>Sell summary</Trans>}
        ruled
      />
      <Body flex align="stretch" padded gap={0.75}>
        <Heading gap={0.75} flex justify="center">
          <BuySummary input={inputAmount} output={outputAmount} inputUSDC={inputUSDC} outputUSDC={outputUSDC} />
          <BuyPrice trade={trade} />
        </Heading>
        <Column gap={0.75} style={{ transition: 'gap 0.25s' }}>
          <ConfirmButton onConfirm={onConfirm} isBuy={trade.investment.marketType === 'buy'} />
        </Column>
      </Body>
    </>
  )
}
