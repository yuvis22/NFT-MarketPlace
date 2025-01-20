/** @format */

import { useState } from 'react';
import { CHAINS, MORALIS_API_KEY } from '../utils/constants';
import { MetaMaskInpageProvider } from '@metamask/providers';

export default function Home() {
	const [nfts, setNfts] = useState([]);
	const [progress, setProgress] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
	const [isConnected, setIsConnected] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [address, setAddress] = useState<string | null>(null);

	const connectWallet = async () => {
		try {
			if (!window.ethereum) {
				alert(
					'MetaMask is not installed. Please install it to use this feature!'
				);
				return;
			}
			const ethereum = window.ethereum as MetaMaskInpageProvider;
			const accounts = await ethereum.request({
				method: 'eth_requestAccounts',
			});
			const walletAddress = accounts[0];
			setAddress(walletAddress);
			setIsConnected(true);

			setIsLoading(true);
			setError(null);

			const allNfts = [];
			let fetchedChains = 0;
			let totalChains = CHAINS.length;

			for (let chain of CHAINS) {
				const response = await fetch(
					`https://deep-index.moralis.io/api/v2/${walletAddress}/nft?chain=${chain}&format=decimal`,
					{
						headers: {
							'X-API-Key': MORALIS_API_KEY,
						},
					}
				);

				if (response.ok) {
					const data = await response.json();
					allNfts.push(...data.result);
				} else {
					setError(
						`Failed to fetch NFTs from ${chain}: ${response.statusText}`
					);
					break;
				}

				fetchedChains++;
				setProgress(Math.floor((fetchedChains / totalChains) * 100));
			}

			if (!error) {
				setNfts(allNfts);
			}
			setIsLoading(false);
		} catch (error) {
			setError('An error occurred while fetching the NFTs. Please try again.');
			setIsLoading(false);
		}
	};

	return (
		<div className='min-h-screen bg-black text-white'>
			<div className='relative'>
				<div className='absolute inset-0 bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500 animate-gradient'></div>
				<div className='relative z-10 p-8'>
					<h1 className='text-5xl font-extrabold text-center mb-10'>
						NFT Universe
					</h1>
					{!isConnected ? (
						<div className='flex justify-center'>
							<button
								className='px-8 py-4 bg-white text-black text-lg font-semibold rounded-full hover:bg-gray-200 transform hover:scale-105 transition-transform'
								onClick={connectWallet}>
								Connect Wallet
							</button>
						</div>
					) : (
						<div>
							<p className='text-center mb-6 text-lg'>
								Connected: <span className='text-green-300'>{address}</span>
							</p>
							{isLoading ? (
								<div className='flex flex-col items-center space-y-4'>
									<div className='relative w-16 h-16'>
										<div className='absolute inset-0 rounded-full border-t-4 border-blue-300 animate-spin'></div>
									</div>
									<p className='text-lg text-gray-300'>Fetching NFTs...</p>
									<div className='w-full bg-gray-200 h-2 rounded-full'>
										<div
											className='bg-blue-500 h-2 rounded-full transition-all'
											style={{ width: `${progress}%` }}></div>
									</div>
								</div>
							) : error ? (
								<p className='text-center text-red-500'>{error}</p>
							) : (
								<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8'>
									{nfts?.map((nft: any, index: number) => (
										<div
											key={index}
											className='p-6 bg-gray-800 text-white rounded-xl shadow-lg hover:shadow-2xl transition-transform transform hover:-translate-y-2'>
											{nft?.metadata && (
												<>
													{(() => {
														try {
															const metadata = JSON.parse(nft?.metadata);
															let mediaUrl = metadata?.image || metadata?.video;

															if (mediaUrl && mediaUrl.startsWith('ipfs://')) {
																mediaUrl = `https://ipfs.io/ipfs/${
																	mediaUrl.split('ipfs://')[1]
																}`;
															}

															const fallbackMediaUrl =
																mediaUrl || 'https://picsum.photos/200/300';

															const isVideo =
																mediaUrl &&
																(mediaUrl.endsWith('.mp4') ||
																	mediaUrl.endsWith('.webm') ||
																	mediaUrl.endsWith('.ogg'));

															return (
																<>
																	{isVideo ? (
																		<video
																			controls
																			className='w-full h-48 rounded-lg object-cover'
																			src={fallbackMediaUrl}
																		/>
																	) : (
																		<img
																			src={fallbackMediaUrl}
																			alt={metadata?.name || 'NFT'}
																			className='w-full h-48 rounded-lg object-cover'
																		/>
																	)}
																	<h2 className='text-2xl font-semibold mt-4'>
																		{metadata?.name || 'Unnamed NFT'}
																	</h2>
																	<p className='mt-2 text-gray-400 text-sm'>
																		{metadata?.description ||
																			'No description available'}
																	</p>
																</>
															);
														} catch (error) {
															// In case of JSON parsing or any other error, use a random image
															return (
																<>
																	<img
																		src='https://picsum.photos/200/300'
																		alt='Fallback NFT'
																		className='w-full h-48 rounded-lg object-cover'
																	/>
																	<p>Error loading NFT metadata</p>
																</>
															);
														}
													})()}
												</>
											)}

											<div className='mt-4'>
												<p>
													<strong>Token ID:</strong> {nft.token_id}
												</p>
												<p>
													<strong>Owner:</strong>{' '}
													<span className='text-green-400'>
														{nft.owner_of.slice(0, 6)}...
														{nft.owner_of.slice(-4)}
													</span>
												</p>
											</div>

											<button className='mt-6 w-full bg-blue-600 py-2 rounded-lg text-white font-medium hover:bg-blue-700 transform transition-transform'>
												View Details
											</button>
										</div>
									))}
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
