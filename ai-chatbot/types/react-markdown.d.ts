import { ReactNode } from 'react';

declare module 'react-markdown' {
  interface ReactMarkdownProps {
    children: string;
    components?: {
      [key: string]: React.ComponentType<any>;
    };
  }

  export default function ReactMarkdown(props: ReactMarkdownProps): ReactNode;
}