import { useNavigate } from '@tanstack/react-router'
import { useAtom, useAtomValue } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { FC, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FiPlus } from 'react-icons/fi'
import toast, { Toaster } from 'react-hot-toast'
import { cx, getFaviconUrl } from '~/utils'
import SyncInputBox from '~app/components/Chat/SyncInputBox'
import Dialog from '~app/components/Dialog'
import { Layout } from '~app/consts'
import { useEnabledBots } from '~app/hooks/use-enabled-bots'
import { getUserConfig } from '~services/user-config'
import { BotId } from '../bots'
import ConversationPanel from '../components/Chat/ConversationPanel'

const layoutAtom = atomWithStorage<Layout>('multiPanelLayout', 2, undefined, { getOnInit: true })
const twoPanelBotsAtom = atomWithStorage<BotId[]>('multiPanelBots:2', ['gemini', 'claude'])
const threePanelBotsAtom = atomWithStorage<BotId[]>('multiPanelBots:3', ['gemini', 'claude', 'chatgpt'])
const fourPanelBotsAtom = atomWithStorage<BotId[]>('multiPanelBots:4', ['gemini', 'claude', 'chatgpt'])
const sixPanelBotsAtom = atomWithStorage<BotId[]>('multiPanelBots:6', ['gemini', 'claude', 'chatgpt'])
const imageInputBotsAtom = atomWithStorage<BotId[]>('multiPanelBots:imageInput', [])
const imageInputBotsInitializedAtom = atomWithStorage<boolean>('multiPanelBots:imageInput:initialized', false)

const useActiveBots = (bots: string[], count?: number) => {
  const chatbots = useEnabledBots()
  const chatbotIds = useMemo(() => chatbots.map((b) => b.id), [chatbots])

  return useMemo(() => {
    if (chatbotIds.length === 0) return []
    const targetCount = count ?? chatbotIds.length
    let result = bots.filter((id) => chatbotIds.includes(id))
    if (result.length < targetCount) {
      const remaining = chatbotIds.filter((id) => !result.includes(id))
      result = [...result, ...remaining].slice(0, targetCount)
    }
    while (count !== undefined && result.length < targetCount && chatbotIds.length > 0) {
      result.push(chatbotIds[0])
    }
    return result
  }, [bots, chatbotIds, count])
}

const AddSessionButton: FC<{
  chatbots: Array<{ id: BotId; name: string; url: string }>
  onAdd: (botId: BotId) => void
}> = ({ chatbots, onAdd }) => {
  const [open, setOpen] = useState(false)

  return (
    <div className="h-full min-h-[160px]">
      <button
        type="button"
        className="w-full h-full rounded-2xl border border-dashed border-primary-border bg-primary-background text-light-text hover:text-primary-text hover:bg-secondary transition-colors flex flex-col items-center justify-center gap-2"
        onClick={() => setOpen(true)}
      >
        <FiPlus className="w-6 h-6" />
        <span className="text-sm font-medium">添加会话</span>
      </button>
      <Dialog title="添加会话" open={open} onClose={() => setOpen(false)} className="w-[320px]">
        <div className="py-2 max-h-[360px] overflow-y-auto">
          {chatbots.map((bot) => (
            <button
              type="button"
              key={bot.id}
              className="w-full px-5 py-3 text-secondary-text hover:text-white hover:bg-primary-blue cursor-pointer flex flex-row items-center gap-3"
              onClick={() => {
                onAdd(bot.id)
                setOpen(false)
              }}
            >
              <div className="w-4 h-4">
                <img src={getFaviconUrl(bot.url)} className="w-4 h-4 rounded-sm" />
              </div>
              <p className="text-sm whitespace-nowrap">{bot.name}</p>
            </button>
          ))}
        </div>
      </Dialog>
    </div>
  )
}

