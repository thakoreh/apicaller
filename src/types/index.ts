export interface CurlCommand {
  method: string;
  label: string;
  color: string;
  curl: string;
}

export interface ParsedUrl {
  protocol: string;
  host: string;
  pathname: string;
  search: string;
  isValid: boolean;
}
