import axios, { type AxiosRequestConfig } from "axios";
import { context, propagation } from "@opentelemetry/api";
import * as https from "https";

/**
 * Makes an HTTP request using axios
 *
 * @template T - The expected return type
 * @param requestConfig - Axios request configuration
 * @param headersInput - Additional headers to include in the request
 * @returns Promise resolving to the response data cast to type T
 */
export async function call<T>(requestConfig: AxiosRequestConfig, headersInput: Record<string, string> = {}): Promise<T> {
  const headers = { ...requestConfig.headers, ...headersInput };
  const configWithHeaders = { ...requestConfig, headers, validateStatus: (): boolean => true };

  const response = await axios(configWithHeaders);
  return response.data as T;
}
/**
 * Makes an HTTP request with OpenTelemetry tracing headers and custom certificate
 * @template T - The expected type of the response data
 * @param certificate - SSL certificate to use for HTTPS requests
 * @param requestConfig - The axios request configuration
 * @param headersInput - Additional headers to include in the request
 * @returns Promise resolving to the response data cast to type T
 */
export async function callWithTracingHeadersCertificate<T>(
  certificate: Buffer | string,
  requestConfig: AxiosRequestConfig,
  headersInput = {},
): Promise<T> {
  const carrier: Record<string, string> = {};
  propagation.inject(context.active(), carrier);
  const headers = { ...requestConfig.headers, ...headersInput, ...carrier };
  const httpsAgent = new https.Agent({
    ca: certificate,
  });
  const configWithHeaders = { ...requestConfig, headers, httpsAgent, validateStatus: (): boolean => true };
  const response = await axios(configWithHeaders);
  return response.data as T;
}

/**
 * Makes an HTTP request with OpenTelemetry tracing headers
 * @template T - The expected type of the response data
 * @param requestConfig - The axios request configuration
 * @param headersInput - Additional headers to include in the request
 * @returns Promise resolving to the response data cast to type T
 */
export async function callWithTracingHeaders<T>(requestConfig: AxiosRequestConfig, headersInput: Record<string, unknown> = {}): Promise<T> {
  const carrier: Record<string, string> = {};
  propagation.inject(context.active(), carrier);
  const headers = { ...requestConfig.headers, ...headersInput, ...carrier };

  const configWithHeaders = { ...requestConfig, headers, validateStatus: (): boolean => true };
  const response = await axios(configWithHeaders);
  return response.data as T;
}
