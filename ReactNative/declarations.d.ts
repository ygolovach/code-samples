declare module '*.svg' {
    import React from 'react';
    import { SvgProps } from 'react-native-svg';
    const content: React.FC<SvgProps>;
    export default content;
}
declare module '*.jpg' {
    const content: number;
    export default content;
}
declare module '*.png' {
    const content: number;
    export default content;
}

declare module '@getsafle/safle-vault';

declare module '@getsafle/transaction-controller';

declare module '@getsafle/safle-swaps-v2';

declare module '@getsafle/asset-controller' {
    import Web3 from 'web3';

    export class AssetController {
        chain: 'ethereum' | 'polygon';

        rpcURL: string;

        web3: Web3;

        public detectTokens(params: {
            userAddress: string;
            tokenType: 'erc20' | 'erc721';
        }): Promise<
            {
                balance: string;
                tokenAddress: string;
                symbol: string;
                decimal: number;
                erc20: boolean;
                erc721: boolean;
            }[]
        >;

        public getChains(tokenSymbol: string): Promise<string[]>;

        constructor(props: { rpcURL: string | null; chain: string });
    }
}

declare module '@getsafle/nft-controller' {
    export interface NftDetails {
        id: number;
        token_id: string;
        background_color: string;
        image_url: string;
        image_preview_url: string;
        image_thumbnail_url: string;
        image_original_url: string;
        name: string;
        description: string | null;
        external_link: string;
        asset_contract: {
            address: string;
        };
        collection: {
            name: string;
        };
        permalink: string;
    }

    export class NftController {
        public getNftDetails(
            publicAddress: string,
            contractAddress: string
        ): Promise<{
            response: NftDetails;
        }>;
    }
}
