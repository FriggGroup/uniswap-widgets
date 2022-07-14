import { tokens } from '@uniswap/default-token-list'
import { TokenInfo } from '@uniswap/token-lists'
import {
  darkTheme,
  DEFAULT_LOCALE,
  defaultTheme,
  lightTheme,
  SUPPORTED_LOCALES,
  SupportedChainId,
  SwapWidget,
} from '@uniswap/widgets'
import { useEffect } from 'react'
import { useValue } from 'react-cosmos/fixture'

import { MarketType } from '../components/Swap'
import { DAI, USDC_MAINNET } from '../constants/tokens'
import useJsonRpcEndpoint from './useJsonRpcEndpoint'
import useOption from './useOption'
import useProvider from './useProvider'

function Fixture() {
  const [convenienceFee] = useValue('convenienceFee', { defaultValue: 0 })
  const convenienceFeeRecipient = useOption('convenienceFeeRecipient', {
    options: [
      '0x1D9Cd50Dde9C19073B81303b3d930444d11552f7',
      '0x0dA5533d5a9aA08c1792Ef2B6a7444E149cCB0AD',
      '0xE6abE059E5e929fd17bef158902E73f0FEaCD68c',
    ],
  })

  // TODO(zzmp): Changing defaults has no effect if done after the first render.
  const currencies: Record<string, string> = {
    Native: 'NATIVE',
    DAI: DAI.address,
    USDC_Mainnet: USDC_MAINNET.address,
    USDC_Goerli: '0x07865c6E87B9F70255377e024ace6630C1Eaa37F',
    ATT: '0xFAf5D3E0E1511582E0C4418dE9f609C333F444f8',
    BTT: '0x85d36Ab8F67533806eFA80982d8A0A6BF8188a98',
    CTT: '0x615a28d4367322756400593171CeebA69773303b',
    DTT: '0x0f710556B75091Fb7D54595AE87fBE5d133a197e',
  }
  const defaultInputToken = useOption('defaultInputToken', {
    options: currencies,
    // TODO we need to change the default tokens here (see todo comment above)
    defaultValue: 'CTT',
  })
  const [defaultInputAmount] = useValue('defaultInputAmount', { defaultValue: 1 })
  const defaultOutputToken = useOption('defaultOutputToken', {
    options: currencies,
    // TODO we need to change the default tokens here (see todo comment above)
    defaultValue: 'USDC_Goerli',
  })
  const [defaultOutputAmount] = useValue('defaultOutputAmount', { defaultValue: 0 })

  const [width] = useValue('width', { defaultValue: 360 })

  const locales = [...SUPPORTED_LOCALES, 'fa-KE (unsupported)', 'pseudo']
  const locale = useOption('locale', { options: locales, defaultValue: DEFAULT_LOCALE, nullable: false })

  const [theme, setTheme] = useValue('theme', { defaultValue: { ...defaultTheme } })
  const [darkMode] = useValue('darkMode', { defaultValue: false })
  useEffect(() => setTheme((theme) => ({ ...theme, ...(darkMode ? darkTheme : lightTheme) })), [darkMode, setTheme])

  const jsonRpcEndpoint = useJsonRpcEndpoint()
  const connector = useProvider()

  const friggTokens = [
    {
      name: 'ATT',
      address: '0xFAf5D3E0E1511582E0C4418dE9f609C333F444f8',
      symbol: 'ATT',
      decimals: 18,
      chainId: 5,
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png',
    },
    {
      name: 'BTT',
      address: '0x85d36Ab8F67533806eFA80982d8A0A6BF8188a98',
      symbol: 'BTT',
      decimals: 18,
      chainId: 5,
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png',
    },
    {
      name: 'CTT',
      address: '0x615a28d4367322756400593171CeebA69773303b',
      symbol: 'CTT',
      decimals: 18,
      chainId: 5,
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png',
    },
    {
      name: 'DTT',
      address: '0x0f710556B75091Fb7D54595AE87fBE5d133a197e',
      symbol: 'DTT',
      decimals: 18,
      chainId: 1,
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png',
    },
    // we can keep every token from every network in the list. the list is filtered by chainId during runtime
    {
      name: 'USD Coin',
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      symbol: 'USDC',
      decimals: 6,
      chainId: 1,
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
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
  ]

  const tokenLists: Record<string, TokenInfo[]> = {
    'Mainnet only': tokens.filter((token) => token.chainId === SupportedChainId.MAINNET),
    'Frigg tokens': friggTokens,
  }
  const tokenList = useOption('tokenList', { options: tokenLists, defaultValue: 'Frigg tokens', nullable: false })
  console.log(tokenList)

  const marketTypes: Record<string, MarketType> = {
    buy: 'buy',
    swap: 'swap',
    sell: 'sell',
  }
  const marketType = useOption('marketType', { options: marketTypes, defaultValue: 'buy', nullable: false })

  return (
    <SwapWidget
      convenienceFee={convenienceFee}
      convenienceFeeRecipient={convenienceFeeRecipient}
      defaultInputTokenAddress={defaultInputToken}
      defaultInputAmount={defaultInputAmount}
      defaultOutputTokenAddress={defaultOutputToken}
      defaultOutputAmount={defaultOutputAmount}
      locale={locale}
      jsonRpcEndpoint={jsonRpcEndpoint}
      provider={connector}
      theme={theme}
      tokenList={tokenList}
      width={width}
      onConnectWallet={() => console.log('onConnectWallet')} // this handler is included as a test of functionality, but only logs
      marketType={marketType}
    />
  )
}

export default <Fixture />
