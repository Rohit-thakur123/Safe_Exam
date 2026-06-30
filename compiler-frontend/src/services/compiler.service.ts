import axios from 'axios';
import { CompilerRequest, CompilerResponse } from '../types/compiler.types';

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api/compiler';

export async function runCode(request: CompilerRequest): Promise<CompilerResponse> {
  const response = await axios.post<CompilerResponse>(`${baseUrl}/run`, request, {
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
}
