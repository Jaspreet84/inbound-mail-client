import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { URL } from 'url';
import { HttpProxyAgent, HttpsProxyAgent } from 'hpagent';

let isVerbose = process.env.VERBOSE === 'true';
export function setVerbose(v: boolean) {
  isVerbose = v;
}

let useProxy = process.env.NO_PROXY !== 'true';
export function setUseProxy(v: boolean) {
  useProxy = v;
}

function getProxyUrl(): string | undefined {
  if (!useProxy) return undefined;
  return process.env.https_proxy || process.env.HTTPS_PROXY || process.env.http_proxy || process.env.HTTP_PROXY;
}

export const createClient = (baseURL: string): AxiosInstance => {
  const proxyUrl = getProxyUrl();
  
  // Use hpagent for robust CONNECT tunneling
  const httpAgent = proxyUrl ? new HttpProxyAgent({ proxy: proxyUrl, keepAlive: true }) : undefined;
  const httpsAgent = proxyUrl ? new HttpsProxyAgent({ proxy: proxyUrl, keepAlive: true }) : undefined;

  const instance = axios.create({
    baseURL,
    maxRedirects: 0,
    httpAgent,
    httpsAgent,
    proxy: false, // Explicitly disable axios built-in proxy to use the agents
    headers: {
      'User-Agent': 'InboundCLI/1.0.0 (Node.js)'
    }
  });

  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    if (isVerbose) {
      console.log(`\x1b[36m[DEBUG] Request: ${config.method?.toUpperCase()} ${config.url}\x1b[0m`);
      if (proxyUrl) {
        console.log(`\x1b[36m[DEBUG] Using Proxy Agent: ${proxyUrl}\x1b[0m`);
      }
      console.log(`\x1b[36m[DEBUG] Request Headers: ${JSON.stringify(config.headers, null, 2)}\x1b[0m`);
    }
    return config;
  });

  instance.interceptors.response.use(
    response => {
      if (isVerbose) {
        console.log(`\x1b[32m[DEBUG] Response: ${response.status} ${response.config.url}\x1b[0m`);
        console.log(`\x1b[32m[DEBUG] Response Headers: ${JSON.stringify(response.headers, null, 2)}\x1b[0m`);
      }
      return response;
    },
    error => {
      if (isVerbose) {
        if (error.response) {
          console.log(`\x1b[31m[DEBUG] Error Response: ${error.response.status} ${error.config.url}\x1b[0m`);
          console.log(`\x1b[31m[DEBUG] Error Response Headers: ${JSON.stringify(error.response.headers, null, 2)}\x1b[0m`);
          if (error.response.headers.location) {
            console.log(`\x1b[33m[DEBUG] Redirect Location: ${error.response.headers.location}\x1b[0m`);
          }
          console.log(`\x1b[31m[DEBUG] Data: ${JSON.stringify(error.response.data)}\x1b[0m`);
        } else if (error.request) {
          console.log(`\x1b[31m[DEBUG] No Response from: ${error.config.url}\x1b[0m`);
          console.log(`\x1b[31m[DEBUG] Error: ${error.message}\x1b[0m`);
        }
      }
      return Promise.reject(error);
    }
  );

  return instance;
};
