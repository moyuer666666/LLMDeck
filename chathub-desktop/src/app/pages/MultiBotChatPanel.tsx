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

    // Read all files to base64
    const filesData: { base64: string; type: string; name: string }[] = []
    for (const file of files) {
      try {
        const base64 = await readFileAsBase64(file)
        filesData.push({ base64, type: file.type || 'application/octet-stream', name: file.name })
      } catch (err) {
        console.error('Failed to read file:', file.name, err)
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

    // Script to upload all files to the chatbot using the best mechanism
    const buildUploadFilesScript = (filesList: { base64: string; type: string; name: string }[]) => {
      const escapedJson = JSON.stringify(filesList)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
      return `
        (function() {
          try {
            var filesData = ${escapedJson};
            if (!filesData || filesData.length === 0) return 'no-files';

            var dt = new DataTransfer();
            for (var i = 0; i < filesData.length; i++) {
              var data = filesData[i];
              var byteChars = atob(data.base64);
              var byteArray = new Uint8Array(byteChars.length);
              for (var j = 0; j < byteChars.length; j++) {
                byteArray[j] = byteChars.charCodeAt(j);
              }
              var blob = new Blob([byteArray], { type: data.type });
              var file = new File([blob], data.name, { type: data.type, lastModified: Date.now() });
              dt.items.add(file);
            }

            if (dt.files.length === 0) return 'no-files-created';

            // Find input element
            var inputSelectors = [
              '#prompt-textarea',
              'div[contenteditable="true"][role="textbox"]',
              'p[contenteditable="true"]',
              '[contenteditable="true"]',
              '[role="textbox"]',
              'textarea',
              'input[type="text"]'
            ];
            var el = null;
            for (var k = 0; k < inputSelectors.length; k++) {
              var found = document.querySelector(inputSelectors[k]);
              if (found && found.offsetHeight > 0) { el = found; break; }
            }

            var result = [];

            // Helper to find file input closest to the active input
            function findFileInput() {
              if (el) {
                var container = el.closest('form') || el.closest('.chat-container') || el.parentElement;
                for (var j = 0; j < 5 && container; j++) {
                  var fi = container.querySelector('input[type="file"]');
                  if (fi) return fi;
                  container = container.parentElement;
                }
              }
              var multipleFileInput = document.querySelector('input[type="file"][multiple]');
              if (multipleFileInput) return multipleFileInput;
              return document.querySelector('input[type="file"]');
            }

            var fileInput = findFileInput();
            if (fileInput) {
              fileInput.files = dt.files;
              fileInput.dispatchEvent(new Event('input', { bubbles: true }));
              fileInput.dispatchEvent(new Event('change', { bubbles: true }));
              result.push('file-input-set');
            } else {
              if (el) {
                el.focus();
                var pasteEvent = new ClipboardEvent('paste', {
                  bubbles: true,
                  cancelable: true,
                  clipboardData: dt
                });
                if (pasteEvent.clipboardData !== dt) {
                  Object.defineProperty(pasteEvent, 'clipboardData', {
                    value: dt,
                    writable: false,
                    configurable: true
                  });
                }
                el.dispatchEvent(pasteEvent);
                result.push('paste-dispatched');
              } else {
                result.push('no-input-element');
              }
            }

            return result.join(', ');
          } catch(e) {
            return 'error: ' + e.message;
          }
        })()
      `
    }

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

    // Build script to wait for file upload completion and click send
    const buildSendScript = () => `
      (async function() {
        try {
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
          
          function getSendButton() {
            for (var i = 0; i < btnSelectors.length; i++) {
              try {
                var btn = document.querySelector(btnSelectors[i]);
                if (btn && btn.offsetHeight > 0) return btn;
              } catch(e) {}
            }
            return null;
          }

          // Wait up to 8 seconds (40 iterations * 200ms) for upload to finish
          // Upload is finished when the button is enabled and common upload indicators are gone.
          for (var k = 0; k < 40; k++) {
            var sendBtn = getSendButton();
            
            // Check if there are active upload progress bars/spinners
            var uploading = document.querySelector('[class*="progress" i], [class*="loading" i], [class*="spinner" i]');
            
            if (sendBtn && !sendBtn.disabled && !uploading) {
              break;
            }
            await new Promise(function(resolve) { setTimeout(resolve, 200); });
          }

          var finalSendBtn = getSendButton();
          if (finalSendBtn && !finalSendBtn.disabled) {
            finalSendBtn.click();
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
          
          return 'no-send-found-or-disabled';
        } catch(err) {
          return 'error: ' + err.message;
        }
      })()
    `

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

    // Process each webview simultaneously
    const promises = Array.from(webviews).map(async (webview) => {
      try {
        const wv = webview as any
        
        // Focus the webview element itself in electron layout first
        wv.focus()
        await delay(50)

        // Step 1: Focus the input element inside guest page
        await wv.executeJavaScript(buildFocusScript())
        await delay(100)

        // Step 2: Upload files
        if (filesData.length > 0) {
          const uploadResult = await wv.executeJavaScript(buildUploadFilesScript(filesData))
          console.log('Upload files result:', uploadResult)
          // Give it a short moment to start the upload lifecycle
          await delay(200)
        }

        // Step 3: Insert text into the input
        if (text) {
          const insertResult = await wv.executeJavaScript(buildInsertTextScript(text))
          console.log('Insert text result:', insertResult)
          await delay(200)
        }

        // Step 4: Wait for upload completion and click Send
        const sendResult = await wv.executeJavaScript(buildSendScript())
        console.log('Send result:', sendResult)
        await delay(200)
      } catch (err) {
        console.error('Failed to broadcast to webview:', err)
      }
    })

    await Promise.all(promises)
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
