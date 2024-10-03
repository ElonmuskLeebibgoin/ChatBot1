'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import styles from './page.module.css'

// 删除 Components 的导入，因为我们将直接使用 ReactMarkdown.ReactMarkdownOptions

export default function Home() {
  const [messages, setMessages] = useState<Array<{ role: string; content: string; isThinking?: boolean }>>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [activeLink, setActiveLink] = useState('');
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    
    const handleScroll = () => {
      if (typeof window !== 'undefined') {
        const scrollPosition = window.scrollY;
        const sections = document.querySelectorAll('section');
        sections.forEach((section) => {
          const sectionTop = section.offsetTop;
          const sectionHeight = section.clientHeight;
          if (scrollPosition >= sectionTop - 50 && scrollPosition < sectionTop + sectionHeight - 50) {
            setActiveLink(section.id);
          }
        });
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  useEffect(() => {
    if (mounted && activeLink && navRef.current) {
      const activeElement = navRef.current.querySelector(`a[href="#${activeLink}"]`);
      if (activeElement) {
        const slider = navRef.current.querySelector(`.${styles.slider}`) as HTMLElement;
        if (slider) {
          slider.style.width = `${activeElement.clientWidth}px`;
          slider.style.left = `${(activeElement as HTMLElement).offsetLeft}px`;
        }
      }
    }
  }, [activeLink, mounted]);

  async function sendMessage(message: string) {
    setLoading(true);
    const updatedMessages = [
      ...messages, 
      { role: 'user', content: message },
      { role: 'assistant', content: '', isThinking: true }
    ];
    setMessages(updatedMessages);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: updatedMessages.filter(msg => !msg.isThinking) })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      let accumulatedContent = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        accumulatedContent += chunk;

        setMessages(prevMessages => 
          prevMessages.map((msg, index) => 
            index === prevMessages.length - 1 ? { ...msg, content: accumulatedContent, isThinking: false } : msg
          )
        );
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.isThinking ? { role: 'assistant', content: "Sorry, I encountered an error. Please try again." } : msg
        )
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSendMessage() {
    if (inputValue.trim() && !loading) {
      sendMessage(inputValue);
      setInputValue('');
    }
  }

  function formatMessage(content: string) {
    const components = {
      p: ({children}: {children: React.ReactNode}) => <p className={styles.paragraph}>{children}</p>,
      ul: ({children}: {children: React.ReactNode}) => <ul className={styles.list}>{children}</ul>,
      ol: ({children}: {children: React.ReactNode}) => <ol className={styles.list}>{children}</ol>,
      li: ({children}: {children: React.ReactNode}) => <li className={styles.listItem}>{children}</li>,
      a: ({href, children}: {href?: string, children: React.ReactNode}) => <a href={href} className={styles.link}>{children}</a>,
      code: ({node, inline, className, children, ...props}: {
        node?: any,
        inline?: boolean,
        className?: string,
        children: React.ReactNode
      }) => {
        const match = /language-(\w+)/.exec(className || '');
        return !inline && match ? (
          <pre className={styles.codeBlock}>
            <code className={className} {...props}>
              {children}
            </code>
          </pre>
        ) : (
          <code className={styles.inlineCode} {...props}>
            {children}
          </code>
        )
      },
    }

    return (
      <ReactMarkdown components={components}>
        {content}
      </ReactMarkdown>
    );
  }

  if (!mounted) {
    return null; // 或者返回一个加载指示器
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <Image
              src="/Logo矢量图-1.svg"
              alt="小鱼炳AI Logo"
              width={120}
              height={40}
            />
          </div>
          <nav className={styles.nav} ref={navRef}>
            <a href="#about" className={activeLink === 'about' ? styles.active : ''}>关于我们</a>
            <a href="#services" className={activeLink === 'services' ? styles.active : ''}>服务</a>
            <a href="#contact" className={activeLink === 'contact' ? styles.active : ''}>联系我们</a>
            <div className={styles.slider}></div>
          </nav>
        </div>
      </header>
      <main className={styles.main}>
        <div className={styles.hero}>
          <h1>欢迎使用小鱼炳AI</h1>
          <p>智能对话，为您解答各种问题</p>
        </div>
        <div className={styles.chatContainer}>
          <div className={styles.chatHeader}>与AI助手对话</div>
          <div className={styles.chatMessages}>
            {messages.map((msg, index) => (
              <div key={index} className={`${styles.message} ${msg.role === 'user' ? styles.userMessage : styles.aiMessage} ${msg.isThinking ? styles.thinking : ''}`}>
                {msg.role === 'user' ? msg.content : formatMessage(msg.content)}
              </div>
            ))}
          </div>
          <div className={styles.chatInput}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="输入您的问题..."
              className={styles.userInput}
              disabled={loading}
            />
            <button onClick={handleSendMessage} className={styles.sendButton} disabled={loading}>发送</button>
          </div>
        </div>
        <section id="about" className={styles.section}>
          <h2>关于我们</h2>
          {/* 添加关于我们的内容 */}
        </section>
        <section id="services" className={styles.section}>
          <h2>服务</h2>
          {/* 添加服务内容 */}
        </section>
        <section id="contact" className={styles.section}>
          <h2>联系我们</h2>
          <div className={styles.contactInfo}>
            <p><strong>QQ:</strong> 3264411236</p>
            <p><strong>WeChat:</strong> asdfghjkllblnb</p>
            <p><strong>电话:</strong> 17360695729</p>
          </div>
        </section>
      </main>
      <footer className={styles.footer}>
        <p>&copy; 2024 小鱼炳AI. 保留所有权利。</p>
      </footer>
    </div>
  )
}
