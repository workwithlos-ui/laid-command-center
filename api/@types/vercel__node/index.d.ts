// Minimal type shim for @vercel/node — avoids installing the package.
// Vercel resolves the real types at deploy time.
import type { IncomingMessage, ServerResponse } from 'http';

export interface VercelRequest extends IncomingMessage {
  query: { [key: string]: string | string[] };
  cookies: { [key: string]: string };
  body: unknown;
}

export interface VercelResponse extends ServerResponse {
  status(statusCode: number): VercelResponse;
  json(body: unknown): VercelResponse;
  send(body: unknown): VercelResponse;
  redirect(url: string): VercelResponse;
  redirect(statusCode: number, url: string): VercelResponse;
  setHeader(name: string, value: string | string[]): this;
  end(): this;
}
