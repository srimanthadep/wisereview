/// <reference types="vite/client" />

declare module "*.jpg" {
  const content: string;
  export default content;
}

declare module "*.png" {
  const content: string;
  export default content;
}

// Google Maps JS API is loaded dynamically via a <script> tag in Onboarding.
// Declare it on the window so TypeScript is aware of the runtime global.
declare global {
  interface Window {
    google?: any;
  }
}

export {};
