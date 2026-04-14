import axios, { AxiosInstance, AxiosProxyConfig, InternalAxiosRequestConfig } from 'axios';
import { URL } from 'url';

let isVerbose = process.env.VERBOSE === 'true';
export function setVerbose(v: boolean) {
  isVerbose = v;
}

let useProxy = process.env.NO_PROXY !== 'true';
export function setUseProxy(v: boolean) {
  useProxy = v;
}

function getProxyConfig(): AxiosProxyConfig | false {
  if (!useProxy) return false;
  const proxyUrl = process.env.https_proxy || process.env.HTTPS_PROXY || process.env.http_proxy || process.env.HTTP_PROXY;
  if (!proxyUrl) return false;

  try {
    const parsed = new URL(proxyUrl);
    return {
      protocol: parsed.protocol.replace(':', ''),
      host: parsed.hostname,
      port: parsed.port ? parseInt(parsed.port) : (parsed.protocol === 'https:' ? 443 : 80),
      auth: parsed.username ? {
        username: parsed.username,
        password: parsed.password
      } : undefined
    };
  } catch (e) {
    return false;
  }
}

export const createClient = (baseURL: string): AxiosInstance => {
  const instance = axios.create({
    baseURL,
    maxRedirects: 0,
    headers: {
      'User-Agent': 'InboundCLI/1.0.0 (Node.js)'
    }
  });

  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    config.proxy = getProxyConfig();
    if (isVerbose) {
      console.log(`\x1b[36m[DEBUG] Request: ${config.method?.toUpperCase()} ${config.url}\x1b[0m`);
      if (config.proxy) {
        console.log(`\x1b[36m[DEBUG] Using Proxy: ${config.proxy.host}:${config.proxy.port}\x1b[0m`);
      }
      if (config.headers.Authorization) {
        const auth = config.headers.Authorization.toString();
        console.log(`\x1b[36m[DEBUG] Auth Header: ${auth.substring(0, 20)}...\x1b[0m`);
      }
    }
    return config;
  });

  instance.interceptors.response.use(
    response => {
      if (isVerbose) {
        console.log(`\x1b[32m[DEBUG] Response: ${response.status} ${response.config.url}\x1b[0m`);
      }
      return response;
    },
    error => {
      if (isVerbose) {
        if (error.response) {
          console.log(`\x1b[31m[DEBUG] Error Response: ${error.response.status} ${error.config.url}\x1b[0m`);
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
