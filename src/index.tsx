import { ExternalProvider, Web3Provider } from '@ethersproject/providers'
import Swap, { SwapProps } from 'components/Swap'
import Widget, { WidgetProps } from 'components/Widget'
import { useState } from 'react'
export type { Provider as EthersProvider } from '@ethersproject/abstract-provider'
export type { TokenInfo } from '@uniswap/token-lists'
export type { Provider as Eip1193Provider } from '@web3-react/types'
export type { ErrorHandler } from 'components/Error/ErrorBoundary'
export { SupportedChainId } from 'constants/chains'
export type { SupportedLocale } from 'constants/locales'
export { DEFAULT_LOCALE, SUPPORTED_LOCALES } from 'constants/locales'
export type { FeeOptions } from 'hooks/swap/useSyncConvenienceFee'
export type { DefaultAddress, TokenDefaults } from 'hooks/swap/useSyncTokenDefaults'
export type { Theme } from 'theme'
export { darkTheme, defaultTheme, lightTheme } from 'theme'

export type SwapWidgetProps = SwapProps & WidgetProps

export function SwapWidget(props: SwapWidgetProps) {
  const [widgetProvider, setWidgetProvider] = useState<Web3Provider | undefined>(undefined)

  const connectWallet = async () => {
    try {
      const provider = window.ethereum ? new Web3Provider(window.ethereum as ExternalProvider) : undefined
      if (provider) await provider.send('eth_requestAccounts', [])
      setWidgetProvider(provider)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <Widget
      {...props}
      provider={widgetProvider}
      tokenList={[
        {
          name: 'ATT',
          address: '0x1380DB7316f60d4e2A4E6Ca30E0B668a747E567b',
          symbol: 'ATT',
          decimals: 18,
          chainId: 5,
          logoURI:
            'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png',
        },

        {
          name: 'USD Coin',
          address: '0x07865c6E87B9F70255377e024ace6630C1Eaa37F',
          symbol: 'USDC',
          decimals: 6,
          chainId: 5,
          logoURI:
            'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
        },
      ]}
    >
      <Swap
        {...props}
        defaultInputTokenAddress={{ 5: '0x07865c6E87B9F70255377e024ace6630C1Eaa37F' }}
        defaultInputAmount={1000}
        defaultOutputTokenAddress={{ 5: '0x1380DB7316f60d4e2A4E6Ca30E0B668a747E567b' }}
        onConnectWallet={connectWallet}
      />
    </Widget>
  )
}
