import { useNavigate } from '@tanstack/react-router'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { sample } from 'lodash-es'
import { FC, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { cx } from '~/utils'
import SyncInputBox from '~app/components/Chat/SyncInputBox'
import { Layout } from '~app/consts'
import { useEnabledBots } from '~app/hooks/use-enabled-bots'
import { usePremium } from '~app/hooks/use-premium'
import { showPremiumModalAtom } from '~app/state'
import { getUserConfig } from '~services/user-config'
import { BotId } from '../bots'
import ConversationPanel from '../components/Chat/ConversationPanel'

const layoutAtom = atomWithStorage<Layout>('multiPanelLayout', 2, undefined, { getOnInit: true })
const twoPanelBotsAtom = atomWithStorage<BotId[]>('multiPanelBots:2', ['gemini', 'claude'])
const threePanelBotsAtom = atomWithStorage<BotId[]>('multiPanelBots:3', ['gemini', 'claude', 'chatgpt'])
const fourPanelBotsAtom = atomWithStorage<BotId[]>('multiPanelBots:4', ['gemini', 'claude', 'chatgpt'])
const sixPanelBotsAtom = atomWithStorage<BotId[]>('multiPanelBots:6', ['gemini', 'claude', 'chatgpt'])

const useActiveBots = (bots: string[], count: number) => {
  const chatbots = useEnabledBots()
  const chatbotIds = useMemo(() => chatbots.map((b) => b.id), [chatbots])

  return useMemo(() => {
    if (chatbotIds.length === 0) return []
    let result = bots.filter((id) => chatbotIds.includes(id))
    if (result.length < count) {
      const remaining = chatbotIds.filter((id) => !result.includes(id))
      result = [...result, ...remaining].slice(0, count)
    }
    while (result.length < count && chatbotIds.length > 0) {
      result.push(chatbotIds[0])
    }
    return result
  }, [bots, chatbotIds, count])
}

const GeneralChatPanel: FC<{
  botIds: BotId[]
  setBots?: ReturnType<typeof useSetAtom<typeof twoPanelBotsAtom>>
  supportImageInput?: boolean
}> = ({ botIds, setBots, supportImageInput }) => {
  const [layout, setLayout] = useAtom(layoutAtom)
  const [isInputBarOpen, setIsInputBarOpen] = useState(true)

  const setPremiumModalOpen = useSetAtom(showPremiumModalAtom)
  const premiumState = usePremium()
  const disabled = useMemo(() => !premiumState.isLoading && !premiumState.activated, [premiumState])

  useEffect(() => {
    if (disabled && (botIds.length > 2 || supportImageInput)) {
      setPremiumModalOpen('all-in-one-layout')
    }
  }, [botIds.length, disabled, setPremiumModalOpen, supportImageInput])

  // Toggle input bar via Ctrl + ` shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === '`') {
        e.preventDefault()
        setIsInputBarOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const onSwitchBot = useCallback(
    (botId: BotId, index: number) => {
      if (!setBots) {
        return
      }
      setBots((bots) => {
        const newBots = [...bots]
        newBots[index] = botId
        return newBots
      })
    },
    [setBots],
  )

  const onLayoutChange = useCallback(
    (v: Layout) => {
      setLayout(v)
    },
    [setLayout],
  )

  const handleNewChat = useCallback(async () => {
    const webviews = document.querySelectorAll('webview')
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

    for (const webview of Array.from(webviews)) {
      try {
        const wv = webview as any
        // Try to click "new chat" buttons common across AI chat UIs
        const result = await wv.executeJavaScript(`
          (function() {
            var selectors = [
              'button[data-testid="create-new-chat-button"]',
              'a[data-testid="create-new-chat-button"]',
              'nav a[href="/"]',
              'button[aria-label*="New chat"]',
              'button[aria-label*="new chat"]',
              'button[aria-label*="新对话"]',
              'button[aria-label*="新建对话"]',
              'button[aria-label*="新建"]',
              'a[href="/new"]',
              'a[href="/app"]',
              'a[aria-label*="New chat"]',
              'a[aria-label*="新对话"]'
            ];
            for (var i = 0; i < selectors.length; i++) {
              try {
                var el = document.querySelector(selectors[i]);
                if (el && el.offsetHeight > 0) {
                  el.click();
                  return 'clicked: ' + selectors[i];
                }
              } catch(e) {}
            }
            // Fallback: navigate to the origin URL (starts a new conversation)
            window.location.href = window.location.origin;
            return 'navigated-to-origin';
          })()
        `)
        console.log('New chat result:', result)
        await delay(200)
      } catch (err) {
        console.error('Failed to create new chat in webview:', err)
      }
    }
  }, [])

  const handleSend = useCallback(async (text: string, files: File[]) => {
    const webviews = document.querySelectorAll('webview')
    if (webviews.length === 0) return

    // 1. Separate images and text/document files
    const imageFiles = files.filter((f) => f.type.startsWith('image/'))
    const textFiles = files.filter((f) => !f.type.startsWith('image/'))

    // 2. Read text files content and prepend to prompt
    const readTextFile = (file: File): Promise<string> => {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsText(file)
      })
    }

    let finalPrompt = text
    for (const file of textFiles) {
      try {
        const content = await readTextFile(file)
        finalPrompt = `[File: ${file.name}]\n\`\`\`\n${content}\n\`\`\`\n\n${finalPrompt}`
      } catch (err) {
        console.error('Failed to read file:', file.name, err)
      }
    }

    // 3. Read image files as ArrayBuffer for IPC clipboard
    const imageDataList: { buffer: ArrayBuffer; type: string; name: string }[] = []
    for (const imgFile of imageFiles) {
      try {
        const buffer = await imgFile.arrayBuffer()
        imageDataList.push({ buffer, type: imgFile.type, name: imgFile.name })
      } catch (err) {
        console.error('Failed to read image file:', imgFile.name, err)
      }
    }

    // Script to focus the chatbot's input element
    const buildFocusScript = () => `
      (function() {
        var selectors = [
          '#prompt-textarea',
          'textarea[placeholder*="message"]',
          'textarea[placeholder*="Message"]',
          'textarea[placeholder*="chat"]',
          'textarea[placeholder*="Chat"]',
          'textarea[placeholder*="问"]',
          'textarea[placeholder*="聊"]',
          'textarea[placeholder*="输入"]',
          'textarea[placeholder*="Ask"]',
          'div[contenteditable="true"][role="textbox"]',
          'p[contenteditable="true"]',
          '[contenteditable="true"]',
          '[role="textbox"]',
          'textarea',
          'input[type="text"]'
        ];
        for (var i = 0; i < selectors.length; i++) {
          var el = document.querySelector(selectors[i]);
          if (el && el.offsetHeight > 0) {
            el.focus();
            return true;
          }
        }
        return false;
      })()
    `

    // Build script that finds input and inserts text
    const buildInsertTextScript = (prompt: string) => {
      const escaped = prompt
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
      return `
        (function() {
          var text = '${escaped}';
          
          var selectors = [
            '#prompt-textarea',
            'textarea[placeholder*="message"]',
            'textarea[placeholder*="Message"]',
            'textarea[placeholder*="chat"]',
            'textarea[placeholder*="Chat"]',
            'textarea[placeholder*="问"]',
            'textarea[placeholder*="聊"]',
            'textarea[placeholder*="输入"]',
            'textarea[placeholder*="Ask"]',
            'div[contenteditable="true"][role="textbox"]',
            'p[contenteditable="true"]',
            '[contenteditable="true"]',
            '[role="textbox"]',
            'textarea',
            'input[type="text"]'
          ];
          
          var el = null;
          for (var i = 0; i < selectors.length; i++) {
            var found = document.querySelector(selectors[i]);
            if (found && found.offsetHeight > 0) {
              el = found;
              break;
            }
          }
          
          if (!el) return 'no-input-found';
          el.focus();
          
          if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
            var nativeSetter = Object.getOwnPropertyDescriptor(
              window.HTMLTextAreaElement.prototype, 'value'
            );
            if (el.tagName === 'INPUT') {
              nativeSetter = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype, 'value'
              );
            }
            if (nativeSetter && nativeSetter.set) {
              nativeSetter.set.call(el, text);
            } else {
              el.value = text;
            }
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
          } else {
            el.focus();
            el.innerHTML = '';
            document.execCommand('insertText', false, text);
            el.dispatchEvent(new Event('input', { bubbles: true }));
          }
          
          return 'text-inserted';
        })()
      `
    }

    const buildSendScript = () => `
      (function() {
        var btnSelectors = [
          'button[data-testid="send-button"]',
          'button[aria-label*="Send"]',
          'button[aria-label*="send"]',
          'button[aria-label*="发送"]',
          'button[aria-label*="submit"]',
          'button[aria-label*="Submit"]',
          'form button[type="submit"]',
          'button.send-button',
          'button[class*="send" i]',
          '[data-testid*="send"]'
        ];
        
        var sendBtn = null;
        for (var i = 0; i < btnSelectors.length; i++) {
          try {
            var btn = document.querySelector(btnSelectors[i]);
            if (btn && btn.offsetHeight > 0) {
              sendBtn = btn;
              break;
            }
          } catch(e) {}
        }
        
        if (!sendBtn) {
          var activeEl = document.activeElement;
          if (activeEl) {
            var container = activeEl.closest('form') || activeEl.parentElement;
            for (var j = 0; j < 5 && container; j++) {
              var buttons = container.querySelectorAll('button');
              for (var k = 0; k < buttons.length; k++) {
                var b = buttons[k];
                var rect = b.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0 && !b.disabled) {
                  var html = (b.innerHTML || '').toLowerCase();
                  var ariaLabel = (b.getAttribute('aria-label') || '').toLowerCase();
                  if (html.includes('send') || html.includes('发送') || 
                      ariaLabel.includes('send') || ariaLabel.includes('发送') ||
                      b.querySelector('svg')) {
                    sendBtn = b;
                    break;
                  }
                }
              }
              if (sendBtn) break;
              container = container.parentElement;
            }
          }
        }
        
        if (sendBtn && !sendBtn.disabled) {
          sendBtn.click();
          return 'clicked-send';
        }
        
        if (document.activeElement) {
          var enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter', code: 'Enter', keyCode: 13, which: 13,
            bubbles: true, cancelable: true
          });
          document.activeElement.dispatchEvent(enterEvent);
          var enterUp = new KeyboardEvent('keyup', {
            key: 'Enter', code: 'Enter', keyCode: 13, which: 13,
            bubbles: true, cancelable: true
          });
          document.activeElement.dispatchEvent(enterUp);
          return 'pressed-enter';
        }
        
        return 'no-send-found';
      })()
    `

    // Build script to inject an image via synthetic paste event inside the webview
    const buildPasteImageScript = (base64: string, mimeType: string, fileName: string) => `
      (function() {
        try {
          var byteChars = atob('${base64}');
          var byteArray = new Uint8Array(byteChars.length);
          for (var i = 0; i < byteChars.length; i++) {
            byteArray[i] = byteChars.charCodeAt(i);
          }
          var blob = new Blob([byteArray], { type: '${mimeType}' });
          var file = new File([blob], '${fileName}', { type: '${mimeType}', lastModified: Date.now() });

          // Find the input/editable area
          var inputSelectors = [
            '#prompt-textarea',
            'div[contenteditable="true"][role="textbox"]',
            'p[contenteditable="true"]',
            '[contenteditable="true"]',
            '[role="textbox"]',
            'textarea'
          ];
          var el = null;
          for (var j = 0; j < inputSelectors.length; j++) {
            var found = document.querySelector(inputSelectors[j]);
            if (found && found.offsetHeight > 0) { el = found; break; }
          }

          var result = [];

          // Method 1: Synthetic paste event with custom clipboardData
          if (el) {
            el.focus();
            var dt = new DataTransfer();
            dt.items.add(file);
            var pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
            Object.defineProperty(pasteEvent, 'clipboardData', {
              value: {
                files: dt.files,
                items: [{
                  kind: 'file',
                  type: '${mimeType}',
                  getAsFile: function() { return file; }
                }],
                types: ['Files'],
                getData: function() { return ''; }
              }
            });
            el.dispatchEvent(pasteEvent);
            result.push('paste-dispatched');
          }

          // Method 2: Synthetic drop event
          if (el) {
            try {
              var dropDt = new DataTransfer();
              dropDt.items.add(file);
              var dragOverEvent = new DragEvent('dragover', {
                bubbles: true, cancelable: true, dataTransfer: dropDt
              });
              el.dispatchEvent(dragOverEvent);
              var dropEvent = new DragEvent('drop', {
                bubbles: true, cancelable: true, dataTransfer: dropDt
              });
              el.dispatchEvent(dropEvent);
              result.push('drop-dispatched');
            } catch(dropErr) {
              result.push('drop-error: ' + dropErr.message);
            }
          }

          // Method 3: Find file input and set its files programmatically
          var fileInputs = document.querySelectorAll('input[type="file"]');
          for (var k = 0; k < fileInputs.length; k++) {
            try {
              var fi = fileInputs[k];
              var fiDt = new DataTransfer();
              fiDt.items.add(file);
              fi.files = fiDt.files;
              fi.dispatchEvent(new Event('change', { bubbles: true }));
              result.push('file-input-set');
              break;
            } catch(fiErr) {
              result.push('file-input-error: ' + fiErr.message);
            }
          }

          return result.join(', ');
        } catch(e) {
          return 'error: ' + e.message;
        }
      })()
    `

    // Helper: read file as base64
    const readFileAsBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const dataUrl = reader.result as string
          const base64 = dataUrl.split(',')[1]
          resolve(base64)
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
    }

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

    // Process each webview sequentially
    for (const webview of Array.from(webviews)) {
      try {
        const wv = webview as any
        let wcId: number | undefined
        try { wcId = wv.getWebContentsId?.() } catch {}

        // Step 1: Focus the input element
        await wv.executeJavaScript(buildFocusScript())
        await delay(100)

        // Step 2: Upload images
        if (imageDataList.length > 0) {
          for (const imgData of imageDataList) {
            let uploaded = false

            // Method A: Use Electron IPC clipboard + paste (most reliable for native paste)
            if (window.electronAPI && wcId) {
              try {
                const writeResult = await window.electronAPI.clipboardWriteImage(imgData.buffer)
                console.log('Clipboard write result:', writeResult)
                if (writeResult?.success) {
                  await delay(50)
                  // Re-focus input before paste
                  await wv.executeJavaScript(buildFocusScript())
                  await delay(50)
                  const pasteResult = await window.electronAPI.pasteToWebview(wcId)
                  console.log('Paste result:', pasteResult)
                  if (pasteResult?.success) {
                    uploaded = true
                    await delay(500)
                  }
                }
              } catch (ipcErr) {
                console.error('IPC clipboard approach failed:', ipcErr)
              }
            }

            // Method B: Fallback — inject base64 image via executeJavaScript
            if (!uploaded) {
              try {
                const base64 = await readFileAsBase64(new File([imgData.buffer], imgData.name, { type: imgData.type }))
                const result = await wv.executeJavaScript(buildPasteImageScript(base64, imgData.type, imgData.name))
                console.log('JS inject image result:', result)
                await delay(500)
              } catch (jsErr) {
                console.error('JS inject image failed:', jsErr)
              }
            }
          }
        }

        // Step 3: Insert text into the input
        if (finalPrompt) {
          const insertResult = await wv.executeJavaScript(buildInsertTextScript(finalPrompt))
          console.log('Insert result:', insertResult)
          await delay(300)
        }

        // Step 4: Click Send button
        const sendResult = await wv.executeJavaScript(buildSendScript())
        console.log('Send result:', sendResult)
        await delay(200)
      } catch (err) {
        console.error('Failed to broadcast to webview:', err)
      }
    }
  }, [])

  return (
    <div className="flex flex-col overflow-hidden h-full">
      <div
        className={cx(
          'grid overflow-hidden grow auto-rows-fr',
          botIds.length % 3 === 0 ? 'grid-cols-3' : 'grid-cols-2',
          botIds.length > 3 ? 'gap-2' : 'gap-3',
        )}
      >
        {botIds.map((botId, index) => (
          <ConversationPanel
            key={`${botId}-${index}`}
            botId={botId}
            mode="compact"
            onSwitchBot={setBots ? (newBotId) => onSwitchBot(newBotId, index) : undefined}
          />
        ))}
      </div>
      {isInputBarOpen && (
        <SyncInputBox layout={layout} onLayoutChange={onLayoutChange} onSend={handleSend} onNewChat={handleNewChat} />
      )}
    </div>
  )
}

