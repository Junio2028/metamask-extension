import { useCallback, useContext } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { toChecksumAddress } from 'ethereumjs-util';
import { isStrictHexString } from '@metamask/utils';
import {
  formatChainIdToCaip,
  type SwapsTokenObject,
} from '@metamask/bridge-controller';
import {
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  getDataCollectionForMarketing,
  getIsBridgeChain,
  getIsBridgeEnabled,
  getMetaMetricsId,
  getParticipateInMetaMetrics,
  type SwapsEthToken,
  ///: END:ONLY_INCLUDE_IF
} from '../../selectors';
import { MetaMetricsContext } from '../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsSwapsEventSource,
} from '../../../shared/constants/metametrics';

import {
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  CROSS_CHAIN_SWAP_ROUTE,
  PREPARE_SWAP_ROUTE,
  ///: END:ONLY_INCLUDE_IF
} from '../../helpers/constants/routes';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import { getPortfolioUrl } from '../../helpers/utils/portfolio';
import { getProviderConfig } from '../../../shared/modules/selectors/networks';
import { useCrossChainSwapsEventTracker } from './useCrossChainSwapsEventTracker';
///: END:ONLY_INCLUDE_IF

const useBridging = () => {
  const history = useHistory();
  const trackEvent = useContext(MetaMetricsContext);
  const trackCrossChainSwapsEvent = useCrossChainSwapsEventTracker();

  const metaMetricsId = useSelector(getMetaMetricsId);
  const isMetaMetricsEnabled = useSelector(getParticipateInMetaMetrics);
  const isMarketingEnabled = useSelector(getDataCollectionForMarketing);
  const providerConfig = useSelector(getProviderConfig);

  const isBridgeSupported = useSelector(getIsBridgeEnabled);
  const isBridgeChain = useSelector(getIsBridgeChain);

  const openBridgeExperience = useCallback(
    (
      location: string,
      token: SwapsTokenObject | SwapsEthToken,
      portfolioUrlSuffix?: string,
      isSwap = false,
    ) => {
      if (!isBridgeChain || !providerConfig) {
        return;
      }

      if (isBridgeSupported) {
        trackCrossChainSwapsEvent({
          event: MetaMetricsEventName.ActionOpened,
          category: MetaMetricsEventCategory.Navigation,
          properties: {
            location:
              location === 'Home'
                ? MetaMetricsSwapsEventSource.MainView
                : MetaMetricsSwapsEventSource.TokenView,
            chain_id_source: formatChainIdToCaip(providerConfig.chainId),
            token_symbol_source: token.symbol,
            token_address_source: token.address,
          },
        });
        trackEvent({
          event: isSwap
            ? MetaMetricsEventName.SwapLinkClicked
            : MetaMetricsEventName.BridgeLinkClicked,
          category: MetaMetricsEventCategory.Navigation,
          properties: {
            token_symbol: token.symbol,
            location,
            text: isSwap ? 'Swap' : 'Bridge',
            chain_id: providerConfig.chainId,
          },
        });
        let url = `${CROSS_CHAIN_SWAP_ROUTE}${PREPARE_SWAP_ROUTE}`;
        url += `?token=${
          isStrictHexString(token.address)
            ? toChecksumAddress(token.address)
            : token.address
        }`;
        if (isSwap) {
          url += '&swaps=true';
        }
        history.push(url);
      } else {
        const portfolioUrl = getPortfolioUrl(
          'bridge',
          'ext_bridge_button',
          metaMetricsId,
          isMetaMetricsEnabled,
          isMarketingEnabled,
        );
        global.platform.openTab({
          url: `${portfolioUrl}${
            portfolioUrlSuffix ?? `&token=${token.address}`
          }`,
        });
        trackEvent({
          category: MetaMetricsEventCategory.Navigation,
          event: MetaMetricsEventName.BridgeLinkClicked,
          properties: {
            location,
            text: 'Bridge',
            url: portfolioUrl,
            chain_id: providerConfig.chainId,
            token_symbol: token.symbol,
          },
        });
      }
    },
    [
      isBridgeSupported,
      isBridgeChain,
      history,
      metaMetricsId,
      trackEvent,
      trackCrossChainSwapsEvent,
      isMetaMetricsEnabled,
      isMarketingEnabled,
      providerConfig,
    ],
  );

  return { openBridgeExperience };
};

export default useBridging;
