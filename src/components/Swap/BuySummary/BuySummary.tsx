import { useLingui } from '@lingui/react'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { ArrowRight } from 'icons'
import { PropsWithChildren } from 'react'
import { ThemedText } from 'theme'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'

import Column from '../../Column'
import Row from '../../Row'
import TokenImg from '../../TokenImg'

interface TokenValueProps {
  input: CurrencyAmount<Currency>
  usdc?: CurrencyAmount<Currency>
}

function TokenValue({ input, usdc, children }: PropsWithChildren<TokenValueProps>) {
  const { i18n } = useLingui()
  return (
    <Column justify="flex-start">
      <Row gap={0.375} justify="flex-start">
        <TokenImg token={input.currency} />
        <ThemedText.Body2 userSelect>
          {formatCurrencyAmount(input, 6, i18n.locale)} {input.currency.symbol}
        </ThemedText.Body2>
      </Row>
      {usdc && (
        <ThemedText.Caption color="secondary" userSelect>
          <Row justify="flex-start" gap={0.25}>
            ${formatCurrencyAmount(usdc, 6, 'en', 2)}
            {children}
          </Row>
        </ThemedText.Caption>
      )}
    </Column>
  )
}

interface SummaryProps {
  input: CurrencyAmount<Currency>
  output: CurrencyAmount<Currency>
  inputUSDC?: CurrencyAmount<Currency>
  outputUSDC?: CurrencyAmount<Currency>
}

export default function BuySummary({ input, output, inputUSDC, outputUSDC }: SummaryProps) {
  return (
    <Row gap={0.25}>
      <TokenValue input={input} usdc={inputUSDC} />
      <ArrowRight />
      <TokenValue input={output} usdc={outputUSDC} />
    </Row>
  )
}