const GeneralChatPanel: FC<{
  botIds: BotId[]
  setBots?: (value: BotId[] | ((bots: BotId[]) => BotId[])) => void
  supportImageInput?: boolean
}> = ({ botIds, setBots, supportImageInput }) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useAtom(layoutAtom)
  const [isInputBarOpen, setIsInputBarOpen] = useState(true)
  const [focusedBotId, setFocusedBotId] = useState<BotId | null>(null)
  const [isOverviewOpen, setIsOverviewOpen] = useState(false)
  const [draggingBotId, setDraggingBotId] = useState<BotId | null>(null)
  const [dragOverBotId, setDragOverBotId] = useState<BotId | null>(null)
  const isScrollableBotLayout = supportImageInput === true
  const canMoveBots = isScrollableBotLayout && !!setBots && botIds.length > 1
  const chatbots = useEnabledBots()

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

  useEffect(() => {
    if (focusedBotId && (!isScrollableBotLayout || !botIds.includes(focusedBotId))) {
      setFocusedBotId(null)
    }
  }, [botIds, focusedBotId, isScrollableBotLayout])

  useEffect(() => {
    if (!isScrollableBotLayout && isOverviewOpen) {
      setIsOverviewOpen(false)
    }
  }, [isOverviewOpen, isScrollableBotLayout])

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

  const moveBot = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (!setBots || fromIndex === toIndex || toIndex < 0 || toIndex >= botIds.length) {
        return
      }
      const nextBots = [...botIds]
      const [movedBot] = nextBots.splice(fromIndex, 1)
      nextBots.splice(toIndex, 0, movedBot)
      setBots(nextBots)
    },
    [botIds, setBots],
  )

  const removeBot = useCallback(
    (botId: BotId) => {
      if (!setBots) {
        return
      }
      setBots(botIds.filter((id) => id !== botId))
      if (focusedBotId === botId) {
        setFocusedBotId(null)
      }
      toast.success('已删除会话')
    },
    [botIds, focusedBotId, setBots],
  )

  const addBot = useCallback(
    (botId: BotId) => {
      if (!setBots) {
        return
      }
      const botName = chatbots.find((bot) => bot.id === botId)?.name || botId
      if (botIds.includes(botId)) {
        toast.error(`${botName} 已经在会话中`)
        return
      }
      setBots([...botIds, botId])
      setIsOverviewOpen(true)
      toast.success(`已添加 ${botName}`)
    },
    [botIds, chatbots, setBots],
  )

  const toggleOverview = useCallback(() => {
    setFocusedBotId(null)
    setDraggingBotId(null)
    setDragOverBotId(null)
    setIsOverviewOpen((current) => !current)
  }, [])

  const setSessionDragPreview = useCallback(
    (event: React.DragEvent<HTMLDivElement>, botId: BotId) => {
      const botName = chatbots.find((bot) => bot.id === botId)?.name || botId
      const preview = document.createElement('div')
      preview.textContent = botName
      preview.style.position = 'fixed'
      preview.style.top = '-1000px'
      preview.style.left = '-1000px'
      preview.style.padding = '10px 14px'
      preview.style.borderRadius = '12px'
      preview.style.background = 'rgba(255, 255, 255, 0.96)'
      preview.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.18)'
      preview.style.color = '#303030'
      preview.style.fontSize = '14px'
      preview.style.fontWeight = '600'
      preview.style.pointerEvents = 'none'
      document.body.appendChild(preview)
      event.dataTransfer.setDragImage(preview, 40, 20)
      window.setTimeout(() => preview.remove(), 0)
    },
    [chatbots],
  )

  const getBroadcastWebviews = useCallback(() => {
    return rootRef.current?.querySelectorAll('webview[data-llmdeck-broadcast="true"]') || []
  }, [])

  const handleNewChat = useCallback(async () => {
    const webviews = getBroadcastWebviews()
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
  }, [getBroadcastWebviews])

  const handleSend = useCallback(async (text: string, files: File[]) => {
    const webviews = getBroadcastWebviews()
    if (webviews.length === 0) return

    const buildTextOnlySendScript = (prompt: string) => {
      const serializedPrompt = JSON.stringify(prompt)
      return `
        (async function() {
          try {
            var text = ${serializedPrompt};
            var inputSelectors = [
              '#prompt-textarea',
              'textarea[placeholder*="message"]',
              'textarea[placeholder*="Message"]',
              'textarea[placeholder*="chat"]',
              'textarea[placeholder*="Chat"]',
              'textarea[placeholder*="Ask"]',
              'div[contenteditable="true"][role="textbox"]',
              'p[contenteditable="true"]',
              '[contenteditable="true"]',
              '[role="textbox"]',
              'textarea',
              'input[type="text"]'
            ];
            var buttonSelectors = [
              'button[data-testid="send-button"]',
              'button[aria-label*="Send"]',
              'button[aria-label*="send"]',
              'button[aria-label*="Run"]',
              'button[aria-label*="run"]',
              'button[aria-label*="submit"]',
              'button[aria-label*="Submit"]',
              'button[title*="Run"]',
              'button[title*="run"]',
              'form button[type="submit"]',
              'button.send-button',
              'button[class*="send" i]',
              '[role="button"][aria-label*="Run"]',
              '[role="button"][aria-label*="run"]',
              '[data-testid*="send"]'
            ];

            function isVisible(el) {
              return !!(el && (el.offsetHeight > 0 || el.offsetWidth > 0 || el.getClientRects().length > 0));
            }

            function isDisabled(el) {
              return !!(el && (el.disabled || el.getAttribute('aria-disabled') === 'true'));
            }

            function findFirst(root, selectors) {
              for (var i = 0; i < selectors.length; i++) {
                try {
                  var el = root.querySelector(selectors[i]);
                  if (isVisible(el)) return el;
                } catch(e) {}
              }
              return null;
            }

            function getButtonLabel(el) {
              return [
                el.getAttribute('aria-label'),
                el.getAttribute('title'),
                el.innerText,
                el.textContent
              ].filter(Boolean).join(' ').replace(/\\s+/g, ' ').trim().toLowerCase();
            }

            function isSendLikeButton(el) {
              var label = getButtonLabel(el);
              return /(^|\\s)(send|submit|run)(\\s|$)/.test(label) || label.indexOf('run ctrl') !== -1;
            }

            function findButtonByLabel(root) {
              var candidates = root.querySelectorAll('button, [role="button"]');
              for (var i = 0; i < candidates.length; i++) {
                if (isVisible(candidates[i]) && isSendLikeButton(candidates[i])) {
                  return candidates[i];
                }
              }
              return null;
            }

            function findSubmitButton(root) {
              return findFirst(root, buttonSelectors) || findButtonByLabel(root);
            }

            function pressEnter(el, useCtrl) {
              el.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'Enter', code: 'Enter', keyCode: 13, which: 13,
                ctrlKey: !!useCtrl, bubbles: true, cancelable: true
              }));
              el.dispatchEvent(new KeyboardEvent('keyup', {
                key: 'Enter', code: 'Enter', keyCode: 13, which: 13,
                ctrlKey: !!useCtrl, bubbles: true, cancelable: true
              }));
            }

            function dispatchInput(el) {
              try {
                el.dispatchEvent(new InputEvent('input', {
                  bubbles: true,
                  inputType: 'insertText',
                  data: text
                }));
              } catch(e) {
                el.dispatchEvent(new Event('input', { bubbles: true }));
              }
              el.dispatchEvent(new Event('change', { bubbles: true }));
            }

            var input = findFirst(document, inputSelectors);
            if (!input) return 'no-input-found';

            input.focus();
            if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT') {
              var proto = input.tagName === 'INPUT' ? window.HTMLInputElement.prototype : window.HTMLTextAreaElement.prototype;
              var nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value');
              if (nativeSetter && nativeSetter.set) {
                nativeSetter.set.call(input, text);
              } else {
                input.value = text;
              }
              dispatchInput(input);
            } else {
              input.textContent = '';
              document.execCommand('insertText', false, text);
              dispatchInput(input);
            }

            await new Promise(function(resolve) {
              var settled = false;
              function finish() {
                if (!settled) {
                  settled = true;
                  resolve(undefined);
                }
              }
              if (typeof requestAnimationFrame === 'function') {
                requestAnimationFrame(function() {
                  requestAnimationFrame(finish);
                });
              }
              setTimeout(finish, 50);
            });

            var form = input.closest('form');
            var button = form ? findSubmitButton(form) : null;
            if (!button) {
              button = findSubmitButton(document);
            }

            if (button && !isDisabled(button)) {
              button.click();
              return 'clicked-send';
            }

            var useCtrlEnter = window.location.hostname === 'aistudio.google.com';
            pressEnter(input, useCtrlEnter);
            return useCtrlEnter ? 'pressed-ctrl-enter' : 'pressed-enter';
          } catch(err) {
            return 'error: ' + err.message;
          }
        })()
      `
    }

    if (files.length === 0 && text.trim()) {
      await Promise.all(
        Array.from(webviews).map(async (webview) => {
          try {
            const wv = webview as any
            wv.focus()
            const result = await wv.executeJavaScript(buildTextOnlySendScript(text))
            console.log('Quick send result:', result)
          } catch (err) {
            console.error('Failed to broadcast to webview:', err)
          }
        }),
      )
      return
    }

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
            'button[aria-label*="Run"]',
            'button[aria-label*="run"]',
            'button[aria-label*="发送"]',
            'button[aria-label*="submit"]',
            'button[aria-label*="Submit"]',
            'button[title*="Run"]',
            'button[title*="run"]',
            'form button[type="submit"]',
            'button.send-button',
            'button[class*="send" i]',
            '[role="button"][aria-label*="Run"]',
            '[role="button"][aria-label*="run"]',
            '[data-testid*="send"]'
          ];

          function isVisible(el) {
            return !!(el && (el.offsetHeight > 0 || el.offsetWidth > 0 || el.getClientRects().length > 0));
          }

          function isDisabled(el) {
            return !!(el && (el.disabled || el.getAttribute('aria-disabled') === 'true'));
          }

          function getButtonLabel(el) {
            return [
              el.getAttribute('aria-label'),
              el.getAttribute('title'),
              el.innerText,
              el.textContent
            ].filter(Boolean).join(' ').replace(/\\s+/g, ' ').trim().toLowerCase();
          }

          function isSendLikeButton(el) {
            var label = getButtonLabel(el);
            return /(^|\\s)(send|submit|run)(\\s|$)/.test(label) || label.indexOf('run ctrl') !== -1;
          }
          
          function getSendButton() {
            for (var i = 0; i < btnSelectors.length; i++) {
              try {
                var btn = document.querySelector(btnSelectors[i]);
                if (isVisible(btn)) return btn;
              } catch(e) {}
            }
            var candidates = document.querySelectorAll('button, [role="button"]');
            for (var j = 0; j < candidates.length; j++) {
              if (isVisible(candidates[j]) && isSendLikeButton(candidates[j])) {
                return candidates[j];
              }
            }
            return null;
          }

          function pressEnter(el, useCtrl) {
            var enterEvent = new KeyboardEvent('keydown', {
              key: 'Enter', code: 'Enter', keyCode: 13, which: 13,
              ctrlKey: !!useCtrl, bubbles: true, cancelable: true
            });
            el.dispatchEvent(enterEvent);
            var enterUp = new KeyboardEvent('keyup', {
              key: 'Enter', code: 'Enter', keyCode: 13, which: 13,
              ctrlKey: !!useCtrl, bubbles: true, cancelable: true
            });
            el.dispatchEvent(enterUp);
          }

          // Wait up to 8 seconds (40 iterations * 200ms) for upload to finish
          // Upload is finished when the button is enabled and common upload indicators are gone.
          for (var k = 0; k < 40; k++) {
            var sendBtn = getSendButton();
            
            // Check if there are active upload progress bars/spinners
            var uploading = document.querySelector('[class*="progress" i], [class*="loading" i], [class*="spinner" i]');
            
            if (sendBtn && !isDisabled(sendBtn) && !uploading) {
              break;
            }
            await new Promise(function(resolve) { setTimeout(resolve, 200); });
          }

          var finalSendBtn = getSendButton();
          if (finalSendBtn && !isDisabled(finalSendBtn)) {
            finalSendBtn.click();
            return 'clicked-send';
          }
          
          if (document.activeElement) {
            var useCtrlEnter = window.location.hostname === 'aistudio.google.com';
            pressEnter(document.activeElement, useCtrlEnter);
            return useCtrlEnter ? 'pressed-ctrl-enter' : 'pressed-enter';
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
  }, [getBroadcastWebviews])

  const showSessionOverview = isOverviewOpen || botIds.length === 0

  return (
    <div ref={rootRef} className="flex flex-col overflow-hidden h-full">
      {isScrollableBotLayout ? (
        <div className="flex grow min-h-0 flex-col gap-2">
          <div
            className={cx(
              'relative grow min-h-0 gap-3 pb-2 pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#00000026] dark:scrollbar-thumb-[#ffffff33]',
              showSessionOverview
                ? 'grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] auto-rows-[minmax(220px,1fr)] overflow-auto'
                : 'flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth',
            )}
          >
            {botIds.map((botId, index) => {
              const panelBasis = botIds.length > 1 ? 'calc((100% - 0.75rem) / 2)' : '100%'
              const isFocused = focusedBotId === botId
              const isHiddenForFocus = !showSessionOverview && !!focusedBotId && !isFocused
              const canMoveInOverview = showSessionOverview && canMoveBots
              return (
                <div
                  key={botId}
                  className={cx(
                    'h-full min-w-0 snap-start transition-opacity',
                    isHiddenForFocus ? 'absolute top-0 opacity-0 pointer-events-none' : 'relative',
                    canMoveInOverview && 'cursor-move',
                    draggingBotId === botId && 'opacity-60',
                    dragOverBotId === botId &&
                      draggingBotId !== botId &&
                      'rounded-2xl ring-2 ring-primary-blue ring-offset-2 ring-offset-transparent',
                  )}
                  draggable={canMoveInOverview}
                  style={
                    isHiddenForFocus
                      ? { width: panelBasis, height: '100%', left: '-10000px' }
                      : showSessionOverview
                        ? undefined
                        : { flex: `0 0 ${focusedBotId ? '100%' : panelBasis}` }
                  }
                  onDragStart={
                    canMoveInOverview
                      ? (event) => {
                          event.dataTransfer.effectAllowed = 'move'
                          event.dataTransfer.setData('text/plain', botId)
                          setSessionDragPreview(event, botId)
                          setDraggingBotId(botId)
                          setDragOverBotId(null)
                        }
                      : undefined
                  }
                  onDragOver={
                    canMoveInOverview
                      ? (event) => {
                          event.preventDefault()
                          event.dataTransfer.dropEffect = 'move'
                          if (draggingBotId && draggingBotId !== botId) {
                            setDragOverBotId(botId)
                          }
                        }
                      : undefined
                  }
                  onDragLeave={
                    canMoveInOverview
                      ? (event) => {
                          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                            setDragOverBotId((current) => (current === botId ? null : current))
                          }
                        }
                      : undefined
                  }
                  onDrop={
                    canMoveInOverview
                      ? (event) => {
                          event.preventDefault()
                          const sourceBotId = event.dataTransfer.getData('text/plain') || draggingBotId
                          const sourceIndex = botIds.findIndex((id) => id === sourceBotId)
                          if (sourceIndex >= 0) {
                            moveBot(sourceIndex, index)
                          }
                          setDraggingBotId(null)
                          setDragOverBotId(null)
                        }
                      : undefined
                  }
                  onDragEnd={
                    canMoveInOverview
                      ? () => {
                          setDraggingBotId(null)
                          setDragOverBotId(null)
                        }
                      : undefined
                  }
                >
                  <ConversationPanel
                    botId={botId}
                    mode="compact"
                    focused={isFocused}
                    overview={showSessionOverview}
                    activeForBroadcast={!focusedBotId || isFocused}
                    onOverviewToggle={toggleOverview}
                    canMoveLeft={index > 0}
                    canMoveRight={index < botIds.length - 1}
                    onMoveLeft={canMoveInOverview ? () => moveBot(index, index - 1) : undefined}
                    onMoveRight={canMoveInOverview ? () => moveBot(index, index + 1) : undefined}
                    onRemove={showSessionOverview ? () => removeBot(botId) : undefined}
                    onFocusToggle={
                      () => {
                        setIsOverviewOpen(false)
                        setFocusedBotId((current) => (current === botId ? null : botId))
                      }
                    }
                  />
                </div>
              )
            })}
            {showSessionOverview && <AddSessionButton chatbots={chatbots} onAdd={addBot} />}
          </div>
        </div>
      ) : (
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
      )}
      {isInputBarOpen && (
        <SyncInputBox
          layout={layout}
          onLayoutChange={onLayoutChange}
          onSend={handleSend}
          onNewChat={handleNewChat}
        />
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
  const [bots, setBots] = useAtom(imageInputBotsAtom)
  const [initialized, setInitialized] = useAtom(imageInputBotsInitializedAtom)
  const chatbots = useEnabledBots()
  const chatbotIds = useMemo(() => chatbots.map((bot) => bot.id), [chatbots])
  const hasSavedImageInputBots = initialized || bots.length > 0
  const activeBots = useMemo(() => {
    if (!hasSavedImageInputBots) {
      return chatbotIds
    }
    return bots.filter((id) => chatbotIds.includes(id))
  }, [bots, chatbotIds, hasSavedImageInputBots])
  const setImageInputBots = useCallback(
    (value: BotId[] | ((bots: BotId[]) => BotId[])) => {
      setInitialized(true)
      setBots(value)
    },
    [setBots, setInitialized],
  )
  return <GeneralChatPanel botIds={activeBots} setBots={setImageInputBots} supportImageInput={true} />
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

const MultiBotChatPanelPage: FC<{
  skipStartupRedirect?: boolean
}> = ({ skipStartupRedirect }) => {
  const navigate = useNavigate()
  const [startupRouteReady, setStartupRouteReady] = useState(skipStartupRedirect || hasRedirectedOnStartup)

  useEffect(() => {
    let cancelled = false

    if (skipStartupRedirect) {
      setStartupRouteReady(true)
      return
    }

    if (hasRedirectedOnStartup) {
      setStartupRouteReady(true)
      return
    }

    hasRedirectedOnStartup = true
    getUserConfig()
      .then((config) => {
        if (cancelled) {
          return
        }

        if (config.startupPage && config.startupPage !== 'all' && config.chatbots.some((b) => b.id === config.startupPage)) {
          void navigate({
            to: '/chat/$botId',
            params: { botId: config.startupPage },
            replace: true,
          }).catch(() => {
            if (!cancelled) {
              setStartupRouteReady(true)
            }
          })
          return
        }

        setStartupRouteReady(true)
      })
      .catch((err) => {
        console.error('Failed to resolve startup route:', err)
        if (!cancelled) {
          setStartupRouteReady(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [navigate, skipStartupRedirect])

  if (!startupRouteReady) {
    return null
  }

  return (
    <>
      <Suspense>
        <MultiBotChatPanel />
      </Suspense>
      <Toaster />
    </>
  )
}

export default MultiBotChatPanelPage
