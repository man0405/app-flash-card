declare module "next-pwa" {
	import { NextConfig } from "next";

	interface PWAConfig {
		dest?: string;
		disable?: boolean;
		register?: boolean;
		skipWaiting?: boolean;
		buildExcludes?: RegExp[];
		runtimeCaching?: Array<{
			urlPattern:
				| RegExp
				| ((context: { request: Request; url: URL }) => boolean);
			handler: string;
			options?: {
				cacheName?: string;
				expiration?: {
					maxEntries?: number;
					maxAgeSeconds?: number;
				};
			};
		}>;
	}

	function withPWA(config: PWAConfig): (nextConfig: NextConfig) => NextConfig;
	export default withPWA;
}
