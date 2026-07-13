interface WxLoginOptions {
  self_redirect?: boolean;
  id: string;
  appid: string;
  scope: string;
  redirect_uri: string;
  state?: string;
  style?: 'black' | 'white';
  href?: string;
}

interface Window {
  WxLogin?: new (options: WxLoginOptions) => void;
}
