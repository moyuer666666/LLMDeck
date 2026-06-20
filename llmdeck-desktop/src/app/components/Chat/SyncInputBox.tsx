import { FC, useState, useEffect, useMemo, useRef } from 'react'
import { FiEdit, FiPaperclip, FiX, FiFileText } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import LayoutSwitch from './LayoutSwitch'
import { Layout } from '~app/consts'
import { cx } from '~/utils'

interface Props {
  layout: Layout
  onLayoutChange: (layout: Layout) => void
  onSend: (text: string, files: File[]) => void
  onNewChat: () => void
}

function isComposingEvent(event: Event) {
  return 'isComposing' in event && Boolean((event as Event & { isComposing?: boolean }).isComposing)
}

const SyncInputBox: FC<Props> = ({ layout, onLayoutChange, onSend, onNewChat }) => {
  const { t } = useTranslation()
  const [files, setFiles] = useState<File[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const composingRef = useRef(false)
  const inputPlaceholder = t('Use / to select prompts, Shift+Enter to add new line')
  const filePreviews = useMemo(
    () =>
      files.map((file) => ({
        file,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      })),
    [files],
  )

  useEffect(() => {
    return () => {
      filePreviews.forEach(({ previewUrl }) => {
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl)
        }
      })
    }
  }, [filePreviews])

  const handleSend = () => {
    const currentText = textareaRef.current?.value ?? ''
    if (!currentText.trim() && files.length === 0) return
    onSend(currentText, files)
    setFiles([])
    if (textareaRef.current) {
      textareaRef.current.value = ''
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isComposingEvent(e.nativeEvent) || composingRef.current) return
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Handle clipboard paste for images/files
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items
    if (!items) return

    const pastedFiles: File[] = []
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        const file = items[i].getAsFile()
        if (file) pastedFiles.push(file)
      }
    }

    if (pastedFiles.length > 0) {
      setFiles((prev) => [...prev, ...pastedFiles])
      e.preventDefault() // Prevent pasting raw data as text
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      setFiles((prev) => [...prev, ...selectedFiles])
    }
    // Reset file input so re-selecting the same file works
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="flex flex-col w-full bg-transparent p-2 gap-2">
      {/* File Previews Area */}
      {files.length > 0 && (
        <div className="flex flex-row flex-wrap gap-2 px-2 py-1">
          {filePreviews.map(({ file, previewUrl }, idx) => {
            return (
              <div
                key={`${file.name}-${file.lastModified}-${idx}`}
                className="relative flex items-center gap-2 p-1.5 pr-8 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs shadow-sm max-w-[200px]"
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={file.name}
                    className="w-8 h-8 object-cover rounded border border-zinc-100 dark:border-zinc-600"
                  />
                ) : (
                  <FiFileText className="w-6 h-6 text-zinc-400 dark:text-zinc-500 shrink-0" />
                )}
                <span className="truncate text-zinc-600 dark:text-zinc-300 font-sans" title={file.name}>
                  {file.name}
                </span>
                <button
                  onClick={() => removeFile(idx)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1 hover:text-red-500 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-full cursor-pointer transition-colors"
                >
                  <FiX className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Main Input Container */}
      <div className="flex flex-row items-center gap-3 w-full min-w-0">
        {/* Left Side: Layout Switch in rounded white box */}
        <div className="flex bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-1 shrink-0 h-[46px] items-center shadow-sm">
          <LayoutSwitch layout={layout} onChange={onLayoutChange} />
        </div>

        {/* Center & Right: Text input bar */}
        <div className="flex grow min-w-0 flex-row items-center gap-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-2 shadow-sm min-h-[46px]">
          {/* New Chat Button — uses edit/compose icon like ChatGPT/Claude */}
          <button
            onClick={onNewChat}
            className="p-1 hover:text-zinc-600 dark:hover:text-zinc-300 text-zinc-400 rounded-lg cursor-pointer transition-colors shrink-0"
            title={t('New conversation for all AI')}
          >
            <FiEdit className="w-5 h-5" />
          </button>

          {/* Text Area */}
          <div className="relative flex-1 min-w-0 self-center">
            <textarea
              placeholder=" "
              ref={textareaRef}
              rows={1}
              onCompositionStart={() => {
                composingRef.current = true
              }}
              onCompositionEnd={() => {
                composingRef.current = false
              }}
              onBlur={() => {
                composingRef.current = false
              }}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              aria-label={inputPlaceholder}
              className="peer block w-full h-[28px] min-h-[28px] max-h-[28px] bg-transparent border-0 resize-none outline-none text-sm leading-[28px] text-zinc-800 dark:text-zinc-200 font-sans py-0 overflow-y-auto placeholder:text-transparent scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#00000026] dark:scrollbar-thumb-[#ffffff33]"
            />
            <div className="pointer-events-none absolute inset-0 hidden items-center overflow-hidden text-sm leading-5 text-zinc-400 dark:text-zinc-500 font-sans peer-placeholder-shown:flex peer-focus:hidden">
              <span className="truncate">{inputPlaceholder}</span>
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Attachment Paperclip Button */}
          <button
            onClick={triggerFileSelect}
            className="p-1 hover:text-zinc-600 dark:hover:text-zinc-300 text-zinc-400 rounded-lg cursor-pointer transition-colors shrink-0"
            title={t('Attach files or images')}
          >
            <FiPaperclip className="w-5 h-5" />
          </button>

          {/* Send Button */}
          <button
            onClick={handleSend}
            className={cx(
              'px-4 py-1.5 rounded-full text-xs font-semibold select-none transition-all duration-200 cursor-pointer shrink-0',
              'bg-blue-500 hover:bg-blue-600 text-white shadow-sm',
            )}
          >
            {t('Send')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SyncInputBox