const TwoBotChatPanel = () => {
  const [bots, setBots] = useAtom(twoPanelBotsAtom)
  const activeBots = useActiveBots(bots, 2)
  return <GeneralChatPanel botIds={activeBots} setBots={setBots} />
}

const ThreeBotChatPanel = () => {
  const [bots, setBots] = useAtom(threePanelBotsAtom)
  const activeBots = useActiveBots(bots, 3)
  return <GeneralChatPanel botIds={activeBots} setBots={setBots} />
}

const FourBotChatPanel = () => {
  const [bots, setBots] = useAtom(fourPanelBotsAtom)
  const activeBots = useActiveBots(bots, 4)
  return <GeneralChatPanel botIds={activeBots} setBots={setBots} />
}

const SixBotChatPanel = () => {
  const [bots, setBots] = useAtom(sixPanelBotsAtom)
  const activeBots = useActiveBots(bots, 6)
  return <GeneralChatPanel botIds={activeBots} setBots={setBots} />
}

const ImageInputPanel = () => {
  const chatbots = useEnabledBots()
  const chatbotIds = useMemo(() => chatbots.map((b) => b.id), [chatbots])
  const activeBots = useMemo(() => chatbotIds.slice(0, 3), [chatbotIds])
  return <GeneralChatPanel botIds={activeBots} supportImageInput={true} />
}

const MultiBotChatPanel: FC = () => {
  const layout = useAtomValue(layoutAtom)
  if (layout === 'sixGrid') {
    return <SixBotChatPanel />
  }
  if (layout === 4) {
    return <FourBotChatPanel />
  }
  if (layout === 3) {
    return <ThreeBotChatPanel />
  }
  if (layout === 'imageInput') {
    return <ImageInputPanel />
  }
  return <TwoBotChatPanel />
}

let hasRedirectedOnStartup = false

const MultiBotChatPanelPage: FC = () => {
  const navigate = useNavigate()
  useEffect(() => {
    if (!hasRedirectedOnStartup) {
      hasRedirectedOnStartup = true
      getUserConfig().then((config) => {
        if (config.startupPage && config.startupPage !== 'all' && config.chatbots.some((b) => b.id === config.startupPage)) {
          navigate({
            to: '/chat/$botId',
            params: { botId: config.startupPage },
            replace: true,
          })
        }
      })
    }
  }, [navigate])

  return (
    <Suspense>
      <MultiBotChatPanel />
    </Suspense>
  )
}

export default MultiBotChatPanelPage
